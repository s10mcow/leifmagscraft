// ============================================================
// RENDERING.JS - World and entity drawing (ES module)
// ============================================================
// Draws the game world: blocks, sky, player, mobs,
// projectiles, and particles. UI is in ui.js!
// ============================================================

import { state } from './state.js';
import { BLOCKS, ITEMS, BLOCK_SIZE, WORLD_WIDTH, WORLD_HEIGHT, BLOCK_INFO, ITEM_INFO, MOB_DEFS, TORCH_LIGHT_RADIUS, isBlockId, getItemColor } from './constants.js';
import { getArmorColor } from './inventory.js';

// --- BLOCKS ---
export function drawBlock(blockType, screenX, screenY) {
    const info = BLOCK_INFO[blockType];
    if (!info || !info.color) return;

    // Pressure plate - thin slab, no background block
    if (blockType === BLOCKS.PRESSURE_PLATE) {
        state.ctx.fillStyle = "#7a7a6a";
        state.ctx.fillRect(screenX + 4, screenY + 26, BLOCK_SIZE - 8, 4);
        state.ctx.fillStyle = "#9a9a8a";
        state.ctx.fillRect(screenX + 5, screenY + 26, BLOCK_SIZE - 10, 2);
        return;
    }

    state.ctx.fillStyle = info.color;
    state.ctx.fillRect(screenX, screenY, BLOCK_SIZE, BLOCK_SIZE);

    if (blockType === BLOCKS.GRASS && info.topColor) {
        state.ctx.fillStyle = info.topColor;
        state.ctx.fillRect(screenX, screenY, BLOCK_SIZE, 6);
    }
    if (info.spots) {
        state.ctx.fillStyle = info.spots;
        state.ctx.fillRect(screenX + 4, screenY + 4, 6, 5);
        state.ctx.fillRect(screenX + 18, screenY + 12, 7, 5);
        state.ctx.fillRect(screenX + 8, screenY + 20, 5, 6);
        state.ctx.fillRect(screenX + 22, screenY + 4, 5, 4);
    }
    if (blockType === BLOCKS.WOOD) {
        state.ctx.fillStyle = "#7a5c32";
        state.ctx.fillRect(screenX + 6, screenY, 2, BLOCK_SIZE);
        state.ctx.fillRect(screenX + 16, screenY, 2, BLOCK_SIZE);
        state.ctx.fillRect(screenX + 24, screenY, 2, BLOCK_SIZE);
    }
    if (blockType === BLOCKS.PLANKS) {
        state.ctx.fillStyle = "#b08930";
        state.ctx.fillRect(screenX, screenY + 7, BLOCK_SIZE, 2);
        state.ctx.fillRect(screenX, screenY + 15, BLOCK_SIZE, 2);
        state.ctx.fillRect(screenX, screenY + 23, BLOCK_SIZE, 2);
    }
    if (blockType === BLOCKS.WATER) {
        state.ctx.fillStyle = "rgba(59, 125, 216, 0.6)";
        state.ctx.fillRect(screenX, screenY, BLOCK_SIZE, BLOCK_SIZE);
    }
    if (blockType === BLOCKS.LEAVES) {
        state.ctx.fillStyle = "#3da85a";
        state.ctx.fillRect(screenX + 2, screenY + 3, 5, 4);
        state.ctx.fillRect(screenX + 14, screenY + 8, 6, 5);
        state.ctx.fillRect(screenX + 6, screenY + 18, 5, 4);
        state.ctx.fillRect(screenX + 20, screenY + 22, 6, 4);
        state.ctx.fillRect(screenX + 24, screenY + 4, 4, 5);
    }
    if (blockType === BLOCKS.CHEST) {
        // Chest body (dark wood)
        state.ctx.fillStyle = "#8b6c42";
        state.ctx.fillRect(screenX + 2, screenY + 6, BLOCK_SIZE - 4, BLOCK_SIZE - 8);
        // Chest lid (lighter)
        state.ctx.fillStyle = "#a07840";
        state.ctx.fillRect(screenX + 2, screenY + 2, BLOCK_SIZE - 4, 8);
        // Metal clasp
        state.ctx.fillStyle = "#c0c0c0";
        state.ctx.fillRect(screenX + 13, screenY + 8, 6, 4);
        // Dark rim at bottom
        state.ctx.fillStyle = "#6a4c2a";
        state.ctx.fillRect(screenX + 2, screenY + BLOCK_SIZE - 4, BLOCK_SIZE - 4, 2);
        // Keyhole
        state.ctx.fillStyle = "#333";
        state.ctx.fillRect(screenX + 15, screenY + 10, 2, 2);
    }
    if (blockType === BLOCKS.BED) {
        state.ctx.fillStyle = "#8b6c42";
        state.ctx.fillRect(screenX, screenY + 16, BLOCK_SIZE, 16);
        state.ctx.fillStyle = "#cc3333";
        state.ctx.fillRect(screenX + 2, screenY + 4, BLOCK_SIZE - 4, 14);
        state.ctx.fillStyle = "#e8e8e8";
        state.ctx.fillRect(screenX + 4, screenY + 6, 10, 8);
        state.ctx.fillStyle = "#aa2222";
        state.ctx.fillRect(screenX + 2, screenY + 12, BLOCK_SIZE - 4, 2);
    }
    // --- Biome blocks ---
    if (blockType === BLOCKS.DRY_GRASS && info.topColor) {
        state.ctx.fillStyle = info.topColor;
        state.ctx.fillRect(screenX, screenY, BLOCK_SIZE, 6);
        // Dry tufts
        state.ctx.fillStyle = "#9a8a4c";
        state.ctx.fillRect(screenX + 6, screenY + 8, 3, 4);
        state.ctx.fillRect(screenX + 18, screenY + 14, 4, 3);
    }
    if (blockType === BLOCKS.SNOW && info.topColor) {
        state.ctx.fillStyle = info.topColor;
        state.ctx.fillRect(screenX, screenY, BLOCK_SIZE, 6);
        // Snow sparkles
        state.ctx.fillStyle = "rgba(255,255,255,0.6)";
        state.ctx.fillRect(screenX + 5, screenY + 10, 2, 2);
        state.ctx.fillRect(screenX + 20, screenY + 7, 2, 2);
        state.ctx.fillRect(screenX + 12, screenY + 18, 2, 2);
    }
    if (blockType === BLOCKS.ICE) {
        state.ctx.fillStyle = "rgba(160, 216, 239, 0.8)";
        state.ctx.fillRect(screenX, screenY, BLOCK_SIZE, BLOCK_SIZE);
        // Diagonal highlight lines
        state.ctx.strokeStyle = "rgba(255,255,255,0.3)";
        state.ctx.lineWidth = 1;
        state.ctx.beginPath();
        state.ctx.moveTo(screenX + 4, screenY + 28); state.ctx.lineTo(screenX + 28, screenY + 4);
        state.ctx.moveTo(screenX + 10, screenY + 30); state.ctx.lineTo(screenX + 30, screenY + 10);
        state.ctx.stroke();
    }
    if (blockType === BLOCKS.CACTUS) {
        // Lighter inner stripe
        state.ctx.fillStyle = "#3a8a2e";
        state.ctx.fillRect(screenX + 8, screenY, 16, BLOCK_SIZE);
        // Thorns on edges
        state.ctx.fillStyle = "#1a5a0e";
        state.ctx.fillRect(screenX + 2, screenY + 6, 4, 2);
        state.ctx.fillRect(screenX + 26, screenY + 14, 4, 2);
        state.ctx.fillRect(screenX + 2, screenY + 22, 4, 2);
        state.ctx.fillRect(screenX + 26, screenY + 4, 4, 2);
    }
    if (blockType === BLOCKS.SPRUCE_WOOD) {
        state.ctx.fillStyle = "#4a2a10";
        state.ctx.fillRect(screenX + 6, screenY, 2, BLOCK_SIZE);
        state.ctx.fillRect(screenX + 16, screenY, 2, BLOCK_SIZE);
        state.ctx.fillRect(screenX + 24, screenY, 2, BLOCK_SIZE);
    }
    if (blockType === BLOCKS.SPRUCE_LEAVES) {
        state.ctx.fillStyle = "#2a5a3a";
        state.ctx.fillRect(screenX + 3, screenY + 4, 5, 4);
        state.ctx.fillRect(screenX + 16, screenY + 10, 6, 4);
        state.ctx.fillRect(screenX + 8, screenY + 20, 5, 4);
        state.ctx.fillRect(screenX + 22, screenY + 2, 4, 5);
    }
    if (blockType === BLOCKS.ACACIA_WOOD) {
        state.ctx.fillStyle = "#8a5020";
        state.ctx.fillRect(screenX + 5, screenY, 2, BLOCK_SIZE);
        state.ctx.fillRect(screenX + 14, screenY, 2, BLOCK_SIZE);
        state.ctx.fillRect(screenX + 23, screenY, 2, BLOCK_SIZE);
    }
    if (blockType === BLOCKS.ACACIA_LEAVES) {
        state.ctx.fillStyle = "#8aba4a";
        state.ctx.fillRect(screenX + 2, screenY + 3, 5, 4);
        state.ctx.fillRect(screenX + 14, screenY + 8, 6, 5);
        state.ctx.fillRect(screenX + 6, screenY + 18, 5, 4);
        state.ctx.fillRect(screenX + 20, screenY + 22, 6, 4);
    }
    // Door (closed) - solid wood door
    if (blockType === BLOCKS.DOOR_CLOSED) {
        state.ctx.fillStyle = "#8b6c42";
        state.ctx.fillRect(screenX, screenY, BLOCK_SIZE, BLOCK_SIZE);
        state.ctx.fillStyle = "#7a5c32";
        state.ctx.fillRect(screenX + 2, screenY, 2, BLOCK_SIZE);
        state.ctx.fillRect(screenX + BLOCK_SIZE - 4, screenY, 2, BLOCK_SIZE);
        state.ctx.fillStyle = "#9a7c52";
        state.ctx.fillRect(screenX + 6, screenY + 2, BLOCK_SIZE - 12, BLOCK_SIZE - 4);
        state.ctx.fillStyle = "#c0c0c0";
        state.ctx.fillRect(screenX + BLOCK_SIZE - 10, screenY + 14, 4, 4);
    }
    // Door (open) - thin frame on one side
    if (blockType === BLOCKS.DOOR_OPEN) {
        state.ctx.fillStyle = "#8b6c42";
        state.ctx.fillRect(screenX, screenY, 6, BLOCK_SIZE);
        state.ctx.fillStyle = "#7a5c32";
        state.ctx.fillRect(screenX + 2, screenY, 2, BLOCK_SIZE);
        state.ctx.fillStyle = "#c0c0c0";
        state.ctx.fillRect(screenX + 2, screenY + 14, 2, 4);
        return; // mostly transparent
    }
    // Gravel
    if (blockType === BLOCKS.GRAVEL) {
        state.ctx.fillStyle = "#7a7a6a";
        state.ctx.fillRect(screenX + 3, screenY + 5, 5, 4);
        state.ctx.fillRect(screenX + 15, screenY + 3, 6, 5);
        state.ctx.fillRect(screenX + 8, screenY + 15, 4, 4);
        state.ctx.fillRect(screenX + 20, screenY + 20, 5, 5);
        state.ctx.fillRect(screenX + 4, screenY + 24, 6, 4);
        state.ctx.fillStyle = "#9a9a8a";
        state.ctx.fillRect(screenX + 12, screenY + 10, 5, 4);
        state.ctx.fillRect(screenX + 24, screenY + 8, 4, 5);
    }
    // Lava - animated orange-red
    if (blockType === BLOCKS.LAVA) {
        state.ctx.fillStyle = "#e04010";
        state.ctx.fillRect(screenX, screenY, BLOCK_SIZE, BLOCK_SIZE);
        const t = performance.now() * 0.003;
        const shimX = Math.sin(t + screenX * 0.1) * 4 + 8;
        const shimY = Math.cos(t + screenY * 0.1) * 4 + 8;
        state.ctx.fillStyle = "rgba(255, 200, 50, 0.4)";
        state.ctx.fillRect(screenX + shimX, screenY + shimY, 12, 8);
        state.ctx.fillStyle = "rgba(255, 160, 20, 0.3)";
        state.ctx.fillRect(screenX + shimX + 10, screenY + shimY + 10, 10, 6);
        state.ctx.fillStyle = "rgba(255, 255, 100, 0.3)";
        state.ctx.fillRect(screenX + 10, screenY + 14, 6, 4);
        return; // no border
    }
    // Obsidian - dark purple-black
    if (blockType === BLOCKS.OBSIDIAN) {
        state.ctx.fillStyle = "#2a1a3e";
        state.ctx.fillRect(screenX + 6, screenY + 4, 5, 6);
        state.ctx.fillRect(screenX + 18, screenY + 16, 6, 5);
        state.ctx.fillRect(screenX + 10, screenY + 24, 4, 4);
        state.ctx.fillStyle = "#3a2a4e";
        state.ctx.fillRect(screenX + 22, screenY + 6, 4, 3);
    }
    // Nether Portal - animated purple swirl
    if (blockType === BLOCKS.NETHER_PORTAL) {
        const t = performance.now() * 0.004;
        state.ctx.fillStyle = "rgba(136, 0, 204, 0.7)";
        state.ctx.fillRect(screenX, screenY, BLOCK_SIZE, BLOCK_SIZE);
        state.ctx.fillStyle = "rgba(200, 100, 255, 0.4)";
        const sy1 = Math.sin(t + screenX * 0.05) * 6 + 12;
        const sy2 = Math.cos(t * 1.3 + screenY * 0.05) * 6 + 12;
        state.ctx.fillRect(screenX + 4, screenY + sy1, 8, 10);
        state.ctx.fillRect(screenX + 16, screenY + sy2, 10, 8);
        state.ctx.fillStyle = "rgba(255, 180, 255, 0.3)";
        state.ctx.fillRect(screenX + 10, screenY + 8, 6, 16);
        return; // no border
    }
    // Netherrack
    if (blockType === BLOCKS.NETHERRACK) {
        state.ctx.fillStyle = "#602020";
        state.ctx.fillRect(screenX + 4, screenY + 6, 6, 5);
        state.ctx.fillRect(screenX + 18, screenY + 14, 5, 6);
        state.ctx.fillRect(screenX + 8, screenY + 22, 7, 4);
    }
    // Soul Sand
    if (blockType === BLOCKS.SOUL_SAND) {
        state.ctx.fillStyle = "#3a2a1a";
        state.ctx.fillRect(screenX + 3, screenY + 4, 7, 6);
        state.ctx.fillRect(screenX + 16, screenY + 12, 8, 7);
        state.ctx.fillStyle = "#2a1a10";
        state.ctx.fillRect(screenX + 8, screenY + 8, 3, 3);
        state.ctx.fillRect(screenX + 20, screenY + 8, 3, 3);
        state.ctx.fillRect(screenX + 12, screenY + 16, 6, 2);
    }
    // Glowstone
    if (blockType === BLOCKS.GLOWSTONE) {
        state.ctx.fillStyle = "#eeb820";
        state.ctx.fillRect(screenX + 4, screenY + 4, 8, 8);
        state.ctx.fillRect(screenX + 18, screenY + 12, 6, 6);
        state.ctx.fillRect(screenX + 8, screenY + 20, 10, 6);
        state.ctx.fillStyle = "#fff8b0";
        state.ctx.fillRect(screenX + 6, screenY + 6, 4, 4);
        state.ctx.fillRect(screenX + 20, screenY + 14, 3, 3);
    }
    // Nether Brick
    if (blockType === BLOCKS.NETHER_BRICK) {
        state.ctx.fillStyle = "#4a2020";
        state.ctx.fillRect(screenX, screenY + 3, BLOCK_SIZE, 2);
        state.ctx.fillRect(screenX, screenY + 11, BLOCK_SIZE, 2);
        state.ctx.fillRect(screenX, screenY + 19, BLOCK_SIZE, 2);
        state.ctx.fillRect(screenX, screenY + 27, BLOCK_SIZE, 2);
        state.ctx.fillRect(screenX + 8, screenY, 2, BLOCK_SIZE);
        state.ctx.fillRect(screenX + 24, screenY, 2, BLOCK_SIZE);
    }
    // Copper Ore
    if (blockType === BLOCKS.COPPER) {
        state.ctx.fillStyle = "#e07040";
        state.ctx.fillRect(screenX + 5, screenY + 4, 6, 5);
        state.ctx.fillRect(screenX + 18, screenY + 14, 5, 6);
        state.ctx.fillRect(screenX + 10, screenY + 22, 6, 4);
        state.ctx.fillStyle = "#c06030";
        state.ctx.fillRect(screenX + 22, screenY + 6, 4, 4);
    }
    // Torch - special shape, no block border
    if (blockType === BLOCKS.TORCH) {
        // Stick
        state.ctx.fillStyle = "#8b6c42";
        state.ctx.fillRect(screenX + 13, screenY + 8, 6, 20);
        // Flame base (orange)
        state.ctx.fillStyle = "#e8a030";
        state.ctx.fillRect(screenX + 11, screenY + 2, 10, 10);
        // Flame tip (yellow)
        state.ctx.fillStyle = "#ffdd44";
        state.ctx.fillRect(screenX + 13, screenY, 6, 6);
        // Flame highlight
        state.ctx.fillStyle = "#fff8b0";
        state.ctx.fillRect(screenX + 14, screenY + 3, 4, 3);
        return; // no border for torch
    }
    state.ctx.strokeStyle = "rgba(0, 0, 0, 0.15)";
    state.ctx.strokeRect(screenX, screenY, BLOCK_SIZE, BLOCK_SIZE);
}

// --- ITEM ICONS (for inventory) ---
export function drawItemIcon(itemId, x, y, size) {
    if (itemId === 0) return;

    // Torch mini icon (before generic block path)
    if (itemId === BLOCKS.TORCH) {
        state.ctx.fillStyle = "#8b6c42";
        state.ctx.fillRect(x + size * 0.4, y + size * 0.3, size * 0.2, size * 0.6);
        state.ctx.fillStyle = "#e8a030";
        state.ctx.fillRect(x + size * 0.3, y + size * 0.05, size * 0.4, size * 0.35);
        state.ctx.fillStyle = "#ffdd44";
        state.ctx.fillRect(x + size * 0.35, y, size * 0.3, size * 0.2);
        return;
    }
    // Cactus mini icon
    if (itemId === BLOCKS.CACTUS) {
        state.ctx.fillStyle = "#2d6a1e";
        state.ctx.fillRect(x + size * 0.3, y + size * 0.1, size * 0.4, size * 0.8);
        state.ctx.fillStyle = "#3a8a2e";
        state.ctx.fillRect(x + size * 0.35, y + size * 0.15, size * 0.3, size * 0.7);
        // Thorns
        state.ctx.fillStyle = "#1a5a0e";
        state.ctx.fillRect(x + size * 0.15, y + size * 0.3, size * 0.15, 2);
        state.ctx.fillRect(x + size * 0.7, y + size * 0.55, size * 0.15, 2);
        return;
    }

    // Door mini icon
    if (itemId === BLOCKS.DOOR_CLOSED) {
        state.ctx.fillStyle = "#8b6c42";
        state.ctx.fillRect(x + size * 0.15, y + size * 0.05, size * 0.7, size * 0.9);
        state.ctx.fillStyle = "#7a5c32";
        state.ctx.fillRect(x + size * 0.2, y + size * 0.1, size * 0.15, size * 0.8);
        state.ctx.fillRect(x + size * 0.65, y + size * 0.1, size * 0.15, size * 0.8);
        state.ctx.fillStyle = "#c0c0c0";
        state.ctx.fillRect(x + size * 0.6, y + size * 0.45, size * 0.1, size * 0.1);
        return;
    }
    // Pressure plate icon
    if (itemId === BLOCKS.PRESSURE_PLATE) {
        state.ctx.fillStyle = "#7a7a6a";
        state.ctx.fillRect(x + size * 0.1, y + size * 0.65, size * 0.8, size * 0.2);
        state.ctx.fillStyle = "#9a9a8a";
        state.ctx.fillRect(x + size * 0.15, y + size * 0.65, size * 0.7, size * 0.1);
        return;
    }

    if (isBlockId(itemId)) {
        const info = BLOCK_INFO[itemId];
        if (!info || !info.color) return;
        state.ctx.fillStyle = info.color;
        state.ctx.fillRect(x, y, size, size);
        if (info.topColor) {
            state.ctx.fillStyle = info.topColor;
            state.ctx.fillRect(x, y, size, Math.max(2, size * 0.2));
        }
        if (info.spots) {
            state.ctx.fillStyle = info.spots;
            const s = Math.max(2, size * 0.2);
            state.ctx.fillRect(x + size * 0.15, y + size * 0.2, s, s);
            state.ctx.fillRect(x + size * 0.55, y + size * 0.5, s, s);
        }
        if (itemId === BLOCKS.PLANKS) {
            state.ctx.fillStyle = "#b08930";
            state.ctx.fillRect(x, y + size * 0.3, size, 1);
            state.ctx.fillRect(x, y + size * 0.6, size, 1);
        }
        if (itemId === BLOCKS.CHEST) {
            state.ctx.fillStyle = "#8b6c42";
            state.ctx.fillRect(x + 2, y + size * 0.2, size - 4, size * 0.7);
            state.ctx.fillStyle = "#a07840";
            state.ctx.fillRect(x + 2, y + size * 0.1, size - 4, size * 0.25);
            state.ctx.fillStyle = "#c0c0c0";
            state.ctx.fillRect(x + size * 0.4, y + size * 0.3, size * 0.2, size * 0.15);
        }
        if (itemId === BLOCKS.BED) {
            state.ctx.fillStyle = "#8b6c42";
            state.ctx.fillRect(x, y + size * 0.5, size, size * 0.5);
            state.ctx.fillStyle = "#cc3333";
            state.ctx.fillRect(x + 2, y + size * 0.15, size - 4, size * 0.4);
            state.ctx.fillStyle = "#e8e8e8";
            state.ctx.fillRect(x + 3, y + size * 0.2, size * 0.3, size * 0.25);
        }
    } else if (itemId === ITEMS.STICK) {
        state.ctx.fillStyle = "#8b6c42";
        state.ctx.save();
        state.ctx.translate(x + size / 2, y + size / 2);
        state.ctx.rotate(Math.PI / 4);
        state.ctx.fillRect(-2, -size * 0.4, 4, size * 0.8);
        state.ctx.restore();
    } else if (itemId === ITEMS.RAW_PORKCHOP) {
        state.ctx.fillStyle = "#e88a8a";
        state.ctx.fillRect(x + 2, y + 4, size - 4, size - 6);
        state.ctx.fillStyle = "#c46060";
        state.ctx.fillRect(x + 4, y + 6, size - 10, size - 12);
    } else if (itemId === ITEMS.ROTTEN_FLESH) {
        state.ctx.fillStyle = "#7a9a4a";
        state.ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
        state.ctx.fillStyle = "#5a7a3a";
        state.ctx.fillRect(x + 5, y + 5, size - 10, size - 10);
    } else if (itemId === ITEMS.BONE) {
        state.ctx.fillStyle = "#e8e8d0";
        state.ctx.fillRect(x + size * 0.3, y + 2, size * 0.4, size - 4);
        state.ctx.fillRect(x + size * 0.15, y + 2, size * 0.7, size * 0.25);
        state.ctx.fillRect(x + size * 0.15, y + size * 0.7, size * 0.7, size * 0.25);
    } else if (itemId === ITEMS.GUNPOWDER) {
        state.ctx.fillStyle = "#555555";
        state.ctx.beginPath();
        state.ctx.arc(x + size / 2, y + size / 2, size * 0.35, 0, Math.PI * 2);
        state.ctx.fill();
        state.ctx.fillStyle = "#333333";
        state.ctx.fillRect(x + size * 0.3, y + size * 0.3, 3, 3);
        state.ctx.fillRect(x + size * 0.55, y + size * 0.5, 3, 3);
    } else if (itemId === ITEMS.WOOL) {
        state.ctx.fillStyle = "#e8e8e8";
        state.ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
        state.ctx.fillStyle = "#f4f4f4";
        state.ctx.fillRect(x + size * 0.2, y + size * 0.15, size * 0.3, size * 0.3);
        state.ctx.fillRect(x + size * 0.5, y + size * 0.45, size * 0.3, size * 0.3);
    } else if (itemId === ITEMS.LEATHER) {
        state.ctx.fillStyle = "#8B6538";
        state.ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
        state.ctx.fillStyle = "#a07848";
        state.ctx.fillRect(x + 4, y + 4, size - 8, size - 8);
    } else if (itemId === ITEMS.STEAK) {
        state.ctx.fillStyle = "#aa3333";
        state.ctx.fillRect(x + 2, y + 4, size - 4, size - 6);
        state.ctx.fillStyle = "#cc5555";
        state.ctx.fillRect(x + 4, y + 6, size - 10, size - 12);
        state.ctx.fillStyle = "#e8ccaa";
        state.ctx.fillRect(x + size * 0.6, y + size * 0.3, size * 0.2, size * 0.4);
    } else if (itemId === ITEMS.MUTTON) {
        state.ctx.fillStyle = "#d88888";
        state.ctx.fillRect(x + 2, y + 4, size - 4, size - 6);
        state.ctx.fillStyle = "#eaaaaa";
        state.ctx.fillRect(x + 4, y + 6, size - 10, size - 12);
        state.ctx.fillStyle = "#e8ccaa";
        state.ctx.fillRect(x + size * 0.15, y + size * 0.6, size * 0.2, size * 0.25);
    } else if (itemId === ITEMS.FLINT) {
        state.ctx.fillStyle = "#555555";
        state.ctx.beginPath();
        state.ctx.moveTo(x + size * 0.5, y + size * 0.1);
        state.ctx.lineTo(x + size * 0.8, y + size * 0.5);
        state.ctx.lineTo(x + size * 0.6, y + size * 0.9);
        state.ctx.lineTo(x + size * 0.2, y + size * 0.7);
        state.ctx.lineTo(x + size * 0.3, y + size * 0.3);
        state.ctx.closePath();
        state.ctx.fill();
        state.ctx.fillStyle = "#777777";
        state.ctx.fillRect(x + size * 0.35, y + size * 0.3, size * 0.2, size * 0.3);
    } else if (itemId === ITEMS.FLINT_AND_STEEL) {
        state.ctx.fillStyle = "#555555";
        state.ctx.fillRect(x + size * 0.15, y + size * 0.3, size * 0.3, size * 0.5);
        state.ctx.fillStyle = "#cccccc";
        state.ctx.fillRect(x + size * 0.5, y + size * 0.2, size * 0.35, size * 0.15);
        state.ctx.fillRect(x + size * 0.55, y + size * 0.2, size * 0.1, size * 0.6);
        state.ctx.fillStyle = "#ffaa00";
        state.ctx.fillRect(x + size * 0.4, y + size * 0.15, 3, 3);
    } else if (itemId === ITEMS.BULLETS) {
        state.ctx.fillStyle = "#c4a030";
        state.ctx.fillRect(x + size * 0.2, y + size * 0.3, size * 0.15, size * 0.4);
        state.ctx.fillRect(x + size * 0.45, y + size * 0.3, size * 0.15, size * 0.4);
        state.ctx.fillRect(x + size * 0.7, y + size * 0.3, size * 0.15, size * 0.4);
        state.ctx.fillStyle = "#dd8844";
        state.ctx.fillRect(x + size * 0.2, y + size * 0.2, size * 0.15, size * 0.15);
        state.ctx.fillRect(x + size * 0.45, y + size * 0.2, size * 0.15, size * 0.15);
        state.ctx.fillRect(x + size * 0.7, y + size * 0.2, size * 0.15, size * 0.15);
    } else if (itemId === ITEMS.PISTOL) {
        state.ctx.fillStyle = "#666666";
        state.ctx.fillRect(x + size * 0.1, y + size * 0.25, size * 0.7, size * 0.2);
        state.ctx.fillRect(x + size * 0.3, y + size * 0.4, size * 0.2, size * 0.4);
        state.ctx.fillStyle = "#888888";
        state.ctx.fillRect(x + size * 0.1, y + size * 0.28, size * 0.65, size * 0.14);
        state.ctx.fillStyle = "#555555";
        state.ctx.fillRect(x + size * 0.75, y + size * 0.3, size * 0.1, size * 0.1);
    } else if (itemId === ITEMS.AK47) {
        state.ctx.fillStyle = "#5a5a3a";
        state.ctx.fillRect(x + size * 0.05, y + size * 0.3, size * 0.9, size * 0.15);
        state.ctx.fillStyle = "#8b6c42";
        state.ctx.fillRect(x + size * 0.55, y + size * 0.4, size * 0.3, size * 0.35);
        state.ctx.fillStyle = "#4a4a2a";
        state.ctx.fillRect(x + size * 0.05, y + size * 0.32, size * 0.5, size * 0.1);
        state.ctx.fillStyle = "#666";
        state.ctx.fillRect(x + size * 0.2, y + size * 0.2, size * 0.15, size * 0.12);
    } else if (itemId === ITEMS.ENDER_PEARL) {
        state.ctx.fillStyle = "#1a3a2a";
        state.ctx.beginPath();
        state.ctx.arc(x + size / 2, y + size / 2, size * 0.35, 0, Math.PI * 2);
        state.ctx.fill();
        state.ctx.fillStyle = "#2a5a3a";
        state.ctx.beginPath();
        state.ctx.arc(x + size * 0.45, y + size * 0.4, size * 0.15, 0, Math.PI * 2);
        state.ctx.fill();
    } else if (itemId === ITEMS.FEATHER) {
        // Quill shape
        state.ctx.fillStyle = "#f5f5f5";
        state.ctx.beginPath();
        state.ctx.moveTo(x + size * 0.5, y + size * 0.05);
        state.ctx.lineTo(x + size * 0.7, y + size * 0.5);
        state.ctx.lineTo(x + size * 0.55, y + size * 0.9);
        state.ctx.lineTo(x + size * 0.45, y + size * 0.9);
        state.ctx.lineTo(x + size * 0.3, y + size * 0.5);
        state.ctx.closePath();
        state.ctx.fill();
        // Shaft
        state.ctx.strokeStyle = "#aaa";
        state.ctx.lineWidth = 1;
        state.ctx.beginPath();
        state.ctx.moveTo(x + size * 0.5, y + size * 0.05);
        state.ctx.lineTo(x + size * 0.5, y + size * 0.95);
        state.ctx.stroke();
    } else if (itemId === ITEMS.RAW_CHICKEN) {
        // Pinkish raw meat
        state.ctx.fillStyle = "#e8a0a0";
        state.ctx.fillRect(x + size * 0.2, y + size * 0.15, size * 0.6, size * 0.55);
        // Drumstick bone
        state.ctx.fillStyle = "#f0d8b0";
        state.ctx.fillRect(x + size * 0.35, y + size * 0.6, size * 0.12, size * 0.35);
        state.ctx.fillRect(x + size * 0.55, y + size * 0.6, size * 0.12, size * 0.35);
        // Darker shading
        state.ctx.fillStyle = "rgba(0,0,0,0.1)";
        state.ctx.fillRect(x + size * 0.2, y + size * 0.45, size * 0.6, size * 0.15);
    } else if (itemId === ITEMS.ROCKET_LAUNCHER) {
        // Olive green launcher tube
        state.ctx.fillStyle = "#556b2f";
        state.ctx.fillRect(x + size * 0.05, y + size * 0.25, size * 0.85, size * 0.25);
        // Wider opening at front
        state.ctx.fillStyle = "#3a4a1f";
        state.ctx.fillRect(x + size * 0.0, y + size * 0.2, size * 0.15, size * 0.35);
        // Grip
        state.ctx.fillStyle = "#444";
        state.ctx.fillRect(x + size * 0.5, y + size * 0.45, size * 0.15, size * 0.35);
        // Sight on top
        state.ctx.fillStyle = "#333";
        state.ctx.fillRect(x + size * 0.3, y + size * 0.15, size * 0.1, size * 0.12);
    } else if (itemId === ITEMS.ROCKET) {
        // Rocket body (red)
        state.ctx.fillStyle = "#cc3333";
        state.ctx.fillRect(x + size * 0.3, y + size * 0.1, size * 0.4, size * 0.6);
        // Nose cone
        state.ctx.fillStyle = "#aaa";
        state.ctx.beginPath();
        state.ctx.moveTo(x + size * 0.5, y + size * 0.0);
        state.ctx.lineTo(x + size * 0.7, y + size * 0.15);
        state.ctx.lineTo(x + size * 0.3, y + size * 0.15);
        state.ctx.closePath();
        state.ctx.fill();
        // Fins
        state.ctx.fillStyle = "#cc3333";
        state.ctx.fillRect(x + size * 0.2, y + size * 0.6, size * 0.15, size * 0.2);
        state.ctx.fillRect(x + size * 0.65, y + size * 0.6, size * 0.15, size * 0.2);
        // Exhaust
        state.ctx.fillStyle = "#ff8800";
        state.ctx.fillRect(x + size * 0.35, y + size * 0.7, size * 0.3, size * 0.15);
    } else if (ITEM_INFO[itemId] && ITEM_INFO[itemId].armorType) {
        const ac = ITEM_INFO[itemId].color;
        const at = ITEM_INFO[itemId].armorType;
        if (at === "helmet") {
            state.ctx.fillStyle = ac;
            state.ctx.fillRect(x + size * 0.1, y + size * 0.15, size * 0.8, size * 0.7);
            state.ctx.fillStyle = "rgba(0,0,0,0.2)";
            state.ctx.fillRect(x + size * 0.2, y + size * 0.55, size * 0.6, size * 0.3);
        } else if (at === "chestplate") {
            state.ctx.fillStyle = ac;
            state.ctx.fillRect(x + size * 0.1, y + size * 0.05, size * 0.8, size * 0.9);
            state.ctx.fillStyle = "rgba(0,0,0,0.15)";
            state.ctx.fillRect(x + size * 0.3, y + size * 0.05, size * 0.4, size * 0.35);
            state.ctx.fillRect(x + size * 0.35, y + size * 0.6, size * 0.3, size * 0.35);
        } else if (at === "leggings") {
            state.ctx.fillStyle = ac;
            state.ctx.fillRect(x + size * 0.1, y + size * 0.05, size * 0.8, size * 0.4);
            state.ctx.fillRect(x + size * 0.1, y + size * 0.05, size * 0.35, size * 0.9);
            state.ctx.fillRect(x + size * 0.55, y + size * 0.05, size * 0.35, size * 0.9);
        } else if (at === "boots") {
            state.ctx.fillStyle = ac;
            state.ctx.fillRect(x + size * 0.05, y + size * 0.4, size * 0.35, size * 0.55);
            state.ctx.fillRect(x + size * 0.6, y + size * 0.4, size * 0.35, size * 0.55);
            state.ctx.fillRect(x + size * 0.0, y + size * 0.7, size * 0.45, size * 0.25);
            state.ctx.fillRect(x + size * 0.55, y + size * 0.7, size * 0.45, size * 0.25);
        }
    } else if (ITEM_INFO[itemId] && ITEM_INFO[itemId].toolType) {
        const info = ITEM_INFO[itemId];
        const tc = info.color;
        const hc = "#8b6c42";
        if (info.toolType === "pickaxe") {
            state.ctx.fillStyle = hc;
            state.ctx.save(); state.ctx.translate(x + size / 2, y + size / 2); state.ctx.rotate(Math.PI / 4);
            state.ctx.fillRect(-2, -2, 4, size * 0.6);
            state.ctx.fillStyle = tc;
            state.ctx.fillRect(-size * 0.35, -size * 0.3, size * 0.7, 4);
            state.ctx.restore();
        } else if (info.toolType === "sword") {
            state.ctx.save(); state.ctx.translate(x + size / 2, y + size / 2); state.ctx.rotate(-Math.PI / 4);
            state.ctx.fillStyle = tc;
            state.ctx.fillRect(-2, -size * 0.45, 5, size * 0.5);
            state.ctx.fillStyle = hc;
            state.ctx.fillRect(-2, size * 0.05, 4, size * 0.35);
            state.ctx.fillStyle = "#444";
            state.ctx.fillRect(-5, 0, 10, 3);
            state.ctx.restore();
        } else if (info.toolType === "axe") {
            state.ctx.fillStyle = hc;
            state.ctx.save(); state.ctx.translate(x + size / 2, y + size / 2); state.ctx.rotate(Math.PI / 4);
            state.ctx.fillRect(-2, -2, 4, size * 0.6);
            state.ctx.fillStyle = tc;
            state.ctx.fillRect(-2, -size * 0.35, size * 0.35, size * 0.3);
            state.ctx.restore();
        }
    }
}

// --- SKY ---
export function drawSky(dayBrightness) {
    if (state.inNether) {
        state.ctx.fillStyle = "#1a0505";
        state.ctx.fillRect(0, 0, state.canvas.width, state.canvas.height);
        state.ctx.fillStyle = "rgba(80, 10, 5, 0.3)";
        state.ctx.fillRect(0, 0, state.canvas.width, state.canvas.height * 0.3);
        return;
    }
    const r = Math.floor(10 + 125 * dayBrightness);
    const g = Math.floor(10 + 196 * dayBrightness);
    const b = Math.floor(40 + 195 * dayBrightness);
    state.ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    state.ctx.fillRect(0, 0, state.canvas.width, state.canvas.height);

    const cx = state.canvas.width * 0.5 + Math.cos(state.timeOfDay * Math.PI * 2 - Math.PI / 2) * 350;
    const cy = state.canvas.height * 0.3 - Math.sin(state.timeOfDay * Math.PI * 2 - Math.PI / 2) * 200;

    if (dayBrightness > 0.3) {
        state.ctx.fillStyle = `rgba(255, 255, 100, ${dayBrightness})`;
        state.ctx.beginPath(); state.ctx.arc(cx, cy, 30, 0, Math.PI * 2); state.ctx.fill();
        state.ctx.fillStyle = `rgba(255, 255, 100, ${dayBrightness * 0.2})`;
        state.ctx.beginPath(); state.ctx.arc(cx, cy, 50, 0, Math.PI * 2); state.ctx.fill();
    } else {
        state.ctx.fillStyle = `rgba(220, 220, 240, ${1 - dayBrightness})`;
        state.ctx.beginPath(); state.ctx.arc(cx, cy, 25, 0, Math.PI * 2); state.ctx.fill();
    }
    if (dayBrightness < 0.5) {
        const a = (0.5 - dayBrightness) * 1.6;
        state.ctx.fillStyle = `rgba(255, 255, 255, ${a})`;
        for (let i = 0; i < 50; i++) {
            state.ctx.fillRect((i * 137.5 + 50) % state.canvas.width, (i * 97.3 + 20) % (state.canvas.height * 0.5), 2, 2);
        }
    }
}

// --- PLAYER ---
export function drawPlayer() {
    const sx = state.player.x - state.camera.x + state.screenShake.x;
    const sy = state.player.y - state.camera.y + state.screenShake.y;

    if (state.player.invincibleTimer > 0 && Math.floor(state.player.invincibleTimer / 80) % 2 === 0) {
        state.ctx.globalAlpha = 0.4;
    }

    // Body
    state.ctx.fillStyle = "#00a8a8";
    state.ctx.fillRect(sx + 4, sy + 14, 16, 16);
    // Head
    state.ctx.fillStyle = "#c69c6d";
    state.ctx.fillRect(sx + 4, sy, 16, 14);
    // Eyes
    state.ctx.fillStyle = "#ffffff";
    if (state.player.facing === 1) {
        state.ctx.fillRect(sx + 12, sy + 4, 6, 4);
        state.ctx.fillStyle = "#4a3728"; state.ctx.fillRect(sx + 15, sy + 4, 3, 4);
    } else {
        state.ctx.fillRect(sx + 6, sy + 4, 6, 4);
        state.ctx.fillStyle = "#4a3728"; state.ctx.fillRect(sx + 6, sy + 4, 3, 4);
    }
    // Hair
    state.ctx.fillStyle = "#4a3728";
    state.ctx.fillRect(sx + 4, sy, 16, 3);
    state.ctx.fillRect(state.player.facing === 1 ? sx + 4 : sx + 16, sy, 4, 8);
    // Legs
    state.ctx.fillStyle = "#3b3b8f";
    state.ctx.fillRect(sx + 4, sy + 30, 7, 16); state.ctx.fillRect(sx + 13, sy + 30, 7, 16);
    // Shoes
    state.ctx.fillStyle = "#5a5a5a";
    state.ctx.fillRect(sx + 4, sy + 42, 7, 4); state.ctx.fillRect(sx + 13, sy + 42, 7, 4);
    // Arms
    state.ctx.fillStyle = "#00a8a8";
    state.ctx.fillRect(sx - 2, sy + 14, 6, 14); state.ctx.fillRect(sx + 20, sy + 14, 6, 14);
    // Hands
    state.ctx.fillStyle = "#c69c6d";
    state.ctx.fillRect(sx - 2, sy + 26, 6, 4); state.ctx.fillRect(sx + 20, sy + 26, 6, 4);

    // Armor overlay
    const helmetColor = getArmorColor("helmet");
    if (helmetColor) {
        state.ctx.fillStyle = helmetColor;
        state.ctx.globalAlpha = Math.max(state.ctx.globalAlpha, 0.4);
        state.ctx.fillRect(sx + 3, sy - 1, 18, 4);
        state.ctx.fillRect(sx + 3, sy + 3, 3, 8);
        state.ctx.fillRect(sx + 18, sy + 3, 3, 8);
        if (state.player.invincibleTimer > 0 && Math.floor(state.player.invincibleTimer / 80) % 2 === 0) state.ctx.globalAlpha = 0.4;
    }
    const chestColor = getArmorColor("chestplate");
    if (chestColor) {
        state.ctx.fillStyle = chestColor;
        state.ctx.fillRect(sx + 4, sy + 14, 16, 16);
        state.ctx.fillRect(sx - 2, sy + 14, 6, 12);
        state.ctx.fillRect(sx + 20, sy + 14, 6, 12);
    }
    const legColor = getArmorColor("leggings");
    if (legColor) {
        state.ctx.fillStyle = legColor;
        state.ctx.fillRect(sx + 4, sy + 30, 7, 12);
        state.ctx.fillRect(sx + 13, sy + 30, 7, 12);
    }
    const bootColor = getArmorColor("boots");
    if (bootColor) {
        state.ctx.fillStyle = bootColor;
        state.ctx.fillRect(sx + 3, sy + 40, 8, 6);
        state.ctx.fillRect(sx + 13, sy + 40, 8, 6);
    }

    // Held item
    const held = state.inventory.slots[state.inventory.selectedSlot];
    if (held.count > 0 && held.itemId !== 0) {
        const hx = state.player.facing === 1 ? sx + 22 : sx - 8;
        drawItemIcon(held.itemId, hx, sy + 16, 14);
    }

    state.ctx.globalAlpha = 1;
}

// --- MOBS ---
function drawMob(mob) {
    const def = MOB_DEFS[mob.type];
    const sx = mob.x - state.camera.x + state.screenShake.x;
    const sy = mob.y - state.camera.y + state.screenShake.y;
    const isHurt = mob.hurtTimer > 0;

    if (mob.type === "zombie") {
        state.ctx.fillStyle = isHurt ? "#ff6666" : "#5a8a4a";
        state.ctx.fillRect(sx + 4, sy + 14, 16, 16);
        state.ctx.fillStyle = isHurt ? "#ff8888" : "#6a9a5a";
        state.ctx.fillRect(sx + 4, sy, 16, 14);
        state.ctx.fillStyle = "#ff0000";
        if (mob.facing === 1) {
            state.ctx.fillRect(sx + 12, sy + 4, 4, 4); state.ctx.fillRect(sx + 18, sy + 4, 0, 0);
        } else {
            state.ctx.fillRect(sx + 8, sy + 4, 4, 4);
        }
        state.ctx.fillStyle = isHurt ? "#cc8866" : "#4a6a3a";
        state.ctx.fillRect(sx + 4, sy + 14, 16, 16);
        state.ctx.fillStyle = "#3b3b6f";
        state.ctx.fillRect(sx + 4, sy + 30, 7, 16); state.ctx.fillRect(sx + 13, sy + 30, 7, 16);
        state.ctx.fillStyle = isHurt ? "#ff8888" : "#6a9a5a";
        const armDir = mob.facing === 1 ? 1 : -1;
        state.ctx.fillRect(sx + (armDir === 1 ? 18 : -10), sy + 14, 16, 5);
    }

    else if (mob.type === "skeleton") {
        state.ctx.fillStyle = isHurt ? "#ff8888" : "#d4d4d4";
        state.ctx.fillRect(sx + 6, sy + 14, 10, 16);
        state.ctx.fillRect(sx + 4, sy, 14, 14);
        state.ctx.fillStyle = "#222222";
        state.ctx.fillRect(sx + 6, sy + 4, 4, 4);
        state.ctx.fillRect(sx + 12, sy + 4, 4, 4);
        state.ctx.fillRect(sx + 8, sy + 10, 6, 2);
        state.ctx.fillStyle = isHurt ? "#ff8888" : "#bbbbbb";
        state.ctx.fillRect(sx + 6, sy + 30, 4, 16); state.ctx.fillRect(sx + 12, sy + 30, 4, 16);
        state.ctx.fillStyle = "#8b6c42";
        const bx = mob.facing === 1 ? sx + 18 : sx - 6;
        state.ctx.fillRect(bx, sy + 8, 3, 20);
        state.ctx.fillStyle = "#cccccc";
        state.ctx.fillRect(bx + 1, sy + 8, 1, 20);
    }

    else if (mob.type === "creeper") {
        const fuseFlash = mob.fusing && Math.floor(mob.fuseTimer / 100) % 2 === 0;
        state.ctx.fillStyle = fuseFlash ? "#ffffff" : (isHurt ? "#ff8888" : "#4a8a4a");
        state.ctx.fillRect(sx + 4, sy, 12, 28);
        state.ctx.fillRect(sx + 2, sy + 28, 6, 14);
        state.ctx.fillRect(sx + 12, sy + 28, 6, 14);
        state.ctx.fillStyle = fuseFlash ? "#888888" : "#1a3a1a";
        state.ctx.fillRect(sx + 5, sy + 6, 4, 4);
        state.ctx.fillRect(sx + 11, sy + 6, 4, 4);
        state.ctx.fillRect(sx + 8, sy + 12, 4, 2);
        state.ctx.fillRect(sx + 6, sy + 14, 8, 4);
        state.ctx.fillRect(sx + 8, sy + 18, 4, 2);
    }

    else if (mob.type === "pig") {
        state.ctx.fillStyle = isHurt ? "#ff8888" : "#e8a0a0";
        state.ctx.fillRect(sx + 2, sy, 26, 14);
        const hx = mob.facing === 1 ? sx + 22 : sx - 6;
        state.ctx.fillRect(hx, sy - 2, 12, 12);
        state.ctx.fillStyle = isHurt ? "#ffaaaa" : "#f0c0c0";
        state.ctx.fillRect(hx + 3, sy + 2, 6, 5);
        state.ctx.fillStyle = "#c08080";
        state.ctx.fillRect(hx + 4, sy + 4, 2, 2);
        state.ctx.fillRect(hx + 6, sy + 4, 2, 2);
        state.ctx.fillStyle = "#333333";
        state.ctx.fillRect(hx + 2, sy, 2, 2);
        state.ctx.fillRect(hx + 8, sy, 2, 2);
        state.ctx.fillStyle = isHurt ? "#ff8888" : "#d08080";
        state.ctx.fillRect(sx + 4, sy + 14, 5, 8);
        state.ctx.fillRect(sx + 21, sy + 14, 5, 8);
    }

    else if (mob.type === "cow") {
        // Body
        state.ctx.fillStyle = isHurt ? "#ff8888" : "#8B6538";
        state.ctx.fillRect(sx + 2, sy, 26, 14);
        // Head
        const hx = mob.facing === 1 ? sx + 22 : sx - 6;
        state.ctx.fillStyle = isHurt ? "#ffaaaa" : "#6a4a28";
        state.ctx.fillRect(hx, sy - 2, 12, 12);
        // Horns
        state.ctx.fillStyle = "#e8e0d0";
        state.ctx.fillRect(hx + 1, sy - 5, 3, 4);
        state.ctx.fillRect(hx + 8, sy - 5, 3, 4);
        // Eyes
        state.ctx.fillStyle = "#333333";
        state.ctx.fillRect(hx + 2, sy, 2, 2);
        state.ctx.fillRect(hx + 8, sy, 2, 2);
        // Snout
        state.ctx.fillStyle = isHurt ? "#ffcccc" : "#c0a080";
        state.ctx.fillRect(hx + 3, sy + 4, 6, 4);
        // White spots
        state.ctx.fillStyle = "#e8e0d0";
        state.ctx.fillRect(sx + 8, sy + 2, 6, 5);
        state.ctx.fillRect(sx + 18, sy + 6, 5, 4);
        // Legs
        state.ctx.fillStyle = isHurt ? "#ff8888" : "#6a4a28";
        state.ctx.fillRect(sx + 4, sy + 14, 5, 8);
        state.ctx.fillRect(sx + 21, sy + 14, 5, 8);
    }

    else if (mob.type === "sheep") {
        // Fluffy body
        state.ctx.fillStyle = isHurt ? "#ff8888" : "#e8e8e8";
        state.ctx.fillRect(sx + 2, sy, 24, 12);
        // Puff top
        state.ctx.fillStyle = isHurt ? "#ffaaaa" : "#f4f4f4";
        state.ctx.fillRect(sx + 1, sy - 2, 26, 3);
        state.ctx.fillRect(sx, sy + 1, 28, 4);
        // Head
        const hx = mob.facing === 1 ? sx + 20 : sx - 4;
        state.ctx.fillStyle = isHurt ? "#ffaaaa" : "#888888";
        state.ctx.fillRect(hx, sy - 1, 10, 10);
        // Eyes
        state.ctx.fillStyle = "#333333";
        state.ctx.fillRect(hx + 2, sy + 1, 2, 2);
        state.ctx.fillRect(hx + 6, sy + 1, 2, 2);
        // Legs
        state.ctx.fillStyle = isHurt ? "#ff8888" : "#777777";
        state.ctx.fillRect(sx + 4, sy + 12, 4, 8);
        state.ctx.fillRect(sx + 20, sy + 12, 4, 8);
    }

    else if (mob.type === "villager") {
        // Robe/body
        state.ctx.fillStyle = isHurt ? "#ff8888" : "#8b5a2b";
        state.ctx.fillRect(sx + 4, sy + 14, 16, 20);
        // Head
        state.ctx.fillStyle = isHurt ? "#ffaaaa" : "#c69c6d";
        state.ctx.fillRect(sx + 4, sy, 16, 14);
        // Eyes
        state.ctx.fillStyle = "#333333";
        if (mob.facing === 1) {
            state.ctx.fillRect(sx + 12, sy + 4, 3, 3);
            state.ctx.fillRect(sx + 17, sy + 4, 3, 3);
        } else {
            state.ctx.fillRect(sx + 4, sy + 4, 3, 3);
            state.ctx.fillRect(sx + 9, sy + 4, 3, 3);
        }
        // Nose
        state.ctx.fillStyle = "#b08060";
        state.ctx.fillRect(sx + 10, sy + 7, 4, 4);
        // Hood
        state.ctx.fillStyle = "#6a3a1b";
        state.ctx.fillRect(sx + 4, sy, 16, 3);
        state.ctx.fillRect(sx + 4, sy, 3, 10);
        state.ctx.fillRect(sx + 17, sy, 3, 10);
        // Legs
        state.ctx.fillStyle = "#6a3a1b";
        state.ctx.fillRect(sx + 6, sy + 34, 5, 12);
        state.ctx.fillRect(sx + 13, sy + 34, 5, 12);
        // Shoes
        state.ctx.fillStyle = "#444444";
        state.ctx.fillRect(sx + 6, sy + 42, 5, 4);
        state.ctx.fillRect(sx + 13, sy + 42, 5, 4);
    }

    else if (mob.type === "husk") {
        // Sandy-colored zombie variant
        state.ctx.fillStyle = isHurt ? "#ff8888" : "#c4a060";
        state.ctx.fillRect(sx + 4, sy + 14, 16, 16);
        state.ctx.fillStyle = isHurt ? "#ffaaaa" : "#d4b070";
        state.ctx.fillRect(sx + 4, sy, 16, 14);
        state.ctx.fillStyle = "#444444";
        if (mob.facing === 1) {
            state.ctx.fillRect(sx + 12, sy + 4, 4, 4);
        } else {
            state.ctx.fillRect(sx + 8, sy + 4, 4, 4);
        }
        state.ctx.fillStyle = isHurt ? "#cc8866" : "#b09050";
        state.ctx.fillRect(sx + 4, sy + 14, 16, 16);
        state.ctx.fillStyle = "#8a7a5a";
        state.ctx.fillRect(sx + 4, sy + 30, 7, 16); state.ctx.fillRect(sx + 13, sy + 30, 7, 16);
        // Arms reaching out
        state.ctx.fillStyle = isHurt ? "#ffaaaa" : "#d4b070";
        const armDir = mob.facing === 1 ? 1 : -1;
        state.ctx.fillRect(sx + (armDir === 1 ? 18 : -10), sy + 14, 16, 5);
        // Tattered cloth band
        state.ctx.fillStyle = "#8a7040";
        state.ctx.fillRect(sx + 4, sy + 14, 16, 3);
    }

    else if (mob.type === "enderman") {
        // Tall, thin, black figure
        state.ctx.fillStyle = isHurt ? "#ff6666" : "#0a0a0a";
        // Head
        state.ctx.fillRect(sx + 4, sy, 12, 10);
        // Body (thin)
        state.ctx.fillRect(sx + 6, sy + 10, 8, 22);
        // Long legs
        state.ctx.fillRect(sx + 5, sy + 32, 4, 24);
        state.ctx.fillRect(sx + 11, sy + 32, 4, 24);
        // Long arms
        state.ctx.fillStyle = isHurt ? "#ff4444" : "#1a1a1a";
        state.ctx.fillRect(sx + (mob.facing === 1 ? 14 : -4), sy + 12, 4, 20);
        state.ctx.fillRect(sx + (mob.facing === 1 ? -4 : 14), sy + 14, 4, 18);
        // Purple eyes
        state.ctx.fillStyle = mob.aggroed ? "#ff00ff" : "#aa44ff";
        state.ctx.fillRect(sx + 5, sy + 3, 3, 3);
        state.ctx.fillRect(sx + 12, sy + 3, 3, 3);
        // Particles when teleporting
        if (mob.teleportTimer !== undefined && mob.teleportTimer < 200) {
            state.ctx.fillStyle = "rgba(170, 68, 255, 0.5)";
            for (let p = 0; p < 4; p++) {
                state.ctx.fillRect(sx + Math.random() * 20, sy + Math.random() * 56, 3, 3);
            }
        }
    }

    else if (mob.type === "spider") {
        // Low, wide body - dark brown/black
        state.ctx.fillStyle = isHurt ? "#ff6666" : "#3a2a1a";
        // Body (wide and flat)
        state.ctx.fillRect(sx + 4, sy + 2, 24, 12);
        // Head
        state.ctx.fillStyle = isHurt ? "#ff8888" : "#2a1a0a";
        const hx = mob.facing === 1 ? sx + 24 : sx - 6;
        state.ctx.fillRect(hx, sy + 2, 10, 10);
        // Eyes (red, multiple)
        state.ctx.fillStyle = "#ff0000";
        state.ctx.fillRect(hx + 2, sy + 3, 2, 2);
        state.ctx.fillRect(hx + 6, sy + 3, 2, 2);
        state.ctx.fillRect(hx + 2, sy + 7, 2, 2);
        state.ctx.fillRect(hx + 6, sy + 7, 2, 2);
        // Legs (4 per side)
        state.ctx.fillStyle = isHurt ? "#ff4444" : "#2a1a0a";
        for (let l = 0; l < 4; l++) {
            const lx = sx + 6 + l * 5;
            state.ctx.fillRect(lx, sy + 14, 2, 4);
            state.ctx.fillRect(lx - 2, sy + 16, 2, 2);
        }
    }

    else if (mob.type === "chicken") {
        // Small white body
        state.ctx.fillStyle = isHurt ? "#ff8888" : "#f0f0f0";
        state.ctx.fillRect(sx + 3, sy + 4, 10, 8);
        // Head
        const hx = mob.facing === 1 ? sx + 11 : sx - 3;
        state.ctx.fillStyle = isHurt ? "#ffaaaa" : "#f5f5f5";
        state.ctx.fillRect(hx, sy + 1, 6, 6);
        // Beak (orange)
        state.ctx.fillStyle = "#e08020";
        state.ctx.fillRect(mob.facing === 1 ? hx + 5 : hx - 2, sy + 3, 3, 2);
        // Eye
        state.ctx.fillStyle = "#000";
        state.ctx.fillRect(mob.facing === 1 ? hx + 3 : hx + 1, sy + 2, 2, 2);
        // Comb (red)
        state.ctx.fillStyle = "#cc2222";
        state.ctx.fillRect(hx + 1, sy - 1, 3, 3);
        // Legs (thin orange)
        state.ctx.fillStyle = "#e08020";
        state.ctx.fillRect(sx + 5, sy + 12, 2, 4);
        state.ctx.fillRect(sx + 9, sy + 12, 2, 4);
        // Tail feathers
        state.ctx.fillStyle = isHurt ? "#ffaaaa" : "#ddd";
        const tx = mob.facing === 1 ? sx : sx + 12;
        state.ctx.fillRect(tx, sy + 3, 3, 4);
    }

    // Mob equipment overlay
    if (mob.equipment) {
        if (mob.equipment.armor) {
            state.ctx.fillStyle = "rgba(180, 180, 200, 0.3)";
            state.ctx.fillRect(sx + 2, sy + 12, def.width - 4, 20);
        }
        if (mob.equipment.weapon) {
            state.ctx.fillStyle = "#d4d4d4";
            const wx = mob.facing === 1 ? sx + def.width : sx - 6;
            state.ctx.fillRect(wx, sy + 10, 4, 14);
        }
    }

    // Fire effect when burning
    if (mob.burnTimer > 0 && def.hostile && mob.type !== "creeper") {
        state.ctx.fillStyle = "rgba(255, 136, 0, 0.6)";
        state.ctx.fillRect(sx + 2, sy - 4, def.width - 4, 8);
        state.ctx.fillStyle = "rgba(255, 204, 0, 0.5)";
        state.ctx.fillRect(sx + 4, sy - 8, def.width - 8, 6);
        state.ctx.fillStyle = "rgba(255, 68, 0, 0.4)";
        state.ctx.fillRect(sx, sy + 2, def.width, 6);
    }

    // Health bar above mob (only when damaged)
    if (mob.health < def.maxHealth) {
        const barW = def.width + 8;
        const bx = sx - 4;
        const by = sy - 10;
        state.ctx.fillStyle = "rgba(0,0,0,0.6)";
        state.ctx.fillRect(bx, by, barW, 5);
        const pct = mob.health / def.maxHealth;
        state.ctx.fillStyle = pct > 0.5 ? "#4ade80" : pct > 0.25 ? "#fbbf24" : "#ef4444";
        state.ctx.fillRect(bx, by, barW * pct, 5);
    }
}

export function drawAllMobs() {
    for (const mob of state.mobs) drawMob(mob);
}

// --- PROJECTILES ---
export function drawProjectiles() {
    for (const p of state.projectiles) {
        const sx = p.x - state.camera.x + state.screenShake.x;
        const sy = p.y - state.camera.y + state.screenShake.y;
        if (p.isRocket) {
            // Rocket projectile
            state.ctx.save();
            state.ctx.translate(sx, sy);
            state.ctx.rotate(Math.atan2(p.velY, p.velX));
            // Body (red)
            state.ctx.fillStyle = "#cc3333";
            state.ctx.fillRect(-6, -3, 12, 6);
            // Nose (gray)
            state.ctx.fillStyle = "#aaa";
            state.ctx.beginPath();
            state.ctx.moveTo(8, 0);
            state.ctx.lineTo(6, -3);
            state.ctx.lineTo(6, 3);
            state.ctx.closePath();
            state.ctx.fill();
            // Fins
            state.ctx.fillStyle = "#cc3333";
            state.ctx.fillRect(-6, -5, 4, 2);
            state.ctx.fillRect(-6, 3, 4, 2);
            // Flame trail
            state.ctx.fillStyle = "#ff8800";
            state.ctx.fillRect(-10, -2, 4, 4);
            state.ctx.fillStyle = "#ffcc00";
            state.ctx.fillRect(-8, -1, 2, 2);
            state.ctx.restore();
        } else if (p.isBullet) {
            // Small fast bullet
            state.ctx.fillStyle = "#ffcc44";
            state.ctx.save();
            state.ctx.translate(sx, sy);
            state.ctx.rotate(Math.atan2(p.velY, p.velX));
            state.ctx.fillRect(-3, -1, 6, 2);
            state.ctx.restore();
            // Muzzle trail
            state.ctx.fillStyle = "rgba(255, 200, 50, 0.3)";
            state.ctx.fillRect(sx - 6, sy - 1, 4, 2);
        } else {
            // Arrow
            state.ctx.fillStyle = "#8b6c42";
            state.ctx.save();
            state.ctx.translate(sx, sy);
            state.ctx.rotate(Math.atan2(p.velY, p.velX));
            state.ctx.fillRect(-8, -1, 16, 3);
            state.ctx.fillStyle = "#aaaaaa";
            state.ctx.fillRect(6, -2, 4, 5);
            state.ctx.fillStyle = "#ffffff";
            state.ctx.fillRect(-8, -3, 4, 2);
            state.ctx.fillRect(-8, 2, 4, 2);
            state.ctx.restore();
        }
    }
}

// --- PARTICLES ---
export function drawParticles() {
    for (const p of state.particles) {
        const sx = p.x - state.camera.x + state.screenShake.x;
        const sy = p.y - state.camera.y + state.screenShake.y;
        state.ctx.globalAlpha = p.life / 50;
        state.ctx.fillStyle = p.color;
        state.ctx.fillRect(sx - p.size / 2, sy - p.size / 2, p.size, p.size);
    }
    state.ctx.globalAlpha = 1;
}
