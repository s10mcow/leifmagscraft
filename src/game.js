// ============================================================
// GAME.JS - Main game loop and initialization (ES Module)
// ============================================================
// This is the HEART of the game. It runs 60 times per second,
// updating everything and drawing everything on screen.
// All the other files provide the pieces - this file
// puts them all together!
// ============================================================

import { state } from './state.js';
import { BLOCKS, ITEMS, BLOCK_SIZE, WORLD_WIDTH, WORLD_HEIGHT, BLOCK_INFO, ITEM_INFO, MOB_DEFS, SAVE_KEY_PREFIX, SAVE_INDEX_KEY, isBlockId, isFood, getItemName, TORCH_LIGHT_RADIUS } from './constants.js';
import { ARMOR_SLOT_TYPES, addToInventory, addFloatingText, getEquippedTool, getEquippedTier, damageEquippedTool, eatFood, countItem } from './inventory.js';
import { isBlockSolid, findSurfaceY, generateWorld, generateNetherWorld, switchDimension, initChestData, removeChestData, checkLavaWaterInteraction } from './world.js';
import { updatePlayer, updateCamera, updatePlateTimers, hurtPlayer } from './player.js';
import { createMob, createBullet, createRocket, createParticles, updateMobs, updateProjectiles, updateParticles, spawnMobs, spawnVillagers } from './mobs.js';
import { playMineHit, playBlockBreak, playBlockPlace, playPickup, playCraft, updateMusic } from './audio.js';
import { drawSky, drawBackgroundTrees, drawBlock, drawAllMobs, drawProjectiles, drawParticles, drawPlayer } from './rendering.js';
import { drawFloatingTexts, drawHotbar, drawHealthBar, drawBlockHighlight, drawMiningProgress, drawCraftingMenu, drawChestMenu, drawTradingMenu, drawDeathScreen, drawHUD, drawTitleScreen, drawPauseMenu, drawGeneratingScreen, drawLoadingScreen, drawSavingScreen } from './ui.js';

// --- LOCAL CONSTANTS ---
const DAY_CYCLE_SPEED = 0.00004; // Slower = longer days and nights
const SLEEP_DURATION = 2000; // 2 second animation

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
// F KEY - INTERACT (eat food or sleep in bed)
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

export function updateSleep(dt) {
    if (!state.sleeping) return;
    state.sleepTimer += dt;

    if (state.sleepTimer >= SLEEP_DURATION) {
        // Wake up! Set time to early morning
        state.timeOfDay = 0.05;
        state.sleeping = false;
        state.sleepTimer = 0;
        // Despawn hostile mobs
        for (let i = state.mobs.length - 1; i >= 0; i--) {
            if (MOB_DEFS[state.mobs[i].type].hostile) state.mobs.splice(i, 1);
        }
        addFloatingText(state.player.x, state.player.y - 30, "Good morning!", "#ffd700");
    }
}

// ============================================================
// TRADING
// ============================================================

export function executeTrade(trade) {
    const emeraldCount = countItem(BLOCKS.EMERALD);
    if (emeraldCount < trade.cost) {
        addFloatingText(state.player.x, state.player.y - 20, "Not enough emeralds!", "#ef4444");
        return;
    }
    let toRemove = trade.cost;
    for (let i = 0; i < state.inventory.slots.length && toRemove > 0; i++) {
        const slot = state.inventory.slots[i];
        if (slot.itemId === BLOCKS.EMERALD) {
            const take = Math.min(slot.count, toRemove);
            slot.count -= take;
            toRemove -= take;
            if (slot.count === 0) { slot.itemId = 0; slot.durability = 0; }
        }
    }
    addToInventory(trade.result, trade.resultCount);
    playCraft();
    addFloatingText(state.player.x, state.player.y - 30, "Traded for " + getItemName(trade.result) + "!", "#ffd700");
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
// NETHER PORTAL
// ============================================================

export function teleportToOtherDimension() {
    if (state.inNether) {
        // Return to overworld
        switchDimension(false);
        state.player.x = state.overworldPortalX * BLOCK_SIZE;
        state.player.y = (state.overworldPortalY - 2) * BLOCK_SIZE;
    } else {
        // Save overworld position
        state.overworldPortalX = Math.floor(state.player.x / BLOCK_SIZE);
        state.overworldPortalY = Math.floor(state.player.y / BLOCK_SIZE);

        // Generate Nether if first time
        if (state.netherWorld.length === 0) {
            generateNetherWorld();
        }

        switchDimension(true);

        // Find safe spawn in Nether
        const spawnX = Math.floor(WORLD_WIDTH / 2);
        const surfY = findSurfaceY(spawnX);
        state.netherPortalX = spawnX;
        state.netherPortalY = surfY;
        state.player.x = spawnX * BLOCK_SIZE;
        state.player.y = (surfY - 2) * BLOCK_SIZE;
    }

    // Clear mobs on dimension change
    state.mobs.length = 0;
    state.portalCooldown = 3000;
    state.player.velX = 0;
    state.player.velY = 0;
    addFloatingText(state.player.x, state.player.y - 30, state.inNether ? "Entered the Nether!" : "Returned to Overworld!", state.inNether ? "#ff4444" : "#4ade80");
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

// ============================================================
// DRAW THE GAME WORLD (reused by playing and paused states)
// ============================================================

export function drawGameFrame(timestamp) {
    const camX = state.camera.x - state.screenShake.x;
    const camY = state.camera.y - state.screenShake.y;

    // 1. Sky
    drawSky(state.cachedDayBrightness);

    // 1.5. Background trees (parallax layer, before foreground blocks)
    drawBackgroundTrees();

    // 2. Blocks (only visible ones)
    const sc = Math.max(0, Math.floor(camX / BLOCK_SIZE));
    const ec = Math.min(WORLD_WIDTH, Math.ceil((camX + state.canvas.width) / BLOCK_SIZE) + 1);
    const sr = Math.max(0, Math.floor(camY / BLOCK_SIZE));
    const er = Math.min(WORLD_HEIGHT, Math.ceil((camY + state.canvas.height) / BLOCK_SIZE) + 1);

    for (let x = sc; x < ec; x++) {
        for (let y = sr; y < er; y++) {
            if (state.activeWorld[x][y] !== BLOCKS.AIR) {
                drawBlock(state.activeWorld[x][y], x * BLOCK_SIZE - state.camera.x + state.screenShake.x, y * BLOCK_SIZE - state.camera.y + state.screenShake.y);
            }
        }
    }

    // 3. Night overlay with torch lighting
    if (state.cachedDayBrightness < 0.7) {
        const nightAlpha = (0.7 - state.cachedDayBrightness) * 0.7;
        state.ctx.fillStyle = state.inNether ? `rgba(10,0,0,${nightAlpha})` : `rgba(0,0,20,${nightAlpha})`;
        state.ctx.fillRect(0, 0, state.canvas.width, state.canvas.height);

        if (nightAlpha > 0.05) {
            state.ctx.save();
            state.ctx.globalCompositeOperation = "lighter";
            const lightPx = TORCH_LIGHT_RADIUS * BLOCK_SIZE;
            for (let x = sc; x < ec; x++) {
                for (let y = sr; y < er; y++) {
                    const block = state.activeWorld[x][y];
                    let glowColor = null, glowRadius = lightPx, glowStrength = 1.0;
                    if (block === BLOCKS.TORCH) {
                        glowColor = [255, 200, 80];
                    } else if (block === BLOCKS.GLOWSTONE) {
                        glowColor = [255, 230, 120];
                        glowRadius = lightPx * 1.2;
                    } else if (block === BLOCKS.LAVA) {
                        glowColor = [255, 100, 20];
                        glowRadius = lightPx * 0.7;
                        glowStrength = 0.6;
                    }
                    if (glowColor) {
                        const tx = x * BLOCK_SIZE - state.camera.x + state.screenShake.x + BLOCK_SIZE / 2;
                        const ty = y * BLOCK_SIZE - state.camera.y + state.screenShake.y + BLOCK_SIZE / 2;
                        const flicker = 1.0 + Math.sin(timestamp * 0.008 + x * 7 + y * 13) * 0.06;
                        const radius = glowRadius * flicker;
                        const glow = state.ctx.createRadialGradient(tx, ty, 0, tx, ty, radius);
                        const strength = Math.min(nightAlpha * 0.45 * glowStrength, 0.22);
                        glow.addColorStop(0, `rgba(${glowColor[0]},${glowColor[1]},${glowColor[2]},${strength})`);
                        glow.addColorStop(0.5, `rgba(${glowColor[0]},${glowColor[1]},${glowColor[2]},${strength * 0.4})`);
                        glow.addColorStop(1, `rgba(${glowColor[0]},${glowColor[1]},${glowColor[2]},0)`);
                        state.ctx.fillStyle = glow;
                        state.ctx.beginPath();
                        state.ctx.arc(tx, ty, radius, 0, Math.PI * 2);
                        state.ctx.fill();
                    }
                }
            }
            state.ctx.globalCompositeOperation = "source-over";
            state.ctx.restore();
        }
    }

    // 4. Block highlight
    drawBlockHighlight();

    // 5. Mining progress
    drawMiningProgress();

    // 6. Mobs
    drawAllMobs();

    // 7. Projectiles
    drawProjectiles();

    // 8. Particles
    drawParticles();

    // 9. Player
    drawPlayer();

    // 10. Floating texts
    drawFloatingTexts();

    // 11. UI
    drawHotbar();
    drawHealthBar();
    drawHUD();

    // 12. Crafting overlay
    drawCraftingMenu();

    // 12.5. Chest overlay
    drawChestMenu();

    // 12.6. Trading overlay
    drawTradingMenu();

    // 13. Death screen
    drawDeathScreen();

    // 14. Sleep overlay
    if (state.sleeping) {
        const progress = state.sleepTimer / SLEEP_DURATION;
        const alpha = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
        state.ctx.fillStyle = `rgba(0, 0, 20, ${Math.min(alpha, 0.95)})`;
        state.ctx.fillRect(0, 0, state.canvas.width, state.canvas.height);
        state.ctx.fillStyle = "#ffffff"; state.ctx.font = "bold 28px 'Courier New', monospace"; state.ctx.textAlign = "center";
        state.ctx.fillText("Sleeping...", state.canvas.width / 2, state.canvas.height / 2);
        const dots = ".".repeat(Math.floor((state.sleepTimer / 400) % 4));
        state.ctx.fillStyle = "#9ca3af"; state.ctx.font = "16px 'Courier New', monospace";
        state.ctx.fillText(`Zzz${dots}`, state.canvas.width / 2, state.canvas.height / 2 + 35);
    }
}

// ============================================================
// MAIN GAME LOOP - runs ~60 times per second!
// ============================================================

export function gameLoop(timestamp) {
    const dt = timestamp - state.lastTime;
    state.lastTime = timestamp;

    try {
        switch (state.gameState) {
            case "menu":
                drawTitleScreen();
                break;

            case "generating":
                drawGeneratingScreen();
                break;

            case "loading":
                drawLoadingScreen();
                break;

            case "saving":
                drawSavingScreen();
                break;

            case "paused":
                drawGameFrame(timestamp);
                drawPauseMenu();
                break;

            case "playing":
                state.cachedDayBrightness = Math.cos(state.timeOfDay * Math.PI * 2) * 0.5 + 0.5;
                if (state.inNether) state.cachedDayBrightness = 0.3;

                if (state.portalCooldown > 0) state.portalCooldown -= dt;

                // Player burn damage (from ghast fireballs)
                if (state.player.burnTimer > 0) {
                    state.player.burnTimer -= dt;
                    if (Math.floor(state.player.burnTimer / 500) < Math.floor((state.player.burnTimer + dt) / 500)) {
                        hurtPlayer(1, state.player.x);
                        addFloatingText(state.player.x, state.player.y - 30, "Burning!", "#ff6600");
                    }
                }

                updateSleep(dt);
                if (!state.sleeping) {
                    updatePlayer(dt);
                    updatePlateTimers(dt);
                    updateCamera();
                    handleGunFire(dt);
                    updateMining(dt);
                    updateMobs(dt, state.cachedDayBrightness);
                    updateProjectiles(dt);
                    updateParticles(dt);
                    updateLeafDecay(dt);
                    spawnMobs(dt, state.cachedDayBrightness);
                }
                updateMusic(dt, state.cachedDayBrightness);
                if (!state.inNether) state.timeOfDay = (state.timeOfDay + DAY_CYCLE_SPEED) % 1;

                drawGameFrame(timestamp);
                break;
        }
    } catch (e) {
        // Show error on screen so we can debug
        state.ctx.fillStyle = "#1a1a2e";
        state.ctx.fillRect(0, 0, state.canvas.width, state.canvas.height);
        state.ctx.fillStyle = "#ef4444";
        state.ctx.font = "bold 20px 'Courier New', monospace";
        state.ctx.textAlign = "center";
        state.ctx.fillText("Runtime Error: " + e.message, state.canvas.width / 2, state.canvas.height / 2 - 20);
        state.ctx.fillStyle = "#9ca3af";
        state.ctx.font = "14px 'Courier New', monospace";
        state.ctx.fillText("State: " + state.gameState + " | Check console (F12)", state.canvas.width / 2, state.canvas.height / 2 + 15);
        console.error("Game loop error in state '" + state.gameState + "':", e);
        console.error("Stack:", e.stack);
    }

    requestAnimationFrame(gameLoop);
}

// ============================================================
// LEAF DECAY SYSTEM
// ============================================================

const WOOD_BLOCKS = new Set([BLOCKS.WOOD, BLOCKS.SPRUCE_WOOD, BLOCKS.ACACIA_WOOD, BLOCKS.NETHER_WOOD, BLOCKS.WARPED_WOOD]);
const LEAF_BLOCKS = new Set([BLOCKS.LEAVES, BLOCKS.SPRUCE_LEAVES, BLOCKS.ACACIA_LEAVES, BLOCKS.NETHER_LEAVES, BLOCKS.WARPED_LEAVES]);
const TREE_BLOCKS = new Set([BLOCKS.WOOD, BLOCKS.LEAVES, BLOCKS.SPRUCE_WOOD, BLOCKS.SPRUCE_LEAVES, BLOCKS.ACACIA_WOOD, BLOCKS.ACACIA_LEAVES, BLOCKS.NETHER_WOOD, BLOCKS.NETHER_LEAVES, BLOCKS.WARPED_WOOD, BLOCKS.WARPED_LEAVES]);

function hasNearbyWood(bx, by) {
    const range = 4;
    for (let dx = -range; dx <= range; dx++) {
        for (let dy = -range; dy <= range; dy++) {
            const nx = bx + dx, ny = by + dy;
            if (nx < 0 || nx >= WORLD_WIDTH || ny < 0 || ny >= WORLD_HEIGHT) continue;
            if (WOOD_BLOCKS.has(state.activeWorld[nx][ny])) return true;
        }
    }
    return false;
}

function scheduleLeafDecay(wx, wy) {
    const range = 6;
    for (let dx = -range; dx <= range; dx++) {
        for (let dy = -range; dy <= range; dy++) {
            const nx = wx + dx, ny = wy + dy;
            if (nx < 0 || nx >= WORLD_WIDTH || ny < 0 || ny >= WORLD_HEIGHT) continue;
            if (!LEAF_BLOCKS.has(state.activeWorld[nx][ny])) continue;
            if (state.leafDecayQueue.some(function(e) { return e.x === nx && e.y === ny; })) continue;
            state.leafDecayQueue.push({ x: nx, y: ny, timer: 500 + Math.random() * 3500 });
        }
    }
}

function updateLeafDecay(dt) {
    for (let i = state.leafDecayQueue.length - 1; i >= 0; i--) {
        const entry = state.leafDecayQueue[i];
        entry.timer -= dt;
        if (entry.timer <= 0) {
            state.leafDecayQueue.splice(i, 1);
            if (!LEAF_BLOCKS.has(state.activeWorld[entry.x][entry.y])) continue;
            if (!hasNearbyWood(entry.x, entry.y)) {
                state.activeWorld[entry.x][entry.y] = BLOCKS.AIR;
            }
        }
    }
}

// ============================================================
// RESET ALL GAME STATE
// ============================================================

export function resetAllGameState() {
    // World data
    state.world.length = 0;
    state.netherWorld.length = 0;
    state.biomeMap.length = 0;
    state.netherBiomeMap.length = 0;
    state.bgWorld.length = 0;
    state.netherBgWorld.length = 0;
    state.activeBgWorld = null;
    for (const key in state.chestData) delete state.chestData[key];

    // Player
    state.player.x = 0; state.player.y = 0;
    state.player.velX = 0; state.player.velY = 0;
    state.player.health = 20; state.player.facing = 1;
    state.player.invincibleTimer = 0; state.player.attackCooldown = 0;
    state.player.onGround = false; state.player.isFalling = false;
    state.player.fallStartY = 0;

    // Inventory
    for (let i = 0; i < state.inventory.slots.length; i++) {
        state.inventory.slots[i] = { itemId: 0, count: 0, durability: 0 };
    }
    state.inventory.selectedSlot = 0;
    state.inventory.slots[0] = { itemId: ITEMS.PISTOL, count: 1, durability: ITEM_INFO[ITEMS.PISTOL].durability };
    state.inventory.slots[1] = { itemId: ITEMS.BULLETS, count: 64, durability: 0 };
    state.inventory.slots[2] = { itemId: ITEMS.MINIATURE_NETHER_PORTAL, count: 1, durability: 0 };
    for (const type of ARMOR_SLOT_TYPES) {
        state.inventory.armor[type] = { itemId: 0, count: 0, durability: 0 };
    }
    state.cursorItem.itemId = 0; state.cursorItem.count = 0; state.cursorItem.durability = 0;
    state.offhand.itemId = 0; state.offhand.count = 0; state.offhand.durability = 0;

    // Mobs & entities
    state.mobs.length = 0;
    state.projectiles.length = 0;
    state.particles.length = 0;
    state.floatingTexts.length = 0;
    state.mobSpawnTimer = 0;

    // Game flags
    state.gameOver = false;
    state.craftingOpen = false; state.craftingHover = -1; state.craftingScroll = 0;
    state.tradingOpen = false; state.tradingVillager = null; state.tradingHover = -1;
    state.chestOpen = false; state.chestPos = null; state.chestHover = -1;
    state.sleeping = false; state.sleepTimer = 0;
    state.mining.active = false; state.mining.progress = 0;
    state.mining.blockX = -1; state.mining.blockY = -1;
    state.gunCooldown = 0;

    // Dimension
    state.inNether = false;
    state.activeWorld = state.world;
    state.overworldPortalX = 0; state.overworldPortalY = 0;
    state.netherPortalX = 0; state.netherPortalY = 0;
    state.portalCooldown = 0;

    // Time
    state.timeOfDay = 0;
    state.cachedDayBrightness = 1;

    // Village/structure tracking
    state.villageLocations.length = 0;
    state.structureLocations.length = 0;

    // Plate timers
    state.plateTimers.length = 0;

    // Leaf decay
    state.leafDecayQueue.length = 0;
    state.placedBlocks.clear();

    // Music
    state.musicTimer = 0;
    state.musicNoteIndex = 0;

    // Camera
    state.camera.x = 0; state.camera.y = 0;
    state.screenShake.x = 0; state.screenShake.y = 0; state.screenShake.intensity = 0;
}

// ============================================================
// RLE COMPRESSION FOR WORLD ARRAYS
// ============================================================

function rleEncode(worldArr) {
    const flat = [];
    for (let x = 0; x < worldArr.length; x++) {
        for (let y = 0; y < worldArr[x].length; y++) {
            flat.push(worldArr[x][y]);
        }
    }
    const runs = [];
    let i = 0;
    while (i < flat.length) {
        const val = flat[i];
        let count = 1;
        while (i + count < flat.length && flat[i + count] === val) count++;
        runs.push(val + ":" + count);
        i += count;
    }
    return runs.join(",");
}

function rleDecode(encoded, width, height) {
    const arr = [];
    for (let x = 0; x < width; x++) {
        arr[x] = new Array(height);
    }
    const runs = encoded.split(",");
    let idx = 0;
    for (const run of runs) {
        const parts = run.split(":");
        const val = parseInt(parts[0]);
        const count = parseInt(parts[1]);
        for (let i = 0; i < count; i++) {
            const x = Math.floor(idx / height);
            const y = idx % height;
            if (x < width && y < height) arr[x][y] = val;
            idx++;
        }
    }
    return arr;
}

// ============================================================
// SAVE / LOAD SYSTEM
// ============================================================

export function refreshSaveList() {
    try {
        const raw = localStorage.getItem(SAVE_INDEX_KEY);
        state.menuSaveList = raw ? JSON.parse(raw) : [];
        state.menuSaveList = state.menuSaveList.filter(function(s) {
            return localStorage.getItem(SAVE_KEY_PREFIX + s.name) !== null;
        });
        localStorage.setItem(SAVE_INDEX_KEY, JSON.stringify(state.menuSaveList));
    } catch (e) {
        state.menuSaveList = [];
    }
}

function updateSaveIndex(name, timestamp) {
    refreshSaveList();
    const existing = state.menuSaveList.findIndex(function(s) { return s.name === name; });
    if (existing >= 0) {
        state.menuSaveList[existing].timestamp = timestamp;
    } else {
        state.menuSaveList.push({ name: name, timestamp: timestamp });
    }
    try { localStorage.setItem(SAVE_INDEX_KEY, JSON.stringify(state.menuSaveList)); } catch(e) {}
}

export function deleteSave(name) {
    try { localStorage.removeItem(SAVE_KEY_PREFIX + name); } catch(e) {}
    refreshSaveList();
}

export function saveWorld() {
    const saveData = {
        version: 1,
        name: state.currentWorldName,
        timestamp: Date.now(),
        world: rleEncode(state.world),
        netherWorld: state.netherWorld.length > 0 ? rleEncode(state.netherWorld) : null,
        biomeMap: state.biomeMap.slice(),
        netherBiomeMap: state.netherBiomeMap.slice(),
        bgWorld: state.bgWorld.length > 0 ? rleEncode(state.bgWorld) : null,
        netherBgWorld: state.netherBgWorld.length > 0 ? rleEncode(state.netherBgWorld) : null,
        chestData: JSON.parse(JSON.stringify(state.chestData)),
        inventory: {
            slots: state.inventory.slots.map(function(s) { return { itemId: s.itemId, count: s.count, durability: s.durability }; }),
            armor: {
                helmet: Object.assign({}, state.inventory.armor.helmet),
                chestplate: Object.assign({}, state.inventory.armor.chestplate),
                leggings: Object.assign({}, state.inventory.armor.leggings),
                boots: Object.assign({}, state.inventory.armor.boots)
            },
            selectedSlot: state.inventory.selectedSlot
        },
        cursorItem: { itemId: state.cursorItem.itemId, count: state.cursorItem.count, durability: state.cursorItem.durability },
        offhand: { itemId: state.offhand.itemId, count: state.offhand.count, durability: state.offhand.durability },
        placedBlocks: Array.from(state.placedBlocks),
        player: {
            x: state.player.x, y: state.player.y,
            health: state.player.health, facing: state.player.facing
        },
        timeOfDay: state.timeOfDay,
        inNether: state.inNether,
        overworldPortalX: state.overworldPortalX,
        overworldPortalY: state.overworldPortalY,
        netherPortalX: state.netherPortalX,
        netherPortalY: state.netherPortalY,
        mobs: state.mobs.filter(function(m) { return !MOB_DEFS[m.type].hostile; }).map(function(m) {
            const md = { type: m.type, x: m.x, y: m.y, health: m.health, facing: m.facing };
            if (m.type === "wolf") { md.tamed = m.tamed; md.sitting = m.sitting; }
            return md;
        })
    };

    try {
        localStorage.setItem(SAVE_KEY_PREFIX + state.currentWorldName, JSON.stringify(saveData));
        updateSaveIndex(state.currentWorldName, Date.now());
        return true;
    } catch (e) {
        console.error("Save failed:", e);
        return false;
    }
}

export function loadWorld(worldName) {
    state.gameState = "loading";
    setTimeout(function() {
        try {
            const raw = localStorage.getItem(SAVE_KEY_PREFIX + worldName);
            if (!raw) { state.gameState = "menu"; return; }

            const data = JSON.parse(raw);
            resetAllGameState();

            // World
            const decoded = rleDecode(data.world, WORLD_WIDTH, WORLD_HEIGHT);
            for (let x = 0; x < WORLD_WIDTH; x++) state.world[x] = decoded[x];

            if (data.netherWorld) {
                const nDecoded = rleDecode(data.netherWorld, WORLD_WIDTH, WORLD_HEIGHT);
                for (let x = 0; x < WORLD_WIDTH; x++) state.netherWorld[x] = nDecoded[x];
            }

            // BiomeMap
            for (let i = 0; i < data.biomeMap.length; i++) state.biomeMap[i] = data.biomeMap[i];
            if (data.netherBiomeMap) {
                for (let i = 0; i < data.netherBiomeMap.length; i++) state.netherBiomeMap[i] = data.netherBiomeMap[i];
            }
            if (data.bgWorld) {
                const bgDecoded = rleDecode(data.bgWorld, WORLD_WIDTH, WORLD_HEIGHT);
                for (let x = 0; x < WORLD_WIDTH; x++) state.bgWorld[x] = bgDecoded[x];
                state.activeBgWorld = state.inNether ? state.netherBgWorld : state.bgWorld;
            }
            if (data.netherBgWorld) {
                const nbgDecoded = rleDecode(data.netherBgWorld, WORLD_WIDTH, WORLD_HEIGHT);
                for (let x = 0; x < WORLD_WIDTH; x++) state.netherBgWorld[x] = nbgDecoded[x];
            }

            // Chests
            for (const key in data.chestData) state.chestData[key] = data.chestData[key];

            // Inventory
            for (let i = 0; i < data.inventory.slots.length; i++) {
                state.inventory.slots[i] = data.inventory.slots[i];
            }
            state.inventory.selectedSlot = data.inventory.selectedSlot;
            for (const type of ARMOR_SLOT_TYPES) {
                state.inventory.armor[type] = data.inventory.armor[type];
            }
            state.cursorItem.itemId = data.cursorItem.itemId;
            state.cursorItem.count = data.cursorItem.count;
            state.cursorItem.durability = data.cursorItem.durability;
            if (data.offhand) {
                state.offhand.itemId = data.offhand.itemId;
                state.offhand.count = data.offhand.count;
                state.offhand.durability = data.offhand.durability;
            }
            if (data.placedBlocks) {
                for (const k of data.placedBlocks) state.placedBlocks.add(k);
            }

            // Player
            state.player.x = data.player.x;
            state.player.y = data.player.y;
            state.player.health = data.player.health;
            state.player.facing = data.player.facing;

            // Dimension
            state.timeOfDay = data.timeOfDay;
            state.inNether = data.inNether;
            state.activeWorld = state.inNether ? state.netherWorld : state.world;
            state.activeBgWorld = state.inNether ? state.netherBgWorld : state.bgWorld;
            state.overworldPortalX = data.overworldPortalX;
            state.overworldPortalY = data.overworldPortalY;
            state.netherPortalX = data.netherPortalX;
            state.netherPortalY = data.netherPortalY;

            // Mobs (passive only, hostile will respawn)
            if (data.mobs) {
                for (const mData of data.mobs) {
                    const mob = createMob(mData.type, mData.x, mData.y);
                    mob.health = mData.health;
                    mob.facing = mData.facing;
                    if (mData.tamed !== undefined) mob.tamed = mData.tamed;
                    if (mData.sitting !== undefined) mob.sitting = mData.sitting;
                    state.mobs.push(mob);
                }
            }

            state.currentWorldName = worldName;
            updateCamera();
            state.gameState = "playing";
            console.log("Loaded world:", worldName);
        } catch (e) {
            console.error("Load failed:", e);
            state.gameState = "menu";
        }
    }, 50);
}

export function startNewWorld(worldName) {
    state.gameState = "generating";
    console.log("startNewWorld called, state set to generating");
    setTimeout(function() {
        try {
            console.log("setTimeout fired, resetting state...");
            resetAllGameState();
            console.log("State reset, generating world...");
            generateWorld();
            console.log("World generated, world[0] length:", state.world[0] ? state.world[0].length : "EMPTY");
            state.activeWorld = state.world;
            console.log("Spawning villagers...");
            spawnVillagers();

            const startX = Math.floor(WORLD_WIDTH / 2);
            state.player.x = startX * BLOCK_SIZE;
            state.player.y = (findSurfaceY(startX) - 2) * BLOCK_SIZE;
            console.log("Player placed at x:", startX, "y:", state.player.y / BLOCK_SIZE);

            state.currentWorldName = worldName || ("World " + Date.now());
            state.gameState = "playing";
            console.log("New world created:", state.currentWorldName, "gameState:", state.gameState);
        } catch (e) {
            console.error("World generation error:", e);
            console.error("Stack:", e.stack);
            state.gameState = "menu";
        }
    }, 50);
}

export function saveAndQuit() {
    state.gameState = "saving";
    setTimeout(function() {
        saveWorld();
        refreshSaveList();
        state.menuHover = null;
        state.menuScrollOffset = 0;
        state.gameState = "menu";
    }, 50);
}

// ============================================================
// START - called from main.js
// ============================================================

export function startGame() {
    refreshSaveList();
    requestAnimationFrame(gameLoop);
}
