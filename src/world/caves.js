// ============================================================
// CAVES.JS - Underground generation
// ============================================================
// generateCaves, placeOres, checkLavaWaterInteraction,
// lava/water interaction logic and underground feature placement.
// ============================================================

import { state } from '../state.js';
import { BLOCKS, WORLD_WIDTH, WORLD_HEIGHT, SURFACE_LEVEL, BLOCK_SIZE } from '../constants.js';
import { createParticles } from '../mobs.js';

// ============================================================
// INTERNAL: lava-water check used during world generation
// ============================================================

function checkLavaWaterWorld(x, y, w) {
    const neighbors = [[x-1,y],[x+1,y],[x,y-1],[x,y+1]];
    for (const [nx, ny] of neighbors) {
        if (nx >= 0 && nx < WORLD_WIDTH && ny >= 0 && ny < WORLD_HEIGHT) {
            if (w[nx][ny] === BLOCKS.WATER) {
                w[x][y] = BLOCKS.OBSIDIAN;
                return;
            }
        }
    }
}

// ============================================================
// CAVE GENERATION
// ============================================================

export function generateCaves(seed) {
    const caveCount = 5 + Math.floor(Math.random() * 4); // 5-8 cave systems

    for (let c = 0; c < caveCount; c++) {
        const startX = 20 + Math.floor(Math.random() * (WORLD_WIDTH - 40));
        const minY = SURFACE_LEVEL + 8;
        const maxY = WORLD_HEIGHT - 5;
        const startY = minY + Math.floor(Math.random() * (maxY - minY));

        const tunnelLength = 80 + Math.floor(Math.random() * 71); // 80-150
        let cx = startX;
        let cy = startY;
        let angle = Math.random() * Math.PI * 2;

        for (let step = 0; step < tunnelLength; step++) {
            let width = 1 + Math.floor(Math.random() * 2); // 1-2 radius
            // 8% chance of wider cavern
            if (Math.random() < 0.08) width = 2 + Math.floor(Math.random() * 2);

            // Carve tunnel cross-section
            for (let dx = -width; dx <= width; dx++) {
                for (let dy = -width; dy <= width; dy++) {
                    if (dx * dx + dy * dy <= width * width) {
                        const bx = Math.floor(cx) + dx;
                        const by = Math.floor(cy) + dy;
                        if (bx >= 1 && bx < WORLD_WIDTH - 1 &&
                            by > SURFACE_LEVEL + 3 && by < WORLD_HEIGHT - 1) {
                            if (state.world[bx][by] === BLOCKS.STONE || state.world[bx][by] === BLOCKS.DIRT) {
                                state.world[bx][by] = BLOCKS.AIR;
                            }
                        }
                    }
                }
            }

            // Gravel patches on cave floors
            if (width >= 2 && Math.random() < 0.1) {
                const gx = Math.floor(cx) + Math.floor(Math.random() * 3) - 1;
                const gy = Math.floor(cy) + width;
                if (gx >= 0 && gx < WORLD_WIDTH && gy >= 0 && gy < WORLD_HEIGHT - 1) {
                    for (let fy = gy; fy < WORLD_HEIGHT - 1; fy++) {
                        if (state.world[gx][fy] === BLOCKS.STONE) {
                            state.world[gx][fy] = BLOCKS.GRAVEL;
                            break;
                        }
                    }
                }
            }

            // Lava pools at deep levels (below 60% of world height)
            const lavaThreshold = Math.floor(WORLD_HEIGHT * 0.6);
            if (cy > lavaThreshold && width >= 2 && Math.random() < 0.03) {
                for (let lx = -2; lx <= 2; lx++) {
                    for (let ly = 0; ly <= 1; ly++) {
                        const bx = Math.floor(cx) + lx;
                        const by = Math.floor(cy) + width + ly;
                        if (bx >= 0 && bx < WORLD_WIDTH && by >= 0 && by < WORLD_HEIGHT - 1) {
                            if (state.world[bx][by] === BLOCKS.AIR || state.world[bx][by] === BLOCKS.STONE) {
                                state.world[bx][by] = BLOCKS.LAVA;
                            }
                        }
                    }
                }
            }

            // Random walk
            angle += (Math.random() - 0.5) * 0.8;
            cx += Math.cos(angle) * 1.5;
            cy += Math.sin(angle) * 0.7;

            if (cx < 5 || cx >= WORLD_WIDTH - 5) angle = Math.PI - angle;
            if (cy < SURFACE_LEVEL + 5) cy = SURFACE_LEVEL + 5;
            if (cy > WORLD_HEIGHT - 3) cy = WORLD_HEIGHT - 3;
        }
    }

    // Convert lava adjacent to water into obsidian
    for (let x = 0; x < WORLD_WIDTH; x++) {
        for (let y = 0; y < WORLD_HEIGHT; y++) {
            if (state.world[x][y] === BLOCKS.LAVA) {
                checkLavaWaterWorld(x, y, state.world);
            }
        }
    }
}

// ============================================================
// ORE PLACEMENT (after caves)
// ============================================================

export function placeOres(seed) {
    // Difficulty ore multiplier: easy=1.4x more, normal=1x, hard=0.5x
    const oreMultiplier = state.difficulty === "easy" ? 1.4 : state.difficulty === "hard" ? 0.5 : 1;

    for (let x = 0; x < WORLD_WIDTH; x++) {
        // Find real surface for depth calc
        let surfY = 0;
        for (let y = 0; y < WORLD_HEIGHT; y++) {
            const b = state.world[x][y];
            if (b !== BLOCKS.AIR && b !== BLOCKS.WATER && b !== BLOCKS.ICE &&
                b !== BLOCKS.TORCH && b !== BLOCKS.LAVA) {
                surfY = y;
                break;
            }
        }

        for (let y = surfY + 1; y < WORLD_HEIGHT - 1; y++) {
            if (state.world[x][y] !== BLOCKS.STONE) continue;
            const depth = y - surfY;

            // Extra ores near caves (adjacent to air)
            let nearCave = false;
            for (const [dx, dy] of [[-1,0],[1,0],[0,-1],[0,1]]) {
                const nx = x + dx, ny = y + dy;
                if (nx >= 0 && nx < WORLD_WIDTH && ny >= 0 && ny < WORLD_HEIGHT) {
                    if (state.world[nx][ny] === BLOCKS.AIR && depth > 3) { nearCave = true; break; }
                }
            }
            const mult = (nearCave ? 2 : 1) * oreMultiplier;
            const rand = Math.random();

            if (depth > 5 && rand < 0.002 * mult) state.world[x][y] = BLOCKS.COAL;
            else if (depth > 5 && Math.random() < 0.003 * mult) state.world[x][y] = BLOCKS.COPPER;
            else if (depth > 10 && Math.random() < 0.003 * mult) state.world[x][y] = BLOCKS.IRON;
            else if (depth > 10 && Math.random() < 0.0008 * mult) state.world[x][y] = BLOCKS.EMERALD;
            else if (depth > 15 && Math.random() < 0.003 * mult) state.world[x][y] = BLOCKS.SILVER_ORE;
            else if (depth > 20 && Math.random() < 0.0006 * mult) {
                // Gold — place as a small clump (seed the neighbour cells too)
                state.world[x][y] = BLOCKS.GOLD;
                for (const [ox, oy] of [[-1,0],[1,0],[0,-1],[0,1]]) {
                    const nx = x + ox, ny = y + oy;
                    if (nx >= 1 && nx < WORLD_WIDTH - 1 && ny > SURFACE_LEVEL + 3 && ny < WORLD_HEIGHT - 1 && state.world[nx][ny] === BLOCKS.STONE && Math.random() < 0.45) {
                        state.world[nx][ny] = BLOCKS.GOLD;
                    }
                }
            } else if (depth > 40 && Math.random() < 0.001 * mult) state.world[x][y] = BLOCKS.DIAMOND;
            else if (depth > 30 && Math.random() < 0.008 * mult) {
                // Obsidian clump — about as rare as gold, spawns in groups of ~3
                state.world[x][y] = BLOCKS.OBSIDIAN;
                for (const [ox, oy] of [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,1]]) {
                    const nx = x + ox, ny = y + oy;
                    if (nx >= 1 && nx < WORLD_WIDTH - 1 && ny > SURFACE_LEVEL + 3 && ny < WORLD_HEIGHT - 1 && state.world[nx][ny] === BLOCKS.STONE && Math.random() < 0.5) {
                        state.world[nx][ny] = BLOCKS.OBSIDIAN;
                    }
                }
            }
        }
    }
}

// ============================================================
// RUNTIME LAVA-WATER INTERACTION (exported, used at runtime)
// ============================================================

// Check lava-water interaction on the active world (used at runtime)
export function checkLavaWaterInteraction(x, y) {
    if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT) return;
    if (state.activeWorld[x][y] !== BLOCKS.LAVA) return;
    const neighbors = [[x-1,y],[x+1,y],[x,y-1],[x,y+1]];
    for (const [nx, ny] of neighbors) {
        if (nx >= 0 && nx < WORLD_WIDTH && ny >= 0 && ny < WORLD_HEIGHT) {
            if (state.activeWorld[nx][ny] === BLOCKS.WATER) {
                state.activeWorld[x][y] = BLOCKS.OBSIDIAN;
                createParticles(x * BLOCK_SIZE + 16, y * BLOCK_SIZE + 16, 8, "#888888", 3);
                return;
            }
        }
    }
}
