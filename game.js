// ============================================================
// GAME.JS - Main game loop and initialization
// ============================================================
// This is the HEART of the game. It runs 60 times per second,
// updating everything and drawing everything on screen.
// All the other files provide the pieces - this file
// puts them all together!
// ============================================================

// --- GAME STATE ---
let timeOfDay = 0;
const DAY_CYCLE_SPEED = 0.00004; // Slower = longer days and nights
let gameOver = false;
let craftingOpen = false;
let craftingHover = -1;
let craftingScroll = 0; // Scroll offset for recipe list
let sleeping = false;
let sleepTimer = 0;
const SLEEP_DURATION = 2000; // 2 second animation

let tradingOpen = false;
let tradingVillager = null;
let tradingHover = -1;

let chestOpen = false;
let chestPos = null; // {x, y} block coordinates of the open chest
let chestHover = -1;

let mining = {
    active: false,
    blockX: -1, blockY: -1,
    progress: 0, targetTime: 0,
    canMine: true
};

let gunCooldown = 0;
let currentWorldName = "";
let cachedDayBrightness = 1;

// ============================================================
// MINING LOGIC
// ============================================================

function updateMining(dt) {
    if (craftingOpen || tradingOpen || chestOpen || gameOver) return;
    // Don't mine when holding a gun
    const gunSlot = inventory.slots[inventory.selectedSlot];
    const gunInfo = gunSlot.count > 0 ? ITEM_INFO[gunSlot.itemId] : null;
    if (gunInfo && gunInfo.toolType === "gun") { mining.active = false; mining.progress = 0; return; }
    if (!mouse.leftDown) {
        mining.active = false;
        mining.progress = 0;
        return;
    }

    const wmx = Math.floor((mouse.x + camera.x) / BLOCK_SIZE);
    const wmy = Math.floor((mouse.y + camera.y) / BLOCK_SIZE);
    if (wmx < 0 || wmx >= WORLD_WIDTH || wmy < 0 || wmy >= WORLD_HEIGHT) return;

    const blockType = activeWorld[wmx][wmy];
    if (blockType === BLOCKS.AIR || !BLOCK_INFO[blockType].breakable) return;

    // Distance check
    const pcx = player.x + player.width / 2, pcy = player.y + player.height / 2;
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
    if (wmx !== mining.blockX || wmy !== mining.blockY) {
        mining.blockX = wmx;
        mining.blockY = wmy;
        mining.progress = 0;
        mining.targetTime = mineTime;
        mining.canMine = canMineBlock;
    }

    mining.active = true;
    mining.progress += dt;
    playMineHit(); // Tink tink sound while mining

    if (mining.progress >= mining.targetTime) {
        if (mining.canMine) {
            // If breaking a chest, dump its contents to player
            if (blockType === BLOCKS.CHEST) {
                const chestKey = `${wmx},${wmy}`;
                if (chestData[chestKey]) {
                    for (const slot of chestData[chestKey]) {
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
            if (wmy > 0 && (activeWorld[wmx][wmy-1] === BLOCKS.DOOR_CLOSED || activeWorld[wmx][wmy-1] === BLOCKS.DOOR_OPEN)) {
                activeWorld[wmx][wmy-1] = BLOCKS.AIR;
            }
            if (wmy < WORLD_HEIGHT - 1 && (activeWorld[wmx][wmy+1] === BLOCKS.DOOR_CLOSED || activeWorld[wmx][wmy+1] === BLOCKS.DOOR_OPEN)) {
                activeWorld[wmx][wmy+1] = BLOCKS.AIR;
            }
        }
        if (tool) damageEquippedTool();
        activeWorld[wmx][wmy] = BLOCKS.AIR;
        playBlockBreak(); // Crunch!
        mining.active = false;
        mining.progress = 0;
    }
}

// ============================================================
// BLOCK PLACING
// ============================================================

function placeBlock() {
    const slot = inventory.slots[inventory.selectedSlot];
    if (slot.count === 0 || !isBlockId(slot.itemId)) return;

    const wmx = Math.floor((mouse.x + camera.x) / BLOCK_SIZE);
    const wmy = Math.floor((mouse.y + camera.y) / BLOCK_SIZE);
    if (wmx < 0 || wmx >= WORLD_WIDTH || wmy < 0 || wmy >= WORLD_HEIGHT) return;
    if (activeWorld[wmx][wmy] !== BLOCKS.AIR) return;

    const pcx = player.x + player.width / 2, pcy = player.y + player.height / 2;
    const bcx = wmx * BLOCK_SIZE + BLOCK_SIZE / 2, bcy = wmy * BLOCK_SIZE + BLOCK_SIZE / 2;
    if (Math.sqrt((pcx - bcx) ** 2 + (pcy - bcy) ** 2) > BLOCK_SIZE * 5.5) return;

    if (!isBlockSolid(wmx - 1, wmy) && !isBlockSolid(wmx + 1, wmy) &&
        !isBlockSolid(wmx, wmy - 1) && !isBlockSolid(wmx, wmy + 1)) return;

    // Don't place on player
    const pl = Math.floor(player.x / BLOCK_SIZE), pr = Math.floor((player.x + player.width - 1) / BLOCK_SIZE);
    const pt = Math.floor(player.y / BLOCK_SIZE), pb = Math.floor((player.y + player.height - 1) / BLOCK_SIZE);
    if (wmx >= pl && wmx <= pr && wmy >= pt && wmy <= pb) return;

    activeWorld[wmx][wmy] = slot.itemId;
    if (slot.itemId === BLOCKS.CHEST) initChestData(wmx, wmy);
    // Door: place 2 blocks tall
    if (slot.itemId === BLOCKS.DOOR_CLOSED) {
        if (wmy > 0 && activeWorld[wmx][wmy - 1] === BLOCKS.AIR) {
            activeWorld[wmx][wmy - 1] = BLOCKS.DOOR_CLOSED;
        } else {
            activeWorld[wmx][wmy] = BLOCKS.AIR;
            return;
        }
    }
    // Lava-water interaction check on neighbors
    for (const [nx, ny] of [[wmx-1,wmy],[wmx+1,wmy],[wmx,wmy-1],[wmx,wmy+1]]) {
        if (nx >= 0 && nx < WORLD_WIDTH && ny >= 0 && ny < WORLD_HEIGHT) {
            if (activeWorld[nx][ny] === BLOCKS.LAVA) checkLavaWaterInteraction(nx, ny);
        }
    }
    if (activeWorld[wmx][wmy] === BLOCKS.LAVA) checkLavaWaterInteraction(wmx, wmy);
    playBlockPlace();
    slot.count--;
    if (slot.count === 0) { slot.itemId = 0; slot.durability = 0; }
}

// ============================================================
// F KEY - INTERACT (eat food or sleep in bed)
// ============================================================

function interact() {
    if (gameOver || craftingOpen || sleeping || tradingOpen || chestOpen) return;

    // Check if pointing at a door within reach
    const wmx_d = Math.floor((mouse.x + camera.x) / BLOCK_SIZE);
    const wmy_d = Math.floor((mouse.y + camera.y) / BLOCK_SIZE);
    if (wmx_d >= 0 && wmx_d < WORLD_WIDTH && wmy_d >= 0 && wmy_d < WORLD_HEIGHT) {
        const doorBlock = activeWorld[wmx_d][wmy_d];
        if (doorBlock === BLOCKS.DOOR_CLOSED || doorBlock === BLOCKS.DOOR_OPEN) {
            const pcx = player.x + player.width / 2, pcy = player.y + player.height / 2;
            const bcx = wmx_d * BLOCK_SIZE + BLOCK_SIZE / 2, bcy = wmy_d * BLOCK_SIZE + BLOCK_SIZE / 2;
            if (Math.sqrt((pcx - bcx) ** 2 + (pcy - bcy) ** 2) < BLOCK_SIZE * 5) {
                toggleDoor(wmx_d, wmy_d);
                return;
            }
        }
    }

    // Check if pointing at a chest within reach
    const wmx_c = Math.floor((mouse.x + camera.x) / BLOCK_SIZE);
    const wmy_c = Math.floor((mouse.y + camera.y) / BLOCK_SIZE);
    if (wmx_c >= 0 && wmx_c < WORLD_WIDTH && wmy_c >= 0 && wmy_c < WORLD_HEIGHT) {
        if (activeWorld[wmx_c][wmy_c] === BLOCKS.CHEST) {
            const pcx = player.x + player.width / 2, pcy = player.y + player.height / 2;
            const bcx = wmx_c * BLOCK_SIZE + BLOCK_SIZE / 2, bcy = wmy_c * BLOCK_SIZE + BLOCK_SIZE / 2;
            if (Math.sqrt((pcx - bcx) ** 2 + (pcy - bcy) ** 2) < BLOCK_SIZE * 5) {
                const key = `${wmx_c},${wmy_c}`;
                if (!chestData[key]) initChestData(wmx_c, wmy_c);
                chestOpen = true;
                chestPos = { x: wmx_c, y: wmy_c };
                chestHover = -1;
                return;
            }
        }
    }

    // Check for nearby villager
    for (const mob of mobs) {
        if (mob.type !== "villager") continue;
        const def = MOB_DEFS.villager;
        const pcx = player.x + player.width / 2, pcy = player.y + player.height / 2;
        const mcx = mob.x + def.width / 2, mcy = mob.y + def.height / 2;
        const dist = Math.sqrt((pcx - mcx) ** 2 + (pcy - mcy) ** 2);
        if (dist < BLOCK_SIZE * 4) {
            tradingOpen = true;
            tradingVillager = mob;
            tradingHover = -1;
            return;
        }
    }

    // Check if pointing at a bed within reach
    const wmx = Math.floor((mouse.x + camera.x) / BLOCK_SIZE);
    const wmy = Math.floor((mouse.y + camera.y) / BLOCK_SIZE);
    if (wmx >= 0 && wmx < WORLD_WIDTH && wmy >= 0 && wmy < WORLD_HEIGHT) {
        if (activeWorld[wmx][wmy] === BLOCKS.BED) {
            const pcx = player.x + player.width / 2, pcy = player.y + player.height / 2;
            const bcx = wmx * BLOCK_SIZE + BLOCK_SIZE / 2, bcy = wmy * BLOCK_SIZE + BLOCK_SIZE / 2;
            const dist = Math.sqrt((pcx - bcx) ** 2 + (pcy - bcy) ** 2);
            if (dist < BLOCK_SIZE * 5) {
                const dayBrightness = Math.cos(timeOfDay * Math.PI * 2) * 0.5 + 0.5;
                if (dayBrightness < 0.55) {
                    // It's night - go to sleep!
                    sleeping = true;
                    sleepTimer = 0;
                    return;
                } else {
                    addFloatingText(player.x, player.y - 30, "You can only sleep at night!", "#ffaa00");
                    return;
                }
            }
        }
    }

    // Otherwise, try to eat food
    const slot = inventory.slots[inventory.selectedSlot];
    if (slot.count > 0 && isFood(slot.itemId)) {
        eatFood();
        return;
    }

    addFloatingText(player.x, player.y - 20, "Nothing to interact with", "#999999");
}

function updateSleep(dt) {
    if (!sleeping) return;
    sleepTimer += dt;

    if (sleepTimer >= SLEEP_DURATION) {
        // Wake up! Set time to early morning
        timeOfDay = 0.05;
        sleeping = false;
        sleepTimer = 0;
        // Despawn hostile mobs
        for (let i = mobs.length - 1; i >= 0; i--) {
            if (MOB_DEFS[mobs[i].type].hostile) mobs.splice(i, 1);
        }
        addFloatingText(player.x, player.y - 30, "Good morning!", "#ffd700");
    }
}

// ============================================================
// TRADING
// ============================================================

function executeTrade(trade) {
    const emeraldCount = countItem(BLOCKS.EMERALD);
    if (emeraldCount < trade.cost) {
        addFloatingText(player.x, player.y - 20, "Not enough emeralds!", "#ef4444");
        return;
    }
    let toRemove = trade.cost;
    for (let i = 0; i < inventory.slots.length && toRemove > 0; i++) {
        const slot = inventory.slots[i];
        if (slot.itemId === BLOCKS.EMERALD) {
            const take = Math.min(slot.count, toRemove);
            slot.count -= take;
            toRemove -= take;
            if (slot.count === 0) { slot.itemId = 0; slot.durability = 0; }
        }
    }
    addToInventory(trade.result, trade.resultCount);
    playCraft();
    addFloatingText(player.x, player.y - 30, "Traded for " + getItemName(trade.result) + "!", "#ffd700");
}

// ============================================================
// DOORS
// ============================================================

function toggleDoor(x, y) {
    const current = activeWorld[x][y];
    const newId = (current === BLOCKS.DOOR_CLOSED) ? BLOCKS.DOOR_OPEN : BLOCKS.DOOR_CLOSED;
    activeWorld[x][y] = newId;
    // Toggle paired half (above or below)
    if (y > 0 && (activeWorld[x][y-1] === BLOCKS.DOOR_CLOSED || activeWorld[x][y-1] === BLOCKS.DOOR_OPEN)) {
        activeWorld[x][y-1] = newId;
    }
    if (y < WORLD_HEIGHT - 1 && (activeWorld[x][y+1] === BLOCKS.DOOR_CLOSED || activeWorld[x][y+1] === BLOCKS.DOOR_OPEN)) {
        activeWorld[x][y+1] = newId;
    }
    playBlockPlace();
}

// ============================================================
// NETHER PORTAL
// ============================================================

function useFlintAndSteel() {
    const wmx = Math.floor((mouse.x + camera.x) / BLOCK_SIZE);
    const wmy = Math.floor((mouse.y + camera.y) / BLOCK_SIZE);
    if (wmx < 0 || wmx >= WORLD_WIDTH || wmy < 0 || wmy >= WORLD_HEIGHT) return;

    const pcx = player.x + player.width / 2, pcy = player.y + player.height / 2;
    const bcx = wmx * BLOCK_SIZE + BLOCK_SIZE / 2, bcy = wmy * BLOCK_SIZE + BLOCK_SIZE / 2;
    if (Math.sqrt((pcx - bcx) ** 2 + (pcy - bcy) ** 2) > BLOCK_SIZE * 5.5) return;

    // Try to activate a portal near the clicked block
    if (tryActivatePortal(wmx, wmy)) {
        // Damage the flint and steel
        const slot = inventory.slots[inventory.selectedSlot];
        if (slot.durability !== undefined) {
            slot.durability--;
            if (slot.durability <= 0) {
                slot.itemId = 0; slot.count = 0; slot.durability = 0;
            }
        }
    } else {
        addFloatingText(wmx * BLOCK_SIZE + 16, wmy * BLOCK_SIZE, "Need obsidian frame!", "#ef4444");
    }
}

function tryActivatePortal(clickX, clickY) {
    // Search nearby for a valid portal frame
    for (let dx = -4; dx <= 1; dx++) {
        for (let dy = -5; dy <= 1; dy++) {
            const fx = clickX + dx;
            const fy = clickY + dy;
            if (isValidPortalFrame(fx, fy)) {
                activatePortal(fx, fy);
                return true;
            }
        }
    }
    return false;
}

function isValidPortalFrame(frameLeft, frameTop) {
    // Portal frame: 4 wide x 5 tall obsidian ring
    // Interior is 2x3 (columns 1-2, rows 1-3)
    const w = activeWorld;
    for (let x = frameLeft; x < frameLeft + 4; x++) {
        for (let y = frameTop; y < frameTop + 5; y++) {
            if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT) return false;
            const isEdge = (x === frameLeft || x === frameLeft + 3 || y === frameTop || y === frameTop + 4);
            if (isEdge) {
                if (w[x][y] !== BLOCKS.OBSIDIAN) return false;
            } else {
                // Interior must be air or already portal
                if (w[x][y] !== BLOCKS.AIR && w[x][y] !== BLOCKS.NETHER_PORTAL) return false;
            }
        }
    }
    return true;
}

function activatePortal(frameLeft, frameTop) {
    // Fill interior with portal blocks
    for (let x = frameLeft + 1; x < frameLeft + 3; x++) {
        for (let y = frameTop + 1; y < frameTop + 4; y++) {
            activeWorld[x][y] = BLOCKS.NETHER_PORTAL;
        }
    }
    addFloatingText(frameLeft * BLOCK_SIZE + 64, frameTop * BLOCK_SIZE, "Portal activated!", "#a855f7");
    playBlockPlace();
}

function teleportToOtherDimension() {
    if (inNether) {
        // Return to overworld
        switchDimension(false);
        player.x = overworldPortalX * BLOCK_SIZE;
        player.y = (overworldPortalY - 2) * BLOCK_SIZE;
    } else {
        // Save overworld position
        overworldPortalX = Math.floor(player.x / BLOCK_SIZE);
        overworldPortalY = Math.floor(player.y / BLOCK_SIZE);

        // Generate Nether if first time
        if (netherWorld.length === 0) {
            generateNetherWorld();
        }

        switchDimension(true);

        // Find safe spawn in Nether
        const spawnX = Math.floor(WORLD_WIDTH / 2);
        const surfY = findSurfaceY(spawnX);
        netherPortalX = spawnX;
        netherPortalY = surfY;
        player.x = spawnX * BLOCK_SIZE;
        player.y = (surfY - 2) * BLOCK_SIZE;

        // Create return portal in Nether
        createNetherReturnPortal(spawnX, surfY);
    }

    // Clear mobs on dimension change
    mobs.length = 0;
    portalCooldown = 3000;
    player.velX = 0;
    player.velY = 0;
    addFloatingText(player.x, player.y - 30, inNether ? "Entered the Nether!" : "Returned to Overworld!", inNether ? "#ff4444" : "#4ade80");
}

function createNetherReturnPortal(x, surfaceY) {
    // Build a small obsidian frame + portal at the spawn point
    const fx = x - 1; // frame left
    const fy = surfaceY - 5; // frame top

    for (let bx = fx; bx < fx + 4; bx++) {
        for (let by = fy; by < fy + 5; by++) {
            if (bx < 0 || bx >= WORLD_WIDTH || by < 0 || by >= WORLD_HEIGHT) continue;
            const isEdge = (bx === fx || bx === fx + 3 || by === fy || by === fy + 4);
            if (isEdge) {
                netherWorld[bx][by] = BLOCKS.OBSIDIAN;
            } else {
                netherWorld[bx][by] = BLOCKS.NETHER_PORTAL;
            }
        }
    }
    // Clear space around the portal
    for (let bx = fx - 1; bx < fx + 5; bx++) {
        for (let by = fy - 1; by < fy; by++) {
            if (bx >= 0 && bx < WORLD_WIDTH && by >= 0 && by < WORLD_HEIGHT) {
                if (netherWorld[bx][by] !== BLOCKS.OBSIDIAN && netherWorld[bx][by] !== BLOCKS.NETHER_PORTAL) {
                    netherWorld[bx][by] = BLOCKS.AIR;
                }
            }
        }
    }
}

// ============================================================
// GUN FIRING
// ============================================================

function handleGunFire(dt) {
    if (gunCooldown > 0) gunCooldown -= dt;
    if (craftingOpen || tradingOpen || chestOpen || gameOver || sleeping) return;
    if (!mouse.leftDown) return;

    const slot = inventory.slots[inventory.selectedSlot];
    if (slot.count === 0 || slot.itemId === 0) return;
    const itemInfo = ITEM_INFO[slot.itemId];
    if (!itemInfo || itemInfo.toolType !== "gun") return;
    if (gunCooldown > 0) return;

    // Determine ammo type
    const isRocket = itemInfo.ammoType === "rocket";
    const ammoItemId = isRocket ? ITEMS.ROCKET : ITEMS.BULLETS;
    const ammoName = isRocket ? "No rockets!" : "No ammo!";

    // Check for ammo in inventory
    const ammoSlot = inventory.slots.findIndex(s => s.itemId === ammoItemId && s.count > 0);
    if (ammoSlot === -1) {
        addFloatingText(player.x, player.y - 20, ammoName, "#ef4444");
        gunCooldown = 500;
        return;
    }

    // Fire!
    const px = player.x + player.width / 2;
    const py = player.y + player.height / 3;
    const targetX = mouse.x + camera.x;
    const targetY = mouse.y + camera.y;

    if (isRocket) {
        createRocket(px, py, targetX, targetY, itemInfo.damage);
    } else {
        createBullet(px, py, targetX, targetY, itemInfo.damage);
    }
    gunCooldown = itemInfo.fireRate;

    // Consume 1 ammo
    inventory.slots[ammoSlot].count--;
    if (inventory.slots[ammoSlot].count <= 0) {
        inventory.slots[ammoSlot].itemId = 0;
        inventory.slots[ammoSlot].count = 0;
    }

    // Damage gun durability
    if (slot.durability !== undefined) {
        slot.durability--;
        if (slot.durability <= 0) {
            slot.itemId = 0; slot.count = 0; slot.durability = 0;
            addFloatingText(player.x, player.y - 30, "Gun broke!", "#ef4444");
        }
    }
}

// ============================================================
// DRAW THE GAME WORLD (reused by playing and paused states)
// ============================================================

function drawGameFrame(timestamp) {
    const camX = camera.x - screenShake.x;
    const camY = camera.y - screenShake.y;

    // 1. Sky
    drawSky(cachedDayBrightness);

    // 2. Blocks (only visible ones)
    const sc = Math.max(0, Math.floor(camX / BLOCK_SIZE));
    const ec = Math.min(WORLD_WIDTH, Math.ceil((camX + canvas.width) / BLOCK_SIZE) + 1);
    const sr = Math.max(0, Math.floor(camY / BLOCK_SIZE));
    const er = Math.min(WORLD_HEIGHT, Math.ceil((camY + canvas.height) / BLOCK_SIZE) + 1);

    for (let x = sc; x < ec; x++) {
        for (let y = sr; y < er; y++) {
            if (activeWorld[x][y] !== BLOCKS.AIR) {
                drawBlock(activeWorld[x][y], x * BLOCK_SIZE - camera.x + screenShake.x, y * BLOCK_SIZE - camera.y + screenShake.y);
            }
        }
    }

    // 3. Night overlay with torch lighting
    if (cachedDayBrightness < 0.7) {
        const nightAlpha = (0.7 - cachedDayBrightness) * 0.7;
        ctx.fillStyle = inNether ? `rgba(10,0,0,${nightAlpha})` : `rgba(0,0,20,${nightAlpha})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (nightAlpha > 0.05) {
            ctx.save();
            ctx.globalCompositeOperation = "lighter";
            const lightPx = TORCH_LIGHT_RADIUS * BLOCK_SIZE;
            for (let x = sc; x < ec; x++) {
                for (let y = sr; y < er; y++) {
                    const block = activeWorld[x][y];
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
                        const tx = x * BLOCK_SIZE - camera.x + screenShake.x + BLOCK_SIZE / 2;
                        const ty = y * BLOCK_SIZE - camera.y + screenShake.y + BLOCK_SIZE / 2;
                        const flicker = 1.0 + Math.sin(timestamp * 0.008 + x * 7 + y * 13) * 0.06;
                        const radius = glowRadius * flicker;
                        const glow = ctx.createRadialGradient(tx, ty, 0, tx, ty, radius);
                        const strength = Math.min(nightAlpha * 0.45 * glowStrength, 0.22);
                        glow.addColorStop(0, `rgba(${glowColor[0]},${glowColor[1]},${glowColor[2]},${strength})`);
                        glow.addColorStop(0.5, `rgba(${glowColor[0]},${glowColor[1]},${glowColor[2]},${strength * 0.4})`);
                        glow.addColorStop(1, `rgba(${glowColor[0]},${glowColor[1]},${glowColor[2]},0)`);
                        ctx.fillStyle = glow;
                        ctx.beginPath();
                        ctx.arc(tx, ty, radius, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            }
            ctx.globalCompositeOperation = "source-over";
            ctx.restore();
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
    if (sleeping) {
        const progress = sleepTimer / SLEEP_DURATION;
        const alpha = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
        ctx.fillStyle = `rgba(0, 0, 20, ${Math.min(alpha, 0.95)})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#ffffff"; ctx.font = "bold 28px 'Courier New', monospace"; ctx.textAlign = "center";
        ctx.fillText("Sleeping...", canvas.width / 2, canvas.height / 2);
        const dots = ".".repeat(Math.floor((sleepTimer / 400) % 4));
        ctx.fillStyle = "#9ca3af"; ctx.font = "16px 'Courier New', monospace";
        ctx.fillText(`Zzz${dots}`, canvas.width / 2, canvas.height / 2 + 35);
    }
}

// ============================================================
// MAIN GAME LOOP - runs ~60 times per second!
// ============================================================

let lastTime = 0;

function gameLoop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;

    try {
        switch (gameState) {
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
                cachedDayBrightness = Math.cos(timeOfDay * Math.PI * 2) * 0.5 + 0.5;
                if (inNether) cachedDayBrightness = 0.3;

                if (portalCooldown > 0) portalCooldown -= dt;

                updateSleep(dt);
                if (!sleeping) {
                    updatePlayer(dt);
                    updatePlateTimers(dt);
                    updateCamera();
                    handleGunFire(dt);
                    updateMining(dt);
                    updateMobs(dt, cachedDayBrightness);
                    updateProjectiles(dt);
                    updateParticles(dt);
                    spawnMobs(dt, cachedDayBrightness);
                }
                updateMusic(dt, cachedDayBrightness);
                if (!inNether) timeOfDay = (timeOfDay + DAY_CYCLE_SPEED) % 1;

                drawGameFrame(timestamp);
                break;
        }
    } catch (e) {
        // Show error on screen so we can debug
        ctx.fillStyle = "#1a1a2e";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#ef4444";
        ctx.font = "bold 20px 'Courier New', monospace";
        ctx.textAlign = "center";
        ctx.fillText("Runtime Error: " + e.message, canvas.width / 2, canvas.height / 2 - 20);
        ctx.fillStyle = "#9ca3af";
        ctx.font = "14px 'Courier New', monospace";
        ctx.fillText("State: " + gameState + " | Check console (F12)", canvas.width / 2, canvas.height / 2 + 15);
        console.error("Game loop error in state '" + gameState + "':", e);
        console.error("Stack:", e.stack);
    }

    requestAnimationFrame(gameLoop);
}

// ============================================================
// RESET ALL GAME STATE
// ============================================================

function resetAllGameState() {
    // World data
    world.length = 0;
    netherWorld.length = 0;
    biomeMap.length = 0;
    for (const key in chestData) delete chestData[key];

    // Player
    player.x = 0; player.y = 0;
    player.velX = 0; player.velY = 0;
    player.health = 20; player.facing = 1;
    player.invincibleTimer = 0; player.attackCooldown = 0;
    player.onGround = false; player.isFalling = false;
    player.fallStartY = 0;

    // Inventory
    for (let i = 0; i < inventory.slots.length; i++) {
        inventory.slots[i] = { itemId: 0, count: 0, durability: 0 };
    }
    inventory.selectedSlot = 0;
    for (const type of ARMOR_SLOT_TYPES) {
        inventory.armor[type] = { itemId: 0, count: 0, durability: 0 };
    }
    cursorItem.itemId = 0; cursorItem.count = 0; cursorItem.durability = 0;

    // Mobs & entities
    mobs.length = 0;
    projectiles.length = 0;
    particles.length = 0;
    floatingTexts.length = 0;
    mobSpawnTimer = 0;

    // Game flags
    gameOver = false;
    craftingOpen = false; craftingHover = -1; craftingScroll = 0;
    tradingOpen = false; tradingVillager = null; tradingHover = -1;
    chestOpen = false; chestPos = null; chestHover = -1;
    sleeping = false; sleepTimer = 0;
    mining.active = false; mining.progress = 0;
    mining.blockX = -1; mining.blockY = -1;
    gunCooldown = 0;

    // Dimension
    inNether = false;
    activeWorld = world;
    overworldPortalX = 0; overworldPortalY = 0;
    netherPortalX = 0; netherPortalY = 0;
    portalCooldown = 0;

    // Time
    timeOfDay = 0;
    cachedDayBrightness = 1;

    // Village/structure tracking
    villageLocations.length = 0;
    structureLocations.length = 0;

    // Plate timers
    plateTimers.length = 0;

    // Music
    musicTimer = 0;
    musicNoteIndex = 0;

    // Camera
    camera.x = 0; camera.y = 0;
    screenShake.x = 0; screenShake.y = 0; screenShake.intensity = 0;
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

function refreshSaveList() {
    try {
        const raw = localStorage.getItem(SAVE_INDEX_KEY);
        menuSaveList = raw ? JSON.parse(raw) : [];
        menuSaveList = menuSaveList.filter(function(s) {
            return localStorage.getItem(SAVE_KEY_PREFIX + s.name) !== null;
        });
        localStorage.setItem(SAVE_INDEX_KEY, JSON.stringify(menuSaveList));
    } catch (e) {
        menuSaveList = [];
    }
}

function updateSaveIndex(name, timestamp) {
    refreshSaveList();
    const existing = menuSaveList.findIndex(function(s) { return s.name === name; });
    if (existing >= 0) {
        menuSaveList[existing].timestamp = timestamp;
    } else {
        menuSaveList.push({ name: name, timestamp: timestamp });
    }
    localStorage.setItem(SAVE_INDEX_KEY, JSON.stringify(menuSaveList));
}

function deleteSave(name) {
    localStorage.removeItem(SAVE_KEY_PREFIX + name);
    refreshSaveList();
}

function saveWorld() {
    const saveData = {
        version: 1,
        name: currentWorldName,
        timestamp: Date.now(),
        world: rleEncode(world),
        netherWorld: netherWorld.length > 0 ? rleEncode(netherWorld) : null,
        biomeMap: biomeMap.slice(),
        chestData: JSON.parse(JSON.stringify(chestData)),
        inventory: {
            slots: inventory.slots.map(function(s) { return { itemId: s.itemId, count: s.count, durability: s.durability }; }),
            armor: {
                helmet: Object.assign({}, inventory.armor.helmet),
                chestplate: Object.assign({}, inventory.armor.chestplate),
                leggings: Object.assign({}, inventory.armor.leggings),
                boots: Object.assign({}, inventory.armor.boots)
            },
            selectedSlot: inventory.selectedSlot
        },
        cursorItem: { itemId: cursorItem.itemId, count: cursorItem.count, durability: cursorItem.durability },
        player: {
            x: player.x, y: player.y,
            health: player.health, facing: player.facing
        },
        timeOfDay: timeOfDay,
        inNether: inNether,
        overworldPortalX: overworldPortalX,
        overworldPortalY: overworldPortalY,
        netherPortalX: netherPortalX,
        netherPortalY: netherPortalY,
        mobs: mobs.filter(function(m) { return !MOB_DEFS[m.type].hostile; }).map(function(m) {
            return { type: m.type, x: m.x, y: m.y, health: m.health, facing: m.facing };
        })
    };

    try {
        localStorage.setItem(SAVE_KEY_PREFIX + currentWorldName, JSON.stringify(saveData));
        updateSaveIndex(currentWorldName, Date.now());
        return true;
    } catch (e) {
        console.error("Save failed:", e);
        return false;
    }
}

function loadWorld(worldName) {
    gameState = "loading";
    setTimeout(function() {
        try {
            const raw = localStorage.getItem(SAVE_KEY_PREFIX + worldName);
            if (!raw) { gameState = "menu"; return; }

            const data = JSON.parse(raw);
            resetAllGameState();

            // World
            const decoded = rleDecode(data.world, WORLD_WIDTH, WORLD_HEIGHT);
            for (let x = 0; x < WORLD_WIDTH; x++) world[x] = decoded[x];

            if (data.netherWorld) {
                const nDecoded = rleDecode(data.netherWorld, WORLD_WIDTH, WORLD_HEIGHT);
                for (let x = 0; x < WORLD_WIDTH; x++) netherWorld[x] = nDecoded[x];
            }

            // BiomeMap
            for (let i = 0; i < data.biomeMap.length; i++) biomeMap[i] = data.biomeMap[i];

            // Chests
            for (const key in data.chestData) chestData[key] = data.chestData[key];

            // Inventory
            for (let i = 0; i < data.inventory.slots.length; i++) {
                inventory.slots[i] = data.inventory.slots[i];
            }
            inventory.selectedSlot = data.inventory.selectedSlot;
            for (const type of ARMOR_SLOT_TYPES) {
                inventory.armor[type] = data.inventory.armor[type];
            }
            cursorItem.itemId = data.cursorItem.itemId;
            cursorItem.count = data.cursorItem.count;
            cursorItem.durability = data.cursorItem.durability;

            // Player
            player.x = data.player.x;
            player.y = data.player.y;
            player.health = data.player.health;
            player.facing = data.player.facing;

            // Dimension
            timeOfDay = data.timeOfDay;
            inNether = data.inNether;
            activeWorld = inNether ? netherWorld : world;
            overworldPortalX = data.overworldPortalX;
            overworldPortalY = data.overworldPortalY;
            netherPortalX = data.netherPortalX;
            netherPortalY = data.netherPortalY;

            // Mobs (passive only, hostile will respawn)
            if (data.mobs) {
                for (const mData of data.mobs) {
                    const mob = createMob(mData.type, mData.x, mData.y);
                    mob.health = mData.health;
                    mob.facing = mData.facing;
                    mobs.push(mob);
                }
            }

            currentWorldName = worldName;
            updateCamera();
            gameState = "playing";
            console.log("Loaded world:", worldName);
        } catch (e) {
            console.error("Load failed:", e);
            gameState = "menu";
        }
    }, 50);
}

function startNewWorld(worldName) {
    gameState = "generating";
    console.log("startNewWorld called, state set to generating");
    setTimeout(function() {
        try {
            console.log("setTimeout fired, resetting state...");
            resetAllGameState();
            console.log("State reset, generating world...");
            generateWorld();
            console.log("World generated, world[0] length:", world[0] ? world[0].length : "EMPTY");
            activeWorld = world;
            console.log("Spawning villagers...");
            spawnVillagers();

            const startX = Math.floor(WORLD_WIDTH / 2);
            player.x = startX * BLOCK_SIZE;
            player.y = (findSurfaceY(startX) - 2) * BLOCK_SIZE;
            console.log("Player placed at x:", startX, "y:", player.y / BLOCK_SIZE);

            currentWorldName = worldName || ("World " + Date.now());
            gameState = "playing";
            console.log("New world created:", currentWorldName, "gameState:", gameState);
        } catch (e) {
            console.error("World generation error:", e);
            console.error("Stack:", e.stack);
            gameState = "menu";
        }
    }, 50);
}

function saveAndQuit() {
    gameState = "saving";
    setTimeout(function() {
        saveWorld();
        refreshSaveList();
        menuHover = null;
        menuScrollOffset = 0;
        gameState = "menu";
    }, 50);
}

// ============================================================
// START - show title screen
// ============================================================

refreshSaveList();
requestAnimationFrame(gameLoop);
