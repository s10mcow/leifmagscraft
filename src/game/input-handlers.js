// ============================================================
// INPUT-HANDLERS.JS - Player-driven mechanics
// ============================================================
// Handles: updateMining, placeBlock, interact, toggleDoor,
//          handleGunFire
// Called on each frame or on user input events.
// ============================================================

import { state } from '../state.js';
import { BLOCKS, ITEMS, BLOCK_SIZE, WORLD_WIDTH, WORLD_HEIGHT, BLOCK_INFO, ITEM_INFO, MOB_DEFS, isBlockId, isFood, getItemName } from '../constants.js';
import { addToInventory, addFloatingText, getEquippedTool, getEquippedTier, damageEquippedTool, eatFood } from '../inventory.js';
import { isBlockSolid, initChestData, removeChestData, checkLavaWaterInteraction } from '../world.js';
import { playMineHit, playBlockBreak, playBlockPlace, playPickup } from '../audio.js';
import { createBullet, createRocket, createParticles } from '../mobs.js';
import { scheduleLeafDecay, WOOD_BLOCKS, TREE_BLOCKS, teleportToOtherDimension } from './systems.js';

// ============================================================
// MINING LOGIC
// ============================================================

export function updateMining(dt) {
    if (state.craftingOpen || state.tradingOpen || state.chestOpen || state.gameOver) return;
    // Don't mine when holding a gun
    const gunSlot = state.inventory.slots[state.inventory.selectedSlot];
    const gunInfo = gunSlot.count > 0 ? ITEM_INFO[gunSlot.itemId] : null;
    if (gunInfo && gunInfo.toolType === "gun") { state.mining.active = false; state.mining.progress = 0; return; }
    if (!state.mouse.leftDown) {
        state.mining.active = false;
        state.mining.progress = 0;
        return;
    }

    const wmx = Math.floor((state.mouse.x + state.camera.x) / BLOCK_SIZE);
    const wmy = Math.floor((state.mouse.y + state.camera.y) / BLOCK_SIZE);
    if (wmx < 0 || wmx >= WORLD_WIDTH || wmy < 0 || wmy >= WORLD_HEIGHT) return;

    let blockType = state.activeWorld[wmx][wmy];
    let isBgBlock = false;
    if (blockType === BLOCKS.AIR && state.activeBgWorld && state.activeBgWorld[wmx] && state.activeBgWorld[wmx][wmy] !== BLOCKS.AIR) {
        blockType = state.activeBgWorld[wmx][wmy];
        isBgBlock = true;
    }
    if (blockType === BLOCKS.AIR || !BLOCK_INFO[blockType] || !BLOCK_INFO[blockType].breakable) return;
    state.mining.isBgBlock = isBgBlock;

    // Distance check
    const pcx = state.player.x + state.player.width / 2, pcy = state.player.y + state.player.height / 2;
    const bcx = wmx * BLOCK_SIZE + BLOCK_SIZE / 2, bcy = wmy * BLOCK_SIZE + BLOCK_SIZE / 2;
    if (Math.sqrt((pcx - bcx) ** 2 + (pcy - bcy) ** 2) > BLOCK_SIZE * 5.5) return;

    const blockInfo = BLOCK_INFO[blockType];
    const tool = getEquippedTool();
    const toolTier = getEquippedTier();
    let mineTime = blockInfo.mineTime;
    let canMineBlock = true;

    // Tool tier check
    if (blockInfo.minTier > 0 && toolTier < blockInfo.minTier) {
        mineTime = blockInfo.mineTime * 5;
        canMineBlock = false;
    } else if (tool && tool.toolType === blockInfo.toolType) {
        mineTime = Math.floor(blockInfo.mineTime / tool.speed);
    }

    // Reset if targeting different block
    if (wmx !== state.mining.blockX || wmy !== state.mining.blockY) {
        state.mining.blockX = wmx;
        state.mining.blockY = wmy;
        state.mining.progress = 0;
        state.mining.targetTime = mineTime;
        state.mining.canMine = canMineBlock;
    }

    state.mining.active = true;
    state.mining.progress += dt;
    playMineHit(); // Tink tink sound while mining

    if (state.mining.progress >= state.mining.targetTime) {
        if (state.mining.canMine) {
            // If breaking a chest, dump its contents to player
            if (blockType === BLOCKS.CHEST) {
                const chestKey = `${wmx},${wmy}`;
                if (state.chestData[chestKey]) {
                    for (const slot of state.chestData[chestKey]) {
                        if (slot.itemId !== 0 && slot.count > 0) {
                            addToInventory(slot.itemId, slot.count);
                        }
                    }
                    removeChestData(wmx, wmy);
                }
            }
            // Gravel: 10% chance to drop flint instead
            if (blockType === BLOCKS.GRAVEL) {
                const gravelDrop = Math.random() < 0.1 ? ITEMS.FLINT : BLOCKS.GRAVEL;
                addToInventory(gravelDrop);
                playPickup();
                addFloatingText(wmx * BLOCK_SIZE + 16, wmy * BLOCK_SIZE, `+1 ${getItemName(gravelDrop)}`, "#4ade80");
            } else {
                const drop = blockInfo.drops;
                if (drop !== null) {
                    addToInventory(drop);
                    playPickup();
                    addFloatingText(wmx * BLOCK_SIZE + 16, wmy * BLOCK_SIZE, `+1 ${getItemName(drop)}`, "#4ade80");
                }
            }
        } else {
            addFloatingText(wmx * BLOCK_SIZE + 16, wmy * BLOCK_SIZE, "Wrong tool!", "#ef4444");
        }
        // Door: break both halves
        if (blockType === BLOCKS.DOOR_CLOSED || blockType === BLOCKS.DOOR_OPEN) {
            if (wmy > 0 && (state.activeWorld[wmx][wmy-1] === BLOCKS.DOOR_CLOSED || state.activeWorld[wmx][wmy-1] === BLOCKS.DOOR_OPEN)) {
                state.activeWorld[wmx][wmy-1] = BLOCKS.AIR;
            }
            if (wmy < WORLD_HEIGHT - 1 && (state.activeWorld[wmx][wmy+1] === BLOCKS.DOOR_CLOSED || state.activeWorld[wmx][wmy+1] === BLOCKS.DOOR_OPEN)) {
                state.activeWorld[wmx][wmy+1] = BLOCKS.AIR;
            }
        }
        if (tool) damageEquippedTool();
        state.placedBlocks.delete(`${wmx},${wmy}`);
        if (state.mining.isBgBlock) {
            state.activeBgWorld[wmx][wmy] = BLOCKS.AIR;
        } else {
            state.activeWorld[wmx][wmy] = BLOCKS.AIR;
            if (WOOD_BLOCKS.has(blockType)) scheduleLeafDecay(wmx, wmy);
        }
        playBlockBreak(); // Crunch!
        state.mining.active = false;
        state.mining.progress = 0;
    }
}

// ============================================================
// BLOCK PLACING
// ============================================================

export function placeBlock() {
    const slot = state.inventory.slots[state.inventory.selectedSlot];
    if (slot.count === 0 || !isBlockId(slot.itemId)) return;

    const wmx = Math.floor((state.mouse.x + state.camera.x) / BLOCK_SIZE);
    const wmy = Math.floor((state.mouse.y + state.camera.y) / BLOCK_SIZE);
    if (wmx < 0 || wmx >= WORLD_WIDTH || wmy < 0 || wmy >= WORLD_HEIGHT) return;
    if (state.activeWorld[wmx][wmy] !== BLOCKS.AIR) return;

    const pcx = state.player.x + state.player.width / 2, pcy = state.player.y + state.player.height / 2;
    const bcx = wmx * BLOCK_SIZE + BLOCK_SIZE / 2, bcy = wmy * BLOCK_SIZE + BLOCK_SIZE / 2;
    if (Math.sqrt((pcx - bcx) ** 2 + (pcy - bcy) ** 2) > BLOCK_SIZE * 5.5) return;

    if (!isBlockSolid(wmx - 1, wmy) && !isBlockSolid(wmx + 1, wmy) &&
        !isBlockSolid(wmx, wmy - 1) && !isBlockSolid(wmx, wmy + 1)) return;

    // Don't place on player
    const pl = Math.floor(state.player.x / BLOCK_SIZE), pr = Math.floor((state.player.x + state.player.width - 1) / BLOCK_SIZE);
    const pt = Math.floor(state.player.y / BLOCK_SIZE), pb = Math.floor((state.player.y + state.player.height - 1) / BLOCK_SIZE);
    if (wmx >= pl && wmx <= pr && wmy >= pt && wmy <= pb) return;

    state.activeWorld[wmx][wmy] = slot.itemId;
    if (TREE_BLOCKS.has(slot.itemId)) state.placedBlocks.add(`${wmx},${wmy}`);
    if (slot.itemId === BLOCKS.CHEST) initChestData(wmx, wmy);
    // Door: place 2 blocks tall
    if (slot.itemId === BLOCKS.DOOR_CLOSED) {
        if (wmy > 0 && state.activeWorld[wmx][wmy - 1] === BLOCKS.AIR) {
            state.activeWorld[wmx][wmy - 1] = BLOCKS.DOOR_CLOSED;
        } else {
            state.activeWorld[wmx][wmy] = BLOCKS.AIR;
            return;
        }
    }
    // Lava-water interaction check on neighbors
    for (const [nx, ny] of [[wmx-1,wmy],[wmx+1,wmy],[wmx,wmy-1],[wmx,wmy+1]]) {
        if (nx >= 0 && nx < WORLD_WIDTH && ny >= 0 && ny < WORLD_HEIGHT) {
            if (state.activeWorld[nx][ny] === BLOCKS.LAVA) checkLavaWaterInteraction(nx, ny);
        }
    }
    if (state.activeWorld[wmx][wmy] === BLOCKS.LAVA) checkLavaWaterInteraction(wmx, wmy);
    playBlockPlace();
    slot.count--;
    if (slot.count === 0) { slot.itemId = 0; slot.durability = 0; }
}

// ============================================================
// F KEY - INTERACT (eat food, sleep, open chest, trade, tame)
// ============================================================

export function interact() {
    if (state.gameOver || state.craftingOpen || state.sleeping || state.tradingOpen || state.chestOpen) return;

    // Miniature Nether Portal: teleport to/from Nether
    const heldSlot = state.inventory.slots[state.inventory.selectedSlot];
    if (heldSlot.itemId === ITEMS.MINIATURE_NETHER_PORTAL && state.portalCooldown <= 0) {
        teleportToOtherDimension();
        return;
    }

    // Check for nearby wolf
    for (const mob of state.mobs) {
        if (mob.type !== "wolf") continue;
        const wolfDef = MOB_DEFS.wolf;
        const pcx = state.player.x + state.player.width / 2, pcy = state.player.y + state.player.height / 2;
        const mcx = mob.x + wolfDef.width / 2, mcy = mob.y + wolfDef.height / 2;
        const wolfDist = Math.sqrt((pcx - mcx) ** 2 + (pcy - mcy) ** 2);
        if (wolfDist < BLOCK_SIZE * 4) {
            if (!mob.tamed) {
                const slot = state.inventory.slots[state.inventory.selectedSlot];
                if (slot.itemId === ITEMS.BONE && slot.count > 0) {
                    slot.count--;
                    if (slot.count === 0) { slot.itemId = 0; slot.durability = 0; }
                    if (Math.random() < 0.2) {
                        mob.tamed = true;
                        mob.sitting = false;
                        addFloatingText(mob.x + wolfDef.width / 2, mob.y - 20, "Wolf tamed! <3", "#ff69b4");
                        createParticles(mob.x + wolfDef.width / 2, mob.y + wolfDef.height / 2, 15, "#ff69b4", 4);
                    } else {
                        addFloatingText(mob.x + wolfDef.width / 2, mob.y - 15, "...", "#aaaaaa");
                    }
                    return;
                }
                addFloatingText(mob.x + wolfDef.width / 2, mob.y - 15, "Hold a bone to tame!", "#aaaaaa");
                return;
            } else {
                const slot = state.inventory.slots[state.inventory.selectedSlot];
                if (slot.itemId === ITEMS.ROTTEN_FLESH && slot.count > 0 && mob.health < wolfDef.maxHealth) {
                    slot.count--;
                    if (slot.count === 0) { slot.itemId = 0; slot.durability = 0; }
                    mob.health = Math.min(wolfDef.maxHealth, mob.health + 4);
                    addFloatingText(mob.x + wolfDef.width / 2, mob.y - 20, "+4 HP", "#4ade80");
                    return;
                }
                mob.sitting = !mob.sitting;
                addFloatingText(mob.x + wolfDef.width / 2, mob.y - 20, mob.sitting ? "Sit" : "Follow!", "#ffd700");
                return;
            }
        }
    }

    // Check if pointing at a door within reach
    const wmx_d = Math.floor((state.mouse.x + state.camera.x) / BLOCK_SIZE);
    const wmy_d = Math.floor((state.mouse.y + state.camera.y) / BLOCK_SIZE);
    if (wmx_d >= 0 && wmx_d < WORLD_WIDTH && wmy_d >= 0 && wmy_d < WORLD_HEIGHT) {
        const doorBlock = state.activeWorld[wmx_d][wmy_d];
        if (doorBlock === BLOCKS.DOOR_CLOSED || doorBlock === BLOCKS.DOOR_OPEN) {
            const pcx = state.player.x + state.player.width / 2, pcy = state.player.y + state.player.height / 2;
            const bcx = wmx_d * BLOCK_SIZE + BLOCK_SIZE / 2, bcy = wmy_d * BLOCK_SIZE + BLOCK_SIZE / 2;
            if (Math.sqrt((pcx - bcx) ** 2 + (pcy - bcy) ** 2) < BLOCK_SIZE * 5) {
                toggleDoor(wmx_d, wmy_d);
                return;
            }
        }
    }

    // Check if pointing at a chest within reach
    const wmx_c = Math.floor((state.mouse.x + state.camera.x) / BLOCK_SIZE);
    const wmy_c = Math.floor((state.mouse.y + state.camera.y) / BLOCK_SIZE);
    if (wmx_c >= 0 && wmx_c < WORLD_WIDTH && wmy_c >= 0 && wmy_c < WORLD_HEIGHT) {
        if (state.activeWorld[wmx_c][wmy_c] === BLOCKS.CHEST) {
            const pcx = state.player.x + state.player.width / 2, pcy = state.player.y + state.player.height / 2;
            const bcx = wmx_c * BLOCK_SIZE + BLOCK_SIZE / 2, bcy = wmy_c * BLOCK_SIZE + BLOCK_SIZE / 2;
            if (Math.sqrt((pcx - bcx) ** 2 + (pcy - bcy) ** 2) < BLOCK_SIZE * 5) {
                const key = `${wmx_c},${wmy_c}`;
                if (!state.chestData[key]) initChestData(wmx_c, wmy_c);
                state.chestOpen = true;
                state.chestPos = { x: wmx_c, y: wmy_c };
                state.chestHover = -1;
                return;
            }
        }
    }

    // Check for nearby villager
    for (const mob of state.mobs) {
        if (mob.type !== "villager") continue;
        const def = MOB_DEFS.villager;
        const pcx = state.player.x + state.player.width / 2, pcy = state.player.y + state.player.height / 2;
        const mcx = mob.x + def.width / 2, mcy = mob.y + def.height / 2;
        const dist = Math.sqrt((pcx - mcx) ** 2 + (pcy - mcy) ** 2);
        if (dist < BLOCK_SIZE * 4) {
            state.tradingOpen = true;
            state.tradingVillager = mob;
            state.tradingHover = -1;
            return;
        }
    }

    // Check if pointing at a bed within reach
    const wmx = Math.floor((state.mouse.x + state.camera.x) / BLOCK_SIZE);
    const wmy = Math.floor((state.mouse.y + state.camera.y) / BLOCK_SIZE);
    if (wmx >= 0 && wmx < WORLD_WIDTH && wmy >= 0 && wmy < WORLD_HEIGHT) {
        if (state.activeWorld[wmx][wmy] === BLOCKS.BED) {
            const pcx = state.player.x + state.player.width / 2, pcy = state.player.y + state.player.height / 2;
            const bcx = wmx * BLOCK_SIZE + BLOCK_SIZE / 2, bcy = wmy * BLOCK_SIZE + BLOCK_SIZE / 2;
            const dist = Math.sqrt((pcx - bcx) ** 2 + (pcy - bcy) ** 2);
            if (dist < BLOCK_SIZE * 5) {
                const dayBrightness = Math.cos(state.timeOfDay * Math.PI * 2) * 0.5 + 0.5;
                if (dayBrightness < 0.55) {
                    // It's night - go to sleep!
                    state.sleeping = true;
                    state.sleepTimer = 0;
                    return;
                } else {
                    addFloatingText(state.player.x, state.player.y - 30, "You can only sleep at night!", "#ffaa00");
                    return;
                }
            }
        }
    }

    // Otherwise, try to eat food
    const slot = state.inventory.slots[state.inventory.selectedSlot];
    if (slot.count > 0 && isFood(slot.itemId)) {
        eatFood();
        return;
    }

    addFloatingText(state.player.x, state.player.y - 20, "Nothing to interact with", "#999999");
}

// ============================================================
// DOORS
// ============================================================

export function toggleDoor(x, y) {
    const current = state.activeWorld[x][y];
    const newId = (current === BLOCKS.DOOR_CLOSED) ? BLOCKS.DOOR_OPEN : BLOCKS.DOOR_CLOSED;
    state.activeWorld[x][y] = newId;
    // Toggle paired half (above or below)
    if (y > 0 && (state.activeWorld[x][y-1] === BLOCKS.DOOR_CLOSED || state.activeWorld[x][y-1] === BLOCKS.DOOR_OPEN)) {
        state.activeWorld[x][y-1] = newId;
    }
    if (y < WORLD_HEIGHT - 1 && (state.activeWorld[x][y+1] === BLOCKS.DOOR_CLOSED || state.activeWorld[x][y+1] === BLOCKS.DOOR_OPEN)) {
        state.activeWorld[x][y+1] = newId;
    }
    playBlockPlace();
}

// ============================================================
// GUN FIRING
// ============================================================

export function handleGunFire(dt) {
    if (state.gunCooldown > 0) state.gunCooldown -= dt;
    if (state.craftingOpen || state.tradingOpen || state.chestOpen || state.gameOver || state.sleeping) return;
    if (!state.mouse.leftDown) return;

    const slot = state.inventory.slots[state.inventory.selectedSlot];
    if (slot.count === 0 || slot.itemId === 0) return;
    const itemInfo = ITEM_INFO[slot.itemId];
    if (!itemInfo || itemInfo.toolType !== "gun") return;
    if (state.gunCooldown > 0) return;

    // Determine ammo type
    const isRocket = itemInfo.ammoType === "rocket";
    const ammoItemId = isRocket ? ITEMS.ROCKET : ITEMS.BULLETS;
    const ammoName = isRocket ? "No rockets!" : "No ammo!";

    // Check for ammo in inventory
    const ammoSlot = state.inventory.slots.findIndex(s => s.itemId === ammoItemId && s.count > 0);
    if (ammoSlot === -1) {
        addFloatingText(state.player.x, state.player.y - 20, ammoName, "#ef4444");
        state.gunCooldown = 500;
        return;
    }

    // Fire!
    const px = state.player.x + state.player.width / 2;
    const py = state.player.y + state.player.height / 3;
    const targetX = state.mouse.x + state.camera.x;
    const targetY = state.mouse.y + state.camera.y;

    if (isRocket) {
        createRocket(px, py, targetX, targetY, itemInfo.damage);
    } else {
        createBullet(px, py, targetX, targetY, itemInfo.damage);
    }
    state.gunCooldown = itemInfo.fireRate;

    // Consume 1 ammo
    state.inventory.slots[ammoSlot].count--;
    if (state.inventory.slots[ammoSlot].count <= 0) {
        state.inventory.slots[ammoSlot].itemId = 0;
        state.inventory.slots[ammoSlot].count = 0;
    }

    // Damage gun durability
    if (slot.durability !== undefined) {
        slot.durability--;
        if (slot.durability <= 0) {
            slot.itemId = 0; slot.count = 0; slot.durability = 0;
            addFloatingText(state.player.x, state.player.y - 30, "Gun broke!", "#ef4444");
        }
    }
}
