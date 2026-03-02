// ============================================================
// INPUT.JS - Keyboard and mouse handling (ES Module)
// ============================================================
// Listens for key presses and mouse clicks.
// Also handles inventory slot clicking when crafting is open.
// Uses UI constants from constants.js for layout values.
// ============================================================

import { state } from './state.js';
import { BLOCKS, ITEMS, UI, RECIPES, TRADES, BLOCK_SIZE, WORLD_WIDTH, WORLD_HEIGHT, ITEM_INFO, isBlockId } from './constants.js';
import { HOTBAR_SIZE, BACKPACK_SIZE, TOTAL_SLOTS, clickInventorySlot, rightClickInventorySlot, returnCursorItem, clickArmorSlot, clickOffhandSlot, countItem, addFloatingText, craft } from './inventory.js';
import { playSelect } from './audio.js';
import { createParticles } from './mobs.js';

// Late-bound function references (set by main.js to avoid circular imports)
const fn = {};

// Inverse-transforms mouse coords into a panel's virtual coordinate space
// so hit-tests work correctly when the panel is scaled down on small screens.
function scaledMouse(pw, ph) {
    const s = Math.min(1, (state.canvas.width - 8) / pw, (state.canvas.height - 8) / ph);
    if (s >= 1) return { x: state.mouse.x, y: state.mouse.y };
    const cx = state.canvas.width / 2, cy = state.canvas.height / 2;
    return { x: (state.mouse.x - cx * (1 - s)) / s, y: (state.mouse.y - cy * (1 - s)) / s };
}
export function registerFunctions(fns) {
    Object.assign(fn, fns);
}

// Figure out which inventory slot the mouse is over (in crafting menu)
export function getInventorySlotAtMouse() {
    if (!state.craftingOpen) return -1;
    const pw = UI.CRAFTING_PANEL_W, ph = UI.CRAFTING_PANEL_H;
    const { x: mx, y: my } = scaledMouse(pw, ph);
    const px = (state.canvas.width - pw) / 2, py = (state.canvas.height - ph) / 2;
    const is = UI.SLOT_SIZE, ip = UI.SLOT_PAD;
    const itw = UI.INV_TOTAL_W;
    const isx = (state.canvas.width - itw) / 2 + UI.INV_OFFSET_X;

    // Check hotbar row
    const hotbarY = py + ph + UI.HOTBAR_ROW_Y;
    for (let i = 0; i < HOTBAR_SIZE; i++) {
        const sx = isx + i * (is + ip);
        if (mx >= sx && mx <= sx + is && my >= hotbarY && my <= hotbarY + is) {
            return i;
        }
    }

    // Check backpack rows
    const bpY = py + ph + UI.BACKPACK_ROW_Y;
    for (let i = 0; i < BACKPACK_SIZE; i++) {
        const col = i % UI.INV_COLS, row = Math.floor(i / UI.INV_COLS);
        const sx = isx + col * (is + ip);
        const sy = bpY + row * (is + ip);
        if (mx >= sx && mx <= sx + is && my >= sy && my <= sy + is) {
            return HOTBAR_SIZE + i;
        }
    }

    return -1;
}

// Figure out which armor slot the mouse is over
export function getArmorSlotAtMouse() {
    if (!state.craftingOpen) return null;
    const pw = UI.CRAFTING_PANEL_W, ph = UI.CRAFTING_PANEL_H;
    const { x: mx, y: my } = scaledMouse(pw, ph);
    const px = (state.canvas.width - pw) / 2, py = (state.canvas.height - ph) / 2;
    const is = UI.SLOT_SIZE, ip = UI.SLOT_PAD;
    const itw = UI.INV_TOTAL_W;
    const isx = (state.canvas.width - itw) / 2 + UI.INV_OFFSET_X;
    const armorX = isx + itw + UI.ARMOR_GAP;
    const armorY = py + ph + UI.HOTBAR_ROW_Y;

    const armorLabels = ["helmet", "chestplate", "leggings", "boots"];
    for (let i = 0; i < 4; i++) {
        const ay = armorY + i * (is + ip);
        if (mx >= armorX && mx <= armorX + is && my >= ay && my <= ay + is) {
            return armorLabels[i];
        }
    }
    return null;
}

// Figure out if the mouse is over the offhand slot (in crafting menu)
export function getOffhandSlotAtMouse() {
    if (!state.craftingOpen) return false;
    const pw = UI.CRAFTING_PANEL_W, ph = UI.CRAFTING_PANEL_H;
    const { x: mx, y: my } = scaledMouse(pw, ph);
    const py = (state.canvas.height - ph) / 2;
    const is = UI.SLOT_SIZE, ip = UI.SLOT_PAD;
    const itw = UI.INV_TOTAL_W;
    const isx = (state.canvas.width - itw) / 2 + UI.INV_OFFSET_X;
    const armorX = isx + itw + UI.ARMOR_GAP;
    const armorY = py + ph + UI.HOTBAR_ROW_Y;
    const offX = armorX;
    const offY = armorY + 4 * (is + ip) + 8;
    return mx >= offX && mx <= offX + is && my >= offY && my <= offY + is;
}

// Figure out which chest slot the mouse is over (in chest menu)
export function getChestSlotAtMouse() {
    if (!state.chestOpen || !state.chestPos) return -1;
    const pw = UI.CHEST_PANEL_W, ph = UI.CHEST_PANEL_H;
    const { x: mx, y: my } = scaledMouse(pw, ph);
    const px = (state.canvas.width - pw) / 2, py = (state.canvas.height - ph) / 2;
    const is = UI.SLOT_SIZE, ip = UI.SLOT_PAD;
    const chestCols = UI.CHEST_SLOT_COLS;
    const chestTotalW = chestCols * (is + ip) - ip;
    const csx = (state.canvas.width - chestTotalW) / 2;
    const csy = py + UI.CHEST_SLOT_START_Y;

    for (let i = 0; i < 9; i++) {
        const sx = csx + i * (is + ip);
        if (mx >= sx && mx <= sx + is && my >= csy && my <= csy + is) {
            return i;
        }
    }
    return -1;
}

// Figure out which player inventory slot the mouse is over (in chest menu)
export function getChestInventorySlotAtMouse() {
    if (!state.chestOpen || !state.chestPos) return -1;
    const pw = UI.CHEST_PANEL_W, ph = UI.CHEST_PANEL_H;
    const { x: mx, y: my } = scaledMouse(pw, ph);
    const px = (state.canvas.width - pw) / 2, py = (state.canvas.height - ph) / 2;
    const is = UI.SLOT_SIZE, ip = UI.SLOT_PAD;
    const itw = UI.INV_TOTAL_W;
    const isx = (state.canvas.width - itw) / 2;

    // Hotbar
    const hotbarY = py + ph - 100;
    for (let i = 0; i < HOTBAR_SIZE; i++) {
        const sx = isx + i * (is + ip);
        if (mx >= sx && mx <= sx + is && my >= hotbarY && my <= hotbarY + is) {
            return i;
        }
    }

    // Backpack
    const bpY = hotbarY + is + ip + 4;
    for (let i = 0; i < BACKPACK_SIZE; i++) {
        const col = i % UI.INV_COLS, row = Math.floor(i / UI.INV_COLS);
        const sx = isx + col * (is + ip);
        const sy = bpY + row * (is + ip);
        if (mx >= sx && mx <= sx + is && my >= sy && my <= sy + is) {
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

    if (isBlockId(slot.itemId)) {
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
                // Ender Pearl teleport: if holding a pearl, teleport to mouse cursor
                const heldSlot = state.inventory.slots[state.inventory.selectedSlot];
                if (heldSlot && heldSlot.itemId === ITEMS.ENDER_PEARL && heldSlot.count > 0) {
                    const worldX = state.mouse.x + state.camera.x;
                    const worldY = state.mouse.y + state.camera.y;
                    createParticles(state.player.x + state.player.width / 2, state.player.y + state.player.height / 2, 12, "#aa44ff", 4);
                    state.player.x = Math.max(0, Math.min(worldX - state.player.width / 2, (WORLD_WIDTH - 1) * BLOCK_SIZE));
                    state.player.y = Math.max(0, Math.min(worldY - state.player.height / 2, (WORLD_HEIGHT - 1) * BLOCK_SIZE));
                    state.player.velX = 0;
                    state.player.velY = 0;
                    createParticles(state.player.x + state.player.width / 2, state.player.y + state.player.height / 2, 12, "#aa44ff", 4);
                    heldSlot.count--;
                    if (heldSlot.count <= 0) { heldSlot.itemId = 0; heldSlot.durability = 0; }
                    addFloatingText(state.player.x, state.player.y - 20, "Teleported!", "#aa44ff");
                } else {
                    fn.interact();
                }
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
            const { x: mx, y: my } = scaledMouse(pw, ph);
            const px = (state.canvas.width - pw) / 2, py = (state.canvas.height - ph) / 2;
            const startY = py + UI.TRADE_START_Y;
            const rowH = UI.TRADE_ROW_H;
            const margin = UI.TRADE_MARGIN;

            const activeTrades = (state.tradingVillager && state.tradingVillager.tradeList) || TRADES;
            state.tradingHover = -1;
            for (let i = 0; i < activeTrades.length; i++) {
                const ry = startY + i * rowH;
                if (mx >= px + margin && mx <= px + pw - margin &&
                    my >= ry && my <= ry + rowH - 4) {
                    state.tradingHover = i;
                    break;
                }
            }
        }

        // Update crafting recipe hover
        if (state.craftingOpen) {
            const pw = UI.CRAFTING_PANEL_W, ph = UI.CRAFTING_PANEL_H;
            const { x: mx, y: my } = scaledMouse(pw, ph);
            const px = (state.canvas.width - pw) / 2, py = (state.canvas.height - ph) / 2;
            const rw = UI.RECIPE_W, rh = UI.RECIPE_H, cols = UI.RECIPE_COLS, gap = UI.RECIPE_GAP;
            const srx = px + UI.RECIPE_START_X, sry = py + UI.RECIPE_START_Y;
            const recipeAreaBottom = py + ph - UI.INV_BOTTOM_MARGIN;

            state.craftingHover = -1;
            for (let i = 0; i < RECIPES.length; i++) {
                const col = i % cols, row = Math.floor(i / cols);
                const rx = srx + col * (rw + gap), ry = sry + row * (rh + 6) - state.craftingScroll;
                if (ry < sry - 5 || ry + rh > recipeAreaBottom) continue;
                if (mx >= rx && mx <= rx + rw && my >= ry && my <= ry + rh) {
                    state.craftingHover = i;
                    break;
                }
            }
        }
    });

    // Hold-to-mine timer (mobile only)
    let miningHoldTimer = null;

    // Double-tap tracking for respawn (mobile only)
    let lastTapTime = 0;

    // Shared left-click / tap handler — called by both mousedown and touchstart
    function handleLeftClick(isTap = false) {
        // Title screen taps
        if (state.gameState === "menu") {
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

        // Pause menu taps (use scaledMouse in case panel is scaled on small screens)
        if (state.gameState === "paused") {
            const { x: mx, y: my } = scaledMouse(400, 250);
            const rb = state.PAUSE_BUTTONS.resume;
            if (rb && mx >= rb.x && mx <= rb.x + rb.w && my >= rb.y && my <= rb.y + rb.h) {
                state.gameState = "playing";
                state.menuHover = null;
                return;
            }
            const sb = state.PAUSE_BUTTONS.saveQuit;
            if (sb && mx >= sb.x && mx <= sb.x + sb.w && my >= sb.y && my <= sb.y + sb.h) {
                fn.saveAndQuit();
                return;
            }
            return;
        }

        if (state.gameState !== "playing") return;
        if (state.gameOver || state.sleeping) return;

        if (state.tradingOpen) {
            const activeTrades = (state.tradingVillager && state.tradingVillager.tradeList) || TRADES;
            if (state.tradingHover >= 0 && state.tradingHover < activeTrades.length) {
                fn.executeTrade(activeTrades[state.tradingHover]);
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
            } else if (getOffhandSlotAtMouse()) {
                clickOffhandSlot();
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
            const held = state.inventory.slots[state.inventory.selectedSlot];
            const heldInfo = (held && held.count > 0) ? ITEM_INFO[held.itemId] : null;
            const isGun = !!(heldInfo && heldInfo.toolType === 'gun');

            if (isGun) {
                // Gun: fire toward tap/click point
                state.mouse.leftDown = true;
            } else if (mob && state.player.attackCooldown <= 0) {
                // Mob at cursor: melee or ranged attack by tapping
                fn.attackMob(mob);
            } else if (isTap && held && held.count > 0 && isBlockId(held.itemId)) {
                // Mobile tap while holding a placeable block: place it
                fn.placeBlock();
            } else if (isTap) {
                // Mobile: must hold finger down for 200ms before mining starts
                miningHoldTimer = setTimeout(() => { state.mouse.leftDown = true; }, 200);
            } else {
                state.mouse.leftDown = true;
            }
        }
    }

    state.canvas.addEventListener("mousedown", (e) => {
        e.preventDefault();

        // Update mouse position from this event too (in case mousemove hasn't fired)
        const rect = state.canvas.getBoundingClientRect();
        state.mouse.x = (e.clientX - rect.left) * (state.canvas.width / rect.width);
        state.mouse.y = (e.clientY - rect.top) * (state.canvas.height / rect.height);

        if (e.button === 0) handleLeftClick();
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

    // Touch support — tap acts as left click
    state.canvas.addEventListener("touchstart", (e) => {
        e.preventDefault();
        const rect = state.canvas.getBoundingClientRect();
        const t = e.changedTouches[0];
        state.mouse.x = (t.clientX - rect.left) * (state.canvas.width / rect.width);
        state.mouse.y = (t.clientY - rect.top)  * (state.canvas.height / rect.height);
        // Synthesise mousemove so tradingHover / craftingHover / menuHover are up-to-date
        state.canvas.dispatchEvent(new MouseEvent("mousemove", { clientX: t.clientX, clientY: t.clientY, bubbles: false }));

        // Double-tap to respawn when game over
        if (state.gameOver) {
            const now = Date.now();
            if (now - lastTapTime < 300) {
                fn.respawnPlayer();
                lastTapTime = 0;
            } else {
                lastTapTime = now;
            }
            return;
        }

        handleLeftClick(true);
    }, { passive: false });

    state.canvas.addEventListener("touchend", (e) => {
        e.preventDefault();
        clearTimeout(miningHoldTimer);
        miningHoldTimer = null;
        state.mouse.leftDown  = false;
        state.mouse.rightDown = false;
    }, { passive: false });

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
