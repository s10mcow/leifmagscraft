// ============================================================
// STRUCTURES.JS - Village and structure generation
// ============================================================
// generateVillages, generateHouse, generateDesertTemple,
// generateForestCabin, generateSavannahRuins, generateStructures
// ============================================================

import { state } from '../state.js';
import { BLOCKS, ITEMS, WORLD_WIDTH, WORLD_HEIGHT, SEA_LEVEL, BIOMES, ITEM_INFO, BLOCK_SIZE } from '../constants.js';
import { initChestData } from './chunks.js';
import { findSurfaceY } from './chunks.js';

// ============================================================
// INTERNAL HELPERS
// ============================================================

function generateVillageChestLoot() {
    const possible = [
        { itemId: ITEMS.IRON_PICKAXE, count: 1, durability: ITEM_INFO[ITEMS.IRON_PICKAXE].durability },
        { itemId: ITEMS.STEAK, count: 1 + Math.floor(Math.random() * 4), durability: 0 },
        { itemId: ITEMS.MUTTON, count: 1 + Math.floor(Math.random() * 3), durability: 0 },
        { itemId: BLOCKS.IRON, count: 2 + Math.floor(Math.random() * 4), durability: 0 },
        { itemId: BLOCKS.TORCH, count: 4 + Math.floor(Math.random() * 4), durability: 0 },
        { itemId: BLOCKS.PLANKS, count: 4 + Math.floor(Math.random() * 6), durability: 0 },
        { itemId: ITEMS.BONE, count: 1 + Math.floor(Math.random() * 3), durability: 0 },
    ];
    const count = 2 + Math.floor(Math.random() * 3);
    const shuffled = possible.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

function isAreaClear(x, width) {
    const spawnX = Math.floor(WORLD_WIDTH / 2);
    if (Math.abs(x - spawnX) < 30) return false;
    for (const vl of state.villageLocations) {
        const vlBlockX = Math.floor(vl.x / BLOCK_SIZE);
        if (Math.abs(x - vlBlockX) < 20) return false;
    }
    for (const sl of state.structureLocations) {
        if (Math.abs(x - sl.x) < 20) return false;
    }
    if (x < 5 || x + width >= WORLD_WIDTH - 5) return false;
    return true;
}

// ============================================================
// HOUSE GENERATOR
// ============================================================

export function generateHouse(x, surfaceY, w, h, wallBlock) {
    const style = Math.floor(Math.random() * 3); // 0=standard, 1=windowed, 2=cobble-base

    const floorY = surfaceY;
    const roofY = surfaceY - h;

    for (let bx = x; bx < x + w; bx++) {
        if (bx >= WORLD_WIDTH) break;
        for (let by = roofY; by <= floorY; by++) {
            if (by < 0 || by >= WORLD_HEIGHT) continue;

            const isLeftWall = bx === x;
            const isRightWall = bx === x + w - 1;
            const isWall = isLeftWall || isRightWall;

            if (by === roofY) {
                // Roof - varies by style
                state.world[bx][by] = style === 2 ? BLOCKS.COBBLESTONE : BLOCKS.PLANKS;
                // Overhang: extend roof 1 block past walls
                if (isLeftWall && bx - 1 >= 0) state.world[bx - 1][by] = style === 2 ? BLOCKS.COBBLESTONE : BLOCKS.PLANKS;
                if (isRightWall && bx + 1 < WORLD_WIDTH) state.world[bx + 1][by] = style === 2 ? BLOCKS.COBBLESTONE : BLOCKS.PLANKS;
            } else if (by === floorY) {
                // Floor
                state.world[bx][by] = BLOCKS.COBBLESTONE;
            } else if (isWall) {
                // Doors on BOTH left and right walls (2 blocks tall at ground level)
                if (by === floorY - 1 || by === floorY - 2) {
                    state.world[bx][by] = BLOCKS.DOOR_CLOSED;
                }
                // Cobble base (style 2): next row up is cobblestone
                else if (style === 2 && by === floorY - 3) {
                    state.world[bx][by] = BLOCKS.COBBLESTONE;
                }
                else {
                    state.world[bx][by] = wallBlock;
                }
            } else {
                // Interior air
                state.world[bx][by] = BLOCKS.AIR;
            }
        }
    }

    // Torches inside (one on each side)
    const torchY = roofY + 1;
    if (w >= 4) {
        if (torchY > roofY && torchY < floorY) {
            if (x + 1 < x + w - 1) state.world[x + 1][torchY] = BLOCKS.TORCH;
            if (x + w - 2 > x) state.world[x + w - 2][torchY] = BLOCKS.TORCH;
        }
    }

    // Pressure plates and cleared entries on BOTH sides
    const leftOutside = x - 1;
    const rightOutside = x + w;
    for (const ox of [leftOutside, rightOutside]) {
        if (ox < 0 || ox >= WORLD_WIDTH) continue;
        if (floorY - 1 >= 0 && floorY - 1 < WORLD_HEIGHT) {
            state.world[ox][floorY - 1] = BLOCKS.PRESSURE_PLATE;
        }
        // Clear 2 blocks of air above pressure plate
        for (let dy = 2; dy <= 3; dy++) {
            const ay = floorY - dy;
            if (ay >= 0 && ay < WORLD_HEIGHT && state.world[ox][ay] !== BLOCKS.PRESSURE_PLATE) {
                state.world[ox][ay] = BLOCKS.AIR;
            }
        }
    }

    // 60% chance: place a chest with loot in the center of the house
    if (Math.random() < 0.6) {
        const chestX = x + Math.floor(w / 2);
        const chestY = floorY - 1;
        if (chestX > x && chestX < x + w - 1 && chestY >= 0 && chestY < WORLD_HEIGHT) {
            state.world[chestX][chestY] = BLOCKS.CHEST;
            initChestData(chestX, chestY);
            const loot = generateVillageChestLoot();
            const key = `${chestX},${chestY}`;
            for (let i = 0; i < loot.length && i < state.chestData[key].length; i++) {
                state.chestData[key][i] = loot[i];
            }
        }
    }
}

// ============================================================
// VILLAGE GENERATOR
// ============================================================

export function generateVillages(seed) {
    const villageCount = 2 + Math.floor(Math.random() * 2); // 2-3 villages
    const attempts = [];

    // Find candidate positions (spread across the world)
    for (let i = 0; i < villageCount; i++) {
        const targetX = Math.floor(WORLD_WIDTH * (0.2 + i * 0.6 / villageCount) + (Math.random() - 0.5) * 80);
        attempts.push(targetX);
    }

    for (const targetX of attempts) {
        // Find a flat spot in Forest or Savannah
        let bestX = -1;
        let bestY = -1;
        for (let x = targetX - 50; x < targetX + 50; x++) {
            if (x < 10 || x >= WORLD_WIDTH - 30) continue;
            const biome = state.biomeMap[x];
            if (biome !== BIOMES.FOREST && biome !== BIOMES.SAVANNAH) continue;

            const sy = findSurfaceY(x);
            if (sy <= 5 || sy >= SEA_LEVEL - 2) continue;

            // Check for flat ground (8 blocks wide)
            let flat = true;
            for (let dx = 0; dx < 20; dx++) {
                if (x + dx >= WORLD_WIDTH) { flat = false; break; }
                const oy = findSurfaceY(x + dx);
                if (Math.abs(oy - sy) > 2) { flat = false; break; }
            }
            if (flat) { bestX = x; bestY = sy; break; }
        }

        if (bestX < 0) continue;

        // Build 2-3 small houses
        const houseCount = 2 + Math.floor(Math.random() * 2);
        let cx = bestX;
        const wallBlock = state.biomeMap[bestX] === BIOMES.SAVANNAH ? BLOCKS.COBBLESTONE : BLOCKS.PLANKS;

        for (let h = 0; h < houseCount; h++) {
            const houseW = 5 + Math.floor(Math.random() * 3); // 5-7 wide
            const houseH = 4 + Math.floor(Math.random() * 2); // 4-5 tall
            const sy = findSurfaceY(cx);
            if (cx + houseW + 2 >= WORLD_WIDTH) break;

            generateHouse(cx, sy, houseW, houseH, wallBlock);
            state.villageLocations.push({ x: (cx + houseW / 2) * BLOCK_SIZE, y: (sy - 2) * BLOCK_SIZE });

            cx += houseW + 3; // gap between houses
        }
    }
}

// ============================================================
// DESERT TEMPLE
// ============================================================

function generateDesertTemple(x, surfaceY) {
    // Pyramid top (3 stepped sand layers)
    for (let dx = 4; dx <= 6; dx++) {
        if (x + dx < WORLD_WIDTH) state.world[x + dx][surfaceY - 7] = BLOCKS.SAND;
    }
    for (let dx = 3; dx <= 7; dx++) {
        if (x + dx < WORLD_WIDTH) state.world[x + dx][surfaceY - 6] = BLOCKS.SAND;
    }
    for (let dx = 2; dx <= 8; dx++) {
        if (x + dx < WORLD_WIDTH) state.world[x + dx][surfaceY - 5] = BLOCKS.SAND;
    }

    // Main body: rows -4 to 0
    for (let dy = -4; dy <= 0; dy++) {
        for (let dx = 1; dx <= 9; dx++) {
            const bx = x + dx, by = surfaceY + dy;
            if (bx >= WORLD_WIDTH || by < 0 || by >= WORLD_HEIGHT) continue;
            if (dx === 1 || dx === 9) {
                state.world[bx][by] = BLOCKS.SAND;
            } else if (dx === 2 || dx === 8) {
                state.world[bx][by] = BLOCKS.COBBLESTONE;
            } else if (dy === -4 || dy === 0) {
                state.world[bx][by] = BLOCKS.COBBLESTONE;
            } else {
                state.world[bx][by] = BLOCKS.AIR;
            }
        }
    }

    // Door
    if (x + 5 < WORLD_WIDTH) {
        state.world[x + 5][surfaceY - 1] = BLOCKS.DOOR_CLOSED;
        state.world[x + 5][surfaceY - 2] = BLOCKS.DOOR_CLOSED;
    }

    // Torches inside
    if (x + 4 < WORLD_WIDTH) state.world[x + 4][surfaceY - 3] = BLOCKS.TORCH;
    if (x + 6 < WORLD_WIDTH) state.world[x + 6][surfaceY - 3] = BLOCKS.TORCH;

    // Underground chest room (rows +1 to +3)
    for (let dy = 1; dy <= 3; dy++) {
        for (let dx = 2; dx <= 8; dx++) {
            const bx = x + dx, by = surfaceY + dy;
            if (bx >= WORLD_WIDTH || by >= WORLD_HEIGHT) continue;
            if (dy === 3 || dx === 2 || dx === 8) {
                state.world[bx][by] = BLOCKS.COBBLESTONE;
            } else {
                state.world[bx][by] = BLOCKS.AIR;
            }
        }
    }

    // 2 chests in underground room
    const c1x = x + 4, c1y = surfaceY + 2;
    const c2x = x + 6, c2y = surfaceY + 2;
    if (c1x < WORLD_WIDTH && c1y < WORLD_HEIGHT) {
        state.world[c1x][c1y] = BLOCKS.CHEST;
        initChestData(c1x, c1y, "desert_temple");
    }
    if (c2x < WORLD_WIDTH && c2y < WORLD_HEIGHT) {
        state.world[c2x][c2y] = BLOCKS.CHEST;
        initChestData(c2x, c2y, "desert_temple");
    }

    state.structureLocations.push({ x: x, type: "desert_temple" });
}

// ============================================================
// FOREST CABIN
// ============================================================

function generateForestCabin(x, surfaceY) {
    const w = 7, h = 5;
    const doorDx = 3;

    for (let dx = 0; dx < w; dx++) {
        for (let dy = -h; dy <= 0; dy++) {
            const bx = x + dx, by = surfaceY + dy;
            if (bx >= WORLD_WIDTH || by < 0 || by >= WORLD_HEIGHT) continue;
            if (dy === -h || dy === 0) {
                state.world[bx][by] = BLOCKS.PLANKS;
            } else if (dx === 0 || dx === w - 1) {
                state.world[bx][by] = BLOCKS.WOOD;
            } else {
                state.world[bx][by] = BLOCKS.AIR;
            }
        }
    }

    // Door
    if (x + doorDx < WORLD_WIDTH) {
        state.world[x + doorDx][surfaceY - 1] = BLOCKS.DOOR_CLOSED;
        state.world[x + doorDx][surfaceY - 2] = BLOCKS.DOOR_CLOSED;
    }

    // Torch
    if (x + 2 < WORLD_WIDTH) state.world[x + 2][surfaceY - 4] = BLOCKS.TORCH;

    // Chest
    const cx = x + 5, cy = surfaceY - 1;
    if (cx < WORLD_WIDTH && cy >= 0) {
        state.world[cx][cy] = BLOCKS.CHEST;
        initChestData(cx, cy, "forest_cabin");
    }

    state.structureLocations.push({ x: x, type: "forest_cabin" });
}

// ============================================================
// SAVANNAH RUINS
// ============================================================

function generateSavannahRuins(x, surfaceY) {
    const w = 9, h = 4;

    // Floor (mostly intact)
    for (let dx = 1; dx <= 7; dx++) {
        const bx = x + dx;
        if (bx < WORLD_WIDTH && surfaceY < WORLD_HEIGHT) {
            state.world[bx][surfaceY] = BLOCKS.COBBLESTONE;
        }
    }

    // Walls with random gaps (ruined look)
    for (let dy = -h; dy <= -1; dy++) {
        for (let dx = 1; dx <= 7; dx++) {
            const bx = x + dx, by = surfaceY + dy;
            if (bx >= WORLD_WIDTH || by < 0 || by >= WORLD_HEIGHT) continue;
            if (dx === 1 || dx === 7) {
                if (Math.random() < 0.7) {
                    state.world[bx][by] = BLOCKS.COBBLESTONE;
                }
            } else {
                state.world[bx][by] = BLOCKS.AIR;
            }
        }
    }

    // Ensure bottom wall blocks are intact
    if (x + 1 < WORLD_WIDTH) state.world[x + 1][surfaceY - 1] = BLOCKS.COBBLESTONE;
    if (x + 7 < WORLD_WIDTH) state.world[x + 7][surfaceY - 1] = BLOCKS.COBBLESTONE;

    // Chest
    const cx = x + 4, cy = surfaceY - 1;
    if (cx < WORLD_WIDTH && cy >= 0) {
        state.world[cx][cy] = BLOCKS.CHEST;
        initChestData(cx, cy, "savannah_ruins");
    }

    state.structureLocations.push({ x: x, type: "savannah_ruins" });
}

// ============================================================
// STRUCTURES ORCHESTRATOR
// ============================================================

export function generateStructures(seed) {
    // Desert Temples
    let desertCount = 0;
    for (let x = 20; x < WORLD_WIDTH - 20 && desertCount < 3; x += 50) {
        if (state.biomeMap[x] !== BIOMES.DESERT) continue;
        const sy = findSurfaceY(x);
        if (sy <= 8 || sy >= SEA_LEVEL - 2) continue;
        let flat = true;
        for (let dx = 0; dx < 11; dx++) {
            if (x + dx >= WORLD_WIDTH || Math.abs(findSurfaceY(x + dx) - sy) > 1) { flat = false; break; }
        }
        if (!flat || !isAreaClear(x, 11)) continue;
        if (Math.random() > 0.5) continue;
        generateDesertTemple(x, sy);
        desertCount++;
        x += 60;
    }

    // Forest Cabins
    let cabinCount = 0;
    for (let x = 30; x < WORLD_WIDTH - 20 && cabinCount < 3; x += 45) {
        if (state.biomeMap[x] !== BIOMES.FOREST) continue;
        const sy = findSurfaceY(x);
        if (sy <= 5 || sy >= SEA_LEVEL - 2) continue;
        let flat = true;
        for (let dx = 0; dx < 7; dx++) {
            if (x + dx >= WORLD_WIDTH || Math.abs(findSurfaceY(x + dx) - sy) > 1) { flat = false; break; }
        }
        if (!flat || !isAreaClear(x, 7)) continue;
        if (Math.random() > 0.5) continue;
        generateForestCabin(x, sy);
        cabinCount++;
        x += 50;
    }

    // Savannah Ruins
    let ruinsCount = 0;
    for (let x = 25; x < WORLD_WIDTH - 20 && ruinsCount < 3; x += 45) {
        if (state.biomeMap[x] !== BIOMES.SAVANNAH) continue;
        const sy = findSurfaceY(x);
        if (sy <= 5 || sy >= SEA_LEVEL - 2) continue;
        let flat = true;
        for (let dx = 0; dx < 9; dx++) {
            if (x + dx >= WORLD_WIDTH || Math.abs(findSurfaceY(x + dx) - sy) > 1) { flat = false; break; }
        }
        if (!flat || !isAreaClear(x, 9)) continue;
        if (Math.random() > 0.5) continue;
        generateSavannahRuins(x, sy);
        ruinsCount++;
        x += 50;
    }
}
