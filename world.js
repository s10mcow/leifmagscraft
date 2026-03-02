// ============================================================
// WORLD.JS - World generation, biomes, and terrain
// ============================================================
// Creates the world with 4 biomes: Forest, Desert, Savannah,
// Tundra. Each has unique surface blocks, trees, and feel.
// ============================================================

const world = [];
const biomeMap = []; // stores biome ID per column
const chestData = {}; // key: "x,y" -> array of 9 slot objects

// Nether dimension
const netherWorld = [];
let inNether = false;
let activeWorld = world; // points to current dimension's world array

// Saved portal positions for dimension travel
let overworldPortalX = 0;
let overworldPortalY = 0;
let netherPortalX = 0;
let netherPortalY = 0;

function switchDimension(toNether) {
    inNether = toNether;
    activeWorld = toNether ? netherWorld : world;
}

function initChestData(x, y, lootTableName) {
    const key = `${x},${y}`;
    chestData[key] = Array(9).fill(null).map(() => ({ itemId: 0, count: 0, durability: 0 }));
    if (lootTableName && LOOT_TABLES[lootTableName]) {
        const table = LOOT_TABLES[lootTableName];
        let slotIdx = 0;
        for (const entry of table) {
            if (slotIdx >= 9) break;
            if (Math.random() < entry.chance) {
                const count = entry.min + Math.floor(Math.random() * (entry.max - entry.min + 1));
                chestData[key][slotIdx] = {
                    itemId: entry.id,
                    count: count,
                    durability: (ITEM_INFO[entry.id] && ITEM_INFO[entry.id].durability) ? ITEM_INFO[entry.id].durability : 0
                };
                slotIdx++;
            }
        }
    }
}

function removeChestData(x, y) {
    delete chestData[`${x},${y}`];
}

// Noise function - makes smooth natural-looking hills
function simpleNoise(x, seed) {
    return Math.sin(x * 0.05 + seed) * 6 +
           Math.sin(x * 0.1 + seed * 2) * 3 +
           Math.sin(x * 0.02 + seed * 0.5) * 10;
}

// Check if a block at (x,y) is solid (not air/water/torch/lava/open door/portal)
function isBlockSolid(x, y) {
    if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT) return true;
    const block = activeWorld[x][y];
    return block !== BLOCKS.AIR && block !== BLOCKS.WATER && block !== BLOCKS.TORCH &&
           block !== BLOCKS.LAVA && block !== BLOCKS.DOOR_OPEN && block !== BLOCKS.NETHER_PORTAL &&
           block !== BLOCKS.PRESSURE_PLATE;
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
                biomeMap[col] = seg.biome;
                break;
            }
        }
    }
}

// ============================================================
// TREE GENERATORS
// ============================================================

function generateOakTree(x, surfaceY) {
    const h = 4 + Math.floor(Math.random() * 3); // 4-6 tall
    for (let i = 1; i <= h; i++) {
        if (surfaceY - i >= 0) world[x][surfaceY - i] = BLOCKS.WOOD;
    }
    for (let lx = -2; lx <= 2; lx++) {
        for (let ly = -3; ly <= -1; ly++) {
            const wx = x + lx, wy = surfaceY - h + ly;
            if (wx >= 0 && wx < WORLD_WIDTH && wy >= 0) {
                if (world[wx][wy] === BLOCKS.AIR) {
                    if (Math.abs(lx) === 2 && Math.abs(ly) === 1 && Math.random() < 0.4) continue;
                    world[wx][wy] = BLOCKS.LEAVES;
                }
            }
        }
    }
}

function generateCactus(x, surfaceY) {
    const h = 2 + Math.floor(Math.random() * 3); // 2-4 tall
    for (let i = 1; i <= h; i++) {
        if (surfaceY - i >= 0) world[x][surfaceY - i] = BLOCKS.CACTUS;
    }
}

function generateAcacia(x, surfaceY) {
    const h = 5 + Math.floor(Math.random() * 3); // 5-7 tall
    const lean = Math.random() < 0.5 ? 1 : -1;
    // Trunk (slightly diagonal at top)
    for (let i = 1; i <= h; i++) {
        const tx = (i > h - 2) ? x + lean : x;
        if (tx >= 0 && tx < WORLD_WIDTH && surfaceY - i >= 0) {
            world[tx][surfaceY - i] = BLOCKS.ACACIA_WOOD;
        }
    }
    // Flat-top canopy
    const topX = x + lean;
    const topY = surfaceY - h;
    for (let lx = -3; lx <= 3; lx++) {
        for (let ly = -2; ly <= -1; ly++) {
            const wx = topX + lx, wy = topY + ly;
            if (wx >= 0 && wx < WORLD_WIDTH && wy >= 0) {
                if (world[wx][wy] === BLOCKS.AIR) {
                    world[wx][wy] = BLOCKS.ACACIA_LEAVES;
                }
            }
        }
    }
}

function generateSpruce(x, surfaceY) {
    const h = 6 + Math.floor(Math.random() * 3); // 6-8 tall
    // Trunk
    for (let i = 1; i <= h; i++) {
        if (surfaceY - i >= 0) world[x][surfaceY - i] = BLOCKS.SPRUCE_WOOD;
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
                if (world[wx][wy] === BLOCKS.AIR) {
                    world[wx][wy] = BLOCKS.SPRUCE_LEAVES;
                }
            }
        }
    }
}

// ============================================================
// WORLD GENERATION
// ============================================================

function generateWorld() {
    const seed = Math.random() * 1000;

    // Assign biomes first
    assignBiomes(seed);

    // Fill with air
    for (let x = 0; x < WORLD_WIDTH; x++) {
        world[x] = [];
        for (let y = 0; y < WORLD_HEIGHT; y++) {
            world[x][y] = BLOCKS.AIR;
        }
    }

    // Generate terrain (biome-aware) - NO ores yet, those come after caves
    for (let x = 0; x < WORLD_WIDTH; x++) {
        const biome = biomeMap[x];
        const bi = BIOME_INFO[biome];

        const surfaceY = Math.floor(
            SURFACE_LEVEL + bi.heightOffset +
            simpleNoise(x, seed) * bi.heightAmplitude
        );

        for (let y = 0; y < WORLD_HEIGHT; y++) {
            if (y === WORLD_HEIGHT - 1) {
                world[x][y] = BLOCKS.BEDROCK;
            } else if (y === surfaceY) {
                if (surfaceY >= SEA_LEVEL - 1 && biome !== BIOMES.TUNDRA) {
                    world[x][y] = BLOCKS.SAND;
                } else {
                    world[x][y] = bi.surfaceBlock;
                }
            } else if (y > surfaceY && y < surfaceY + 4) {
                if (surfaceY >= SEA_LEVEL - 1 && biome !== BIOMES.TUNDRA) {
                    world[x][y] = BLOCKS.SAND;
                } else {
                    world[x][y] = bi.subSurfaceBlock;
                }
            } else if (y >= surfaceY + 4 && y < WORLD_HEIGHT - 1) {
                world[x][y] = BLOCKS.STONE;
            }

            // Water / Ice fills low spots
            if (y >= surfaceY && y < SEA_LEVEL && world[x][y] === BLOCKS.AIR) {
                if (biome === BIOMES.TUNDRA && y <= surfaceY + 1) {
                    world[x][y] = BLOCKS.ICE;
                } else {
                    world[x][y] = BLOCKS.WATER;
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
        const biome = biomeMap[x];
        const bi = BIOME_INFO[biome];

        // Find surface - check for the biome's surface block type
        let surfaceY = -1;
        for (let y = 0; y < WORLD_HEIGHT; y++) {
            const b = world[x][y];
            if (b === BLOCKS.GRASS || b === BLOCKS.SAND || b === BLOCKS.SNOW || b === BLOCKS.DRY_GRASS) {
                surfaceY = y;
                break;
            }
        }
        // Don't grow trees on sand (beach) unless it's a desert
        if (surfaceY <= 0) continue;
        if (world[x][surfaceY] === BLOCKS.SAND && biome !== BIOMES.DESERT) continue;

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
}

// ============================================================
// VILLAGE GENERATION
// ============================================================

const villageLocations = []; // stores {x, surfaceY} for spawning villagers later

function generateVillages(seed) {
    const villageCount = 3 + Math.floor(Math.random() * 3); // 3-5 villages
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
            const biome = biomeMap[x];
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
        const wallBlock = biomeMap[bestX] === BIOMES.SAVANNAH ? BLOCKS.COBBLESTONE : BLOCKS.PLANKS;

        for (let h = 0; h < houseCount; h++) {
            const houseW = 5 + Math.floor(Math.random() * 3); // 5-7 wide
            const houseH = 4 + Math.floor(Math.random() * 2); // 4-5 tall
            const sy = findSurfaceY(cx);
            if (cx + houseW + 2 >= WORLD_WIDTH) break;

            generateHouse(cx, sy, houseW, houseH, wallBlock);
            villageLocations.push({ x: (cx + houseW / 2) * BLOCK_SIZE, y: (sy - 2) * BLOCK_SIZE });

            cx += houseW + 3; // gap between houses
        }
    }
}

function generateHouse(x, surfaceY, w, h, wallBlock) {
    const style = Math.floor(Math.random() * 3); // 0=standard, 1=windowed, 2=cobble-base

    const floorY = surfaceY;
    const roofY = surfaceY - h;
    // Door goes on the right wall so player can walk in from outside
    const doorSide = Math.random() < 0.5 ? "left" : "right";
    const doorWallX = doorSide === "left" ? x : x + w - 1;

    for (let bx = x; bx < x + w; bx++) {
        if (bx >= WORLD_WIDTH) break;
        for (let by = roofY; by <= floorY; by++) {
            if (by < 0 || by >= WORLD_HEIGHT) continue;

            const isLeftWall = bx === x;
            const isRightWall = bx === x + w - 1;
            const isWall = isLeftWall || isRightWall;
            const isDoorWall = bx === doorWallX;

            if (by === roofY) {
                // Roof - varies by style
                if (style === 2) {
                    world[bx][by] = BLOCKS.COBBLESTONE;
                } else {
                    world[bx][by] = BLOCKS.PLANKS;
                }
                // Overhang: extend roof 1 block past walls
                if (isLeftWall && bx - 1 >= 0 && by >= 0 && by < WORLD_HEIGHT) world[bx - 1][by] = BLOCKS.PLANKS;
                if (isRightWall && bx + 1 < WORLD_WIDTH && by >= 0 && by < WORLD_HEIGHT) world[bx + 1][by] = style === 2 ? BLOCKS.COBBLESTONE : BLOCKS.PLANKS;
            } else if (by === floorY) {
                // Floor
                world[bx][by] = BLOCKS.COBBLESTONE;
            } else if (isWall) {
                // Door in the wall (2 blocks tall at ground level)
                if (isDoorWall && (by === floorY - 1 || by === floorY - 2)) {
                    world[bx][by] = BLOCKS.DOOR_CLOSED;
                }
                // Window hole in the opposite wall (style 1+2)
                else if (!isDoorWall && style >= 1 && by === floorY - 2 && h >= 4) {
                    world[bx][by] = BLOCKS.AIR; // window
                }
                // Cobble base (style 2): bottom row of walls is cobblestone
                else if (style === 2 && by === floorY - 1) {
                    world[bx][by] = BLOCKS.COBBLESTONE;
                }
                else {
                    world[bx][by] = wallBlock;
                }
            } else {
                // Interior air
                world[bx][by] = BLOCKS.AIR;
            }
        }
    }

    // Place a torch inside (opposite side from door)
    const torchX = doorSide === "left" ? x + w - 2 : x + 1;
    const torchY = roofY + 1;
    if (torchX > x && torchX < x + w - 1 && torchY > roofY && torchY < floorY) {
        world[torchX][torchY] = BLOCKS.TORCH;
    }

    // Style 1: add a second torch
    if (style >= 1 && w >= 6) {
        const torch2X = doorSide === "left" ? x + 2 : x + w - 3;
        if (torch2X > x && torch2X < x + w - 1 && torchY > roofY && torchY < floorY) {
            world[torch2X][torchY] = BLOCKS.TORCH;
        }
    }

    // Place a pressure plate just outside the door
    const outsideX = doorSide === "left" ? x - 1 : x + w;
    if (outsideX >= 0 && outsideX < WORLD_WIDTH && floorY - 1 >= 0 && floorY - 1 < WORLD_HEIGHT) {
        world[outsideX][floorY - 1] = BLOCKS.PRESSURE_PLATE;
    }

    // Clear space outside the door (2 blocks of air so player can enter)
    for (let dy = -2; dy <= -1; dy++) {
        if (outsideX >= 0 && outsideX < WORLD_WIDTH && floorY + dy >= 0 && floorY + dy < WORLD_HEIGHT) {
            if (world[outsideX][floorY + dy] !== BLOCKS.PRESSURE_PLATE) {
                world[outsideX][floorY + dy] = BLOCKS.AIR;
            }
        }
    }
}

// Find the surface Y at a given X (first solid block from top)
function findSurfaceY(x) {
    const startY = inNether ? 3 : 0; // Skip Nether bedrock ceiling
    for (let y = startY; y < WORLD_HEIGHT; y++) {
        if (isBlockSolid(x, y)) return y;
    }
    return WORLD_HEIGHT - 1;
}

// ============================================================
// STRUCTURE GENERATION
// ============================================================

const structureLocations = []; // stores {x, type} to avoid overlap

function isAreaClear(x, width) {
    const spawnX = Math.floor(WORLD_WIDTH / 2);
    if (Math.abs(x - spawnX) < 30) return false;
    for (const vl of villageLocations) {
        const vlBlockX = Math.floor(vl.x / BLOCK_SIZE);
        if (Math.abs(x - vlBlockX) < 20) return false;
    }
    for (const sl of structureLocations) {
        if (Math.abs(x - sl.x) < 20) return false;
    }
    if (x < 5 || x + width >= WORLD_WIDTH - 5) return false;
    return true;
}

function generateDesertTemple(x, surfaceY) {
    // Pyramid top (3 stepped sand layers)
    for (let dx = 4; dx <= 6; dx++) {
        if (x + dx < WORLD_WIDTH) world[x + dx][surfaceY - 7] = BLOCKS.SAND;
    }
    for (let dx = 3; dx <= 7; dx++) {
        if (x + dx < WORLD_WIDTH) world[x + dx][surfaceY - 6] = BLOCKS.SAND;
    }
    for (let dx = 2; dx <= 8; dx++) {
        if (x + dx < WORLD_WIDTH) world[x + dx][surfaceY - 5] = BLOCKS.SAND;
    }

    // Main body: rows -4 to 0
    for (let dy = -4; dy <= 0; dy++) {
        for (let dx = 1; dx <= 9; dx++) {
            const bx = x + dx, by = surfaceY + dy;
            if (bx >= WORLD_WIDTH || by < 0 || by >= WORLD_HEIGHT) continue;
            if (dx === 1 || dx === 9) {
                world[bx][by] = BLOCKS.SAND;
            } else if (dx === 2 || dx === 8) {
                world[bx][by] = BLOCKS.COBBLESTONE;
            } else if (dy === -4 || dy === 0) {
                world[bx][by] = BLOCKS.COBBLESTONE;
            } else {
                world[bx][by] = BLOCKS.AIR;
            }
        }
    }

    // Door
    if (x + 5 < WORLD_WIDTH) {
        world[x + 5][surfaceY - 1] = BLOCKS.DOOR_CLOSED;
        world[x + 5][surfaceY - 2] = BLOCKS.DOOR_CLOSED;
    }

    // Torches inside
    if (x + 4 < WORLD_WIDTH) world[x + 4][surfaceY - 3] = BLOCKS.TORCH;
    if (x + 6 < WORLD_WIDTH) world[x + 6][surfaceY - 3] = BLOCKS.TORCH;

    // Underground chest room (rows +1 to +3)
    for (let dy = 1; dy <= 3; dy++) {
        for (let dx = 2; dx <= 8; dx++) {
            const bx = x + dx, by = surfaceY + dy;
            if (bx >= WORLD_WIDTH || by >= WORLD_HEIGHT) continue;
            if (dy === 3 || dx === 2 || dx === 8) {
                world[bx][by] = BLOCKS.COBBLESTONE;
            } else {
                world[bx][by] = BLOCKS.AIR;
            }
        }
    }

    // 2 chests in underground room
    const c1x = x + 4, c1y = surfaceY + 2;
    const c2x = x + 6, c2y = surfaceY + 2;
    if (c1x < WORLD_WIDTH && c1y < WORLD_HEIGHT) {
        world[c1x][c1y] = BLOCKS.CHEST;
        initChestData(c1x, c1y, "desert_temple");
    }
    if (c2x < WORLD_WIDTH && c2y < WORLD_HEIGHT) {
        world[c2x][c2y] = BLOCKS.CHEST;
        initChestData(c2x, c2y, "desert_temple");
    }

    structureLocations.push({ x: x, type: "desert_temple" });
}

function generateForestCabin(x, surfaceY) {
    const w = 7, h = 5;
    const doorDx = 3;

    for (let dx = 0; dx < w; dx++) {
        for (let dy = -h; dy <= 0; dy++) {
            const bx = x + dx, by = surfaceY + dy;
            if (bx >= WORLD_WIDTH || by < 0 || by >= WORLD_HEIGHT) continue;
            if (dy === -h || dy === 0) {
                world[bx][by] = BLOCKS.PLANKS;
            } else if (dx === 0 || dx === w - 1) {
                world[bx][by] = BLOCKS.WOOD;
            } else {
                world[bx][by] = BLOCKS.AIR;
            }
        }
    }

    // Door
    if (x + doorDx < WORLD_WIDTH) {
        world[x + doorDx][surfaceY - 1] = BLOCKS.DOOR_CLOSED;
        world[x + doorDx][surfaceY - 2] = BLOCKS.DOOR_CLOSED;
    }

    // Torch
    if (x + 2 < WORLD_WIDTH) world[x + 2][surfaceY - 4] = BLOCKS.TORCH;

    // Chest
    const cx = x + 5, cy = surfaceY - 1;
    if (cx < WORLD_WIDTH && cy >= 0) {
        world[cx][cy] = BLOCKS.CHEST;
        initChestData(cx, cy, "forest_cabin");
    }

    structureLocations.push({ x: x, type: "forest_cabin" });
}

function generateSavannahRuins(x, surfaceY) {
    const w = 9, h = 4;

    // Floor (mostly intact)
    for (let dx = 1; dx <= 7; dx++) {
        const bx = x + dx;
        if (bx < WORLD_WIDTH && surfaceY < WORLD_HEIGHT) {
            world[bx][surfaceY] = BLOCKS.COBBLESTONE;
        }
    }

    // Walls with random gaps (ruined look)
    for (let dy = -h; dy <= -1; dy++) {
        for (let dx = 1; dx <= 7; dx++) {
            const bx = x + dx, by = surfaceY + dy;
            if (bx >= WORLD_WIDTH || by < 0 || by >= WORLD_HEIGHT) continue;
            if (dx === 1 || dx === 7) {
                if (Math.random() < 0.7) {
                    world[bx][by] = BLOCKS.COBBLESTONE;
                }
            } else {
                world[bx][by] = BLOCKS.AIR;
            }
        }
    }

    // Ensure bottom wall blocks are intact
    if (x + 1 < WORLD_WIDTH) world[x + 1][surfaceY - 1] = BLOCKS.COBBLESTONE;
    if (x + 7 < WORLD_WIDTH) world[x + 7][surfaceY - 1] = BLOCKS.COBBLESTONE;

    // Chest
    const cx = x + 4, cy = surfaceY - 1;
    if (cx < WORLD_WIDTH && cy >= 0) {
        world[cx][cy] = BLOCKS.CHEST;
        initChestData(cx, cy, "savannah_ruins");
    }

    structureLocations.push({ x: x, type: "savannah_ruins" });
}

function generateStructures(seed) {
    // Desert Temples
    let desertCount = 0;
    for (let x = 20; x < WORLD_WIDTH - 20 && desertCount < 3; x += 50) {
        if (biomeMap[x] !== BIOMES.DESERT) continue;
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
        if (biomeMap[x] !== BIOMES.FOREST) continue;
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
        if (biomeMap[x] !== BIOMES.SAVANNAH) continue;
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
                            if (world[bx][by] === BLOCKS.STONE || world[bx][by] === BLOCKS.DIRT) {
                                world[bx][by] = BLOCKS.AIR;
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
                        if (world[gx][fy] === BLOCKS.STONE) {
                            world[gx][fy] = BLOCKS.GRAVEL;
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
                            if (world[bx][by] === BLOCKS.AIR || world[bx][by] === BLOCKS.STONE) {
                                world[bx][by] = BLOCKS.LAVA;
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
            if (world[x][y] === BLOCKS.LAVA) {
                checkLavaWaterWorld(x, y, world);
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
function checkLavaWaterInteraction(x, y) {
    if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT) return;
    if (activeWorld[x][y] !== BLOCKS.LAVA) return;
    const neighbors = [[x-1,y],[x+1,y],[x,y-1],[x,y+1]];
    for (const [nx, ny] of neighbors) {
        if (nx >= 0 && nx < WORLD_WIDTH && ny >= 0 && ny < WORLD_HEIGHT) {
            if (activeWorld[nx][ny] === BLOCKS.WATER) {
                activeWorld[x][y] = BLOCKS.OBSIDIAN;
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
            const b = world[x][y];
            if (b !== BLOCKS.AIR && b !== BLOCKS.WATER && b !== BLOCKS.ICE &&
                b !== BLOCKS.TORCH && b !== BLOCKS.LAVA) {
                surfY = y;
                break;
            }
        }

        for (let y = surfY + 1; y < WORLD_HEIGHT - 1; y++) {
            if (world[x][y] !== BLOCKS.STONE) continue;
            const depth = y - surfY;

            // Extra ores near caves (adjacent to air)
            let nearCave = false;
            for (const [dx, dy] of [[-1,0],[1,0],[0,-1],[0,1]]) {
                const nx = x + dx, ny = y + dy;
                if (nx >= 0 && nx < WORLD_WIDTH && ny >= 0 && ny < WORLD_HEIGHT) {
                    if (world[nx][ny] === BLOCKS.AIR && depth > 3) { nearCave = true; break; }
                }
            }
            const mult = nearCave ? 2 : 1;
            const rand = Math.random();

            if (depth > 5 && rand < 0.01 * mult) world[x][y] = BLOCKS.COAL;
            else if (depth > 5 && Math.random() < 0.01 * mult) world[x][y] = BLOCKS.COPPER;
            else if (depth > 10 && rand < 0.018 * mult) world[x][y] = BLOCKS.IRON;
            else if (depth > 10 && Math.random() < 0.005 * mult) world[x][y] = BLOCKS.EMERALD;
            else if (depth > 25 && rand < 0.01 * mult) world[x][y] = BLOCKS.GOLD;
            else if (depth > 40 && rand < 0.02 * mult) world[x][y] = BLOCKS.DIAMOND;
        }
    }
}

// ============================================================
// NETHER WORLD GENERATION
// ============================================================

function generateNetherWorld() {
    const seed = Math.random() * 1000;

    for (let x = 0; x < WORLD_WIDTH; x++) {
        netherWorld[x] = [];
        for (let y = 0; y < WORLD_HEIGHT; y++) {
            netherWorld[x][y] = BLOCKS.NETHERRACK;
        }
    }

    // Bedrock ceiling and floor
    for (let x = 0; x < WORLD_WIDTH; x++) {
        netherWorld[x][0] = BLOCKS.BEDROCK;
        netherWorld[x][1] = BLOCKS.BEDROCK;
        netherWorld[x][WORLD_HEIGHT - 1] = BLOCKS.BEDROCK;
    }

    // Carve open central cavern
    const netherCeilingY = 5;
    const netherFloorY = WORLD_HEIGHT - 15;

    for (let x = 0; x < WORLD_WIDTH; x++) {
        const ceilVar = Math.floor(Math.abs(simpleNoise(x, seed + 100)) * 0.3 + 0.5);
        const floorVar = Math.floor(simpleNoise(x, seed + 200) * 0.3);

        for (let y = netherCeilingY + ceilVar; y < netherFloorY + floorVar; y++) {
            if (y >= 2 && y < WORLD_HEIGHT - 1) {
                netherWorld[x][y] = BLOCKS.AIR;
            }
        }
    }

    // Netherrack floor with terrain
    for (let x = 0; x < WORLD_WIDTH; x++) {
        const floorLevel = netherFloorY + Math.floor(simpleNoise(x, seed + 300) * 0.5);
        for (let y = floorLevel; y < WORLD_HEIGHT - 1; y++) {
            if (netherWorld[x][y] === BLOCKS.AIR) {
                netherWorld[x][y] = BLOCKS.NETHERRACK;
            }
        }
    }

    // Cave tunnels through netherrack
    const netherCaveCount = 4 + Math.floor(Math.random() * 4);
    for (let c = 0; c < netherCaveCount; c++) {
        let cx = 20 + Math.floor(Math.random() * (WORLD_WIDTH - 40));
        let cy = netherFloorY + Math.floor(Math.random() * 10);
        let angle = Math.random() * Math.PI * 2;
        const length = 40 + Math.floor(Math.random() * 60);

        for (let step = 0; step < length; step++) {
            const width = 1 + Math.floor(Math.random() * 2);
            for (let dx = -width; dx <= width; dx++) {
                for (let dy = -width; dy <= width; dy++) {
                    if (dx * dx + dy * dy <= width * width) {
                        const bx = Math.floor(cx) + dx;
                        const by = Math.floor(cy) + dy;
                        if (bx >= 1 && bx < WORLD_WIDTH - 1 && by >= 3 && by < WORLD_HEIGHT - 1) {
                            if (netherWorld[bx][by] === BLOCKS.NETHERRACK) {
                                netherWorld[bx][by] = BLOCKS.AIR;
                            }
                        }
                    }
                }
            }
            angle += (Math.random() - 0.5) * 0.6;
            cx += Math.cos(angle) * 1.5;
            cy += Math.sin(angle) * 0.5;
        }
    }

    // Lava lakes on the nether floor
    for (let i = 0; i < 8; i++) {
        const lakeX = 20 + Math.floor(Math.random() * (WORLD_WIDTH - 40));
        const lakeW = 8 + Math.floor(Math.random() * 15);
        for (let x = lakeX; x < lakeX + lakeW && x < WORLD_WIDTH; x++) {
            for (let y = WORLD_HEIGHT - 2; y > 5; y--) {
                if (netherWorld[x][y] === BLOCKS.AIR && y + 1 < WORLD_HEIGHT && netherWorld[x][y + 1] === BLOCKS.NETHERRACK) {
                    netherWorld[x][y] = BLOCKS.LAVA;
                    if (y > 1 && netherWorld[x][y - 1] === BLOCKS.AIR) {
                        netherWorld[x][y - 1] = BLOCKS.LAVA;
                    }
                    break;
                }
            }
        }
    }

    // Glowstone clusters on ceiling
    for (let i = 0; i < 40; i++) {
        const gx = Math.floor(Math.random() * WORLD_WIDTH);
        for (let y = 2; y < WORLD_HEIGHT - 1; y++) {
            if (netherWorld[gx][y] === BLOCKS.NETHERRACK && y + 1 < WORLD_HEIGHT && netherWorld[gx][y + 1] === BLOCKS.AIR) {
                netherWorld[gx][y] = BLOCKS.GLOWSTONE;
                for (let dx = -1; dx <= 1; dx++) {
                    const nx = gx + dx;
                    if (nx >= 0 && nx < WORLD_WIDTH && Math.random() < 0.5) {
                        if (netherWorld[nx][y] === BLOCKS.NETHERRACK) netherWorld[nx][y] = BLOCKS.GLOWSTONE;
                        if (y + 1 < WORLD_HEIGHT && netherWorld[nx][y + 1] === BLOCKS.AIR && Math.random() < 0.3) {
                            netherWorld[nx][y + 1] = BLOCKS.GLOWSTONE;
                        }
                    }
                }
                break;
            }
        }
    }

    // Soul sand patches on floor
    for (let i = 0; i < 20; i++) {
        const sx = Math.floor(Math.random() * WORLD_WIDTH);
        const patchWidth = 5 + Math.floor(Math.random() * 8);
        for (let x = sx; x < sx + patchWidth && x < WORLD_WIDTH; x++) {
            for (let y = WORLD_HEIGHT - 2; y > 5; y--) {
                if (netherWorld[x][y] === BLOCKS.NETHERRACK &&
                    (y === 0 || netherWorld[x][y - 1] === BLOCKS.AIR)) {
                    netherWorld[x][y] = BLOCKS.SOUL_SAND;
                    break;
                }
            }
        }
    }

    // Nether fortress bridges
    const fortressCount = 1 + Math.floor(Math.random() * 2);
    for (let f = 0; f < fortressCount; f++) {
        const fx = 50 + Math.floor(Math.random() * (WORLD_WIDTH - 100));
        const fy = netherCeilingY + 15 + Math.floor(Math.random() * 10);
        const bridgeLen = 20 + Math.floor(Math.random() * 30);

        for (let dx = 0; dx < bridgeLen; dx++) {
            const bx = fx + dx;
            if (bx >= WORLD_WIDTH) break;
            // Bridge floor
            if (fy < WORLD_HEIGHT) netherWorld[bx][fy] = BLOCKS.NETHER_BRICK;
            if (fy + 1 < WORLD_HEIGHT) netherWorld[bx][fy + 1] = BLOCKS.NETHER_BRICK;
            // Railing pillars every 4 blocks
            if (dx % 4 === 0) {
                for (let dy = -3; dy < 0; dy++) {
                    if (fy + dy >= 0 && fy + dy < WORLD_HEIGHT) {
                        netherWorld[bx][fy + dy] = BLOCKS.NETHER_BRICK;
                    }
                }
            } else {
                // Clear air above bridge
                for (let dy = -2; dy < 0; dy++) {
                    if (fy + dy >= 0) netherWorld[bx][fy + dy] = BLOCKS.AIR;
                }
            }
        }
    }
}
