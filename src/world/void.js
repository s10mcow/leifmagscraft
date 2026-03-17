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

    // Build Void God Palace near center (bedrock walls, hollow inside)
    const palaceX = Math.floor(WORLD_WIDTH / 2) + 30;
    const palaceW = 20; // half-width
    const palaceH = 15; // height
    const palaceSurf = heights[palaceX];

    // Flatten terrain under palace
    for (let x = palaceX - palaceW - 2; x <= palaceX + palaceW + 2; x++) {
        if (x < 0 || x >= WORLD_WIDTH) continue;
        heights[x] = palaceSurf;
        for (let y = 0; y < palaceSurf; y++) {
            state.voidWorld[x][y] = BLOCKS.AIR;
        }
        state.voidWorld[x][palaceSurf] = BLOCKS.VOID_BEDROCK;
    }

    // Palace walls and floor (bedrock)
    for (let layer = 0; layer < palaceH; layer++) {
        const y = palaceSurf - 1 - layer;
        if (y < 0) break;
        for (let dx = -palaceW; dx <= palaceW; dx++) {
            const px = palaceX + dx;
            if (px < 0 || px >= WORLD_WIDTH) continue;
            const isWall = Math.abs(dx) >= palaceW - 1 || layer === 0 || layer === palaceH - 1;
            state.voidWorld[px][y] = isWall ? BLOCKS.BEDROCK : BLOCKS.AIR;
        }
    }

    // Entrances on both sides (4 wide, 5 tall)
    for (let dy = 0; dy < 5; dy++) {
        for (let dx = 0; dx < 4; dx++) {
            // Left entrance
            const lx = palaceX - palaceW + dx;
            const ey = palaceSurf - 1 - dy;
            if (lx >= 0 && lx < WORLD_WIDTH && ey >= 0) state.voidWorld[lx][ey] = BLOCKS.AIR;
            // Right entrance
            const rx = palaceX + palaceW - 3 + dx;
            if (rx >= 0 && rx < WORLD_WIDTH && ey >= 0) state.voidWorld[rx][ey] = BLOCKS.AIR;
        }
    }

    // Place Void God Shrine in center
    state.voidWorld[palaceX][palaceSurf - 2] = BLOCKS.VOID_GOD_SHRINE;

    // Scatter Void Stone in clusters on the surface
    for (let x = 2; x < WORLD_WIDTH - 2; x++) {
        if (Math.random() < 0.024) {
            const surf = heights[x];
            // Place a cluster of 2-5 Void Stone at and just below the surface
            const clusterSize = 2 + Math.floor(Math.random() * 4);
            for (let i = 0; i < clusterSize; i++) {
                const cx = x + Math.floor(Math.random() * 3) - 1;
                const cy = surf + Math.floor(Math.random() * 2); // surface and 1 below
                if (cx >= 0 && cx < WORLD_WIDTH && cy >= 0 && cy < WORLD_HEIGHT - 1) {
                    if (state.voidWorld[cx][cy] === BLOCKS.VOID_BEDROCK) {
                        state.voidWorld[cx][cy] = BLOCKS.VOID_STONE;
                    }
                }
            }
        }
    }
}
