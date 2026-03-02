// ============================================================
// UI.JS - All user interface drawing (ES Module)
// ============================================================
// Floating texts, hotbar, health bar, crafting menu,
// block highlight, mining progress, death screen, HUD.
// ============================================================

import { state } from './state.js';
import { BLOCKS, ITEMS, BLOCK_SIZE, WORLD_WIDTH, WORLD_HEIGHT, UI, RECIPES, TRADES, BLOCK_INFO, ITEM_INFO, MOB_DEFS, getItemName, isStackable, maxStackSize, isFood, PLAYER_REACH } from './constants.js';
import { countItem, getArmorDefense, HOTBAR_SIZE, BACKPACK_SIZE, canCraft } from './inventory.js';
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

// --- HOTBAR ---
export function drawHotbar() {
    const s = 48, p = 4;
    const total = HOTBAR_SIZE * (s + p) - p;
    const sx = (state.canvas.width - total) / 2;
    const sy = state.canvas.height - s - 12;

    for (let i = 0; i < HOTBAR_SIZE; i++) {
        drawInventorySlot(sx + i * (s + p), sy, s, state.inventory.slots[i], i === state.inventory.selectedSlot, i + 1);
    }

    // Offhand slot (to the right of the hotbar)
    const offX = sx + total + 16, offY = sy;
    state.ctx.fillStyle = "#9ca3af"; state.ctx.font = "9px 'Courier New', monospace"; state.ctx.textAlign = "center";
    state.ctx.fillText("OFF", offX + s / 2, offY - 4);
    drawInventorySlot(offX, offY, s, state.offhand, false);

    const held = state.inventory.slots[state.inventory.selectedSlot];
    if (held.count > 0 && held.itemId !== 0) {
        const heldInfo = ITEM_INFO[held.itemId];
        let name = getItemName(held.itemId);
        // Gun: show damage and ammo count
        if (heldInfo && heldInfo.toolType === "gun") {
            const ammoId = heldInfo.ammoType === "rocket" ? ITEMS.ROCKET : ITEMS.BULLETS;
            const ammo = countItem(ammoId);
            name += ` | DMG:${heldInfo.damage} | Ammo:${ammo}`;
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

// --- CRAFTING MENU ---
export function drawCraftingMenu() {
    if (!state.craftingOpen) return;

    state.ctx.fillStyle = "rgba(0,0,0,0.75)";
    state.ctx.fillRect(0, 0, state.canvas.width, state.canvas.height);

    const pw = UI.CRAFTING_PANEL_W, ph = UI.CRAFTING_PANEL_H;
    const px = (state.canvas.width - pw) / 2, py = (state.canvas.height - ph) / 2;
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

    // Cursor item
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

    // Cursor item
    if (state.cursorItem.itemId !== 0 && state.cursorItem.count > 0) {
        const cs = 32;
        drawItemIcon(state.cursorItem.itemId, state.mouse.x - cs / 2, state.mouse.y - cs / 2, cs);
        if (state.cursorItem.count > 1) {
            state.ctx.fillStyle = "#fff"; state.ctx.font = "bold 14px 'Courier New', monospace"; state.ctx.textAlign = "right";
            state.ctx.fillText(state.cursorItem.count.toString(), state.mouse.x + cs / 2, state.mouse.y + cs / 2);
        }
    }
}

// --- TRADING MENU ---
export function drawTradingMenu() {
    if (!state.tradingOpen) return;

    state.ctx.fillStyle = "rgba(0,0,0,0.75)";
    state.ctx.fillRect(0, 0, state.canvas.width, state.canvas.height);

    const pw = UI.TRADING_PANEL_W, ph = UI.TRADING_PANEL_H;
    const px = (state.canvas.width - pw) / 2, py = (state.canvas.height - ph) / 2;
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
                if (info.minTier > 0 && b !== BLOCKS.OBSIDIAN) {
                    tip += ` (needs ${["Hand","Wood","Stone","Iron","Diamond"][info.minTier]} pickaxe)`;
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

    // Dimension indicator
    state.ctx.fillStyle = "rgba(0,0,0,0.4)"; state.ctx.fillRect(state.canvas.width - 150, 76, 145, 20);
    state.ctx.fillStyle = state.inNether ? "#ff4444" : "#4ade80"; state.ctx.font = "bold 11px 'Courier New', monospace";
    state.ctx.fillText(state.inNether ? "NETHER" : "Overworld", state.canvas.width - 10, 90);
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

// --- PAUSE MENU ---
export function drawPauseMenu() {
    state.ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    state.ctx.fillRect(0, 0, state.canvas.width, state.canvas.height);

    const pw = 400, ph = 250;
    const px = (state.canvas.width - pw) / 2;
    const py = (state.canvas.height - ph) / 2;
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
