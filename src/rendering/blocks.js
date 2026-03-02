// ============================================================
// RENDERING/BLOCKS.JS - Block drawing
// ============================================================

import { state } from '../state.js';
import { BLOCKS, BLOCK_SIZE, BLOCK_INFO } from '../constants.js';

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
    // Warped Grass - blue top band like regular grass
    if (blockType === BLOCKS.WARPED_GRASS && info.topColor) {
        state.ctx.fillStyle = info.topColor;
        state.ctx.fillRect(screenX, screenY, BLOCK_SIZE, 6);
        // Blue grass blades
        state.ctx.fillStyle = "#2ab5df";
        state.ctx.fillRect(screenX + 3, screenY - 2, 2, 4);
        state.ctx.fillRect(screenX + 10, screenY - 3, 2, 5);
        state.ctx.fillRect(screenX + 20, screenY - 2, 2, 4);
        state.ctx.fillRect(screenX + 27, screenY - 3, 2, 5);
        // Dark blue-purple spots on body
        state.ctx.fillStyle = "#16103a";
        state.ctx.fillRect(screenX + 4, screenY + 10, 5, 4);
        state.ctx.fillRect(screenX + 18, screenY + 18, 6, 4);
    }
    // Warped Wood - purple log with grain lines
    if (blockType === BLOCKS.WARPED_WOOD) {
        state.ctx.fillStyle = "#360844";
        state.ctx.fillRect(screenX + 6, screenY, 2, BLOCK_SIZE);
        state.ctx.fillRect(screenX + 16, screenY, 2, BLOCK_SIZE);
        state.ctx.fillRect(screenX + 24, screenY, 2, BLOCK_SIZE);
        state.ctx.fillStyle = "#6a2080";
        state.ctx.fillRect(screenX + 4, screenY, 1, BLOCK_SIZE);
        state.ctx.fillRect(screenX + 14, screenY, 1, BLOCK_SIZE);
    }
    // Warped Leaves - blue-teal leaf clusters
    if (blockType === BLOCKS.WARPED_LEAVES) {
        state.ctx.fillStyle = "#0a4060";
        state.ctx.fillRect(screenX + 2, screenY + 3, 5, 4);
        state.ctx.fillRect(screenX + 14, screenY + 8, 6, 5);
        state.ctx.fillRect(screenX + 6, screenY + 18, 5, 4);
        state.ctx.fillRect(screenX + 20, screenY + 22, 6, 4);
        state.ctx.fillStyle = "#1a8a9a";
        state.ctx.fillRect(screenX + 8, screenY + 4, 4, 3);
        state.ctx.fillRect(screenX + 22, screenY + 14, 4, 3);
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
