// ============================================================
// UI.JS - All user interface drawing
// ============================================================
// Floating texts, hotbar, health bar, crafting menu,
// block highlight, mining progress, death screen, HUD.
// ============================================================

// --- FLOATING TEXTS ---
function drawFloatingTexts() {
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const ft = floatingTexts[i];
        const alpha = ft.life / 60;
        const sx = ft.x - camera.x + screenShake.x;
        const sy = ft.y - camera.y + screenShake.y - (60 - ft.life) * 0.5;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = ft.color;
        ctx.font = "bold 13px 'Courier New', monospace";
        ctx.textAlign = "center";
        ctx.fillText(ft.text, sx, sy);
        ft.life--;
        if (ft.life <= 0) floatingTexts.splice(i, 1);
    }
    ctx.globalAlpha = 1;
}

// --- INVENTORY SLOT ---
function drawInventorySlot(x, y, size, slot, selected, num) {
    ctx.fillStyle = selected ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.6)";
    ctx.fillRect(x, y, size, size);
    ctx.strokeStyle = selected ? "#4ade80" : "#555";
    ctx.lineWidth = selected ? 3 : 1;
    ctx.strokeRect(x, y, size, size);

    if (slot.itemId !== 0 && slot.count > 0) {
        drawItemIcon(slot.itemId, x + 6, y + 6, size - 12);
        if (ITEM_INFO[slot.itemId] && ITEM_INFO[slot.itemId].durability) {
            const maxD = ITEM_INFO[slot.itemId].durability;
            const pct = slot.durability / maxD;
            ctx.fillStyle = "rgba(0,0,0,0.5)";
            ctx.fillRect(x + 4, y + size - 7, size - 8, 4);
            ctx.fillStyle = pct > 0.5 ? "#4ade80" : pct > 0.25 ? "#fbbf24" : "#ef4444";
            ctx.fillRect(x + 4, y + size - 7, (size - 8) * pct, 4);
        }
        if (slot.count > 1) {
            ctx.fillStyle = "#fff"; ctx.font = "bold 14px 'Courier New', monospace"; ctx.textAlign = "right";
            ctx.fillText(slot.count.toString(), x + size - 4, y + size - 4);
        }
    }
    if (num !== undefined) {
        ctx.fillStyle = "rgba(255,255,255,0.4)"; ctx.font = "10px 'Courier New', monospace"; ctx.textAlign = "left";
        ctx.fillText(num.toString(), x + 3, y + 11);
    }
    ctx.lineWidth = 1;
}

// --- HOTBAR ---
function drawHotbar() {
    const s = 48, p = 4;
    const total = HOTBAR_SIZE * (s + p) - p;
    const sx = (canvas.width - total) / 2;
    const sy = canvas.height - s - 12;

    for (let i = 0; i < HOTBAR_SIZE; i++) {
        drawInventorySlot(sx + i * (s + p), sy, s, inventory.slots[i], i === inventory.selectedSlot, i + 1);
    }

    const held = inventory.slots[inventory.selectedSlot];
    if (held.count > 0 && held.itemId !== 0) {
        const heldInfo = ITEM_INFO[held.itemId];
        let name = getItemName(held.itemId);
        // Gun: show damage and ammo count
        if (heldInfo && heldInfo.toolType === "gun") {
            const ammoId = heldInfo.ammoType === "rocket" ? ITEMS.ROCKET : ITEMS.BULLETS;
            const ammo = countItem(ammoId);
            name += ` | DMG:${heldInfo.damage} | Ammo:${ammo}`;
        }
        ctx.font = "14px 'Courier New', monospace"; ctx.textAlign = "center";
        const tw = ctx.measureText(name).width;
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(canvas.width / 2 - tw / 2 - 6, sy - 26, tw + 12, 22);
        ctx.fillStyle = "#fff";
        ctx.fillText(name, canvas.width / 2, sy - 10);
    }
}

// --- HEALTH BAR ---
function drawHealthBar() {
    const hs = 16, sx = 10, sy = 10;
    for (let i = 0; i < player.maxHealth / 2; i++) {
        const x = sx + i * (hs + 2);
        if (i < Math.floor(player.health / 2)) ctx.fillStyle = "#ff3333";
        else if (player.health % 2 === 1 && i === Math.floor(player.health / 2)) ctx.fillStyle = "#ff9999";
        else ctx.fillStyle = "#333";
        ctx.fillRect(x + 2, sy, hs - 4, hs - 2);
        ctx.fillRect(x, sy + 2, hs, hs - 4);
    }

    const armorDef = getArmorDefense();
    if (armorDef > 0) {
        const ay = sy + hs + 4;
        ctx.fillStyle = "rgba(0,0,0,0.4)";
        ctx.fillRect(sx - 2, ay - 2, armorDef * (hs + 2) + 4, hs + 2);
        for (let i = 0; i < armorDef; i++) {
            const x = sx + i * (hs + 2);
            ctx.fillStyle = "#8888cc";
            ctx.fillRect(x + 2, ay, hs - 4, hs - 4);
            ctx.fillRect(x, ay + 2, hs, hs - 6);
            ctx.fillStyle = "#aaaaee";
            ctx.fillRect(x + 4, ay + 2, hs - 8, hs - 8);
        }
    }
}

// --- BLOCK HIGHLIGHT ---
function drawBlockHighlight() {
    if (craftingOpen || tradingOpen || chestOpen || gameOver) return;
    const wmx = Math.floor((mouse.x + camera.x) / BLOCK_SIZE);
    const wmy = Math.floor((mouse.y + camera.y) / BLOCK_SIZE);
    if (wmx < 0 || wmx >= WORLD_WIDTH || wmy < 0 || wmy >= WORLD_HEIGHT) return;

    const pcx = player.x + player.width / 2, pcy = player.y + player.height / 2;
    const bcx = wmx * BLOCK_SIZE + BLOCK_SIZE / 2, bcy = wmy * BLOCK_SIZE + BLOCK_SIZE / 2;
    const dist = Math.sqrt((pcx - bcx) ** 2 + (pcy - bcy) ** 2);

    if (dist < BLOCK_SIZE * PLAYER_REACH) {
        const sx = wmx * BLOCK_SIZE - camera.x + screenShake.x;
        const sy = wmy * BLOCK_SIZE - camera.y + screenShake.y;
        ctx.strokeStyle = "rgba(255,255,255,0.7)";
        ctx.lineWidth = 2;
        ctx.strokeRect(sx, sy, BLOCK_SIZE, BLOCK_SIZE);
        ctx.lineWidth = 1;
    }
}

// --- MINING PROGRESS ---
function drawMiningProgress() {
    if (!mining.active) return;
    const sx = mining.blockX * BLOCK_SIZE - camera.x + screenShake.x;
    const sy = mining.blockY * BLOCK_SIZE - camera.y + screenShake.y;
    const p = mining.progress / mining.targetTime;

    ctx.strokeStyle = "rgba(0,0,0,0.7)"; ctx.lineWidth = 2;
    if (p > 0.2) { ctx.beginPath(); ctx.moveTo(sx + 16, sy + 16); ctx.lineTo(sx + 32, sy); ctx.stroke(); }
    if (p > 0.4) { ctx.beginPath(); ctx.moveTo(sx + 16, sy + 16); ctx.lineTo(sx, sy + 32); ctx.stroke(); }
    if (p > 0.6) { ctx.beginPath(); ctx.moveTo(sx + 16, sy + 16); ctx.lineTo(sx, sy); ctx.stroke(); }
    if (p > 0.8) { ctx.beginPath(); ctx.moveTo(sx + 16, sy + 16); ctx.lineTo(sx + 32, sy + 32); ctx.stroke(); }
    ctx.lineWidth = 1;

    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(sx, sy - 10, BLOCK_SIZE, 7);
    ctx.fillStyle = mining.canMine ? "#4ade80" : "#ef4444";
    ctx.fillRect(sx, sy - 10, BLOCK_SIZE * p, 7);

    if (!mining.canMine) {
        ctx.fillStyle = "#ef4444"; ctx.font = "bold 11px 'Courier New', monospace"; ctx.textAlign = "center";
        ctx.fillText("Need better tool!", sx + 16, sy - 14);
    }
}

// --- CRAFTING MENU ---
function drawCraftingMenu() {
    if (!craftingOpen) return;

    ctx.fillStyle = "rgba(0,0,0,0.75)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const pw = UI.CRAFTING_PANEL_W, ph = UI.CRAFTING_PANEL_H;
    const px = (canvas.width - pw) / 2, py = (canvas.height - ph) / 2;
    ctx.fillStyle = "#2a2a3e"; ctx.fillRect(px, py, pw, ph);
    ctx.strokeStyle = "#4ade80"; ctx.lineWidth = 3; ctx.strokeRect(px, py, pw, ph); ctx.lineWidth = 1;

    ctx.fillStyle = "#4ade80"; ctx.font = "bold 24px 'Courier New', monospace"; ctx.textAlign = "center";
    ctx.fillText("CRAFTING", canvas.width / 2, py + 35);
    ctx.fillStyle = "#9ca3af"; ctx.font = "12px 'Courier New', monospace";
    ctx.fillText("Click to craft!  Scroll for more  Press E to close", canvas.width / 2, py + 55);

    const rw = UI.RECIPE_W, rh = UI.RECIPE_H, cols = UI.RECIPE_COLS, gap = UI.RECIPE_GAP;
    const srx = px + UI.RECIPE_START_X, sry = py + UI.RECIPE_START_Y;
    const recipeAreaBottom = py + ph - UI.INV_BOTTOM_MARGIN;

    // Clip recipe area
    ctx.save();
    ctx.beginPath();
    ctx.rect(px, sry - 5, pw, recipeAreaBottom - sry + 5);
    ctx.clip();

    for (let i = 0; i < RECIPES.length; i++) {
        const recipe = RECIPES[i];
        const col = i % cols, row = Math.floor(i / cols);
        const rx = srx + col * (rw + gap), ry = sry + row * (rh + 6) - craftingScroll;
        if (ry + rh < sry - 5 || ry > recipeAreaBottom) continue;

        const can = canCraft(recipe);
        const hover = craftingHover === i;

        ctx.fillStyle = hover ? (can ? "rgba(74,222,128,0.25)" : "rgba(255,255,255,0.1)")
                               : (can ? "rgba(74,222,128,0.1)" : "rgba(255,255,255,0.05)");
        ctx.fillRect(rx, ry, rw, rh);
        ctx.strokeStyle = can ? "#4ade80" : "#555"; ctx.lineWidth = hover ? 2 : 1;
        ctx.strokeRect(rx, ry, rw, rh); ctx.lineWidth = 1;

        drawItemIcon(recipe.result, rx + 6, ry + 8, 36);

        ctx.fillStyle = can ? "#fff" : "#777"; ctx.font = "bold 14px 'Courier New', monospace"; ctx.textAlign = "left";
        const rName = (recipe.resultCount > 1 ? recipe.resultCount + "x " : "") + getItemName(recipe.result);
        ctx.fillText(rName, rx + 50, ry + 20);

        let ix = rx + 50;
        ctx.font = "11px 'Courier New', monospace";
        for (let j = 0; j < recipe.ingredients.length; j++) {
            const ing = recipe.ingredients[j];
            const have = countItem(ing.id) >= ing.count;
            if (j > 0) {
                ctx.fillStyle = "#777"; ctx.fillText(" + ", ix, ry + 38);
                ix += ctx.measureText(" + ").width;
            }
            ctx.fillStyle = have ? "#9ca3af" : "#ef4444";
            const label = `${ing.count} ${getItemName(ing.id)}`;
            ctx.fillText(label, ix, ry + 38);
            ix += ctx.measureText(label).width;
        }
    }

    ctx.restore();

    // Scroll indicator
    const totalRows = Math.ceil(RECIPES.length / cols);
    const maxScroll = Math.max(0, totalRows * 58 - (recipeAreaBottom - sry));
    if (maxScroll > 0) {
        const scrollPct = craftingScroll / maxScroll;
        const barH = recipeAreaBottom - sry;
        const thumbH = Math.max(20, barH * (barH / (totalRows * 58)));
        const thumbY = sry + scrollPct * (barH - thumbH);
        ctx.fillStyle = "rgba(255,255,255,0.15)";
        ctx.fillRect(px + pw - 12, sry, 6, barH);
        ctx.fillStyle = "rgba(74,222,128,0.5)";
        ctx.fillRect(px + pw - 12, thumbY, 6, thumbH);
    }

    // Inventory display at bottom
    const is = UI.SLOT_SIZE, ip = UI.SLOT_PAD;
    const itw = UI.INV_TOTAL_W;
    const isx = (canvas.width - itw) / 2 + UI.INV_OFFSET_X;

    ctx.fillStyle = "#9ca3af"; ctx.font = "bold 12px 'Courier New', monospace"; ctx.textAlign = "center";
    ctx.fillText("INVENTORY  (click to move items)", canvas.width / 2 + UI.INV_OFFSET_X, py + ph - 100);

    const hoverSlot = getInventorySlotAtMouse();

    for (let i = 0; i < HOTBAR_SIZE; i++) {
        drawInventorySlot(isx + i * (is + ip), py + ph + UI.HOTBAR_ROW_Y, is, inventory.slots[i], hoverSlot === i);
    }
    for (let i = 0; i < BACKPACK_SIZE; i++) {
        const c = i % UI.INV_COLS, r = Math.floor(i / UI.INV_COLS);
        drawInventorySlot(isx + c * (is + ip), py + ph + UI.BACKPACK_ROW_Y + r * (is + ip), is, inventory.slots[HOTBAR_SIZE + i], hoverSlot === HOTBAR_SIZE + i);
    }

    // Armor slots
    const armorX = isx + itw + UI.ARMOR_GAP;
    const armorY = py + ph + UI.HOTBAR_ROW_Y;
    const armorLabels = ["helmet", "chestplate", "leggings", "boots"];
    const armorIcons = ["H", "C", "L", "B"];
    ctx.fillStyle = "#9ca3af"; ctx.font = "bold 11px 'Courier New', monospace"; ctx.textAlign = "center";
    ctx.fillText("ARMOR", armorX + is / 2, armorY - 6);

    const hoverArmor = getArmorSlotAtMouse();
    for (let i = 0; i < 4; i++) {
        const ay = armorY + i * (is + ip);
        const slot = inventory.armor[armorLabels[i]];
        const highlighted = (hoverArmor === armorLabels[i]);
        ctx.fillStyle = highlighted ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.6)";
        ctx.fillRect(armorX, ay, is, is);
        ctx.strokeStyle = highlighted ? "#4ade80" : "#666";
        ctx.lineWidth = highlighted ? 3 : 1;
        ctx.strokeRect(armorX, ay, is, is);
        ctx.lineWidth = 1;

        if (slot.itemId !== 0) {
            drawItemIcon(slot.itemId, armorX + 6, ay + 6, is - 12);
            if (ITEM_INFO[slot.itemId] && ITEM_INFO[slot.itemId].durability) {
                const maxD = ITEM_INFO[slot.itemId].durability;
                const pct = slot.durability / maxD;
                ctx.fillStyle = "rgba(0,0,0,0.5)";
                ctx.fillRect(armorX + 4, ay + is - 7, is - 8, 4);
                ctx.fillStyle = pct > 0.5 ? "#4ade80" : pct > 0.25 ? "#fbbf24" : "#ef4444";
                ctx.fillRect(armorX + 4, ay + is - 7, (is - 8) * pct, 4);
            }
        } else {
            ctx.fillStyle = "rgba(255,255,255,0.15)"; ctx.font = "16px 'Courier New', monospace"; ctx.textAlign = "center";
            ctx.fillText(armorIcons[i], armorX + is / 2, ay + is / 2 + 6);
        }
    }

    // Cursor item
    if (cursorItem.itemId !== 0 && cursorItem.count > 0) {
        const cs = 32;
        drawItemIcon(cursorItem.itemId, mouse.x - cs / 2, mouse.y - cs / 2, cs);
        if (cursorItem.count > 1) {
            ctx.fillStyle = "#fff"; ctx.font = "bold 14px 'Courier New', monospace"; ctx.textAlign = "right";
            ctx.fillText(cursorItem.count.toString(), mouse.x + cs / 2, mouse.y + cs / 2);
        }
    }
}

// --- CHEST MENU ---
function drawChestMenu() {
    if (!chestOpen || !chestPos) return;

    const key = `${chestPos.x},${chestPos.y}`;
    if (!chestData[key]) return;

    ctx.fillStyle = "rgba(0,0,0,0.75)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const pw = UI.CHEST_PANEL_W, ph = UI.CHEST_PANEL_H;
    const px = (canvas.width - pw) / 2, py = (canvas.height - ph) / 2;
    ctx.fillStyle = "#2a2a3e"; ctx.fillRect(px, py, pw, ph);
    ctx.strokeStyle = "#c4a047"; ctx.lineWidth = 3; ctx.strokeRect(px, py, pw, ph); ctx.lineWidth = 1;

    ctx.fillStyle = "#c4a047"; ctx.font = "bold 24px 'Courier New', monospace"; ctx.textAlign = "center";
    ctx.fillText("CHEST", canvas.width / 2, py + 35);
    ctx.fillStyle = "#9ca3af"; ctx.font = "12px 'Courier New', monospace";
    ctx.fillText("Click to move items!  Press F/E/Escape to close", canvas.width / 2, py + 55);

    // Chest slots (9 in a row)
    const is = UI.SLOT_SIZE, ip = UI.SLOT_PAD;
    const chestCols = UI.CHEST_SLOT_COLS;
    const chestTotalW = chestCols * (is + ip) - ip;
    const csx = (canvas.width - chestTotalW) / 2;
    const csy = py + UI.CHEST_SLOT_START_Y;

    ctx.fillStyle = "#9ca3af"; ctx.font = "bold 12px 'Courier New', monospace"; ctx.textAlign = "center";
    ctx.fillText("CHEST CONTENTS", canvas.width / 2, csy - 8);

    const hoverChestSlot = getChestSlotAtMouse();
    for (let i = 0; i < 9; i++) {
        const sx = csx + i * (is + ip);
        drawInventorySlot(sx, csy, is, chestData[key][i], hoverChestSlot === i);
    }

    // Separator
    const sepY = csy + is + 20;
    ctx.strokeStyle = "rgba(255,255,255,0.1)"; ctx.beginPath();
    ctx.moveTo(px + 20, sepY); ctx.lineTo(px + pw - 20, sepY); ctx.stroke();

    // Player inventory
    ctx.fillStyle = "#9ca3af"; ctx.font = "bold 12px 'Courier New', monospace"; ctx.textAlign = "center";
    ctx.fillText("YOUR INVENTORY", canvas.width / 2, sepY + 18);

    const itw = UI.INV_TOTAL_W;
    const isx = (canvas.width - itw) / 2;
    const hoverInvSlot = getChestInventorySlotAtMouse();

    // Hotbar
    const hotbarY = py + ph - 100;
    for (let i = 0; i < HOTBAR_SIZE; i++) {
        drawInventorySlot(isx + i * (is + ip), hotbarY, is, inventory.slots[i], hoverInvSlot === i);
    }

    // Backpack
    const bpY = hotbarY + is + ip + 4;
    for (let i = 0; i < BACKPACK_SIZE; i++) {
        const c = i % UI.INV_COLS, r = Math.floor(i / UI.INV_COLS);
        drawInventorySlot(isx + c * (is + ip), bpY + r * (is + ip), is, inventory.slots[HOTBAR_SIZE + i], hoverInvSlot === HOTBAR_SIZE + i);
    }

    // Cursor item
    if (cursorItem.itemId !== 0 && cursorItem.count > 0) {
        const cs = 32;
        drawItemIcon(cursorItem.itemId, mouse.x - cs / 2, mouse.y - cs / 2, cs);
        if (cursorItem.count > 1) {
            ctx.fillStyle = "#fff"; ctx.font = "bold 14px 'Courier New', monospace"; ctx.textAlign = "right";
            ctx.fillText(cursorItem.count.toString(), mouse.x + cs / 2, mouse.y + cs / 2);
        }
    }
}

// --- TRADING MENU ---
function drawTradingMenu() {
    if (!tradingOpen) return;

    ctx.fillStyle = "rgba(0,0,0,0.75)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const pw = UI.TRADING_PANEL_W, ph = UI.TRADING_PANEL_H;
    const px = (canvas.width - pw) / 2, py = (canvas.height - ph) / 2;
    ctx.fillStyle = "#2a2a3e"; ctx.fillRect(px, py, pw, ph);
    ctx.strokeStyle = "#ffd700"; ctx.lineWidth = 3; ctx.strokeRect(px, py, pw, ph); ctx.lineWidth = 1;

    ctx.fillStyle = "#ffd700"; ctx.font = "bold 24px 'Courier New', monospace"; ctx.textAlign = "center";
    ctx.fillText("VILLAGER TRADING", canvas.width / 2, py + 35);
    ctx.fillStyle = "#9ca3af"; ctx.font = "12px 'Courier New', monospace";
    ctx.fillText("Click to trade!  Press F or Escape to close", canvas.width / 2, py + 55);

    const emeraldCount = countItem(BLOCKS.EMERALD);
    ctx.fillStyle = "#2dd84a"; ctx.font = "bold 14px 'Courier New', monospace"; ctx.textAlign = "center";
    ctx.fillText("Your Emeralds: " + emeraldCount, canvas.width / 2, py + 78);

    const startY = py + UI.TRADE_START_Y;
    const rowH = UI.TRADE_ROW_H;
    const margin = UI.TRADE_MARGIN;

    for (let i = 0; i < TRADES.length; i++) {
        const trade = TRADES[i];
        const ry = startY + i * rowH;
        if (ry + rowH > py + ph - 10) break;

        const canAfford = emeraldCount >= trade.cost;
        const hover = tradingHover === i;

        ctx.fillStyle = hover ? (canAfford ? "rgba(74,222,128,0.25)" : "rgba(255,255,255,0.1)")
                               : (canAfford ? "rgba(74,222,128,0.1)" : "rgba(255,255,255,0.05)");
        ctx.fillRect(px + margin, ry, pw - margin * 2, rowH - 4);
        ctx.strokeStyle = canAfford ? "#4ade80" : "#555"; ctx.lineWidth = hover ? 2 : 1;
        ctx.strokeRect(px + margin, ry, pw - margin * 2, rowH - 4); ctx.lineWidth = 1;

        // Emerald cost
        drawItemIcon(BLOCKS.EMERALD, px + margin + 10, ry + 6, 28);
        ctx.fillStyle = canAfford ? "#2dd84a" : "#777";
        ctx.font = "bold 16px 'Courier New', monospace"; ctx.textAlign = "left";
        ctx.fillText("x" + trade.cost, px + margin + 43, ry + 27);

        // Arrow
        ctx.fillStyle = "#9ca3af"; ctx.font = "bold 20px 'Courier New', monospace"; ctx.textAlign = "center";
        ctx.fillText("\u2192", px + pw / 2 - 30, ry + 28);

        // Result
        drawItemIcon(trade.result, px + pw / 2, ry + 6, 28);
        ctx.fillStyle = canAfford ? "#fff" : "#777";
        ctx.font = "bold 14px 'Courier New', monospace"; ctx.textAlign = "left";
        const resultName = (trade.resultCount > 1 ? trade.resultCount + "x " : "") + getItemName(trade.result);
        ctx.fillText(resultName, px + pw / 2 + 34, ry + 27);
    }
}

// --- DEATH SCREEN ---
function drawDeathScreen() {
    if (!gameOver) return;
    ctx.fillStyle = "rgba(150, 0, 0, 0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ff2222"; ctx.font = "bold 48px 'Courier New', monospace"; ctx.textAlign = "center";
    ctx.fillText("YOU DIED!", canvas.width / 2, canvas.height / 2 - 20);
    ctx.fillStyle = "#ffffff"; ctx.font = "20px 'Courier New', monospace";
    ctx.fillText("Press R to Respawn", canvas.width / 2, canvas.height / 2 + 30);
}

// --- HUD ---
function drawHUD() {
    if (!craftingOpen && !tradingOpen && !chestOpen && !gameOver) {
        const wmx = Math.floor((mouse.x + camera.x) / BLOCK_SIZE);
        const wmy = Math.floor((mouse.y + camera.y) / BLOCK_SIZE);
        if (wmx >= 0 && wmx < WORLD_WIDTH && wmy >= 0 && wmy < WORLD_HEIGHT) {
            const b = activeWorld[wmx][wmy];
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
                ctx.font = "13px 'Courier New', monospace"; ctx.textAlign = "left";
                const tw = ctx.measureText(tip).width;
                ctx.fillStyle = "rgba(0,0,0,0.7)";
                ctx.fillRect(mouse.x + 10, mouse.y - 22, tw + 12, 24);
                ctx.fillStyle = "#fff";
                ctx.fillText(tip, mouse.x + 16, mouse.y - 5);
            }
        }
    }

    ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(canvas.width - 150, 5, 145, 22);
    ctx.fillStyle = "#fff"; ctx.font = "12px 'Courier New', monospace"; ctx.textAlign = "right";
    ctx.fillText(`X: ${Math.floor(player.x / BLOCK_SIZE)} Y: ${Math.floor(player.y / BLOCK_SIZE)}`, canvas.width - 10, 20);

    if (!craftingOpen && !tradingOpen && !chestOpen) {
        ctx.fillStyle = "rgba(0,0,0,0.4)"; ctx.fillRect(canvas.width - 150, 30, 145, 20);
        ctx.fillStyle = "#4ade80"; ctx.font = "11px 'Courier New', monospace";
        ctx.fillText("Press E to craft!", canvas.width - 10, 44);
    }

    ctx.fillStyle = "rgba(0,0,0,0.4)"; ctx.fillRect(canvas.width - 150, 53, 145, 20);
    ctx.fillStyle = "#9ca3af"; ctx.font = "11px 'Courier New', monospace";
    ctx.fillText(`Mobs: ${mobs.length}`, canvas.width - 10, 67);

    // Dimension indicator
    ctx.fillStyle = "rgba(0,0,0,0.4)"; ctx.fillRect(canvas.width - 150, 76, 145, 20);
    ctx.fillStyle = inNether ? "#ff4444" : "#4ade80"; ctx.font = "bold 11px 'Courier New', monospace";
    ctx.fillText(inNether ? "NETHER" : "Overworld", canvas.width - 10, 90);
}

// --- TITLE SCREEN ---
function drawTitleScreen() {
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Decorative grass stripe
    ctx.fillStyle = "#4b8b3b";
    ctx.fillRect(0, canvas.height - 80, canvas.width, 80);
    ctx.fillStyle = "#5dad3c";
    ctx.fillRect(0, canvas.height - 80, canvas.width, 8);
    ctx.fillStyle = "#8b6914";
    ctx.fillRect(0, canvas.height - 40, canvas.width, 40);

    // Title
    ctx.fillStyle = "#4ade80";
    ctx.font = "bold 48px 'Courier New', monospace";
    ctx.textAlign = "center";
    ctx.fillText("Leef & Maggie's", canvas.width / 2, 120);
    ctx.fillText("Minecraft 2D", canvas.width / 2, 175);

    ctx.fillStyle = "#9ca3af";
    ctx.font = "16px 'Courier New', monospace";
    ctx.fillText("A 2D Block Building Adventure", canvas.width / 2, 210);

    // "New World" button
    const newBtnX = canvas.width / 2 - 150;
    const newBtnY = 260;
    const newBtnW = 300;
    const newBtnH = 50;
    MENU_BUTTONS.newWorld = { x: newBtnX, y: newBtnY, w: newBtnW, h: newBtnH };

    const hoverNew = menuHover === "newWorld";
    ctx.fillStyle = hoverNew ? "rgba(74,222,128,0.3)" : "rgba(74,222,128,0.15)";
    ctx.fillRect(newBtnX, newBtnY, newBtnW, newBtnH);
    ctx.strokeStyle = "#4ade80";
    ctx.lineWidth = hoverNew ? 3 : 2;
    ctx.strokeRect(newBtnX, newBtnY, newBtnW, newBtnH);
    ctx.fillStyle = "#4ade80";
    ctx.font = "bold 22px 'Courier New', monospace";
    ctx.fillText("+ New World", canvas.width / 2, newBtnY + 33);

    // Saved worlds list
    if (menuSaveList.length > 0) {
        ctx.fillStyle = "#9ca3af";
        ctx.font = "bold 16px 'Courier New', monospace";
        ctx.textAlign = "center";
        ctx.fillText("SAVED WORLDS", canvas.width / 2, 345);

        const listStartY = 365;
        const rowH = 60;
        const listW = 500;
        const listX = canvas.width / 2 - listW / 2;

        MENU_BUTTONS.savedWorlds = [];

        for (let i = 0; i < menuSaveList.length; i++) {
            const save = menuSaveList[i];
            const ry = listStartY + i * rowH - menuScrollOffset;
            if (ry < 330 || ry > canvas.height - 100) continue;

            const btnData = { x: listX, y: ry, w: listW - 70, h: rowH - 8, index: i };
            const delData = { x: listX + listW - 60, y: ry, w: 55, h: rowH - 8, index: i };
            MENU_BUTTONS.savedWorlds.push({ load: btnData, delete: delData });

            // Load button (main row)
            const hoverLoad = menuHover === "load_" + i;
            ctx.fillStyle = hoverLoad ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.05)";
            ctx.fillRect(btnData.x, btnData.y, btnData.w, btnData.h);
            ctx.strokeStyle = hoverLoad ? "#4ade80" : "#555";
            ctx.lineWidth = hoverLoad ? 2 : 1;
            ctx.strokeRect(btnData.x, btnData.y, btnData.w, btnData.h);

            ctx.fillStyle = "#fff";
            ctx.font = "bold 16px 'Courier New', monospace";
            ctx.textAlign = "left";
            ctx.fillText(save.name, btnData.x + 15, ry + 22);

            ctx.fillStyle = "#9ca3af";
            ctx.font = "12px 'Courier New', monospace";
            ctx.fillText(new Date(save.timestamp).toLocaleString(), btnData.x + 15, ry + 40);

            // Delete button
            const hoverDel = menuHover === "delete_" + i;
            ctx.fillStyle = hoverDel ? "rgba(239,68,68,0.3)" : "rgba(239,68,68,0.1)";
            ctx.fillRect(delData.x, delData.y, delData.w, delData.h);
            ctx.strokeStyle = hoverDel ? "#ef4444" : "#555";
            ctx.lineWidth = hoverDel ? 2 : 1;
            ctx.strokeRect(delData.x, delData.y, delData.w, delData.h);
            ctx.fillStyle = "#ef4444";
            ctx.font = "bold 16px 'Courier New', monospace";
            ctx.textAlign = "center";
            ctx.fillText("DEL", delData.x + delData.w / 2, ry + 30);
        }
    } else {
        ctx.fillStyle = "#555";
        ctx.font = "14px 'Courier New', monospace";
        ctx.textAlign = "center";
        ctx.fillText("No saved worlds yet", canvas.width / 2, 370);
    }

    ctx.lineWidth = 1;
    ctx.textAlign = "center";
}

// --- PAUSE MENU ---
function drawPauseMenu() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const pw = 400, ph = 250;
    const px = (canvas.width - pw) / 2;
    const py = (canvas.height - ph) / 2;
    ctx.fillStyle = "#2a2a3e";
    ctx.fillRect(px, py, pw, ph);
    ctx.strokeStyle = "#4ade80";
    ctx.lineWidth = 3;
    ctx.strokeRect(px, py, pw, ph);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 28px 'Courier New', monospace";
    ctx.textAlign = "center";
    ctx.fillText("PAUSED", canvas.width / 2, py + 45);

    // Resume button
    const resumeY = py + 80;
    PAUSE_BUTTONS.resume = { x: px + 50, y: resumeY, w: pw - 100, h: 50 };
    const hoverResume = menuHover === "resume";
    ctx.fillStyle = hoverResume ? "rgba(74,222,128,0.3)" : "rgba(74,222,128,0.15)";
    ctx.fillRect(PAUSE_BUTTONS.resume.x, resumeY, PAUSE_BUTTONS.resume.w, 50);
    ctx.strokeStyle = "#4ade80";
    ctx.lineWidth = hoverResume ? 3 : 2;
    ctx.strokeRect(PAUSE_BUTTONS.resume.x, resumeY, PAUSE_BUTTONS.resume.w, 50);
    ctx.fillStyle = "#4ade80";
    ctx.font = "bold 20px 'Courier New', monospace";
    ctx.fillText("Resume", canvas.width / 2, resumeY + 33);

    // Save & Quit button
    const sqY = py + 155;
    PAUSE_BUTTONS.saveQuit = { x: px + 50, y: sqY, w: pw - 100, h: 50 };
    const hoverSQ = menuHover === "saveQuit";
    ctx.fillStyle = hoverSQ ? "rgba(239,68,68,0.3)" : "rgba(239,68,68,0.15)";
    ctx.fillRect(PAUSE_BUTTONS.saveQuit.x, sqY, PAUSE_BUTTONS.saveQuit.w, 50);
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = hoverSQ ? 3 : 2;
    ctx.strokeRect(PAUSE_BUTTONS.saveQuit.x, sqY, PAUSE_BUTTONS.saveQuit.w, 50);
    ctx.fillStyle = "#ef4444";
    ctx.font = "bold 20px 'Courier New', monospace";
    ctx.fillText("Save & Quit", canvas.width / 2, sqY + 33);

    ctx.lineWidth = 1;
}

// --- TRANSIENT STATE SCREENS ---
function drawGeneratingScreen() {
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#4ade80";
    ctx.font = "bold 28px 'Courier New', monospace";
    ctx.textAlign = "center";
    ctx.fillText("Generating world...", canvas.width / 2, canvas.height / 2);
    ctx.fillStyle = "#9ca3af";
    ctx.font = "14px 'Courier New', monospace";
    ctx.fillText("This may take a moment...", canvas.width / 2, canvas.height / 2 + 35);
}

function drawLoadingScreen() {
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#4ade80";
    ctx.font = "bold 28px 'Courier New', monospace";
    ctx.textAlign = "center";
    ctx.fillText("Loading world...", canvas.width / 2, canvas.height / 2);
}

function drawSavingScreen() {
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#4ade80";
    ctx.font = "bold 28px 'Courier New', monospace";
    ctx.textAlign = "center";
    ctx.fillText("Saving world...", canvas.width / 2, canvas.height / 2);
}
