// ============================================================
// WASTELAND.JS - Wasteland dimension generation
// ============================================================

import { state } from '../state.js';
import { BLOCKS, WORLD_WIDTH, WORLD_HEIGHT, SURFACE_LEVEL, BLOCK_SIZE, WASTELAND_BIOMES, ITEMS } from '../constants.js';
import { initChestData } from './chunks.js';

function simpleNoise(x, seed) {
    return Math.sin(x * 0.05 + seed) * 6 +
           Math.sin(x * 0.1 + seed * 2) * 3 +
           Math.sin(x * 0.02 + seed * 0.5) * 10;
}

function assignWastelandBiomes(seed) {
    state.wastelandBiomeMap = [];
    const biomeSeq = [WASTELAND_BIOMES.FLATS, WASTELAND_BIOMES.BADLANDS, WASTELAND_BIOMES.RUINS];
    let seqIdx = Math.floor(Math.abs(Math.sin(seed * 2.1)) * 3);
    let x = 0;
    while (x < WORLD_WIDTH) {
        const segWidth = 120 + Math.floor(Math.abs(Math.sin(seed * 0.04 + x * 0.006)) * 100) + Math.floor(Math.random() * 80);
        const biome = biomeSeq[seqIdx % 3];
        const end = Math.min(x + segWidth, WORLD_WIDTH);
        for (let i = x; i < end; i++) state.wastelandBiomeMap[i] = biome;
        x = end;
        seqIdx++;
    }
}

function generateDeadTree(x, surfaceY, target) {
    const w = target || state.wastelandWorld;
    const h = 3 + Math.floor(Math.random() * 4);
    for (let i = 1; i <= h; i++) {
        if (surfaceY - i >= 0) w[x][surfaceY - i] = BLOCKS.DEAD_WOOD;
    }
    // Skeletal branches, no leaves
    if (Math.random() < 0.6 && h >= 3) {
        const branchY = surfaceY - Math.floor(h * 0.6);
        if (x - 1 >= 0 && branchY >= 0) w[x - 1][branchY] = BLOCKS.DEAD_WOOD;
        if (x + 1 < WORLD_WIDTH && branchY >= 0) w[x + 1][branchY] = BLOCKS.DEAD_WOOD;
    }
    if (Math.random() < 0.4 && h >= 4) {
        const branchY2 = surfaceY - Math.floor(h * 0.35);
        const side = Math.random() < 0.5 ? -1 : 1;
        if (x + side >= 0 && x + side < WORLD_WIDTH && branchY2 >= 0) {
            w[x + side][branchY2] = BLOCKS.DEAD_WOOD;
        }
    }
}

function generateWastelandRuin(x, surfaceY) {
    const w = 6 + Math.floor(Math.random() * 6);
    const h = 4 + Math.floor(Math.random() * 3);
    const floorY = surfaceY;
    const roofY = surfaceY - h;

    for (let bx = x; bx < x + w; bx++) {
        if (bx < 0 || bx >= WORLD_WIDTH) continue;
        for (let by = roofY; by <= floorY; by++) {
            if (by < 0 || by >= WORLD_HEIGHT) continue;
            const isWall = bx === x || bx === x + w - 1;
            const isFloor = by === floorY;
            const isRoof = by === roofY && Math.random() > 0.3;
            if (isWall || isFloor || isRoof) {
                if (isWall && Math.random() < 0.25) continue;
                // Use cobblestone for ruins — looks appropriately crumbling
                state.wastelandWorld[bx][by] = BLOCKS.COBBLESTONE;
            } else {
                state.wastelandWorld[bx][by] = BLOCKS.AIR;
            }
        }
    }
    // Door-sized opening
    const entryX = x + 1;
    if (entryX >= 0 && entryX < WORLD_WIDTH) {
        if (floorY - 1 >= 0) state.wastelandWorld[entryX][floorY - 1] = BLOCKS.AIR;
        if (floorY - 2 >= 0) state.wastelandWorld[entryX][floorY - 2] = BLOCKS.AIR;
    }
    // Chest inside ruins
    if (Math.random() < 0.6) {
        const cx = x + Math.floor(w / 2);
        const cy = floorY - 1;
        if (cx >= 0 && cx < WORLD_WIDTH && cy >= 0 && cy < WORLD_HEIGHT) {
            state.wastelandWorld[cx][cy] = BLOCKS.CHEST;
            initChestData(cx, cy, "wasteland_ruin");
        }
    }
}

// Pick a random surface block weighted toward netherrack and gravel
function surfaceBlock(biome, rng) {
    if (biome === WASTELAND_BIOMES.BADLANDS) {
        return rng < 0.6 ? BLOCKS.STONE : BLOCKS.NETHERRACK;
    }
    // FLATS and RUINS: mostly netherrack with gravel patches
    return rng < 0.55 ? BLOCKS.NETHERRACK : BLOCKS.GRAVEL;
}

export function generateWastelandWorld() {
    const seed = Math.random() * 1000;

    assignWastelandBiomes(seed);

    // Fill with air
    for (let x = 0; x < WORLD_WIDTH; x++) {
        state.wastelandWorld[x] = [];
        for (let y = 0; y < WORLD_HEIGHT; y++) {
            state.wastelandWorld[x][y] = BLOCKS.AIR;
        }
    }

    // Terrain — primary materials: netherrack, gravel, stone
    for (let x = 0; x < WORLD_WIDTH; x++) {
        const biome = state.wastelandBiomeMap[x];
        const noiseAmp = biome === WASTELAND_BIOMES.FLATS    ? 0.12 :
                         biome === WASTELAND_BIOMES.BADLANDS ? 1.3  : 0.55;
        const surfaceY = Math.floor(SURFACE_LEVEL + simpleNoise(x, seed) * noiseAmp);
        const rng = Math.abs(Math.sin(x * 37.1 + seed * 2.9)) % 1;

        for (let y = 0; y < WORLD_HEIGHT; y++) {
            if (y === WORLD_HEIGHT - 1) {
                state.wastelandWorld[x][y] = BLOCKS.BEDROCK;
            } else if (y === surfaceY) {
                state.wastelandWorld[x][y] = surfaceBlock(biome, rng);
            } else if (y > surfaceY && y < surfaceY + 4) {
                // Sub-surface: gravel and netherrack mix
                const subRng = Math.abs(Math.sin(x * 13.7 + y * 5.3 + seed)) % 1;
                state.wastelandWorld[x][y] = subRng < 0.5 ? BLOCKS.GRAVEL : BLOCKS.NETHERRACK;
            } else if (y > surfaceY && y < WORLD_HEIGHT - 1) {
                // Deep: mostly stone with netherrack veins
                const deepRng = Math.abs(Math.sin(x * 7.1 + y * 11.3 + seed * 1.7)) % 1;
                state.wastelandWorld[x][y] = deepRng < 0.35 ? BLOCKS.NETHERRACK : BLOCKS.STONE;
            }
        }
    }

    // Underground caves
    const caveCount = 3 + Math.floor(Math.random() * 3);
    for (let c = 0; c < caveCount; c++) {
        const startX = 20 + Math.floor(Math.random() * (WORLD_WIDTH - 40));
        const startY = SURFACE_LEVEL + 10 + Math.floor(Math.random() * (WORLD_HEIGHT - SURFACE_LEVEL - 15));
        let cx = startX, cy = startY;
        let angle = Math.random() * Math.PI * 2;
        const tunnelLength = 60 + Math.floor(Math.random() * 60);

        for (let step = 0; step < tunnelLength; step++) {
            const width = 1 + Math.floor(Math.random() * 2);
            for (let dx = -width; dx <= width; dx++) {
                for (let dy = -width; dy <= width; dy++) {
                    if (dx * dx + dy * dy <= width * width) {
                        const bx = Math.floor(cx) + dx, by = Math.floor(cy) + dy;
                        if (bx >= 1 && bx < WORLD_WIDTH - 1 && by > SURFACE_LEVEL + 3 && by < WORLD_HEIGHT - 1) {
                            const b = state.wastelandWorld[bx][by];
                            if (b === BLOCKS.STONE || b === BLOCKS.NETHERRACK || b === BLOCKS.GRAVEL) {
                                state.wastelandWorld[bx][by] = BLOCKS.AIR;
                            }
                        }
                    }
                }
            }
            angle += (Math.random() - 0.5) * 0.9;
            cx += Math.cos(angle) * 1.5;
            cy += Math.sin(angle) * 0.7;
            if (cx < 5 || cx >= WORLD_WIDTH - 5) angle = Math.PI - angle;
            if (cy < SURFACE_LEVEL + 5) cy = SURFACE_LEVEL + 5;
            if (cy > WORLD_HEIGHT - 3) cy = WORLD_HEIGHT - 3;
        }
    }

    // Nuclear waste pools — denser on FLATS, present on all biomes
    let lastPuddle = -999;
    for (let x = 5; x < WORLD_WIDTH - 5; x++) {
        if (x - lastPuddle < 18) continue;
        const biome = state.wastelandBiomeMap[x];
        const chance = biome === WASTELAND_BIOMES.FLATS ? 0.10 : 0.05;
        const r = Math.abs(Math.sin(x * 29.3 + seed * 5.7)) % 1;
        if (r > chance) continue;
        let surfY = -1;
        for (let y = 0; y < WORLD_HEIGHT; y++) {
            if (state.wastelandWorld[x][y] !== BLOCKS.AIR) { surfY = y; break; }
        }
        if (surfY < 0) continue;
        // Pools of 2-5 blocks wide
        const pudW = 2 + Math.floor(r * 50) % 4;
        for (let px = x; px < x + pudW && px < WORLD_WIDTH; px++) {
            state.wastelandWorld[px][surfY] = BLOCKS.TOXIC_PUDDLE;
        }
        lastPuddle = x;
    }

    // Dead trees — sparse, skipping BADLANDS and waste pool spots
    for (let x = 3; x < WORLD_WIDTH - 3; x++) {
        const biome = state.wastelandBiomeMap[x];
        if (biome === WASTELAND_BIOMES.BADLANDS) continue;
        let surfaceY = -1;
        for (let y = 0; y < WORLD_HEIGHT; y++) {
            if (state.wastelandWorld[x][y] !== BLOCKS.AIR) { surfaceY = y; break; }
        }
        if (surfaceY <= 0) continue;
        if (state.wastelandWorld[x][surfaceY] === BLOCKS.TOXIC_PUDDLE) continue;
        if (Math.random() < 0.04) {
            generateDeadTree(x, surfaceY);
            x += 3;
        }
    }

    // Ruins structures in the RUINS biome
    let lastRuin = -999;
    for (let x = 20; x < WORLD_WIDTH - 20; x++) {
        if (state.wastelandBiomeMap[x] !== WASTELAND_BIOMES.RUINS) continue;
        if (x - lastRuin < 50) continue;
        const r = Math.abs(Math.sin(x * 17.3 + seed * 3.1)) % 1;
        if (r > 0.1) continue;
        let surfY = -1;
        for (let y = 0; y < WORLD_HEIGHT; y++) {
            if (state.wastelandWorld[x][y] !== BLOCKS.AIR) { surfY = y; break; }
        }
        if (surfY > 0) {
            generateWastelandRuin(x, surfY);
            state.structureLocations.push({ x: x * BLOCK_SIZE, y: surfY * BLOCK_SIZE });
            lastRuin = x;
            x += 12;
        }
    }

    // Ore veins — raw steel and titanium (diamond pickaxe only)
    for (let x = 1; x < WORLD_WIDTH - 1; x++) {
        let surfY = 0;
        for (let y = 0; y < WORLD_HEIGHT; y++) {
            if (state.wastelandWorld[x][y] !== BLOCKS.AIR) { surfY = y; break; }
        }
        for (let y = surfY + 1; y < WORLD_HEIGHT - 1; y++) {
            const b = state.wastelandWorld[x][y];
            if (b !== BLOCKS.STONE && b !== BLOCKS.NETHERRACK) continue;
            const depth = y - surfY;
            const r = Math.abs(Math.sin(x * 43.7 + y * 17.3 + seed * 3.1)) % 1;
            if (depth > 12 && r < 0.004) {
                // Raw steel ore — rare (equiv. to overworld iron)
                state.wastelandWorld[x][y] = BLOCKS.RAW_STEEL_ORE;
                for (const [ox, oy] of [[-1,0],[1,0],[0,-1],[0,1]]) {
                    const nx = x + ox, ny = y + oy;
                    if (nx >= 1 && nx < WORLD_WIDTH-1 && ny > surfY+3 && ny < WORLD_HEIGHT-1) {
                        const nb = state.wastelandWorld[nx][ny];
                        if ((nb === BLOCKS.STONE || nb === BLOCKS.NETHERRACK) && Math.random() < 0.45)
                            state.wastelandWorld[nx][ny] = BLOCKS.RAW_STEEL_ORE;
                    }
                }
            } else if (depth > 20 && r < 0.0055) {
                // Titanium ore — very rare (equiv. to overworld diamond)
                state.wastelandWorld[x][y] = BLOCKS.TITANIUM_ORE;
                for (const [ox, oy] of [[-1,0],[1,0],[0,1]]) {
                    const nx = x + ox, ny = y + oy;
                    if (nx >= 1 && nx < WORLD_WIDTH-1 && ny > surfY+3 && ny < WORLD_HEIGHT-1) {
                        const nb = state.wastelandWorld[nx][ny];
                        if ((nb === BLOCKS.STONE || nb === BLOCKS.NETHERRACK) && Math.random() < 0.3)
                            state.wastelandWorld[nx][ny] = BLOCKS.TITANIUM_ORE;
                    }
                }
            } else if (depth > 18 && r < 0.020) {
                // Uranium ore — slightly rarer than steel/titanium but more common than before
                state.wastelandWorld[x][y] = BLOCKS.URANIUM_ORE;
                for (const [ox, oy] of [[-1,0],[1,0],[0,1]]) {
                    const nx = x + ox, ny = y + oy;
                    if (nx >= 1 && nx < WORLD_WIDTH-1 && ny > surfY+3 && ny < WORLD_HEIGHT-1) {
                        const nb = state.wastelandWorld[nx][ny];
                        if ((nb === BLOCKS.STONE || nb === BLOCKS.NETHERRACK) && Math.random() < 0.35)
                            state.wastelandWorld[nx][ny] = BLOCKS.URANIUM_ORE;
                    }
                }
            }
        }
    }

    // Background tree layer
    for (let x = 0; x < WORLD_WIDTH; x++) {
        state.wastelandBgWorld[x] = new Array(WORLD_HEIGHT).fill(BLOCKS.AIR);
    }
    for (let x = 3; x < WORLD_WIDTH - 3; x++) {
        if (state.wastelandBiomeMap[x] === WASTELAND_BIOMES.BADLANDS) continue;
        let surfaceY = -1;
        for (let y = 0; y < WORLD_HEIGHT; y++) {
            if (state.wastelandWorld[x][y] !== BLOCKS.AIR) { surfaceY = y; break; }
        }
        if (surfaceY <= 0) continue;
        if (state.wastelandWorld[x][surfaceY] === BLOCKS.TOXIC_PUDDLE) continue;
        if (Math.random() < 0.08) {
            generateDeadTree(x, surfaceY, state.wastelandBgWorld);
            x += 2;
        }
    }
}
