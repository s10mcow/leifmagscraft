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
    // Iron door (closed) - metallic door
    if (blockType === BLOCKS.IRON_DOOR_CLOSED) {
        state.ctx.fillStyle = "#aaaaaa";
        state.ctx.fillRect(screenX, screenY, BLOCK_SIZE, BLOCK_SIZE);
        state.ctx.fillStyle = "#888888";
        state.ctx.fillRect(screenX + 2, screenY, 2, BLOCK_SIZE);
        state.ctx.fillRect(screenX + BLOCK_SIZE - 4, screenY, 2, BLOCK_SIZE);
        state.ctx.fillStyle = "#bbbbbb";
        state.ctx.fillRect(screenX + 6, screenY + 2, BLOCK_SIZE - 12, BLOCK_SIZE - 4);
        // Rivets
        state.ctx.fillStyle = "#666666";
        state.ctx.fillRect(screenX + 8, screenY + 4, 3, 3);
        state.ctx.fillRect(screenX + BLOCK_SIZE - 11, screenY + 4, 3, 3);
        state.ctx.fillRect(screenX + 8, screenY + BLOCK_SIZE - 7, 3, 3);
        state.ctx.fillRect(screenX + BLOCK_SIZE - 11, screenY + BLOCK_SIZE - 7, 3, 3);
        // Handle
        state.ctx.fillStyle = "#cccc00";
        state.ctx.fillRect(screenX + BLOCK_SIZE - 10, screenY + 14, 4, 4);
    }
    // Iron door (open) - thin frame on one side
    if (blockType === BLOCKS.IRON_DOOR_OPEN) {
        state.ctx.fillStyle = "#aaaaaa";
        state.ctx.fillRect(screenX, screenY, 6, BLOCK_SIZE);
        state.ctx.fillStyle = "#888888";
        state.ctx.fillRect(screenX + 2, screenY, 2, BLOCK_SIZE);
        state.ctx.fillStyle = "#cccc00";
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
    // Cracked Earth — hairline cracks on surface
    if (blockType === BLOCKS.CRACKED_EARTH) {
        if (info.topColor) {
            state.ctx.fillStyle = info.topColor;
            state.ctx.fillRect(screenX, screenY, BLOCK_SIZE, 5);
        }
        state.ctx.fillStyle = "#4a3010";
        state.ctx.fillRect(screenX + 4,  screenY + 8,  1, 8);
        state.ctx.fillRect(screenX + 4,  screenY + 16, 6, 1);
        state.ctx.fillRect(screenX + 18, screenY + 6,  1, 12);
        state.ctx.fillRect(screenX + 18, screenY + 18, 8, 1);
        state.ctx.fillRect(screenX + 11, screenY + 20, 1, 7);
    }
    // Ash — grey dusted top
    if (blockType === BLOCKS.ASH) {
        if (info.topColor) {
            state.ctx.fillStyle = info.topColor;
            state.ctx.fillRect(screenX, screenY, BLOCK_SIZE, 5);
        }
        state.ctx.fillStyle = "#7a7070";
        state.ctx.fillRect(screenX + 6,  screenY + 10, 4, 3);
        state.ctx.fillRect(screenX + 20, screenY + 14, 4, 3);
        state.ctx.fillRect(screenX + 12, screenY + 22, 4, 3);
    }
    // Dead Wood — grey bark grain lines
    if (blockType === BLOCKS.DEAD_WOOD) {
        state.ctx.fillStyle = "#3a2818";
        state.ctx.fillRect(screenX + 5,  screenY, 2, BLOCK_SIZE);
        state.ctx.fillRect(screenX + 14, screenY, 2, BLOCK_SIZE);
        state.ctx.fillRect(screenX + 23, screenY, 2, BLOCK_SIZE);
        state.ctx.fillStyle = "#7a6050";
        state.ctx.fillRect(screenX + 3, screenY + 8,  3, 2);
        state.ctx.fillRect(screenX + 20, screenY + 20, 3, 2);
    }
    // Wasteland Stone — greenish spots (irradiated)
    if (blockType === BLOCKS.WASTELAND_STONE && info.spots) {
        state.ctx.fillStyle = info.spots;
        state.ctx.fillRect(screenX + 4,  screenY + 4,  5, 4);
        state.ctx.fillRect(screenX + 18, screenY + 14, 5, 4);
        state.ctx.fillRect(screenX + 8,  screenY + 22, 4, 4);
        state.ctx.fillRect(screenX + 24, screenY + 6,  4, 3);
    }
    // Toxic Puddle — animated green glow
    if (blockType === BLOCKS.TOXIC_PUDDLE) {
        const t = performance.now() * 0.002;
        state.ctx.fillStyle = "rgba(26, 112, 32, 0.75)";
        state.ctx.fillRect(screenX, screenY, BLOCK_SIZE, BLOCK_SIZE);
        const bx = Math.sin(t + screenX * 0.08) * 3 + 6;
        const by = Math.cos(t + screenY * 0.08) * 3 + 8;
        state.ctx.fillStyle = "rgba(80, 220, 60, 0.35)";
        state.ctx.fillRect(screenX + bx, screenY + by, 10, 6);
        state.ctx.fillStyle = "rgba(180, 255, 100, 0.2)";
        state.ctx.fillRect(screenX + bx + 8, screenY + by + 8, 8, 5);
        return;
    }
    // Blast Furnace — iron frame + orange glow interior
    if (blockType === BLOCKS.FURNACE) {
        // Stone body
        state.ctx.fillStyle = "#5a5050";
        state.ctx.fillRect(screenX, screenY, BLOCK_SIZE, BLOCK_SIZE);
        // Brick lines
        state.ctx.fillStyle = "#443535";
        state.ctx.fillRect(screenX, screenY + 10, BLOCK_SIZE, 2);
        state.ctx.fillRect(screenX, screenY + 22, BLOCK_SIZE, 2);
        // Furnace mouth — glows when active
        const key = state.furnacePos ? `${state.furnacePos.x},${state.furnacePos.y}` : null;
        const fData = key ? state.furnaceData[key] : null;
        const active = fData && fData.fuelLeft > 0;
        const t3 = performance.now() * 0.004;
        const glow2 = active ? 0.5 + Math.sin(t3) * 0.25 : 0.15;
        state.ctx.fillStyle = active ? `rgba(255,120,0,${glow2})` : `rgba(60,40,30,${glow2})`;
        state.ctx.fillRect(screenX + 8, screenY + 12, 16, 10);
        // Door frame
        state.ctx.fillStyle = "#333";
        state.ctx.fillRect(screenX + 6, screenY + 10, 20, 14);
        state.ctx.fillStyle = active ? `rgba(255,120,0,${glow2})` : "rgba(40,30,20,0.8)";
        state.ctx.fillRect(screenX + 8, screenY + 12, 16, 10);
    }
    if (blockType === BLOCKS.BLAST_FURNACE) {
        state.ctx.fillStyle = "#3a3a3a";
        state.ctx.fillRect(screenX, screenY, BLOCK_SIZE, BLOCK_SIZE);
        // Glow window
        const t2 = performance.now() * 0.003;
        const glow = 0.6 + Math.sin(t2) * 0.2;
        state.ctx.fillStyle = `rgba(200, 96, 0, ${glow})`;
        state.ctx.fillRect(screenX + 6, screenY + 8, 20, 14);
        // Vent holes
        state.ctx.fillStyle = "#1a1a1a";
        state.ctx.fillRect(screenX + 4, screenY + 4, 4, 3);
        state.ctx.fillRect(screenX + 24, screenY + 4, 4, 3);
        state.ctx.fillRect(screenX + 4, screenY + 25, 4, 3);
        state.ctx.fillRect(screenX + 24, screenY + 25, 4, 3);
    }
    // Raw Steel Ore — stone base with silver-blue metallic streaks
    if (blockType === BLOCKS.RAW_STEEL_ORE) {
        state.ctx.fillStyle = "#aabac8";
        state.ctx.fillRect(screenX + 3,  screenY + 5,  6, 5);
        state.ctx.fillRect(screenX + 18, screenY + 14, 7, 4);
        state.ctx.fillRect(screenX + 8,  screenY + 20, 10, 5);
    }
    // Titanium Ore — near-black dark blue, much darker than steel
    if (blockType === BLOCKS.TITANIUM_ORE) {
        state.ctx.fillStyle = "#1e3040";
        state.ctx.fillRect(screenX + 5,  screenY + 6,  5, 5);
        state.ctx.fillRect(screenX + 20, screenY + 16, 5, 5);
        state.ctx.fillStyle = "#2a4560";
        state.ctx.fillRect(screenX + 12, screenY + 12, 4, 4);
    }
    // Uranium Ore — blue-tinted emerald (teal-green)
    if (blockType === BLOCKS.URANIUM_ORE) {
        state.ctx.fillStyle = "#3a1a70";
        state.ctx.fillRect(screenX + 4,  screenY + 7,  6, 6);
        state.ctx.fillRect(screenX + 19, screenY + 15, 6, 5);
        state.ctx.fillRect(screenX + 10, screenY + 21, 5, 4);
        state.ctx.fillStyle = "#6a30c0";
        state.ctx.fillRect(screenX + 6,  screenY + 9,  3, 3);
        state.ctx.fillRect(screenX + 21, screenY + 17, 3, 3);
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
    // Candy Ground — pastel pink base with white swirl lines
    if (blockType === BLOCKS.CANDY_GROUND) {
        // Draw top strip (lighter pink)
        state.ctx.fillStyle = "#fce7f3";
        state.ctx.fillRect(screenX, screenY, BLOCK_SIZE, 6);
        // Diagonal swirl stripes across block
        state.ctx.lineWidth = 3;
        state.ctx.strokeStyle = "rgba(255,255,255,0.35)";
        state.ctx.beginPath();
        state.ctx.moveTo(screenX + 4,            screenY);
        state.ctx.lineTo(screenX + BLOCK_SIZE,   screenY + BLOCK_SIZE - 4);
        state.ctx.stroke();
        state.ctx.beginPath();
        state.ctx.moveTo(screenX,                screenY + 8);
        state.ctx.lineTo(screenX + BLOCK_SIZE - 8, screenY + BLOCK_SIZE);
        state.ctx.stroke();
    }
    // Lollipop Top — bright candy ball with white swirl detail
    if (blockType === BLOCKS.LOLLIPOP_TOP) {
        // Alternate between pink, red, blue in a pattern based on position
        const colorPick = (Math.floor(screenX / BLOCK_SIZE) + Math.floor(screenY / BLOCK_SIZE)) % 3;
        const candyColors = ["#f472b6", "#ef4444", "#60a5fa"];
        state.ctx.fillStyle = candyColors[colorPick];
        state.ctx.fillRect(screenX, screenY, BLOCK_SIZE, BLOCK_SIZE);
        // White swirl arc
        state.ctx.fillStyle = "rgba(255,255,255,0.45)";
        state.ctx.beginPath();
        state.ctx.arc(screenX + BLOCK_SIZE * 0.4, screenY + BLOCK_SIZE * 0.4, BLOCK_SIZE * 0.28, 0, Math.PI * 1.1);
        state.ctx.lineWidth = 4;
        state.ctx.strokeStyle = "rgba(255,255,255,0.5)";
        state.ctx.stroke();
        // Shine dot
        state.ctx.fillStyle = "rgba(255,255,255,0.6)";
        state.ctx.fillRect(screenX + 6, screenY + 4, 6, 4);
        state.ctx.strokeStyle = "rgba(0,0,0,0.1)";
        state.ctx.strokeRect(screenX, screenY, BLOCK_SIZE, BLOCK_SIZE);
        return;
    }
    // Candy Cane — red and white diagonal stripes
    if (blockType === BLOCKS.CANDY_CANE) {
        state.ctx.fillStyle = "#ffffff";
        state.ctx.fillRect(screenX, screenY, BLOCK_SIZE, BLOCK_SIZE);
        // Red diagonal stripes
        state.ctx.fillStyle = "#ef4444";
        for (let si = -1; si <= 3; si++) {
            const sx2 = screenX + si * 12;
            state.ctx.beginPath();
            state.ctx.moveTo(sx2,      screenY);
            state.ctx.lineTo(sx2 + 8,  screenY);
            state.ctx.lineTo(sx2 + 8 + BLOCK_SIZE, screenY + BLOCK_SIZE);
            state.ctx.lineTo(sx2 + BLOCK_SIZE,      screenY + BLOCK_SIZE);
            state.ctx.closePath();
            state.ctx.fill();
        }
        state.ctx.strokeStyle = "rgba(0,0,0,0.12)";
        state.ctx.strokeRect(screenX, screenY, BLOCK_SIZE, BLOCK_SIZE);
        return;
    }
    // Smoker — mossy stone body with green smoke wisps
    if (blockType === BLOCKS.SMOKER) {
        state.ctx.fillStyle = "#4a5040";
        state.ctx.fillRect(screenX, screenY, BLOCK_SIZE, BLOCK_SIZE);
        // Stone lines
        state.ctx.fillStyle = "#353d30";
        state.ctx.fillRect(screenX, screenY + 10, BLOCK_SIZE, 2);
        state.ctx.fillRect(screenX, screenY + 22, BLOCK_SIZE, 2);
        // Cooking chamber
        const sKey = state.smokerPos ? `${state.smokerPos.x},${state.smokerPos.y}` : null;
        const sData = sKey ? state.smokerData[sKey] : null;
        const sActive = sData && sData.fuelLeft > 0;
        const t4 = performance.now() * 0.004;
        const sg = sActive ? 0.5 + Math.sin(t4) * 0.25 : 0.15;
        state.ctx.fillStyle = "#333";
        state.ctx.fillRect(screenX + 6, screenY + 10, 20, 14);
        state.ctx.fillStyle = sActive ? `rgba(100,200,80,${sg})` : "rgba(30,40,25,0.8)";
        state.ctx.fillRect(screenX + 8, screenY + 12, 16, 10);
        // Smoke vent slots at top
        state.ctx.fillStyle = "#222";
        state.ctx.fillRect(screenX + 8,  screenY + 2, 4, 4);
        state.ctx.fillRect(screenX + 20, screenY + 2, 4, 4);
        return;
    }
    // Glass — semi-transparent with window-pane cross
    if (blockType === BLOCKS.GLASS) {
        state.ctx.fillStyle = "rgba(184, 216, 240, 0.3)";
        state.ctx.fillRect(screenX, screenY, BLOCK_SIZE, BLOCK_SIZE);
        // Pane cross lines
        state.ctx.strokeStyle = "rgba(200, 232, 255, 0.55)";
        state.ctx.lineWidth = 1;
        state.ctx.beginPath();
        state.ctx.moveTo(screenX + BLOCK_SIZE / 2, screenY);
        state.ctx.lineTo(screenX + BLOCK_SIZE / 2, screenY + BLOCK_SIZE);
        state.ctx.moveTo(screenX, screenY + BLOCK_SIZE / 2);
        state.ctx.lineTo(screenX + BLOCK_SIZE, screenY + BLOCK_SIZE / 2);
        state.ctx.stroke();
        // Corner shine highlight
        state.ctx.fillStyle = "rgba(255,255,255,0.22)";
        state.ctx.fillRect(screenX + 3, screenY + 3, 8, 5);
        // Border
        state.ctx.strokeStyle = "rgba(180, 220, 255, 0.5)";
        state.ctx.strokeRect(screenX, screenY, BLOCK_SIZE, BLOCK_SIZE);
        return;
    }
    // Silver Ore — stone base with shimmering silver-white flecks
    if (blockType === BLOCKS.SILVER_ORE) {
        state.ctx.fillStyle = "#8896a8";
        state.ctx.fillRect(screenX, screenY, BLOCK_SIZE, BLOCK_SIZE);
        state.ctx.fillStyle = "#d8e0ec";
        state.ctx.fillRect(screenX + 4,  screenY + 6,  7, 5);
        state.ctx.fillRect(screenX + 19, screenY + 16, 6, 4);
        state.ctx.fillRect(screenX + 9,  screenY + 21, 8, 4);
        state.ctx.fillStyle = "rgba(255,255,255,0.35)";
        state.ctx.fillRect(screenX + 5,  screenY + 7,  3, 2);
        state.ctx.fillRect(screenX + 20, screenY + 17, 2, 2);
        state.ctx.strokeStyle = "rgba(0,0,0,0.15)";
        state.ctx.strokeRect(screenX, screenY, BLOCK_SIZE, BLOCK_SIZE);
        return;
    }
    // Void Bedrock — dark grey-blue with faint crystalline texture
    if (blockType === BLOCKS.VOID_BEDROCK) {
        state.ctx.fillStyle = "#2a2a3a";
        state.ctx.fillRect(screenX, screenY, BLOCK_SIZE, BLOCK_SIZE);
        state.ctx.fillStyle = "#383848";
        state.ctx.fillRect(screenX + 4, screenY + 5, 6, 5);
        state.ctx.fillRect(screenX + 18, screenY + 14, 7, 5);
        state.ctx.fillRect(screenX + 10, screenY + 22, 5, 4);
        state.ctx.fillStyle = "#1e1e2e";
        state.ctx.fillRect(screenX + 22, screenY + 4, 4, 4);
        state.ctx.fillRect(screenX + 6, screenY + 16, 4, 3);
        state.ctx.strokeStyle = "rgba(100,100,160,0.12)";
        state.ctx.strokeRect(screenX, screenY, BLOCK_SIZE, BLOCK_SIZE);
        return;
    }
    // Void Wood — dark grey trunk with subtle blue-grey grain
    if (blockType === BLOCKS.VOID_WOOD) {
        state.ctx.fillStyle = "#3a3a4a";
        state.ctx.fillRect(screenX, screenY, BLOCK_SIZE, BLOCK_SIZE);
        state.ctx.fillStyle = "#2e2e3e";
        state.ctx.fillRect(screenX + 6, screenY, 2, BLOCK_SIZE);
        state.ctx.fillRect(screenX + 16, screenY, 2, BLOCK_SIZE);
        state.ctx.fillRect(screenX + 24, screenY, 2, BLOCK_SIZE);
        state.ctx.fillStyle = "#4a4a5a";
        state.ctx.fillRect(screenX + 4, screenY, 1, BLOCK_SIZE);
        state.ctx.fillRect(screenX + 14, screenY, 1, BLOCK_SIZE);
        state.ctx.strokeStyle = "rgba(100,100,160,0.12)";
        state.ctx.strokeRect(screenX, screenY, BLOCK_SIZE, BLOCK_SIZE);
        return;
    }
    // Void Leaves — dark grey-blue leaf clusters
    if (blockType === BLOCKS.VOID_LEAVES) {
        state.ctx.fillStyle = "#4a4a5a";
        state.ctx.fillRect(screenX, screenY, BLOCK_SIZE, BLOCK_SIZE);
        state.ctx.fillStyle = "#5a5a6a";
        state.ctx.fillRect(screenX + 2, screenY + 3, 5, 4);
        state.ctx.fillRect(screenX + 14, screenY + 8, 6, 5);
        state.ctx.fillRect(screenX + 6, screenY + 18, 5, 4);
        state.ctx.fillRect(screenX + 20, screenY + 22, 6, 4);
        state.ctx.fillStyle = "#3a3a4a";
        state.ctx.fillRect(screenX + 8, screenY + 4, 4, 3);
        state.ctx.fillRect(screenX + 22, screenY + 14, 4, 3);
        state.ctx.strokeStyle = "rgba(100,100,160,0.12)";
        state.ctx.strokeRect(screenX, screenY, BLOCK_SIZE, BLOCK_SIZE);
        return;
    }
    // Void Stone — rainbow shimmer effect
    if (blockType === BLOCKS.VOID_STONE) {
        state.ctx.fillStyle = "#555566";
        state.ctx.fillRect(screenX, screenY, BLOCK_SIZE, BLOCK_SIZE);
        const t = performance.now() * 0.002;
        const hue1 = ((t * 50 + screenX + screenY) % 360);
        const hue2 = ((t * 50 + screenX * 2 + screenY * 3 + 120) % 360);
        const hue3 = ((t * 50 + screenX * 3 + screenY + 240) % 360);
        state.ctx.fillStyle = `hsla(${hue1}, 80%, 60%, 0.5)`;
        state.ctx.fillRect(screenX + 4, screenY + 5, 7, 6);
        state.ctx.fillStyle = `hsla(${hue2}, 80%, 60%, 0.5)`;
        state.ctx.fillRect(screenX + 18, screenY + 14, 6, 5);
        state.ctx.fillStyle = `hsla(${hue3}, 80%, 60%, 0.5)`;
        state.ctx.fillRect(screenX + 9, screenY + 21, 8, 5);
        // Sparkle highlight
        state.ctx.fillStyle = `rgba(255,255,255,${0.3 + Math.sin(t * 3) * 0.15})`;
        state.ctx.fillRect(screenX + 6, screenY + 7, 3, 2);
        state.ctx.fillRect(screenX + 20, screenY + 16, 2, 2);
        state.ctx.strokeStyle = "rgba(200,200,255,0.3)";
        state.ctx.strokeRect(screenX, screenY, BLOCK_SIZE, BLOCK_SIZE);
        return;
    }
    if (blockType === BLOCKS.ORIUM_SHRINE) {
        const t = performance.now() * 0.002;
        // Dark stone base
        state.ctx.fillStyle = "#3a2a1a";
        state.ctx.fillRect(screenX, screenY, BLOCK_SIZE, BLOCK_SIZE);
        // Gold ornate frame
        state.ctx.fillStyle = "#d4af37";
        state.ctx.fillRect(screenX, screenY, BLOCK_SIZE, 3);
        state.ctx.fillRect(screenX, screenY + BLOCK_SIZE - 3, BLOCK_SIZE, 3);
        state.ctx.fillRect(screenX, screenY, 3, BLOCK_SIZE);
        state.ctx.fillRect(screenX + BLOCK_SIZE - 3, screenY, 3, BLOCK_SIZE);
        // Diamond center gem
        state.ctx.fillStyle = `hsla(${170 + Math.sin(t) * 20}, 80%, 65%, 0.9)`;
        state.ctx.fillRect(screenX + 10, screenY + 10, 12, 12);
        // Emerald accents
        state.ctx.fillStyle = "#50c878";
        state.ctx.fillRect(screenX + 5, screenY + 5, 4, 4);
        state.ctx.fillRect(screenX + 23, screenY + 5, 4, 4);
        state.ctx.fillRect(screenX + 5, screenY + 23, 4, 4);
        state.ctx.fillRect(screenX + 23, screenY + 23, 4, 4);
        // Pulsing glow
        const glow = 0.15 + Math.sin(t * 2) * 0.1;
        state.ctx.fillStyle = `rgba(255, 215, 0, ${glow})`;
        state.ctx.fillRect(screenX, screenY, BLOCK_SIZE, BLOCK_SIZE);
        return;
    }
    if (blockType === BLOCKS.POSSUM_KING_SHRINE) {
        const t = performance.now() * 0.002;
        // Pink stone base
        state.ctx.fillStyle = "#cc6699";
        state.ctx.fillRect(screenX, screenY, BLOCK_SIZE, BLOCK_SIZE);
        // Sparkly pink frame
        state.ctx.fillStyle = "#ff88cc";
        state.ctx.fillRect(screenX, screenY, BLOCK_SIZE, 3);
        state.ctx.fillRect(screenX, screenY + BLOCK_SIZE - 3, BLOCK_SIZE, 3);
        state.ctx.fillRect(screenX, screenY, 3, BLOCK_SIZE);
        state.ctx.fillRect(screenX + BLOCK_SIZE - 3, screenY, 3, BLOCK_SIZE);
        // Possum core gem center (pulsing)
        const pulse = 0.6 + Math.sin(t * 3) * 0.4;
        state.ctx.fillStyle = `rgba(255, 136, 204, ${pulse})`;
        state.ctx.fillRect(screenX + 10, screenY + 10, 12, 12);
        state.ctx.fillStyle = `rgba(255, 200, 230, ${pulse * 0.8})`;
        state.ctx.fillRect(screenX + 12, screenY + 12, 8, 8);
        // Heart accents
        state.ctx.fillStyle = "#ff66aa";
        state.ctx.fillRect(screenX + 5, screenY + 5, 4, 4);
        state.ctx.fillRect(screenX + 23, screenY + 5, 4, 4);
        state.ctx.fillRect(screenX + 5, screenY + 23, 4, 4);
        state.ctx.fillRect(screenX + 23, screenY + 23, 4, 4);
        return;
    }
    if (blockType === BLOCKS.VOID_GOD_SHRINE) {
        const t = performance.now() * 0.002;
        // Dark void base
        state.ctx.fillStyle = "#1a1a2a";
        state.ctx.fillRect(screenX, screenY, BLOCK_SIZE, BLOCK_SIZE);
        // Rainbow shifting frame
        const hue = (t * 50) % 360;
        state.ctx.fillStyle = `hsl(${hue}, 80%, 50%)`;
        state.ctx.fillRect(screenX, screenY, BLOCK_SIZE, 3);
        state.ctx.fillRect(screenX, screenY + BLOCK_SIZE - 3, BLOCK_SIZE, 3);
        state.ctx.fillRect(screenX, screenY, 3, BLOCK_SIZE);
        state.ctx.fillRect(screenX + BLOCK_SIZE - 3, screenY, 3, BLOCK_SIZE);
        // Pulsing void core
        const pulse = 0.5 + Math.sin(t * 3) * 0.4;
        state.ctx.fillStyle = `rgba(100, 68, 170, ${pulse})`;
        state.ctx.fillRect(screenX + 10, screenY + 10, 12, 12);
        state.ctx.fillStyle = `hsl(${(hue + 120) % 360}, 80%, 60%)`;
        state.ctx.fillRect(screenX + 12, screenY + 12, 8, 8);
        // Corner accents (rainbow)
        state.ctx.fillStyle = `hsl(${(hue + 60) % 360}, 70%, 50%)`;
        state.ctx.fillRect(screenX + 5, screenY + 5, 4, 4);
        state.ctx.fillRect(screenX + 23, screenY + 5, 4, 4);
        state.ctx.fillRect(screenX + 5, screenY + 23, 4, 4);
        state.ctx.fillRect(screenX + 23, screenY + 23, 4, 4);
        return;
    }
    if (blockType === BLOCKS.ROCK_CANDY) {
        // Rock Candy ore — purple crystalline rock
        state.ctx.fillStyle = "#8a7090";
        state.ctx.fillRect(screenX, screenY, BLOCK_SIZE, BLOCK_SIZE);
        // Crystal chunks
        state.ctx.fillStyle = "#e066ff";
        state.ctx.fillRect(screenX + 4, screenY + 6, 8, 10);
        state.ctx.fillRect(screenX + 18, screenY + 16, 10, 8);
        state.ctx.fillRect(screenX + 8, screenY + 22, 6, 7);
        // Bright highlights
        state.ctx.fillStyle = "#f0aaff";
        state.ctx.fillRect(screenX + 5, screenY + 7, 4, 4);
        state.ctx.fillRect(screenX + 20, screenY + 17, 4, 4);
        state.ctx.fillRect(screenX + 22, screenY + 4, 6, 8);
        // Sparkle
        state.ctx.fillStyle = "#ffffff";
        state.ctx.fillRect(screenX + 6, screenY + 8, 2, 2);
        state.ctx.fillRect(screenX + 21, screenY + 18, 2, 2);
        return;
    }
    if (blockType === BLOCKS.GOLD_CANDY) {
        // Gold candy block — shiny gold with candy sheen
        state.ctx.fillStyle = "#ffd700";
        state.ctx.fillRect(screenX, screenY, BLOCK_SIZE, BLOCK_SIZE);
        // Lighter highlight stripe
        state.ctx.fillStyle = "#ffe44d";
        state.ctx.fillRect(screenX + 2, screenY + 2, BLOCK_SIZE - 4, 6);
        // Darker gold shadow
        state.ctx.fillStyle = "#daa520";
        state.ctx.fillRect(screenX + 2, screenY + BLOCK_SIZE - 6, BLOCK_SIZE - 4, 4);
        // Candy swirl spots
        state.ctx.fillStyle = "#fff3a0";
        state.ctx.fillRect(screenX + 6, screenY + 12, 5, 5);
        state.ctx.fillRect(screenX + 20, screenY + 18, 6, 4);
        // Outline
        state.ctx.strokeStyle = "#b8860b";
        state.ctx.strokeRect(screenX, screenY, BLOCK_SIZE, BLOCK_SIZE);
        return;
    }
    if (blockType === BLOCKS.GASLY_SHRINE) {
        const t = performance.now() * 0.002;
        // Dark netherrack base
        state.ctx.fillStyle = "#3a1515";
        state.ctx.fillRect(screenX, screenY, BLOCK_SIZE, BLOCK_SIZE);
        // Fiery frame
        state.ctx.fillStyle = "#ff4400";
        state.ctx.fillRect(screenX, screenY, BLOCK_SIZE, 3);
        state.ctx.fillRect(screenX, screenY + BLOCK_SIZE - 3, BLOCK_SIZE, 3);
        state.ctx.fillRect(screenX, screenY, 3, BLOCK_SIZE);
        state.ctx.fillRect(screenX + BLOCK_SIZE - 3, screenY, 3, BLOCK_SIZE);
        // Fire orb center
        const flicker = 0.7 + Math.sin(t * 4) * 0.3;
        state.ctx.fillStyle = `rgba(255, 100, 0, ${flicker})`;
        state.ctx.fillRect(screenX + 10, screenY + 10, 12, 12);
        state.ctx.fillStyle = `rgba(255, 200, 0, ${flicker * 0.8})`;
        state.ctx.fillRect(screenX + 12, screenY + 12, 8, 8);
        // Gold accents
        state.ctx.fillStyle = "#ffd700";
        state.ctx.fillRect(screenX + 5, screenY + 5, 4, 4);
        state.ctx.fillRect(screenX + 23, screenY + 5, 4, 4);
        state.ctx.fillRect(screenX + 5, screenY + 23, 4, 4);
        state.ctx.fillRect(screenX + 23, screenY + 23, 4, 4);
        return;
    }
    state.ctx.strokeStyle = "rgba(0, 0, 0, 0.15)";
    state.ctx.strokeRect(screenX, screenY, BLOCK_SIZE, BLOCK_SIZE);
}
