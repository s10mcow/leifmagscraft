// ============================================================
// PLAYER.JS - Player state, physics, camera, and combat
// ============================================================
// The player character: movement, gravity, collisions,
// fall damage, attacking mobs, and the camera that follows.
// ============================================================

import { state } from './state.js';
import { BLOCKS, ITEMS, BLOCK_SIZE, WORLD_WIDTH, WORLD_HEIGHT, GRAVITY, MAX_FALL_SPEED, PLAYER_REACH, SAFE_FALL_BLOCKS, MOB_DEFS, ITEM_INFO } from './constants.js';
import { isBlockSolid, findSurfaceY } from './world.js';
import { addFloatingText, getEquippedTool, getEquippedTier, getArmorDefense, damageAllArmor, damageEquippedTool } from './inventory.js';
import { playJump, playFootstep, playLand, playHurt, playMobHit, playBlockPlace, playSelect, playToolBreak } from './audio.js';
import { createParticles } from './mobs.js';

// Lazy import for toggleDoor (lives in game.js) to avoid circular dependencies
let _toggleDoor = null;
export function setToggleDoor(fn) { _toggleDoor = fn; }

// Lazy import for teleportToOtherDimension (lives in game.js) to avoid circular dependencies
let _teleportToOtherDimension = null;
export function setTeleportToOtherDimension(fn) { _teleportToOtherDimension = fn; }

// ============================================================
// PLAYER PHYSICS
// ============================================================

export function updatePlayer(dt) {
    if (state.gameOver) return;

    if (state.player.invincibleTimer > 0) state.player.invincibleTimer -= dt;
    if (state.player.attackCooldown > 0) state.player.attackCooldown -= dt;

    // Crouching (Shift key)
    state.player.crouching = !!state.keys["Shift"];

    // Movement (disabled during crafting)
    if (!state.craftingOpen && !state.chestOpen) {
        const moveSpeed = state.player.crouching ? state.player.speed * 0.4 : state.player.speed;
        if (state.keys["ArrowLeft"] || state.keys["a"] || state.keys["A"]) {
            state.player.velX = -moveSpeed;
            state.player.facing = -1;
        } else if (state.keys["ArrowRight"] || state.keys["d"] || state.keys["D"]) {
            state.player.velX = moveSpeed;
            state.player.facing = 1;
        } else {
            state.player.velX *= 0.7;
            if (Math.abs(state.player.velX) < 0.1) state.player.velX = 0;
        }
        if (!state.player.crouching && (state.keys["ArrowUp"] || state.keys["w"] || state.keys["W"] || state.keys[" "]) && state.player.onGround) {
            state.player.velY = state.player.jumpForce;
            state.player.onGround = false;
            playJump();
        }
        if (state.player.onGround && Math.abs(state.player.velX) > 1) {
            playFootstep();
        }
    }

    // Gravity
    state.player.velY += GRAVITY;
    if (state.player.velY > MAX_FALL_SPEED) state.player.velY = MAX_FALL_SPEED;

    // Horizontal collision
    const pTop = Math.floor(state.player.y / BLOCK_SIZE);
    const pBot = Math.floor((state.player.y + state.player.height - 1) / BLOCK_SIZE);
    if (state.player.velX < 0) {
        const gx = Math.floor((state.player.x + state.player.velX) / BLOCK_SIZE);
        for (let gy = pTop; gy <= pBot; gy++) {
            if (isBlockSolid(gx, gy)) { state.player.x = (gx + 1) * BLOCK_SIZE; state.player.velX = 0; break; }
        }
    }
    if (state.player.velX > 0) {
        const gx = Math.floor((state.player.x + state.player.velX + state.player.width - 1) / BLOCK_SIZE);
        for (let gy = pTop; gy <= pBot; gy++) {
            if (isBlockSolid(gx, gy)) { state.player.x = gx * BLOCK_SIZE - state.player.width; state.player.velX = 0; break; }
        }
    }
    state.player.x += state.player.velX;

    // Vertical collision
    const pLeft = Math.floor(state.player.x / BLOCK_SIZE);
    const pRight = Math.floor((state.player.x + state.player.width - 1) / BLOCK_SIZE);
    state.player.onGround = false;

    // Track when we start falling
    if (state.player.velY > 0 && !state.player.isFalling) {
        state.player.isFalling = true;
        state.player.fallStartY = state.player.y;
    }

    if (state.player.velY > 0) {
        const gy = Math.floor((state.player.y + state.player.velY + state.player.height - 1) / BLOCK_SIZE);
        for (let gx = pLeft; gx <= pRight; gx++) {
            if (isBlockSolid(gx, gy)) {
                if (state.player.isFalling) {
                    const fallBlocks = (state.player.y - state.player.fallStartY) / BLOCK_SIZE;
                    if (fallBlocks > SAFE_FALL_BLOCKS) {
                        const damage = Math.floor(fallBlocks - SAFE_FALL_BLOCKS);
                        state.player.health = Math.max(0, state.player.health - damage);
                        if (damage > 0) {
                            playHurt();
                            addFloatingText(state.player.x, state.player.y - 20, `-${damage} Fall damage!`, "#ff4444");
                            createParticles(state.player.x + state.player.width / 2, state.player.y + state.player.height, 6, "#8b6914");
                        }
                    }
                    state.player.isFalling = false;
                }
                if (state.player.velY > 3) playLand();
                state.player.y = gy * BLOCK_SIZE - state.player.height;
                state.player.velY = 0;
                state.player.onGround = true;
                break;
            }
        }
    }
    if (state.player.velY < 0) {
        state.player.isFalling = false;
        const gy = Math.floor((state.player.y + state.player.velY) / BLOCK_SIZE);
        for (let gx = pLeft; gx <= pRight; gx++) {
            if (isBlockSolid(gx, gy)) { state.player.y = (gy + 1) * BLOCK_SIZE; state.player.velY = 0; break; }
        }
    }
    state.player.y += state.player.velY;

    // World bounds
    if (state.player.x < 0) state.player.x = 0;
    if (state.player.x > (WORLD_WIDTH - 1) * BLOCK_SIZE) state.player.x = (WORLD_WIDTH - 1) * BLOCK_SIZE;
    if (state.player.y > WORLD_HEIGHT * BLOCK_SIZE) respawnPlayer();

    // Check blocks player is standing in
    const footX = Math.floor((state.player.x + state.player.width / 2) / BLOCK_SIZE);
    const footY = Math.floor((state.player.y + state.player.height - 1) / BLOCK_SIZE);
    if (footX >= 0 && footX < WORLD_WIDTH && footY >= 0 && footY < WORLD_HEIGHT) {
        const standBlock = state.activeWorld[footX][footY];
        // Lava damage
        if (standBlock === BLOCKS.LAVA) {
            if (state.player.invincibleTimer <= 0) {
                state.player.health = Math.max(0, state.player.health - 2);
                state.player.invincibleTimer = 500;
                playHurt();
                addFloatingText(state.player.x, state.player.y - 20, "-2 Lava!", "#ff4444");
                createParticles(state.player.x + state.player.width / 2, state.player.y + state.player.height, 4, "#ff6600");
            }
        }
        // Soul sand slowdown
        if (standBlock === BLOCKS.SOUL_SAND || (footY + 1 < WORLD_HEIGHT && state.activeWorld[footX][footY + 1] === BLOCKS.SOUL_SAND)) {
            state.player.velX *= 0.5;
        }
        // Portal teleport
        if (standBlock === BLOCKS.NETHER_PORTAL && state.portalCooldown <= 0) {
            _teleportToOtherDimension();
        }
        // Pressure plate - check block at feet or one below feet
        const plateBlock = state.activeWorld[footX][footY];
        const belowBlock = (footY + 1 < WORLD_HEIGHT) ? state.activeWorld[footX][footY + 1] : BLOCKS.AIR;
        const plateX = (plateBlock === BLOCKS.PRESSURE_PLATE) ? footX : ((belowBlock === BLOCKS.PRESSURE_PLATE) ? footX : -1);
        const plateY = (plateBlock === BLOCKS.PRESSURE_PLATE) ? footY : ((belowBlock === BLOCKS.PRESSURE_PLATE) ? footY + 1 : -1);
        if (plateX >= 0) {
            activatePressurePlate(plateX, plateY);
        }
    }

    // Check if dead
    if (state.player.health <= 0 && !state.gameOver) {
        state.gameOver = true;
        createParticles(state.player.x + state.player.width / 2, state.player.y + state.player.height / 2, 20, "#ff0000", 5);
    }
}

export function updateCamera() {
    const targetX = state.player.x - state.canvas.width / 2 + state.player.width / 2;
    const targetY = state.player.y - state.canvas.height / 2 + state.player.height / 2;
    state.camera.x += (targetX - state.camera.x) * 0.1;
    state.camera.y += (targetY - state.camera.y) * 0.1;
    state.camera.x = Math.max(0, Math.min(state.camera.x, WORLD_WIDTH * BLOCK_SIZE - state.canvas.width));
    state.camera.y = Math.max(0, Math.min(state.camera.y, WORLD_HEIGHT * BLOCK_SIZE - state.canvas.height));

    if (state.screenShake.intensity > 0) {
        state.screenShake.x = (Math.random() - 0.5) * state.screenShake.intensity;
        state.screenShake.y = (Math.random() - 0.5) * state.screenShake.intensity;
        state.screenShake.intensity *= 0.9;
        if (state.screenShake.intensity < 0.5) { state.screenShake.intensity = 0; state.screenShake.x = 0; state.screenShake.y = 0; }
    }
}

export function activatePressurePlate(px, py) {
    // Search nearby for closed doors (3 blocks in each direction)
    const range = 3;
    for (let dx = -range; dx <= range; dx++) {
        for (let dy = -range; dy <= range; dy++) {
            const bx = px + dx, by = py + dy;
            if (bx < 0 || bx >= WORLD_WIDTH || by < 0 || by >= WORLD_HEIGHT) continue;
            const block = state.activeWorld[bx][by];
            if (block === BLOCKS.DOOR_CLOSED) {
                _toggleDoor(bx, by);
                const existing = state.plateTimers.find(t => t.x === bx && t.y === by);
                if (!existing) {
                    state.plateTimers.push({ x: bx, y: by, timer: 3000 });
                } else {
                    existing.timer = 3000;
                }
            } else if (block === BLOCKS.DOOR_OPEN) {
                // Door already open (opened from inside) — refresh the auto-close timer
                const existing = state.plateTimers.find(t => t.x === bx && t.y === by);
                if (!existing) {
                    state.plateTimers.push({ x: bx, y: by, timer: 3000 });
                } else {
                    existing.timer = 3000;
                }
            }
        }
    }
}

export function updatePlateTimers(dt) {
    for (let i = state.plateTimers.length - 1; i >= 0; i--) {
        const t = state.plateTimers[i];
        t.timer -= dt;
        if (t.timer <= 0) {
            // Auto-close if door is still open
            if (t.x >= 0 && t.x < WORLD_WIDTH && t.y >= 0 && t.y < WORLD_HEIGHT) {
                if (state.activeWorld[t.x][t.y] === BLOCKS.DOOR_OPEN) {
                    _toggleDoor(t.x, t.y);
                }
            }
            state.plateTimers.splice(i, 1);
        }
    }
}

export function respawnPlayer() {
    const spawnX = Math.floor(WORLD_WIDTH / 2);
    state.player.x = spawnX * BLOCK_SIZE;
    state.player.y = (findSurfaceY(spawnX) - 2) * BLOCK_SIZE;
    state.player.velX = 0;
    state.player.velY = 0;
    state.player.health = state.player.maxHealth;
    state.player.invincibleTimer = 2000;
    state.gameOver = false;
}

// ============================================================
// COMBAT
// ============================================================

export function hurtPlayer(damage, knockFromX) {
    if (state.player.invincibleTimer > 0 || state.gameOver) return;

    // Shield block: crouching + shield in offhand + attack from the facing side
    if (state.player.crouching && state.offhand && state.offhand.itemId === ITEMS.SHIELD && state.offhand.durability > 0) {
        const attackFromLeft = knockFromX < state.player.x + state.player.width / 2;
        const facingLeft = state.player.facing === -1;
        if (attackFromLeft === facingLeft) {
            state.offhand.durability--;
            if (state.offhand.durability <= 0) {
                state.offhand.itemId = 0; state.offhand.count = 0; state.offhand.durability = 0;
                addFloatingText(state.player.x, state.player.y - 30, "Shield broke!", "#ef4444");
                playToolBreak();
            } else {
                addFloatingText(state.player.x + 20, state.player.y - 10, "Blocked!", "#4ade80");
            }
            state.screenShake.intensity = 3;
            return;
        }
    }

    const armorDef = getArmorDefense();
    const actualDamage = Math.max(1, damage - armorDef);
    state.player.health = Math.max(0, state.player.health - actualDamage);
    state.player.invincibleTimer = 500;
    playHurt();
    if (armorDef > 0) {
        damageAllArmor();
        addFloatingText(state.player.x + 20, state.player.y - 10, `Armor blocked ${damage - actualDamage}!`, "#4ade80");
    }
    const dir = state.player.x > knockFromX ? 1 : -1;
    state.player.velX = dir * 6;
    state.player.velY = -4;
    createParticles(state.player.x + state.player.width / 2, state.player.y + state.player.height / 2, 5, "#ff0000");
}

export function attackMob(mob) {
    if (state.player.attackCooldown > 0) return;
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
    state.player.attackCooldown = 400;
    playMobHit();

    // Wolf pack provocation: hitting any wolf causes nearby wild wolves to attack
    if (mob.type === "wolf" && !mob.tamed) {
        mob.provoked = true;
        for (const other of state.mobs) {
            if (other === mob || other.type !== "wolf" || other.tamed) continue;
            const dx = other.x - mob.x, dy = other.y - mob.y;
            if (Math.sqrt(dx * dx + dy * dy) < 10 * BLOCK_SIZE) other.provoked = true;
        }
    }

    const dir = mob.x > state.player.x ? 1 : -1;
    mob.velX = dir * (def.knockback || 4);
    mob.velY = -3;

    addFloatingText(mob.x + def.width / 2, mob.y - 10, `-${damage}`, "#ff4444");
    createParticles(mob.x + def.width / 2, mob.y + def.height / 2, 4, "#ff0000");

    if (mob.type === "creeper" && mob.fusing) {
        mob.fusing = false;
        mob.fuseTimer = 0;
    }
}

export function getMobAtCursor() {
    const worldX = state.mouse.x + state.camera.x;
    const worldY = state.mouse.y + state.camera.y;
    for (const mob of state.mobs) {
        if (mob.dead) continue;
        const def = MOB_DEFS[mob.type];
        if (worldX >= mob.x && worldX <= mob.x + def.width &&
            worldY >= mob.y && worldY <= mob.y + def.height) {
            const dist = Math.sqrt(
                Math.pow(state.player.x + state.player.width / 2 - (mob.x + def.width / 2), 2) +
                Math.pow(state.player.y + state.player.height / 2 - (mob.y + def.height / 2), 2)
            );
            if (dist < BLOCK_SIZE * PLAYER_REACH) return mob;
        }
    }
    return null;
}
