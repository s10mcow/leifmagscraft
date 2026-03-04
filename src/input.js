// ============================================================
// INPUT.JS - Keyboard and mouse handling (ES Module)
// ============================================================
// Listens for key presses and mouse clicks.
// Also handles inventory slot clicking when crafting is open.
// Uses UI constants from constants.js for layout values.
// ============================================================

import { state } from './state.js';
import { BLOCKS, ITEMS, UI, RECIPES, TRADES, SMELTING_RECIPES, BLOCK_SIZE, WORLD_WIDTH, WORLD_HEIGHT, ITEM_INFO, isBlockId, getItemName } from './constants.js';
import { HOTBAR_SIZE, BACKPACK_SIZE, TOTAL_SLOTS, clickInventorySlot, rightClickInventorySlot, returnCursorItem, clickArmorSlot, clickOffhandSlot, countItem, addFloatingText, craft, addToInventory, removeItems } from './inventory.js';
import { playSelect } from './audio.js';
import { createParticles, createMob } from './mobs.js';
import { triggerManualReload } from './game/input-handlers.js';

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
        // Account screens — intercept ALL keys while typing
        if (state.gameState === "accountCreate" || state.gameState === "accountLogin") {
            e.preventDefault();
            const field = state.accountActiveField;
            if (e.key === "Tab") {
                state.accountActiveField = field === 'username' ? 'password' : 'username';
            } else if (e.key === "Enter") {
                if (state.gameState === "accountCreate") {
                    const name = state.accountInput.trim();
                    if (name.length > 0 && state.accountPassword.length >= 6 && !state.accountLoading) {
                        import('./auth.js').then(m => m.createAccount(name, state.accountPassword));
                    }
                } else if (state.supabaseSession) {
                    state.gameState = 'menu';
                } else if (state.accountPassword.length > 0 && !state.accountLoading) {
                    import('./auth.js').then(m => m.loginAccount(state.playerAccount, state.accountPassword));
                }
            } else if (e.key === "Backspace") {
                if (field === 'password') state.accountPassword = state.accountPassword.slice(0, -1);
                else state.accountInput = state.accountInput.slice(0, -1);
            } else if (e.key.length === 1) {
                if (field === 'password' && state.accountPassword.length < 40) state.accountPassword += e.key;
                else if (field === 'username' && state.accountInput.length < 20) state.accountInput += e.key;
            }
            return;
        }

        // Chat input mode — intercept ALL keys while chat is open
        if (state.chatOpen) {
            e.preventDefault();
            if (e.key === 'Enter') {
                const text = state.chatInput.trim();
                if (text) {
                    if (state.multiplayerMode) {
                        import('./multiplayer.js').then(m => m.sendChat(text));
                    } else {
                        state.chatMessages.push({ text: `You: ${text}`, color: '#ffff88', timer: 600 });
                        if (state.chatMessages.length > 30) state.chatMessages.shift();
                    }
                }
                state.chatInput = '';
                state.chatOpen = false;
            } else if (e.key === 'Escape') {
                state.chatInput = '';
                state.chatOpen = false;
            } else if (e.key === 'Backspace') {
                state.chatInput = state.chatInput.slice(0, -1);
            } else if (e.key.length === 1 && state.chatInput.length < 120) {
                state.chatInput += e.key;
            }
            return;
        }

        state.keys[e.key] = true;

        // T — open chat (in-game only)
        if ((e.key === 't' || e.key === 'T') && state.gameState === 'playing' && !state.gameOver) {
            state.chatOpen = true;
            state.chatInput = '';
            return;
        }

        // Escape: pause/unpause or close menus
        if (e.key === "Escape") {
            if (state.gameState === "playing") {
                if (state.chestOpen) {
                    state.chestOpen = false;
                    state.chestPos = null;
                    returnCursorItem();
                } else if (state.blastFurnaceOpen) {
                    state.blastFurnaceOpen = false;
                    state.blastFurnacePos = null;
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
            } else if (state.blastFurnaceOpen) {
                state.blastFurnaceOpen = false;
                state.blastFurnacePos = null;
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
            } else if (state.blastFurnaceOpen) {
                state.blastFurnaceOpen = false;
                state.blastFurnacePos = null;
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

        // M = spawn The Companion (fed form)
        if (e.key === "m" || e.key === "M") {
            if (state.gameState === "playing" && !state.gameOver) {
                // Only spawn if no companion or glitched already exists
                const alreadyExists = state.mobs.some(function(m) { return m.type === "companion" || m.type === "glitched"; });
                if (!alreadyExists) {
                    const c = createMob("companion", state.player.x + 3 * BLOCK_SIZE, state.player.y);
                    state.mobs.push(c);
                    addFloatingText(state.player.x, state.player.y - 30, "The Companion has arrived!", "#88ff88");
                }
            }
        }

        // N = spawn The Glitched
        if (e.key === "n" || e.key === "N") {
            if (state.gameState === "playing" && !state.gameOver) {
                const alreadyGlitched = state.mobs.some(function(m) { return m.type === "glitched"; });
                if (!alreadyGlitched) {
                    const g = createMob("glitched", state.player.x + 4 * BLOCK_SIZE, state.player.y);
                    g.aggroed = true;
                    state.mobs.push(g);
                    state.glitchedActive = true;
                    addFloatingText(state.player.x, state.player.y - 30, "The Glitched has arrived!", "#aa00ff");
                }
            }
        }

        // R = respawn when dead, or manual reload when alive
        if (e.key === "r" || e.key === "R") {
            if (state.gameOver) fn.respawnPlayer();
            else triggerManualReload();
        }

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

        // Account screen hover detection
        if (state.gameState === "accountCreate") {
            state.menuHover = null;
            const b = state.MENU_BUTTONS.accountCreate;
            if (b && state.mouse.x >= b.x && state.mouse.x <= b.x + b.w && state.mouse.y >= b.y && state.mouse.y <= b.y + b.h) {
                state.menuHover = "accountCreate";
            }
            return;
        }
        if (state.gameState === "accountLogin") {
            state.menuHover = null;
            const lb = state.MENU_BUTTONS.accountLogin;
            if (lb && state.mouse.x >= lb.x && state.mouse.x <= lb.x + lb.w && state.mouse.y >= lb.y && state.mouse.y <= lb.y + lb.h) {
                state.menuHover = "accountLogin";
            }
            const cb = state.MENU_BUTTONS.accountChange;
            if (cb && state.mouse.x >= cb.x && state.mouse.x <= cb.x + cb.w && state.mouse.y >= cb.y && state.mouse.y <= cb.y + cb.h) {
                state.menuHover = "accountChange";
            }
            return;
        }

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
        if (state.gameState === "modeSelect") {
            state.menuHover = null;
            const sp = state.MENU_BUTTONS.modeSP;
            if (sp && state.mouse.x >= sp.x && state.mouse.x <= sp.x + sp.w && state.mouse.y >= sp.y && state.mouse.y <= sp.y + sp.h) {
                state.menuHover = "modeSP";
            }
            const mp = state.MENU_BUTTONS.modeMP;
            if (mp && state.mouse.x >= mp.x && state.mouse.x <= mp.x + mp.w && state.mouse.y >= mp.y && state.mouse.y <= mp.y + mp.h) {
                state.menuHover = "modeMP";
            }
            const bk = state.MENU_BUTTONS.modeBack;
            if (bk && state.mouse.x >= bk.x && state.mouse.x <= bk.x + bk.w && state.mouse.y >= bk.y && state.mouse.y <= bk.y + bk.h) {
                state.menuHover = "modeBack";
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

        // Update blast furnace recipe hover
        if (state.blastFurnaceOpen) {
            const pw = 500, ph = 380;
            const { x: mx, y: my } = scaledMouse(pw, ph);
            const px = (state.canvas.width - pw) / 2, py = (state.canvas.height - ph) / 2;
            const rowH = 56, margin = 24, startY = py + 72;
            state.blastFurnaceHover = -1;
            for (let i = 0; i < SMELTING_RECIPES.length; i++) {
                const ry = startY + i * rowH;
                if (mx >= px + margin && mx <= px + pw - margin && my >= ry && my <= ry + rowH - 6) {
                    state.blastFurnaceHover = i;
                    break;
                }
            }
        }
    });

    // Hold-to-mine timer (mobile only)
    let miningHoldTimer = null;

    // Double-tap tracking for respawn (mobile only)
    let lastTapTime = 0;

    // Swipe tracking (mobile scroll + hotbar switch)
    let swipeTouchId = null;
    let swipeStartX = 0, swipeStartY = 0, swipeLastY = 0;

    function applySwipeScroll(dy) {
        if (state.gameState === "menu") {
            const rowH = 60;
            const maxScroll = Math.max(0, state.menuSaveList.length * rowH - (state.canvas.height - 420));
            state.menuScrollOffset = Math.max(0, Math.min(state.menuScrollOffset + dy, maxScroll));
        } else if (state.gameState === "playing" && state.craftingOpen) {
            state.craftingScroll += dy;
            const recipeAreaH = UI.CRAFTING_PANEL_H - UI.RECIPE_START_Y - UI.INV_BOTTOM_MARGIN;
            const maxScroll = Math.max(0, Math.ceil(RECIPES.length / UI.RECIPE_COLS) * 58 - recipeAreaH);
            state.craftingScroll = Math.max(0, Math.min(state.craftingScroll, maxScroll));
        }
    }

    // Shared left-click / tap handler — called by both mousedown and touchstart
    function handleLeftClick(isTap = false) {
        // Account create screen
        if (state.gameState === "accountCreate") {
            const uf = state.MENU_BUTTONS.accountUsernameField;
            if (uf && state.mouse.x >= uf.x && state.mouse.x <= uf.x + uf.w && state.mouse.y >= uf.y && state.mouse.y <= uf.y + uf.h) {
                state.accountActiveField = 'username';
                return;
            }
            const pf = state.MENU_BUTTONS.accountPasswordField;
            if (pf && state.mouse.x >= pf.x && state.mouse.x <= pf.x + pf.w && state.mouse.y >= pf.y && state.mouse.y <= pf.y + pf.h) {
                state.accountActiveField = 'password';
                return;
            }
            const b = state.MENU_BUTTONS.accountCreate;
            if (b && state.mouse.x >= b.x && state.mouse.x <= b.x + b.w && state.mouse.y >= b.y && state.mouse.y <= b.y + b.h) {
                const name = state.accountInput.trim();
                if (name.length > 0 && state.accountPassword.length >= 6 && !state.accountLoading) {
                    import('./auth.js').then(m => m.createAccount(name, state.accountPassword));
                }
            }
            return;
        }

        // Account login screen
        if (state.gameState === "accountLogin") {
            const lb = state.MENU_BUTTONS.accountLogin;
            if (lb && state.mouse.x >= lb.x && state.mouse.x <= lb.x + lb.w && state.mouse.y >= lb.y && state.mouse.y <= lb.y + lb.h) {
                if (state.supabaseSession) {
                    state.gameState = "menu";
                } else if (state.accountPassword.length > 0 && !state.accountLoading) {
                    import('./auth.js').then(m => m.loginAccount(state.playerAccount, state.accountPassword));
                }
                return;
            }
            const cb = state.MENU_BUTTONS.accountChange;
            if (cb && state.mouse.x >= cb.x && state.mouse.x <= cb.x + cb.w && state.mouse.y >= cb.y && state.mouse.y <= cb.y + cb.h) {
                state.accountInput = "";
                state.accountPassword = "";
                state.accountActiveField = 'username';
                state.gameState = "accountCreate";
                document.title = "Make an Account";
                return;
            }
            return;
        }

        // Title screen taps
        if (state.gameState === "menu") {
            const nb = state.MENU_BUTTONS.newWorld;
            if (nb && state.mouse.x >= nb.x && state.mouse.x <= nb.x + nb.w && state.mouse.y >= nb.y && state.mouse.y <= nb.y + nb.h) {
                state.pendingWorldName = "World " + (state.menuSaveList.length + 1);
                state.gameState = "modeSelect";
                state.menuHover = null;
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

        // Mode select screen taps
        if (state.gameState === "modeSelect") {
            const sp = state.MENU_BUTTONS.modeSP;
            if (sp && state.mouse.x >= sp.x && state.mouse.x <= sp.x + sp.w && state.mouse.y >= sp.y && state.mouse.y <= sp.y + sp.h) {
                fn.startNewWorld(state.pendingWorldName);
                return;
            }
            const mp = state.MENU_BUTTONS.modeMP;
            if (mp && state.mouse.x >= mp.x && state.mouse.x <= mp.x + mp.w && state.mouse.y >= mp.y && state.mouse.y <= mp.y + mp.h) {
                fn.startMultiplayerWorld(state.pendingWorldName);
                return;
            }
            const bk = state.MENU_BUTTONS.modeBack;
            if (bk && state.mouse.x >= bk.x && state.mouse.x <= bk.x + bk.w && state.mouse.y >= bk.y && state.mouse.y <= bk.y + bk.h) {
                state.gameState = "menu";
                state.menuHover = null;
                return;
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
        if (state.blastFurnaceOpen) {
            if (state.blastFurnaceHover >= 0 && state.blastFurnaceHover < SMELTING_RECIPES.length) {
                const recipe = SMELTING_RECIPES[state.blastFurnaceHover];
                if (countItem(recipe.input) >= 1) {
                    removeItems(recipe.input, 1);
                    addToInventory(recipe.output, recipe.outputCount);
                    addFloatingText(state.player.x, state.player.y - 30,
                        `Smelted 1x ${getItemName(recipe.output)}!`, "#c86000");
                }
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

    // Touch support — tap acts as left click; swipe scrolls menus / switches hotbar
    state.canvas.addEventListener("touchstart", (e) => {
        e.preventDefault();
        const rect = state.canvas.getBoundingClientRect();
        const t = e.changedTouches[0];
        state.mouse.x = (t.clientX - rect.left) * (state.canvas.width / rect.width);
        state.mouse.y = (t.clientY - rect.top)  * (state.canvas.height / rect.height);
        // Synthesise mousemove so tradingHover / craftingHover / menuHover are up-to-date
        state.canvas.dispatchEvent(new MouseEvent("mousemove", { clientX: t.clientX, clientY: t.clientY, bubbles: false }));

        // Track for swipe gestures
        if (swipeTouchId === null) {
            swipeTouchId = t.identifier;
            swipeStartX  = state.mouse.x;
            swipeStartY  = state.mouse.y;
            swipeLastY   = state.mouse.y;
        }

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

        // In scrollable contexts (main menu, crafting), defer tap to touchend
        // so the user can swipe to scroll without accidentally triggering buttons.
        const isScrollable = state.gameState === "menu" ||
            (state.gameState === "playing" && state.craftingOpen);
        if (!isScrollable) handleLeftClick(true);
    }, { passive: false });

    state.canvas.addEventListener("touchmove", (e) => {
        e.preventDefault();
        for (const t of e.changedTouches) {
            if (t.identifier !== swipeTouchId) continue;
            const rect = state.canvas.getBoundingClientRect();
            const cy = (t.clientY - rect.top) * (state.canvas.height / rect.height);
            const dy = swipeLastY - cy; // positive = finger moved up = scroll content down
            swipeLastY = cy;
            applySwipeScroll(dy);
            break;
        }
    }, { passive: false });

    state.canvas.addEventListener("touchend", (e) => {
        e.preventDefault();
        clearTimeout(miningHoldTimer);
        miningHoldTimer = null;

        for (const t of e.changedTouches) {
            if (t.identifier !== swipeTouchId) continue;
            const rect = state.canvas.getBoundingClientRect();
            const cx = (t.clientX - rect.left) * (state.canvas.width / rect.width);
            const dx = cx - swipeStartX;
            const totalDy = Math.abs(swipeLastY - swipeStartY);
            // Scrollable contexts: fire click only if it was a tap (barely moved)
            if (state.gameState === "menu" || (state.gameState === "playing" && state.craftingOpen)) {
                if (Math.abs(dx) < 18 && totalDy < 18) handleLeftClick(true);
            }
            // Horizontal swipe → hotbar slot switch (only in-game with no menus)
            if (state.gameState === "playing" && !state.craftingOpen && !state.chestOpen && !state.tradingOpen && !state.blastFurnaceOpen && !state.gameOver) {
                if (Math.abs(dx) > 60 && totalDy < 35) {
                    if (dx > 0) state.inventory.selectedSlot = (state.inventory.selectedSlot + 1) % HOTBAR_SIZE;
                    else        state.inventory.selectedSlot = (state.inventory.selectedSlot - 1 + HOTBAR_SIZE) % HOTBAR_SIZE;
                    playSelect();
                }
            }
            swipeTouchId = null;
            break;
        }

        state.mouse.leftDown  = false;
        state.mouse.rightDown = false;
    }, { passive: false });

    // Scroll wheel — crafting recipes and main menu world list
    state.canvas.addEventListener("wheel", (e) => {
        e.preventDefault();
        const dy = e.deltaY > 0 ? 58 : -58;
        applySwipeScroll(dy);
    }, { passive: false });
}
