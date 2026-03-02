// ============================================================
// CHUNKS.JS - Runtime world management utilities
// ============================================================
// switchDimension, initChestData, removeChestData,
// findSurfaceY, isBlockSolid
// ============================================================

import { state } from '../state.js';
import { BLOCKS, WORLD_WIDTH, WORLD_HEIGHT, ITEM_INFO, LOOT_TABLES } from '../constants.js';

export function switchDimension(toNether) {
    state.inNether = toNether;
    state.activeWorld = toNether ? state.netherWorld : state.world;
    state.activeBgWorld = toNether ? state.netherBgWorld : state.bgWorld;
}

export function initChestData(x, y, lootTableName) {
    const key = `${x},${y}`;
    state.chestData[key] = Array(9).fill(null).map(() => ({ itemId: 0, count: 0, durability: 0 }));
    if (lootTableName && LOOT_TABLES[lootTableName]) {
        const table = LOOT_TABLES[lootTableName];
        let slotIdx = 0;
        for (const entry of table) {
            if (slotIdx >= 9) break;
            if (Math.random() < entry.chance) {
                const count = entry.min + Math.floor(Math.random() * (entry.max - entry.min + 1));
                state.chestData[key][slotIdx] = {
                    itemId: entry.id,
                    count: count,
                    durability: (ITEM_INFO[entry.id] && ITEM_INFO[entry.id].durability) ? ITEM_INFO[entry.id].durability : 0
                };
                slotIdx++;
            }
        }
    }
}

export function removeChestData(x, y) {
    delete state.chestData[`${x},${y}`];
}

// Check if a block at (x,y) is solid (not air/water/torch/lava/open door/portal/tree)
export function isBlockSolid(x, y) {
    if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT) return true;
    const block = state.activeWorld[x][y];
    if (block === BLOCKS.AIR || block === BLOCKS.WATER || block === BLOCKS.TORCH ||
        block === BLOCKS.LAVA || block === BLOCKS.DOOR_OPEN || block === BLOCKS.NETHER_PORTAL ||
        block === BLOCKS.PRESSURE_PLATE || block === BLOCKS.CACTUS) return false;
    // Tree blocks are walkable UNLESS the player placed them there
    const isTreeBlock = block === BLOCKS.WOOD || block === BLOCKS.LEAVES ||
        block === BLOCKS.SPRUCE_WOOD || block === BLOCKS.SPRUCE_LEAVES ||
        block === BLOCKS.ACACIA_WOOD || block === BLOCKS.ACACIA_LEAVES ||
        block === BLOCKS.NETHER_WOOD || block === BLOCKS.NETHER_LEAVES ||
        block === BLOCKS.WARPED_WOOD || block === BLOCKS.WARPED_LEAVES;
    if (isTreeBlock && !state.placedBlocks.has(`${x},${y}`)) return false;
    return true;
}

// Find the surface Y at a given X (first solid block from top)
export function findSurfaceY(x) {
    const startY = state.inNether ? 3 : 0; // Skip Nether bedrock ceiling
    for (let y = startY; y < WORLD_HEIGHT; y++) {
        if (isBlockSolid(x, y)) return y;
    }
    return WORLD_HEIGHT - 1;
}
