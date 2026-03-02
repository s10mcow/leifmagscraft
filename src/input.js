// ============================================================
// INPUT.JS - Keyboard and mouse handling (ES Module)
// ============================================================
// Listens for key presses and mouse clicks.
// Also handles inventory slot clicking when crafting is open.
// Uses UI constants from constants.js for layout values.
// ============================================================

import { state } from './state.js';
import { BLOCKS, ITEMS, UI, RECIPES, TRADES, BLOCK_SIZE, WORLD_WIDTH, WORLD_HEIGHT, ITEM_INFO, isBlockId } from './constants.js';
import { HOTBAR_SIZE, BACKPACK_SIZE, TOTAL_SLOTS, clickInventorySlot, rightClickInventorySlot, returnCursorItem, clickArmorSlot, countItem, addFloatingText, craft } from './inventory.js';
import { playSelect } from './audio.js';

// Late-bound function references (set by main.js to avoid circular imports)
const fn = {};
export function registerFunctions(fns) {
    Object.assign(fn, fns);
}

// Figure out which inventory slot the mouse is over (in crafting menu)
export function getInventorySlotAtMouse() {
    if (!state.craftingOpen) return -1;
    const pw = UI.CRAFTING_PANEL_W, ph = UI.CRAFTING_PANEL_H;
    const px = (state.canvas.width - pw) / 2, py = (state.canvas.height - ph) / 2;
    const is = UI.SLOT_SIZE, ip = UI.SLOT_PAD;
    const itw = UI.INV_TOTAL_W;
    const isx = (state.canvas.width - itw) / 2 + UI.INV_OFFSET_X;

    // Check hotbar row
    const hotbarY = py + ph + UI.HOTBAR_ROW_Y;
    for (let i = 0; i < HOTBAR_SIZE; i++) {
        const sx = isx + i * (is + ip);
        if (state.mouse.x >= sx && state.mouse.x <= sx + is && state.mouse.y >= hotbarY && state.mouse.y <= hotbarY + is) {
            return i;
        }
    }

    // Check backpack rows
    const bpY = py + ph + UI.BACKPACK_ROW_Y;
    for (let i = 0; i < BACKPACK_SIZE; i++) {
        const col = i % UI.INV_COLS, row = Math.floor(i / UI.INV_COLS);
        const sx = isx + col * (is + ip);
        const sy = bpY + row * (is + ip);
        if (state.mouse.x >= sx && state.mouse.x <= sx + is && state.mouse.y >= sy && state.mouse.y <= sy + is) {
            return HOTBAR_SIZE + i;
        }
    }

    return -1;
}

// Figure out which armor slot the mouse is over
export function getArmorSlotAtMouse() {
    if (!state.craftingOpen) return null;
    const pw = UI.CRAFTING_PANEL_W, ph = UI.CRAFTING_PANEL_H;
    const px = (state.canvas.width - pw) / 2, py = (state.canvas.height - ph) / 2;
    const is = UI.SLOT_SIZE, ip = UI.SLOT_PAD;
    const itw = UI.INV_TOTAL_W;
    const isx = (state.canvas.width - itw) / 2 + UI.INV_OFFSET_X;
    const armorX = isx + itw + UI.ARMOR_GAP;
    const armorY = py + ph + UI.HOTBAR_ROW_Y;

    const armorLabels = ["helmet", "chestplate", "leggings", "boots"];
    for (let i = 0; i < 4; i++) {
        const ay = armorY + i * (is + ip);
        if (state.mouse.x >= armorX && state.mouse.x <= armorX + is && state.mouse.y >= ay && state.mouse.y <= ay + is) {
            return armorLabels[i];
        }
    }
    return null;
}

// Figure out which chest slot the mouse is over (in chest menu)
export function getChestSlotAtMouse() {
    if (!state.chestOpen || !state.chestPos) return -1;
    const pw = UI.CHEST_PANEL_W, ph = UI.CHEST_PANEL_H;
    const px = (state.canvas.width - pw) / 2, py = (state.canvas.height - ph) / 2;
    const is = UI.SLOT_SIZE, ip = UI.SLOT_PAD;
    const chestCols = UI.CHEST_SLOT_COLS;
    const chestTotalW = chestCols * (is + ip) - ip;
    const csx = (state.canvas.width - chestTotalW) / 2;
    const csy = py + UI.CHEST_SLOT_START_Y;

    for (let i = 0; i < 9; i++) {
        const sx = csx + i * (is + ip);
        if (state.mouse.x >= sx && state.mouse.x <= sx + is && state.mouse.y >= csy && state.mouse.y <= csy + is) {
            return i;
        }
    }
    return -1;
}

// Figure out which player inventory slot the mouse is over (in chest menu)
export function getChestInventorySlotAtMouse() {
    if (!state.chestOpen || !state.chestPos) return -1;
    const pw = UI.CHEST_PANEL_W, ph = UI.CHEST_PANEL_H;
    const px = (state.canvas.width - pw) / 2, py = (state.canvas.height - ph) / 2;
    const is = UI.SLOT_SIZE, ip = UI.SLOT_PAD;
    const itw = UI.INV_TOTAL_W;
    const isx = (state.canvas.width - itw) / 2;

    // Hotbar
    const hotbarY = py + ph - 100;
    for (let i = 0; i < HOTBAR_SIZE; i++) {
        const sx = isx + i * (is + ip);
        if (state.mouse.x >= sx && state.mouse.x <= sx + is && state.mouse.y >= hotbarY && state.mouse.y <= hotbarY + is) {
            return i;
        }
    }

    // Backpack
    const bpY = hotbarY + is + ip + 4;
    for (let i = 0; i < BACKPACK_SIZE; i++) {
        const col = i % UI.INV_COLS, row = Math.floor(i / UI.INV_COLS);
        const sx = isx + col * (is + ip);
        const sy = bpY + row * (is + ip);
        if (state.mouse.x >= sx && state.mouse.x <= sx + is && state.mouse.y >= sy && state.mouse.y <= sy + is) {
            return HOTBAR_SIZE + i;
        }
    }
    return -1;
}

// Click a chest slot (pick up / place / swap / stack)
export function clickChestSlot(slotIdx) {
    const key = `${state.chestPos.x},${state.chestPos.y}`;
    if (!state.chestData[key]) return;
    const slot = state.chestData[key][slotIdx];

    if (state.cursorItem.itemId === 0) {
        // Pick up from chest
        if (slot.itemId !== 0 && slot.count > 0) {
            state.cursorItem.itemId = slot.itemId;
            state.cursorItem.count = slot.count;
            state.cursorItem.durability = slot.durability || 0;
            slot.itemId = 0; slot.count = 0; slot.durability = 0;
            playSelect();
        }
    } else {
        if (slot.itemId === 0) {
            // Place into empty slot
            slot.itemId = state.cursorItem.itemId;
            slot.count = state.cursorItem.count;
            slot.durability = state.cursorItem.durability || 0;
            state.cursorItem.itemId = 0; state.cursorItem.count = 0; state.cursorItem.durability = 0;
            playSelect();
        } else if (slot.itemId === state.cursorItem.itemId && !ITEM_INFO[slot.itemId]?.durability) {
            // Stack same items
            slot.count += state.cursorItem.count;
            state.cursorItem.itemId = 0; state.cursorItem.count = 0; state.cursorItem.durability = 0;
            playSelect();
        } else {
            // Swap
            const tmp = { itemId: slot.itemId, count: slot.count, durability: slot.durability };
            slot.itemId = state.cursorItem.itemId; slot.count = state.cursorItem.count; slot.durability = state.cursorItem.durability || 0;
            state.cursorItem.itemId = tmp.itemId; state.cursorItem.count = tmp.count; state.cursorItem.durability = tmp.durability;
            playSelect();
        }
    }
}

// Right-click a chest slot (place 1 item)
export function rightClickChestSlot(slotIdx) {
    const key = `${state.chestPos.x},${state.chestPos.y}`;
    if (!state.chestData[key]) return;
    const slot = state.chestData[key][slotIdx];

    if (state.cursorItem.itemId === 0) {
        // Pick up half
        if (slot.itemId !== 0 && slot.count > 0) {
            const half = Math.ceil(slot.count / 2);
            state.cursorItem.itemId = slot.itemId;
            state.cursorItem.count = half;
            state.cursorItem.durability = slot.durability || 0;
            slot.count -= half;
            if (slot.count <= 0) { slot.itemId = 0; slot.count = 0; slot.durability = 0; }
            playSelect();
        }
    } else {
        if (slot.itemId === 0 || (slot.itemId === state.cursorItem.itemId && !ITEM_INFO[slot.itemId]?.durability)) {
            // Place 1
            if (slot.itemId === 0) {
                slot.itemId = state.cursorItem.itemId;
                slot.count = 1;
                slot.durability = state.cursorItem.durability || 0;
            } else {
                slot.count += 1;
            }
            state.cursorItem.count -= 1;
            if (state.cursorItem.count <= 0) { state.cursorItem.itemId = 0; state.cursorItem.count = 0; state.cursorItem.durability = 0; }
            playSelect();
        }
    }
}

// Right click in game: place block or use item
function handleRightClickAction() {
    const slot = state.inventory.slots[state.inventory.selectedSlot];
    if (slot.count === 0 || slot.itemId === 0) return;

    if (slot.itemId === ITEMS.FLINT_AND_STEEL) {
        fn.useFlintAndSteel();
    } else if (isBlockId(slot.itemId)) {
        fn.placeBlock();
    }
}

// Wrap all event listener setup into a single function
export function setupInput() {
    document.addEventListener("keydown", (e) => {
        state.keys[e.key] = true;

        // Escape: pause/unpause or close menus
        if (e.key === "Escape") {
            if (state.gameState === "playing") {
                if (state.chestOpen) {
                    state.chestOpen = false;
                    state.chestPos = null;
                    returnCursorItem();
                } else if (state.tradingOpen) {
                    state.tradingOpen = false;
                    state.tradingVillager = null;
                } else if (state.craftingOpen) {
                    state.craftingOpen = false;
                    returnCursorItem();
                } else {
                    // Nothing open — pause
                    state.gameState = "paused";
                    state.menuHover = null;
                }
            } else if (state.gameState === "paused") {
                state.gameState = "playing";
                state.menuHover = null;
            }
            return;
        }

        // All other keys only work when playing
        if (state.gameState !== "playing") return;

        // E = toggle crafting/inventory
        if ((e.key === "e" || e.key === "E") && !state.gameOver && !state.sleeping) {
            if (state.chestOpen) {
                state.chestOpen = false;
                state.chestPos = null;
                returnCursorItem();
            } else if (state.tradingOpen) {
                state.tradingOpen = false;
                state.tradingVillager = null;
            } else {
                state.craftingOpen = !state.craftingOpen;
                state.craftingHover = -1;
                state.craftingScroll = 0;
                if (!state.craftingOpen) returnCursorItem();
            }
        }

        // F = interact (eat food, sleep in bed)
        if ((e.key === "f" || e.key === "F") && !state.craftingOpen) {
            if (state.chestOpen) {
                state.chestOpen = false;
                state.chestPos = null;
                returnCursorItem();
            } else if (state.tradingOpen) {
                state.tradingOpen = false;
                state.tradingVillager = null;
            } else {
                fn.interact();
            }
        }

        // M = toggle music
        if (e.key === "m" || e.key === "M") {
            state.musicEnabled = !state.musicEnabled;
            addFloatingText(state.player.x, state.player.y - 30, state.musicEnabled ? "Music ON" : "Music OFF", "#ffd700");
        }

        // R = respawn when dead
        if ((e.key === "r" || e.key === "R") && state.gameOver) fn.respawnPlayer();

        // 1-9 = select hotbar slot
        const num = parseInt(e.key);
        if (num >= 1 && num <= 9) { state.inventory.selectedSlot = num - 1; playSelect(); }
    });

    document.addEventListener("keyup", (e) => {
        state.keys[e.key] = false;
    });

    state.canvas.addEventListener("mousemove", (e) => {
        const rect = state.canvas.getBoundingClientRect();
        state.mouse.x = (e.clientX - rect.left) * (state.canvas.width / rect.width);
        state.mouse.y = (e.clientY - rect.top) * (state.canvas.height / rect.height);

        // Menu hover detection
        if (state.gameState === "menu") {
            state.menuHover = null;
            const nb = state.MENU_BUTTONS.newWorld;
            if (nb && state.mouse.x >= nb.x && state.mouse.x <= nb.x + nb.w && state.mouse.y >= nb.y && state.mouse.y <= nb.y + nb.h) {
                state.menuHover = "newWorld";
            }
            if (state.MENU_BUTTONS.savedWorlds) {
                for (let i = 0; i < state.MENU_BUTTONS.savedWorlds.length; i++) {
                    const entry = state.MENU_BUTTONS.savedWorlds[i];
                    const lb = entry.load;
                    if (state.mouse.x >= lb.x && state.mouse.x <= lb.x + lb.w && state.mouse.y >= lb.y && state.mouse.y <= lb.y + lb.h) {
                        state.menuHover = "load_" + i;
                    }
                    const db = entry.delete;
                    if (state.mouse.x >= db.x && state.mouse.x <= db.x + db.w && state.mouse.y >= db.y && state.mouse.y <= db.y + db.h) {
                        state.menuHover = "delete_" + i;
                    }
                }
            }
            return;
        }
        if (state.gameState === "paused") {
            state.menuHover = null;
            const rb = state.PAUSE_BUTTONS.resume;
            if (rb && state.mouse.x >= rb.x && state.mouse.x <= rb.x + rb.w && state.mouse.y >= rb.y && state.mouse.y <= rb.y + rb.h) {
                state.menuHover = "resume";
            }
            const sb = state.PAUSE_BUTTONS.saveQuit;
            if (sb && state.mouse.x >= sb.x && state.mouse.x <= sb.x + sb.w && state.mouse.y >= sb.y && state.mouse.y <= sb.y + sb.h) {
                state.menuHover = "saveQuit";
            }
            return;
        }

        // Update trading hover
        if (state.tradingOpen) {
            const pw = UI.TRADING_PANEL_W, ph = UI.TRADING_PANEL_H;
            const px = (state.canvas.width - pw) / 2, py = (state.canvas.height - ph) / 2;
            const startY = py + UI.TRADE_START_Y;
            const rowH = UI.TRADE_ROW_H;
            const margin = UI.TRADE_MARGIN;

            state.tradingHover = -1;
            for (let i = 0; i < TRADES.length; i++) {
                const ry = startY + i * rowH;
                if (state.mouse.x >= px + margin && state.mouse.x <= px + pw - margin &&
                    state.mouse.y >= ry && state.mouse.y <= ry + rowH - 4) {
                    state.tradingHover = i;
                    break;
                }
            }
        }

        // Update crafting recipe hover
        if (state.craftingOpen) {
            const pw = UI.CRAFTING_PANEL_W, ph = UI.CRAFTING_PANEL_H;
            const px = (state.canvas.width - pw) / 2, py = (state.canvas.height - ph) / 2;
            const rw = UI.RECIPE_W, rh = UI.RECIPE_H, cols = UI.RECIPE_COLS, gap = UI.RECIPE_GAP;
            const srx = px + UI.RECIPE_START_X, sry = py + UI.RECIPE_START_Y;
            const recipeAreaBottom = py + ph - UI.INV_BOTTOM_MARGIN;

            state.craftingHover = -1;
            for (let i = 0; i < RECIPES.length; i++) {
                const col = i % cols, row = Math.floor(i / cols);
                const rx = srx + col * (rw + gap), ry = sry + row * (rh + 6) - state.craftingScroll;
                if (ry < sry - 5 || ry + rh > recipeAreaBottom) continue;
                if (state.mouse.x >= rx && state.mouse.x <= rx + rw && state.mouse.y >= ry && state.mouse.y <= ry + rh) {
                    state.craftingHover = i;
                    break;
                }
            }
        }
    });

    state.canvas.addEventListener("mousedown", (e) => {
        e.preventDefault();

        // Update mouse position from this event too (in case mousemove hasn't fired)
        const rect = state.canvas.getBoundingClientRect();
        state.mouse.x = (e.clientX - rect.left) * (state.canvas.width / rect.width);
        state.mouse.y = (e.clientY - rect.top) * (state.canvas.height / rect.height);

        // Title screen clicks
        if (state.gameState === "menu" && e.button === 0) {
            // Direct hit-test (don't rely solely on mousemove hover)
            const nb = state.MENU_BUTTONS.newWorld;
            if (nb && state.mouse.x >= nb.x && state.mouse.x <= nb.x + nb.w && state.mouse.y >= nb.y && state.mouse.y <= nb.y + nb.h) {
                const name = "World " + (state.menuSaveList.length + 1);
                fn.startNewWorld(name);
                return;
            }
            if (state.MENU_BUTTONS.savedWorlds) {
                for (let i = 0; i < state.MENU_BUTTONS.savedWorlds.length; i++) {
                    const entry = state.MENU_BUTTONS.savedWorlds[i];
                    const lb = entry.load;
                    if (state.mouse.x >= lb.x && state.mouse.x <= lb.x + lb.w && state.mouse.y >= lb.y && state.mouse.y <= lb.y + lb.h) {
                        if (i < state.menuSaveList.length) fn.loadWorld(state.menuSaveList[i].name);
                        return;
                    }
                    const db = entry.delete;
                    if (state.mouse.x >= db.x && state.mouse.x <= db.x + db.w && state.mouse.y >= db.y && state.mouse.y <= db.y + db.h) {
                        if (i < state.menuSaveList.length) fn.deleteSave(state.menuSaveList[i].name);
                        return;
                    }
                }
            }
            return;
        }

        // Pause menu clicks
        if (state.gameState === "paused" && e.button === 0) {
            const rb = state.PAUSE_BUTTONS.resume;
            if (rb && state.mouse.x >= rb.x && state.mouse.x <= rb.x + rb.w && state.mouse.y >= rb.y && state.mouse.y <= rb.y + rb.h) {
                state.gameState = "playing";
                state.menuHover = null;
                return;
            }
            const sb = state.PAUSE_BUTTONS.saveQuit;
            if (sb && state.mouse.x >= sb.x && state.mouse.x <= sb.x + sb.w && state.mouse.y >= sb.y && state.mouse.y <= sb.y + sb.h) {
                fn.saveAndQuit();
                return;
            }
            return;
        }

        // Only process game clicks when playing
        if (state.gameState !== "playing") return;

        if (e.button === 0) { // Left click
            if (state.gameOver || state.sleeping) return;
            if (state.tradingOpen) {
                if (state.tradingHover >= 0 && state.tradingHover < TRADES.length) {
                    fn.executeTrade(TRADES[state.tradingHover]);
                }
                return;
            }
            if (state.chestOpen) {
                const cs = getChestSlotAtMouse();
                if (cs >= 0) {
                    clickChestSlot(cs);
                } else {
                    const invSlot = getChestInventorySlotAtMouse();
                    if (invSlot >= 0) clickInventorySlot(invSlot);
                }
                return;
            }
            if (state.craftingOpen) {
                const armorSlot = getArmorSlotAtMouse();
                if (armorSlot) {
                    clickArmorSlot(armorSlot);
                } else {
                    const slotIdx = getInventorySlotAtMouse();
                    if (slotIdx >= 0) {
                        clickInventorySlot(slotIdx);
                    } else if (state.craftingHover >= 0 && state.craftingHover < RECIPES.length) {
                        craft(RECIPES[state.craftingHover]);
                    }
                }
            } else {
                const mob = fn.getMobAtCursor();
                if (mob && state.player.attackCooldown <= 0) {
                    fn.attackMob(mob);
                } else {
                    // Check if holding a gun — gun firing is handled in handleGunFire()
                    const heldSlot = state.inventory.slots[state.inventory.selectedSlot];
                    const heldInfo = heldSlot.count > 0 ? ITEM_INFO[heldSlot.itemId] : null;
                    if (heldInfo && heldInfo.toolType === "gun") {
                        state.mouse.leftDown = true; // handleGunFire reads this
                    } else {
                        state.mouse.leftDown = true;
                    }
                }
            }
        }
        if (e.button === 2) { // Right click
            if (state.gameOver || state.sleeping || state.tradingOpen) return;
            if (state.chestOpen) {
                const cs = getChestSlotAtMouse();
                if (cs >= 0) {
                    rightClickChestSlot(cs);
                } else {
                    const invSlot = getChestInventorySlotAtMouse();
                    if (invSlot >= 0) rightClickInventorySlot(invSlot);
                }
                return;
            }
            if (state.craftingOpen) {
                const slotIdx = getInventorySlotAtMouse();
                if (slotIdx >= 0) rightClickInventorySlot(slotIdx);
            } else {
                state.mouse.rightDown = true;
                handleRightClickAction();
            }
        }
    });

    state.canvas.addEventListener("mouseup", (e) => {
        if (e.button === 0) state.mouse.leftDown = false;
        if (e.button === 2) state.mouse.rightDown = false;
    });

    state.canvas.addEventListener("contextmenu", (e) => e.preventDefault());

    // Scroll wheel for crafting menu recipe list
    state.canvas.addEventListener("wheel", (e) => {
        if (state.craftingOpen) {
            e.preventDefault();
            state.craftingScroll += e.deltaY > 0 ? 58 : -58;
            const recipeAreaH = UI.CRAFTING_PANEL_H - UI.RECIPE_START_Y - UI.INV_BOTTOM_MARGIN;
            const maxScroll = Math.max(0, Math.ceil(RECIPES.length / UI.RECIPE_COLS) * 58 - recipeAreaH);
            state.craftingScroll = Math.max(0, Math.min(state.craftingScroll, maxScroll));
        }
    }, { passive: false });
}
