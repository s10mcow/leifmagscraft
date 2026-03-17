// ============================================================
// NETHER.JS - Nether dimension generation
// ============================================================
// generateNetherWorld, generateNetherFortress,
// generateNetherTree, generateWarpedTree
// ============================================================

import { state } from '../state.js';
import { BLOCKS, WORLD_WIDTH, WORLD_HEIGHT, SURFACE_LEVEL, BLOCK_SIZE, NETHER_BIOMES } from '../constants.js';
import { initChestData } from './chunks.js';

// ============================================================
// INTERNAL: noise function (same formula as generation.js)
// ============================================================

function simpleNoise(x, seed) {
    return Math.sin(x * 0.05 + seed) * 6 +
           Math.sin(x * 0.1 + seed * 2) * 3 +
           Math.sin(x * 0.02 + seed * 0.5) * 10;
}

// ============================================================
// INTERNAL: nether biome assignment
// ============================================================

function assignNetherBiomes(seed) {
    state.netherBiomeMap = [];
    // Cycle through all three biomes in varying-width segments
    const biomeSeq = [NETHER_BIOMES.CRIMSON, NETHER_BIOMES.WARPED, NETHER_BIOMES.WASTES];
    let seqIdx = Math.floor(Math.abs(Math.sin(seed * 1.3)) * 3);
    let x = 0;
    while (x < WORLD_WIDTH) {
        const segWidth = 140 + Math.floor(Math.abs(Math.sin(seed * 0.03 + x * 0.007)) * 80) + Math.floor(Math.random() * 60);
        const biome = biomeSeq[seqIdx % 3];
        const end = Math.min(x + segWidth, WORLD_WIDTH);
        for (let i = x; i < end; i++) state.netherBiomeMap[i] = biome;
        x = end;
        seqIdx++;
    }
}

// ============================================================
// NETHER TREE GENERATORS
// ============================================================

export function generateNetherTree(x, surfaceY, target) {
    const w = target || state.netherWorld;
    const h = 4 + Math.floor(Math.random() * 3);
    for (let i = 1; i <= h; i++) {
        if (surfaceY - i >= 0) w[x][surfaceY - i] = BLOCKS.NETHER_WOOD;
    }
    for (let lx = -2; lx <= 2; lx++) {
        for (let ly = -3; ly <= -1; ly++) {
            const wx = x + lx, wy = surfaceY - h + ly;
            if (wx >= 0 && wx < WORLD_WIDTH && wy >= 0) {
                if (w[wx][wy] === BLOCKS.AIR) {
                    if (Math.abs(lx) === 2 && Math.abs(ly) === 1 && Math.random() < 0.4) continue;
                    w[wx][wy] = BLOCKS.NETHER_LEAVES;
                }
            }
        }
    }
}

export function generateWarpedTree(x, surfaceY, target) {
    const w = target || state.netherWorld;
    const h = 4 + Math.floor(Math.random() * 3);
    for (let i = 1; i <= h; i++) {
        if (surfaceY - i >= 0) w[x][surfaceY - i] = BLOCKS.WARPED_WOOD;
    }
    for (let lx = -2; lx <= 2; lx++) {
        for (let ly = -3; ly <= -1; ly++) {
            const wx = x + lx, wy = surfaceY - h + ly;
            if (wx >= 0 && wx < WORLD_WIDTH && wy >= 0) {
                if (w[wx][wy] === BLOCKS.AIR) {
                    if (Math.abs(lx) === 2 && Math.abs(ly) === 1 && Math.random() < 0.4) continue;
                    w[wx][wy] = BLOCKS.WARPED_LEAVES;
                }
            }
        }
    }
}

// ============================================================
// NETHER FORTRESS
// ============================================================

export function generateNetherFortress(x, surfaceY) {
    const w = 10 + Math.floor(Math.random() * 5);  // 10-14 wide
    const h = 7 + Math.floor(Math.random() * 3);   // 7-9 tall
    const floorY = surfaceY;
    const roofY = surfaceY - h;

    for (let bx = x; bx < x + w; bx++) {
        if (bx < 0 || bx >= WORLD_WIDTH) continue;
        for (let by = roofY; by <= floorY; by++) {
            if (by < 0 || by >= WORLD_HEIGHT) continue;
            const isLeftWall  = bx < x + 2;
            const isRightWall = bx >= x + w - 2;
            const isRoof      = by === roofY;
            const isFloor     = by === floorY;
            if (isLeftWall || isRightWall || isRoof || isFloor) {
                state.netherWorld[bx][by] = BLOCKS.NETHER_BRICK;
            } else {
                state.netherWorld[bx][by] = BLOCKS.AIR;
            }
        }
    }
    // Entrance opening on left wall (2 blocks tall)
    const entryX = x + 1;
    if (entryX >= 0 && entryX < WORLD_WIDTH) {
        if (floorY - 1 >= 0) state.netherWorld[entryX][floorY - 1] = BLOCKS.AIR;
        if (floorY - 2 >= 0) state.netherWorld[entryX][floorY - 2] = BLOCKS.AIR;
    }
    // Glowstone on inside ceiling
    for (let tx = x + 3; tx < x + w - 3; tx += 4) {
        if (tx >= 0 && tx < WORLD_WIDTH && roofY + 1 >= 0 && roofY + 1 < WORLD_HEIGHT) {
            state.netherWorld[tx][roofY + 1] = BLOCKS.GLOWSTONE;
        }
    }
    // Chest(s)
    const chestPositions = [x + Math.floor(w / 2)];
    if (Math.random() < 0.4) chestPositions.push(x + Math.floor(w * 0.75));
    for (const cx of chestPositions) {
        if (cx > x + 1 && cx < x + w - 2 && cx >= 0 && cx < WORLD_WIDTH) {
            const cy = floorY - 1;
            if (cy >= 0 && cy < WORLD_HEIGHT) {
                state.netherWorld[cx][cy] = BLOCKS.CHEST;
                initChestData(cx, cy, "nether_fortress");
            }
        }
    }
}

// ============================================================
// NETHER WORLD GENERATOR
// ============================================================

export function generateNetherWorld() {
    const seed = Math.random() * 1000;

    // Assign Nether biomes first
    assignNetherBiomes(seed);

    // Fill with air
    for (let x = 0; x < WORLD_WIDTH; x++) {
        state.netherWorld[x] = [];
        for (let y = 0; y < WORLD_HEIGHT; y++) {
            state.netherWorld[x][y] = BLOCKS.AIR;
        }
    }

    // Generate terrain - biome-aware surface block and flatness
    for (let x = 0; x < WORLD_WIDTH; x++) {
        const biome = state.netherBiomeMap[x];
        // Wastes are nearly flat; other biomes use normal noise
        const noiseAmp = (biome === NETHER_BIOMES.WASTES) ? 0.15 : 0.8;
        const surfaceY = Math.floor(SURFACE_LEVEL + simpleNoise(x, seed) * noiseAmp);

        for (let y = 0; y < WORLD_HEIGHT; y++) {
            if (y === WORLD_HEIGHT - 1) {
                state.netherWorld[x][y] = BLOCKS.BEDROCK;
            } else if (y === surfaceY) {
                state.netherWorld[x][y] = (biome === NETHER_BIOMES.WARPED) ? BLOCKS.WARPED_GRASS : BLOCKS.NETHERRACK;
            } else if (y > surfaceY && y < WORLD_HEIGHT - 1) {
                state.netherWorld[x][y] = BLOCKS.NETHERRACK;
            }
        }
    }

    // Caves
    const caveCount = 4 + Math.floor(Math.random() * 4);
    for (let c = 0; c < caveCount; c++) {
        const startX = 20 + Math.floor(Math.random() * (WORLD_WIDTH - 40));
        const startY = SURFACE_LEVEL + 8 + Math.floor(Math.random() * (WORLD_HEIGHT - SURFACE_LEVEL - 13));
        let cx = startX, cy = startY;
        let angle = Math.random() * Math.PI * 2;
        const tunnelLength = 80 + Math.floor(Math.random() * 71);

        for (let step = 0; step < tunnelLength; step++) {
            const width = 1 + Math.floor(Math.random() * 2);
            for (let dx = -width; dx <= width; dx++) {
                for (let dy = -width; dy <= width; dy++) {
                    if (dx * dx + dy * dy <= width * width) {
                        const bx = Math.floor(cx) + dx, by = Math.floor(cy) + dy;
                        if (bx >= 1 && bx < WORLD_WIDTH - 1 && by > SURFACE_LEVEL + 3 && by < WORLD_HEIGHT - 1) {
                            if (state.netherWorld[bx][by] === BLOCKS.NETHERRACK) {
                                state.netherWorld[bx][by] = BLOCKS.AIR;
                            }
                        }
                    }
                }
            }
            // Lava pools deep down
            if (cy > WORLD_HEIGHT * 0.6 && width >= 2 && Math.random() < 0.03) {
                for (let lx = -2; lx <= 2; lx++) {
                    for (let ly = 0; ly <= 1; ly++) {
                        const bx = Math.floor(cx) + lx, by = Math.floor(cy) + width + ly;
                        if (bx >= 0 && bx < WORLD_WIDTH && by >= 0 && by < WORLD_HEIGHT - 1) {
                            if (state.netherWorld[bx][by] === BLOCKS.AIR || state.netherWorld[bx][by] === BLOCKS.NETHERRACK) {
                                state.netherWorld[bx][by] = BLOCKS.LAVA;
                            }
                        }
                    }
                }
            }
            angle += (Math.random() - 0.5) * 0.8;
            cx += Math.cos(angle) * 1.5;
            cy += Math.sin(angle) * 0.7;
            if (cx < 5 || cx >= WORLD_WIDTH - 5) angle = Math.PI - angle;
            if (cy < SURFACE_LEVEL + 5) cy = SURFACE_LEVEL + 5;
            if (cy > WORLD_HEIGHT - 3) cy = WORLD_HEIGHT - 3;
        }
    }

    // Place gold ore underground
    for (let x = 0; x < WORLD_WIDTH; x++) {
        let surfY = 0;
        for (let y = 0; y < WORLD_HEIGHT; y++) {
            if (state.netherWorld[x][y] === BLOCKS.NETHERRACK || state.netherWorld[x][y] === BLOCKS.WARPED_GRASS) { surfY = y; break; }
        }
        for (let y = surfY + 1; y < WORLD_HEIGHT - 1; y++) {
            if (state.netherWorld[x][y] !== BLOCKS.NETHERRACK) continue;
            const depth = y - surfY;
            let nearCave = false;
            for (const [dx, dy] of [[-1,0],[1,0],[0,-1],[0,1]]) {
                const nx = x + dx, ny = y + dy;
                if (nx >= 0 && nx < WORLD_WIDTH && ny >= 0 && ny < WORLD_HEIGHT) {
                    if (state.netherWorld[nx][ny] === BLOCKS.AIR && depth > 3) { nearCave = true; break; }
                }
            }
            const mult = nearCave ? 2 : 1;
            if (depth > 8 && Math.random() < 0.025 * mult) state.netherWorld[x][y] = BLOCKS.GOLD;
        }
    }

    // Trees - biome-aware (no trees in Wastes)
    for (let x = 3; x < WORLD_WIDTH - 3; x++) {
        const biome = state.netherBiomeMap[x];
        if (biome === NETHER_BIOMES.WASTES) continue;
        let surfaceY = -1;
        for (let y = 0; y < WORLD_HEIGHT; y++) {
            const b = state.netherWorld[x][y];
            if (b === BLOCKS.NETHERRACK || b === BLOCKS.WARPED_GRASS) { surfaceY = y; break; }
        }
        if (surfaceY <= 0) continue;
        if (Math.random() < 0.07) {
            if (biome === NETHER_BIOMES.WARPED) {
                generateWarpedTree(x, surfaceY);
            } else {
                generateNetherTree(x, surfaceY);
            }
            x += 4;
        }
    }

    // Lava pools on Wastes biome surface (evenly spaced, not too many)
    let lastPool = -999;
    for (let x = 5; x < WORLD_WIDTH - 5; x++) {
        if (state.netherBiomeMap[x] !== NETHER_BIOMES.WASTES) continue;
        if (x - lastPool < 42) continue; // minimum 42-block gap between pools
        // Use a hash so pools don't all cluster at the same offset
        const r = Math.abs(Math.sin(x * 31.7 + seed * 7.3)) % 1;
        if (r > 0.06) continue; // sparse trigger (~6% per eligible column)
        // Find surface Y
        let surfY = -1;
        for (let y = 0; y < WORLD_HEIGHT; y++) {
            if (state.netherWorld[x][y] === BLOCKS.NETHERRACK) { surfY = y; break; }
        }
        if (surfY < 0) continue;
        const poolW = 3 + Math.floor(r * 20) % 2; // 3 or 4 blocks wide
        for (let px = x; px < x + poolW && px < WORLD_WIDTH; px++) {
            if (state.netherBiomeMap[px] !== NETHER_BIOMES.WASTES) break;
            state.netherWorld[px][surfY] = BLOCKS.LAVA;
        }
        lastPool = x;
    }

    // Glowstone clusters on cave ceilings
    for (let x = 0; x < WORLD_WIDTH; x++) {
        for (let y = SURFACE_LEVEL + 4; y < WORLD_HEIGHT - 2; y++) {
            if (state.netherWorld[x][y] === BLOCKS.NETHERRACK && state.netherWorld[x][y + 1] === BLOCKS.AIR) {
                if (Math.random() < 0.12) {
                    state.netherWorld[x][y] = BLOCKS.GLOWSTONE;
                }
            }
        }
    }

    // Background tree layer for Nether
    for (let x = 0; x < WORLD_WIDTH; x++) {
        state.netherBgWorld[x] = new Array(WORLD_HEIGHT).fill(BLOCKS.AIR);
    }
    for (let x = 3; x < WORLD_WIDTH - 3; x++) {
        const biome = state.netherBiomeMap[x];
        if (biome === NETHER_BIOMES.WASTES) continue;
        let surfaceY = -1;
        for (let y = 0; y < WORLD_HEIGHT; y++) {
            const b = state.netherWorld[x][y];
            if (b === BLOCKS.NETHERRACK || b === BLOCKS.WARPED_GRASS) { surfaceY = y; break; }
        }
        if (surfaceY <= 0) continue;
        if (Math.random() < 0.14) {
            if (biome === NETHER_BIOMES.WARPED) generateWarpedTree(x, surfaceY, state.netherBgWorld);
            else generateNetherTree(x, surfaceY, state.netherBgWorld);
            x += 2;
        }
    }

    // Gasly's Arena — spawns only in Nether Wastes, flattens terrain, on the ground
    {
        const chamberW = 75;
        const chamberH = 45;
        const padding = 10; // extra flat area outside the arena on each side

        // Find a Nether Wastes region to place the arena
        let cx = -1;
        for (let x = 20; x < WORLD_WIDTH - chamberW - 20; x++) {
            // Check if this whole stretch is Wastes
            let allWastes = true;
            for (let dx = -padding; dx < chamberW + padding; dx++) {
                const bx = x + dx;
                if (bx < 0 || bx >= WORLD_WIDTH || state.netherBiomeMap[bx] !== NETHER_BIOMES.WASTES) {
                    allWastes = false; break;
                }
            }
            if (allWastes) { cx = x; break; }
        }
        // Fallback: if no wastes stretch found, pick center
        if (cx < 0) cx = Math.floor(WORLD_WIDTH / 2) + 30;

        // Find a consistent flat surface Y — use the surface at the arena center
        let flatY = SURFACE_LEVEL;
        const midX = cx + Math.floor(chamberW / 2);
        if (midX >= 0 && midX < WORLD_WIDTH) {
            for (let y = 0; y < WORLD_HEIGHT; y++) {
                if (state.netherWorld[midX][y] !== BLOCKS.AIR) { flatY = y; break; }
            }
        }

        // Flatten the terrain across the arena + padding on each side
        for (let dx = -padding; dx < chamberW + padding; dx++) {
            const bx = cx + dx;
            if (bx < 0 || bx >= WORLD_WIDTH) continue;
            // Clear everything above flatY
            for (let y = 0; y < flatY; y++) {
                state.netherWorld[bx][y] = BLOCKS.AIR;
            }
            // Fill from flatY down with netherrack (solid ground)
            for (let y = flatY; y < WORLD_HEIGHT - 1; y++) {
                if (state.netherWorld[bx][y] === BLOCKS.AIR) {
                    state.netherWorld[bx][y] = BLOCKS.NETHERRACK;
                }
            }
        }

        // Build the arena on the flat ground
        const floorY = flatY - 1; // 1 block above ground
        const ceilY = floorY - chamberH + 1;

        for (let dx = 0; dx < chamberW; dx++) {
            const bx = cx + dx;
            if (bx < 0 || bx >= WORLD_WIDTH) continue;
            const isWall = dx === 0 || dx === chamberW - 1;

            for (let by = ceilY; by <= floorY; by++) {
                if (by < 0 || by >= WORLD_HEIGHT) continue;
                if (by === ceilY || by === floorY || isWall) {
                    state.netherWorld[bx][by] = ((dx + by) % 2 === 0) ? BLOCKS.NETHERRACK : BLOCKS.OBSIDIAN;
                } else {
                    state.netherWorld[bx][by] = BLOCKS.AIR;
                }
            }
        }

        // Left entrance — hole in wall + staircase if needed
        {
            for (let ey = 0; ey < 5; ey++) {
                const by = floorY - ey;
                if (cx >= 0 && cx < WORLD_WIDTH && by >= 0 && by < WORLD_HEIGHT) {
                    state.netherWorld[cx][by] = BLOCKS.AIR;
                }
            }
            // Ground outside is flat, so just clear a path
            for (let ex = -3; ex < 0; ex++) {
                const bx2 = cx + ex;
                if (bx2 >= 0 && bx2 < WORLD_WIDTH) {
                    for (let ey = 0; ey < 5; ey++) {
                        const by = floorY - ey;
                        if (by >= 0 && by < WORLD_HEIGHT) state.netherWorld[bx2][by] = BLOCKS.AIR;
                    }
                }
            }
        }

        // Right entrance
        {
            for (let ey = 0; ey < 5; ey++) {
                const by = floorY - ey;
                const bx = cx + chamberW - 1;
                if (bx >= 0 && bx < WORLD_WIDTH && by >= 0 && by < WORLD_HEIGHT) {
                    state.netherWorld[bx][by] = BLOCKS.AIR;
                }
            }
            for (let ex = 0; ex < 3; ex++) {
                const bx2 = cx + chamberW + ex;
                if (bx2 >= 0 && bx2 < WORLD_WIDTH) {
                    for (let ey = 0; ey < 5; ey++) {
                        const by = floorY - ey;
                        if (by >= 0 && by < WORLD_HEIGHT) state.netherWorld[bx2][by] = BLOCKS.AIR;
                    }
                }
            }
        }

        // Glowstone lighting on ceiling
        for (let dx = 5; dx < chamberW - 5; dx += 6) {
            const bx = cx + dx;
            if (bx >= 0 && bx < WORLD_WIDTH && ceilY + 1 >= 0 && ceilY + 1 < WORLD_HEIGHT) {
                state.netherWorld[bx][ceilY + 1] = BLOCKS.GLOWSTONE;
            }
        }

        // Place shrine in center on the floor
        const shrineX = cx + Math.floor(chamberW / 2);
        const shrineY = floorY - 1;
        if (shrineX >= 0 && shrineX < WORLD_WIDTH && shrineY >= 0 && shrineY < WORLD_HEIGHT) {
            state.netherWorld[shrineX][shrineY] = BLOCKS.GASLY_SHRINE;
        }

        // Store arena X so nether spawn can be placed at left edge
        state.gaslyArenaX = cx;
    }

    // Nether Fortresses — 2 per world at 25% and 75% x positions
    const fortressPositions = [
        Math.floor(WORLD_WIDTH * 0.25 + (Math.random() - 0.5) * 100),
        Math.floor(WORLD_WIDTH * 0.75 + (Math.random() - 0.5) * 100),
    ];
    for (const fx of fortressPositions) {
        if (fx < 10 || fx >= WORLD_WIDTH - 20) continue;
        let fSurface = -1;
        for (let y = 0; y < WORLD_HEIGHT; y++) {
            const b = state.netherWorld[fx][y];
            if (b !== BLOCKS.AIR) { fSurface = y; break; }
        }
        if (fSurface < 5 || fSurface >= WORLD_HEIGHT - 10) continue;
        generateNetherFortress(fx, fSurface);
        state.structureLocations.push({ x: fx * BLOCK_SIZE, y: fSurface * BLOCK_SIZE });
    }
}
