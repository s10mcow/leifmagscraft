// ============================================================
// MOBS.JS - Mob creation, AI, spawning, projectiles, particles
// ============================================================
// Zombies, skeletons, creepers, pigs! Plus the arrows they
// shoot and particle effects when things go boom.
// ============================================================

// --- MOBS ---
const mobs = [];
const MAX_HOSTILE_MOBS = 8;
const MAX_PASSIVE_MOBS = 4;
let mobSpawnTimer = 0;
const MOB_SPAWN_INTERVAL = 3000;

function createMob(type, x, y) {
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
        teleportTimer: 9999
    };
    // Random equipment for zombies, skeletons, husks
    if (type === "zombie" || type === "skeleton" || type === "husk") {
        const hasArmor = Math.random() < 0.15;
        const hasWeapon = (type !== "skeleton") && Math.random() < 0.10;
        if (hasArmor || hasWeapon) {
            mob.equipment = { armor: hasArmor, weapon: hasWeapon };
            if (hasArmor) mob.health += 4;
        }
    }
    return mob;
}

// --- PROJECTILES (skeleton arrows) ---
const projectiles = [];

function createArrow(x, y, targetX, targetY, damage) {
    playArrowShoot();
    const dx = targetX - x;
    const dy = targetY - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const speed = 6;
    projectiles.push({
        x, y,
        velX: (dx / dist) * speed,
        velY: (dy / dist) * speed - 2,
        damage,
        life: 180
    });
}

function createBullet(x, y, targetX, targetY, damage) {
    const dx = targetX - x;
    const dy = targetY - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const speed = 14;
    projectiles.push({
        x, y,
        velX: (dx / dist) * speed,
        velY: (dy / dist) * speed,
        damage,
        life: 60,
        isBullet: true
    });
}

function createRocket(x, y, targetX, targetY, damage) {
    const dx = targetX - x;
    const dy = targetY - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const speed = 8;
    projectiles.push({
        x, y,
        velX: (dx / dist) * speed,
        velY: (dy / dist) * speed,
        damage,
        life: 120,
        isRocket: true
    });
}

function rocketExplode(px, py, damage) {
    const cx = Math.floor(px / BLOCK_SIZE);
    const cy = Math.floor(py / BLOCK_SIZE);
    const radius = 3; // Same as creeper

    // Destroy blocks
    for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
            if (dx * dx + dy * dy <= radius * radius) {
                const bx = cx + dx, by = cy + dy;
                if (bx >= 0 && bx < WORLD_WIDTH && by >= 0 && by < WORLD_HEIGHT) {
                    if (activeWorld[bx][by] !== BLOCKS.BEDROCK && activeWorld[bx][by] !== BLOCKS.AIR) {
                        activeWorld[bx][by] = BLOCKS.AIR;
                    }
                }
            }
        }
    }

    // Damage nearby mobs
    for (let i = mobs.length - 1; i >= 0; i--) {
        const mob = mobs[i];
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
    const pcx = player.x + player.width / 2;
    const pcy = player.y + player.height / 2;
    const playerDist = Math.sqrt((px - pcx) * (px - pcx) + (py - pcy) * (py - pcy));
    if (playerDist < (radius + 2) * BLOCK_SIZE) {
        const dmg = Math.floor(damage * (1 - playerDist / ((radius + 2) * BLOCK_SIZE)));
        if (dmg > 0) hurtPlayer(dmg, px);
    }

    // Effects
    createParticles(px, py, 40, "#ff8800", 8);
    createParticles(px, py, 20, "#ffff00", 6);
    screenShake.intensity = 15;
    playExplosion();
    addFloatingText(px, py - 20, "BOOM!", "#ff4444");
}

// --- PARTICLES (explosions, death poof, hit effects) ---
const particles = [];

function createParticles(x, y, count, color, speed = 3) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const vel = Math.random() * speed;
        particles.push({
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

function distToPlayer(mob) {
    return Math.sqrt(
        Math.pow(player.x + player.width / 2 - (mob.x + MOB_DEFS[mob.type].width / 2), 2) +
        Math.pow(player.y + player.height / 2 - (mob.y + MOB_DEFS[mob.type].height / 2), 2)
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

function updateMobs(dt, dayBrightness) {
    for (let i = mobs.length - 1; i >= 0; i--) {
        const mob = mobs[i];
        const def = MOB_DEFS[mob.type];

        if (mob.hurtTimer > 0) mob.hurtTimer -= dt;
        if (mob.attackCooldown > 0) mob.attackCooldown -= dt;

        // Death check
        if (mob.health <= 0 && !mob.dead) {
            mob.dead = true;
            createParticles(mob.x + def.width / 2, mob.y + def.height / 2, 12, "#aaaaaa", 4);
            for (const drop of def.drops) {
                const count = drop.min + Math.floor(Math.random() * (drop.max - drop.min + 1));
                if (count > 0) addToInventory(drop.id, count);
                addFloatingText(mob.x + def.width / 2, mob.y, `+${count} ${getItemName(drop.id)}`, "#ffd700");
            }
            mobs.splice(i, 1);
            continue;
        }

        // Despawn if too far (not villagers - they're permanent)
        if (mob.type !== "villager" && distToPlayer(mob) > 60 * BLOCK_SIZE) {
            mobs.splice(i, 1);
            continue;
        }

        // Sunlight burning (zombies/skeletons, not creepers/husks/endermen, not in Nether)
        if (def.hostile && mob.type !== "creeper" && mob.type !== "husk" && mob.type !== "enderman" && mob.type !== "spider" && dayBrightness > 0.6 && !inNether) {
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
        const dirToPlayer = player.x > mob.x ? 1 : -1;

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
                mob.wanderTimer -= dt;
                if (mob.wanderTimer <= 0) {
                    mob.wanderDir = Math.random() < 0.5 ? -1 : 1;
                    mob.wanderTimer = 2000 + Math.random() * 3000;
                }
                mob.velX = mob.wanderDir * def.speed * 0.3;
                mob.facing = mob.wanderDir;
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
                        player.x + player.width / 2, player.y + player.height / 2,
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
                        mobs.splice(i, 1);
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
                const fleeDir = player.x > mob.x ? -1 : 1;
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
                const fleeDir = player.x > mob.x ? -1 : 1;
                mob.velX = fleeDir * def.speed * 2;
                mob.facing = fleeDir;
            } else {
                mob.velX = mob.wanderDir * def.speed * 0.4;
                if (mob.wanderDir !== 0) mob.facing = mob.wanderDir;
            }
        }

        else if (mob.type === "villager") {
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
                mob.wanderTimer -= dt;
                if (mob.wanderTimer <= 0) {
                    mob.wanderDir = Math.random() < 0.5 ? -1 : 1;
                    mob.wanderTimer = 2000 + Math.random() * 3000;
                }
                mob.velX = mob.wanderDir * def.speed * 0.3;
                mob.facing = mob.wanderDir;
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
                    const cursorWorldX = mouse.x + camera.x;
                    const cursorWorldY = mouse.y + camera.y;
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
                    const tpDir = player.x > mob.x ? 1 : -1;
                    const tpDist = 3 + Math.floor(Math.random() * 3);
                    const newX = player.x + tpDir * (-tpDist * BLOCK_SIZE);
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
                    const fleeDir = player.x > mob.x ? -1 : 1;
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
                const fleeDir = player.x > mob.x ? -1 : 1;
                mob.velX = fleeDir * def.speed * 2.5;
                mob.facing = fleeDir;
            } else {
                mob.velX = mob.wanderDir * def.speed * 0.4;
                if (mob.wanderDir !== 0) mob.facing = mob.wanderDir;
            }
            // Chickens fall slowly (flutter)
            if (mob.velY > 2) mob.velY = 2;
        }

        mobPhysics(mob, def);

        if (mob.x < 0) mob.x = 0;
        if (mob.x > (WORLD_WIDTH - 1) * BLOCK_SIZE) mob.x = (WORLD_WIDTH - 1) * BLOCK_SIZE;
        if (mob.y > WORLD_HEIGHT * BLOCK_SIZE) { mobs.splice(i, 1); continue; }

        // Contact damage for zombie/husk/spider
        if ((mob.type === "zombie" || mob.type === "husk" || mob.type === "spider") && mob.attackCooldown <= 0) {
            const px = player.x, py = player.y;
            if (mob.x < px + player.width && mob.x + def.width > px &&
                mob.y < py + player.height && mob.y + def.height > py) {
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

function creeperExplode(mob) {
    const def = MOB_DEFS.creeper;
    const cx = Math.floor((mob.x + def.width / 2) / BLOCK_SIZE);
    const cy = Math.floor((mob.y + def.height / 2) / BLOCK_SIZE);
    const radius = def.explosionRadius;

    for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
            if (dx * dx + dy * dy <= radius * radius) {
                const bx = cx + dx, by = cy + dy;
                if (bx >= 0 && bx < WORLD_WIDTH && by >= 0 && by < WORLD_HEIGHT) {
                    if (activeWorld[bx][by] !== BLOCKS.BEDROCK && activeWorld[bx][by] !== BLOCKS.AIR) {
                        activeWorld[bx][by] = BLOCKS.AIR;
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
    screenShake.intensity = 15;
    playExplosion();
    addFloatingText(mob.x + def.width / 2, mob.y - 20, "BOOM!", "#ff4444");
}

// ============================================================
// PROJECTILES (arrows)
// ============================================================

function updateProjectiles(dt) {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        if (!p.isBullet && !p.isRocket) p.velY += 0.15; // Gravity for arrows only
        if (p.isRocket) p.velY += 0.05; // Slight gravity for rockets
        p.x += p.velX;
        p.y += p.velY;
        p.life--;

        if (p.isRocket) {
            // Rockets explode on hitting a mob, block, or at end of life
            let hit = false;

            // Check mob collision
            for (let j = mobs.length - 1; j >= 0; j--) {
                const mob = mobs[j];
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
                projectiles.splice(i, 1);
                continue;
            }
        } else if (p.isBullet) {
            // Bullets hit mobs (fired by player)
            let hitMob = false;
            for (let j = mobs.length - 1; j >= 0; j--) {
                const mob = mobs[j];
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
            if (hitMob) { projectiles.splice(i, 1); continue; }
        } else {
            // Arrows hit player
            if (p.x >= player.x && p.x <= player.x + player.width &&
                p.y >= player.y && p.y <= player.y + player.height) {
                hurtPlayer(p.damage, p.x);
                createParticles(p.x, p.y, 3, "#8b6c42");
                projectiles.splice(i, 1);
                continue;
            }
        }

        const bx = Math.floor(p.x / BLOCK_SIZE);
        const by = Math.floor(p.y / BLOCK_SIZE);
        if (isBlockSolid(bx, by)) {
            createParticles(p.x, p.y, 3, p.isBullet ? "#ffaa00" : "#8b6c42");
            projectiles.splice(i, 1);
            continue;
        }

        if (p.life <= 0) { projectiles.splice(i, 1); continue; }
    }
}

// ============================================================
// PARTICLES
// ============================================================

function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.velX;
        p.y += p.velY;
        p.velY += 0.1;
        p.life--;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

// ============================================================
// MOB SPAWNING
// ============================================================

function spawnMobs(dt, dayBrightness) {
    mobSpawnTimer -= dt;
    if (mobSpawnTimer > 0) return;
    mobSpawnTimer = MOB_SPAWN_INTERVAL;

    let hostileCount = 0, passiveCount = 0;
    for (const m of mobs) {
        if (MOB_DEFS[m.type].hostile) hostileCount++;
        else if (m.type !== "villager") passiveCount++;
    }

    if (inNether) {
        // Nether: always spawn hostiles, no passive mobs
        if (hostileCount < MAX_HOSTILE_MOBS) {
            const types = ["zombie", "zombie", "skeleton", "skeleton", "creeper"];
            const type = types[Math.floor(Math.random() * types.length)];
            const pos = findSpawnPosition();
            if (pos) mobs.push(createMob(type, pos.x, pos.y));
        }
    } else {
        if (dayBrightness < NIGHT_THRESHOLD && hostileCount < MAX_HOSTILE_MOBS) {
            const pos = findSpawnPosition();
            if (pos) {
                const spawnBx = Math.floor(pos.x / BLOCK_SIZE);
                const isDesert = biomeMap[spawnBx] === BIOMES.DESERT;
                let type;
                if (isDesert) {
                    // Desert: husks replace zombies
                    const types = ["husk", "husk", "skeleton", "creeper"];
                    type = types[Math.floor(Math.random() * types.length)];
                } else {
                    const types = ["zombie", "zombie", "skeleton", "creeper", "enderman", "spider"];
                    type = types[Math.floor(Math.random() * types.length)];
                }
                mobs.push(createMob(type, pos.x, pos.y));
            }
        }

        if (dayBrightness > 0.5 && passiveCount < MAX_PASSIVE_MOBS) {
            const passiveTypes = ["pig", "pig", "cow", "sheep", "chicken", "chicken"];
            const pos = findSpawnPosition();
            if (pos) mobs.push(createMob(type, pos.x, pos.y));
        }
    }
}

function findSpawnPosition() {
    const dir = Math.random() < 0.5 ? -1 : 1;
    const dist = 20 + Math.random() * 20;
    const sx = Math.floor(player.x / BLOCK_SIZE + dir * dist);

    if (sx < 2 || sx >= WORLD_WIDTH - 2) return null;

    const surfY = findSurfaceY(sx);
    if (surfY <= 1) return null;

    if (isBlockSolid(sx, surfY - 1) || isBlockSolid(sx, surfY - 2)) return null;

    // Don't spawn near torches (skip in Nether)
    if (!inNether) {
        for (let tx = sx - TORCH_SPAWN_RADIUS; tx <= sx + TORCH_SPAWN_RADIUS; tx++) {
            for (let ty = surfY - TORCH_SPAWN_RADIUS; ty <= surfY + TORCH_SPAWN_RADIUS; ty++) {
                if (tx >= 0 && tx < WORLD_WIDTH && ty >= 0 && ty < WORLD_HEIGHT) {
                    if (activeWorld[tx][ty] === BLOCKS.TORCH) {
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

function spawnVillagers() {
    for (const loc of villageLocations) {
        const mob = createMob("villager", loc.x, loc.y);
        mob.spawnX = loc.x;
        mobs.push(mob);
    }
}
