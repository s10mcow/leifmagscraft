// ============================================================
// VOID.JS - Void dimension generation
// ============================================================
// Looks like the overworld but rendered in black and white
// (grayscale CSS filter applied in frame-renderer.js).
// Generates standard rolling hills with grass/dirt/stone/trees.
// ============================================================

import { state } from '../state.js';
import { BLOCKS, WORLD_WIDTH, WORLD_HEIGHT, SURFACE_LEVEL } from '../constants.js';
import { initChestData } from './chunks.js';

function simpleNoise(x, seed) {
    return Math.sin(x * 0.05 + seed) * 6 +
           Math.sin(x * 0.1  + seed * 2) * 3 +
           Math.sin(x * 0.02 + seed * 0.5) * 10;
}

function generateVoidOakTree(cx, surfY, world) {
    const w = world || state.voidWorld;
    const trunkH = 4 + Math.floor(Math.random() * 3);
    for (let ty = surfY - trunkH; ty < surfY; ty++) {
        if (ty >= 0 && ty < WORLD_HEIGHT) w[cx][ty] = BLOCKS.WOOD;
    }
    const topY = surfY - trunkH;
    for (let dy = -2; dy <= 1; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
            if (Math.abs(dx) + Math.abs(dy) <= 3) {
                const lx = cx + dx, ly = topY + dy;
                if (lx >= 0 && lx < WORLD_WIDTH && ly >= 0 && ly < WORLD_HEIGHT) {
                    if (w[lx][ly] === BLOCKS.AIR) w[lx][ly] = BLOCKS.LEAVES;
                }
            }
        }
    }
}

export function generateVoidWorld() {
    const seed = 77.3; // Fixed seed for deterministic void world

    // Init arrays
    for (let x = 0; x < WORLD_WIDTH; x++) {
        state.voidWorld[x]   = new Array(WORLD_HEIGHT).fill(BLOCKS.AIR);
        state.voidBgWorld[x] = new Array(WORLD_HEIGHT).fill(BLOCKS.AIR);
    }

    // Generate overworld-like rolling hills terrain
    const surfaceHeights = new Array(WORLD_WIDTH);
    for (let x = 0; x < WORLD_WIDTH; x++) {
        surfaceHeights[x] = Math.floor(SURFACE_LEVEL + simpleNoise(x, seed));
    }

    for (let x = 0; x < WORLD_WIDTH; x++) {
        const surf = surfaceHeights[x];
        for (let y = 0; y < WORLD_HEIGHT; y++) {
            if (y === WORLD_HEIGHT - 1) {
                state.voidWorld[x][y] = BLOCKS.BEDROCK;
            } else if (y === surf) {
                state.voidWorld[x][y] = BLOCKS.GRASS;
            } else if (y > surf && y < surf + 4) {
                state.voidWorld[x][y] = BLOCKS.DIRT;
            } else if (y >= surf + 4 && y < WORLD_HEIGHT - 1) {
                state.voidWorld[x][y] = BLOCKS.STONE;
            }
        }
    }

    // Place some ores for interest
    for (let x = 1; x < WORLD_WIDTH - 1; x++) {
        const surf = surfaceHeights[x];
        for (let y = surf + 5; y < WORLD_HEIGHT - 2; y++) {
            if (state.voidWorld[x][y] !== BLOCKS.STONE) continue;
            const r = Math.random();
            if (r < 0.008) state.voidWorld[x][y] = BLOCKS.COAL;
            else if (r < 0.004) state.voidWorld[x][y] = BLOCKS.IRON;
            else if (r < 0.001 && y > surf + 20) state.voidWorld[x][y] = BLOCKS.DIAMOND;
        }
    }

    // Place oak trees
    for (let x = 4; x < WORLD_WIDTH - 4; x++) {
        if (Math.random() < 0.06) {
            const surf = surfaceHeights[x];
            if (state.voidWorld[x][surf] !== BLOCKS.GRASS) continue;
            generateVoidOakTree(x, surf);
            // Background tree layer too
            const bgx = Math.min(WORLD_WIDTH - 1, x + 1);
            generateVoidOakTree(bgx, surfaceHeights[bgx], state.voidBgWorld);
            x += 4;
        }
    }

    // A few loot chests
    for (let i = 0; i < 6; i++) {
        const cx = Math.floor(WORLD_WIDTH * (0.1 + i * 0.14));
        const surf = surfaceHeights[cx];
        if (surf > 0 && surf < WORLD_HEIGHT - 2) {
            state.voidWorld[cx][surf - 1] = BLOCKS.CHEST;
            initChestData(cx, surf - 1, "void_cache");
        }
    }
}
