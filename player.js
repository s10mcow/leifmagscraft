// ============================================================
// PLAYER.JS - Player state, physics, camera, and combat
// ============================================================
// The player character: movement, gravity, collisions,
// fall damage, attacking mobs, and the camera that follows.
// ============================================================

// --- PLAYER ---
const player = {
    x: 0, y: 0, width: 24, height: 46,
    velX: 0, velY: 0,
    speed: 4, jumpForce: -9.5,
    onGround: false, facing: 1,
    health: 20, maxHealth: 20,
    invincibleTimer: 0,
    attackCooldown: 0,
    fallStartY: 0,
    isFalling: false
};

const camera = { x: 0, y: 0 };
const screenShake = { x: 0, y: 0, intensity: 0 };
let portalCooldown = 0;

// Pressure plate door auto-close timers: [{x, y, timer}]
const plateTimers = [];

// ============================================================
// PLAYER PHYSICS
// ============================================================

function updatePlayer(dt) {
    if (gameOver) return;

    if (player.invincibleTimer > 0) player.invincibleTimer -= dt;
    if (player.attackCooldown > 0) player.attackCooldown -= dt;

    // Movement (disabled during crafting)
    if (!craftingOpen && !chestOpen) {
        if (keys["ArrowLeft"] || keys["a"] || keys["A"]) {
            player.velX = -player.speed;
            player.facing = -1;
        } else if (keys["ArrowRight"] || keys["d"] || keys["D"]) {
            player.velX = player.speed;
            player.facing = 1;
        } else {
            player.velX *= 0.7;
            if (Math.abs(player.velX) < 0.1) player.velX = 0;
        }
        if ((keys["ArrowUp"] || keys["w"] || keys["W"] || keys[" "]) && player.onGround) {
            player.velY = player.jumpForce;
            player.onGround = false;
            playJump();
        }
        if (player.onGround && Math.abs(player.velX) > 1) {
            playFootstep();
        }
    }

    // Gravity
    player.velY += GRAVITY;
    if (player.velY > MAX_FALL_SPEED) player.velY = MAX_FALL_SPEED;

    // Horizontal collision
    const pTop = Math.floor(player.y / BLOCK_SIZE);
    const pBot = Math.floor((player.y + player.height - 1) / BLOCK_SIZE);
    if (player.velX < 0) {
        const gx = Math.floor((player.x + player.velX) / BLOCK_SIZE);
        for (let gy = pTop; gy <= pBot; gy++) {
            if (isBlockSolid(gx, gy)) { player.x = (gx + 1) * BLOCK_SIZE; player.velX = 0; break; }
        }
    }
    if (player.velX > 0) {
        const gx = Math.floor((player.x + player.velX + player.width - 1) / BLOCK_SIZE);
        for (let gy = pTop; gy <= pBot; gy++) {
            if (isBlockSolid(gx, gy)) { player.x = gx * BLOCK_SIZE - player.width; player.velX = 0; break; }
        }
    }
    player.x += player.velX;

    // Vertical collision
    const pLeft = Math.floor(player.x / BLOCK_SIZE);
    const pRight = Math.floor((player.x + player.width - 1) / BLOCK_SIZE);
    player.onGround = false;

    // Track when we start falling
    if (player.velY > 0 && !player.isFalling) {
        player.isFalling = true;
        player.fallStartY = player.y;
    }

    if (player.velY > 0) {
        const gy = Math.floor((player.y + player.velY + player.height - 1) / BLOCK_SIZE);
        for (let gx = pLeft; gx <= pRight; gx++) {
            if (isBlockSolid(gx, gy)) {
                if (player.isFalling) {
                    const fallBlocks = (player.y - player.fallStartY) / BLOCK_SIZE;
                    if (fallBlocks > SAFE_FALL_BLOCKS) {
                        const damage = Math.floor(fallBlocks - SAFE_FALL_BLOCKS);
                        player.health = Math.max(0, player.health - damage);
                        if (damage > 0) {
                            playHurt();
                            addFloatingText(player.x, player.y - 20, `-${damage} Fall damage!`, "#ff4444");
                            createParticles(player.x + player.width / 2, player.y + player.height, 6, "#8b6914");
                        }
                    }
                    player.isFalling = false;
                }
                if (player.velY > 3) playLand();
                player.y = gy * BLOCK_SIZE - player.height;
                player.velY = 0;
                player.onGround = true;
                break;
            }
        }
    }
    if (player.velY < 0) {
        player.isFalling = false;
        const gy = Math.floor((player.y + player.velY) / BLOCK_SIZE);
        for (let gx = pLeft; gx <= pRight; gx++) {
            if (isBlockSolid(gx, gy)) { player.y = (gy + 1) * BLOCK_SIZE; player.velY = 0; break; }
        }
    }
    player.y += player.velY;

    // World bounds
    if (player.x < 0) player.x = 0;
    if (player.x > (WORLD_WIDTH - 1) * BLOCK_SIZE) player.x = (WORLD_WIDTH - 1) * BLOCK_SIZE;
    if (player.y > WORLD_HEIGHT * BLOCK_SIZE) respawnPlayer();

    // Check blocks player is standing in
    const footX = Math.floor((player.x + player.width / 2) / BLOCK_SIZE);
    const footY = Math.floor((player.y + player.height - 1) / BLOCK_SIZE);
    if (footX >= 0 && footX < WORLD_WIDTH && footY >= 0 && footY < WORLD_HEIGHT) {
        const standBlock = activeWorld[footX][footY];
        // Lava damage
        if (standBlock === BLOCKS.LAVA) {
            if (player.invincibleTimer <= 0) {
                player.health = Math.max(0, player.health - 2);
                player.invincibleTimer = 500;
                playHurt();
                addFloatingText(player.x, player.y - 20, "-2 Lava!", "#ff4444");
                createParticles(player.x + player.width / 2, player.y + player.height, 4, "#ff6600");
            }
        }
        // Soul sand slowdown
        if (standBlock === BLOCKS.SOUL_SAND || (footY + 1 < WORLD_HEIGHT && activeWorld[footX][footY + 1] === BLOCKS.SOUL_SAND)) {
            player.velX *= 0.5;
        }
        // Portal teleport
        if (standBlock === BLOCKS.NETHER_PORTAL && portalCooldown <= 0) {
            teleportToOtherDimension();
        }
        // Pressure plate - check block at feet or one below feet
        const plateBlock = activeWorld[footX][footY];
        const belowBlock = (footY + 1 < WORLD_HEIGHT) ? activeWorld[footX][footY + 1] : BLOCKS.AIR;
        const plateX = (plateBlock === BLOCKS.PRESSURE_PLATE) ? footX : ((belowBlock === BLOCKS.PRESSURE_PLATE) ? footX : -1);
        const plateY = (plateBlock === BLOCKS.PRESSURE_PLATE) ? footY : ((belowBlock === BLOCKS.PRESSURE_PLATE) ? footY + 1 : -1);
        if (plateX >= 0) {
            activatePressurePlate(plateX, plateY);
        }
    }

    // Check if dead
    if (player.health <= 0 && !gameOver) {
        gameOver = true;
        createParticles(player.x + player.width / 2, player.y + player.height / 2, 20, "#ff0000", 5);
    }
}

function updateCamera() {
    const targetX = player.x - canvas.width / 2 + player.width / 2;
    const targetY = player.y - canvas.height / 2 + player.height / 2;
    camera.x += (targetX - camera.x) * 0.1;
    camera.y += (targetY - camera.y) * 0.1;
    camera.x = Math.max(0, Math.min(camera.x, WORLD_WIDTH * BLOCK_SIZE - canvas.width));
    camera.y = Math.max(0, Math.min(camera.y, WORLD_HEIGHT * BLOCK_SIZE - canvas.height));

    if (screenShake.intensity > 0) {
        screenShake.x = (Math.random() - 0.5) * screenShake.intensity;
        screenShake.y = (Math.random() - 0.5) * screenShake.intensity;
        screenShake.intensity *= 0.9;
        if (screenShake.intensity < 0.5) { screenShake.intensity = 0; screenShake.x = 0; screenShake.y = 0; }
    }
}

function activatePressurePlate(px, py) {
    // Search nearby for closed doors (3 blocks in each direction)
    const range = 3;
    for (let dx = -range; dx <= range; dx++) {
        for (let dy = -range; dy <= range; dy++) {
            const bx = px + dx, by = py + dy;
            if (bx < 0 || bx >= WORLD_WIDTH || by < 0 || by >= WORLD_HEIGHT) continue;
            if (activeWorld[bx][by] === BLOCKS.DOOR_CLOSED) {
                toggleDoor(bx, by);
                // Add auto-close timer (only if not already tracked)
                const existing = plateTimers.find(t => t.x === bx && t.y === by);
                if (!existing) {
                    plateTimers.push({ x: bx, y: by, timer: 3000 });
                } else {
                    existing.timer = 3000; // Reset timer
                }
            }
        }
    }
}

function updatePlateTimers(dt) {
    for (let i = plateTimers.length - 1; i >= 0; i--) {
        const t = plateTimers[i];
        t.timer -= dt;
        if (t.timer <= 0) {
            // Auto-close if door is still open
            if (t.x >= 0 && t.x < WORLD_WIDTH && t.y >= 0 && t.y < WORLD_HEIGHT) {
                if (activeWorld[t.x][t.y] === BLOCKS.DOOR_OPEN) {
                    toggleDoor(t.x, t.y);
                }
            }
            plateTimers.splice(i, 1);
        }
    }
}

function respawnPlayer() {
    const spawnX = Math.floor(WORLD_WIDTH / 2);
    player.x = spawnX * BLOCK_SIZE;
    player.y = (findSurfaceY(spawnX) - 2) * BLOCK_SIZE;
    player.velX = 0;
    player.velY = 0;
    player.health = player.maxHealth;
    player.invincibleTimer = 2000;
    gameOver = false;
}

// ============================================================
// COMBAT
// ============================================================

function hurtPlayer(damage, knockFromX) {
    if (player.invincibleTimer > 0 || gameOver) return;
    const armorDef = getArmorDefense();
    const actualDamage = Math.max(1, damage - armorDef);
    player.health = Math.max(0, player.health - actualDamage);
    player.invincibleTimer = 500;
    playHurt();
    if (armorDef > 0) {
        damageAllArmor();
        addFloatingText(player.x + 20, player.y - 10, `Armor blocked ${damage - actualDamage}!`, "#4ade80");
    }
    const dir = player.x > knockFromX ? 1 : -1;
    player.velX = dir * 6;
    player.velY = -4;
    createParticles(player.x + player.width / 2, player.y + player.height / 2, 5, "#ff0000");
}

function attackMob(mob) {
    if (player.attackCooldown > 0) return;
    const def = MOB_DEFS[mob.type];

    const tool = getEquippedTool();
    let damage = 1;
    if (tool) {
        if (tool.toolType === "sword") damage = tool.damage;
        else damage = 2;
        damageEquippedTool();
    }

    mob.health -= damage;
    mob.hurtTimer = 200;
    player.attackCooldown = 400;
    playMobHit();

    const dir = mob.x > player.x ? 1 : -1;
    mob.velX = dir * (def.knockback || 4);
    mob.velY = -3;

    addFloatingText(mob.x + def.width / 2, mob.y - 10, `-${damage}`, "#ff4444");
    createParticles(mob.x + def.width / 2, mob.y + def.height / 2, 4, "#ff0000");

    if (mob.type === "creeper" && mob.fusing) {
        mob.fusing = false;
        mob.fuseTimer = 0;
    }
}

function getMobAtCursor() {
    const worldX = mouse.x + camera.x;
    const worldY = mouse.y + camera.y;
    for (const mob of mobs) {
        if (mob.dead) continue;
        const def = MOB_DEFS[mob.type];
        if (worldX >= mob.x && worldX <= mob.x + def.width &&
            worldY >= mob.y && worldY <= mob.y + def.height) {
            const dist = Math.sqrt(
                Math.pow(player.x + player.width / 2 - (mob.x + def.width / 2), 2) +
                Math.pow(player.y + player.height / 2 - (mob.y + def.height / 2), 2)
            );
            if (dist < BLOCK_SIZE * PLAYER_REACH) return mob;
        }
    }
    return null;
}
