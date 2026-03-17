// ============================================================
// PLAYER.JS - Player state, physics, camera, and combat
// ============================================================
// The player character: movement, gravity, collisions,
// fall damage, attacking mobs, and the camera that follows.
// ============================================================

import { state } from './state.js';
import { BLOCKS, ITEMS, BLOCK_SIZE, WORLD_WIDTH, WORLD_HEIGHT, GRAVITY, MAX_FALL_SPEED, PLAYER_REACH, SAFE_FALL_BLOCKS, MOB_DEFS, ITEM_INFO, BIOMES, getItemName } from './constants.js';
import { isBlockSolid, findSurfaceY } from './world.js';
import { addFloatingText, getEquippedTool, getEquippedTier, getArmorDefense, damageAllArmor, damageEquippedTool } from './inventory.js';
import { playJump, playFootstep, playLand, playHurt, playMobHit, playBlockPlace, playSelect, playToolBreak, playPickup } from './audio.js';
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
    if (state.player.rawMeatDebuffTimer > 0) state.player.rawMeatDebuffTimer -= dt;
    if (state.player.candyBuffTimer > 0) {
        state.player.candyBuffTimer -= dt;
        // Regen: heal 1 HP every 2s
        if (state.player.candyBuffType === "regen") {
            state.player.regenHealTimer -= dt;
            if (state.player.regenHealTimer <= 0) {
                state.player.regenHealTimer = 2000;
                if (state.player.health < state.player.maxHealth) {
                    state.player.health = Math.min(state.player.maxHealth, state.player.health + 1);
                    addFloatingText(state.player.x, state.player.y - 20, "+1", "#44ff88");
                }
            }
        }
        if (state.player.candyBuffTimer <= 0) {
            state.player.candyBuffTimer = 0;
            state.player.candyBuffType = null;
            state.player.sugarCrashTimer = 10000;
            addFloatingText(state.player.x, state.player.y - 20, "Sugar crash...", "#aa88cc");
        }
    }
    if (state.player.sugarCrashTimer > 0) state.player.sugarCrashTimer -= dt;

    // --- Temperature system ---
    {
        let targetTemp = 50; // neutral default
        if (state.inNether) {
            targetTemp = 92;
        } else if (state.inWasteland) {
            targetTemp = 72;
        } else if (!state.inPossum) {
            const blockX = Math.floor((state.player.x + state.player.width / 2) / BLOCK_SIZE);
            const biome = (state.biomeMap && blockX >= 0 && blockX < state.biomeMap.length) ? state.biomeMap[blockX] : BIOMES.FOREST;
            if (biome === BIOMES.DESERT) targetTemp = 83;
            else if (biome === BIOMES.SAVANNAH) targetTemp = 65;
            else if (biome === BIOMES.TUNDRA) targetTemp = 20;
        }
        // Cool Pack — always keeps temperature at 50 (moderate)
        {
            let hasCoolPack = false;
            for (const type of ["helmet", "chestplate", "leggings", "boots"]) {
                const slot = state.inventory.armor[type];
                if (slot.itemId !== 0 && ITEM_INFO[slot.itemId]?.coolPack) { hasCoolPack = true; break; }
            }
            if (hasCoolPack) targetTemp = 50;
        }
        // Wool armor warms you up in cold climates
        if (targetTemp < 50) {
            let warmthCount = 0;
            for (const type of ["helmet", "chestplate", "leggings", "boots"]) {
                const slot = state.inventory.armor[type];
                if (slot.itemId !== 0 && ITEM_INFO[slot.itemId]?.warmth) warmthCount++;
            }
            targetTemp = Math.min(50, targetTemp + warmthCount * 7);
        }
        // Drift temperature toward target
        const drift = dt * 0.007;
        if (state.player.temperature < targetTemp) {
            state.player.temperature = Math.min(targetTemp, state.player.temperature + drift);
        } else if (state.player.temperature > targetTemp) {
            state.player.temperature = Math.max(targetTemp, state.player.temperature - drift);
        }
        // Damage at extremes (freezing ≤10, heatstroke ≥90)
        if (state.player.temperature <= 10 || state.player.temperature >= 90) {
            state.player.tempDamageTimer -= dt;
            if (state.player.tempDamageTimer <= 0) {
                state.player.health = Math.max(0, state.player.health - 1);
                state.player.tempDamageTimer = 4000;
                const isCold = state.player.temperature <= 10;
                playHurt();
                addFloatingText(state.player.x, state.player.y - 20, isCold ? "Freezing!" : "Heatstroke!", isCold ? "#88ccff" : "#ff8800");
            }
        } else {
            state.player.tempDamageTimer = 0;
        }
    }

    // Crouching (Shift key) — shrink to one block tall, feet stay fixed
    const wasCrouching = state.player.crouching;
    state.player.crouching = !!state.keys["Shift"];
    if (state.player.crouching && !wasCrouching) {
        // Transition into crouch: reduce height from 46→32, push y down so feet stay
        state.player.y += (state.player.height - BLOCK_SIZE);
        state.player.height = BLOCK_SIZE;
    } else if (!state.player.crouching && wasCrouching) {
        // Transition out of crouch: restore height, pull y up
        const headY = state.player.y - (46 - BLOCK_SIZE);
        const headBlock = Math.floor(headY / BLOCK_SIZE);
        const pLeft  = Math.floor(state.player.x / BLOCK_SIZE);
        const pRight = Math.floor((state.player.x + state.player.width - 1) / BLOCK_SIZE);
        let blocked = false;
        for (let gx = pLeft; gx <= pRight; gx++) {
            if (isBlockSolid(gx, headBlock)) { blocked = true; break; }
        }
        if (!blocked) {
            state.player.y -= (46 - BLOCK_SIZE);
            state.player.height = 46;
        } else {
            // Stay crouched — re-engage crouch
            state.player.crouching = true;
        }
    }

    // Immobilized by Possum Protector tail wrap
    const isWrapped = state.mobs.some(m => m.type === 'possum_protector' && m.wrapping);

    // Movement (disabled during crafting or when wrapped)
    if (!state.craftingOpen && !state.chestOpen && !isWrapped) {
        const debuffed = state.player.rawMeatDebuffTimer > 0 || state.player.sugarCrashTimer > 0;
        const speedMult = state.player.candyBuffType === "speed" ? 1.7 : (debuffed ? 0.5 : 1.0);
        const moveSpeed = state.player.crouching ? state.player.speed * 0.4 : state.player.speed * speedMult;
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
            state.player.velY = state.player.candyBuffType === "jump" ? state.player.jumpForce * 1.6 : state.player.jumpForce;
            state.player.onGround = false;
            playJump();
        }
        if (state.player.onGround && Math.abs(state.player.velX) > 1) {
            playFootstep();
        }
    } else if (isWrapped) {
        state.player.velX = 0;
        state.player.velY = Math.min(state.player.velY, 0); // no launching up, but still fall
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
        // Toxic puddle damage
        if (standBlock === BLOCKS.TOXIC_PUDDLE) {
            if (state.player.invincibleTimer <= 0) {
                state.player.health = Math.max(0, state.player.health - 1);
                state.player.invincibleTimer = 800;
                playHurt();
                addFloatingText(state.player.x, state.player.y - 20, "Nuclear Waste!", "#1ad04a");
                createParticles(state.player.x + state.player.width / 2, state.player.y + state.player.height, 3, "#30d040");
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

    // Update dropped items physics
    for (let di = state.droppedItems.length - 1; di >= 0; di--) {
        const item = state.droppedItems[di];
        item.timer -= dt;
        if (item.timer <= 0) { state.droppedItems.splice(di, 1); continue; }
        if (!item.grounded) {
            item.velY = Math.min((item.velY || 0) + 0.3, 8);
            item.x += (item.velX || 0);
            item.y += item.velY;
            item.velX *= 0.95;
            const bx = Math.floor(item.x / BLOCK_SIZE);
            const by = Math.floor((item.y + 8) / BLOCK_SIZE);
            if (bx >= 0 && bx < WORLD_WIDTH && by >= 0 && by < WORLD_HEIGHT && isBlockSolid(bx, by)) {
                item.y = by * BLOCK_SIZE - 8;
                item.velY = 0;
                item.velX = 0;
                item.grounded = true;
            }
        }
    }

    // Pick up all nearby dropped items at once
    let pickedUp = false;
    const pickupCounts = {};
    const px = state.player.x + state.player.width / 2;
    const py = state.player.y + state.player.height / 2;
    for (let di = state.droppedItems.length - 1; di >= 0; di--) {
        const item = state.droppedItems[di];
        const dx = px - item.x;
        const dy = py - item.y;
        if (dx * dx + dy * dy < (BLOCK_SIZE * 1.5) * (BLOCK_SIZE * 1.5)) {
            if (addToInventory(item.itemId, item.count, item.durability)) {
                const name = getItemName(item.itemId);
                pickupCounts[name] = (pickupCounts[name] || 0) + item.count;
                state.droppedItems.splice(di, 1);
                pickedUp = true;
            }
        }
    }
    if (pickedUp) {
        playPickup();
        for (const [name, count] of Object.entries(pickupCounts)) {
            addFloatingText(px, py - 10, `+${count} ${name}`, "#4ade80");
        }
    }

    // Check if dead
    if (state.player.health <= 0 && !state.gameOver) {
        state.gameOver = true;
        createParticles(state.player.x + state.player.width / 2, state.player.y + state.player.height / 2, 20, "#ff0000", 5);

        // Drop all items if keep inventory is off
        if (!state.keepInventory) {
            const dropX = state.player.x + state.player.width / 2;
            const dropY = state.player.y;
            for (let i = 0; i < state.inventory.slots.length; i++) {
                const slot = state.inventory.slots[i];
                if (slot.itemId !== 0 && slot.count > 0) {
                    state.droppedItems.push({
                        x: dropX + (Math.random() - 0.5) * 40,
                        y: dropY + (Math.random() - 0.5) * 20,
                        velX: (Math.random() - 0.5) * 6,
                        velY: -3 - Math.random() * 4,
                        itemId: slot.itemId,
                        count: slot.count,
                        durability: slot.durability || 0,
                        timer: 120000 // 2 minutes
                    });
                    slot.itemId = 0; slot.count = 0; slot.durability = 0;
                }
            }
            // Drop armor too
            for (const type of ["helmet", "chestplate", "leggings", "boots"]) {
                const slot = state.inventory.armor[type];
                if (slot.itemId !== 0) {
                    state.droppedItems.push({
                        x: dropX + (Math.random() - 0.5) * 40,
                        y: dropY + (Math.random() - 0.5) * 20,
                        velX: (Math.random() - 0.5) * 6,
                        velY: -3 - Math.random() * 4,
                        itemId: slot.itemId,
                        count: 1,
                        durability: slot.durability || 0,
                        timer: 120000
                    });
                    slot.itemId = 0; slot.count = 0; slot.durability = 0;
                }
            }
        }
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
            if (block === BLOCKS.DOOR_CLOSED || block === BLOCKS.IRON_DOOR_CLOSED) {
                _toggleDoor(bx, by);
                const existing = state.plateTimers.find(t => t.x === bx && t.y === by);
                if (!existing) {
                    state.plateTimers.push({ x: bx, y: by, timer: 3000 });
                } else {
                    existing.timer = 3000;
                }
            } else if (block === BLOCKS.DOOR_OPEN || block === BLOCKS.IRON_DOOR_OPEN) {
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
                if (state.activeWorld[t.x][t.y] === BLOCKS.DOOR_OPEN || state.activeWorld[t.x][t.y] === BLOCKS.IRON_DOOR_OPEN) {
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

export function hurtPlayer(damage, knockFromX, damageType = "melee") {
    if (state.player.invincibleTimer > 0 || state.gameOver) return;

    // Shield block: crouching + shield anywhere in inventory + attack from the facing side
    if (state.player.crouching) {
        // Find shield in offhand first, then hotbar
        let shieldSlot = null;
        if (state.offhand && state.offhand.itemId === ITEMS.SHIELD && state.offhand.durability > 0) {
            shieldSlot = state.offhand;
        } else {
            for (const slot of state.inventory.slots) {
                if (slot.itemId === ITEMS.SHIELD && slot.durability > 0) { shieldSlot = slot; break; }
            }
        }
        if (shieldSlot) {
            const attackFromLeft = knockFromX < state.player.x + state.player.width / 2;
            const facingLeft = state.player.facing === -1;
            if (attackFromLeft === facingLeft) {
                shieldSlot.durability--;
                if (shieldSlot.durability <= 0) {
                    shieldSlot.itemId = 0; shieldSlot.count = 0; shieldSlot.durability = 0;
                    addFloatingText(state.player.x, state.player.y - 30, "Shield broke!", "#ef4444");
                    playToolBreak();
                } else {
                    addFloatingText(state.player.x + 20, state.player.y - 10, "Blocked!", "#4ade80");
                }
                state.screenShake.intensity = 3;
                return;
            }
        }
    }

    // Bullet resistance from riot armor (or any armor with bulletResistance property)
    if (damageType === "bullet") {
        let bulletResist = 0;
        for (const type of ["helmet", "chestplate", "leggings", "boots"]) {
            const slot = state.inventory.armor[type];
            if (slot.itemId !== 0 && ITEM_INFO[slot.itemId]?.bulletResistance)
                bulletResist += ITEM_INFO[slot.itemId].bulletResistance;
        }
        damage = Math.ceil(damage * (1 - Math.min(bulletResist, 0.85)));
    }

    // Riot armor is highly effective against The Glitched — each piece reduces 20% damage
    if (damageType === "glitched") {
        let riotPieces = 0;
        const riotIds = new Set([ITEMS.RIOT_HELMET, ITEMS.RIOT_CHESTPLATE, ITEMS.RIOT_LEGGINGS, ITEMS.RIOT_BOOTS]);
        for (const type of ["helmet", "chestplate", "leggings", "boots"]) {
            if (riotIds.has(state.inventory.armor[type].itemId)) riotPieces++;
        }
        if (riotPieces > 0) {
            damage = Math.max(1, Math.ceil(damage * (1 - riotPieces * 0.20)));
        }
    }

    const armorDef = (damageType === "armorPiercing") ? 0 : getArmorDefense();
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

// Line-of-sight check: returns true if there's a clear path between two points (no solid blocks)
export function hasLineOfSight(x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.ceil(dist / (BLOCK_SIZE * 0.5));
    for (let i = 1; i < steps; i++) {
        const t = i / steps;
        const bx = Math.floor((x1 + dx * t) / BLOCK_SIZE);
        const by = Math.floor((y1 + dy * t) / BLOCK_SIZE);
        if (bx >= 0 && bx < WORLD_WIDTH && by >= 0 && by < WORLD_HEIGHT) {
            if (isBlockSolid(bx, by)) return false;
        }
    }
    return true;
}

export function attackMob(mob) {
    if (state.player.attackCooldown > 0) return;
    const def = MOB_DEFS[mob.type];

    // Can't hit through walls
    const pcx = state.player.x + state.player.width / 2;
    const pcy = state.player.y + state.player.height / 2;
    const mcx = mob.x + def.width / 2;
    const mcy = mob.y + def.height / 2;
    if (!hasLineOfSight(pcx, pcy, mcx, mcy)) {
        addFloatingText(state.player.x, state.player.y - 20, "Blocked by wall!", "#999999");
        return;
    }

    const tool = getEquippedTool();
    let damage = 1;
    if (tool) {
        if (tool.toolType === "sword") damage = tool.damage;
        else damage = 2;
        damageEquippedTool();
    }
    if (state.player.rawMeatDebuffTimer > 0) damage = Math.max(1, Math.floor(damage * 0.5));
    if (state.player.candyBuffType === "strength") damage = Math.floor(damage * 2);

    mob.health -= damage;
    mob.hurtTimer = 200;
    state.player.attackCooldown = 400;
    playMobHit();

    // Tell pet Posse to attack this mob
    state.possumPetTarget = mob;

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
