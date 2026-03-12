// ============================================================
// GENERATION.JS - Main overworld generation orchestrator
// ============================================================
// generateWorld, biome assignment, and the main loop that
// calls terrain, structures, caves, and ore placement.
// ============================================================

import { state } from '../state.js';
import { BLOCKS, WORLD_WIDTH, WORLD_HEIGHT, SURFACE_LEVEL, SEA_LEVEL, BIOMES, BIOME_INFO } from '../constants.js';
import { generateOakTree, generateCactus, generateAcacia, generateSpruce } from './terrain.js';
import { generateVillages, generateStructures } from './structures.js';
import { generateCaves, placeOres } from './caves.js';

// ============================================================
// INTERNAL: noise function - makes smooth natural-looking hills
// ============================================================

function simpleNoise(x, seed) {
    return Math.sin(x * 0.05 + seed) * 6 +
           Math.sin(x * 0.1 + seed * 2) * 3 +
           Math.sin(x * 0.02 + seed * 0.5) * 10;
}

// ============================================================
// INTERNAL: biome assignment
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
// MAIN OVERWORLD GENERATOR
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

    // Small water puddles on the surface (1-3 blocks wide, every ~80 blocks)
    for (let x = 10; x < WORLD_WIDTH - 10; x++) {
        if (Math.random() < 0.012) { // ~1.2% chance per column
            const biome = state.biomeMap[x];
            if (biome === BIOMES.DESERT) { x += 5; continue; } // skip desert
            // Find surface
            let surfY = -1;
            for (let y = 0; y < WORLD_HEIGHT; y++) {
                const b = state.world[x][y];
                if (b !== BLOCKS.AIR && b !== BLOCKS.WATER && b !== BLOCKS.ICE) {
                    surfY = y; break;
                }
            }
            if (surfY <= 0 || surfY >= WORLD_HEIGHT - 2) continue;
            // Dig a small 1-3 block wide puddle, 1 block deep
            const puddleWidth = 1 + Math.floor(Math.random() * 3);
            for (let px = 0; px < puddleWidth; px++) {
                const wx = x + px;
                if (wx >= WORLD_WIDTH) break;
                // Replace surface block with water, push dirt down
                if (state.world[wx][surfY] !== BLOCKS.AIR && state.world[wx][surfY] !== BLOCKS.WATER) {
                    if (biome === BIOMES.TUNDRA) {
                        state.world[wx][surfY] = BLOCKS.ICE;
                    } else {
                        state.world[wx][surfY] = BLOCKS.WATER;
                    }
                }
            }
            x += puddleWidth + 5; // skip ahead so puddles don't cluster
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
