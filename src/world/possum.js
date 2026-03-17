// ============================================================
// WORLD/POSSUM.JS - Possum Realm world generation (Candy Land)
// ============================================================
// A sugar-rush paradise: candy ground, lollipop trees, chests.
// ============================================================

import { state } from '../state.js';
import { BLOCKS, WORLD_WIDTH, WORLD_HEIGHT } from '../constants.js';
import { initChestData } from './chunks.js';

function generateCandyTerrain() {
    // Gentle rolling hills at surface level ~28
    const heights = new Array(WORLD_WIDTH);
    const base = 28;
    let seed = 42;
    function rng() { seed = (seed * 1664525 + 1013904223) & 0xffffffff; return (seed >>> 0) / 0xffffffff; }
    for (let x = 0; x < WORLD_WIDTH; x++) {
        const t = x / WORLD_WIDTH;
        const h = Math.sin(t * Math.PI * 6) * 3 + Math.sin(t * Math.PI * 14 + 1.3) * 1.5 + rng() * 1.5;
        heights[x] = Math.round(base + h);
    }
    return heights;
}

export function generatePossumWorld() {
    for (let x = 0; x < WORLD_WIDTH; x++) {
        state.possumWorld[x] = new Uint8Array(WORLD_HEIGHT);
        state.possumBgWorld[x] = new Uint8Array(WORLD_HEIGHT);
    }

    const heights = generateCandyTerrain();

    // Fill terrain with candy blocks
    for (let x = 0; x < WORLD_WIDTH; x++) {
        const surf = heights[x];
        for (let y = 0; y < WORLD_HEIGHT; y++) {
            if (y === surf) {
                state.possumWorld[x][y] = BLOCKS.CANDY_GROUND;
            } else if (y > surf && y <= surf + 4) {
                state.possumWorld[x][y] = BLOCKS.CANDY_GROUND;
            } else if (y > surf + 4 && y < WORLD_HEIGHT - 1) {
                state.possumWorld[x][y] = BLOCKS.STONE;
            } else if (y === WORLD_HEIGHT - 1) {
                state.possumWorld[x][y] = BLOCKS.BEDROCK;
            }
        }
    }

    // Place lollipop trees (candy cane trunk + lollipop top ball)
    for (let x = 4; x < WORLD_WIDTH - 4; x++) {
        if (Math.random() < 0.06) {
            const surf = heights[x];
            if (state.possumWorld[x][surf] !== BLOCKS.CANDY_GROUND) continue;
            const trunkH = 4 + Math.floor(Math.random() * 3);
            // Candy cane trunk
            for (let ty = surf - trunkH; ty < surf; ty++) {
                if (ty >= 0) state.possumWorld[x][ty] = BLOCKS.CANDY_CANE;
            }
            // Lollipop ball (round cluster of LOLLIPOP_TOP)
            const topY = surf - trunkH;
            for (let dy = -3; dy <= 1; dy++) {
                for (let dx = -3; dx <= 3; dx++) {
                    if (Math.abs(dx) + Math.abs(dy) <= 4) {
                        const lx = x + dx, ly = topY + dy;
                        if (lx >= 0 && lx < WORLD_WIDTH && ly >= 0 && ly < WORLD_HEIGHT) {
                            if (state.possumWorld[lx][ly] === BLOCKS.AIR) {
                                state.possumWorld[lx][ly] = BLOCKS.LOLLIPOP_TOP;
                            }
                        }
                    }
                }
            }
        }
    }

    // Place 6 loot chests spread evenly
    const chestSpacing = Math.floor(WORLD_WIDTH / 7);
    for (let i = 1; i <= 6; i++) {
        const cx = i * chestSpacing + Math.floor(Math.random() * 40 - 20);
        if (cx < 2 || cx >= WORLD_WIDTH - 2) continue;
        const surf = heights[cx];
        if (surf > 0) {
            state.possumWorld[cx][surf - 1] = BLOCKS.CHEST;
            initChestData(cx, surf - 1, 'possum_cache');
        }
    }

    // Place Possum King Pyramid near center of world
    const pyramidX = Math.floor(WORLD_WIDTH / 2) + 40;
    const pyramidW = 25; // width at base
    const pyramidH = 12; // height
    const pyramidBase = heights[pyramidX]; // ground level at pyramid center

    // Flatten terrain under pyramid
    for (let x = pyramidX - pyramidW; x <= pyramidX + pyramidW; x++) {
        if (x < 0 || x >= WORLD_WIDTH) continue;
        heights[x] = pyramidBase;
        for (let y = 0; y < WORLD_HEIGHT; y++) {
            if (y < pyramidBase) {
                state.possumWorld[x][y] = BLOCKS.AIR;
            } else if (y === pyramidBase) {
                state.possumWorld[x][y] = BLOCKS.CANDY_GROUND;
            } else if (y <= pyramidBase + 4) {
                state.possumWorld[x][y] = BLOCKS.CANDY_GROUND;
            }
        }
    }

    // Build pyramid (candy cane walls, hollow inside)
    const baseY = pyramidBase; // pyramid sits on surface
    for (let layer = 0; layer < pyramidH; layer++) {
        const halfW = pyramidW - layer; // narrows each layer
        const y = baseY - 1 - layer;
        if (y < 0) break;
        for (let dx = -halfW; dx <= halfW; dx++) {
            const px = pyramidX + dx;
            if (px < 0 || px >= WORLD_WIDTH) continue;
            // Outer shell: edges of each layer
            const isEdge = Math.abs(dx) >= halfW - 1 || layer === 0 || layer === pyramidH - 1;
            if (isEdge) {
                state.possumWorld[px][y] = BLOCKS.GOLD_CANDY;
            } else {
                state.possumWorld[px][y] = BLOCKS.AIR;
            }
        }
    }

    // Carve entrance on the left side (3 blocks wide, 4 tall)
    const entranceX = pyramidX - pyramidW + 1;
    for (let dy = 0; dy < 4; dy++) {
        for (let dx = 0; dx < 3; dx++) {
            const ex = entranceX + dx;
            const ey = baseY - 1 - dy;
            if (ex >= 0 && ex < WORLD_WIDTH && ey >= 0) {
                state.possumWorld[ex][ey] = BLOCKS.AIR;
            }
        }
    }

    // Place shrine in center of pyramid
    const shrineY = baseY - 2;
    state.possumWorld[pyramidX][shrineY] = BLOCKS.POSSUM_KING_SHRINE;
}
