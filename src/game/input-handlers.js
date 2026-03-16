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
import { createBullet, createSniperBullet, createRocket, createFlame, createLaserBeam, createParticles } from '../mobs.js';
import { scheduleLeafDecay, WOOD_BLOCKS, TREE_BLOCKS, teleportToOtherDimension, teleportToWasteland, teleportToPossum } from './systems.js';

function syncBlock(x, y, blockId) {
    if (state.multiplayerMode) import('../multiplayer.js').then(m => m.sendBlockUpdate(x, y, blockId));
}

// ============================================================
// MINING LOGIC
// ============================================================

export function updateMining(dt) {
    if (state.craftingOpen || state.tradingOpen || state.chestOpen || state.blastFurnaceOpen || state.furnaceOpen || state.smokerOpen || state.gameOver) return;
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
        const isDoor = blockType === BLOCKS.DOOR_CLOSED || blockType === BLOCKS.DOOR_OPEN;
        const isIronDoor = blockType === BLOCKS.IRON_DOOR_CLOSED || blockType === BLOCKS.IRON_DOOR_OPEN;
        if (isDoor || isIronDoor) {
            const pairIds = isIronDoor
                ? [BLOCKS.IRON_DOOR_CLOSED, BLOCKS.IRON_DOOR_OPEN]
                : [BLOCKS.DOOR_CLOSED, BLOCKS.DOOR_OPEN];
            if (wmy > 0 && pairIds.includes(state.activeWorld[wmx][wmy-1])) {
                state.activeWorld[wmx][wmy-1] = BLOCKS.AIR;
                syncBlock(wmx, wmy - 1, BLOCKS.AIR);
            }
            if (wmy < WORLD_HEIGHT - 1 && pairIds.includes(state.activeWorld[wmx][wmy+1])) {
                state.activeWorld[wmx][wmy+1] = BLOCKS.AIR;
                syncBlock(wmx, wmy + 1, BLOCKS.AIR);
            }
        }
        if (tool) damageEquippedTool();
        state.placedBlocks.delete(`${wmx},${wmy}`);
        if (state.mining.isBgBlock) {
            state.activeBgWorld[wmx][wmy] = BLOCKS.AIR;
        } else {
            state.activeWorld[wmx][wmy] = BLOCKS.AIR;
            syncBlock(wmx, wmy, BLOCKS.AIR);
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
    if (slot.count === 0) return;

    // Bucket fill / empty logic (before block-placement check)
    const wmxB = Math.floor((state.mouse.x + state.camera.x) / BLOCK_SIZE);
    const wmyB = Math.floor((state.mouse.y + state.camera.y) / BLOCK_SIZE);
    if (wmxB >= 0 && wmxB < WORLD_WIDTH && wmyB >= 0 && wmyB < WORLD_HEIGHT) {
        const targetBlock = state.activeWorld[wmxB][wmyB];
        const FILL_MAP = { [BLOCKS.WATER]: ITEMS.WATER_BUCKET, [BLOCKS.LAVA]: ITEMS.LAVA_BUCKET, [BLOCKS.TOXIC_PUDDLE]: ITEMS.TOXIC_BUCKET };
        const EMPTY_MAP = { [ITEMS.WATER_BUCKET]: BLOCKS.WATER, [ITEMS.LAVA_BUCKET]: BLOCKS.LAVA, [ITEMS.TOXIC_BUCKET]: BLOCKS.TOXIC_PUDDLE };
        if (slot.itemId === ITEMS.BUCKET && FILL_MAP[targetBlock] !== undefined) {
            state.activeWorld[wmxB][wmyB] = BLOCKS.AIR;
            slot.itemId = FILL_MAP[targetBlock];
            return;
        }
        if (EMPTY_MAP[slot.itemId] !== undefined && targetBlock === BLOCKS.AIR) {
            state.activeWorld[wmxB][wmyB] = EMPTY_MAP[slot.itemId];
            slot.itemId = ITEMS.BUCKET;
            playBlockPlace();
            return;
        }
    }

    if (!isBlockId(slot.itemId)) return;

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
    syncBlock(wmx, wmy, slot.itemId);
    if (TREE_BLOCKS.has(slot.itemId)) state.placedBlocks.add(`${wmx},${wmy}`);
    if (slot.itemId === BLOCKS.CHEST) initChestData(wmx, wmy);
    // Door: place 2 blocks tall
    if (slot.itemId === BLOCKS.DOOR_CLOSED || slot.itemId === BLOCKS.IRON_DOOR_CLOSED) {
        if (wmy > 0 && state.activeWorld[wmx][wmy - 1] === BLOCKS.AIR) {
            state.activeWorld[wmx][wmy - 1] = slot.itemId;
            syncBlock(wmx, wmy - 1, slot.itemId);
        } else {
            state.activeWorld[wmx][wmy] = BLOCKS.AIR;
            syncBlock(wmx, wmy, BLOCKS.AIR);
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
    if (state.gameOver || state.craftingOpen || state.sleeping || state.tradingOpen || state.chestOpen || state.blastFurnaceOpen || state.furnaceOpen || state.smokerOpen) return;

    const heldSlot = state.inventory.slots[state.inventory.selectedSlot];

    // Possum Realm: eat candy blocks nearby with F — only if holding candy or the candy block itself
    if (state.inPossum) {
        const CANDY_BLOCKS = new Set([BLOCKS.CANDY_GROUND, BLOCKS.CANDY_CANE, BLOCKS.LOLLIPOP_TOP]);
        const holdingCandy = heldSlot.itemId === ITEMS.POSSUM_CANDY;
        const holdingCandyBlock = CANDY_BLOCKS.has(heldSlot.itemId);
        if (holdingCandy || holdingCandyBlock) {
            const px = Math.floor((state.player.x + state.player.width / 2) / BLOCK_SIZE);
            const py = Math.floor((state.player.y + state.player.height / 2) / BLOCK_SIZE);
            for (let dx = -2; dx <= 2; dx++) {
                for (let dy = -2; dy <= 2; dy++) {
                    const bx = px + dx, by = py + dy;
                    if (bx >= 0 && bx < WORLD_WIDTH && by >= 0 && by < WORLD_HEIGHT) {
                        const block = state.activeWorld[bx][by];
                        if (CANDY_BLOCKS.has(block)) {
                            state.activeWorld[bx][by] = BLOCKS.AIR;
                            const heal = 2;
                            state.player.health = Math.min(state.player.maxHealth, state.player.health + heal);
                            addFloatingText(state.player.x, state.player.y - 20, `+${heal} HP (yum!)`, "#ff88dd");
                            createParticles(bx * BLOCK_SIZE + BLOCK_SIZE / 2, by * BLOCK_SIZE + BLOCK_SIZE / 2, 6, "#ff88cc", 2);
                            return;
                        }
                    }
                }
            }
        }
    }

    // Glass Bottle: fill from nearby water
    if (heldSlot.itemId === ITEMS.GLASS_BOTTLE) {
        const px = Math.floor((state.player.x + state.player.width / 2) / BLOCK_SIZE);
        const py = Math.floor((state.player.y + state.player.height / 2) / BLOCK_SIZE);
        let foundWater = false;
        outer: for (let dx = -2; dx <= 2; dx++) {
            for (let dy = -2; dy <= 2; dy++) {
                const wx = px + dx, wy = py + dy;
                if (wx >= 0 && wx < WORLD_WIDTH && wy >= 0 && wy < WORLD_HEIGHT && state.activeWorld[wx][wy] === BLOCKS.WATER) {
                    heldSlot.itemId = ITEMS.WATER_BOTTLE;
                    heldSlot.durability = 4;
                    addFloatingText(state.player.x, state.player.y - 20, "Water bottle filled!", "#4488ff");
                    foundWater = true;
                    break outer;
                }
            }
        }
        if (foundWater) return;
    }

    // Water Bottle: drink a sip to cool down
    if (heldSlot.itemId === ITEMS.WATER_BOTTLE) {
        state.player.temperature = Math.max(0, state.player.temperature - 15);
        heldSlot.durability = (heldSlot.durability > 0 ? heldSlot.durability : 4) - 1;
        if (heldSlot.durability <= 0) {
            heldSlot.itemId = ITEMS.GLASS_BOTTLE;
            heldSlot.durability = 0;
            addFloatingText(state.player.x, state.player.y - 20, "Bottle empty!", "#aaaaaa");
        } else {
            addFloatingText(state.player.x, state.player.y - 20, `Refreshing! (${heldSlot.durability} sips left)`, "#44aaff");
        }
        return;
    }

    // Bucket: pick up liquid at cursor
    if (heldSlot.itemId === ITEMS.BUCKET) {
        const bx = Math.floor((state.mouse.x + state.camera.x) / BLOCK_SIZE);
        const by = Math.floor((state.mouse.y + state.camera.y) / BLOCK_SIZE);
        const pcx = state.player.x + state.player.width / 2;
        const pcy = state.player.y + state.player.height / 2;
        const blockCx = bx * BLOCK_SIZE + BLOCK_SIZE / 2;
        const blockCy = by * BLOCK_SIZE + BLOCK_SIZE / 2;
        if (Math.sqrt((pcx - blockCx) ** 2 + (pcy - blockCy) ** 2) < BLOCK_SIZE * 6 &&
            bx >= 0 && bx < WORLD_WIDTH && by >= 0 && by < WORLD_HEIGHT) {
            const block = state.activeWorld[bx][by];
            if (block === BLOCKS.TOXIC_PUDDLE) {
                state.activeWorld[bx][by] = BLOCKS.AIR;
                heldSlot.itemId = ITEMS.TOXIC_BUCKET;
                addFloatingText(state.player.x, state.player.y - 20, "Collected toxic waste!", "#40cc40");
                return;
            } else if (block === BLOCKS.WATER) {
                state.activeWorld[bx][by] = BLOCKS.AIR;
                heldSlot.itemId = ITEMS.WATER_BUCKET;
                addFloatingText(state.player.x, state.player.y - 20, "Collected water!", "#4488ff");
                return;
            } else if (block === BLOCKS.LAVA) {
                state.activeWorld[bx][by] = BLOCKS.AIR;
                heldSlot.itemId = ITEMS.LAVA_BUCKET;
                addFloatingText(state.player.x, state.player.y - 20, "Collected lava!", "#ff6600");
                return;
            }
        }
    }

    // Miniature Nether Portal: teleport to/from Nether
    if (heldSlot.itemId === ITEMS.MINIATURE_NETHER_PORTAL && state.portalCooldown <= 0) {
        teleportToOtherDimension();
        return;
    }
    // Wasteland Teleporter: teleport to/from Wasteland
    if (heldSlot.itemId === ITEMS.WASTELAND_TELEPORTER && state.portalCooldown <= 0) {
        teleportToWasteland();
        return;
    }
    // Possum Teleporter: teleport to/from Possum Realm
    if (heldSlot.itemId === ITEMS.POSSUM_TELEPORTER && state.portalCooldown <= 0) {
        teleportToPossum();
        return;
    }

    // Check for companion asking for food
    for (const mob of state.mobs) {
        if (mob.type !== "companion") continue;
        const compDef = MOB_DEFS.companion;
        const pcx = state.player.x + state.player.width / 2;
        const mcx = mob.x + compDef.width / 2;
        if (Math.abs(pcx - mcx) < BLOCK_SIZE * 4) {
            if (mob.askingForFood) {
                // Find any food in inventory
                for (let si = 0; si < state.inventory.slots.length; si++) {
                    const fSlot = state.inventory.slots[si];
                    if (fSlot.count > 0 && isFood(fSlot.itemId)) {
                        const foodName = getItemName(fSlot.itemId);
                        fSlot.count--;
                        if (fSlot.count === 0) { fSlot.itemId = 0; fSlot.durability = 0; }
                        mob.hungerTimer = 0;
                        mob.askingForFood = false;
                        mob.foodAskTimer = 0;
                        mob.health = Math.min(compDef.maxHealth, mob.health + 4);
                        addFloatingText(mob.x + compDef.width / 2, mob.y - 20, `Thanks for the ${foodName}!`, "#ffd700");
                        addFloatingText(mob.x + compDef.width / 2, mob.y - 34, "+4 HP", "#4ade80");
                        return;
                    }
                }
                addFloatingText(mob.x + compDef.width / 2, mob.y - 20, "I need food!", "#ff8888");
            } else {
                addFloatingText(mob.x + compDef.width / 2, mob.y - 20, "I'm good for now!", "#aaffaa");
            }
            return;
        }
        break;
    }

    // Check for nearby possum to pet
    for (const mob of state.mobs) {
        if (mob.type !== "possum") continue;
        const possDef = MOB_DEFS.possum;
        const pcx = state.player.x + state.player.width / 2;
        const pcy = state.player.y + state.player.height / 2;
        const mcx = mob.x + possDef.width / 2;
        const mcy = mob.y + possDef.height / 2;
        if (Math.sqrt((pcx - mcx) ** 2 + (pcy - mcy) ** 2) < BLOCK_SIZE * 4) {
            if (!mob.petCooldown || mob.petCooldown <= 0) {
                mob.petCooldown = 8000; // 8s between pets
                // Always give possum candy + heal on pet
                addToInventory(ITEMS.POSSUM_CANDY, 1);
                addFloatingText(mob.x + possDef.width / 2, mob.y - 20, "Got possum candy!", "#ff44cc");
                createParticles(mob.x + possDef.width / 2, mob.y + possDef.height / 2, 8, "#ff88dd", 2);
                // Fill health
                const heal = 4;
                state.player.health = Math.min(state.player.maxHealth, state.player.health + heal);
                addFloatingText(state.player.x, state.player.y - 40, `+${heal} HP`, "#ff88dd");
                addFloatingText(state.player.x, state.player.y - 28, "Petted the possum!", "#ffbbee");
            } else {
                addFloatingText(state.player.x, state.player.y - 20, "The possum needs space!", "#ccaacc");
            }
            return;
        }
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
        if (doorBlock === BLOCKS.DOOR_CLOSED || doorBlock === BLOCKS.DOOR_OPEN ||
            doorBlock === BLOCKS.IRON_DOOR_CLOSED || doorBlock === BLOCKS.IRON_DOOR_OPEN) {
            const pcx = state.player.x + state.player.width / 2, pcy = state.player.y + state.player.height / 2;
            const bcx = wmx_d * BLOCK_SIZE + BLOCK_SIZE / 2, bcy = wmy_d * BLOCK_SIZE + BLOCK_SIZE / 2;
            if (Math.sqrt((pcx - bcx) ** 2 + (pcy - bcy) ** 2) < BLOCK_SIZE * 5) {
                toggleDoor(wmx_d, wmy_d);
                return;
            }
        }
    }

    // Check if pointing at a chest or blast furnace within reach
    const wmx_c = Math.floor((state.mouse.x + state.camera.x) / BLOCK_SIZE);
    const wmy_c = Math.floor((state.mouse.y + state.camera.y) / BLOCK_SIZE);
    if (wmx_c >= 0 && wmx_c < WORLD_WIDTH && wmy_c >= 0 && wmy_c < WORLD_HEIGHT) {
        const pcx = state.player.x + state.player.width / 2, pcy = state.player.y + state.player.height / 2;
        const bcx = wmx_c * BLOCK_SIZE + BLOCK_SIZE / 2, bcy = wmy_c * BLOCK_SIZE + BLOCK_SIZE / 2;
        const blockDist = Math.sqrt((pcx - bcx) ** 2 + (pcy - bcy) ** 2);
        if (state.activeWorld[wmx_c][wmy_c] === BLOCKS.CHEST && blockDist < BLOCK_SIZE * 5) {
            const key = `${wmx_c},${wmy_c}`;
            if (!state.chestData[key]) initChestData(wmx_c, wmy_c);
            state.chestOpen = true;
            state.chestPos = { x: wmx_c, y: wmy_c };
            state.chestHover = -1;
            return;
        }
        if (state.activeWorld[wmx_c][wmy_c] === BLOCKS.BLAST_FURNACE && blockDist < BLOCK_SIZE * 5) {
            state.blastFurnaceOpen = true;
            state.blastFurnacePos = { x: wmx_c, y: wmy_c };
            state.blastFurnaceHover = -1;
            return;
        }
        if (state.activeWorld[wmx_c][wmy_c] === BLOCKS.FURNACE && blockDist < BLOCK_SIZE * 5) {
            const key = `${wmx_c},${wmy_c}`;
            if (!state.furnaceData[key]) {
                state.furnaceData[key] = {
                    inputSlot:  { itemId: 0, count: 0 },
                    fuelSlot:   { itemId: 0, count: 0 },
                    outputSlot: { itemId: 0, count: 0 },
                    progress: 0, fuelLeft: 0, maxFuel: 0,
                };
            }
            state.furnaceOpen = true;
            state.furnacePos = { x: wmx_c, y: wmy_c };
            return;
        }
        if (state.activeWorld[wmx_c][wmy_c] === BLOCKS.SMOKER && blockDist < BLOCK_SIZE * 5) {
            const key = `${wmx_c},${wmy_c}`;
            if (!state.smokerData[key]) {
                state.smokerData[key] = {
                    inputSlot:  { itemId: 0, count: 0 },
                    fuelSlot:   { itemId: 0, count: 0 },
                    outputSlot: { itemId: 0, count: 0 },
                    progress: 0, fuelLeft: 0, maxFuel: 0,
                };
            }
            state.smokerOpen = true;
            state.smokerPos = { x: wmx_c, y: wmy_c };
            return;
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
    const isIron = current === BLOCKS.IRON_DOOR_CLOSED || current === BLOCKS.IRON_DOOR_OPEN;
    const closedId = isIron ? BLOCKS.IRON_DOOR_CLOSED : BLOCKS.DOOR_CLOSED;
    const openId   = isIron ? BLOCKS.IRON_DOOR_OPEN   : BLOCKS.DOOR_OPEN;
    const newId = (current === closedId) ? openId : closedId;
    state.activeWorld[x][y] = newId;
    syncBlock(x, y, newId);
    // Toggle paired half (above or below)
    if (y > 0 && (state.activeWorld[x][y-1] === closedId || state.activeWorld[x][y-1] === openId)) {
        state.activeWorld[x][y-1] = newId;
        syncBlock(x, y - 1, newId);
    }
    if (y < WORLD_HEIGHT - 1 && (state.activeWorld[x][y+1] === closedId || state.activeWorld[x][y+1] === openId)) {
        state.activeWorld[x][y+1] = newId;
        syncBlock(x, y + 1, newId);
    }
    playBlockPlace();
}

// ============================================================
// GUN FIRING
// ============================================================

function ammoItemForGun(itemInfo, selectedSlot) {
    if (itemInfo.ammoType === "rocket") return ITEMS.ROCKET;
    if (itemInfo.ammoType === "fuel")   return ITEMS.FUEL_CANISTER;
    if (itemInfo.ammoType === "powerfuse") return ITEMS.POWER_FUSE;
    if (itemInfo.ammoType === "sniper") {
        // Prefer AP bullets, fall back to regular sniper bullets
        const hasAP = state.inventory.slots.some((s, i) => i !== selectedSlot && s.itemId === ITEMS.SNIPER_AP_BULLET && s.count > 0);
        return hasAP ? ITEMS.SNIPER_AP_BULLET : ITEMS.SNIPER_BULLET;
    }
    return ITEMS.BULLETS;
}

function noAmmoText(itemInfo) {
    if (itemInfo.ammoType === "rocket") return "No rockets!";
    if (itemInfo.ammoType === "fuel")   return "No fuel!";
    if (itemInfo.ammoType === "powerfuse") return "No power fuse!";
    if (itemInfo.ammoType === "sniper") return "No sniper ammo!";
    return "No ammo!";
}

function startReload(slot, itemInfo, selectedSlot) {
    const ammoItemId = ammoItemForGun(itemInfo, selectedSlot);
    const ammoSlot = state.inventory.slots.findIndex((s, i) => i !== selectedSlot && s.itemId === ammoItemId && s.count > 0);
    if (ammoSlot === -1) {
        addFloatingText(state.player.x, state.player.y - 20, noAmmoText(itemInfo), "#ef4444");
        return false;
    }
    state.gunReloadTimer = itemInfo.reloadTime;
    state.gunReloadingSlot = selectedSlot;
    addFloatingText(state.player.x, state.player.y - 20, "Reloading...", "#facc15");
    return true;
}

function finishReload() {
    const slotIdx = state.gunReloadingSlot;
    const slot = state.inventory.slots[slotIdx];
    if (!slot || slot.count === 0) { state.gunReloadingSlot = -1; return; }
    const itemInfo = ITEM_INFO[slot.itemId];
    if (!itemInfo) { state.gunReloadingSlot = -1; return; }
    const isFuel = itemInfo.ammoType === "fuel" || itemInfo.ammoType === "powerfuse";
    const ammoItemId = ammoItemForGun(itemInfo, slotIdx);
    const ammoSlot = state.inventory.slots.findIndex((s, i) => i !== slotIdx && s.itemId === ammoItemId && s.count > 0);
    if (ammoSlot !== -1) {
        if (isFuel) {
            // 1 fuel canister = full mag
            slot.magAmmo = itemInfo.magSize;
            state.inventory.slots[ammoSlot].count--;
        } else {
            const needed = itemInfo.magSize - (slot.magAmmo || 0);
            const take = Math.min(needed, state.inventory.slots[ammoSlot].count);
            slot.magAmmo = (slot.magAmmo || 0) + take;
            state.inventory.slots[ammoSlot].count -= take;
        }
        // Track loaded ammo type for AP sniper bullets
        slot.loadedAmmoId = ammoItemId;
        if (state.inventory.slots[ammoSlot].count <= 0) {
            state.inventory.slots[ammoSlot].itemId = 0;
            state.inventory.slots[ammoSlot].count = 0;
        }
    }
    state.gunReloadingSlot = -1;
}

export function handleGunFire(dt) {
    if (state.gunCooldown > 0) state.gunCooldown -= dt;

    // Tick reload timer
    if (state.gunReloadTimer > 0) {
        state.gunReloadTimer -= dt;
        if (state.gunReloadTimer <= 0) {
            state.gunReloadTimer = 0;
            finishReload();
        }
    }

    if (state.craftingOpen || state.tradingOpen || state.chestOpen || state.gameOver || state.sleeping) return;

    const selectedSlot = state.inventory.selectedSlot;
    const slot = state.inventory.slots[selectedSlot];
    if (slot.count === 0 || slot.itemId === 0) return;
    const itemInfo = ITEM_INFO[slot.itemId];


    if (!itemInfo || itemInfo.toolType !== "gun") return;

    // Switching guns cancels reload
    if (state.gunReloadTimer > 0 && state.gunReloadingSlot !== selectedSlot) {
        state.gunReloadTimer = 0;
        state.gunReloadingSlot = -1;
    }

    // Lazy-init mag ammo
    if (slot.magAmmo === undefined) slot.magAmmo = itemInfo.magSize;

    // Still reloading
    if (state.gunReloadTimer > 0) return;

    if (!state.mouse.leftDown) return;
    if (state.gunCooldown > 0) return;
    if (slot.magAmmo <= 0) return; // waiting for auto-reload to finish

    // Fire!
    const px = state.player.x + state.player.width / 2;
    const py = state.player.y + state.player.height / 3;
    const targetX = state.mouse.x + state.camera.x;
    const targetY = state.mouse.y + state.camera.y;

    if (itemInfo.ammoType === "rocket") {
        createRocket(px, py, targetX, targetY, itemInfo.damage);
    } else if (itemInfo.ammoType === "fuel") {
        createFlame(px, py, targetX, targetY, itemInfo.damage);
    } else if (itemInfo.ammoType === "powerfuse") {
        createLaserBeam(px, py, targetX, targetY, itemInfo.damage);
    } else if (itemInfo.ammoType === "sniper") {
        const isAP = slot.loadedAmmoId === ITEMS.SNIPER_AP_BULLET;
        createSniperBullet(px, py, targetX, targetY, itemInfo.damage, false, isAP);
    } else {
        createBullet(px, py, targetX, targetY, itemInfo.damage);
    }
    slot.magAmmo--;
    state.gunCooldown = itemInfo.fireRate;

    // Auto-reload immediately when mag empties
    if (slot.magAmmo <= 0) startReload(slot, itemInfo, selectedSlot);

    // Damage gun durability
    if (slot.durability !== undefined) {
        slot.durability--;
        if (slot.durability <= 0) {
            slot.itemId = 0; slot.count = 0; slot.durability = 0; slot.magAmmo = undefined;
            addFloatingText(state.player.x, state.player.y - 30, "Gun broke!", "#ef4444");
        }
    }
}

// Manual reload — callable from R key or mobile reload button
export function triggerManualReload() {
    if (state.craftingOpen || state.tradingOpen || state.chestOpen || state.gameOver || state.sleeping) return;
    const selectedSlot = state.inventory.selectedSlot;
    const slot = state.inventory.slots[selectedSlot];
    if (!slot || slot.count === 0) return;
    const itemInfo = ITEM_INFO[slot.itemId];
    if (!itemInfo || itemInfo.toolType !== "gun") return;
    if (state.gunReloadTimer > 0) return; // already reloading
    if (slot.magAmmo === undefined) slot.magAmmo = itemInfo.magSize;
    if (slot.magAmmo >= itemInfo.magSize) return; // mag already full
    const ammoItemId = ammoItemForGun(itemInfo, selectedSlot);
    const ammoSlot = state.inventory.slots.findIndex((s, i) => i !== selectedSlot && s.itemId === ammoItemId && s.count > 0);
    if (ammoSlot === -1) {
        addFloatingText(state.player.x, state.player.y - 20, noAmmoText(itemInfo), "#ef4444");
        return;
    }
    state.gunReloadTimer = itemInfo.reloadTime;
    state.gunReloadingSlot = selectedSlot;
    addFloatingText(state.player.x, state.player.y - 20, "Reloading...", "#facc15");
}
