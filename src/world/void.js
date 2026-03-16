// ============================================================
// WORLD/VOID.JS - Void dimension world generation
// ============================================================
// A dimension made entirely of bedrock-colored variants.
// Bedrock terrain, bedrock trees, rare rainbow Void Stone.
// ============================================================

import { state } from '../state.js';
import { BLOCKS, WORLD_WIDTH, WORLD_HEIGHT } from '../constants.js';

function generateVoidTerrain() {
    const heights = new Array(WORLD_WIDTH);
    const base = 30;
    let seed = 7777;
    function rng() { seed = (seed * 1664525 + 1013904223) & 0xffffffff; return (seed >>> 0) / 0xffffffff; }
    for (let x = 0; x < WORLD_WIDTH; x++) {
        const t = x / WORLD_WIDTH;
        const h = Math.sin(t * Math.PI * 8) * 4 + Math.sin(t * Math.PI * 18 + 2.1) * 2 + rng() * 2;
        heights[x] = Math.round(base + h);
    }
    return heights;
}

export function generateVoidWorld() {
    for (let x = 0; x < WORLD_WIDTH; x++) {
        state.voidWorld[x] = new Uint8Array(WORLD_HEIGHT);
        state.voidBgWorld[x] = new Uint8Array(WORLD_HEIGHT);
    }

    const heights = generateVoidTerrain();

    // Fill terrain with void bedrock
    for (let x = 0; x < WORLD_WIDTH; x++) {
        const surf = heights[x];
        for (let y = 0; y < WORLD_HEIGHT; y++) {
            if (y === surf) {
                state.voidWorld[x][y] = BLOCKS.VOID_BEDROCK;
            } else if (y > surf && y < WORLD_HEIGHT - 1) {
                state.voidWorld[x][y] = BLOCKS.VOID_BEDROCK;
            } else if (y === WORLD_HEIGHT - 1) {
                state.voidWorld[x][y] = BLOCKS.BEDROCK;
            }
        }
    }

    // Place bedrock trees (void wood trunk + void leaves canopy)
    for (let x = 5; x < WORLD_WIDTH - 5; x++) {
        if (Math.random() < 0.04) {
            const surf = heights[x];
            if (state.voidWorld[x][surf] !== BLOCKS.VOID_BEDROCK) continue;
            const trunkH = 5 + Math.floor(Math.random() * 3);
            // Trunk
            for (let ty = surf - trunkH; ty < surf; ty++) {
                if (ty >= 0) state.voidWorld[x][ty] = BLOCKS.VOID_WOOD;
            }
            // Canopy (diamond shape)
            const topY = surf - trunkH;
            for (let dy = -3; dy <= 1; dy++) {
                for (let dx = -3; dx <= 3; dx++) {
                    if (Math.abs(dx) + Math.abs(dy) <= 3) {
                        const lx = x + dx, ly = topY + dy;
                        if (lx >= 0 && lx < WORLD_WIDTH && ly >= 0 && ly < WORLD_HEIGHT) {
                            if (state.voidWorld[lx][ly] === BLOCKS.AIR) {
                                state.voidWorld[lx][ly] = BLOCKS.VOID_LEAVES;
                            }
                        }
                    }
                }
            }
        }
    }

    // Scatter rare Void Stone in the underground
    for (let x = 0; x < WORLD_WIDTH; x++) {
        const surf = heights[x];
        for (let y = surf + 3; y < WORLD_HEIGHT - 1; y++) {
            if (state.voidWorld[x][y] === BLOCKS.VOID_BEDROCK && Math.random() < 0.003) {
                state.voidWorld[x][y] = BLOCKS.VOID_STONE;
            }
        }
    }
}
