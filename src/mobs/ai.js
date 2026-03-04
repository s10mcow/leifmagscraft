// ============================================================
// MOBS/AI.JS - Mob AI, physics, and per-frame update logic
// ============================================================

import { state } from '../state.js';
import { BLOCKS, ITEMS, BLOCK_SIZE, WORLD_WIDTH, WORLD_HEIGHT, GRAVITY, MAX_FALL_SPEED, NIGHT_THRESHOLD, MOB_DEFS, getItemName } from '../constants.js';
import { isBlockSolid } from '../world.js';
import { hurtPlayer } from '../player.js';
import { addToInventory, addFloatingText } from '../inventory.js';
import { playMobHit, playGruntureRoar, speakPossumGod } from '../audio.js';
import { createParticles } from './effects.js';
import { creeperExplode } from './effects.js';
import { createArrow, createFireball, createBullet } from './projectiles.js';
import { createMob } from './entities.js';

// ============================================================
// MOB PHYSICS
// ============================================================

const SAFE_FALL_BLOCKS = 3;

function mobPhysics(mob, def) {
    // Track fall start for fall damage
    if (mob.onGround) {
        mob.fallStartY = undefined;
    } else if (mob.velY > 0 && mob.fallStartY === undefined) {
        mob.fallStartY = mob.y;
    }

    mob.velY += GRAVITY;
    if (mob.velY > MAX_FALL_SPEED) mob.velY = MAX_FALL_SPEED;

    const mTop = Math.floor(mob.y / BLOCK_SIZE);
    const mBot = Math.floor((mob.y + def.height - 1) / BLOCK_SIZE);

    if (mob.velX < 0) {
        const gx = Math.floor((mob.x + mob.velX) / BLOCK_SIZE);
        for (let gy = mTop; gy <= mBot; gy++) {
            if (isBlockSolid(gx, gy)) {
                mob.x = (gx + 1) * BLOCK_SIZE;
                mob.velX = 0;
                if (mob.onGround && !isBlockSolid(gx, mTop - 1)) {
                    mob.velY = -8;
                    mob.onGround = false;
                }
                break;
            }
        }
    }
    if (mob.velX > 0) {
        const gx = Math.floor((mob.x + mob.velX + def.width - 1) / BLOCK_SIZE);
        for (let gy = mTop; gy <= mBot; gy++) {
            if (isBlockSolid(gx, gy)) {
                mob.x = gx * BLOCK_SIZE - def.width;
                mob.velX = 0;
                if (mob.onGround && !isBlockSolid(gx, mTop - 1)) {
                    mob.velY = -8;
                    mob.onGround = false;
                }
                break;
            }
        }
    }
    mob.x += mob.velX;

    const mLeft = Math.floor(mob.x / BLOCK_SIZE);
    const mRight = Math.floor((mob.x + def.width - 1) / BLOCK_SIZE);
    mob.onGround = false;

    if (mob.velY > 0) {
        const gy = Math.floor((mob.y + mob.velY + def.height - 1) / BLOCK_SIZE);
        for (let gx = mLeft; gx <= mRight; gx++) {
            if (isBlockSolid(gx, gy)) {
                mob.y = gy * BLOCK_SIZE - def.height;
                mob.velY = 0;
                // Fall damage on landing
                if (mob.fallStartY !== undefined) {
                    const fallBlocks = (mob.y - mob.fallStartY) / BLOCK_SIZE;
                    if (fallBlocks > SAFE_FALL_BLOCKS) {
                        mob.health -= Math.floor(fallBlocks - SAFE_FALL_BLOCKS);
                        mob.hurtTimer = 200;
                    }
                    mob.fallStartY = undefined;
                }
                mob.onGround = true;
                break;
            }
        }
    }
    if (mob.velY < 0) {
        const gy = Math.floor((mob.y + mob.velY) / BLOCK_SIZE);
        for (let gx = mLeft; gx <= mRight; gx++) {
            if (isBlockSolid(gx, gy)) { mob.y = (gy + 1) * BLOCK_SIZE; mob.velY = 0; break; }
        }
    }
    mob.y += mob.velY;
}

// Returns the x position of the nearest threat to a passive mob (hostile mob or player)
function nearestThreatX(mob) {
    const mCx = mob.x + MOB_DEFS[mob.type].width / 2;
    const mCy = mob.y + MOB_DEFS[mob.type].height / 2;
    let threatX = state.player.x;
    let threatDist = Math.sqrt(
        Math.pow(state.player.x + state.player.width / 2 - mCx, 2) +
        Math.pow(state.player.y + state.player.height / 2 - mCy, 2)
    );
    for (const other of state.mobs) {
        if (!MOB_DEFS[other.type].hostile) continue;
        const tdx = (other.x + MOB_DEFS[other.type].width / 2) - mCx;
        const tdy = (other.y + MOB_DEFS[other.type].height / 2) - mCy;
        const td = Math.sqrt(tdx * tdx + tdy * tdy);
        if (td < threatDist) { threatX = other.x; threatDist = td; }
    }
    return threatX;
}

function distToPlayer(mob) {
    return Math.sqrt(
        Math.pow(state.player.x + state.player.width / 2 - (mob.x + MOB_DEFS[mob.type].width / 2), 2) +
        Math.pow(state.player.y + state.player.height / 2 - (mob.y + MOB_DEFS[mob.type].height / 2), 2)
    );
}

function isInSunlight(mob, def) {
    const bx = Math.floor((mob.x + def.width / 2) / BLOCK_SIZE);
    const by = Math.floor(mob.y / BLOCK_SIZE);
    for (let y = by - 1; y >= 0; y--) {
        if (isBlockSolid(bx, y)) return false;
    }
    return true;
}

function isPlayerWearingGoldArmor() {
    const a = state.inventory.armor;
    return a.helmet.itemId === ITEMS.GOLD_HELMET ||
           a.chestplate.itemId === ITEMS.GOLD_CHESTPLATE ||
           a.leggings.itemId === ITEMS.GOLD_LEGGINGS ||
           a.boots.itemId === ITEMS.GOLD_BOOTS;
}

// ============================================================
// MOB AI
// ============================================================

export function updateMobs(dt, dayBrightness) {
    for (let i = state.mobs.length - 1; i >= 0; i--) {
        const mob = state.mobs[i];
        const def = MOB_DEFS[mob.type];

        if (mob.hurtTimer > 0) mob.hurtTimer -= dt;
        if (mob.attackCooldown > 0) mob.attackCooldown -= dt;

        // Death check
        if (mob.health <= 0 && !mob.dead) {
            mob.dead = true;
            // Possum killed — summon the Possum Protector!
            if (mob.type === "possum") {
                const ppDef = MOB_DEFS.possum_protector;
                const pp = createMob("possum_protector", mob.x - ppDef.width / 2, mob.y - ppDef.height);
                state.mobs.push(pp);
                addFloatingText(mob.x + def.width / 2, mob.y - 30, "POSSUM PROTECTOR AWAKENS!", "#ff44aa");
                createParticles(mob.x + def.width / 2, mob.y + def.height / 2, 20, "#ff88cc", 6);
            }
            // Possum Protector killed — summon The Possum God!
            if (mob.type === "possum_protector") {
                const alreadyGod = state.mobs.some(m => m.type === "possum_god");
                if (!alreadyGod) {
                    const godDef = MOB_DEFS.possum_god;
                    const god = createMob("possum_god", mob.x - godDef.width / 2, mob.y - godDef.height);
                    god.aggroed = true;
                    state.mobs.push(god);
                    speakPossumGod();
                    addFloatingText(mob.x + def.width / 2, mob.y - 40, "THE POSSUM GOD AWAKENS!", "#ffd700");
                    createParticles(mob.x + def.width / 2, mob.y + def.height / 2, 30, "#ffd700", 8);
                }
            }
            // Companion killed — rises as The Glitched
            if (mob.type === "companion") {
                createParticles(mob.x + def.width / 2, mob.y + def.height / 2, 20, "#220033", 5);
                addFloatingText(mob.x + def.width / 2, mob.y - 20, "You let me die...", "#aa00ff");
                mob.type = "glitched";
                mob.health = MOB_DEFS.glitched.maxHealth;
                mob.dead = false;
                state.glitchedActive = true;
                continue;
            }
            if (mob.type === "glitched") state.glitchedActive = false;
            createParticles(mob.x + def.width / 2, mob.y + def.height / 2, 12, "#aaaaaa", 4);
            for (const drop of def.drops) {
                if (drop.chance !== undefined && Math.random() > drop.chance) continue;
                const count = drop.min + Math.floor(Math.random() * (drop.max - drop.min + 1));
                if (count > 0) {
                    addToInventory(drop.id, count);
                    addFloatingText(mob.x + def.width / 2, mob.y, `+${count} ${getItemName(drop.id)}`, "#ffd700");
                }
            }
            state.mobs.splice(i, 1);
            continue;
        }

        // Despawn if too far (not villagers, iron golems, tamed wolves, companion, glitched, or possum_protector — they're permanent)
        if (mob.type !== "villager" && mob.type !== "iron_golem" && !mob.tamed && mob.type !== "companion" && mob.type !== "glitched" && mob.type !== "possum_protector" && mob.type !== "possum_god" && distToPlayer(mob) > 60 * BLOCK_SIZE) {
            state.mobs.splice(i, 1);
            continue;
        }

        // Sunlight burning (zombies/skeletons, not creepers/husks/endermen/pigmen/ghasts/gruntures, not in Nether/Wasteland)
        if (def.hostile && mob.type !== "creeper" && mob.type !== "husk" && mob.type !== "enderman" && mob.type !== "spider" && mob.type !== "pigman" && mob.type !== "ghast" && mob.type !== "grunture" && mob.type !== "possum_protector" && mob.type !== "possum_god" && dayBrightness > 0.6 && !state.inNether && !state.inWasteland) {
            if (isInSunlight(mob, def)) {
                mob.burnTimer += dt;
                if (mob.burnTimer >= 500) {
                    mob.burnTimer = 0;
                    mob.health -= 1;
                    mob.hurtTimer = 150;
                    createParticles(mob.x + def.width / 2, mob.y + def.height / 4, 3, "#ff8800", 2);
                    createParticles(mob.x + def.width / 2, mob.y + def.height / 4, 2, "#ffcc00", 1.5);
                }
            } else {
                mob.burnTimer = 0;
            }
        }

        // Flamethrower fire damage (independent of sunlight)
        if (mob.onFire > 0) {
            mob.onFire -= dt;
            mob.fireDamageCooldown -= dt;
            if (mob.fireDamageCooldown <= 0) {
                mob.health -= 2;
                mob.hurtTimer = 150;
                createParticles(mob.x + def.width / 2, mob.y + def.height / 4, 4, "#ff6600", 2);
                createParticles(mob.x + def.width / 2, mob.y + def.height / 4, 2, "#ffcc00", 1.5);
                mob.fireDamageCooldown = 500;
            }
        }

        const dist = distToPlayer(mob);
        const dirToPlayer = state.player.x > mob.x ? 1 : -1;

        // --- AI by mob type ---
        if (mob.type === "zombie") {
            if (dist < def.detectRange * BLOCK_SIZE) {
                mob.velX = dirToPlayer * def.speed;
                mob.facing = dirToPlayer;
                if (dist < def.attackRange && mob.attackCooldown <= 0) {
                    hurtPlayer(def.damage, mob.x);
                    mob.attackCooldown = 1000;
                }
            } else {
                // Try to find a nearby villager to attack
                let vTarget = null, vDist = Infinity;
                for (const v of state.mobs) {
                    if (v.type !== "villager") continue;
                    const vdx = (v.x + MOB_DEFS.villager.width / 2) - (mob.x + def.width / 2);
                    const vdy = (v.y + MOB_DEFS.villager.height / 2) - (mob.y + def.height / 2);
                    const vd = Math.sqrt(vdx * vdx + vdy * vdy);
                    if (vd < def.detectRange * BLOCK_SIZE && vd < vDist) { vTarget = v; vDist = vd; }
                }
                if (vTarget) {
                    const vDir = vTarget.x > mob.x ? 1 : -1;
                    mob.velX = vDir * def.speed;
                    mob.facing = vDir;
                    if (vDist < def.attackRange && mob.attackCooldown <= 0) {
                        vTarget.health -= def.damage;
                        vTarget.hurtTimer = 200;
                        mob.attackCooldown = 1000;
                        addFloatingText(vTarget.x + MOB_DEFS.villager.width / 2, vTarget.y - 10, `-${def.damage}`, "#ff4444");
                    }
                } else {
                    mob.wanderTimer -= dt;
                    if (mob.wanderTimer <= 0) {
                        mob.wanderDir = Math.random() < 0.5 ? -1 : 1;
                        mob.wanderTimer = 2000 + Math.random() * 3000;
                    }
                    mob.velX = mob.wanderDir * def.speed * 0.3;
                    mob.facing = mob.wanderDir;
                }
            }
        }

        else if (mob.type === "skeleton") {
            mob.shootCooldown -= dt;
            if (dist < def.detectRange * BLOCK_SIZE) {
                if (dist < 6 * BLOCK_SIZE) {
                    mob.velX = -dirToPlayer * def.speed;
                } else if (dist > 12 * BLOCK_SIZE) {
                    mob.velX = dirToPlayer * def.speed * 0.5;
                } else {
                    mob.velX *= 0.8;
                }
                mob.facing = dirToPlayer;
                if (mob.shootCooldown <= 0 && dist < def.attackRange) {
                    createArrow(
                        mob.x + def.width / 2, mob.y + 10,
                        state.player.x + state.player.width / 2, state.player.y + state.player.height / 2,
                        def.damage
                    );
                    mob.shootCooldown = def.shootInterval;
                }
            } else {
                mob.velX *= 0.9;
            }
        }

        else if (mob.type === "creeper") {
            if (dist < def.detectRange * BLOCK_SIZE) {
                mob.velX = dirToPlayer * def.speed;
                mob.facing = dirToPlayer;
                if (dist < def.fuseRange) {
                    mob.fusing = true;
                    mob.fuseTimer += dt;
                    mob.velX *= 0.3;
                    if (mob.fuseTimer >= def.fuseTime) {
                        creeperExplode(mob);
                        state.mobs.splice(i, 1);
                        continue;
                    }
                } else {
                    mob.fusing = false;
                    mob.fuseTimer = Math.max(0, mob.fuseTimer - dt * 0.5);
                }
            } else {
                mob.fusing = false;
                mob.fuseTimer = 0;
                mob.velX *= 0.9;
            }
        }

        else if (mob.type === "pig") {
            mob.wanderTimer -= dt;
            if (mob.wanderTimer <= 0) {
                mob.wanderDir = Math.random() < 0.3 ? 0 : (Math.random() < 0.5 ? -1 : 1);
                mob.wanderTimer = 1000 + Math.random() * 4000;
            }
            if (mob.hurtTimer > 0) {
                const fleeDir = nearestThreatX(mob) > mob.x ? -1 : 1;
                mob.velX = fleeDir * def.speed * 2;
                mob.facing = fleeDir;
            } else {
                mob.velX = mob.wanderDir * def.speed * 0.4;
                if (mob.wanderDir !== 0) mob.facing = mob.wanderDir;
            }
        }

        else if (mob.type === "cow" || mob.type === "sheep") {
            mob.wanderTimer -= dt;
            if (mob.wanderTimer <= 0) {
                mob.wanderDir = Math.random() < 0.3 ? 0 : (Math.random() < 0.5 ? -1 : 1);
                mob.wanderTimer = 1000 + Math.random() * 4000;
            }
            if (mob.hurtTimer > 0) {
                const fleeDir = nearestThreatX(mob) > mob.x ? -1 : 1;
                mob.velX = fleeDir * def.speed * 2;
                mob.facing = fleeDir;
            } else {
                mob.velX = mob.wanderDir * def.speed * 0.4;
                if (mob.wanderDir !== 0) mob.facing = mob.wanderDir;
            }
        }

        else if (mob.type === "villager") {
            if (mob.hurtTimer > 0) {
                const fleeDir = nearestThreatX(mob) > mob.x ? -1 : 1;
                mob.velX = fleeDir * def.speed * 2.5;
                mob.facing = fleeDir;
            } else {
                mob.wanderTimer -= dt;
                if (mob.wanderTimer <= 0) {
                    mob.wanderDir = Math.random() < 0.4 ? 0 : (Math.random() < 0.5 ? -1 : 1);
                    mob.wanderTimer = 2000 + Math.random() * 5000;
                }
                // Stay near home
                const distFromHome = mob.x - mob.spawnX;
                if (Math.abs(distFromHome) > 10 * BLOCK_SIZE) {
                    mob.wanderDir = distFromHome > 0 ? -1 : 1;
                }
                mob.velX = mob.wanderDir * def.speed * 0.3;
                if (mob.wanderDir !== 0) mob.facing = mob.wanderDir;
            }
        }

        else if (mob.type === "husk") {
            // Same as zombie AI but desert-only
            if (dist < def.detectRange * BLOCK_SIZE) {
                mob.velX = dirToPlayer * def.speed;
                mob.facing = dirToPlayer;
                if (dist < def.attackRange && mob.attackCooldown <= 0) {
                    const dmg = def.damage + (mob.equipment && mob.equipment.weapon ? 3 : 0);
                    hurtPlayer(dmg, mob.x);
                    mob.attackCooldown = 1000;
                }
            } else {
                let vTarget = null, vDist = Infinity;
                for (const v of state.mobs) {
                    if (v.type !== "villager") continue;
                    const vdx = (v.x + MOB_DEFS.villager.width / 2) - (mob.x + def.width / 2);
                    const vdy = (v.y + MOB_DEFS.villager.height / 2) - (mob.y + def.height / 2);
                    const vd = Math.sqrt(vdx * vdx + vdy * vdy);
                    if (vd < def.detectRange * BLOCK_SIZE && vd < vDist) { vTarget = v; vDist = vd; }
                }
                if (vTarget) {
                    const vDir = vTarget.x > mob.x ? 1 : -1;
                    mob.velX = vDir * def.speed;
                    mob.facing = vDir;
                    if (vDist < def.attackRange && mob.attackCooldown <= 0) {
                        vTarget.health -= def.damage;
                        vTarget.hurtTimer = 200;
                        mob.attackCooldown = 1000;
                        addFloatingText(vTarget.x + MOB_DEFS.villager.width / 2, vTarget.y - 10, `-${def.damage}`, "#ff4444");
                    }
                } else {
                    mob.wanderTimer -= dt;
                    if (mob.wanderTimer <= 0) {
                        mob.wanderDir = Math.random() < 0.5 ? -1 : 1;
                        mob.wanderTimer = 2000 + Math.random() * 3000;
                    }
                    mob.velX = mob.wanderDir * def.speed * 0.3;
                    mob.facing = mob.wanderDir;
                }
            }
        }

        else if (mob.type === "enderman") {
            mob.teleportTimer += dt;
            // Only aggro if attacked (hurtTimer) or player cursor is on them
            if (!mob.aggroed) {
                if (mob.hurtTimer > 0) {
                    mob.aggroed = true;
                } else {
                    // Check if player is looking at enderman (cursor within mob bounds)
                    const cursorWorldX = state.mouse.x + state.camera.x;
                    const cursorWorldY = state.mouse.y + state.camera.y;
                    if (cursorWorldX >= mob.x && cursorWorldX <= mob.x + def.width &&
                        cursorWorldY >= mob.y && cursorWorldY <= mob.y + def.height &&
                        dist < def.detectRange * BLOCK_SIZE) {
                        mob.aggroed = true;
                    }
                }
            }
            if (mob.aggroed) {
                mob.facing = dirToPlayer;
                // Teleport toward player periodically
                if (mob.teleportTimer >= def.teleportCooldown && dist > 3 * BLOCK_SIZE) {
                    mob.teleportTimer = 0;
                    const tpDir = state.player.x > mob.x ? 1 : -1;
                    const tpDist = 3 + Math.floor(Math.random() * 3);
                    const newX = state.player.x + tpDir * (-tpDist * BLOCK_SIZE);
                    const bx = Math.floor(newX / BLOCK_SIZE);
                    const by = Math.floor(mob.y / BLOCK_SIZE);
                    if (bx >= 0 && bx < WORLD_WIDTH && by >= 0 && by < WORLD_HEIGHT) {
                        if (!isBlockSolid(bx, by) && !isBlockSolid(bx, by - 1)) {
                            createParticles(mob.x + def.width / 2, mob.y + def.height / 2, 8, "#aa44ff", 3);
                            mob.x = newX;
                            createParticles(mob.x + def.width / 2, mob.y + def.height / 2, 8, "#aa44ff", 3);
                        }
                    }
                }
                // Chase and attack
                if (dist > 2 * BLOCK_SIZE) {
                    mob.velX = dirToPlayer * def.speed;
                } else {
                    mob.velX *= 0.5;
                }
                if (dist < def.attackRange && mob.attackCooldown <= 0) {
                    hurtPlayer(def.damage, mob.x);
                    mob.attackCooldown = 800;
                }
            } else {
                // Passive wander
                mob.wanderTimer -= dt;
                if (mob.wanderTimer <= 0) {
                    mob.wanderDir = Math.random() < 0.3 ? 0 : (Math.random() < 0.5 ? -1 : 1);
                    mob.wanderTimer = 3000 + Math.random() * 5000;
                }
                mob.velX = mob.wanderDir * def.speed * 0.2;
                if (mob.wanderDir !== 0) mob.facing = mob.wanderDir;
            }
        }

        else if (mob.type === "spider") {
            // Neutral during day, hostile at night
            const isNight = dayBrightness < NIGHT_THRESHOLD;
            const isAggro = isNight || mob.hurtTimer > 0;
            if (isAggro && dist < def.detectRange * BLOCK_SIZE) {
                mob.velX = dirToPlayer * def.speed;
                mob.facing = dirToPlayer;
                if (dist < def.attackRange && mob.attackCooldown <= 0) {
                    hurtPlayer(def.damage, mob.x);
                    mob.attackCooldown = 800;
                }
            } else {
                mob.wanderTimer -= dt;
                if (mob.wanderTimer <= 0) {
                    mob.wanderDir = Math.random() < 0.3 ? 0 : (Math.random() < 0.5 ? -1 : 1);
                    mob.wanderTimer = 1500 + Math.random() * 3000;
                }
                if (mob.hurtTimer > 0 && !isNight) {
                    const fleeDir = state.player.x > mob.x ? -1 : 1;
                    mob.velX = fleeDir * def.speed * 1.5;
                    mob.facing = fleeDir;
                } else {
                    mob.velX = mob.wanderDir * def.speed * 0.3;
                    if (mob.wanderDir !== 0) mob.facing = mob.wanderDir;
                }
            }
        }

        else if (mob.type === "chicken") {
            mob.wanderTimer -= dt;
            if (mob.wanderTimer <= 0) {
                mob.wanderDir = Math.random() < 0.4 ? 0 : (Math.random() < 0.5 ? -1 : 1);
                mob.wanderTimer = 800 + Math.random() * 2000;
            }
            if (mob.hurtTimer > 0) {
                const fleeDir = nearestThreatX(mob) > mob.x ? -1 : 1;
                mob.velX = fleeDir * def.speed * 2.5;
                mob.facing = fleeDir;
            } else {
                mob.velX = mob.wanderDir * def.speed * 0.4;
                if (mob.wanderDir !== 0) mob.facing = mob.wanderDir;
            }
            // Chickens fall slowly (flutter)
            if (mob.velY > 2) mob.velY = 2;
        }

        else if (mob.type === "possum") {
            // Cheerful wander — slightly faster direction changes
            mob.wanderTimer -= dt;
            if (mob.wanderTimer <= 0) {
                mob.wanderDir = Math.random() < 0.35 ? 0 : (Math.random() < 0.5 ? -1 : 1);
                mob.wanderTimer = 600 + Math.random() * 1800;
            }
            if (mob.hurtTimer > 0) {
                // Flee when hurt
                const fleeDir = nearestThreatX(mob) > mob.x ? -1 : 1;
                mob.velX = fleeDir * def.speed * 2;
                mob.facing = fleeDir;
            } else {
                mob.velX = mob.wanderDir * def.speed;
                if (mob.wanderDir !== 0) mob.facing = mob.wanderDir;
            }
        }

        else if (mob.type === "possum_protector") {
            mob.wrapCooldown = (mob.wrapCooldown || 0) - dt;
            mob.biteOutsideCooldown = (mob.biteOutsideCooldown || 0) - dt;
            if (mob.wrapping) {
                // Stay on the player while wrapping
                mob.velX = dirToPlayer * def.speed * 0.5;
                mob.wrapTimer -= dt;
                mob.squeezeTimer = (mob.squeezeTimer || 0) - dt;
                mob.biteTimer = (mob.biteTimer || 0) - dt;
                // Squeeze damage every 400ms
                if (mob.squeezeTimer <= 0) {
                    hurtPlayer(2, mob.x + def.width / 2);
                    mob.squeezeTimer = 400;
                    createParticles(state.player.x + state.player.width / 2, state.player.y + state.player.height / 2, 4, "#ff88cc", 3);
                }
                // Bite every 1500ms — 1/4 of player max health
                if (mob.biteTimer <= 0) {
                    const biteDmg = Math.floor(state.player.maxHealth / 4);
                    hurtPlayer(biteDmg, mob.x + def.width / 2);
                    mob.biteTimer = 1500;
                    addFloatingText(state.player.x + state.player.width / 2, state.player.y - 20, `-${biteDmg} BITE!`, "#cc0000");
                    createParticles(state.player.x + state.player.width / 2, state.player.y, 8, "#cc0000", 5);
                }
                if (mob.wrapTimer <= 0) {
                    mob.wrapping = false;
                    mob.wrapCooldown = 4000;
                }
            } else {
                // Always pursue player relentlessly
                mob.velX = dirToPlayer * def.speed;
                mob.facing = dirToPlayer;
                // Initiate tail wrap when close enough and cooldown done
                if (dist < def.squeezeRange && mob.wrapCooldown <= 0) {
                    mob.wrapping = true;
                    mob.wrapTimer = 5000;
                    mob.squeezeTimer = 400;
                    mob.biteTimer = 800;
                    addFloatingText(mob.x + def.width / 2, mob.y - 30, "TAIL WRAP!", "#ff44aa");
                    createParticles(mob.x + def.width / 2, mob.y + def.height / 2, 12, "#ff88cc", 5);
                }
                // Standalone bite — 1/4 of player max health, 2s cooldown
                if (dist < def.attackRange && mob.biteOutsideCooldown <= 0) {
                    const biteDmg = Math.floor(state.player.maxHealth / 4);
                    hurtPlayer(biteDmg, mob.x + def.width / 2);
                    mob.biteOutsideCooldown = 2000;
                    addFloatingText(state.player.x + state.player.width / 2, state.player.y - 20, `-${biteDmg} BITE!`, "#cc0000");
                    createParticles(state.player.x + state.player.width / 2, state.player.y, 8, "#cc0000", 5);
                }
                // Melee slash when in range
                if (dist < def.attackRange && mob.attackCooldown <= 0) {
                    hurtPlayer(def.damage, mob.x + def.width / 2);
                    mob.attackCooldown = 800;
                    createParticles(state.player.x + state.player.width / 2, state.player.y + state.player.height / 2, 8, "#ff4444", 5);
                }
            }
        }

        else if (mob.type === "possum_god") {
            // The Possum God — relentless, super fast, does half player health per hit
            mob.velX = dirToPlayer * def.speed;
            mob.facing = dirToPlayer;
            // Jump over obstacles
            if (mob.onGround && isBlockSolid(Math.floor((mob.x + (dirToPlayer > 0 ? def.width : 0)) / BLOCK_SIZE), Math.floor((mob.y + def.height / 2) / BLOCK_SIZE))) {
                mob.velY = -10;
            }
            if (dist < def.attackRange && mob.attackCooldown <= 0) {
                const godDmg = Math.floor(state.player.maxHealth / 2);
                hurtPlayer(godDmg, mob.x + def.width / 2);
                mob.attackCooldown = 350;
                createParticles(state.player.x + state.player.width / 2, state.player.y + state.player.height / 2, 16, "#ffd700", 8);
                createParticles(state.player.x + state.player.width / 2, state.player.y + state.player.height / 2, 8, "#ffffff", 5);
                addFloatingText(state.player.x + state.player.width / 2, state.player.y - 24, `-${godDmg} DIVINE WRATH`, "#ffd700");
            }
        }

        else if (mob.type === "wolf") {
            if (mob.tamed && mob.sitting) {
                // Sitting: stay put, don't move
                mob.velX = 0;
            } else if (mob.tamed) {
                // Following: chase the player
                if (dist > 3 * BLOCK_SIZE) {
                    mob.velX = dirToPlayer * def.speed * (dist > 8 * BLOCK_SIZE ? 2.0 : 1.0);
                    mob.facing = dirToPlayer;
                } else {
                    mob.velX *= 0.5;
                }
                // Attack nearby hostile mobs
                let wolfTarget = null;
                let wolfTargetDist = Infinity;
                for (const m of state.mobs) {
                    if (m === mob) continue;
                    if (!MOB_DEFS[m.type].hostile) continue;
                    const mdx = (m.x + MOB_DEFS[m.type].width / 2) - (mob.x + def.width / 2);
                    const mdy = (m.y + MOB_DEFS[m.type].height / 2) - (mob.y + def.height / 2);
                    const md = Math.sqrt(mdx * mdx + mdy * mdy);
                    if (md < 10 * BLOCK_SIZE && md < wolfTargetDist) {
                        wolfTarget = m;
                        wolfTargetDist = md;
                    }
                }
                if (wolfTarget) {
                    const tdef = MOB_DEFS[wolfTarget.type];
                    const tDir = wolfTarget.x > mob.x ? 1 : -1;
                    mob.velX = tDir * def.speed * 1.5;
                    mob.facing = tDir;
                    if (wolfTargetDist < 36 && mob.attackCooldown <= 0) {
                        wolfTarget.health -= def.damage;
                        wolfTarget.hurtTimer = 300;
                        wolfTarget.aggroed = true;
                        mob.attackCooldown = 800;
                        addFloatingText(wolfTarget.x + tdef.width / 2, wolfTarget.y - 10, `-${def.damage}`, "#ff8800");
                    }
                }
            } else if (mob.provoked) {
                // Provoked: chase and attack the player
                mob.velX = dirToPlayer * def.speed * 1.5;
                mob.facing = dirToPlayer;
                if (dist < 34 && mob.attackCooldown <= 0) {
                    hurtPlayer(def.damage, mob.x + def.width / 2);
                    mob.attackCooldown = 1000;
                    createParticles(state.player.x + state.player.width / 2, state.player.y + state.player.height / 2, 4, "#ff0000");
                }
            } else {
                // Wild: hunt sheep/chickens nearby, otherwise wander
                let preyTarget = null;
                let preyDist = Infinity;
                for (const m of state.mobs) {
                    if (m === mob) continue;
                    if (m.type !== "sheep" && m.type !== "chicken") continue;
                    const pdx = (m.x + MOB_DEFS[m.type].width / 2) - (mob.x + def.width / 2);
                    const pdy = (m.y + MOB_DEFS[m.type].height / 2) - (mob.y + def.height / 2);
                    const pd = Math.sqrt(pdx * pdx + pdy * pdy);
                    if (pd < 10 * BLOCK_SIZE && pd < preyDist) {
                        preyTarget = m;
                        preyDist = pd;
                    }
                }
                if (preyTarget) {
                    const tDir = preyTarget.x > mob.x ? 1 : -1;
                    mob.velX = tDir * def.speed;
                    mob.facing = tDir;
                    if (preyDist < 34 && mob.attackCooldown <= 0) {
                        preyTarget.health -= def.damage;
                        preyTarget.hurtTimer = 300;
                        mob.attackCooldown = 1000;
                        createParticles(preyTarget.x + MOB_DEFS[preyTarget.type].width / 2, preyTarget.y, 6, "#cc4444", 3);
                    }
                } else {
                    mob.wanderTimer -= dt;
                    if (mob.wanderTimer <= 0) {
                        mob.wanderDir = Math.random() < 0.3 ? 0 : (Math.random() < 0.5 ? -1 : 1);
                        mob.wanderTimer = 2000 + Math.random() * 5000;
                    }
                    mob.velX = mob.wanderDir * def.speed * 0.5;
                    if (mob.wanderDir !== 0) mob.facing = mob.wanderDir;
                }
            }
        }

        else if (mob.type === "pigman") {
            mob.shootCooldown -= dt;
            const playerHasGold = isPlayerWearingGoldArmor();
            if (mob.hurtTimer > 0) mob.aggroed = true;
            const isHostile = mob.aggroed || !playerHasGold;

            if (isHostile && dist < def.detectRange * BLOCK_SIZE) {
                mob.facing = dirToPlayer;
                if (dist > 5 * BLOCK_SIZE) {
                    mob.velX = dirToPlayer * def.speed;
                } else if (dist < 3 * BLOCK_SIZE) {
                    mob.velX = -dirToPlayer * def.speed * 0.5;
                } else {
                    mob.velX *= 0.8;
                }
                // Crossbow attack at range
                if (mob.shootCooldown <= 0 && dist < def.attackRange) {
                    createArrow(mob.x + def.width / 2, mob.y + 10,
                        state.player.x + state.player.width / 2, state.player.y + state.player.height / 2,
                        def.damage);
                    mob.shootCooldown = def.shootInterval;
                }
                // Melee up close
                if (dist < 35 && mob.attackCooldown <= 0) {
                    hurtPlayer(def.damage + 2, mob.x);
                    mob.attackCooldown = 1000;
                }
            } else {
                if (playerHasGold) mob.aggroed = false;
                mob.wanderTimer -= dt;
                if (mob.wanderTimer <= 0) {
                    mob.wanderDir = Math.random() < 0.5 ? -1 : 1;
                    mob.wanderTimer = 2000 + Math.random() * 3000;
                }
                mob.velX = mob.wanderDir * def.speed * 0.4;
                mob.facing = mob.wanderDir;
            }
        }

        else if (mob.type === "ghast") {
            mob.shootCooldown -= dt;
            const targetHoverY = state.player.y - 6 * BLOCK_SIZE;
            const dyToTarget = targetHoverY - mob.y;

            if (dist < def.detectRange * BLOCK_SIZE) {
                const dxToPlayer = (state.player.x + state.player.width / 2) - (mob.x + def.width / 2);
                mob.velX = (dxToPlayer > 0 ? 1 : -1) * def.speed;
                mob.velY = Math.abs(dyToTarget) > 20 ? (dyToTarget > 0 ? 1 : -1) * def.speed * 0.6 : 0;
                mob.facing = dirToPlayer;
                if (mob.shootCooldown <= 0 && dist < def.attackRange) {
                    createFireball(mob.x + def.width / 2, mob.y + def.height / 2,
                        state.player.x + state.player.width / 2, state.player.y + state.player.height / 2,
                        def.damage);
                    mob.shootCooldown = def.shootInterval;
                }
            } else {
                mob.velX *= 0.9;
                mob.velY = Math.abs(dyToTarget) > 20 ? (dyToTarget > 0 ? 0.5 : -0.5) : 0;
            }
        }

        else if (mob.type === "iron_golem") {
            // Find nearest hostile mob to fight (protects villagers)
            let target = null, targetDist = Infinity;
            for (const other of state.mobs) {
                if (other === mob || !MOB_DEFS[other.type].hostile) continue;
                const tdx = (other.x + MOB_DEFS[other.type].width / 2) - (mob.x + def.width / 2);
                const tdy = (other.y + MOB_DEFS[other.type].height / 2) - (mob.y + def.height / 2);
                const td = Math.sqrt(tdx * tdx + tdy * tdy);
                if (td < def.detectRange * BLOCK_SIZE && td < targetDist) { target = other; targetDist = td; }
            }
            if (target) {
                const tDir = target.x > mob.x ? 1 : -1;
                mob.velX = tDir * def.speed;
                mob.facing = tDir;
                if (targetDist < def.attackRange && mob.attackCooldown <= 0) {
                    const tdef = MOB_DEFS[target.type];
                    target.health -= def.damage;
                    target.hurtTimer = 300;
                    target.velX = tDir * 8;
                    target.velY = -6;
                    mob.attackCooldown = 1500;
                    addFloatingText(target.x + tdef.width / 2, target.y - 10, `-${def.damage}`, "#ff4444");
                    createParticles(target.x + tdef.width / 2, target.y + tdef.height / 2, 8, "#aaaaaa", 4);
                }
            } else {
                // Wander near spawn (village center)
                const distFromHome = mob.x - mob.spawnX;
                mob.wanderTimer -= dt;
                if (mob.wanderTimer <= 0) {
                    mob.wanderDir = Math.random() < 0.3 ? 0 : (Math.random() < 0.5 ? -1 : 1);
                    mob.wanderTimer = 3000 + Math.random() * 5000;
                }
                if (Math.abs(distFromHome) > 12 * BLOCK_SIZE) mob.wanderDir = distFromHome > 0 ? -1 : 1;
                mob.velX = mob.wanderDir * def.speed * 0.4;
                if (mob.wanderDir !== 0) mob.facing = mob.wanderDir;
                // Occasionally give player a flower when nearby
                mob.flowerTimer += dt;
                if (mob.flowerTimer > 10000 && dist < 3 * BLOCK_SIZE) {
                    mob.flowerTimer = 0;
                    if (Math.random() < 0.3) {
                        addToInventory(ITEMS.FLOWER, 1);
                        addFloatingText(mob.x + def.width / 2, mob.y - 20, "Iron Golem gave you a flower!", "#ff88aa");
                    }
                }
            }
        }

        else if (mob.type === "grunture") {
            mob.shootCooldown -= dt;
            if (dist < def.detectRange * BLOCK_SIZE) {
                // Roar the first time it spots the player (and again after losing sight)
                if (!mob.detectedPlayer) {
                    mob.detectedPlayer = true;
                    playGruntureRoar();
                }
                // Always charge at the player
                mob.velX = dirToPlayer * def.speed;
                mob.facing = dirToPlayer;

                // Smoke billowing from nostrils when aggro
                mob.smokeTimer = (mob.smokeTimer || 0) - dt;
                if (mob.smokeTimer <= 0) {
                    mob.smokeTimer = 220;
                    const muzzWorldX = mob.x + (mob.facing === 1 ? def.width + 6 : -6);
                    const muzzWorldY = mob.y + def.height * 0.38;
                    createParticles(muzzWorldX, muzzWorldY, 4, "#333333", 2.5);
                    createParticles(muzzWorldX, muzzWorldY, 2, "#777777", 1.5);
                }

                if (dist <= def.attackRange) {
                    // Close range: slash attack
                    if (mob.attackCooldown <= 0) {
                        hurtPlayer(def.damage, mob.x + def.width / 2);
                        mob.attackCooldown = 700;
                        createParticles(state.player.x + state.player.width / 2, state.player.y + state.player.height / 2, 10, "#ff4400", 5);
                    }
                } else if (mob.shootCooldown <= 0 && dist < def.shootRange) {
                    // Long range: spit fireball
                    createFireball(
                        mob.x + def.width / 2,
                        mob.y + def.height / 4,
                        state.player.x + state.player.width / 2,
                        state.player.y + state.player.height / 2,
                        def.fireDamage
                    );
                    mob.shootCooldown = def.shootInterval;
                    createParticles(mob.x + def.width / 2, mob.y + def.height / 4, 6, "#ff6600", 4);
                }
            } else {
                mob.detectedPlayer = false;
                mob.velX *= 0.8;
            }
        }

        else if (mob.type === "raider") {
            mob.shootCooldown -= dt;
            // Reload timer
            if (mob.reloadTimer > 0) {
                mob.reloadTimer -= dt;
                if (mob.reloadTimer <= 0) { mob.reloadTimer = 0; mob.magAmmo = 24; }
            }
            if (dist < def.detectRange * BLOCK_SIZE) {
                mob.facing = dirToPlayer;
                // Maintain ~5-12 block shooting distance
                if (dist < 5 * BLOCK_SIZE)       mob.velX = -dirToPlayer * def.speed;
                else if (dist > 12 * BLOCK_SIZE) mob.velX =  dirToPlayer * def.speed * 0.6;
                else                              mob.velX *= 0.8;
                // Shoot AK-47 bullets — respects mag size and reload
                if (mob.reloadTimer <= 0 && mob.shootCooldown <= 0 && dist < def.attackRange) {
                    if (mob.magAmmo <= 0) {
                        mob.reloadTimer = 3000;
                    } else {
                        createBullet(
                            mob.x + def.width / 2, mob.y + 12,
                            state.player.x + state.player.width / 2,
                            state.player.y + state.player.height / 2,
                            def.damage, true
                        );
                        mob.magAmmo--;
                        mob.shootCooldown = def.shootInterval;
                    }
                }
                // Melee if very close
                if (dist < 40 && mob.attackCooldown <= 0) {
                    hurtPlayer(def.damage, mob.x + def.width / 2, "melee");
                    mob.attackCooldown = 1200;
                }
            } else { mob.velX *= 0.9; }
        }

        else if (mob.type === "companion") {
            // Hunger — counts up since last feeding
            mob.hungerTimer += dt;

            // Start asking for food when hungry (every ~60s)
            if (!mob.askingForFood && mob.hungerTimer >= 60000) {
                mob.askingForFood = true;
                mob.foodAskTimer = 0;
            }

            // If player ignores for 25s, hunger worsens
            if (mob.askingForFood) {
                mob.foodAskTimer += dt;
                if (mob.foodAskTimer >= 25000) {
                    mob.hungerTimer += 60000;
                    mob.askingForFood = false;
                    mob.foodAskTimer = 0;
                }
            }

            // Starved for too long → transform into The Glitched
            if (mob.hungerTimer >= 180000) {
                mob.type = "glitched";
                mob.health = MOB_DEFS.glitched.maxHealth;
                mob.maxHealth = MOB_DEFS.glitched.maxHealth;
                mob.aggroed = true;
                state.glitchedActive = true;
                createParticles(mob.x + def.width / 2, mob.y + def.height / 2, 30, "#000000", 6);
                createParticles(mob.x + def.width / 2, mob.y + def.height / 2, 15, "#440044", 4);
                addFloatingText(mob.x + def.width / 2, mob.y - 30, "...i'm so hungry...", "#440044");
                continue;
            }

            // Follow player
            if (dist > 3 * BLOCK_SIZE) {
                mob.velX = dirToPlayer * def.speed * (dist > 8 * BLOCK_SIZE ? 1.8 : 1.0);
                mob.facing = dirToPlayer;
            } else {
                mob.velX *= 0.5;
            }

            // Attack nearby hostile mobs (stone sword)
            let compTarget = null, compTargetDist = Infinity;
            for (const m of state.mobs) {
                if (m === mob) continue;
                if (!MOB_DEFS[m.type].hostile) continue;
                const mdx = (m.x + MOB_DEFS[m.type].width / 2) - (mob.x + def.width / 2);
                const mdy = (m.y + MOB_DEFS[m.type].height / 2) - (mob.y + def.height / 2);
                const md = Math.sqrt(mdx * mdx + mdy * mdy);
                if (md < 10 * BLOCK_SIZE && md < compTargetDist) { compTarget = m; compTargetDist = md; }
            }
            if (compTarget) {
                const tdef = MOB_DEFS[compTarget.type];
                const tDir = compTarget.x > mob.x ? 1 : -1;
                mob.velX = tDir * def.speed * 1.5;
                mob.facing = tDir;
                if (compTargetDist < def.attackRange && mob.attackCooldown <= 0) {
                    compTarget.health -= def.damage;
                    compTarget.hurtTimer = 300;
                    compTarget.aggroed = true;
                    mob.attackCooldown = 800;
                    addFloatingText(compTarget.x + tdef.width / 2, compTarget.y - 10, `-${def.damage}`, "#ff8800");
                }
            }
        }

        else if (mob.type === "glitched") {
            // Stuck detection — if barely moved while trying to chase, increment timer
            const movedDist = Math.abs(mob.x - (mob.lastX !== undefined ? mob.lastX : mob.x));
            if (movedDist < 0.5 && dist > def.attackRange) {
                mob.stuckTimer = (mob.stuckTimer || 0) + dt;
            } else {
                mob.stuckTimer = 0;
            }
            mob.lastX = mob.x;

            // Teleport near player when stuck for 1.5s
            if (mob.stuckTimer >= 1500) {
                mob.stuckTimer = 0;
                const offsets = [-3, -2, -1, 1, 2, 3];
                for (const off of offsets) {
                    const tx = Math.floor(state.player.x / BLOCK_SIZE) + off;
                    if (tx < 1 || tx >= WORLD_WIDTH - 1) continue;
                    let ty = -1;
                    for (let y = 1; y < WORLD_HEIGHT - 1; y++) {
                        if (isBlockSolid(tx, y) && !isBlockSolid(tx, y - 1) && !isBlockSolid(tx, y - 2)) {
                            ty = y - 2;
                            break;
                        }
                    }
                    if (ty < 0) continue;
                    createParticles(mob.x + def.width / 2, mob.y + def.height / 2, 12, "#000000", 5);
                    createParticles(mob.x + def.width / 2, mob.y + def.height / 2, 8, "#440044", 3);
                    mob.x = tx * BLOCK_SIZE;
                    mob.y = ty * BLOCK_SIZE;
                    mob.velX = 0; mob.velY = 0;
                    createParticles(mob.x + def.width / 2, mob.y + def.height / 2, 12, "#000000", 5);
                    createParticles(mob.x + def.width / 2, mob.y + def.height / 2, 8, "#440044", 3);
                    break;
                }
            }

            // Relentless pursuit — always chases player, never gives up
            mob.velX = dirToPlayer * def.speed;
            mob.facing = dirToPlayer;
            if (dist < def.attackRange && mob.attackCooldown <= 0) {
                hurtPlayer(def.damage, mob.x + def.width / 2, "glitched");
                mob.attackCooldown = 600;
                createParticles(state.player.x + state.player.width / 2, state.player.y + state.player.height / 2, 14, "#000000", 7);
                createParticles(state.player.x + state.player.width / 2, state.player.y + state.player.height / 2, 6, "#440044", 4);
            }
        }

        // Ghast flies — apply movement directly, no gravity
        if (mob.type === "ghast") {
            mob.x += mob.velX;
            mob.y += mob.velY;
            if (mob.x < 0) mob.x = 0;
            if (mob.x > (WORLD_WIDTH - 1) * BLOCK_SIZE) mob.x = (WORLD_WIDTH - 1) * BLOCK_SIZE;
            if (mob.y < 0) mob.y = 0;
            if (mob.y > (WORLD_HEIGHT - 1) * BLOCK_SIZE) mob.y = (WORLD_HEIGHT - 1) * BLOCK_SIZE;
        } else {
            mobPhysics(mob, def);
        }
        if (mob.x < 0) mob.x = 0;
        if (mob.x > (WORLD_WIDTH - 1) * BLOCK_SIZE) mob.x = (WORLD_WIDTH - 1) * BLOCK_SIZE;
        if (mob.y > WORLD_HEIGHT * BLOCK_SIZE) { state.mobs.splice(i, 1); continue; }

        // Contact damage for zombie/husk/spider
        if ((mob.type === "zombie" || mob.type === "husk" || mob.type === "spider") && mob.attackCooldown <= 0) {
            const px = state.player.x, py = state.player.y;
            if (mob.x < px + state.player.width && mob.x + def.width > px &&
                mob.y < py + state.player.height && mob.y + def.height > py) {
                const dmg = def.damage + (mob.equipment && mob.equipment.weapon ? 3 : 0);
                hurtPlayer(dmg, mob.x + def.width / 2);
                mob.attackCooldown = 1000;
            }
        }
    }
}
