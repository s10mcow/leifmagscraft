// ============================================================
// INPUT.JS - Keyboard and mouse handling
// ============================================================
// Listens for key presses and mouse clicks.
// Also handles inventory slot clicking when crafting is open.
// Uses UI constants from constants.js for layout values.
// ============================================================

const keys = {};
const mouse = { x: 0, y: 0, leftDown: false, rightDown: false };

document.addEventListener("keydown", (e) => {
    keys[e.key] = true;

    // Escape: pause/unpause or close menus
    if (e.key === "Escape") {
        if (gameState === "playing") {
            if (chestOpen) {
                chestOpen = false;
                chestPos = null;
                returnCursorItem();
            } else if (tradingOpen) {
                tradingOpen = false;
                tradingVillager = null;
            } else if (craftingOpen) {
                craftingOpen = false;
                returnCursorItem();
            } else {
                // Nothing open — pause
                gameState = "paused";
                menuHover = null;
            }
        } else if (gameState === "paused") {
            gameState = "playing";
            menuHover = null;
        }
        return;
    }

    // All other keys only work when playing
    if (gameState !== "playing") return;

    // E = toggle crafting/inventory
    if ((e.key === "e" || e.key === "E") && !gameOver && !sleeping) {
        if (chestOpen) {
            chestOpen = false;
            chestPos = null;
            returnCursorItem();
        } else if (tradingOpen) {
            tradingOpen = false;
            tradingVillager = null;
        } else {
            craftingOpen = !craftingOpen;
            craftingHover = -1;
            craftingScroll = 0;
            if (!craftingOpen) returnCursorItem();
        }
    }

    // F = interact (eat food, sleep in bed)
    if ((e.key === "f" || e.key === "F") && !craftingOpen) {
        if (chestOpen) {
            chestOpen = false;
            chestPos = null;
            returnCursorItem();
        } else if (tradingOpen) {
            tradingOpen = false;
            tradingVillager = null;
        } else {
            interact();
        }
    }

    // M = toggle music
    if (e.key === "m" || e.key === "M") {
        musicEnabled = !musicEnabled;
        addFloatingText(player.x, player.y - 30, musicEnabled ? "Music ON" : "Music OFF", "#ffd700");
    }

    // R = respawn when dead
    if ((e.key === "r" || e.key === "R") && gameOver) respawnPlayer();

    // 1-9 = select hotbar slot
    const num = parseInt(e.key);
    if (num >= 1 && num <= 9) { inventory.selectedSlot = num - 1; playSelect(); }
});

document.addEventListener("keyup", (e) => {
    keys[e.key] = false;
});

canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - rect.left) * (canvas.width / rect.width);
    mouse.y = (e.clientY - rect.top) * (canvas.height / rect.height);

    // Menu hover detection
    if (gameState === "menu") {
        menuHover = null;
        const nb = MENU_BUTTONS.newWorld;
        if (nb && mouse.x >= nb.x && mouse.x <= nb.x + nb.w && mouse.y >= nb.y && mouse.y <= nb.y + nb.h) {
            menuHover = "newWorld";
        }
        if (MENU_BUTTONS.savedWorlds) {
            for (let i = 0; i < MENU_BUTTONS.savedWorlds.length; i++) {
                const entry = MENU_BUTTONS.savedWorlds[i];
                const lb = entry.load;
                if (mouse.x >= lb.x && mouse.x <= lb.x + lb.w && mouse.y >= lb.y && mouse.y <= lb.y + lb.h) {
                    menuHover = "load_" + i;
                }
                const db = entry.delete;
                if (mouse.x >= db.x && mouse.x <= db.x + db.w && mouse.y >= db.y && mouse.y <= db.y + db.h) {
                    menuHover = "delete_" + i;
                }
            }
        }
        return;
    }
    if (gameState === "paused") {
        menuHover = null;
        const rb = PAUSE_BUTTONS.resume;
        if (rb && mouse.x >= rb.x && mouse.x <= rb.x + rb.w && mouse.y >= rb.y && mouse.y <= rb.y + rb.h) {
            menuHover = "resume";
        }
        const sb = PAUSE_BUTTONS.saveQuit;
        if (sb && mouse.x >= sb.x && mouse.x <= sb.x + sb.w && mouse.y >= sb.y && mouse.y <= sb.y + sb.h) {
            menuHover = "saveQuit";
        }
        return;
    }

    // Update trading hover
    if (tradingOpen) {
        const pw = UI.TRADING_PANEL_W, ph = UI.TRADING_PANEL_H;
        const px = (canvas.width - pw) / 2, py = (canvas.height - ph) / 2;
        const startY = py + UI.TRADE_START_Y;
        const rowH = UI.TRADE_ROW_H;
        const margin = UI.TRADE_MARGIN;

        tradingHover = -1;
        for (let i = 0; i < TRADES.length; i++) {
            const ry = startY + i * rowH;
            if (mouse.x >= px + margin && mouse.x <= px + pw - margin &&
                mouse.y >= ry && mouse.y <= ry + rowH - 4) {
                tradingHover = i;
                break;
            }
        }
    }

    // Update crafting recipe hover
    if (craftingOpen) {
        const pw = UI.CRAFTING_PANEL_W, ph = UI.CRAFTING_PANEL_H;
        const px = (canvas.width - pw) / 2, py = (canvas.height - ph) / 2;
        const rw = UI.RECIPE_W, rh = UI.RECIPE_H, cols = UI.RECIPE_COLS, gap = UI.RECIPE_GAP;
        const srx = px + UI.RECIPE_START_X, sry = py + UI.RECIPE_START_Y;
        const recipeAreaBottom = py + ph - UI.INV_BOTTOM_MARGIN;

        craftingHover = -1;
        for (let i = 0; i < RECIPES.length; i++) {
            const col = i % cols, row = Math.floor(i / cols);
            const rx = srx + col * (rw + gap), ry = sry + row * (rh + 6) - craftingScroll;
            if (ry < sry - 5 || ry + rh > recipeAreaBottom) continue;
            if (mouse.x >= rx && mouse.x <= rx + rw && mouse.y >= ry && mouse.y <= ry + rh) {
                craftingHover = i;
                break;
            }
        }
    }
});

// Figure out which inventory slot the mouse is over (in crafting menu)
function getInventorySlotAtMouse() {
    if (!craftingOpen) return -1;
    const pw = UI.CRAFTING_PANEL_W, ph = UI.CRAFTING_PANEL_H;
    const px = (canvas.width - pw) / 2, py = (canvas.height - ph) / 2;
    const is = UI.SLOT_SIZE, ip = UI.SLOT_PAD;
    const itw = UI.INV_TOTAL_W;
    const isx = (canvas.width - itw) / 2 + UI.INV_OFFSET_X;

    // Check hotbar row
    const hotbarY = py + ph + UI.HOTBAR_ROW_Y;
    for (let i = 0; i < HOTBAR_SIZE; i++) {
        const sx = isx + i * (is + ip);
        if (mouse.x >= sx && mouse.x <= sx + is && mouse.y >= hotbarY && mouse.y <= hotbarY + is) {
            return i;
        }
    }

    // Check backpack rows
    const bpY = py + ph + UI.BACKPACK_ROW_Y;
    for (let i = 0; i < BACKPACK_SIZE; i++) {
        const col = i % UI.INV_COLS, row = Math.floor(i / UI.INV_COLS);
        const sx = isx + col * (is + ip);
        const sy = bpY + row * (is + ip);
        if (mouse.x >= sx && mouse.x <= sx + is && mouse.y >= sy && mouse.y <= sy + is) {
            return HOTBAR_SIZE + i;
        }
    }

    return -1;
}

// Figure out which armor slot the mouse is over
function getArmorSlotAtMouse() {
    if (!craftingOpen) return null;
    const pw = UI.CRAFTING_PANEL_W, ph = UI.CRAFTING_PANEL_H;
    const px = (canvas.width - pw) / 2, py = (canvas.height - ph) / 2;
    const is = UI.SLOT_SIZE, ip = UI.SLOT_PAD;
    const itw = UI.INV_TOTAL_W;
    const isx = (canvas.width - itw) / 2 + UI.INV_OFFSET_X;
    const armorX = isx + itw + UI.ARMOR_GAP;
    const armorY = py + ph + UI.HOTBAR_ROW_Y;

    const armorLabels = ["helmet", "chestplate", "leggings", "boots"];
    for (let i = 0; i < 4; i++) {
        const ay = armorY + i * (is + ip);
        if (mouse.x >= armorX && mouse.x <= armorX + is && mouse.y >= ay && mouse.y <= ay + is) {
            return armorLabels[i];
        }
    }
    return null;
}

// Figure out which chest slot the mouse is over (in chest menu)
function getChestSlotAtMouse() {
    if (!chestOpen || !chestPos) return -1;
    const pw = UI.CHEST_PANEL_W, ph = UI.CHEST_PANEL_H;
    const px = (canvas.width - pw) / 2, py = (canvas.height - ph) / 2;
    const is = UI.SLOT_SIZE, ip = UI.SLOT_PAD;
    const chestCols = UI.CHEST_SLOT_COLS;
    const chestTotalW = chestCols * (is + ip) - ip;
    const csx = (canvas.width - chestTotalW) / 2;
    const csy = py + UI.CHEST_SLOT_START_Y;

    for (let i = 0; i < 9; i++) {
        const sx = csx + i * (is + ip);
        if (mouse.x >= sx && mouse.x <= sx + is && mouse.y >= csy && mouse.y <= csy + is) {
            return i;
        }
    }
    return -1;
}

// Figure out which player inventory slot the mouse is over (in chest menu)
function getChestInventorySlotAtMouse() {
    if (!chestOpen || !chestPos) return -1;
    const pw = UI.CHEST_PANEL_W, ph = UI.CHEST_PANEL_H;
    const px = (canvas.width - pw) / 2, py = (canvas.height - ph) / 2;
    const is = UI.SLOT_SIZE, ip = UI.SLOT_PAD;
    const itw = UI.INV_TOTAL_W;
    const isx = (canvas.width - itw) / 2;

    // Hotbar
    const hotbarY = py + ph - 100;
    for (let i = 0; i < HOTBAR_SIZE; i++) {
        const sx = isx + i * (is + ip);
        if (mouse.x >= sx && mouse.x <= sx + is && mouse.y >= hotbarY && mouse.y <= hotbarY + is) {
            return i;
        }
    }

    // Backpack
    const bpY = hotbarY + is + ip + 4;
    for (let i = 0; i < BACKPACK_SIZE; i++) {
        const col = i % UI.INV_COLS, row = Math.floor(i / UI.INV_COLS);
        const sx = isx + col * (is + ip);
        const sy = bpY + row * (is + ip);
        if (mouse.x >= sx && mouse.x <= sx + is && mouse.y >= sy && mouse.y <= sy + is) {
            return HOTBAR_SIZE + i;
        }
    }
    return -1;
}

// Click a chest slot (pick up / place / swap / stack)
function clickChestSlot(slotIdx) {
    const key = `${chestPos.x},${chestPos.y}`;
    if (!chestData[key]) return;
    const slot = chestData[key][slotIdx];

    if (cursorItem.itemId === 0) {
        // Pick up from chest
        if (slot.itemId !== 0 && slot.count > 0) {
            cursorItem.itemId = slot.itemId;
            cursorItem.count = slot.count;
            cursorItem.durability = slot.durability || 0;
            slot.itemId = 0; slot.count = 0; slot.durability = 0;
            playSelect();
        }
    } else {
        if (slot.itemId === 0) {
            // Place into empty slot
            slot.itemId = cursorItem.itemId;
            slot.count = cursorItem.count;
            slot.durability = cursorItem.durability || 0;
            cursorItem.itemId = 0; cursorItem.count = 0; cursorItem.durability = 0;
            playSelect();
        } else if (slot.itemId === cursorItem.itemId && !ITEM_INFO[slot.itemId]?.durability) {
            // Stack same items
            slot.count += cursorItem.count;
            cursorItem.itemId = 0; cursorItem.count = 0; cursorItem.durability = 0;
            playSelect();
        } else {
            // Swap
            const tmp = { itemId: slot.itemId, count: slot.count, durability: slot.durability };
            slot.itemId = cursorItem.itemId; slot.count = cursorItem.count; slot.durability = cursorItem.durability || 0;
            cursorItem.itemId = tmp.itemId; cursorItem.count = tmp.count; cursorItem.durability = tmp.durability;
            playSelect();
        }
    }
}

// Right-click a chest slot (place 1 item)
function rightClickChestSlot(slotIdx) {
    const key = `${chestPos.x},${chestPos.y}`;
    if (!chestData[key]) return;
    const slot = chestData[key][slotIdx];

    if (cursorItem.itemId === 0) {
        // Pick up half
        if (slot.itemId !== 0 && slot.count > 0) {
            const half = Math.ceil(slot.count / 2);
            cursorItem.itemId = slot.itemId;
            cursorItem.count = half;
            cursorItem.durability = slot.durability || 0;
            slot.count -= half;
            if (slot.count <= 0) { slot.itemId = 0; slot.count = 0; slot.durability = 0; }
            playSelect();
        }
    } else {
        if (slot.itemId === 0 || (slot.itemId === cursorItem.itemId && !ITEM_INFO[slot.itemId]?.durability)) {
            // Place 1
            if (slot.itemId === 0) {
                slot.itemId = cursorItem.itemId;
                slot.count = 1;
                slot.durability = cursorItem.durability || 0;
            } else {
                slot.count += 1;
            }
            cursorItem.count -= 1;
            if (cursorItem.count <= 0) { cursorItem.itemId = 0; cursorItem.count = 0; cursorItem.durability = 0; }
            playSelect();
        }
    }
}

canvas.addEventListener("mousedown", (e) => {
    e.preventDefault();

    // Update mouse position from this event too (in case mousemove hasn't fired)
    const rect = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - rect.left) * (canvas.width / rect.width);
    mouse.y = (e.clientY - rect.top) * (canvas.height / rect.height);

    // Title screen clicks
    if (gameState === "menu" && e.button === 0) {
        // Direct hit-test (don't rely solely on mousemove hover)
        const nb = MENU_BUTTONS.newWorld;
        if (nb && mouse.x >= nb.x && mouse.x <= nb.x + nb.w && mouse.y >= nb.y && mouse.y <= nb.y + nb.h) {
            const name = "World " + (menuSaveList.length + 1);
            startNewWorld(name);
            return;
        }
        if (MENU_BUTTONS.savedWorlds) {
            for (let i = 0; i < MENU_BUTTONS.savedWorlds.length; i++) {
                const entry = MENU_BUTTONS.savedWorlds[i];
                const lb = entry.load;
                if (mouse.x >= lb.x && mouse.x <= lb.x + lb.w && mouse.y >= lb.y && mouse.y <= lb.y + lb.h) {
                    if (i < menuSaveList.length) loadWorld(menuSaveList[i].name);
                    return;
                }
                const db = entry.delete;
                if (mouse.x >= db.x && mouse.x <= db.x + db.w && mouse.y >= db.y && mouse.y <= db.y + db.h) {
                    if (i < menuSaveList.length) deleteSave(menuSaveList[i].name);
                    return;
                }
            }
        }
        return;
    }

    // Pause menu clicks
    if (gameState === "paused" && e.button === 0) {
        const rb = PAUSE_BUTTONS.resume;
        if (rb && mouse.x >= rb.x && mouse.x <= rb.x + rb.w && mouse.y >= rb.y && mouse.y <= rb.y + rb.h) {
            gameState = "playing";
            menuHover = null;
            return;
        }
        const sb = PAUSE_BUTTONS.saveQuit;
        if (sb && mouse.x >= sb.x && mouse.x <= sb.x + sb.w && mouse.y >= sb.y && mouse.y <= sb.y + sb.h) {
            saveAndQuit();
            return;
        }
        return;
    }

    // Only process game clicks when playing
    if (gameState !== "playing") return;

    if (e.button === 0) { // Left click
        if (gameOver || sleeping) return;
        if (tradingOpen) {
            if (tradingHover >= 0 && tradingHover < TRADES.length) {
                executeTrade(TRADES[tradingHover]);
            }
            return;
        }
        if (chestOpen) {
            const cs = getChestSlotAtMouse();
            if (cs >= 0) {
                clickChestSlot(cs);
            } else {
                const invSlot = getChestInventorySlotAtMouse();
                if (invSlot >= 0) clickInventorySlot(invSlot);
            }
            return;
        }
        if (craftingOpen) {
            const armorSlot = getArmorSlotAtMouse();
            if (armorSlot) {
                clickArmorSlot(armorSlot);
            } else {
                const slotIdx = getInventorySlotAtMouse();
                if (slotIdx >= 0) {
                    clickInventorySlot(slotIdx);
                } else if (craftingHover >= 0 && craftingHover < RECIPES.length) {
                    craft(RECIPES[craftingHover]);
                }
            }
        } else {
            const mob = getMobAtCursor();
            if (mob && player.attackCooldown <= 0) {
                attackMob(mob);
            } else {
                // Check if holding a gun — gun firing is handled in handleGunFire()
                const heldSlot = inventory.slots[inventory.selectedSlot];
                const heldInfo = heldSlot.count > 0 ? ITEM_INFO[heldSlot.itemId] : null;
                if (heldInfo && heldInfo.toolType === "gun") {
                    mouse.leftDown = true; // handleGunFire reads this
                } else {
                    mouse.leftDown = true;
                }
            }
        }
    }
    if (e.button === 2) { // Right click
        if (gameOver || sleeping || tradingOpen) return;
        if (chestOpen) {
            const cs = getChestSlotAtMouse();
            if (cs >= 0) {
                rightClickChestSlot(cs);
            } else {
                const invSlot = getChestInventorySlotAtMouse();
                if (invSlot >= 0) rightClickInventorySlot(invSlot);
            }
            return;
        }
        if (craftingOpen) {
            const slotIdx = getInventorySlotAtMouse();
            if (slotIdx >= 0) rightClickInventorySlot(slotIdx);
        } else {
            mouse.rightDown = true;
            handleRightClick();
        }
    }
});

canvas.addEventListener("mouseup", (e) => {
    if (e.button === 0) mouse.leftDown = false;
    if (e.button === 2) mouse.rightDown = false;
});

canvas.addEventListener("contextmenu", (e) => e.preventDefault());

// Scroll wheel for crafting menu recipe list
canvas.addEventListener("wheel", (e) => {
    if (craftingOpen) {
        e.preventDefault();
        craftingScroll += e.deltaY > 0 ? 58 : -58;
        const recipeAreaH = UI.CRAFTING_PANEL_H - UI.RECIPE_START_Y - UI.INV_BOTTOM_MARGIN;
        const maxScroll = Math.max(0, Math.ceil(RECIPES.length / UI.RECIPE_COLS) * 58 - recipeAreaH);
        craftingScroll = Math.max(0, Math.min(craftingScroll, maxScroll));
    }
}, { passive: false });

// Right click in game: place block or use item
function handleRightClick() {
    const slot = inventory.slots[inventory.selectedSlot];
    if (slot.count === 0 || slot.itemId === 0) return;

    if (slot.itemId === ITEMS.FLINT_AND_STEEL) {
        useFlintAndSteel();
    } else if (isBlockId(slot.itemId)) {
        placeBlock();
    }
}
