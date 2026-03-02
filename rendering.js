// ============================================================
// RENDERING.JS - World and entity drawing
// ============================================================
// Draws the game world: blocks, sky, player, mobs,
// projectiles, and particles. UI is in ui.js!
// ============================================================

// canvas and ctx are defined in constants.js (loaded first)

// --- BLOCKS ---
function drawBlock(blockType, screenX, screenY) {
    const info = BLOCK_INFO[blockType];
    if (!info || !info.color) return;

    // Pressure plate - thin slab, no background block
    if (blockType === BLOCKS.PRESSURE_PLATE) {
        ctx.fillStyle = "#7a7a6a";
        ctx.fillRect(screenX + 4, screenY + 26, BLOCK_SIZE - 8, 4);
        ctx.fillStyle = "#9a9a8a";
        ctx.fillRect(screenX + 5, screenY + 26, BLOCK_SIZE - 10, 2);
        return;
    }

    ctx.fillStyle = info.color;
    ctx.fillRect(screenX, screenY, BLOCK_SIZE, BLOCK_SIZE);

    if (blockType === BLOCKS.GRASS && info.topColor) {
        ctx.fillStyle = info.topColor;
        ctx.fillRect(screenX, screenY, BLOCK_SIZE, 6);
    }
    if (info.spots) {
        ctx.fillStyle = info.spots;
        ctx.fillRect(screenX + 4, screenY + 4, 6, 5);
        ctx.fillRect(screenX + 18, screenY + 12, 7, 5);
        ctx.fillRect(screenX + 8, screenY + 20, 5, 6);
        ctx.fillRect(screenX + 22, screenY + 4, 5, 4);
    }
    if (blockType === BLOCKS.WOOD) {
        ctx.fillStyle = "#7a5c32";
        ctx.fillRect(screenX + 6, screenY, 2, BLOCK_SIZE);
        ctx.fillRect(screenX + 16, screenY, 2, BLOCK_SIZE);
        ctx.fillRect(screenX + 24, screenY, 2, BLOCK_SIZE);
    }
    if (blockType === BLOCKS.PLANKS) {
        ctx.fillStyle = "#b08930";
        ctx.fillRect(screenX, screenY + 7, BLOCK_SIZE, 2);
        ctx.fillRect(screenX, screenY + 15, BLOCK_SIZE, 2);
        ctx.fillRect(screenX, screenY + 23, BLOCK_SIZE, 2);
    }
    if (blockType === BLOCKS.WATER) {
        ctx.fillStyle = "rgba(59, 125, 216, 0.6)";
        ctx.fillRect(screenX, screenY, BLOCK_SIZE, BLOCK_SIZE);
    }
    if (blockType === BLOCKS.LEAVES) {
        ctx.fillStyle = "#3da85a";
        ctx.fillRect(screenX + 2, screenY + 3, 5, 4);
        ctx.fillRect(screenX + 14, screenY + 8, 6, 5);
        ctx.fillRect(screenX + 6, screenY + 18, 5, 4);
        ctx.fillRect(screenX + 20, screenY + 22, 6, 4);
        ctx.fillRect(screenX + 24, screenY + 4, 4, 5);
    }
    if (blockType === BLOCKS.CHEST) {
        // Chest body (dark wood)
        ctx.fillStyle = "#8b6c42";
        ctx.fillRect(screenX + 2, screenY + 6, BLOCK_SIZE - 4, BLOCK_SIZE - 8);
        // Chest lid (lighter)
        ctx.fillStyle = "#a07840";
        ctx.fillRect(screenX + 2, screenY + 2, BLOCK_SIZE - 4, 8);
        // Metal clasp
        ctx.fillStyle = "#c0c0c0";
        ctx.fillRect(screenX + 13, screenY + 8, 6, 4);
        // Dark rim at bottom
        ctx.fillStyle = "#6a4c2a";
        ctx.fillRect(screenX + 2, screenY + BLOCK_SIZE - 4, BLOCK_SIZE - 4, 2);
        // Keyhole
        ctx.fillStyle = "#333";
        ctx.fillRect(screenX + 15, screenY + 10, 2, 2);
    }
    if (blockType === BLOCKS.BED) {
        ctx.fillStyle = "#8b6c42";
        ctx.fillRect(screenX, screenY + 16, BLOCK_SIZE, 16);
        ctx.fillStyle = "#cc3333";
        ctx.fillRect(screenX + 2, screenY + 4, BLOCK_SIZE - 4, 14);
        ctx.fillStyle = "#e8e8e8";
        ctx.fillRect(screenX + 4, screenY + 6, 10, 8);
        ctx.fillStyle = "#aa2222";
        ctx.fillRect(screenX + 2, screenY + 12, BLOCK_SIZE - 4, 2);
    }
    // --- Biome blocks ---
    if (blockType === BLOCKS.DRY_GRASS && info.topColor) {
        ctx.fillStyle = info.topColor;
        ctx.fillRect(screenX, screenY, BLOCK_SIZE, 6);
        // Dry tufts
        ctx.fillStyle = "#9a8a4c";
        ctx.fillRect(screenX + 6, screenY + 8, 3, 4);
        ctx.fillRect(screenX + 18, screenY + 14, 4, 3);
    }
    if (blockType === BLOCKS.SNOW && info.topColor) {
        ctx.fillStyle = info.topColor;
        ctx.fillRect(screenX, screenY, BLOCK_SIZE, 6);
        // Snow sparkles
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.fillRect(screenX + 5, screenY + 10, 2, 2);
        ctx.fillRect(screenX + 20, screenY + 7, 2, 2);
        ctx.fillRect(screenX + 12, screenY + 18, 2, 2);
    }
    if (blockType === BLOCKS.ICE) {
        ctx.fillStyle = "rgba(160, 216, 239, 0.8)";
        ctx.fillRect(screenX, screenY, BLOCK_SIZE, BLOCK_SIZE);
        // Diagonal highlight lines
        ctx.strokeStyle = "rgba(255,255,255,0.3)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(screenX + 4, screenY + 28); ctx.lineTo(screenX + 28, screenY + 4);
        ctx.moveTo(screenX + 10, screenY + 30); ctx.lineTo(screenX + 30, screenY + 10);
        ctx.stroke();
    }
    if (blockType === BLOCKS.CACTUS) {
        // Lighter inner stripe
        ctx.fillStyle = "#3a8a2e";
        ctx.fillRect(screenX + 8, screenY, 16, BLOCK_SIZE);
        // Thorns on edges
        ctx.fillStyle = "#1a5a0e";
        ctx.fillRect(screenX + 2, screenY + 6, 4, 2);
        ctx.fillRect(screenX + 26, screenY + 14, 4, 2);
        ctx.fillRect(screenX + 2, screenY + 22, 4, 2);
        ctx.fillRect(screenX + 26, screenY + 4, 4, 2);
    }
    if (blockType === BLOCKS.SPRUCE_WOOD) {
        ctx.fillStyle = "#4a2a10";
        ctx.fillRect(screenX + 6, screenY, 2, BLOCK_SIZE);
        ctx.fillRect(screenX + 16, screenY, 2, BLOCK_SIZE);
        ctx.fillRect(screenX + 24, screenY, 2, BLOCK_SIZE);
    }
    if (blockType === BLOCKS.SPRUCE_LEAVES) {
        ctx.fillStyle = "#2a5a3a";
        ctx.fillRect(screenX + 3, screenY + 4, 5, 4);
        ctx.fillRect(screenX + 16, screenY + 10, 6, 4);
        ctx.fillRect(screenX + 8, screenY + 20, 5, 4);
        ctx.fillRect(screenX + 22, screenY + 2, 4, 5);
    }
    if (blockType === BLOCKS.ACACIA_WOOD) {
        ctx.fillStyle = "#8a5020";
        ctx.fillRect(screenX + 5, screenY, 2, BLOCK_SIZE);
        ctx.fillRect(screenX + 14, screenY, 2, BLOCK_SIZE);
        ctx.fillRect(screenX + 23, screenY, 2, BLOCK_SIZE);
    }
    if (blockType === BLOCKS.ACACIA_LEAVES) {
        ctx.fillStyle = "#8aba4a";
        ctx.fillRect(screenX + 2, screenY + 3, 5, 4);
        ctx.fillRect(screenX + 14, screenY + 8, 6, 5);
        ctx.fillRect(screenX + 6, screenY + 18, 5, 4);
        ctx.fillRect(screenX + 20, screenY + 22, 6, 4);
    }
    // Door (closed) - solid wood door
    if (blockType === BLOCKS.DOOR_CLOSED) {
        ctx.fillStyle = "#8b6c42";
        ctx.fillRect(screenX, screenY, BLOCK_SIZE, BLOCK_SIZE);
        ctx.fillStyle = "#7a5c32";
        ctx.fillRect(screenX + 2, screenY, 2, BLOCK_SIZE);
        ctx.fillRect(screenX + BLOCK_SIZE - 4, screenY, 2, BLOCK_SIZE);
        ctx.fillStyle = "#9a7c52";
        ctx.fillRect(screenX + 6, screenY + 2, BLOCK_SIZE - 12, BLOCK_SIZE - 4);
        ctx.fillStyle = "#c0c0c0";
        ctx.fillRect(screenX + BLOCK_SIZE - 10, screenY + 14, 4, 4);
    }
    // Door (open) - thin frame on one side
    if (blockType === BLOCKS.DOOR_OPEN) {
        ctx.fillStyle = "#8b6c42";
        ctx.fillRect(screenX, screenY, 6, BLOCK_SIZE);
        ctx.fillStyle = "#7a5c32";
        ctx.fillRect(screenX + 2, screenY, 2, BLOCK_SIZE);
        ctx.fillStyle = "#c0c0c0";
        ctx.fillRect(screenX + 2, screenY + 14, 2, 4);
        return; // mostly transparent
    }
    // Gravel
    if (blockType === BLOCKS.GRAVEL) {
        ctx.fillStyle = "#7a7a6a";
        ctx.fillRect(screenX + 3, screenY + 5, 5, 4);
        ctx.fillRect(screenX + 15, screenY + 3, 6, 5);
        ctx.fillRect(screenX + 8, screenY + 15, 4, 4);
        ctx.fillRect(screenX + 20, screenY + 20, 5, 5);
        ctx.fillRect(screenX + 4, screenY + 24, 6, 4);
        ctx.fillStyle = "#9a9a8a";
        ctx.fillRect(screenX + 12, screenY + 10, 5, 4);
        ctx.fillRect(screenX + 24, screenY + 8, 4, 5);
    }
    // Lava - animated orange-red
    if (blockType === BLOCKS.LAVA) {
        ctx.fillStyle = "#e04010";
        ctx.fillRect(screenX, screenY, BLOCK_SIZE, BLOCK_SIZE);
        const t = performance.now() * 0.003;
        const shimX = Math.sin(t + screenX * 0.1) * 4 + 8;
        const shimY = Math.cos(t + screenY * 0.1) * 4 + 8;
        ctx.fillStyle = "rgba(255, 200, 50, 0.4)";
        ctx.fillRect(screenX + shimX, screenY + shimY, 12, 8);
        ctx.fillStyle = "rgba(255, 160, 20, 0.3)";
        ctx.fillRect(screenX + shimX + 10, screenY + shimY + 10, 10, 6);
        ctx.fillStyle = "rgba(255, 255, 100, 0.3)";
        ctx.fillRect(screenX + 10, screenY + 14, 6, 4);
        return; // no border
    }
    // Obsidian - dark purple-black
    if (blockType === BLOCKS.OBSIDIAN) {
        ctx.fillStyle = "#2a1a3e";
        ctx.fillRect(screenX + 6, screenY + 4, 5, 6);
        ctx.fillRect(screenX + 18, screenY + 16, 6, 5);
        ctx.fillRect(screenX + 10, screenY + 24, 4, 4);
        ctx.fillStyle = "#3a2a4e";
        ctx.fillRect(screenX + 22, screenY + 6, 4, 3);
    }
    // Nether Portal - animated purple swirl
    if (blockType === BLOCKS.NETHER_PORTAL) {
        const t = performance.now() * 0.004;
        ctx.fillStyle = "rgba(136, 0, 204, 0.7)";
        ctx.fillRect(screenX, screenY, BLOCK_SIZE, BLOCK_SIZE);
        ctx.fillStyle = "rgba(200, 100, 255, 0.4)";
        const sy1 = Math.sin(t + screenX * 0.05) * 6 + 12;
        const sy2 = Math.cos(t * 1.3 + screenY * 0.05) * 6 + 12;
        ctx.fillRect(screenX + 4, screenY + sy1, 8, 10);
        ctx.fillRect(screenX + 16, screenY + sy2, 10, 8);
        ctx.fillStyle = "rgba(255, 180, 255, 0.3)";
        ctx.fillRect(screenX + 10, screenY + 8, 6, 16);
        return; // no border
    }
    // Netherrack
    if (blockType === BLOCKS.NETHERRACK) {
        ctx.fillStyle = "#602020";
        ctx.fillRect(screenX + 4, screenY + 6, 6, 5);
        ctx.fillRect(screenX + 18, screenY + 14, 5, 6);
        ctx.fillRect(screenX + 8, screenY + 22, 7, 4);
    }
    // Soul Sand
    if (blockType === BLOCKS.SOUL_SAND) {
        ctx.fillStyle = "#3a2a1a";
        ctx.fillRect(screenX + 3, screenY + 4, 7, 6);
        ctx.fillRect(screenX + 16, screenY + 12, 8, 7);
        ctx.fillStyle = "#2a1a10";
        ctx.fillRect(screenX + 8, screenY + 8, 3, 3);
        ctx.fillRect(screenX + 20, screenY + 8, 3, 3);
        ctx.fillRect(screenX + 12, screenY + 16, 6, 2);
    }
    // Glowstone
    if (blockType === BLOCKS.GLOWSTONE) {
        ctx.fillStyle = "#eeb820";
        ctx.fillRect(screenX + 4, screenY + 4, 8, 8);
        ctx.fillRect(screenX + 18, screenY + 12, 6, 6);
        ctx.fillRect(screenX + 8, screenY + 20, 10, 6);
        ctx.fillStyle = "#fff8b0";
        ctx.fillRect(screenX + 6, screenY + 6, 4, 4);
        ctx.fillRect(screenX + 20, screenY + 14, 3, 3);
    }
    // Nether Brick
    if (blockType === BLOCKS.NETHER_BRICK) {
        ctx.fillStyle = "#4a2020";
        ctx.fillRect(screenX, screenY + 3, BLOCK_SIZE, 2);
        ctx.fillRect(screenX, screenY + 11, BLOCK_SIZE, 2);
        ctx.fillRect(screenX, screenY + 19, BLOCK_SIZE, 2);
        ctx.fillRect(screenX, screenY + 27, BLOCK_SIZE, 2);
        ctx.fillRect(screenX + 8, screenY, 2, BLOCK_SIZE);
        ctx.fillRect(screenX + 24, screenY, 2, BLOCK_SIZE);
    }
    // Copper Ore
    if (blockType === BLOCKS.COPPER) {
        ctx.fillStyle = "#e07040";
        ctx.fillRect(screenX + 5, screenY + 4, 6, 5);
        ctx.fillRect(screenX + 18, screenY + 14, 5, 6);
        ctx.fillRect(screenX + 10, screenY + 22, 6, 4);
        ctx.fillStyle = "#c06030";
        ctx.fillRect(screenX + 22, screenY + 6, 4, 4);
    }
    // Torch - special shape, no block border
    if (blockType === BLOCKS.TORCH) {
        // Stick
        ctx.fillStyle = "#8b6c42";
        ctx.fillRect(screenX + 13, screenY + 8, 6, 20);
        // Flame base (orange)
        ctx.fillStyle = "#e8a030";
        ctx.fillRect(screenX + 11, screenY + 2, 10, 10);
        // Flame tip (yellow)
        ctx.fillStyle = "#ffdd44";
        ctx.fillRect(screenX + 13, screenY, 6, 6);
        // Flame highlight
        ctx.fillStyle = "#fff8b0";
        ctx.fillRect(screenX + 14, screenY + 3, 4, 3);
        return; // no border for torch
    }
    ctx.strokeStyle = "rgba(0, 0, 0, 0.15)";
    ctx.strokeRect(screenX, screenY, BLOCK_SIZE, BLOCK_SIZE);
}

// --- ITEM ICONS (for inventory) ---
function drawItemIcon(itemId, x, y, size) {
    if (itemId === 0) return;

    // Torch mini icon (before generic block path)
    if (itemId === BLOCKS.TORCH) {
        ctx.fillStyle = "#8b6c42";
        ctx.fillRect(x + size * 0.4, y + size * 0.3, size * 0.2, size * 0.6);
        ctx.fillStyle = "#e8a030";
        ctx.fillRect(x + size * 0.3, y + size * 0.05, size * 0.4, size * 0.35);
        ctx.fillStyle = "#ffdd44";
        ctx.fillRect(x + size * 0.35, y, size * 0.3, size * 0.2);
        return;
    }
    // Cactus mini icon
    if (itemId === BLOCKS.CACTUS) {
        ctx.fillStyle = "#2d6a1e";
        ctx.fillRect(x + size * 0.3, y + size * 0.1, size * 0.4, size * 0.8);
        ctx.fillStyle = "#3a8a2e";
        ctx.fillRect(x + size * 0.35, y + size * 0.15, size * 0.3, size * 0.7);
        // Thorns
        ctx.fillStyle = "#1a5a0e";
        ctx.fillRect(x + size * 0.15, y + size * 0.3, size * 0.15, 2);
        ctx.fillRect(x + size * 0.7, y + size * 0.55, size * 0.15, 2);
        return;
    }

    // Door mini icon
    if (itemId === BLOCKS.DOOR_CLOSED) {
        ctx.fillStyle = "#8b6c42";
        ctx.fillRect(x + size * 0.15, y + size * 0.05, size * 0.7, size * 0.9);
        ctx.fillStyle = "#7a5c32";
        ctx.fillRect(x + size * 0.2, y + size * 0.1, size * 0.15, size * 0.8);
        ctx.fillRect(x + size * 0.65, y + size * 0.1, size * 0.15, size * 0.8);
        ctx.fillStyle = "#c0c0c0";
        ctx.fillRect(x + size * 0.6, y + size * 0.45, size * 0.1, size * 0.1);
        return;
    }
    // Pressure plate icon
    if (itemId === BLOCKS.PRESSURE_PLATE) {
        ctx.fillStyle = "#7a7a6a";
        ctx.fillRect(x + size * 0.1, y + size * 0.65, size * 0.8, size * 0.2);
        ctx.fillStyle = "#9a9a8a";
        ctx.fillRect(x + size * 0.15, y + size * 0.65, size * 0.7, size * 0.1);
        return;
    }

    if (isBlockId(itemId)) {
        const info = BLOCK_INFO[itemId];
        if (!info || !info.color) return;
        ctx.fillStyle = info.color;
        ctx.fillRect(x, y, size, size);
        if (info.topColor) {
            ctx.fillStyle = info.topColor;
            ctx.fillRect(x, y, size, Math.max(2, size * 0.2));
        }
        if (info.spots) {
            ctx.fillStyle = info.spots;
            const s = Math.max(2, size * 0.2);
            ctx.fillRect(x + size * 0.15, y + size * 0.2, s, s);
            ctx.fillRect(x + size * 0.55, y + size * 0.5, s, s);
        }
        if (itemId === BLOCKS.PLANKS) {
            ctx.fillStyle = "#b08930";
            ctx.fillRect(x, y + size * 0.3, size, 1);
            ctx.fillRect(x, y + size * 0.6, size, 1);
        }
        if (itemId === BLOCKS.CHEST) {
            ctx.fillStyle = "#8b6c42";
            ctx.fillRect(x + 2, y + size * 0.2, size - 4, size * 0.7);
            ctx.fillStyle = "#a07840";
            ctx.fillRect(x + 2, y + size * 0.1, size - 4, size * 0.25);
            ctx.fillStyle = "#c0c0c0";
            ctx.fillRect(x + size * 0.4, y + size * 0.3, size * 0.2, size * 0.15);
        }
        if (itemId === BLOCKS.BED) {
            ctx.fillStyle = "#8b6c42";
            ctx.fillRect(x, y + size * 0.5, size, size * 0.5);
            ctx.fillStyle = "#cc3333";
            ctx.fillRect(x + 2, y + size * 0.15, size - 4, size * 0.4);
            ctx.fillStyle = "#e8e8e8";
            ctx.fillRect(x + 3, y + size * 0.2, size * 0.3, size * 0.25);
        }
    } else if (itemId === ITEMS.STICK) {
        ctx.fillStyle = "#8b6c42";
        ctx.save();
        ctx.translate(x + size / 2, y + size / 2);
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-2, -size * 0.4, 4, size * 0.8);
        ctx.restore();
    } else if (itemId === ITEMS.RAW_PORKCHOP) {
        ctx.fillStyle = "#e88a8a";
        ctx.fillRect(x + 2, y + 4, size - 4, size - 6);
        ctx.fillStyle = "#c46060";
        ctx.fillRect(x + 4, y + 6, size - 10, size - 12);
    } else if (itemId === ITEMS.ROTTEN_FLESH) {
        ctx.fillStyle = "#7a9a4a";
        ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
        ctx.fillStyle = "#5a7a3a";
        ctx.fillRect(x + 5, y + 5, size - 10, size - 10);
    } else if (itemId === ITEMS.BONE) {
        ctx.fillStyle = "#e8e8d0";
        ctx.fillRect(x + size * 0.3, y + 2, size * 0.4, size - 4);
        ctx.fillRect(x + size * 0.15, y + 2, size * 0.7, size * 0.25);
        ctx.fillRect(x + size * 0.15, y + size * 0.7, size * 0.7, size * 0.25);
    } else if (itemId === ITEMS.GUNPOWDER) {
        ctx.fillStyle = "#555555";
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#333333";
        ctx.fillRect(x + size * 0.3, y + size * 0.3, 3, 3);
        ctx.fillRect(x + size * 0.55, y + size * 0.5, 3, 3);
    } else if (itemId === ITEMS.WOOL) {
        ctx.fillStyle = "#e8e8e8";
        ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
        ctx.fillStyle = "#f4f4f4";
        ctx.fillRect(x + size * 0.2, y + size * 0.15, size * 0.3, size * 0.3);
        ctx.fillRect(x + size * 0.5, y + size * 0.45, size * 0.3, size * 0.3);
    } else if (itemId === ITEMS.LEATHER) {
        ctx.fillStyle = "#8B6538";
        ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
        ctx.fillStyle = "#a07848";
        ctx.fillRect(x + 4, y + 4, size - 8, size - 8);
    } else if (itemId === ITEMS.STEAK) {
        ctx.fillStyle = "#aa3333";
        ctx.fillRect(x + 2, y + 4, size - 4, size - 6);
        ctx.fillStyle = "#cc5555";
        ctx.fillRect(x + 4, y + 6, size - 10, size - 12);
        ctx.fillStyle = "#e8ccaa";
        ctx.fillRect(x + size * 0.6, y + size * 0.3, size * 0.2, size * 0.4);
    } else if (itemId === ITEMS.MUTTON) {
        ctx.fillStyle = "#d88888";
        ctx.fillRect(x + 2, y + 4, size - 4, size - 6);
        ctx.fillStyle = "#eaaaaa";
        ctx.fillRect(x + 4, y + 6, size - 10, size - 12);
        ctx.fillStyle = "#e8ccaa";
        ctx.fillRect(x + size * 0.15, y + size * 0.6, size * 0.2, size * 0.25);
    } else if (itemId === ITEMS.FLINT) {
        ctx.fillStyle = "#555555";
        ctx.beginPath();
        ctx.moveTo(x + size * 0.5, y + size * 0.1);
        ctx.lineTo(x + size * 0.8, y + size * 0.5);
        ctx.lineTo(x + size * 0.6, y + size * 0.9);
        ctx.lineTo(x + size * 0.2, y + size * 0.7);
        ctx.lineTo(x + size * 0.3, y + size * 0.3);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#777777";
        ctx.fillRect(x + size * 0.35, y + size * 0.3, size * 0.2, size * 0.3);
    } else if (itemId === ITEMS.FLINT_AND_STEEL) {
        ctx.fillStyle = "#555555";
        ctx.fillRect(x + size * 0.15, y + size * 0.3, size * 0.3, size * 0.5);
        ctx.fillStyle = "#cccccc";
        ctx.fillRect(x + size * 0.5, y + size * 0.2, size * 0.35, size * 0.15);
        ctx.fillRect(x + size * 0.55, y + size * 0.2, size * 0.1, size * 0.6);
        ctx.fillStyle = "#ffaa00";
        ctx.fillRect(x + size * 0.4, y + size * 0.15, 3, 3);
    } else if (itemId === ITEMS.BULLETS) {
        ctx.fillStyle = "#c4a030";
        ctx.fillRect(x + size * 0.2, y + size * 0.3, size * 0.15, size * 0.4);
        ctx.fillRect(x + size * 0.45, y + size * 0.3, size * 0.15, size * 0.4);
        ctx.fillRect(x + size * 0.7, y + size * 0.3, size * 0.15, size * 0.4);
        ctx.fillStyle = "#dd8844";
        ctx.fillRect(x + size * 0.2, y + size * 0.2, size * 0.15, size * 0.15);
        ctx.fillRect(x + size * 0.45, y + size * 0.2, size * 0.15, size * 0.15);
        ctx.fillRect(x + size * 0.7, y + size * 0.2, size * 0.15, size * 0.15);
    } else if (itemId === ITEMS.PISTOL) {
        ctx.fillStyle = "#666666";
        ctx.fillRect(x + size * 0.1, y + size * 0.25, size * 0.7, size * 0.2);
        ctx.fillRect(x + size * 0.3, y + size * 0.4, size * 0.2, size * 0.4);
        ctx.fillStyle = "#888888";
        ctx.fillRect(x + size * 0.1, y + size * 0.28, size * 0.65, size * 0.14);
        ctx.fillStyle = "#555555";
        ctx.fillRect(x + size * 0.75, y + size * 0.3, size * 0.1, size * 0.1);
    } else if (itemId === ITEMS.AK47) {
        ctx.fillStyle = "#5a5a3a";
        ctx.fillRect(x + size * 0.05, y + size * 0.3, size * 0.9, size * 0.15);
        ctx.fillStyle = "#8b6c42";
        ctx.fillRect(x + size * 0.55, y + size * 0.4, size * 0.3, size * 0.35);
        ctx.fillStyle = "#4a4a2a";
        ctx.fillRect(x + size * 0.05, y + size * 0.32, size * 0.5, size * 0.1);
        ctx.fillStyle = "#666";
        ctx.fillRect(x + size * 0.2, y + size * 0.2, size * 0.15, size * 0.12);
    } else if (itemId === ITEMS.ENDER_PEARL) {
        ctx.fillStyle = "#1a3a2a";
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#2a5a3a";
        ctx.beginPath();
        ctx.arc(x + size * 0.45, y + size * 0.4, size * 0.15, 0, Math.PI * 2);
        ctx.fill();
    } else if (itemId === ITEMS.FEATHER) {
        // Quill shape
        ctx.fillStyle = "#f5f5f5";
        ctx.beginPath();
        ctx.moveTo(x + size * 0.5, y + size * 0.05);
        ctx.lineTo(x + size * 0.7, y + size * 0.5);
        ctx.lineTo(x + size * 0.55, y + size * 0.9);
        ctx.lineTo(x + size * 0.45, y + size * 0.9);
        ctx.lineTo(x + size * 0.3, y + size * 0.5);
        ctx.closePath();
        ctx.fill();
        // Shaft
        ctx.strokeStyle = "#aaa";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + size * 0.5, y + size * 0.05);
        ctx.lineTo(x + size * 0.5, y + size * 0.95);
        ctx.stroke();
    } else if (itemId === ITEMS.RAW_CHICKEN) {
        // Pinkish raw meat
        ctx.fillStyle = "#e8a0a0";
        ctx.fillRect(x + size * 0.2, y + size * 0.15, size * 0.6, size * 0.55);
        // Drumstick bone
        ctx.fillStyle = "#f0d8b0";
        ctx.fillRect(x + size * 0.35, y + size * 0.6, size * 0.12, size * 0.35);
        ctx.fillRect(x + size * 0.55, y + size * 0.6, size * 0.12, size * 0.35);
        // Darker shading
        ctx.fillStyle = "rgba(0,0,0,0.1)";
        ctx.fillRect(x + size * 0.2, y + size * 0.45, size * 0.6, size * 0.15);
    } else if (itemId === ITEMS.ROCKET_LAUNCHER) {
        // Olive green launcher tube
        ctx.fillStyle = "#556b2f";
        ctx.fillRect(x + size * 0.05, y + size * 0.25, size * 0.85, size * 0.25);
        // Wider opening at front
        ctx.fillStyle = "#3a4a1f";
        ctx.fillRect(x + size * 0.0, y + size * 0.2, size * 0.15, size * 0.35);
        // Grip
        ctx.fillStyle = "#444";
        ctx.fillRect(x + size * 0.5, y + size * 0.45, size * 0.15, size * 0.35);
        // Sight on top
        ctx.fillStyle = "#333";
        ctx.fillRect(x + size * 0.3, y + size * 0.15, size * 0.1, size * 0.12);
    } else if (itemId === ITEMS.ROCKET) {
        // Rocket body (red)
        ctx.fillStyle = "#cc3333";
        ctx.fillRect(x + size * 0.3, y + size * 0.1, size * 0.4, size * 0.6);
        // Nose cone
        ctx.fillStyle = "#aaa";
        ctx.beginPath();
        ctx.moveTo(x + size * 0.5, y + size * 0.0);
        ctx.lineTo(x + size * 0.7, y + size * 0.15);
        ctx.lineTo(x + size * 0.3, y + size * 0.15);
        ctx.closePath();
        ctx.fill();
        // Fins
        ctx.fillStyle = "#cc3333";
        ctx.fillRect(x + size * 0.2, y + size * 0.6, size * 0.15, size * 0.2);
        ctx.fillRect(x + size * 0.65, y + size * 0.6, size * 0.15, size * 0.2);
        // Exhaust
        ctx.fillStyle = "#ff8800";
        ctx.fillRect(x + size * 0.35, y + size * 0.7, size * 0.3, size * 0.15);
    } else if (ITEM_INFO[itemId] && ITEM_INFO[itemId].armorType) {
        const ac = ITEM_INFO[itemId].color;
        const at = ITEM_INFO[itemId].armorType;
        if (at === "helmet") {
            ctx.fillStyle = ac;
            ctx.fillRect(x + size * 0.1, y + size * 0.15, size * 0.8, size * 0.7);
            ctx.fillStyle = "rgba(0,0,0,0.2)";
            ctx.fillRect(x + size * 0.2, y + size * 0.55, size * 0.6, size * 0.3);
        } else if (at === "chestplate") {
            ctx.fillStyle = ac;
            ctx.fillRect(x + size * 0.1, y + size * 0.05, size * 0.8, size * 0.9);
            ctx.fillStyle = "rgba(0,0,0,0.15)";
            ctx.fillRect(x + size * 0.3, y + size * 0.05, size * 0.4, size * 0.35);
            ctx.fillRect(x + size * 0.35, y + size * 0.6, size * 0.3, size * 0.35);
        } else if (at === "leggings") {
            ctx.fillStyle = ac;
            ctx.fillRect(x + size * 0.1, y + size * 0.05, size * 0.8, size * 0.4);
            ctx.fillRect(x + size * 0.1, y + size * 0.05, size * 0.35, size * 0.9);
            ctx.fillRect(x + size * 0.55, y + size * 0.05, size * 0.35, size * 0.9);
        } else if (at === "boots") {
            ctx.fillStyle = ac;
            ctx.fillRect(x + size * 0.05, y + size * 0.4, size * 0.35, size * 0.55);
            ctx.fillRect(x + size * 0.6, y + size * 0.4, size * 0.35, size * 0.55);
            ctx.fillRect(x + size * 0.0, y + size * 0.7, size * 0.45, size * 0.25);
            ctx.fillRect(x + size * 0.55, y + size * 0.7, size * 0.45, size * 0.25);
        }
    } else if (ITEM_INFO[itemId] && ITEM_INFO[itemId].toolType) {
        const info = ITEM_INFO[itemId];
        const tc = info.color;
        const hc = "#8b6c42";
        if (info.toolType === "pickaxe") {
            ctx.fillStyle = hc;
            ctx.save(); ctx.translate(x + size / 2, y + size / 2); ctx.rotate(Math.PI / 4);
            ctx.fillRect(-2, -2, 4, size * 0.6);
            ctx.fillStyle = tc;
            ctx.fillRect(-size * 0.35, -size * 0.3, size * 0.7, 4);
            ctx.restore();
        } else if (info.toolType === "sword") {
            ctx.save(); ctx.translate(x + size / 2, y + size / 2); ctx.rotate(-Math.PI / 4);
            ctx.fillStyle = tc;
            ctx.fillRect(-2, -size * 0.45, 5, size * 0.5);
            ctx.fillStyle = hc;
            ctx.fillRect(-2, size * 0.05, 4, size * 0.35);
            ctx.fillStyle = "#444";
            ctx.fillRect(-5, 0, 10, 3);
            ctx.restore();
        } else if (info.toolType === "axe") {
            ctx.fillStyle = hc;
            ctx.save(); ctx.translate(x + size / 2, y + size / 2); ctx.rotate(Math.PI / 4);
            ctx.fillRect(-2, -2, 4, size * 0.6);
            ctx.fillStyle = tc;
            ctx.fillRect(-2, -size * 0.35, size * 0.35, size * 0.3);
            ctx.restore();
        }
    }
}

// --- SKY ---
function drawSky(dayBrightness) {
    if (inNether) {
        ctx.fillStyle = "#1a0505";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "rgba(80, 10, 5, 0.3)";
        ctx.fillRect(0, 0, canvas.width, canvas.height * 0.3);
        return;
    }
    const r = Math.floor(10 + 125 * dayBrightness);
    const g = Math.floor(10 + 196 * dayBrightness);
    const b = Math.floor(40 + 195 * dayBrightness);
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width * 0.5 + Math.cos(timeOfDay * Math.PI * 2 - Math.PI / 2) * 350;
    const cy = canvas.height * 0.3 - Math.sin(timeOfDay * Math.PI * 2 - Math.PI / 2) * 200;

    if (dayBrightness > 0.3) {
        ctx.fillStyle = `rgba(255, 255, 100, ${dayBrightness})`;
        ctx.beginPath(); ctx.arc(cx, cy, 30, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = `rgba(255, 255, 100, ${dayBrightness * 0.2})`;
        ctx.beginPath(); ctx.arc(cx, cy, 50, 0, Math.PI * 2); ctx.fill();
    } else {
        ctx.fillStyle = `rgba(220, 220, 240, ${1 - dayBrightness})`;
        ctx.beginPath(); ctx.arc(cx, cy, 25, 0, Math.PI * 2); ctx.fill();
    }
    if (dayBrightness < 0.5) {
        const a = (0.5 - dayBrightness) * 1.6;
        ctx.fillStyle = `rgba(255, 255, 255, ${a})`;
        for (let i = 0; i < 50; i++) {
            ctx.fillRect((i * 137.5 + 50) % canvas.width, (i * 97.3 + 20) % (canvas.height * 0.5), 2, 2);
        }
    }
}

// --- PLAYER ---
function drawPlayer() {
    const sx = player.x - camera.x + screenShake.x;
    const sy = player.y - camera.y + screenShake.y;

    if (player.invincibleTimer > 0 && Math.floor(player.invincibleTimer / 80) % 2 === 0) {
        ctx.globalAlpha = 0.4;
    }

    // Body
    ctx.fillStyle = "#00a8a8";
    ctx.fillRect(sx + 4, sy + 14, 16, 16);
    // Head
    ctx.fillStyle = "#c69c6d";
    ctx.fillRect(sx + 4, sy, 16, 14);
    // Eyes
    ctx.fillStyle = "#ffffff";
    if (player.facing === 1) {
        ctx.fillRect(sx + 12, sy + 4, 6, 4);
        ctx.fillStyle = "#4a3728"; ctx.fillRect(sx + 15, sy + 4, 3, 4);
    } else {
        ctx.fillRect(sx + 6, sy + 4, 6, 4);
        ctx.fillStyle = "#4a3728"; ctx.fillRect(sx + 6, sy + 4, 3, 4);
    }
    // Hair
    ctx.fillStyle = "#4a3728";
    ctx.fillRect(sx + 4, sy, 16, 3);
    ctx.fillRect(player.facing === 1 ? sx + 4 : sx + 16, sy, 4, 8);
    // Legs
    ctx.fillStyle = "#3b3b8f";
    ctx.fillRect(sx + 4, sy + 30, 7, 16); ctx.fillRect(sx + 13, sy + 30, 7, 16);
    // Shoes
    ctx.fillStyle = "#5a5a5a";
    ctx.fillRect(sx + 4, sy + 42, 7, 4); ctx.fillRect(sx + 13, sy + 42, 7, 4);
    // Arms
    ctx.fillStyle = "#00a8a8";
    ctx.fillRect(sx - 2, sy + 14, 6, 14); ctx.fillRect(sx + 20, sy + 14, 6, 14);
    // Hands
    ctx.fillStyle = "#c69c6d";
    ctx.fillRect(sx - 2, sy + 26, 6, 4); ctx.fillRect(sx + 20, sy + 26, 6, 4);

    // Armor overlay
    const helmetColor = getArmorColor("helmet");
    if (helmetColor) {
        ctx.fillStyle = helmetColor;
        ctx.globalAlpha = Math.max(ctx.globalAlpha, 0.4);
        ctx.fillRect(sx + 3, sy - 1, 18, 4);
        ctx.fillRect(sx + 3, sy + 3, 3, 8);
        ctx.fillRect(sx + 18, sy + 3, 3, 8);
        if (player.invincibleTimer > 0 && Math.floor(player.invincibleTimer / 80) % 2 === 0) ctx.globalAlpha = 0.4;
    }
    const chestColor = getArmorColor("chestplate");
    if (chestColor) {
        ctx.fillStyle = chestColor;
        ctx.fillRect(sx + 4, sy + 14, 16, 16);
        ctx.fillRect(sx - 2, sy + 14, 6, 12);
        ctx.fillRect(sx + 20, sy + 14, 6, 12);
    }
    const legColor = getArmorColor("leggings");
    if (legColor) {
        ctx.fillStyle = legColor;
        ctx.fillRect(sx + 4, sy + 30, 7, 12);
        ctx.fillRect(sx + 13, sy + 30, 7, 12);
    }
    const bootColor = getArmorColor("boots");
    if (bootColor) {
        ctx.fillStyle = bootColor;
        ctx.fillRect(sx + 3, sy + 40, 8, 6);
        ctx.fillRect(sx + 13, sy + 40, 8, 6);
    }

    // Held item
    const held = inventory.slots[inventory.selectedSlot];
    if (held.count > 0 && held.itemId !== 0) {
        const hx = player.facing === 1 ? sx + 22 : sx - 8;
        drawItemIcon(held.itemId, hx, sy + 16, 14);
    }

    ctx.globalAlpha = 1;
}

// --- MOBS ---
function drawMob(mob) {
    const def = MOB_DEFS[mob.type];
    const sx = mob.x - camera.x + screenShake.x;
    const sy = mob.y - camera.y + screenShake.y;
    const isHurt = mob.hurtTimer > 0;

    if (mob.type === "zombie") {
        ctx.fillStyle = isHurt ? "#ff6666" : "#5a8a4a";
        ctx.fillRect(sx + 4, sy + 14, 16, 16);
        ctx.fillStyle = isHurt ? "#ff8888" : "#6a9a5a";
        ctx.fillRect(sx + 4, sy, 16, 14);
        ctx.fillStyle = "#ff0000";
        if (mob.facing === 1) {
            ctx.fillRect(sx + 12, sy + 4, 4, 4); ctx.fillRect(sx + 18, sy + 4, 0, 0);
        } else {
            ctx.fillRect(sx + 8, sy + 4, 4, 4);
        }
        ctx.fillStyle = isHurt ? "#cc8866" : "#4a6a3a";
        ctx.fillRect(sx + 4, sy + 14, 16, 16);
        ctx.fillStyle = "#3b3b6f";
        ctx.fillRect(sx + 4, sy + 30, 7, 16); ctx.fillRect(sx + 13, sy + 30, 7, 16);
        ctx.fillStyle = isHurt ? "#ff8888" : "#6a9a5a";
        const armDir = mob.facing === 1 ? 1 : -1;
        ctx.fillRect(sx + (armDir === 1 ? 18 : -10), sy + 14, 16, 5);
    }

    else if (mob.type === "skeleton") {
        ctx.fillStyle = isHurt ? "#ff8888" : "#d4d4d4";
        ctx.fillRect(sx + 6, sy + 14, 10, 16);
        ctx.fillRect(sx + 4, sy, 14, 14);
        ctx.fillStyle = "#222222";
        ctx.fillRect(sx + 6, sy + 4, 4, 4);
        ctx.fillRect(sx + 12, sy + 4, 4, 4);
        ctx.fillRect(sx + 8, sy + 10, 6, 2);
        ctx.fillStyle = isHurt ? "#ff8888" : "#bbbbbb";
        ctx.fillRect(sx + 6, sy + 30, 4, 16); ctx.fillRect(sx + 12, sy + 30, 4, 16);
        ctx.fillStyle = "#8b6c42";
        const bx = mob.facing === 1 ? sx + 18 : sx - 6;
        ctx.fillRect(bx, sy + 8, 3, 20);
        ctx.fillStyle = "#cccccc";
        ctx.fillRect(bx + 1, sy + 8, 1, 20);
    }

    else if (mob.type === "creeper") {
        const fuseFlash = mob.fusing && Math.floor(mob.fuseTimer / 100) % 2 === 0;
        ctx.fillStyle = fuseFlash ? "#ffffff" : (isHurt ? "#ff8888" : "#4a8a4a");
        ctx.fillRect(sx + 4, sy, 12, 28);
        ctx.fillRect(sx + 2, sy + 28, 6, 14);
        ctx.fillRect(sx + 12, sy + 28, 6, 14);
        ctx.fillStyle = fuseFlash ? "#888888" : "#1a3a1a";
        ctx.fillRect(sx + 5, sy + 6, 4, 4);
        ctx.fillRect(sx + 11, sy + 6, 4, 4);
        ctx.fillRect(sx + 8, sy + 12, 4, 2);
        ctx.fillRect(sx + 6, sy + 14, 8, 4);
        ctx.fillRect(sx + 8, sy + 18, 4, 2);
    }

    else if (mob.type === "pig") {
        ctx.fillStyle = isHurt ? "#ff8888" : "#e8a0a0";
        ctx.fillRect(sx + 2, sy, 26, 14);
        const hx = mob.facing === 1 ? sx + 22 : sx - 6;
        ctx.fillRect(hx, sy - 2, 12, 12);
        ctx.fillStyle = isHurt ? "#ffaaaa" : "#f0c0c0";
        ctx.fillRect(hx + 3, sy + 2, 6, 5);
        ctx.fillStyle = "#c08080";
        ctx.fillRect(hx + 4, sy + 4, 2, 2);
        ctx.fillRect(hx + 6, sy + 4, 2, 2);
        ctx.fillStyle = "#333333";
        ctx.fillRect(hx + 2, sy, 2, 2);
        ctx.fillRect(hx + 8, sy, 2, 2);
        ctx.fillStyle = isHurt ? "#ff8888" : "#d08080";
        ctx.fillRect(sx + 4, sy + 14, 5, 8);
        ctx.fillRect(sx + 21, sy + 14, 5, 8);
    }

    else if (mob.type === "cow") {
        // Body
        ctx.fillStyle = isHurt ? "#ff8888" : "#8B6538";
        ctx.fillRect(sx + 2, sy, 26, 14);
        // Head
        const hx = mob.facing === 1 ? sx + 22 : sx - 6;
        ctx.fillStyle = isHurt ? "#ffaaaa" : "#6a4a28";
        ctx.fillRect(hx, sy - 2, 12, 12);
        // Horns
        ctx.fillStyle = "#e8e0d0";
        ctx.fillRect(hx + 1, sy - 5, 3, 4);
        ctx.fillRect(hx + 8, sy - 5, 3, 4);
        // Eyes
        ctx.fillStyle = "#333333";
        ctx.fillRect(hx + 2, sy, 2, 2);
        ctx.fillRect(hx + 8, sy, 2, 2);
        // Snout
        ctx.fillStyle = isHurt ? "#ffcccc" : "#c0a080";
        ctx.fillRect(hx + 3, sy + 4, 6, 4);
        // White spots
        ctx.fillStyle = "#e8e0d0";
        ctx.fillRect(sx + 8, sy + 2, 6, 5);
        ctx.fillRect(sx + 18, sy + 6, 5, 4);
        // Legs
        ctx.fillStyle = isHurt ? "#ff8888" : "#6a4a28";
        ctx.fillRect(sx + 4, sy + 14, 5, 8);
        ctx.fillRect(sx + 21, sy + 14, 5, 8);
    }

    else if (mob.type === "sheep") {
        // Fluffy body
        ctx.fillStyle = isHurt ? "#ff8888" : "#e8e8e8";
        ctx.fillRect(sx + 2, sy, 24, 12);
        // Puff top
        ctx.fillStyle = isHurt ? "#ffaaaa" : "#f4f4f4";
        ctx.fillRect(sx + 1, sy - 2, 26, 3);
        ctx.fillRect(sx, sy + 1, 28, 4);
        // Head
        const hx = mob.facing === 1 ? sx + 20 : sx - 4;
        ctx.fillStyle = isHurt ? "#ffaaaa" : "#888888";
        ctx.fillRect(hx, sy - 1, 10, 10);
        // Eyes
        ctx.fillStyle = "#333333";
        ctx.fillRect(hx + 2, sy + 1, 2, 2);
        ctx.fillRect(hx + 6, sy + 1, 2, 2);
        // Legs
        ctx.fillStyle = isHurt ? "#ff8888" : "#777777";
        ctx.fillRect(sx + 4, sy + 12, 4, 8);
        ctx.fillRect(sx + 20, sy + 12, 4, 8);
    }

    else if (mob.type === "villager") {
        // Robe/body
        ctx.fillStyle = isHurt ? "#ff8888" : "#8b5a2b";
        ctx.fillRect(sx + 4, sy + 14, 16, 20);
        // Head
        ctx.fillStyle = isHurt ? "#ffaaaa" : "#c69c6d";
        ctx.fillRect(sx + 4, sy, 16, 14);
        // Eyes
        ctx.fillStyle = "#333333";
        if (mob.facing === 1) {
            ctx.fillRect(sx + 12, sy + 4, 3, 3);
            ctx.fillRect(sx + 17, sy + 4, 3, 3);
        } else {
            ctx.fillRect(sx + 4, sy + 4, 3, 3);
            ctx.fillRect(sx + 9, sy + 4, 3, 3);
        }
        // Nose
        ctx.fillStyle = "#b08060";
        ctx.fillRect(sx + 10, sy + 7, 4, 4);
        // Hood
        ctx.fillStyle = "#6a3a1b";
        ctx.fillRect(sx + 4, sy, 16, 3);
        ctx.fillRect(sx + 4, sy, 3, 10);
        ctx.fillRect(sx + 17, sy, 3, 10);
        // Legs
        ctx.fillStyle = "#6a3a1b";
        ctx.fillRect(sx + 6, sy + 34, 5, 12);
        ctx.fillRect(sx + 13, sy + 34, 5, 12);
        // Shoes
        ctx.fillStyle = "#444444";
        ctx.fillRect(sx + 6, sy + 42, 5, 4);
        ctx.fillRect(sx + 13, sy + 42, 5, 4);
    }

    else if (mob.type === "husk") {
        // Sandy-colored zombie variant
        ctx.fillStyle = isHurt ? "#ff8888" : "#c4a060";
        ctx.fillRect(sx + 4, sy + 14, 16, 16);
        ctx.fillStyle = isHurt ? "#ffaaaa" : "#d4b070";
        ctx.fillRect(sx + 4, sy, 16, 14);
        ctx.fillStyle = "#444444";
        if (mob.facing === 1) {
            ctx.fillRect(sx + 12, sy + 4, 4, 4);
        } else {
            ctx.fillRect(sx + 8, sy + 4, 4, 4);
        }
        ctx.fillStyle = isHurt ? "#cc8866" : "#b09050";
        ctx.fillRect(sx + 4, sy + 14, 16, 16);
        ctx.fillStyle = "#8a7a5a";
        ctx.fillRect(sx + 4, sy + 30, 7, 16); ctx.fillRect(sx + 13, sy + 30, 7, 16);
        // Arms reaching out
        ctx.fillStyle = isHurt ? "#ffaaaa" : "#d4b070";
        const armDir = mob.facing === 1 ? 1 : -1;
        ctx.fillRect(sx + (armDir === 1 ? 18 : -10), sy + 14, 16, 5);
        // Tattered cloth band
        ctx.fillStyle = "#8a7040";
        ctx.fillRect(sx + 4, sy + 14, 16, 3);
    }

    else if (mob.type === "enderman") {
        // Tall, thin, black figure
        ctx.fillStyle = isHurt ? "#ff6666" : "#0a0a0a";
        // Head
        ctx.fillRect(sx + 4, sy, 12, 10);
        // Body (thin)
        ctx.fillRect(sx + 6, sy + 10, 8, 22);
        // Long legs
        ctx.fillRect(sx + 5, sy + 32, 4, 24);
        ctx.fillRect(sx + 11, sy + 32, 4, 24);
        // Long arms
        ctx.fillStyle = isHurt ? "#ff4444" : "#1a1a1a";
        ctx.fillRect(sx + (mob.facing === 1 ? 14 : -4), sy + 12, 4, 20);
        ctx.fillRect(sx + (mob.facing === 1 ? -4 : 14), sy + 14, 4, 18);
        // Purple eyes
        ctx.fillStyle = mob.aggroed ? "#ff00ff" : "#aa44ff";
        ctx.fillRect(sx + 5, sy + 3, 3, 3);
        ctx.fillRect(sx + 12, sy + 3, 3, 3);
        // Particles when teleporting
        if (mob.teleportTimer !== undefined && mob.teleportTimer < 200) {
            ctx.fillStyle = "rgba(170, 68, 255, 0.5)";
            for (let p = 0; p < 4; p++) {
                ctx.fillRect(sx + Math.random() * 20, sy + Math.random() * 56, 3, 3);
            }
        }
    }

    else if (mob.type === "spider") {
        // Low, wide body - dark brown/black
        ctx.fillStyle = isHurt ? "#ff6666" : "#3a2a1a";
        // Body (wide and flat)
        ctx.fillRect(sx + 4, sy + 2, 24, 12);
        // Head
        ctx.fillStyle = isHurt ? "#ff8888" : "#2a1a0a";
        const hx = mob.facing === 1 ? sx + 24 : sx - 6;
        ctx.fillRect(hx, sy + 2, 10, 10);
        // Eyes (red, multiple)
        ctx.fillStyle = "#ff0000";
        ctx.fillRect(hx + 2, sy + 3, 2, 2);
        ctx.fillRect(hx + 6, sy + 3, 2, 2);
        ctx.fillRect(hx + 2, sy + 7, 2, 2);
        ctx.fillRect(hx + 6, sy + 7, 2, 2);
        // Legs (4 per side)
        ctx.fillStyle = isHurt ? "#ff4444" : "#2a1a0a";
        for (let l = 0; l < 4; l++) {
            const lx = sx + 6 + l * 5;
            ctx.fillRect(lx, sy + 14, 2, 4);
            ctx.fillRect(lx - 2, sy + 16, 2, 2);
        }
    }

    else if (mob.type === "chicken") {
        // Small white body
        ctx.fillStyle = isHurt ? "#ff8888" : "#f0f0f0";
        ctx.fillRect(sx + 3, sy + 4, 10, 8);
        // Head
        const hx = mob.facing === 1 ? sx + 11 : sx - 3;
        ctx.fillStyle = isHurt ? "#ffaaaa" : "#f5f5f5";
        ctx.fillRect(hx, sy + 1, 6, 6);
        // Beak (orange)
        ctx.fillStyle = "#e08020";
        ctx.fillRect(mob.facing === 1 ? hx + 5 : hx - 2, sy + 3, 3, 2);
        // Eye
        ctx.fillStyle = "#000";
        ctx.fillRect(mob.facing === 1 ? hx + 3 : hx + 1, sy + 2, 2, 2);
        // Comb (red)
        ctx.fillStyle = "#cc2222";
        ctx.fillRect(hx + 1, sy - 1, 3, 3);
        // Legs (thin orange)
        ctx.fillStyle = "#e08020";
        ctx.fillRect(sx + 5, sy + 12, 2, 4);
        ctx.fillRect(sx + 9, sy + 12, 2, 4);
        // Tail feathers
        ctx.fillStyle = isHurt ? "#ffaaaa" : "#ddd";
        const tx = mob.facing === 1 ? sx : sx + 12;
        ctx.fillRect(tx, sy + 3, 3, 4);
    }

    // Mob equipment overlay
    if (mob.equipment) {
        if (mob.equipment.armor) {
            ctx.fillStyle = "rgba(180, 180, 200, 0.3)";
            ctx.fillRect(sx + 2, sy + 12, def.width - 4, 20);
        }
        if (mob.equipment.weapon) {
            ctx.fillStyle = "#d4d4d4";
            const wx = mob.facing === 1 ? sx + def.width : sx - 6;
            ctx.fillRect(wx, sy + 10, 4, 14);
        }
    }

    // Fire effect when burning
    if (mob.burnTimer > 0 && def.hostile && mob.type !== "creeper") {
        ctx.fillStyle = "rgba(255, 136, 0, 0.6)";
        ctx.fillRect(sx + 2, sy - 4, def.width - 4, 8);
        ctx.fillStyle = "rgba(255, 204, 0, 0.5)";
        ctx.fillRect(sx + 4, sy - 8, def.width - 8, 6);
        ctx.fillStyle = "rgba(255, 68, 0, 0.4)";
        ctx.fillRect(sx, sy + 2, def.width, 6);
    }

    // Health bar above mob (only when damaged)
    if (mob.health < def.maxHealth) {
        const barW = def.width + 8;
        const bx = sx - 4;
        const by = sy - 10;
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(bx, by, barW, 5);
        const pct = mob.health / def.maxHealth;
        ctx.fillStyle = pct > 0.5 ? "#4ade80" : pct > 0.25 ? "#fbbf24" : "#ef4444";
        ctx.fillRect(bx, by, barW * pct, 5);
    }
}

function drawAllMobs() {
    for (const mob of mobs) drawMob(mob);
}

// --- PROJECTILES ---
function drawProjectiles() {
    for (const p of projectiles) {
        const sx = p.x - camera.x + screenShake.x;
        const sy = p.y - camera.y + screenShake.y;
        if (p.isRocket) {
            // Rocket projectile
            ctx.save();
            ctx.translate(sx, sy);
            ctx.rotate(Math.atan2(p.velY, p.velX));
            // Body (red)
            ctx.fillStyle = "#cc3333";
            ctx.fillRect(-6, -3, 12, 6);
            // Nose (gray)
            ctx.fillStyle = "#aaa";
            ctx.beginPath();
            ctx.moveTo(8, 0);
            ctx.lineTo(6, -3);
            ctx.lineTo(6, 3);
            ctx.closePath();
            ctx.fill();
            // Fins
            ctx.fillStyle = "#cc3333";
            ctx.fillRect(-6, -5, 4, 2);
            ctx.fillRect(-6, 3, 4, 2);
            // Flame trail
            ctx.fillStyle = "#ff8800";
            ctx.fillRect(-10, -2, 4, 4);
            ctx.fillStyle = "#ffcc00";
            ctx.fillRect(-8, -1, 2, 2);
            ctx.restore();
        } else if (p.isBullet) {
            // Small fast bullet
            ctx.fillStyle = "#ffcc44";
            ctx.save();
            ctx.translate(sx, sy);
            ctx.rotate(Math.atan2(p.velY, p.velX));
            ctx.fillRect(-3, -1, 6, 2);
            ctx.restore();
            // Muzzle trail
            ctx.fillStyle = "rgba(255, 200, 50, 0.3)";
            ctx.fillRect(sx - 6, sy - 1, 4, 2);
        } else {
            // Arrow
            ctx.fillStyle = "#8b6c42";
            ctx.save();
            ctx.translate(sx, sy);
            ctx.rotate(Math.atan2(p.velY, p.velX));
            ctx.fillRect(-8, -1, 16, 3);
            ctx.fillStyle = "#aaaaaa";
            ctx.fillRect(6, -2, 4, 5);
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(-8, -3, 4, 2);
            ctx.fillRect(-8, 2, 4, 2);
            ctx.restore();
        }
    }
}

// --- PARTICLES ---
function drawParticles() {
    for (const p of particles) {
        const sx = p.x - camera.x + screenShake.x;
        const sy = p.y - camera.y + screenShake.y;
        ctx.globalAlpha = p.life / 50;
        ctx.fillStyle = p.color;
        ctx.fillRect(sx - p.size / 2, sy - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
}
