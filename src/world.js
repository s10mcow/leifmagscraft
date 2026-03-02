// ============================================================
// WORLD.JS - World generation, biomes, and terrain (ES Module)
// ============================================================
// Creates the world with 4 biomes: Forest, Desert, Savannah,
// Tundra. Each has unique surface blocks, trees, and feel.
// ============================================================

import { state } from './state.js';
import { BLOCKS, ITEMS, WORLD_WIDTH, WORLD_HEIGHT, SURFACE_LEVEL, SEA_LEVEL, BIOMES, BIOME_INFO, NETHER_BIOMES, BLOCK_INFO, ITEM_INFO, LOOT_TABLES, BLOCK_SIZE } from './constants.js';
import { createParticles } from './mobs.js';

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

// Noise function - makes smooth natural-looking hills
function simpleNoise(x, seed) {
    return Math.sin(x * 0.05 + seed) * 6 +
           Math.sin(x * 0.1 + seed * 2) * 3 +
           Math.sin(x * 0.02 + seed * 0.5) * 10;
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

// ============================================================
// BIOME ASSIGNMENT
// ============================================================

function assignBiomes(seed) {
    const biomeOrder = [BIOMES.FOREST, BIOMES.DESERT, BIOMES.SAVANNAH, BIOMES.TUNDRA];
    const centerX = Math.floor(WORLD_WIDTH / 2);

    // Build segments from left to right
    const segments = [];
    let x = 0;
    let idx = 0;

    // Use a shuffled order based on seed (but we'll force Forest at center)
    const shuffled = [...biomeOrder];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor((Math.sin(seed * (i + 1) * 7.3) * 0.5 + 0.5) * (i + 1)) % (i + 1);
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    while (x < WORLD_WIDTH) {
        const segWidth = 100 + Math.floor(Math.abs(simpleNoise(x * 0.7, seed + 500)) * 5) + Math.floor(Math.random() * 60);
        const biome = shuffled[idx % shuffled.length];
        segments.push({ start: x, end: Math.min(x + segWidth, WORLD_WIDTH), biome });
        x += segWidth;
        idx++;
    }

    // Force the segment containing the center (spawn point) to be Forest
    for (const seg of segments) {
        if (centerX >= seg.start && centerX < seg.end) {
            seg.biome = BIOMES.FOREST;
            break;
        }
    }

    // Fill biomeMap
    for (let col = 0; col < WORLD_WIDTH; col++) {
        for (const seg of segments) {
            if (col >= seg.start && col < seg.end) {
                state.biomeMap[col] = seg.biome;
                break;
            }
        }
    }
}

// ============================================================
// TREE GENERATORS
// ============================================================

function generateOakTree(x, surfaceY, target) {
    const w = target || state.world;
    const h = 4 + Math.floor(Math.random() * 3); // 4-6 tall
    for (let i = 1; i <= h; i++) {
        if (surfaceY - i >= 0) w[x][surfaceY - i] = BLOCKS.WOOD;
    }
    for (let lx = -2; lx <= 2; lx++) {
        for (let ly = -3; ly <= -1; ly++) {
            const wx = x + lx, wy = surfaceY - h + ly;
            if (wx >= 0 && wx < WORLD_WIDTH && wy >= 0) {
                if (w[wx][wy] === BLOCKS.AIR) {
                    if (Math.abs(lx) === 2 && Math.abs(ly) === 1 && Math.random() < 0.4) continue;
                    w[wx][wy] = BLOCKS.LEAVES;
                }
            }
        }
    }
}

function generateCactus(x, surfaceY, target) {
    const w = target || state.world;
    const h = 2 + Math.floor(Math.random() * 3); // 2-4 tall
    for (let i = 1; i <= h; i++) {
        if (surfaceY - i >= 0) w[x][surfaceY - i] = BLOCKS.CACTUS;
    }
}

function generateAcacia(x, surfaceY, target) {
    const w = target || state.world;
    const h = 5 + Math.floor(Math.random() * 3); // 5-7 tall
    const lean = Math.random() < 0.5 ? 1 : -1;
    // Trunk (slightly diagonal at top)
    for (let i = 1; i <= h; i++) {
        const tx = (i > h - 2) ? x + lean : x;
        if (tx >= 0 && tx < WORLD_WIDTH && surfaceY - i >= 0) {
            w[tx][surfaceY - i] = BLOCKS.ACACIA_WOOD;
        }
    }
    // Flat-top canopy
    const topX = x + lean;
    const topY = surfaceY - h;
    for (let lx = -3; lx <= 3; lx++) {
        for (let ly = -2; ly <= -1; ly++) {
            const wx = topX + lx, wy = topY + ly;
            if (wx >= 0 && wx < WORLD_WIDTH && wy >= 0) {
                if (w[wx][wy] === BLOCKS.AIR) {
                    w[wx][wy] = BLOCKS.ACACIA_LEAVES;
                }
            }
        }
    }
}

function generateSpruce(x, surfaceY, target) {
    const w = target || state.world;
    const h = 6 + Math.floor(Math.random() * 3); // 6-8 tall
    // Trunk
    for (let i = 1; i <= h; i++) {
        if (surfaceY - i >= 0) w[x][surfaceY - i] = BLOCKS.SPRUCE_WOOD;
    }
    // Triangular canopy (narrow top, wide bottom)
    const topY = surfaceY - h;
    const layers = [
        { dy: 0, width: 1 },
        { dy: 1, width: 2 },
        { dy: 2, width: 3 },
        { dy: 3, width: 2 },
        { dy: 4, width: 3 },
    ];
    for (const layer of layers) {
        for (let lx = -layer.width; lx <= layer.width; lx++) {
            const wx = x + lx, wy = topY + layer.dy;
            if (wx >= 0 && wx < WORLD_WIDTH && wy >= 0) {
                if (w[wx][wy] === BLOCKS.AIR) {
                    w[wx][wy] = BLOCKS.SPRUCE_LEAVES;
                }
            }
        }
    }
}

// ============================================================
// WORLD GENERATION
// ============================================================

export function generateWorld() {
    const seed = Math.random() * 1000;

    // Assign biomes first
    assignBiomes(seed);

    // Fill with air
    for (let x = 0; x < WORLD_WIDTH; x++) {
        state.world[x] = [];
        for (let y = 0; y < WORLD_HEIGHT; y++) {
            state.world[x][y] = BLOCKS.AIR;
        }
    }

    // Generate terrain (biome-aware) - NO ores yet, those come after caves
    for (let x = 0; x < WORLD_WIDTH; x++) {
        const biome = state.biomeMap[x];
        const bi = BIOME_INFO[biome];

        const surfaceY = Math.floor(
            SURFACE_LEVEL + bi.heightOffset +
            simpleNoise(x, seed) * bi.heightAmplitude
        );

        for (let y = 0; y < WORLD_HEIGHT; y++) {
            if (y === WORLD_HEIGHT - 1) {
                state.world[x][y] = BLOCKS.BEDROCK;
            } else if (y === surfaceY) {
                if (surfaceY >= SEA_LEVEL - 1 && biome !== BIOMES.TUNDRA) {
                    state.world[x][y] = BLOCKS.SAND;
                } else {
                    state.world[x][y] = bi.surfaceBlock;
                }
            } else if (y > surfaceY && y < surfaceY + 4) {
                if (surfaceY >= SEA_LEVEL - 1 && biome !== BIOMES.TUNDRA) {
                    state.world[x][y] = BLOCKS.SAND;
                } else {
                    state.world[x][y] = bi.subSurfaceBlock;
                }
            } else if (y >= surfaceY + 4 && y < WORLD_HEIGHT - 1) {
                state.world[x][y] = BLOCKS.STONE;
            }

            // Water / Ice fills low spots
            if (y >= surfaceY && y < SEA_LEVEL && state.world[x][y] === BLOCKS.AIR) {
                if (biome === BIOMES.TUNDRA && y <= surfaceY + 1) {
                    state.world[x][y] = BLOCKS.ICE;
                } else {
                    state.world[x][y] = BLOCKS.WATER;
                }
            }
        }
    }

    // Generate caves (carves through stone, adds gravel and lava)
    generateCaves(seed);

    // Place ores (after caves so ores appear on cave walls too)
    placeOres(seed);

    // Trees (biome-aware)
    for (let x = 3; x < WORLD_WIDTH - 3; x++) {
        const biome = state.biomeMap[x];
        const bi = BIOME_INFO[biome];

        // Find surface - check for the biome's surface block type
        let surfaceY = -1;
        for (let y = 0; y < WORLD_HEIGHT; y++) {
            const b = state.world[x][y];
            if (b === BLOCKS.GRASS || b === BLOCKS.SAND || b === BLOCKS.SNOW || b === BLOCKS.DRY_GRASS) {
                surfaceY = y;
                break;
            }
        }
        // Don't grow trees on sand (beach) unless it's a desert
        if (surfaceY <= 0) continue;
        if (state.world[x][surfaceY] === BLOCKS.SAND && biome !== BIOMES.DESERT) continue;

        if (Math.random() < bi.treeChance) {
            if (bi.treeType === "oak") generateOakTree(x, surfaceY);
            else if (bi.treeType === "cactus") generateCactus(x, surfaceY);
            else if (bi.treeType === "acacia") generateAcacia(x, surfaceY);
            else if (bi.treeType === "spruce") generateSpruce(x, surfaceY);
            x += 4; // spacing between trees
        }
    }

    // Villages (in Forest and Savannah biomes)
    generateVillages(seed);

    // Structures with loot chests
    generateStructures(seed);

    // Background tree layer — denser, separate from foreground
    for (let x = 0; x < WORLD_WIDTH; x++) {
        state.bgWorld[x] = new Array(WORLD_HEIGHT).fill(BLOCKS.AIR);
    }
    state.activeBgWorld = state.bgWorld;
    for (let x = 2; x < WORLD_WIDTH - 2; x++) {
        const biome = state.biomeMap[x];
        const bi = BIOME_INFO[biome];
        let surfaceY = -1;
        for (let y = 0; y < WORLD_HEIGHT; y++) {
            const b = state.world[x][y];
            if (b === BLOCKS.GRASS || b === BLOCKS.SAND || b === BLOCKS.SNOW || b === BLOCKS.DRY_GRASS) {
                surfaceY = y; break;
            }
        }
        if (surfaceY <= 0) continue;
        if (state.world[x][surfaceY] === BLOCKS.SAND && biome !== BIOMES.DESERT) continue;
        if (Math.random() < bi.treeChance * 2.5) {
            if (bi.treeType === "oak")    generateOakTree(x, surfaceY, state.bgWorld);
            else if (bi.treeType === "cactus")  generateCactus(x, surfaceY, state.bgWorld);
            else if (bi.treeType === "acacia")  generateAcacia(x, surfaceY, state.bgWorld);
            else if (bi.treeType === "spruce")  generateSpruce(x, surfaceY, state.bgWorld);
            x += 2;
        }
    }
}

// ============================================================
// VILLAGE GENERATION
// ============================================================

function generateVillages(seed) {
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

function generateHouse(x, surfaceY, w, h, wallBlock) {
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

// Find the surface Y at a given X (first solid block from top)
export function findSurfaceY(x) {
    const startY = state.inNether ? 3 : 0; // Skip Nether bedrock ceiling
    for (let y = startY; y < WORLD_HEIGHT; y++) {
        if (isBlockSolid(x, y)) return y;
    }
    return WORLD_HEIGHT - 1;
}

// ============================================================
// STRUCTURE GENERATION
// ============================================================

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

function generateStructures(seed) {
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

// ============================================================
// CAVE GENERATION
// ============================================================

function generateCaves(seed) {
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

// ============================================================
// ORE PLACEMENT (after caves)
// ============================================================

function placeOres(seed) {
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
            const mult = nearCave ? 2 : 1;
            const rand = Math.random();

            if (depth > 5 && rand < 0.01 * mult) state.world[x][y] = BLOCKS.COAL;
            else if (depth > 5 && Math.random() < 0.01 * mult) state.world[x][y] = BLOCKS.COPPER;
            else if (depth > 10 && Math.random() < 0.018 * mult) state.world[x][y] = BLOCKS.IRON;
            else if (depth > 10 && Math.random() < 0.005 * mult) state.world[x][y] = BLOCKS.EMERALD;
            else if (depth > 20 && Math.random() < 0.008 * mult) state.world[x][y] = BLOCKS.GOLD;
            else if (depth > 40 && Math.random() < 0.0035 * mult) state.world[x][y] = BLOCKS.DIAMOND;
        }
    }
}

// ============================================================
// NETHER WORLD GENERATION
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
                if (Math.random() < 0.015) {
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

function generateNetherFortress(x, surfaceY) {
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

function generateNetherTree(x, surfaceY, target) {
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

function generateWarpedTree(x, surfaceY, target) {
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
