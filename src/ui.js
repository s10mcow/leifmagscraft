// ============================================================
// UI.JS - All user interface drawing (ES Module)
// ============================================================
// Floating texts, hotbar, health bar, crafting menu,
// block highlight, mining progress, death screen, HUD.
// ============================================================

import { state } from './state.js';
import { BLOCKS, ITEMS, BLOCK_SIZE, WORLD_WIDTH, WORLD_HEIGHT, UI, RECIPES, TRADES, BLOCK_INFO, ITEM_INFO, MOB_DEFS, getItemName, isStackable, maxStackSize, isFood, PLAYER_REACH, SMELTING_RECIPES, FURNACE_RECIPES, FOOD_RECIPES, FUEL_VALUES } from './constants.js';
import { countItem, getArmorDefense, HOTBAR_SIZE, BACKPACK_SIZE, canCraft, addToInventory, removeItems } from './inventory.js';
import { drawItemIcon } from './rendering.js';
import { getInventorySlotAtMouse, getArmorSlotAtMouse, getChestSlotAtMouse, getChestInventorySlotAtMouse, getOffhandSlotAtMouse } from './input.js';

// --- FLOATING TEXTS ---
export function drawFloatingTexts() {
    for (let i = state.floatingTexts.length - 1; i >= 0; i--) {
        const ft = state.floatingTexts[i];
        const alpha = ft.life / 60;
        const sx = ft.x - state.camera.x + state.screenShake.x;
        const sy = ft.y - state.camera.y + state.screenShake.y - (60 - ft.life) * 0.5;
        state.ctx.globalAlpha = alpha;
        state.ctx.fillStyle = ft.color;
        state.ctx.font = "bold 13px 'Courier New', monospace";
        state.ctx.textAlign = "center";
        state.ctx.fillText(ft.text, sx, sy);
        ft.life--;
        if (ft.life <= 0) state.floatingTexts.splice(i, 1);
    }
    state.ctx.globalAlpha = 1;
}

// --- INVENTORY SLOT ---
export function drawInventorySlot(x, y, size, slot, selected, num) {
    state.ctx.fillStyle = selected ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.6)";
    state.ctx.fillRect(x, y, size, size);
    state.ctx.strokeStyle = selected ? "#4ade80" : "#555";
    state.ctx.lineWidth = selected ? 3 : 1;
    state.ctx.strokeRect(x, y, size, size);

    if (slot.itemId !== 0 && slot.count > 0) {
        drawItemIcon(slot.itemId, x + 6, y + 6, size - 12);
        if (ITEM_INFO[slot.itemId] && ITEM_INFO[slot.itemId].durability) {
            const maxD = ITEM_INFO[slot.itemId].durability;
            const pct = slot.durability / maxD;
            state.ctx.fillStyle = "rgba(0,0,0,0.5)";
            state.ctx.fillRect(x + 4, y + size - 7, size - 8, 4);
            state.ctx.fillStyle = pct > 0.5 ? "#4ade80" : pct > 0.25 ? "#fbbf24" : "#ef4444";
            state.ctx.fillRect(x + 4, y + size - 7, (size - 8) * pct, 4);
        }
        if (slot.count > 1) {
            state.ctx.fillStyle = "#fff"; state.ctx.font = "bold 14px 'Courier New', monospace"; state.ctx.textAlign = "right";
            state.ctx.fillText(slot.count.toString(), x + size - 4, y + size - 4);
        }
    }
    if (num !== undefined) {
        state.ctx.fillStyle = "rgba(255,255,255,0.4)"; state.ctx.font = "10px 'Courier New', monospace"; state.ctx.textAlign = "left";
        state.ctx.fillText(num.toString(), x + 3, y + 11);
    }
    state.ctx.lineWidth = 1;
}

// Returns responsive hotbar geometry used by both drawing and touch detection
export function getHotbarLayout() {
    const s = Math.min(48, Math.floor((state.canvas.width - 16) / HOTBAR_SIZE) - 4);
    const p = 4;
    const total = HOTBAR_SIZE * (s + p) - p;
    const sx = (state.canvas.width - total) / 2;
    const sy = state.canvas.height - s - 12;
    return { s, p, total, sx, sy };
}

// --- HOTBAR ---
export function drawHotbar() {
    const { s, p, total, sx, sy } = getHotbarLayout();

    for (let i = 0; i < HOTBAR_SIZE; i++) {
        drawInventorySlot(sx + i * (s + p), sy, s, state.inventory.slots[i], i === state.inventory.selectedSlot, i + 1);
    }

    // Offhand slot — only draw if it fits (hide on very narrow screens)
    const offX = sx + total + 8, offY = sy;
    state.ctx.fillStyle = "#9ca3af"; state.ctx.font = "9px 'Courier New', monospace"; state.ctx.textAlign = "center";
    state.ctx.fillText("OFF", offX + s / 2, offY - 4);
    drawInventorySlot(offX, offY, s, state.offhand, false);

    // Temperature bar above hotbar
    {
        const temp = state.player.temperature;
        const barW = 100, barH = 8;
        const barX = state.canvas.width / 2 - barW / 2;
        const barY = sy - 46;
        state.ctx.fillStyle = "rgba(0,0,0,0.5)";
        state.ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
        const fillW = (temp / 100) * barW;
        const tempColor = temp <= 20 ? "#66aaff" : temp <= 45 ? "#88ddff" : temp <= 60 ? "#44ee88" : temp <= 80 ? "#ffaa33" : "#ff4444";
        state.ctx.fillStyle = tempColor;
        state.ctx.fillRect(barX, barY, fillW, barH);
        // Neutral midpoint marker
        state.ctx.fillStyle = "rgba(255,255,255,0.4)";
        state.ctx.fillRect(barX + barW / 2, barY, 1, barH);
        const tempLabel = temp <= 10 ? "Freezing!" : temp <= 30 ? "Cold" : temp <= 60 ? "Comfortable" : temp <= 80 ? "Hot" : "Heatstroke!";
        state.ctx.font = "9px 'Courier New', monospace";
        state.ctx.textAlign = "center";
        state.ctx.fillStyle = (temp <= 10 || temp >= 90) ? "#ff5555" : "#ffffff";
        state.ctx.fillText(tempLabel, state.canvas.width / 2, barY - 2);
    }

    const held = state.inventory.slots[state.inventory.selectedSlot];
    if (held.count > 0 && held.itemId !== 0) {
        const heldInfo = ITEM_INFO[held.itemId];
        let name = getItemName(held.itemId);
        // Gun: show mag / reserve ammo and reload status
        if (heldInfo && heldInfo.toolType === "gun") {
            const ammoId = heldInfo.ammoType === "rocket" ? ITEMS.ROCKET : heldInfo.ammoType === "fuel" ? ITEMS.FUEL_CANISTER : ITEMS.BULLETS;
            const reserve = countItem(ammoId);
            const mag = held.magAmmo !== undefined ? held.magAmmo : heldInfo.magSize;
            if (state.gunReloadTimer > 0 && state.gunReloadingSlot === state.inventory.selectedSlot) {
                const secs = Math.ceil(state.gunReloadTimer / 1000);
                name += ` | RELOADING ${secs}s | Reserve:${reserve}`;
            } else {
                name += ` | DMG:${heldInfo.damage} | Mag:${mag}/${heldInfo.magSize} | Reserve:${reserve}`;
            }
        }
        state.ctx.font = "14px 'Courier New', monospace"; state.ctx.textAlign = "center";
        const tw = state.ctx.measureText(name).width;
        state.ctx.fillStyle = "rgba(0,0,0,0.6)";
        state.ctx.fillRect(state.canvas.width / 2 - tw / 2 - 6, sy - 26, tw + 12, 22);
        state.ctx.fillStyle = "#fff";
        state.ctx.fillText(name, state.canvas.width / 2, sy - 10);
    }
}

// --- HEALTH BAR ---
export function drawHealthBar() {
    const hs = 16, sx = 10, sy = 10;
    for (let i = 0; i < state.player.maxHealth / 2; i++) {
        const x = sx + i * (hs + 2);
        if (i < Math.floor(state.player.health / 2)) state.ctx.fillStyle = "#ff3333";
        else if (state.player.health % 2 === 1 && i === Math.floor(state.player.health / 2)) state.ctx.fillStyle = "#ff9999";
        else state.ctx.fillStyle = "#333";
        state.ctx.fillRect(x + 2, sy, hs - 4, hs - 2);
        state.ctx.fillRect(x, sy + 2, hs, hs - 4);
    }

    const armorDef = getArmorDefense();
    if (armorDef > 0) {
        const ay = sy + hs + 4;
        state.ctx.fillStyle = "rgba(0,0,0,0.4)";
        state.ctx.fillRect(sx - 2, ay - 2, armorDef * (hs + 2) + 4, hs + 2);
        for (let i = 0; i < armorDef; i++) {
            const x = sx + i * (hs + 2);
            state.ctx.fillStyle = "#8888cc";
            state.ctx.fillRect(x + 2, ay, hs - 4, hs - 4);
            state.ctx.fillRect(x, ay + 2, hs, hs - 6);
            state.ctx.fillStyle = "#aaaaee";
            state.ctx.fillRect(x + 4, ay + 2, hs - 8, hs - 8);
        }
    }
}

// --- BLOCK HIGHLIGHT ---
export function drawBlockHighlight() {
    if (state.craftingOpen || state.tradingOpen || state.chestOpen || state.gameOver) return;
    const wmx = Math.floor((state.mouse.x + state.camera.x) / BLOCK_SIZE);
    const wmy = Math.floor((state.mouse.y + state.camera.y) / BLOCK_SIZE);
    if (wmx < 0 || wmx >= WORLD_WIDTH || wmy < 0 || wmy >= WORLD_HEIGHT) return;

    const pcx = state.player.x + state.player.width / 2, pcy = state.player.y + state.player.height / 2;
    const bcx = wmx * BLOCK_SIZE + BLOCK_SIZE / 2, bcy = wmy * BLOCK_SIZE + BLOCK_SIZE / 2;
    const dist = Math.sqrt((pcx - bcx) ** 2 + (pcy - bcy) ** 2);

    if (dist < BLOCK_SIZE * PLAYER_REACH) {
        const sx = wmx * BLOCK_SIZE - state.camera.x + state.screenShake.x;
        const sy = wmy * BLOCK_SIZE - state.camera.y + state.screenShake.y;
        state.ctx.strokeStyle = "rgba(255,255,255,0.7)";
        state.ctx.lineWidth = 2;
        state.ctx.strokeRect(sx, sy, BLOCK_SIZE, BLOCK_SIZE);
        state.ctx.lineWidth = 1;
    }
}

// --- MINING PROGRESS ---
export function drawMiningProgress() {
    if (!state.mining.active) return;
    const sx = state.mining.blockX * BLOCK_SIZE - state.camera.x + state.screenShake.x;
    const sy = state.mining.blockY * BLOCK_SIZE - state.camera.y + state.screenShake.y;
    const p = state.mining.progress / state.mining.targetTime;

    state.ctx.strokeStyle = "rgba(0,0,0,0.7)"; state.ctx.lineWidth = 2;
    if (p > 0.2) { state.ctx.beginPath(); state.ctx.moveTo(sx + 16, sy + 16); state.ctx.lineTo(sx + 32, sy); state.ctx.stroke(); }
    if (p > 0.4) { state.ctx.beginPath(); state.ctx.moveTo(sx + 16, sy + 16); state.ctx.lineTo(sx, sy + 32); state.ctx.stroke(); }
    if (p > 0.6) { state.ctx.beginPath(); state.ctx.moveTo(sx + 16, sy + 16); state.ctx.lineTo(sx, sy); state.ctx.stroke(); }
    if (p > 0.8) { state.ctx.beginPath(); state.ctx.moveTo(sx + 16, sy + 16); state.ctx.lineTo(sx + 32, sy + 32); state.ctx.stroke(); }
    state.ctx.lineWidth = 1;

    state.ctx.fillStyle = "rgba(0,0,0,0.5)";
    state.ctx.fillRect(sx, sy - 10, BLOCK_SIZE, 7);
    state.ctx.fillStyle = state.mining.canMine ? "#4ade80" : "#ef4444";
    state.ctx.fillRect(sx, sy - 10, BLOCK_SIZE * p, 7);

    if (!state.mining.canMine) {
        state.ctx.fillStyle = "#ef4444"; state.ctx.font = "bold 11px 'Courier New', monospace"; state.ctx.textAlign = "center";
        state.ctx.fillText("Need better tool!", sx + 16, sy - 14);
    }
}

// Scales a panel uniformly so it fits the current canvas.
// Call inside ctx.save() before drawing the panel content.
function applyPanelScale(pw, ph) {
    const s = Math.min(1, (state.canvas.width - 8) / pw, (state.canvas.height - 8) / ph);
    if (s < 1) {
        const cx = state.canvas.width / 2, cy = state.canvas.height / 2;
        state.ctx.translate(cx * (1 - s), cy * (1 - s));
        state.ctx.scale(s, s);
    }
}

// --- CRAFTING MENU ---
export function drawCraftingMenu() {
    if (!state.craftingOpen) return;

    state.ctx.fillStyle = "rgba(0,0,0,0.75)";
    state.ctx.fillRect(0, 0, state.canvas.width, state.canvas.height);

    const pw = UI.CRAFTING_PANEL_W, ph = UI.CRAFTING_PANEL_H;
    const px = (state.canvas.width - pw) / 2, py = (state.canvas.height - ph) / 2;
    state.ctx.save();
    applyPanelScale(pw, ph);
    state.ctx.fillStyle = "#2a2a3e"; state.ctx.fillRect(px, py, pw, ph);
    state.ctx.strokeStyle = "#4ade80"; state.ctx.lineWidth = 3; state.ctx.strokeRect(px, py, pw, ph); state.ctx.lineWidth = 1;

    state.ctx.fillStyle = "#4ade80"; state.ctx.font = "bold 24px 'Courier New', monospace"; state.ctx.textAlign = "center";
    state.ctx.fillText("CRAFTING", state.canvas.width / 2, py + 35);
    state.ctx.fillStyle = "#9ca3af"; state.ctx.font = "12px 'Courier New', monospace";
    state.ctx.fillText("Click to craft!  Scroll for more  Press E to close", state.canvas.width / 2, py + 55);

    const rw = UI.RECIPE_W, rh = UI.RECIPE_H, cols = UI.RECIPE_COLS, gap = UI.RECIPE_GAP;
    const srx = px + UI.RECIPE_START_X, sry = py + UI.RECIPE_START_Y;
    const recipeAreaBottom = py + ph - UI.INV_BOTTOM_MARGIN;

    // Clip recipe area
    state.ctx.save();
    state.ctx.beginPath();
    state.ctx.rect(px, sry - 5, pw, recipeAreaBottom - sry + 5);
    state.ctx.clip();

    for (let i = 0; i < RECIPES.length; i++) {
        const recipe = RECIPES[i];
        const col = i % cols, row = Math.floor(i / cols);
        const rx = srx + col * (rw + gap), ry = sry + row * (rh + 6) - state.craftingScroll;
        if (ry + rh < sry - 5 || ry > recipeAreaBottom) continue;

        const can = canCraft(recipe);
        const hover = state.craftingHover === i;

        state.ctx.fillStyle = hover ? (can ? "rgba(74,222,128,0.25)" : "rgba(255,255,255,0.1)")
                               : (can ? "rgba(74,222,128,0.1)" : "rgba(255,255,255,0.05)");
        state.ctx.fillRect(rx, ry, rw, rh);
        state.ctx.strokeStyle = can ? "#4ade80" : "#555"; state.ctx.lineWidth = hover ? 2 : 1;
        state.ctx.strokeRect(rx, ry, rw, rh); state.ctx.lineWidth = 1;

        drawItemIcon(recipe.result, rx + 6, ry + 8, 36);

        state.ctx.fillStyle = can ? "#fff" : "#777"; state.ctx.font = "bold 14px 'Courier New', monospace"; state.ctx.textAlign = "left";
        const rName = (recipe.resultCount > 1 ? recipe.resultCount + "x " : "") + getItemName(recipe.result);
        state.ctx.fillText(rName, rx + 50, ry + 20);

        let ix = rx + 50;
        state.ctx.font = "11px 'Courier New', monospace";
        for (let j = 0; j < recipe.ingredients.length; j++) {
            const ing = recipe.ingredients[j];
            const have = countItem(ing.id) >= ing.count;
            if (j > 0) {
                state.ctx.fillStyle = "#777"; state.ctx.fillText(" + ", ix, ry + 38);
                ix += state.ctx.measureText(" + ").width;
            }
            state.ctx.fillStyle = have ? "#9ca3af" : "#ef4444";
            const label = `${ing.count} ${getItemName(ing.id)}`;
            state.ctx.fillText(label, ix, ry + 38);
            ix += state.ctx.measureText(label).width;
        }
    }

    state.ctx.restore();

    // Scroll indicator
    const totalRows = Math.ceil(RECIPES.length / cols);
    const maxScroll = Math.max(0, totalRows * 58 - (recipeAreaBottom - sry));
    if (maxScroll > 0) {
        const scrollPct = state.craftingScroll / maxScroll;
        const barH = recipeAreaBottom - sry;
        const thumbH = Math.max(20, barH * (barH / (totalRows * 58)));
        const thumbY = sry + scrollPct * (barH - thumbH);
        state.ctx.fillStyle = "rgba(255,255,255,0.15)";
        state.ctx.fillRect(px + pw - 12, sry, 6, barH);
        state.ctx.fillStyle = "rgba(74,222,128,0.5)";
        state.ctx.fillRect(px + pw - 12, thumbY, 6, thumbH);
    }

    // Inventory display at bottom
    const is = UI.SLOT_SIZE, ip = UI.SLOT_PAD;
    const itw = UI.INV_TOTAL_W;
    const isx = (state.canvas.width - itw) / 2 + UI.INV_OFFSET_X;

    state.ctx.fillStyle = "#9ca3af"; state.ctx.font = "bold 12px 'Courier New', monospace"; state.ctx.textAlign = "center";
    state.ctx.fillText("INVENTORY  (click to move items)", state.canvas.width / 2 + UI.INV_OFFSET_X, py + ph - 100);

    const hoverSlot = getInventorySlotAtMouse();

    for (let i = 0; i < HOTBAR_SIZE; i++) {
        drawInventorySlot(isx + i * (is + ip), py + ph + UI.HOTBAR_ROW_Y, is, state.inventory.slots[i], hoverSlot === i);
    }
    for (let i = 0; i < BACKPACK_SIZE; i++) {
        const c = i % UI.INV_COLS, r = Math.floor(i / UI.INV_COLS);
        drawInventorySlot(isx + c * (is + ip), py + ph + UI.BACKPACK_ROW_Y + r * (is + ip), is, state.inventory.slots[HOTBAR_SIZE + i], hoverSlot === HOTBAR_SIZE + i);
    }

    // Armor slots
    const armorX = isx + itw + UI.ARMOR_GAP;
    const armorY = py + ph + UI.HOTBAR_ROW_Y;
    const armorLabels = ["helmet", "chestplate", "leggings", "boots"];
    const armorIcons = ["H", "C", "L", "B"];
    state.ctx.fillStyle = "#9ca3af"; state.ctx.font = "bold 11px 'Courier New', monospace"; state.ctx.textAlign = "center";
    state.ctx.fillText("ARMOR", armorX + is / 2, armorY - 6);

    const hoverArmor = getArmorSlotAtMouse();
    for (let i = 0; i < 4; i++) {
        const ay = armorY + i * (is + ip);
        const slot = state.inventory.armor[armorLabels[i]];
        const highlighted = (hoverArmor === armorLabels[i]);
        state.ctx.fillStyle = highlighted ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.6)";
        state.ctx.fillRect(armorX, ay, is, is);
        state.ctx.strokeStyle = highlighted ? "#4ade80" : "#666";
        state.ctx.lineWidth = highlighted ? 3 : 1;
        state.ctx.strokeRect(armorX, ay, is, is);
        state.ctx.lineWidth = 1;

        if (slot.itemId !== 0) {
            drawItemIcon(slot.itemId, armorX + 6, ay + 6, is - 12);
            if (ITEM_INFO[slot.itemId] && ITEM_INFO[slot.itemId].durability) {
                const maxD = ITEM_INFO[slot.itemId].durability;
                const pct = slot.durability / maxD;
                state.ctx.fillStyle = "rgba(0,0,0,0.5)";
                state.ctx.fillRect(armorX + 4, ay + is - 7, is - 8, 4);
                state.ctx.fillStyle = pct > 0.5 ? "#4ade80" : pct > 0.25 ? "#fbbf24" : "#ef4444";
                state.ctx.fillRect(armorX + 4, ay + is - 7, (is - 8) * pct, 4);
            }
        } else {
            state.ctx.fillStyle = "rgba(255,255,255,0.15)"; state.ctx.font = "16px 'Courier New', monospace"; state.ctx.textAlign = "center";
            state.ctx.fillText(armorIcons[i], armorX + is / 2, ay + is / 2 + 6);
        }
    }

    // Offhand slot (below armor slots)
    const offhandX = armorX;
    const offhandY = armorY + 4 * (is + ip) + 8;
    const isOffhandHover = getOffhandSlotAtMouse();
    state.ctx.fillStyle = "#9ca3af"; state.ctx.font = "bold 11px 'Courier New', monospace"; state.ctx.textAlign = "center";
    state.ctx.fillText("OFF", offhandX + is / 2, offhandY - 6);
    state.ctx.fillStyle = isOffhandHover ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.6)";
    state.ctx.fillRect(offhandX, offhandY, is, is);
    state.ctx.strokeStyle = isOffhandHover ? "#4ade80" : "#666";
    state.ctx.lineWidth = isOffhandHover ? 3 : 1;
    state.ctx.strokeRect(offhandX, offhandY, is, is);
    state.ctx.lineWidth = 1;
    if (state.offhand.itemId !== 0) {
        drawItemIcon(state.offhand.itemId, offhandX + 6, offhandY + 6, is - 12);
        if (ITEM_INFO[state.offhand.itemId] && ITEM_INFO[state.offhand.itemId].durability) {
            const maxD = ITEM_INFO[state.offhand.itemId].durability;
            const pct = state.offhand.durability / maxD;
            state.ctx.fillStyle = "rgba(0,0,0,0.5)";
            state.ctx.fillRect(offhandX + 4, offhandY + is - 7, is - 8, 4);
            state.ctx.fillStyle = pct > 0.5 ? "#4ade80" : pct > 0.25 ? "#fbbf24" : "#ef4444";
            state.ctx.fillRect(offhandX + 4, offhandY + is - 7, (is - 8) * pct, 4);
        }
    } else {
        state.ctx.fillStyle = "rgba(255,255,255,0.15)"; state.ctx.font = "16px 'Courier New', monospace"; state.ctx.textAlign = "center";
        state.ctx.fillText("O", offhandX + is / 2, offhandY + is / 2 + 6);
    }

    state.ctx.restore();
    // Cursor item — drawn in screen space after scale is removed
    if (state.cursorItem.itemId !== 0 && state.cursorItem.count > 0) {
        const cs = 32;
        drawItemIcon(state.cursorItem.itemId, state.mouse.x - cs / 2, state.mouse.y - cs / 2, cs);
        if (state.cursorItem.count > 1) {
            state.ctx.fillStyle = "#fff"; state.ctx.font = "bold 14px 'Courier New', monospace"; state.ctx.textAlign = "right";
            state.ctx.fillText(state.cursorItem.count.toString(), state.mouse.x + cs / 2, state.mouse.y + cs / 2);
        }
    }
}

// --- CHEST MENU ---
export function drawChestMenu() {
    if (!state.chestOpen || !state.chestPos) return;

    const key = `${state.chestPos.x},${state.chestPos.y}`;
    if (!state.chestData[key]) return;

    state.ctx.fillStyle = "rgba(0,0,0,0.75)";
    state.ctx.fillRect(0, 0, state.canvas.width, state.canvas.height);

    const pw = UI.CHEST_PANEL_W, ph = UI.CHEST_PANEL_H;
    const px = (state.canvas.width - pw) / 2, py = (state.canvas.height - ph) / 2;
    state.ctx.save();
    applyPanelScale(pw, ph);
    state.ctx.fillStyle = "#2a2a3e"; state.ctx.fillRect(px, py, pw, ph);
    state.ctx.strokeStyle = "#c4a047"; state.ctx.lineWidth = 3; state.ctx.strokeRect(px, py, pw, ph); state.ctx.lineWidth = 1;

    state.ctx.fillStyle = "#c4a047"; state.ctx.font = "bold 24px 'Courier New', monospace"; state.ctx.textAlign = "center";
    state.ctx.fillText("CHEST", state.canvas.width / 2, py + 35);
    state.ctx.fillStyle = "#9ca3af"; state.ctx.font = "12px 'Courier New', monospace";
    state.ctx.fillText("Click to move items!  Press F/E/Escape to close", state.canvas.width / 2, py + 55);

    // Chest slots (9 in a row)
    const is = UI.SLOT_SIZE, ip = UI.SLOT_PAD;
    const chestCols = UI.CHEST_SLOT_COLS;
    const chestTotalW = chestCols * (is + ip) - ip;
    const csx = (state.canvas.width - chestTotalW) / 2;
    const csy = py + UI.CHEST_SLOT_START_Y;

    state.ctx.fillStyle = "#9ca3af"; state.ctx.font = "bold 12px 'Courier New', monospace"; state.ctx.textAlign = "center";
    state.ctx.fillText("CHEST CONTENTS", state.canvas.width / 2, csy - 8);

    const hoverChestSlot = getChestSlotAtMouse();
    for (let i = 0; i < 9; i++) {
        const sx = csx + i * (is + ip);
        drawInventorySlot(sx, csy, is, state.chestData[key][i], hoverChestSlot === i);
    }

    // Separator
    const sepY = csy + is + 20;
    state.ctx.strokeStyle = "rgba(255,255,255,0.1)"; state.ctx.beginPath();
    state.ctx.moveTo(px + 20, sepY); state.ctx.lineTo(px + pw - 20, sepY); state.ctx.stroke();

    // Player inventory
    state.ctx.fillStyle = "#9ca3af"; state.ctx.font = "bold 12px 'Courier New', monospace"; state.ctx.textAlign = "center";
    state.ctx.fillText("YOUR INVENTORY", state.canvas.width / 2, sepY + 18);

    const itw = UI.INV_TOTAL_W;
    const isx = (state.canvas.width - itw) / 2;
    const hoverInvSlot = getChestInventorySlotAtMouse();

    // Hotbar
    const hotbarY = py + ph - 100;
    for (let i = 0; i < HOTBAR_SIZE; i++) {
        drawInventorySlot(isx + i * (is + ip), hotbarY, is, state.inventory.slots[i], hoverInvSlot === i);
    }

    // Backpack
    const bpY = hotbarY + is + ip + 4;
    for (let i = 0; i < BACKPACK_SIZE; i++) {
        const c = i % UI.INV_COLS, r = Math.floor(i / UI.INV_COLS);
        drawInventorySlot(isx + c * (is + ip), bpY + r * (is + ip), is, state.inventory.slots[HOTBAR_SIZE + i], hoverInvSlot === HOTBAR_SIZE + i);
    }

    state.ctx.restore();
    // Cursor item — drawn in screen space after scale is removed
    if (state.cursorItem.itemId !== 0 && state.cursorItem.count > 0) {
        const cs = 32;
        drawItemIcon(state.cursorItem.itemId, state.mouse.x - cs / 2, state.mouse.y - cs / 2, cs);
        if (state.cursorItem.count > 1) {
            state.ctx.fillStyle = "#fff"; state.ctx.font = "bold 14px 'Courier New', monospace"; state.ctx.textAlign = "right";
            state.ctx.fillText(state.cursorItem.count.toString(), state.mouse.x + cs / 2, state.mouse.y + cs / 2);
        }
    }
}

// --- FURNACE MENU ---
export function drawFurnaceMenu() {
    if (!state.furnaceOpen || !state.furnacePos) return;
    const key = `${state.furnacePos.x},${state.furnacePos.y}`;
    const f = state.furnaceData[key];
    if (!f) return;

    state.ctx.fillStyle = "rgba(0,0,0,0.75)";
    state.ctx.fillRect(0, 0, state.canvas.width, state.canvas.height);

    const is = UI.SLOT_SIZE, ip = UI.SLOT_PAD;
    const invCols = UI.INV_COLS;
    const invTotalW = UI.INV_TOTAL_W;
    const pw = Math.max(460, invTotalW + 40), ph = 530;
    const px = (state.canvas.width - pw) / 2, py = (state.canvas.height - ph) / 2;
    state.ctx.save();
    applyPanelScale(pw, ph);

    // Panel
    state.ctx.fillStyle = "#1e1e2e"; state.ctx.fillRect(px, py, pw, ph);
    state.ctx.strokeStyle = "#888"; state.ctx.lineWidth = 3; state.ctx.strokeRect(px, py, pw, ph); state.ctx.lineWidth = 1;

    // Title
    state.ctx.fillStyle = "#e0c080"; state.ctx.font = "bold 22px 'Courier New', monospace"; state.ctx.textAlign = "center";
    state.ctx.fillText("FURNACE", state.canvas.width / 2, py + 34);
    state.ctx.fillStyle = "#6b7280"; state.ctx.font = "11px 'Courier New', monospace";
    state.ctx.fillText("Click slots to move items  |  Press E / Escape to close", state.canvas.width / 2, py + 52);

    const slotSize = 52;
    const midX = state.canvas.width / 2;
    const slotY = py + 78;

    // Input slot
    const inputX = midX - 130 - slotSize / 2;
    state.ctx.strokeStyle = "#888"; state.ctx.lineWidth = 2;
    state.ctx.fillStyle = "#2a2a3a"; state.ctx.fillRect(inputX, slotY, slotSize, slotSize);
    state.ctx.strokeRect(inputX, slotY, slotSize, slotSize); state.ctx.lineWidth = 1;
    if (f.inputSlot.itemId) {
        drawItemIcon(f.inputSlot.itemId, inputX + 2, slotY + 2, slotSize - 4);
        state.ctx.fillStyle = "#fff"; state.ctx.font = "bold 12px 'Courier New', monospace"; state.ctx.textAlign = "right";
        state.ctx.fillText(f.inputSlot.count, inputX + slotSize - 3, slotY + slotSize - 3);
    } else {
        state.ctx.fillStyle = "#555"; state.ctx.font = "10px 'Courier New', monospace"; state.ctx.textAlign = "center";
        state.ctx.fillText("ORE", inputX + slotSize / 2, slotY + slotSize / 2 + 4);
    }

    // Progress arrow
    const recipe = FURNACE_RECIPES.find(r => r.input === f.inputSlot.itemId);
    const isSmelting = f.fuelLeft > 0 && recipe && f.inputSlot.count > 0;
    const progress = recipe ? f.progress / recipe.smeltTime : 0;
    state.ctx.fillStyle = "#333"; state.ctx.fillRect(midX - 28, slotY + 16, 56, 20);
    state.ctx.fillStyle = isSmelting ? "#e0a030" : "#555";
    state.ctx.fillRect(midX - 28, slotY + 16, Math.round(56 * Math.min(progress, 1)), 20);
    state.ctx.fillStyle = "#fff"; state.ctx.font = "bold 16px 'Courier New', monospace"; state.ctx.textAlign = "center";
    state.ctx.fillText("→", midX, slotY + 31);

    // Output slot
    const outputX = midX + 130 - slotSize / 2;
    state.ctx.strokeStyle = "#888"; state.ctx.lineWidth = 2;
    state.ctx.fillStyle = "#2a2a3a"; state.ctx.fillRect(outputX, slotY, slotSize, slotSize);
    state.ctx.strokeRect(outputX, slotY, slotSize, slotSize); state.ctx.lineWidth = 1;
    if (f.outputSlot.itemId) {
        drawItemIcon(f.outputSlot.itemId, outputX + 2, slotY + 2, slotSize - 4);
        state.ctx.fillStyle = "#fff"; state.ctx.font = "bold 12px 'Courier New', monospace"; state.ctx.textAlign = "right";
        state.ctx.fillText(f.outputSlot.count, outputX + slotSize - 3, slotY + slotSize - 3);
    } else {
        state.ctx.fillStyle = "#555"; state.ctx.font = "10px 'Courier New', monospace"; state.ctx.textAlign = "center";
        state.ctx.fillText("OUT", outputX + slotSize / 2, slotY + slotSize / 2 + 4);
    }

    // Labels
    state.ctx.fillStyle = "#9ca3af"; state.ctx.font = "11px 'Courier New', monospace"; state.ctx.textAlign = "center";
    state.ctx.fillText("Input", inputX + slotSize / 2, slotY + slotSize + 14);
    state.ctx.fillText("Output", outputX + slotSize / 2, slotY + slotSize + 14);

    // Fuel slot
    const fuelSlotX = inputX;
    const fuelSlotY = slotY + slotSize + 30;
    state.ctx.strokeStyle = "#e0a030"; state.ctx.lineWidth = 2;
    state.ctx.fillStyle = "#2a2a2a"; state.ctx.fillRect(fuelSlotX, fuelSlotY, slotSize, slotSize);
    state.ctx.strokeRect(fuelSlotX, fuelSlotY, slotSize, slotSize); state.ctx.lineWidth = 1;
    if (f.fuelSlot.itemId) {
        drawItemIcon(f.fuelSlot.itemId, fuelSlotX + 2, fuelSlotY + 2, slotSize - 4);
        state.ctx.fillStyle = "#fff"; state.ctx.font = "bold 12px 'Courier New', monospace"; state.ctx.textAlign = "right";
        state.ctx.fillText(f.fuelSlot.count, fuelSlotX + slotSize - 3, fuelSlotY + slotSize - 3);
    } else {
        state.ctx.fillStyle = "#e0a030"; state.ctx.font = "10px 'Courier New', monospace"; state.ctx.textAlign = "center";
        state.ctx.fillText("FUEL", fuelSlotX + slotSize / 2, fuelSlotY + slotSize / 2 + 4);
    }
    state.ctx.fillStyle = "#9ca3af"; state.ctx.font = "11px 'Courier New', monospace"; state.ctx.textAlign = "center";
    state.ctx.fillText("Fuel (Coal)", fuelSlotX + slotSize / 2, fuelSlotY + slotSize + 14);

    // Fuel burn bar
    const fuelPct = f.maxFuel > 0 ? f.fuelLeft / f.maxFuel : 0;
    state.ctx.fillStyle = "#333"; state.ctx.fillRect(fuelSlotX + slotSize + 8, fuelSlotY, 80, 14);
    state.ctx.fillStyle = f.fuelLeft > 0 ? "#ff6a00" : "#444";
    state.ctx.fillRect(fuelSlotX + slotSize + 8, fuelSlotY, Math.round(80 * fuelPct), 14);
    state.ctx.fillStyle = "#9ca3af"; state.ctx.font = "10px 'Courier New', monospace"; state.ctx.textAlign = "left";
    state.ctx.fillText("Fuel", fuelSlotX + slotSize + 8, fuelSlotY + 26);

    // ── INVENTORY ────────────────────────────────────────────────────
    const sepY = fuelSlotY + slotSize + 20;
    state.ctx.strokeStyle = "rgba(255,255,255,0.1)"; state.ctx.lineWidth = 1;
    state.ctx.beginPath(); state.ctx.moveTo(px + 16, sepY); state.ctx.lineTo(px + pw - 16, sepY); state.ctx.stroke();

    state.ctx.fillStyle = "#9ca3af"; state.ctx.font = "bold 11px 'Courier New', monospace"; state.ctx.textAlign = "center";
    state.ctx.fillText("YOUR INVENTORY", state.canvas.width / 2, sepY + 14);

    const isx = (state.canvas.width - invTotalW) / 2;
    const hotbarY = sepY + 22;

    // Hover detection uses scaled mouse
    const { x: smx, y: smy } = (() => {
        const s = Math.min(1, (state.canvas.width - 8) / pw, (state.canvas.height - 8) / ph);
        if (s >= 1) return { x: state.mouse.x, y: state.mouse.y };
        const cx2 = state.canvas.width / 2, cy2 = state.canvas.height / 2;
        return { x: (state.mouse.x - cx2 * (1 - s)) / s, y: (state.mouse.y - cy2 * (1 - s)) / s };
    })();

    // Hotbar row
    for (let i = 0; i < HOTBAR_SIZE; i++) {
        const sx2 = isx + i * (is + ip);
        const hover = smx >= sx2 && smx <= sx2 + is && smy >= hotbarY && smy <= hotbarY + is;
        drawInventorySlot(sx2, hotbarY, is, state.inventory.slots[i], hover, i);
    }
    // Backpack rows
    const bpY = hotbarY + is + ip + 4;
    for (let i = 0; i < BACKPACK_SIZE; i++) {
        const c = i % invCols, r = Math.floor(i / invCols);
        const sx2 = isx + c * (is + ip), sy2 = bpY + r * (is + ip);
        const hover = smx >= sx2 && smx <= sx2 + is && smy >= sy2 && smy <= sy2 + is;
        drawInventorySlot(sx2, sy2, is, state.inventory.slots[HOTBAR_SIZE + i], hover, HOTBAR_SIZE + i);
    }

    // Store slot rects for click detection
    state.furnaceSlotRects = {
        inputX, inputY: slotY, outputX, outputY: slotY,
        fuelX: fuelSlotX, fuelY: fuelSlotY, slotSize,
        isx, hotbarY, bpY, is, ip,
    };

    state.ctx.restore();
}

// --- SMOKER MENU ---
export function drawSmokerMenu() {
    if (!state.smokerOpen || !state.smokerPos) return;
    const key = `${state.smokerPos.x},${state.smokerPos.y}`;
    const f = state.smokerData[key];
    if (!f) return;

    state.ctx.fillStyle = "rgba(0,0,0,0.75)";
    state.ctx.fillRect(0, 0, state.canvas.width, state.canvas.height);

    const is = UI.SLOT_SIZE, ip = UI.SLOT_PAD;
    const invCols = UI.INV_COLS;
    const invTotalW = UI.INV_TOTAL_W;
    const pw = Math.max(460, invTotalW + 40), ph = 530;
    const px = (state.canvas.width - pw) / 2, py = (state.canvas.height - ph) / 2;
    state.ctx.save();
    applyPanelScale(pw, ph);

    state.ctx.fillStyle = "#1a2a1a"; state.ctx.fillRect(px, py, pw, ph);
    state.ctx.strokeStyle = "#6a8a6a"; state.ctx.lineWidth = 3; state.ctx.strokeRect(px, py, pw, ph); state.ctx.lineWidth = 1;

    state.ctx.fillStyle = "#80c080"; state.ctx.font = "bold 22px 'Courier New', monospace"; state.ctx.textAlign = "center";
    state.ctx.fillText("SMOKER", state.canvas.width / 2, py + 34);
    state.ctx.fillStyle = "#6b7280"; state.ctx.font = "11px 'Courier New', monospace";
    state.ctx.fillText("Cook raw meat with wood or coal as fuel  |  Press E to close", state.canvas.width / 2, py + 52);

    const slotSize = 52;
    const midX = state.canvas.width / 2;
    const slotY = py + 78;

    // Input slot
    const inputX = midX - 130 - slotSize / 2;
    state.ctx.strokeStyle = "#6a8a6a"; state.ctx.lineWidth = 2;
    state.ctx.fillStyle = "#1e2e1e"; state.ctx.fillRect(inputX, slotY, slotSize, slotSize);
    state.ctx.strokeRect(inputX, slotY, slotSize, slotSize); state.ctx.lineWidth = 1;
    if (f.inputSlot.itemId) {
        drawItemIcon(f.inputSlot.itemId, inputX + 2, slotY + 2, slotSize - 4);
        state.ctx.fillStyle = "#fff"; state.ctx.font = "bold 12px 'Courier New', monospace"; state.ctx.textAlign = "right";
        state.ctx.fillText(f.inputSlot.count, inputX + slotSize - 3, slotY + slotSize - 3);
    } else {
        state.ctx.fillStyle = "#555"; state.ctx.font = "10px 'Courier New', monospace"; state.ctx.textAlign = "center";
        state.ctx.fillText("RAW", inputX + slotSize / 2, slotY + slotSize / 2 + 4);
    }

    // Progress arrow
    const recipe = FOOD_RECIPES.find(r => r.input === f.inputSlot.itemId);
    const isCooking = f.fuelLeft > 0 && recipe && f.inputSlot.count > 0;
    const progress = recipe ? f.progress / recipe.cookTime : 0;
    state.ctx.fillStyle = "#333"; state.ctx.fillRect(midX - 28, slotY + 16, 56, 20);
    state.ctx.fillStyle = isCooking ? "#60c060" : "#555";
    state.ctx.fillRect(midX - 28, slotY + 16, Math.round(56 * Math.min(progress, 1)), 20);
    state.ctx.fillStyle = "#fff"; state.ctx.font = "bold 16px 'Courier New', monospace"; state.ctx.textAlign = "center";
    state.ctx.fillText("→", midX, slotY + 31);

    // Output slot
    const outputX = midX + 130 - slotSize / 2;
    state.ctx.strokeStyle = "#6a8a6a"; state.ctx.lineWidth = 2;
    state.ctx.fillStyle = "#1e2e1e"; state.ctx.fillRect(outputX, slotY, slotSize, slotSize);
    state.ctx.strokeRect(outputX, slotY, slotSize, slotSize); state.ctx.lineWidth = 1;
    if (f.outputSlot.itemId) {
        drawItemIcon(f.outputSlot.itemId, outputX + 2, slotY + 2, slotSize - 4);
        state.ctx.fillStyle = "#fff"; state.ctx.font = "bold 12px 'Courier New', monospace"; state.ctx.textAlign = "right";
        state.ctx.fillText(f.outputSlot.count, outputX + slotSize - 3, slotY + slotSize - 3);
    } else {
        state.ctx.fillStyle = "#555"; state.ctx.font = "10px 'Courier New', monospace"; state.ctx.textAlign = "center";
        state.ctx.fillText("OUT", outputX + slotSize / 2, slotY + slotSize / 2 + 4);
    }

    // Fuel slot
    const fuelSlotX = midX - slotSize / 2;
    const fuelSlotY = slotY + slotSize + 18;
    state.ctx.strokeStyle = "#6a8a6a"; state.ctx.lineWidth = 2;
    state.ctx.fillStyle = "#1e2e1e"; state.ctx.fillRect(fuelSlotX, fuelSlotY, slotSize, slotSize);
    state.ctx.strokeRect(fuelSlotX, fuelSlotY, slotSize, slotSize); state.ctx.lineWidth = 1;
    if (f.fuelSlot.itemId) {
        drawItemIcon(f.fuelSlot.itemId, fuelSlotX + 2, fuelSlotY + 2, slotSize - 4);
        state.ctx.fillStyle = "#fff"; state.ctx.font = "bold 12px 'Courier New', monospace"; state.ctx.textAlign = "right";
        state.ctx.fillText(f.fuelSlot.count, fuelSlotX + slotSize - 3, fuelSlotY + slotSize - 3);
    } else {
        state.ctx.fillStyle = "#555"; state.ctx.font = "10px 'Courier New', monospace"; state.ctx.textAlign = "center";
        state.ctx.fillText("FUEL", fuelSlotX + slotSize / 2, fuelSlotY + slotSize / 2 + 4);
    }
    // Fuel bar
    const fuelPct = f.maxFuel > 0 ? f.fuelLeft / f.maxFuel : 0;
    state.ctx.fillStyle = "#333"; state.ctx.fillRect(fuelSlotX + slotSize + 8, fuelSlotY, 80, 14);
    state.ctx.fillStyle = f.fuelLeft > 0 ? "#60c060" : "#444";
    state.ctx.fillRect(fuelSlotX + slotSize + 8, fuelSlotY, Math.round(80 * fuelPct), 14);
    state.ctx.fillStyle = "#9ca3af"; state.ctx.font = "10px 'Courier New', monospace"; state.ctx.textAlign = "left";
    state.ctx.fillText("Fuel", fuelSlotX + slotSize + 8, fuelSlotY + 26);

    // Inventory
    const sepY = fuelSlotY + slotSize + 20;
    state.ctx.strokeStyle = "rgba(255,255,255,0.1)"; state.ctx.lineWidth = 1;
    state.ctx.beginPath(); state.ctx.moveTo(px + 16, sepY); state.ctx.lineTo(px + pw - 16, sepY); state.ctx.stroke();
    state.ctx.fillStyle = "#9ca3af"; state.ctx.font = "bold 11px 'Courier New', monospace"; state.ctx.textAlign = "center";
    state.ctx.fillText("YOUR INVENTORY", state.canvas.width / 2, sepY + 14);

    const isx = (state.canvas.width - invTotalW) / 2;
    const hotbarY = sepY + 22;
    const { x: smx, y: smy } = (() => {
        const s = Math.min(1, (state.canvas.width - 8) / pw, (state.canvas.height - 8) / ph);
        if (s >= 1) return { x: state.mouse.x, y: state.mouse.y };
        const cx2 = state.canvas.width / 2, cy2 = state.canvas.height / 2;
        return { x: (state.mouse.x - cx2 * (1 - s)) / s, y: (state.mouse.y - cy2 * (1 - s)) / s };
    })();

    for (let i = 0; i < HOTBAR_SIZE; i++) {
        const sx2 = isx + i * (is + ip);
        const hover = smx >= sx2 && smx <= sx2 + is && smy >= hotbarY && smy <= hotbarY + is;
        drawInventorySlot(sx2, hotbarY, is, state.inventory.slots[i], hover, i);
    }
    const bpY = hotbarY + is + ip + 4;
    for (let i = 0; i < BACKPACK_SIZE; i++) {
        const c = i % invCols, r = Math.floor(i / invCols);
        const sx2 = isx + c * (is + ip), sy2 = bpY + r * (is + ip);
        const hover = smx >= sx2 && smx <= sx2 + is && smy >= sy2 && smy <= sy2 + is;
        drawInventorySlot(sx2, sy2, is, state.inventory.slots[HOTBAR_SIZE + i], hover, HOTBAR_SIZE + i);
    }

    state.smokerSlotRects = {
        inputX, inputY: slotY, outputX, outputY: slotY,
        fuelX: fuelSlotX, fuelY: fuelSlotY, slotSize,
        isx, hotbarY, bpY, is, ip,
    };

    state.ctx.restore();
}

// --- BLAST FURNACE MENU ---
export function drawBlastFurnaceMenu() {
    if (!state.blastFurnaceOpen) return;

    state.ctx.fillStyle = "rgba(0,0,0,0.75)";
    state.ctx.fillRect(0, 0, state.canvas.width, state.canvas.height);

    const pw = 500, ph = 380;
    const px = (state.canvas.width - pw) / 2, py = (state.canvas.height - ph) / 2;
    state.ctx.save();
    applyPanelScale(pw, ph);
    state.ctx.fillStyle = "#2a2a3e"; state.ctx.fillRect(px, py, pw, ph);
    state.ctx.strokeStyle = "#c86000"; state.ctx.lineWidth = 3; state.ctx.strokeRect(px, py, pw, ph); state.ctx.lineWidth = 1;

    state.ctx.fillStyle = "#c86000"; state.ctx.font = "bold 24px 'Courier New', monospace"; state.ctx.textAlign = "center";
    state.ctx.fillText("BLAST FURNACE", state.canvas.width / 2, py + 35);
    state.ctx.fillStyle = "#9ca3af"; state.ctx.font = "12px 'Courier New', monospace";
    state.ctx.fillText("Click a recipe to smelt!  Press F/E/Escape to close", state.canvas.width / 2, py + 55);

    const rowH = 56, margin = 24;
    const startY = py + 72;

    for (let i = 0; i < SMELTING_RECIPES.length; i++) {
        const recipe = SMELTING_RECIPES[i];
        const ry = startY + i * rowH;
        const haveCount = countItem(recipe.input);
        const canSmelt = haveCount >= 1;
        const hover = state.blastFurnaceHover === i;

        state.ctx.fillStyle = hover ? (canSmelt ? "rgba(200,96,0,0.3)" : "rgba(255,255,255,0.1)")
                               : (canSmelt ? "rgba(200,96,0,0.12)" : "rgba(255,255,255,0.04)");
        state.ctx.fillRect(px + margin, ry, pw - margin * 2, rowH - 6);
        state.ctx.strokeStyle = canSmelt ? "#c86000" : "#555"; state.ctx.lineWidth = hover ? 2 : 1;
        state.ctx.strokeRect(px + margin, ry, pw - margin * 2, rowH - 6); state.ctx.lineWidth = 1;

        // Input icon
        drawItemIcon(recipe.input, px + margin + 10, ry + 6, 36);
        state.ctx.fillStyle = canSmelt ? "#fff" : "#666";
        state.ctx.font = "bold 13px 'Courier New', monospace"; state.ctx.textAlign = "left";
        state.ctx.fillText(getItemName(recipe.input) + " x" + haveCount, px + margin + 52, ry + 20);

        // Arrow
        state.ctx.fillStyle = canSmelt ? "#c86000" : "#555";
        state.ctx.font = "bold 22px 'Courier New', monospace"; state.ctx.textAlign = "center";
        state.ctx.fillText("\u2192", state.canvas.width / 2, ry + 26);

        // Output icon (right half of panel)
        const outX = px + pw / 2 + 30;
        drawItemIcon(recipe.output, outX, ry + 6, 36);
        state.ctx.fillStyle = canSmelt ? "#fff" : "#666";
        state.ctx.font = "bold 13px 'Courier New', monospace"; state.ctx.textAlign = "left";
        state.ctx.fillText(getItemName(recipe.output) + " x" + recipe.outputCount, outX + 42, ry + 20);
    }
    state.ctx.restore();
}

// --- TRADING MENU ---
export function drawTradingMenu() {
    if (!state.tradingOpen) return;

    state.ctx.fillStyle = "rgba(0,0,0,0.75)";
    state.ctx.fillRect(0, 0, state.canvas.width, state.canvas.height);

    const pw = UI.TRADING_PANEL_W, ph = UI.TRADING_PANEL_H;
    const px = (state.canvas.width - pw) / 2, py = (state.canvas.height - ph) / 2;
    state.ctx.save();
    applyPanelScale(pw, ph);
    state.ctx.fillStyle = "#2a2a3e"; state.ctx.fillRect(px, py, pw, ph);
    state.ctx.strokeStyle = "#ffd700"; state.ctx.lineWidth = 3; state.ctx.strokeRect(px, py, pw, ph); state.ctx.lineWidth = 1;

    const professionLabel = (state.tradingVillager && state.tradingVillager.profession)
        ? state.tradingVillager.profession.charAt(0).toUpperCase() + state.tradingVillager.profession.slice(1)
        : "Villager";
    state.ctx.fillStyle = "#ffd700"; state.ctx.font = "bold 24px 'Courier New', monospace"; state.ctx.textAlign = "center";
    state.ctx.fillText(professionLabel + " Trading", state.canvas.width / 2, py + 35);
    state.ctx.fillStyle = "#9ca3af"; state.ctx.font = "12px 'Courier New', monospace";
    state.ctx.fillText("Click to trade!  Press F or Escape to close", state.canvas.width / 2, py + 55);

    const emeraldCount = countItem(BLOCKS.EMERALD);
    state.ctx.fillStyle = "#2dd84a"; state.ctx.font = "bold 14px 'Courier New', monospace"; state.ctx.textAlign = "center";
    state.ctx.fillText("Your Emeralds: " + emeraldCount, state.canvas.width / 2, py + 78);

    const activeTrades = (state.tradingVillager && state.tradingVillager.tradeList) || TRADES;
    const startY = py + UI.TRADE_START_Y;
    const rowH = UI.TRADE_ROW_H;
    const margin = UI.TRADE_MARGIN;

    for (let i = 0; i < activeTrades.length; i++) {
        const trade = activeTrades[i];
        const ry = startY + i * rowH;
        if (ry + rowH > py + ph - 10) break;

        const canAfford = emeraldCount >= trade.cost;
        const hover = state.tradingHover === i;

        state.ctx.fillStyle = hover ? (canAfford ? "rgba(74,222,128,0.25)" : "rgba(255,255,255,0.1)")
                               : (canAfford ? "rgba(74,222,128,0.1)" : "rgba(255,255,255,0.05)");
        state.ctx.fillRect(px + margin, ry, pw - margin * 2, rowH - 4);
        state.ctx.strokeStyle = canAfford ? "#4ade80" : "#555"; state.ctx.lineWidth = hover ? 2 : 1;
        state.ctx.strokeRect(px + margin, ry, pw - margin * 2, rowH - 4); state.ctx.lineWidth = 1;

        // Emerald cost
        drawItemIcon(BLOCKS.EMERALD, px + margin + 10, ry + 6, 28);
        state.ctx.fillStyle = canAfford ? "#2dd84a" : "#777";
        state.ctx.font = "bold 16px 'Courier New', monospace"; state.ctx.textAlign = "left";
        state.ctx.fillText("x" + trade.cost, px + margin + 43, ry + 27);

        // Arrow
        state.ctx.fillStyle = "#9ca3af"; state.ctx.font = "bold 20px 'Courier New', monospace"; state.ctx.textAlign = "center";
        state.ctx.fillText("\u2192", px + pw / 2 - 30, ry + 28);

        // Result
        drawItemIcon(trade.result, px + pw / 2, ry + 6, 28);
        state.ctx.fillStyle = canAfford ? "#fff" : "#777";
        state.ctx.font = "bold 14px 'Courier New', monospace"; state.ctx.textAlign = "left";
        const resultName = (trade.resultCount > 1 ? trade.resultCount + "x " : "") + getItemName(trade.result);
        state.ctx.fillText(resultName, px + pw / 2 + 34, ry + 27);
    }
    state.ctx.restore();
}

// --- DEATH SCREEN ---
export function drawDeathScreen() {
    if (!state.gameOver) return;
    state.ctx.fillStyle = "rgba(150, 0, 0, 0.5)";
    state.ctx.fillRect(0, 0, state.canvas.width, state.canvas.height);
    state.ctx.fillStyle = "#ff2222"; state.ctx.font = "bold 48px 'Courier New', monospace"; state.ctx.textAlign = "center";
    state.ctx.fillText("YOU DIED!", state.canvas.width / 2, state.canvas.height / 2 - 20);
    state.ctx.fillStyle = "#ffffff"; state.ctx.font = "20px 'Courier New', monospace";
    state.ctx.fillText("Press R to Respawn", state.canvas.width / 2, state.canvas.height / 2 + 30);
}

// --- HUD ---
export function drawHUD() {
    // Boss health bar at top of screen
    const boss = state.mobs.find(m => m.type === "orium" || m.type === "gasly" || m.type === "possum_king" || m.type === "void_god");
    if (boss) {
        const def = MOB_DEFS[boss.type];
        const barW = 400, barH = 16;
        const bx = (state.canvas.width - barW) / 2;
        const by = 12;
        state.ctx.fillStyle = "rgba(0,0,0,0.75)";
        state.ctx.fillRect(bx - 2, by - 2, barW + 4, barH + 4);
        const pct = boss.health / def.maxHealth;
        const col = pct > 0.5 ? "#ffd700" : pct > 0.25 ? "#ff8800" : "#ff2222";
        state.ctx.fillStyle = col;
        state.ctx.fillRect(bx, by, barW * pct, barH);
        state.ctx.fillStyle = "#fff";
        state.ctx.font = "bold 12px 'Courier New', monospace";
        state.ctx.textAlign = "center";
        state.ctx.fillText(def.name, state.canvas.width / 2, by + 13);
        state.ctx.textAlign = "left";
    }

    if (!state.craftingOpen && !state.tradingOpen && !state.chestOpen && !state.gameOver) {
        const wmx = Math.floor((state.mouse.x + state.camera.x) / BLOCK_SIZE);
        const wmy = Math.floor((state.mouse.y + state.camera.y) / BLOCK_SIZE);
        if (wmx >= 0 && wmx < WORLD_WIDTH && wmy >= 0 && wmy < WORLD_HEIGHT) {
            const b = state.activeWorld[wmx][wmy];
            if (b !== BLOCKS.AIR) {
                const info = BLOCK_INFO[b];
                let tip = info.name;
                if (b === BLOCKS.CHEST) tip += " (F to open)";
                if (b === BLOCKS.DOOR_CLOSED) tip += " (F to open)";
                if (b === BLOCKS.DOOR_OPEN) tip += " (F to close)";
                if (b === BLOCKS.OBSIDIAN) tip += " (needs Diamond pickaxe)";
                if (b === BLOCKS.PRESSURE_PLATE) tip += " (activates nearby doors)";
                if (b === BLOCKS.ORIUM_SHRINE) tip += " (F to sacrifice 5 diamonds)";
                if (b === BLOCKS.GASLY_SHRINE) tip += " (F to challenge the Prince)";
                if (b === BLOCKS.POSSUM_KING_SHRINE) tip += " (F to sacrifice Possum Core)";
                if (b === BLOCKS.VOID_GOD_SHRINE) tip += " (F to sacrifice 5 Void Stone)";
                if (info.minTier > 0 && info.minTier < 99 && b !== BLOCKS.OBSIDIAN) {
                    tip += ` (needs ${["Hand","Wood","Stone","Iron","Diamond","Silver","Netherite","","Rock Candy"][info.minTier] || "Special"} pickaxe)`;
                }
                state.ctx.font = "13px 'Courier New', monospace"; state.ctx.textAlign = "left";
                const tw = state.ctx.measureText(tip).width;
                state.ctx.fillStyle = "rgba(0,0,0,0.7)";
                state.ctx.fillRect(state.mouse.x + 10, state.mouse.y - 22, tw + 12, 24);
                state.ctx.fillStyle = "#fff";
                state.ctx.fillText(tip, state.mouse.x + 16, state.mouse.y - 5);
            }
        }
    }

    state.ctx.fillStyle = "rgba(0,0,0,0.5)"; state.ctx.fillRect(state.canvas.width - 150, 5, 145, 22);
    state.ctx.fillStyle = "#fff"; state.ctx.font = "12px 'Courier New', monospace"; state.ctx.textAlign = "right";
    state.ctx.fillText(`X: ${Math.floor(state.player.x / BLOCK_SIZE)} Y: ${Math.floor(state.player.y / BLOCK_SIZE)}`, state.canvas.width - 10, 20);

    if (!state.craftingOpen && !state.tradingOpen && !state.chestOpen) {
        state.ctx.fillStyle = "rgba(0,0,0,0.4)"; state.ctx.fillRect(state.canvas.width - 150, 30, 145, 20);
        state.ctx.fillStyle = "#4ade80"; state.ctx.font = "11px 'Courier New', monospace";
        state.ctx.fillText("Press E to craft!", state.canvas.width - 10, 44);
    }

    state.ctx.fillStyle = "rgba(0,0,0,0.4)"; state.ctx.fillRect(state.canvas.width - 150, 53, 145, 20);
    state.ctx.fillStyle = "#9ca3af"; state.ctx.font = "11px 'Courier New', monospace";
    state.ctx.fillText(`Mobs: ${state.mobs.length}`, state.canvas.width - 10, 67);

    // Stacked status indicators
    let statusY = 76;
    const drawStatus = (bg, textColor, label) => {
        state.ctx.fillStyle = bg; state.ctx.fillRect(state.canvas.width - 150, statusY, 145, 20);
        state.ctx.fillStyle = textColor; state.ctx.font = "bold 11px 'Courier New', monospace"; state.ctx.textAlign = "right";
        state.ctx.fillText(label, state.canvas.width - 10, statusY + 14);
        statusY += 23;
    };
    if (state.player.candyBuffTimer > 0) {
        const buffLabels = { speed: "★ Speed Rush", jump: "★ Jump Boost", strength: "★ Strength", regen: "★ Regen" };
        const label = buffLabels[state.player.candyBuffType] || "★ Candy Buff";
        drawStatus("rgba(180,20,160,0.7)", "#ffaaff", `${label} ${Math.ceil(state.player.candyBuffTimer / 1000)}s`);
    } else if (state.player.sugarCrashTimer > 0)
        drawStatus("rgba(80,40,100,0.7)", "#cc88ff", `▼ Sugar Crash ${Math.ceil(state.player.sugarCrashTimer / 1000)}s`);
    if (state.player.rawMeatDebuffTimer > 0)
        drawStatus("rgba(180,80,0,0.7)", "#ffcc66", `☠ Food Poison ${Math.ceil(state.player.rawMeatDebuffTimer / 1000)}s`);

    // Dimension indicator
    state.ctx.fillStyle = "rgba(0,0,0,0.4)"; state.ctx.fillRect(state.canvas.width - 150, statusY, 145, 20);
    const dimColor = state.inNether ? "#ff4444" : state.inWasteland ? "#c8a030" : state.inPossum ? "#ff88cc" : state.inTheVoid ? "#8888ff" : "#4ade80";
    const dimName  = state.inNether ? "NETHER"  : state.inWasteland ? "WASTELAND" : state.inPossum ? "POSSUM REALM" : state.inTheVoid ? "THE VOID" : "Overworld";
    state.ctx.fillStyle = dimColor; state.ctx.font = "bold 11px 'Courier New', monospace";
    state.ctx.fillText(dimName, state.canvas.width - 10, statusY + 14);

    // Show difficulty on HUD (single player only)
    if (!state.multiplayerMode && state.difficulty !== "normal") {
        const diffLabel = state.difficulty === "easy" ? "EASY" : "HARD";
        const diffCol = state.difficulty === "easy" ? "#4ade80" : "#ef4444";
        state.ctx.fillStyle = "rgba(0,0,0,0.4)"; state.ctx.fillRect(state.canvas.width - 150, statusY - 18, 145, 16);
        state.ctx.fillStyle = diffCol; state.ctx.font = "bold 10px 'Courier New', monospace";
        state.ctx.fillText(diffLabel + " MODE", state.canvas.width - 10, statusY - 6);
    }
}

// --- TITLE SCREEN ---
export function drawTitleScreen() {
    state.ctx.fillStyle = "#1a1a2e";
    state.ctx.fillRect(0, 0, state.canvas.width, state.canvas.height);

    // Decorative grass stripe
    state.ctx.fillStyle = "#4b8b3b";
    state.ctx.fillRect(0, state.canvas.height - 80, state.canvas.width, 80);
    state.ctx.fillStyle = "#5dad3c";
    state.ctx.fillRect(0, state.canvas.height - 80, state.canvas.width, 8);
    state.ctx.fillStyle = "#8b6914";
    state.ctx.fillRect(0, state.canvas.height - 40, state.canvas.width, 40);

    // Title
    state.ctx.fillStyle = "#4ade80";
    state.ctx.font = "bold 48px 'Courier New', monospace";
    state.ctx.textAlign = "center";
    state.ctx.fillText("Leef & Maggie's", state.canvas.width / 2, 120);
    state.ctx.fillText("Minecraft 2D", state.canvas.width / 2, 175);

    state.ctx.fillStyle = "#9ca3af";
    state.ctx.font = "16px 'Courier New', monospace";
    state.ctx.fillText("A 2D Block Building Adventure", state.canvas.width / 2, 210);

    // "New World" button
    const newBtnX = state.canvas.width / 2 - 150;
    const newBtnY = 260;
    const newBtnW = 300;
    const newBtnH = 50;
    state.MENU_BUTTONS.newWorld = { x: newBtnX, y: newBtnY, w: newBtnW, h: newBtnH };

    const hoverNew = state.menuHover === "newWorld";
    state.ctx.fillStyle = hoverNew ? "rgba(74,222,128,0.3)" : "rgba(74,222,128,0.15)";
    state.ctx.fillRect(newBtnX, newBtnY, newBtnW, newBtnH);
    state.ctx.strokeStyle = "#4ade80";
    state.ctx.lineWidth = hoverNew ? 3 : 2;
    state.ctx.strokeRect(newBtnX, newBtnY, newBtnW, newBtnH);
    state.ctx.fillStyle = "#4ade80";
    state.ctx.font = "bold 22px 'Courier New', monospace";
    state.ctx.fillText("+ New World", state.canvas.width / 2, newBtnY + 33);

    // Saved worlds list
    if (state.menuSaveList.length > 0) {
        state.ctx.fillStyle = "#9ca3af";
        state.ctx.font = "bold 16px 'Courier New', monospace";
        state.ctx.textAlign = "center";
        state.ctx.fillText("SAVED WORLDS", state.canvas.width / 2, 345);

        const listStartY = 365;
        const rowH = 60;
        const listW = 500;
        const listX = state.canvas.width / 2 - listW / 2;

        state.MENU_BUTTONS.savedWorlds = [];

        for (let i = 0; i < state.menuSaveList.length; i++) {
            const save = state.menuSaveList[i];
            const ry = listStartY + i * rowH - state.menuScrollOffset;
            if (ry < 330 || ry > state.canvas.height - 100) continue;

            const btnData = { x: listX, y: ry, w: listW - 70, h: rowH - 8, index: i };
            const delData = { x: listX + listW - 60, y: ry, w: 55, h: rowH - 8, index: i };
            state.MENU_BUTTONS.savedWorlds.push({ load: btnData, delete: delData });

            // Load button (main row)
            const hoverLoad = state.menuHover === "load_" + i;
            state.ctx.fillStyle = hoverLoad ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.05)";
            state.ctx.fillRect(btnData.x, btnData.y, btnData.w, btnData.h);
            state.ctx.strokeStyle = hoverLoad ? "#4ade80" : "#555";
            state.ctx.lineWidth = hoverLoad ? 2 : 1;
            state.ctx.strokeRect(btnData.x, btnData.y, btnData.w, btnData.h);

            state.ctx.fillStyle = "#fff";
            state.ctx.font = "bold 16px 'Courier New', monospace";
            state.ctx.textAlign = "left";
            state.ctx.fillText(save.name, btnData.x + 15, ry + 22);

            state.ctx.fillStyle = "#9ca3af";
            state.ctx.font = "12px 'Courier New', monospace";
            state.ctx.fillText(new Date(save.timestamp).toLocaleString(), btnData.x + 15, ry + 40);

            // Delete button
            const hoverDel = state.menuHover === "delete_" + i;
            state.ctx.fillStyle = hoverDel ? "rgba(239,68,68,0.3)" : "rgba(239,68,68,0.1)";
            state.ctx.fillRect(delData.x, delData.y, delData.w, delData.h);
            state.ctx.strokeStyle = hoverDel ? "#ef4444" : "#555";
            state.ctx.lineWidth = hoverDel ? 2 : 1;
            state.ctx.strokeRect(delData.x, delData.y, delData.w, delData.h);
            state.ctx.fillStyle = "#ef4444";
            state.ctx.font = "bold 16px 'Courier New', monospace";
            state.ctx.textAlign = "center";
            state.ctx.fillText("DEL", delData.x + delData.w / 2, ry + 30);
        }
    } else {
        state.ctx.fillStyle = "#555";
        state.ctx.font = "14px 'Courier New', monospace";
        state.ctx.textAlign = "center";
        state.ctx.fillText("No saved worlds yet", state.canvas.width / 2, 370);
    }

    state.ctx.lineWidth = 1;
    state.ctx.textAlign = "center";
}

// --- MODE SELECT SCREEN ---
export function drawModeSelectScreen() {
    const w = state.canvas.width, h = state.canvas.height;
    state.ctx.fillStyle = "#0a0a0a";
    state.ctx.fillRect(0, 0, w, h);

    // Subtle pixel-art grid overlay
    state.ctx.fillStyle = "rgba(255,255,255,0.015)";
    for (let x = 0; x < w; x += 32) state.ctx.fillRect(x, 0, 1, h);
    for (let y = 0; y < h; y += 32) state.ctx.fillRect(0, y, w, 1);

    // Apply scroll offset for mobile
    const scrollY = state.modeSelectScroll || 0;
    state.ctx.save();
    state.ctx.translate(0, -scrollY);

    state.ctx.fillStyle = "#4ade80";
    state.ctx.font = "bold 28px 'Courier New', monospace";
    state.ctx.textAlign = "center";
    state.ctx.fillText("Choose Mode", w / 2, h * 0.15);
    state.ctx.fillStyle = "#6b7280";
    state.ctx.font = "13px 'Courier New', monospace";
    state.ctx.fillText(`World: ${state.pendingWorldName || 'New World'}`, w / 2, h * 0.15 + 26);

    const btnW = 300, btnH = 52, btnX = w / 2 - btnW / 2;

    // --- Single Player ---
    const spY = h * 0.26;
    const hSP = state.menuHover === "modeSP";
    state.ctx.fillStyle = hSP ? "rgba(74,222,128,0.25)" : "rgba(74,222,128,0.10)";
    state.ctx.fillRect(btnX, spY, btnW, btnH);
    state.ctx.strokeStyle = "#4ade80";
    state.ctx.lineWidth = hSP ? 3 : 2;
    state.ctx.strokeRect(btnX, spY, btnW, btnH);
    state.ctx.fillStyle = "#4ade80";
    state.ctx.font = "bold 16px 'Courier New', monospace";
    state.ctx.fillText("Single Player", w / 2, spY + 22);
    state.ctx.fillStyle = "#9ca3af";
    state.ctx.font = "10px 'Courier New', monospace";
    state.ctx.fillText("Just you, your world", w / 2, spY + 40);

    // --- Multiplayer ---
    const mpY = spY + btnH + 12;
    const hMP = state.menuHover === "modeMP";
    state.ctx.fillStyle = hMP ? "rgba(96,165,250,0.25)" : "rgba(96,165,250,0.10)";
    state.ctx.fillRect(btnX, mpY, btnW, btnH);
    state.ctx.strokeStyle = "#60a5fa";
    state.ctx.lineWidth = hMP ? 3 : 2;
    state.ctx.strokeRect(btnX, mpY, btnW, btnH);
    state.ctx.fillStyle = "#60a5fa";
    state.ctx.font = "bold 16px 'Courier New', monospace";
    state.ctx.fillText("Multiplayer", w / 2, mpY + 22);
    state.ctx.fillStyle = "#9ca3af";
    state.ctx.font = "10px 'Courier New', monospace";
    state.ctx.fillText("Shared world with others online", w / 2, mpY + 40);

    // --- Difficulty selection (single player only) ---
    const diffY = mpY + btnH + 24;
    state.ctx.fillStyle = "#e5e7eb";
    state.ctx.font = "bold 14px 'Courier New', monospace";
    state.ctx.fillText("Difficulty", w / 2, diffY);

    const diffBtnW = 90, diffBtnH = 38, diffGap = 10;
    const diffTotalW = diffBtnW * 3 + diffGap * 2;
    const diffStartX = w / 2 - diffTotalW / 2;
    const diffBtnY = diffY + 8;

    const difficulties = [
        { key: "easy", label: "Easy", color: "#4ade80", desc: "More ores, less damage" },
        { key: "normal", label: "Normal", color: "#facc15", desc: "Standard game" },
        { key: "hard", label: "Hard", color: "#ef4444", desc: "Rare ores, more damage" },
    ];

    for (let di = 0; di < difficulties.length; di++) {
        const d = difficulties[di];
        const dx = diffStartX + di * (diffBtnW + diffGap);
        const isSelected = state.pendingDifficulty === d.key;
        const isHover = state.menuHover === "diff_" + d.key;

        state.ctx.fillStyle = isSelected ? d.color + "40" : (isHover ? d.color + "20" : "rgba(255,255,255,0.04)");
        state.ctx.fillRect(dx, diffBtnY, diffBtnW, diffBtnH);
        state.ctx.strokeStyle = isSelected ? d.color : (isHover ? d.color + "80" : "#444");
        state.ctx.lineWidth = isSelected ? 2 : 1;
        state.ctx.strokeRect(dx, diffBtnY, diffBtnW, diffBtnH);
        state.ctx.fillStyle = isSelected ? d.color : "#9ca3af";
        state.ctx.font = "bold 13px 'Courier New', monospace";
        state.ctx.fillText(d.label, dx + diffBtnW / 2, diffBtnY + 24);
    }

    // Difficulty description
    const descMap = { easy: "Ores more common, mobs deal less damage", normal: "The standard experience", hard: "Rare ores, double damage, mobs break doors" };
    state.ctx.fillStyle = "#6b7280";
    state.ctx.font = "11px 'Courier New', monospace";
    state.ctx.fillText(descMap[state.pendingDifficulty], w / 2, diffBtnY + diffBtnH + 16);

    // Store difficulty button hit areas (offset by scroll for hit testing)
    state.MENU_BUTTONS.diffEasy   = { x: diffStartX, y: diffBtnY - scrollY, w: diffBtnW, h: diffBtnH };
    state.MENU_BUTTONS.diffNormal = { x: diffStartX + diffBtnW + diffGap, y: diffBtnY - scrollY, w: diffBtnW, h: diffBtnH };
    state.MENU_BUTTONS.diffHard   = { x: diffStartX + 2 * (diffBtnW + diffGap), y: diffBtnY - scrollY, w: diffBtnW, h: diffBtnH };

    // --- Keep Inventory toggle ---
    const kiY = diffBtnY + diffBtnH + 32;
    const kiW = 250, kiH = 36;
    const kiX = w / 2 - kiW / 2;
    const hKI = state.menuHover === "keepInv";
    const kiOn = state.pendingKeepInventory;

    state.ctx.fillStyle = hKI ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)";
    state.ctx.fillRect(kiX, kiY, kiW, kiH);
    state.ctx.strokeStyle = hKI ? "#9ca3af" : "#444";
    state.ctx.lineWidth = 1;
    state.ctx.strokeRect(kiX, kiY, kiW, kiH);
    state.ctx.fillStyle = "#e5e7eb";
    state.ctx.font = "13px 'Courier New', monospace";
    state.ctx.fillText("Keep Inventory", w / 2 - 30, kiY + 23);
    // Toggle indicator
    const toggleX = kiX + kiW - 50, toggleY = kiY + 9, toggleW = 36, toggleH = 18;
    state.ctx.fillStyle = kiOn ? "#4ade80" : "#374151";
    state.ctx.fillRect(toggleX, toggleY, toggleW, toggleH);
    state.ctx.fillStyle = "#ffffff";
    state.ctx.fillRect(kiOn ? toggleX + toggleW - 16 : toggleX + 2, toggleY + 2, 14, 14);
    state.MENU_BUTTONS.keepInv = { x: kiX, y: kiY - scrollY, w: kiW, h: kiH };

    state.ctx.fillStyle = "#6b7280";
    state.ctx.font = "10px 'Courier New', monospace";
    state.ctx.fillText(kiOn ? "Keep items on death" : "Drop items on death (2 min to recover)", w / 2, kiY + kiH + 14);

    // --- Create World button ---
    const cwY = kiY + kiH + 28;
    const cwW = 250, cwH = 48;
    const cwX = w / 2 - cwW / 2;
    const hCW = state.menuHover === "createWorld";
    state.ctx.fillStyle = hCW ? "rgba(74,222,128,0.3)" : "rgba(74,222,128,0.15)";
    state.ctx.fillRect(cwX, cwY, cwW, cwH);
    state.ctx.strokeStyle = "#4ade80";
    state.ctx.lineWidth = hCW ? 3 : 2;
    state.ctx.strokeRect(cwX, cwY, cwW, cwH);
    state.ctx.fillStyle = "#4ade80";
    state.ctx.font = "bold 16px 'Courier New', monospace";
    state.ctx.fillText("Create World", w / 2, cwY + 30);
    state.MENU_BUTTONS.createWorld = { x: cwX, y: cwY - scrollY, w: cwW, h: cwH };

    // --- Back ---
    const backY = cwY + cwH + 14;
    const hBack = state.menuHover === "modeBack";
    state.ctx.fillStyle = hBack ? "rgba(156,163,175,0.2)" : "rgba(156,163,175,0.06)";
    state.ctx.fillRect(btnX, backY, btnW, 36);
    state.ctx.strokeStyle = hBack ? "#9ca3af" : "#444";
    state.ctx.lineWidth = hBack ? 2 : 1;
    state.ctx.strokeRect(btnX, backY, btnW, 36);
    state.ctx.fillStyle = "#9ca3af";
    state.ctx.font = "13px 'Courier New', monospace";
    state.ctx.fillText("\u2190 Back", w / 2, backY + 23);

    // Store hit areas
    state.MENU_BUTTONS.modeSP   = { x: btnX, y: spY - scrollY,    w: btnW, h: btnH };
    state.MENU_BUTTONS.modeMP   = { x: btnX, y: mpY - scrollY,    w: btnW, h: btnH };
    state.MENU_BUTTONS.modeBack = { x: btnX, y: backY - scrollY,  w: btnW, h: 36   };

    state.ctx.restore();
    state.ctx.lineWidth = 1;
    state.ctx.textAlign = "center";
}

// --- SHARED ACCOUNT SCREEN BACKGROUND ---
function drawAccountBg() {
    const ctx = state.ctx;
    const w = state.canvas.width, h = state.canvas.height;
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "rgba(255,255,255,0.015)";
    for (let x = 0; x < w; x += 32) ctx.fillRect(x, 0, 1, h);
    for (let y = 0; y < h; y += 32) ctx.fillRect(0, y, w, 1);
    return { w, h };
}

function drawAccountInput(ctx, label, value, isPassword, isActive, x, y, w, h) {
    const cursor = isActive && Math.floor(Date.now() / 500) % 2 === 0 ? "|" : "";
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = isActive ? "#4ade80" : "#374151";
    ctx.lineWidth = isActive ? 2 : 1;
    ctx.strokeRect(x, y, w, h);
    // Label
    ctx.fillStyle = isActive ? "#4ade80" : "#6b7280";
    ctx.font = "11px 'Courier New', monospace";
    ctx.textAlign = "left";
    ctx.fillText(label, x + 2, y - 6);
    // Value
    if (value) {
        ctx.fillStyle = "#ffffff";
        ctx.font = "18px 'Courier New', monospace";
        const display = isPassword ? "•".repeat(value.length) + cursor : value + cursor;
        ctx.fillText(display, x + 12, y + h * 0.65);
    } else {
        ctx.fillStyle = "rgba(255,255,255,0.22)";
        ctx.font = "14px 'Courier New', monospace";
        ctx.fillText(isPassword ? "Enter password..." : "Enter username...", x + 12, y + h * 0.65);
        if (isActive) {
            ctx.fillStyle = "#ffffff";
            ctx.font = "18px 'Courier New', monospace";
            ctx.fillText(cursor, x + 12, y + h * 0.65);
        }
    }
    ctx.textAlign = "center";
    ctx.lineWidth = 1;
}

// --- AUTH CHECKING SCREEN (brief flash while Supabase responds) ---
export function drawAuthCheckingScreen() {
    const { w, h } = drawAccountBg();
    const ctx = state.ctx;
    ctx.fillStyle = "#4ade80";
    ctx.font = "bold 20px 'Courier New', monospace";
    ctx.textAlign = "center";
    const dots = ".".repeat(Math.floor(Date.now() / 400) % 4);
    ctx.fillText("Connecting" + dots, w / 2, h / 2);
}

// --- ACCOUNT CREATE SCREEN ---
export function drawAccountCreateScreen() {
    const { w, h } = drawAccountBg();
    const ctx = state.ctx;

    const scrollY = state.accountCreateScroll || 0;
    ctx.save();
    ctx.translate(0, -scrollY);

    ctx.textAlign = "center";
    ctx.fillStyle = "#4ade80";
    ctx.font = "bold 30px 'Courier New', monospace";
    ctx.fillText("Create Account", w / 2, h * 0.22);
    ctx.fillStyle = "#6b7280";
    ctx.font = "13px 'Courier New', monospace";
    ctx.fillText("Pick a username and password to get started", w / 2, h * 0.22 + 28);

    const fieldW = 320, fieldH = 46, fieldX = w / 2 - 160;
    const unY = h * 0.36;
    const pwY = unY + fieldH + 28;

    drawAccountInput(ctx, "USERNAME", state.accountInput, false,
        state.accountActiveField === 'username', fieldX, unY, fieldW, fieldH);
    drawAccountInput(ctx, "PASSWORD  (min 6 chars)", state.accountPassword, true,
        state.accountActiveField === 'password', fieldX, pwY, fieldW, fieldH);

    state.MENU_BUTTONS.accountUsernameField = { x: fieldX, y: unY - scrollY, w: fieldW, h: fieldH };
    state.MENU_BUTTONS.accountPasswordField = { x: fieldX, y: pwY - scrollY, w: fieldW, h: fieldH };

    // Error
    if (state.accountError) {
        ctx.fillStyle = "#f87171";
        ctx.font = "13px 'Courier New', monospace";
        ctx.fillText(state.accountError, w / 2, pwY + fieldH + 22);
    }

    // Button
    const btnW = 240, btnH = 46;
    const btnX = w / 2 - btnW / 2;
    const btnY = pwY + fieldH + (state.accountError ? 46 : 26);
    const ready = state.accountInput.trim().length > 0 && state.accountPassword.length >= 6;
    const hover = state.menuHover === "accountCreate";

    if (state.accountLoading) {
        ctx.fillStyle = "#6b7280";
        ctx.font = "bold 16px 'Courier New', monospace";
        ctx.fillText("Creating account...", w / 2, btnY + 30);
    } else {
        ctx.fillStyle = hover && ready ? "rgba(74,222,128,0.3)" : "rgba(74,222,128,0.10)";
        ctx.fillRect(btnX, btnY, btnW, btnH);
        ctx.strokeStyle = ready ? "#4ade80" : "#374151";
        ctx.lineWidth = 2;
        ctx.strokeRect(btnX, btnY, btnW, btnH);
        ctx.fillStyle = ready ? "#4ade80" : "#6b7280";
        ctx.font = "bold 16px 'Courier New', monospace";
        ctx.fillText("Create Account", w / 2, btnY + 30);
        state.MENU_BUTTONS.accountCreate = { x: btnX, y: btnY - scrollY, w: btnW, h: btnH };
    }

    ctx.fillStyle = "#374151";
    ctx.font = "12px 'Courier New', monospace";
    ctx.fillText("Tab to switch fields  •  Enter to confirm", w / 2, btnY + btnH + 18);

    // Sign In link
    const signInY = btnY + btnH + 40;
    const hSignIn = state.menuHover === "accountSignIn";
    ctx.fillStyle = hSignIn ? "#4ade80" : "#6b7280";
    ctx.font = "13px 'Courier New', monospace";
    ctx.fillText("Already have an account? Sign In", w / 2, signInY);
    const siLinkW = 260, siLinkH = 22;
    state.MENU_BUTTONS.accountSignIn = { x: w / 2 - siLinkW / 2, y: signInY - 16 - scrollY, w: siLinkW, h: siLinkH };
    ctx.restore();
    ctx.lineWidth = 1;
}

// --- ACCOUNT LOGIN SCREEN ---
export function drawAccountLoginScreen() {
    const { w, h } = drawAccountBg();
    const ctx = state.ctx;
    const hasSession = !!state.supabaseSession;
    const btnW = 280, btnH = 50, btnX = w / 2 - 140;

    const scrollY = state.accountLoginScroll || 0;
    ctx.save();
    ctx.translate(0, -scrollY);

    ctx.textAlign = "center";

    if (hasSession) {
        // Session still valid — just a continue button, no password needed
        ctx.fillStyle = "#9ca3af";
        ctx.font = "13px 'Courier New', monospace";
        ctx.fillText("WELCOME BACK", w / 2, h * 0.24);
        ctx.fillStyle = "#facc15";
        ctx.font = "bold 34px 'Courier New', monospace";
        ctx.fillText(state.playerAccount || "Player", w / 2, h * 0.24 + 44);
        ctx.fillStyle = "#6b7280";
        ctx.font = "13px 'Courier New', monospace";
        ctx.fillText("Your session is still active.", w / 2, h * 0.24 + 74);

        const contY = h * 0.50;
        const hCont = state.menuHover === "accountLogin";
        ctx.fillStyle = hCont ? "rgba(74,222,128,0.25)" : "rgba(74,222,128,0.10)";
        ctx.fillRect(btnX, contY, btnW, btnH);
        ctx.strokeStyle = "#4ade80";
        ctx.lineWidth = hCont ? 3 : 2;
        ctx.strokeRect(btnX, contY, btnW, btnH);
        ctx.fillStyle = "#4ade80";
        ctx.font = "bold 16px 'Courier New', monospace";
        ctx.fillText(`Continue as ${state.playerAccount}`, w / 2, contY + 32);
        state.MENU_BUTTONS.accountLogin = { x: btnX, y: contY - scrollY, w: btnW, h: btnH };

        const chY = contY + btnH + 14;
        const hChange = state.menuHover === "accountChange";
        ctx.fillStyle = hChange ? "rgba(156,163,175,0.18)" : "rgba(156,163,175,0.06)";
        ctx.fillRect(btnX, chY, btnW, 40);
        ctx.strokeStyle = hChange ? "#9ca3af" : "#374151";
        ctx.lineWidth = 1;
        ctx.strokeRect(btnX, chY, btnW, 40);
        ctx.fillStyle = "#9ca3af";
        ctx.font = "13px 'Courier New', monospace";
        ctx.fillText("Change Account", w / 2, chY + 25);
        state.MENU_BUTTONS.accountChange = { x: btnX, y: chY - scrollY, w: btnW, h: 40 };
    } else {
        // No active session — sign in with username + password
        ctx.fillStyle = "#4ade80";
        ctx.font = "bold 30px 'Courier New', monospace";
        ctx.fillText("Sign In", w / 2, h * 0.22);
        ctx.fillStyle = "#6b7280";
        ctx.font = "13px 'Courier New', monospace";
        ctx.fillText("Enter your username and password to continue", w / 2, h * 0.22 + 28);

        const fieldW = 280, fieldH = 46, fieldX = w / 2 - 140;
        const unY = h * 0.36;
        const pwY = unY + fieldH + 20;

        drawAccountInput(ctx, "USERNAME", state.accountInput, false,
            state.accountActiveField === 'username', fieldX, unY, fieldW, fieldH);
        drawAccountInput(ctx, "PASSWORD", state.accountPassword, true,
            state.accountActiveField === 'password', fieldX, pwY, fieldW, fieldH);

        state.MENU_BUTTONS.accountUsernameField = { x: fieldX, y: unY - scrollY, w: fieldW, h: fieldH };
        state.MENU_BUTTONS.accountPasswordField = { x: fieldX, y: pwY - scrollY, w: fieldW, h: fieldH };

        if (state.accountError) {
            ctx.fillStyle = "#f87171";
            ctx.font = "13px 'Courier New', monospace";
            ctx.fillText(state.accountError, w / 2, pwY + fieldH + 20);
        }

        const loginY = pwY + fieldH + (state.accountError ? 44 : 24);
        if (state.accountLoading) {
            ctx.fillStyle = "#6b7280";
            ctx.font = "bold 15px 'Courier New', monospace";
            ctx.fillText("Signing in...", w / 2, loginY + 28);
        } else {
            const hLogin = state.menuHover === "accountLogin";
            ctx.fillStyle = hLogin ? "rgba(74,222,128,0.25)" : "rgba(74,222,128,0.10)";
            ctx.fillRect(btnX, loginY, btnW, btnH);
            ctx.strokeStyle = "#4ade80";
            ctx.lineWidth = hLogin ? 3 : 2;
            ctx.strokeRect(btnX, loginY, btnW, btnH);
            ctx.fillStyle = "#4ade80";
            ctx.font = "bold 16px 'Courier New', monospace";
            ctx.fillText("Sign In", w / 2, loginY + 32);
            state.MENU_BUTTONS.accountLogin = { x: btnX, y: loginY - scrollY, w: btnW, h: btnH };
        }

        const chY = loginY + (state.accountLoading ? 60 : btnH + 14);
        const hChange = state.menuHover === "accountChange";
        ctx.fillStyle = hChange ? "rgba(156,163,175,0.18)" : "rgba(156,163,175,0.06)";
        ctx.fillRect(btnX, chY, btnW, 40);
        ctx.strokeStyle = hChange ? "#9ca3af" : "#374151";
        ctx.lineWidth = 1;
        ctx.strokeRect(btnX, chY, btnW, 40);
        ctx.fillStyle = "#9ca3af";
        ctx.font = "13px 'Courier New', monospace";
        ctx.fillText("Create Account", w / 2, chY + 25);
        state.MENU_BUTTONS.accountChange = { x: btnX, y: chY - scrollY, w: btnW, h: 40 };

        ctx.fillStyle = "#374151";
        ctx.font = "12px 'Courier New', monospace";
        ctx.fillText("Tab to switch fields  •  Enter to sign in", w / 2, chY + 56);
    }

    ctx.restore();
    ctx.lineWidth = 1;
}

// --- CHAT OVERLAY ---
export function drawChat() {
    const w = state.canvas.width, h = state.canvas.height;
    const chatX = 14;
    const msgH = 20;
    const maxVisible = 8;
    const chatW = Math.min(420, w - 28);

    // Tick timers and collect visible messages
    const visible = [];
    for (const m of state.chatMessages) {
        if (!state.chatOpen) m.timer = Math.max(0, m.timer - 1);
        if (m.timer > 0 || state.chatOpen) visible.push(m);
    }
    const slice = visible.slice(-maxVisible);

    // Messages area bottom edge = just above input box (or above hotbar)
    const hotbarH = 64;
    const inputH = 32;
    const bottomY = h - hotbarH - (state.chatOpen ? inputH + 6 : 4);
    const startY = bottomY - slice.length * msgH;

    state.ctx.save();
    state.ctx.font = "13px 'Courier New', monospace";
    state.ctx.textAlign = "left";

    if (state.chatOpen) {
        // Background panel for messages when chat is open
        state.ctx.fillStyle = "rgba(0,0,0,0.35)";
        state.ctx.fillRect(chatX - 2, startY - 4, chatW + 4, slice.length * msgH + 6);
    }

    for (let i = 0; i < slice.length; i++) {
        const m = slice[i];
        const alpha = state.chatOpen ? 1 : Math.min(1, m.timer / 60);
        state.ctx.globalAlpha = alpha;
        // Soft shadow
        state.ctx.fillStyle = "rgba(0,0,0,0.6)";
        state.ctx.fillText(m.text, chatX + 1, startY + i * msgH + msgH - 1);
        state.ctx.fillStyle = m.color || '#ffffff';
        state.ctx.fillText(m.text, chatX, startY + i * msgH + msgH - 2);
    }
    state.ctx.globalAlpha = 1;

    // Input box (visible only when chatOpen)
    if (state.chatOpen) {
        const inputY = bottomY + 4;
        // Outline-only box (Roblox-style)
        state.ctx.strokeStyle = "rgba(255,255,255,0.55)";
        state.ctx.lineWidth = 1.5;
        state.ctx.fillStyle = "rgba(0,0,0,0.18)";
        state.ctx.fillRect(chatX, inputY, chatW, inputH);
        state.ctx.strokeRect(chatX, inputY, chatW, inputH);
        // Cursor blink
        const cursor = Math.floor(Date.now() / 530) % 2 === 0 ? '|' : '';
        state.ctx.fillStyle = '#ffffff';
        state.ctx.fillText(state.chatInput + cursor, chatX + 7, inputY + 21);
        // Hint
        if (!state.chatInput) {
            state.ctx.fillStyle = 'rgba(255,255,255,0.3)';
            state.ctx.fillText('Type a message... (Enter to send, Esc to cancel)', chatX + 7, inputY + 21);
        }
        state.ctx.lineWidth = 1;
    } else if (!state.chatOpen && !state.chatMessages.some(m => m.timer > 0)) {
        // Show a faint "T to chat" hint
        state.ctx.globalAlpha = 0.25;
        state.ctx.strokeStyle = "rgba(255,255,255,0.4)";
        state.ctx.lineWidth = 1;
        state.ctx.strokeRect(chatX, h - hotbarH - inputH - 2, chatW, inputH);
        state.ctx.fillStyle = '#ffffff';
        state.ctx.font = "11px 'Courier New', monospace";
        state.ctx.fillText('Press T to chat', chatX + 7, h - hotbarH - inputH + 12);
        state.ctx.globalAlpha = 1;
        state.ctx.lineWidth = 1;
    }

    state.ctx.restore();
}

// --- PAUSE MENU ---
export function drawPauseMenu() {
    state.ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    state.ctx.fillRect(0, 0, state.canvas.width, state.canvas.height);

    const pw = 400, ph = 250;
    const px = (state.canvas.width - pw) / 2;
    const py = (state.canvas.height - ph) / 2;
    state.ctx.save();
    applyPanelScale(pw, ph);
    state.ctx.fillStyle = "#2a2a3e";
    state.ctx.fillRect(px, py, pw, ph);
    state.ctx.strokeStyle = "#4ade80";
    state.ctx.lineWidth = 3;
    state.ctx.strokeRect(px, py, pw, ph);

    state.ctx.fillStyle = "#fff";
    state.ctx.font = "bold 28px 'Courier New', monospace";
    state.ctx.textAlign = "center";
    state.ctx.fillText("PAUSED", state.canvas.width / 2, py + 45);

    // Resume button
    const resumeY = py + 80;
    state.PAUSE_BUTTONS.resume = { x: px + 50, y: resumeY, w: pw - 100, h: 50 };
    const hoverResume = state.menuHover === "resume";
    state.ctx.fillStyle = hoverResume ? "rgba(74,222,128,0.3)" : "rgba(74,222,128,0.15)";
    state.ctx.fillRect(state.PAUSE_BUTTONS.resume.x, resumeY, state.PAUSE_BUTTONS.resume.w, 50);
    state.ctx.strokeStyle = "#4ade80";
    state.ctx.lineWidth = hoverResume ? 3 : 2;
    state.ctx.strokeRect(state.PAUSE_BUTTONS.resume.x, resumeY, state.PAUSE_BUTTONS.resume.w, 50);
    state.ctx.fillStyle = "#4ade80";
    state.ctx.font = "bold 20px 'Courier New', monospace";
    state.ctx.fillText("Resume", state.canvas.width / 2, resumeY + 33);

    // Save & Quit button
    const sqY = py + 155;
    state.PAUSE_BUTTONS.saveQuit = { x: px + 50, y: sqY, w: pw - 100, h: 50 };
    const hoverSQ = state.menuHover === "saveQuit";
    state.ctx.fillStyle = hoverSQ ? "rgba(239,68,68,0.3)" : "rgba(239,68,68,0.15)";
    state.ctx.fillRect(state.PAUSE_BUTTONS.saveQuit.x, sqY, state.PAUSE_BUTTONS.saveQuit.w, 50);
    state.ctx.strokeStyle = "#ef4444";
    state.ctx.lineWidth = hoverSQ ? 3 : 2;
    state.ctx.strokeRect(state.PAUSE_BUTTONS.saveQuit.x, sqY, state.PAUSE_BUTTONS.saveQuit.w, 50);
    state.ctx.fillStyle = "#ef4444";
    state.ctx.font = "bold 20px 'Courier New', monospace";
    state.ctx.fillText("Save & Quit", state.canvas.width / 2, sqY + 33);

    state.ctx.lineWidth = 1;
    state.ctx.restore();
}

// --- TRANSIENT STATE SCREENS ---
export function drawGeneratingScreen() {
    state.ctx.fillStyle = "#1a1a2e";
    state.ctx.fillRect(0, 0, state.canvas.width, state.canvas.height);
    state.ctx.fillStyle = "#4ade80";
    state.ctx.font = "bold 28px 'Courier New', monospace";
    state.ctx.textAlign = "center";
    state.ctx.fillText("Generating world...", state.canvas.width / 2, state.canvas.height / 2);
    state.ctx.fillStyle = "#9ca3af";
    state.ctx.font = "14px 'Courier New', monospace";
    state.ctx.fillText("This may take a moment...", state.canvas.width / 2, state.canvas.height / 2 + 35);
}

export function drawLoadingScreen() {
    state.ctx.fillStyle = "#1a1a2e";
    state.ctx.fillRect(0, 0, state.canvas.width, state.canvas.height);
    state.ctx.fillStyle = "#4ade80";
    state.ctx.font = "bold 28px 'Courier New', monospace";
    state.ctx.textAlign = "center";
    state.ctx.fillText("Loading world...", state.canvas.width / 2, state.canvas.height / 2);
}

export function drawSavingScreen() {
    state.ctx.fillStyle = "#1a1a2e";
    state.ctx.fillRect(0, 0, state.canvas.width, state.canvas.height);
    state.ctx.fillStyle = "#4ade80";
    state.ctx.font = "bold 28px 'Courier New', monospace";
    state.ctx.textAlign = "center";
    state.ctx.fillText("Saving world...", state.canvas.width / 2, state.canvas.height / 2);
}
