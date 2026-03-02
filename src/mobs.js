// ============================================================
// MOBS.JS - Mob creation, AI, spawning, projectiles, particles
// ============================================================
// Zombies, skeletons, creepers, pigs! Plus the arrows they
// shoot and particle effects when things go boom.
// ============================================================

import { state } from './state.js';
import { BLOCKS, ITEMS, BLOCK_SIZE, WORLD_WIDTH, WORLD_HEIGHT, GRAVITY, MAX_FALL_SPEED, NIGHT_THRESHOLD, TORCH_SPAWN_RADIUS, MOB_DEFS, ITEM_INFO, BIOMES, NETHER_BIOMES, getItemName, TRADE_SETS, PROFESSION_LIST } from './constants.js';
import { isBlockSolid, findSurfaceY } from './world.js';
import { hurtPlayer } from './player.js';
import { addToInventory, addFloatingText } from './inventory.js';
import { playArrowShoot, playExplosion, playMobHit } from './audio.js';

// --- LOCAL MODULE CONSTANTS ---
const MAX_HOSTILE_MOBS = 8;
const MAX_PASSIVE_MOBS = 4;
const MOB_SPAWN_INTERVAL = 3000;

// --- MOBS ---

export function createMob(type, x, y) {
    const def = MOB_DEFS[type];
    const mob = {
        type, x, y,
        velX: 0, velY: 0,
        health: def.maxHealth, maxHealth: def.maxHealth,
        onGround: false, facing: Math.random() < 0.5 ? -1 : 1,
        hurtTimer: 0,
        aiTimer: 0,
        attackCooldown: 0,
        fuseTimer: 0,
        fusing: false,
        shootCooldown: 0,
        wanderDir: Math.random() < 0.5 ? -1 : 1,
        wanderTimer: 0,
        burnTimer: 0,
        dead: false,
        spawnX: x,
        equipment: null,
        aggroed: false,
        provoked: false,
        teleportTimer: 9999,
        tamed: false,
        sitting: false,
        flowerTimer: 0
    };
    // Random equipment for zombies, skeletons, husks, pigmen
    if (type === "zombie" || type === "skeleton" || type === "husk") {
        const hasArmor = Math.random() < 0.15;
        const hasWeapon = (type !== "skeleton") && Math.random() < 0.10;
        if (hasArmor || hasWeapon) {
            mob.equipment = { armor: hasArmor, weapon: hasWeapon };
            if (hasArmor) mob.health += 4;
        }
    }
    if (type === "pigman") {
        const hasArmor = Math.random() < 0.3;
        mob.equipment = { armor: hasArmor, weapon: true, gold: true };
        if (hasArmor) mob.health += 5;
    }
    return mob;
}

// --- PROJECTILES (skeleton arrows) ---

export function createArrow(x, y, targetX, targetY, damage) {
    playArrowShoot();
    const dx = targetX - x;
    const dy = targetY - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const speed = 7;
    // Compensate upward for gravity so the arrow actually reaches the target at any range.
    // Flight time: t = dist / speed.  Gravity applied per frame: 0.15.
    // Required velY: dy/t - 0.5 * 0.15 * t  =  (dy*speed/dist) - 0.075*(dist/speed)
    const t = dist / speed;
    const velY = (dy / dist) * speed - 0.075 * t + (Math.random() - 0.5) * 1.2;
    state.projectiles.push({
        x, y,
        velX: (dx / dist) * speed,
        velY,
        damage,
        life: 220
    });
}

export function createBullet(x, y, targetX, targetY, damage) {
    const dx = targetX - x;
    const dy = targetY - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const speed = 14;
    state.projectiles.push({
        x, y,
        velX: (dx / dist) * speed,
        velY: (dy / dist) * speed,
        damage,
        life: 60,
        isBullet: true
    });
}

export function createRocket(x, y, targetX, targetY, damage) {
    const dx = targetX - x;
    const dy = targetY - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const speed = 8;
    state.projectiles.push({
        x, y,
        velX: (dx / dist) * speed,
        velY: (dy / dist) * speed,
        damage,
        life: 120,
        isRocket: true
    });
}

export function createFireball(x, y, targetX, targetY, damage) {
    const dx = targetX - x, dy = targetY - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const speed = 5;
    state.projectiles.push({
        x, y,
        velX: (dx / dist) * speed,
        velY: (dy / dist) * speed,
        damage, life: 180, isFireball: true
    });
}

export function fireballExplode(px, py, damage) {
    const cx = Math.floor(px / BLOCK_SIZE);
    const cy = Math.floor(py / BLOCK_SIZE);
    const radius = 1;
    for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
            if (dx * dx + dy * dy <= radius * radius) {
                const bx = cx + dx, by = cy + dy;
                if (bx >= 0 && bx < WORLD_WIDTH && by >= 0 && by < WORLD_HEIGHT) {
                    const block = state.activeWorld[bx][by];
                    if (block !== BLOCKS.BEDROCK && block !== BLOCKS.AIR && block !== BLOCKS.COBBLESTONE) {
                        state.activeWorld[bx][by] = BLOCKS.AIR;
                    }
                }
            }
        }
    }
    createParticles(px, py, 20, "#ff6600", 5);
    createParticles(px, py, 10, "#ffcc00", 4);
    playExplosion();
}

function isPlayerWearingGoldArmor() {
    const a = state.inventory.armor;
    return a.helmet.itemId === ITEMS.GOLD_HELMET ||
           a.chestplate.itemId === ITEMS.GOLD_CHESTPLATE ||
           a.leggings.itemId === ITEMS.GOLD_LEGGINGS ||
           a.boots.itemId === ITEMS.GOLD_BOOTS;
}

export function rocketExplode(px, py, damage) {
    const cx = Math.floor(px / BLOCK_SIZE);
    const cy = Math.floor(py / BLOCK_SIZE);
    const radius = 3; // Same as creeper

    // Destroy blocks
    for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
            if (dx * dx + dy * dy <= radius * radius) {
                const bx = cx + dx, by = cy + dy;
                if (bx >= 0 && bx < WORLD_WIDTH && by >= 0 && by < WORLD_HEIGHT) {
                    if (state.activeWorld[bx][by] !== BLOCKS.BEDROCK && state.activeWorld[bx][by] !== BLOCKS.AIR) {
                        state.activeWorld[bx][by] = BLOCKS.AIR;
                    }
                }
            }
        }
    }

    // Damage nearby mobs
    for (let i = state.mobs.length - 1; i >= 0; i--) {
        const mob = state.mobs[i];
        const def = MOB_DEFS[mob.type];
        const mcx = mob.x + def.width / 2;
        const mcy = mob.y + def.height / 2;
        const dist = Math.sqrt((px - mcx) * (px - mcx) + (py - mcy) * (py - mcy));
        if (dist < (radius + 2) * BLOCK_SIZE) {
            const dmg = Math.floor(damage * (1 - dist / ((radius + 2) * BLOCK_SIZE)));
            if (dmg > 0) {
                mob.health -= dmg;
                mob.hurtTimer = 300;
                mob.aggroed = true;
                const kb = px < mcx ? 5 : -5;
                mob.velX = kb;
                mob.velY = -4;
                addFloatingText(mob.x + def.width / 2, mob.y - 10, `-${dmg}`, "#ff4444");
            }
        }
    }

    // Damage player if nearby
    const pcx = state.player.x + state.player.width / 2;
    const pcy = state.player.y + state.player.height / 2;
    const playerDist = Math.sqrt((px - pcx) * (px - pcx) + (py - pcy) * (py - pcy));
    if (playerDist < (radius + 2) * BLOCK_SIZE) {
        const dmg = Math.floor(damage * (1 - playerDist / ((radius + 2) * BLOCK_SIZE)));
        if (dmg > 0) hurtPlayer(dmg, px);
    }

    // Effects
    createParticles(px, py, 40, "#ff8800", 8);
    createParticles(px, py, 20, "#ffff00", 6);
    state.screenShake.intensity = 15;
    playExplosion();
    addFloatingText(px, py - 20, "BOOM!", "#ff4444");
}

// --- PARTICLES (explosions, death poof, hit effects) ---

export function createParticles(x, y, count, color, speed = 3) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const vel = Math.random() * speed;
        state.particles.push({
            x, y,
            velX: Math.cos(angle) * vel,
            velY: Math.sin(angle) * vel - 2,
            color,
            size: 2 + Math.random() * 4,
            life: 20 + Math.random() * 30
        });
    }
}

// ============================================================
// MOB PHYSICS
// ============================================================

function mobPhysics(mob, def) {
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

        // Despawn if too far (not villagers, iron golems, or tamed wolves - they're permanent)
        if (mob.type !== "villager" && mob.type !== "iron_golem" && !mob.tamed && distToPlayer(mob) > 60 * BLOCK_SIZE) {
            state.mobs.splice(i, 1);
            continue;
        }

        // Sunlight burning (zombies/skeletons, not creepers/husks/endermen/pigmen/ghasts, not in Nether)
        if (def.hostile && mob.type !== "creeper" && mob.type !== "husk" && mob.type !== "enderman" && mob.type !== "spider" && mob.type !== "pigman" && mob.type !== "ghast" && dayBrightness > 0.6 && !state.inNether) {
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

// ============================================================
// CREEPER EXPLOSION
// ============================================================

export function creeperExplode(mob) {
    const def = MOB_DEFS.creeper;
    const cx = Math.floor((mob.x + def.width / 2) / BLOCK_SIZE);
    const cy = Math.floor((mob.y + def.height / 2) / BLOCK_SIZE);
    const radius = def.explosionRadius;

    for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
            if (dx * dx + dy * dy <= radius * radius) {
                const bx = cx + dx, by = cy + dy;
                if (bx >= 0 && bx < WORLD_WIDTH && by >= 0 && by < WORLD_HEIGHT) {
                    if (state.activeWorld[bx][by] !== BLOCKS.BEDROCK && state.activeWorld[bx][by] !== BLOCKS.AIR) {
                        state.activeWorld[bx][by] = BLOCKS.AIR;
                    }
                }
            }
        }
    }

    const dist = distToPlayer(mob);
    if (dist < (radius + 2) * BLOCK_SIZE) {
        const dmg = Math.floor(def.damage * (1 - dist / ((radius + 2) * BLOCK_SIZE)));
        if (dmg > 0) hurtPlayer(dmg, mob.x);
    }

    createParticles(mob.x + def.width / 2, mob.y + def.height / 2, 40, "#ff8800", 8);
    createParticles(mob.x + def.width / 2, mob.y + def.height / 2, 20, "#ffff00", 6);
    state.screenShake.intensity = 15;
    playExplosion();
    addFloatingText(mob.x + def.width / 2, mob.y - 20, "BOOM!", "#ff4444");
}

// ============================================================
// PROJECTILES (arrows)
// ============================================================

export function updateProjectiles(dt) {
    for (let i = state.projectiles.length - 1; i >= 0; i--) {
        const p = state.projectiles[i];
        if (!p.isBullet && !p.isRocket && !p.isFireball) p.velY += 0.15; // Gravity for arrows only
        if (p.isRocket) p.velY += 0.05; // Slight gravity for rockets
        p.x += p.velX;
        p.y += p.velY;
        p.life--;

        if (p.isFireball) {
            // Fireballs: stopped harmlessly by cobblestone; explode on other blocks; burn player on hit
            const bx = Math.floor(p.x / BLOCK_SIZE);
            const by = Math.floor(p.y / BLOCK_SIZE);
            if (isBlockSolid(bx, by)) {
                if (state.activeWorld[bx] && state.activeWorld[bx][by] === BLOCKS.COBBLESTONE) {
                    // Absorbed by cobblestone — no explosion, no damage
                    createParticles(p.x, p.y, 5, "#ff6600", 2);
                } else {
                    fireballExplode(p.x, p.y, p.damage);
                }
                state.projectiles.splice(i, 1);
                continue;
            }
            // Hit player
            if (p.x >= state.player.x && p.x <= state.player.x + state.player.width &&
                p.y >= state.player.y && p.y <= state.player.y + state.player.height) {
                hurtPlayer(p.damage, p.x);
                state.player.burnTimer = 3000;
                createParticles(p.x, p.y, 10, "#ff6600", 4);
                state.projectiles.splice(i, 1);
                continue;
            }
            if (p.life <= 0) {
                state.projectiles.splice(i, 1);
                continue;
            }
        } else if (p.isRocket) {
            // Rockets explode on hitting a mob, block, or at end of life
            let hit = false;

            // Check mob collision
            for (let j = state.mobs.length - 1; j >= 0; j--) {
                const mob = state.mobs[j];
                const def = MOB_DEFS[mob.type];
                if (p.x >= mob.x && p.x <= mob.x + def.width &&
                    p.y >= mob.y && p.y <= mob.y + def.height) {
                    hit = true;
                    break;
                }
            }

            // Check block collision
            const bx = Math.floor(p.x / BLOCK_SIZE);
            const by = Math.floor(p.y / BLOCK_SIZE);
            if (isBlockSolid(bx, by)) hit = true;

            if (hit || p.life <= 0) {
                rocketExplode(p.x, p.y, p.damage);
                state.projectiles.splice(i, 1);
                continue;
            }
        } else if (p.isBullet) {
            // Bullets hit mobs (fired by player)
            let hitMob = false;
            for (let j = state.mobs.length - 1; j >= 0; j--) {
                const mob = state.mobs[j];
                const def = MOB_DEFS[mob.type];
                if (p.x >= mob.x && p.x <= mob.x + def.width &&
                    p.y >= mob.y && p.y <= mob.y + def.height) {
                    const armorReduction = (mob.equipment && mob.equipment.armor) ? 2 : 0;
                    const dmg = Math.max(1, p.damage - armorReduction);
                    mob.health -= dmg;
                    mob.hurtTimer = 300;
                    mob.aggroed = true;
                    const kb = p.velX > 0 ? 4 : -4;
                    mob.velX = kb;
                    mob.velY = -3;
                    createParticles(p.x, p.y, 5, "#ffaa00");
                    addFloatingText(mob.x + def.width / 2, mob.y - 10, `-${dmg}`, "#ff4444");
                    hitMob = true;
                    break;
                }
            }
            if (hitMob) { state.projectiles.splice(i, 1); continue; }
        } else {
            // Arrows hit player
            if (p.x >= state.player.x && p.x <= state.player.x + state.player.width &&
                p.y >= state.player.y && p.y <= state.player.y + state.player.height) {
                hurtPlayer(p.damage, p.x);
                createParticles(p.x, p.y, 3, "#8b6c42");
                state.projectiles.splice(i, 1);
                continue;
            }
        }

        const bx = Math.floor(p.x / BLOCK_SIZE);
        const by = Math.floor(p.y / BLOCK_SIZE);
        if (isBlockSolid(bx, by)) {
            createParticles(p.x, p.y, 3, p.isBullet ? "#ffaa00" : "#8b6c42");
            state.projectiles.splice(i, 1);
            continue;
        }

        if (p.life <= 0) { state.projectiles.splice(i, 1); continue; }
    }
}

// ============================================================
// PARTICLES
// ============================================================

export function updateParticles(dt) {
    for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x += p.velX;
        p.y += p.velY;
        p.velY += 0.1;
        p.life--;
        if (p.life <= 0) state.particles.splice(i, 1);
    }
}

// ============================================================
// MOB SPAWNING
// ============================================================

export function spawnMobs(dt, dayBrightness) {
    state.mobSpawnTimer -= dt;
    if (state.mobSpawnTimer > 0) return;
    state.mobSpawnTimer = MOB_SPAWN_INTERVAL;

    let hostileCount = 0, passiveCount = 0;
    for (const m of state.mobs) {
        if (MOB_DEFS[m.type].hostile) hostileCount++;
        else if (m.type !== "villager" && m.type !== "iron_golem") passiveCount++;
    }

    if (state.inNether) {
        if (hostileCount < MAX_HOSTILE_MOBS) {
            const pos = findSpawnPosition();
            if (pos) {
                const spawnBx = Math.floor(pos.x / BLOCK_SIZE);
                const netherBiome = state.netherBiomeMap[spawnBx];
                let type;
                if (netherBiome === NETHER_BIOMES.WARPED) {
                    // Warped biome: mostly endermen with occasional skeletons
                    const types = ["enderman", "enderman", "enderman", "enderman", "skeleton"];
                    type = types[Math.floor(Math.random() * types.length)];
                } else {
                    // Crimson biome: skeletons, pigmen, ghasts
                    const types = ["skeleton", "pigman", "pigman", "pigman", "ghast", "ghast"];
                    type = types[Math.floor(Math.random() * types.length)];
                }
                state.mobs.push(createMob(type, pos.x, pos.y));
                // Pigmen spawn in groups of 2-3
                if (type === "pigman") {
                    const groupSize = 1 + Math.floor(Math.random() * 2);
                    for (let g = 0; g < groupSize && hostileCount + g + 1 < MAX_HOSTILE_MOBS; g++) {
                        const offset = (Math.random() - 0.5) * 4 * BLOCK_SIZE;
                        state.mobs.push(createMob("pigman", pos.x + offset, pos.y));
                    }
                }
            }
        }
    } else {
        if (dayBrightness < NIGHT_THRESHOLD && hostileCount < MAX_HOSTILE_MOBS) {
            const pos = findSpawnPosition();
            if (pos) {
                const spawnBx = Math.floor(pos.x / BLOCK_SIZE);
                const isDesert = state.biomeMap[spawnBx] === BIOMES.DESERT;
                let type;
                if (isDesert) {
                    // Desert: husks replace zombies
                    const types = ["husk", "husk", "skeleton", "creeper"];
                    type = types[Math.floor(Math.random() * types.length)];
                } else {
                    const types = ["zombie", "zombie", "skeleton", "creeper", "enderman", "spider"];
                    type = types[Math.floor(Math.random() * types.length)];
                }
                state.mobs.push(createMob(type, pos.x, pos.y));
            }
        }

        if (dayBrightness > 0.5 && passiveCount < MAX_PASSIVE_MOBS) {
            const passiveTypes = ["pig", "pig", "cow", "sheep", "chicken", "chicken", "wolf"];
            const type = passiveTypes[Math.floor(Math.random() * passiveTypes.length)];
            const pos = findSpawnPosition();
            if (pos) {
                state.mobs.push(createMob(type, pos.x, pos.y));
                // Wolves spawn in packs of 2-3
                if (type === "wolf") {
                    const packSize = 1 + Math.floor(Math.random() * 2);
                    for (let g = 0; g < packSize && passiveCount + g + 1 < MAX_PASSIVE_MOBS; g++) {
                        const offset = (Math.random() - 0.5) * 5 * BLOCK_SIZE;
                        state.mobs.push(createMob("wolf", pos.x + offset, pos.y));
                    }
                }
            }
        }
    }
}

function findSpawnPosition() {
    const dir = Math.random() < 0.5 ? -1 : 1;
    const dist = 20 + Math.random() * 20;
    const sx = Math.floor(state.player.x / BLOCK_SIZE + dir * dist);

    if (sx < 2 || sx >= WORLD_WIDTH - 2) return null;

    const surfY = findSurfaceY(sx);
    if (surfY <= 1) return null;

    if (isBlockSolid(sx, surfY - 1) || isBlockSolid(sx, surfY - 2)) return null;

    // Don't spawn near torches (skip in Nether)
    if (!state.inNether) {
        for (let tx = sx - TORCH_SPAWN_RADIUS; tx <= sx + TORCH_SPAWN_RADIUS; tx++) {
            for (let ty = surfY - TORCH_SPAWN_RADIUS; ty <= surfY + TORCH_SPAWN_RADIUS; ty++) {
                if (tx >= 0 && tx < WORLD_WIDTH && ty >= 0 && ty < WORLD_HEIGHT) {
                    if (state.activeWorld[tx][ty] === BLOCKS.TORCH) {
                        const dx = tx - sx, dy = ty - surfY;
                        if (dx * dx + dy * dy <= TORCH_SPAWN_RADIUS * TORCH_SPAWN_RADIUS) {
                            return null;
                        }
                    }
                }
            }
        }
    }

    return { x: sx * BLOCK_SIZE, y: (surfY - 2) * BLOCK_SIZE };
}

export function spawnVillagers() {
    for (const loc of state.villageLocations) {
        const mob = createMob("villager", loc.x, loc.y);
        mob.spawnX = loc.x;
        const profession = PROFESSION_LIST[Math.floor(Math.random() * PROFESSION_LIST.length)];
        mob.profession = profession;
        mob.tradeList = TRADE_SETS[profession];
        state.mobs.push(mob);
    }
    // Spawn one Iron Golem per village to protect villagers
    const seen = new Set();
    for (const loc of state.villageLocations) {
        const key = `${Math.round(loc.x / BLOCK_SIZE / 10)}`;
        if (seen.has(key)) continue; // one golem per village cluster
        seen.add(key);
        const golem = createMob("iron_golem", loc.x, loc.y);
        golem.spawnX = loc.x;
        state.mobs.push(golem);
    }
}
