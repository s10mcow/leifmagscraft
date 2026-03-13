// ============================================================
// WASTELAND.JS - Wasteland dimension generation
// ============================================================

import { state } from '../state.js';
import { BLOCKS, WORLD_WIDTH, WORLD_HEIGHT, SURFACE_LEVEL, BLOCK_SIZE, WASTELAND_BIOMES, ITEMS } from '../constants.js';
import { initChestData } from './chunks.js';
import { createMob } from '../mobs/entities.js';

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

// ============================================================
// BUNKER + CAMP GENERATION
// ============================================================

// Helper: carve a rectangular room and return its bounds
function carveRoom(wld, left, top, width, height, wallBlock) {
    const right = left + width - 1;
    const bottom = top + height - 1;
    for (let bx = left; bx <= right; bx++) {
        if (bx < 0 || bx >= WORLD_WIDTH) continue;
        for (let by = top; by <= bottom; by++) {
            if (by < 0 || by >= WORLD_HEIGHT) continue;
            const isWall = bx === left || bx === right;
            const isCeil = by === top;
            const isFloor = by === bottom;
            if (isWall || isCeil || isFloor) {
                wld[bx][by] = wallBlock;
            } else {
                wld[bx][by] = BLOCKS.AIR;
            }
        }
    }
    return { left, top, right, bottom };
}

// Helper: place a 2-block-tall iron door at (dx, floorY-1) and (dx, floorY-2)
function placeIronDoor(wld, dx, floorY) {
    if (dx < 0 || dx >= WORLD_WIDTH) return;
    if (floorY - 1 >= 0 && floorY - 1 < WORLD_HEIGHT) wld[dx][floorY - 1] = BLOCKS.IRON_DOOR_CLOSED;
    if (floorY - 2 >= 0 && floorY - 2 < WORLD_HEIGHT) wld[dx][floorY - 2] = BLOCKS.IRON_DOOR_CLOSED;
}

function generateWastelandBunker(x, surfaceY) {
    const wld = state.wastelandWorld;
    const WALL = BLOCKS.COBBLESTONE;
    const FLR  = BLOCKS.WASTELAND_STONE;

    // ==========================================================
    // SURFACE CAMP — barricade with gun chests
    // ==========================================================
    const campW = 16;
    const campLeft = x - 4;
    for (let bx = campLeft; bx < campLeft + campW; bx++) {
        if (bx < 0 || bx >= WORLD_WIDTH) continue;
        const isEdge = bx === campLeft || bx === campLeft + campW - 1;
        for (let dy = 1; dy <= 3; dy++) {
            const by = surfaceY - dy;
            if (by >= 0 && by < WORLD_HEIGHT) {
                wld[bx][by] = isEdge ? WALL : BLOCKS.AIR;
            }
        }
        if (surfaceY < WORLD_HEIGHT) wld[bx][surfaceY] = FLR;
    }
    // Opening in left wall
    if (campLeft >= 0) {
        if (surfaceY - 1 >= 0) wld[campLeft][surfaceY - 1] = BLOCKS.AIR;
        if (surfaceY - 2 >= 0) wld[campLeft][surfaceY - 2] = BLOCKS.AIR;
    }
    // Two gun chests + torches
    const campSpots = [campLeft + 4, campLeft + 10];
    for (const cx of campSpots) {
        if (cx >= 0 && cx < WORLD_WIDTH && surfaceY - 1 >= 0) {
            wld[cx][surfaceY - 1] = BLOCKS.CHEST;
            initChestData(cx, surfaceY - 1, "wasteland_camp");
        }
    }
    for (const tx of [campLeft + 2, campLeft + 8, campLeft + 13]) {
        if (tx >= 0 && tx < WORLD_WIDTH && surfaceY - 1 >= 0) wld[tx][surfaceY - 1] = BLOCKS.TORCH;
    }

    // ==========================================================
    // STAIRWELL DOWN — entrance to floor 1
    // ==========================================================
    const stairDepth = 10;
    for (let step = 0; step < stairDepth; step++) {
        const sx = x + step;
        const sy = surfaceY + step;
        for (let dx = 0; dx < 3; dx++) {
            const bx = sx + dx;
            if (bx < 0 || bx >= WORLD_WIDTH) continue;
            for (let dy = 0; dy < 3; dy++) {
                const by = sy - dy;
                if (by >= 0 && by < WORLD_HEIGHT) wld[bx][by] = BLOCKS.AIR;
            }
            if (sy + 1 < WORLD_HEIGHT) wld[bx][sy + 1] = FLR;
        }
        const wl = sx - 1, wr = sx + 3;
        for (let dy = -2; dy <= 1; dy++) {
            const by = sy + dy;
            if (by >= 0 && by < WORLD_HEIGHT) {
                if (wl >= 0) wld[wl][by] = WALL;
                if (wr < WORLD_WIDTH) wld[wr][by] = WALL;
            }
        }
    }

    // ==========================================================
    // FLOOR 1 — large hallway with rooms on both sides
    // ==========================================================
    const f1Top = surfaceY + stairDepth - 2;
    const hallW = 40;
    const hallH = 8;
    const hallLeft = x - 10;
    const hall = carveRoom(wld, hallLeft, f1Top, hallW, hallH, WALL);

    // Room A (left wing) — storage
    const roomA = carveRoom(wld, hallLeft - 14, f1Top, 15, hallH, WALL);
    // Connect with iron door
    for (let dy = 1; dy <= 2; dy++) {
        const by = hall.bottom - dy;
        if (by >= 0 && by < WORLD_HEIGHT) wld[hall.left][by] = BLOCKS.AIR;
    }
    placeIronDoor(wld, hall.left, hall.bottom);

    // Room B (right wing) — armory
    const roomB = carveRoom(wld, hall.right, f1Top, 15, hallH, WALL);
    // Connect with iron door
    for (let dy = 1; dy <= 2; dy++) {
        const by = hall.bottom - dy;
        if (by >= 0 && by < WORLD_HEIGHT) wld[hall.right][by] = BLOCKS.AIR;
    }
    placeIronDoor(wld, hall.right, hall.bottom);

    // Room C (mid-left alcove)
    const roomCLeft = hallLeft + 8;
    const roomC = carveRoom(wld, roomCLeft, f1Top - 7, 10, 8, WALL);
    // Connect from hall ceiling
    for (let dy = 0; dy <= 1; dy++) {
        const by = roomC.bottom - dy;
        if (by >= 0 && by < WORLD_HEIGHT) wld[roomCLeft + 5][by] = BLOCKS.AIR;
    }
    // Iron door between room C and hall
    placeIronDoor(wld, roomCLeft + 5, roomC.bottom);

    // Room D (mid-right alcove)
    const roomDLeft = hallLeft + 22;
    const roomD = carveRoom(wld, roomDLeft, f1Top - 7, 10, 8, WALL);
    for (let dy = 0; dy <= 1; dy++) {
        const by = roomD.bottom - dy;
        if (by >= 0 && by < WORLD_HEIGHT) wld[roomDLeft + 5][by] = BLOCKS.AIR;
    }
    placeIronDoor(wld, roomDLeft + 5, roomD.bottom);

    // Dividing walls in main hall with iron doors
    const div1 = hallLeft + 13;
    const div2 = hallLeft + 27;
    for (const divX of [div1, div2]) {
        if (divX >= 0 && divX < WORLD_WIDTH) {
            for (let by = hall.top; by <= hall.bottom; by++) {
                if (by >= 0 && by < WORLD_HEIGHT) wld[divX][by] = WALL;
            }
            placeIronDoor(wld, divX, hall.bottom);
        }
    }

    // ==========================================================
    // STAIRWELL DOWN TO FLOOR 2
    // ==========================================================
    const stair2X = hallLeft + hallW - 6;
    const stair2Start = hall.bottom;
    const stair2Depth = 10;
    for (let step = 0; step < stair2Depth; step++) {
        const sx = stair2X - step; // stairs go left this time
        const sy = stair2Start + step;
        for (let dx = 0; dx < 3; dx++) {
            const bx = sx + dx;
            if (bx < 0 || bx >= WORLD_WIDTH) continue;
            for (let dy = 0; dy < 3; dy++) {
                const by = sy - dy;
                if (by >= 0 && by < WORLD_HEIGHT) wld[bx][by] = BLOCKS.AIR;
            }
            if (sy + 1 < WORLD_HEIGHT) wld[bx][sy + 1] = FLR;
        }
        const wl = sx - 1, wr = sx + 3;
        for (let dy = -2; dy <= 1; dy++) {
            const by = sy + dy;
            if (by >= 0 && by < WORLD_HEIGHT) {
                if (wl >= 0) wld[wl][by] = WALL;
                if (wr < WORLD_WIDTH) wld[wr][by] = WALL;
            }
        }
    }

    // ==========================================================
    // FLOOR 2 — deeper level, more rooms
    // ==========================================================
    const f2Top = stair2Start + stair2Depth - 2;
    const f2Left = hallLeft - 5;
    const f2W = 50;
    const f2H = 8;
    const hall2 = carveRoom(wld, f2Left, f2Top, f2W, f2H, WALL);

    // Room E (far left) — vault
    const roomE = carveRoom(wld, f2Left - 12, f2Top, 13, f2H, WALL);
    for (let dy = 1; dy <= 2; dy++) {
        const by = hall2.bottom - dy;
        if (by >= 0 && by < WORLD_HEIGHT) wld[hall2.left][by] = BLOCKS.AIR;
    }
    placeIronDoor(wld, hall2.left, hall2.bottom);

    // Room F (far right) — command room
    const roomF = carveRoom(wld, hall2.right, f2Top, 13, f2H, WALL);
    for (let dy = 1; dy <= 2; dy++) {
        const by = hall2.bottom - dy;
        if (by >= 0 && by < WORLD_HEIGHT) wld[hall2.right][by] = BLOCKS.AIR;
    }
    placeIronDoor(wld, hall2.right, hall2.bottom);

    // Room G (bottom extension)
    const roomGLeft = f2Left + 15;
    const roomG = carveRoom(wld, roomGLeft, hall2.bottom, 20, 7, WALL);
    // Connect from floor 2 hall floor
    for (let dx = roomGLeft + 3; dx < roomGLeft + 7; dx++) {
        if (dx >= 0 && dx < WORLD_WIDTH && hall2.bottom >= 0 && hall2.bottom < WORLD_HEIGHT) {
            wld[dx][hall2.bottom] = BLOCKS.AIR;
        }
    }
    // Iron door at entrance to room G
    placeIronDoor(wld, roomGLeft + 3, hall2.bottom + 1);

    // Dividing walls in floor 2 hall
    const f2Div1 = f2Left + 12;
    const f2Div2 = f2Left + 25;
    const f2Div3 = f2Left + 38;
    for (const divX of [f2Div1, f2Div2, f2Div3]) {
        if (divX >= 0 && divX < WORLD_WIDTH) {
            for (let by = hall2.top; by <= hall2.bottom; by++) {
                if (by >= 0 && by < WORLD_HEIGHT) wld[divX][by] = WALL;
            }
            placeIronDoor(wld, divX, hall2.bottom);
        }
    }

    // ==========================================================
    // TORCHES — spread through all rooms
    // ==========================================================
    const allRooms = [hall, roomA, roomB, roomC, roomD, hall2, roomE, roomF, roomG];
    for (const room of allRooms) {
        // Place torches near walls, one block below ceiling
        const ty = room.top + 1;
        for (const tx of [room.left + 2, room.right - 2]) {
            if (tx >= 0 && tx < WORLD_WIDTH && ty >= 0 && ty < WORLD_HEIGHT) {
                wld[tx][ty] = BLOCKS.TORCH;
            }
        }
        // Extra torches in wide rooms
        const rw = room.right - room.left;
        if (rw > 15) {
            const mid = room.left + Math.floor(rw / 2);
            if (mid >= 0 && mid < WORLD_WIDTH && ty >= 0 && ty < WORLD_HEIGHT) {
                wld[mid][ty] = BLOCKS.TORCH;
            }
        }
    }

    // ==========================================================
    // CHESTS — good loot spread across rooms
    // ==========================================================
    const chestRooms = [
        { room: roomA, table: "wasteland_bunker" },
        { room: roomB, table: "wasteland_bunker" },
        { room: roomC, table: "wasteland_bunker" },
        { room: roomD, table: "wasteland_bunker" },
        { room: roomE, table: "wasteland_bunker" },
        { room: roomF, table: "wasteland_bunker" },
        { room: roomG, table: "wasteland_bunker" },
        // Extra chests in main halls
        { room: hall,  table: "wasteland_bunker" },
        { room: hall2, table: "wasteland_bunker" },
    ];
    for (const { room, table } of chestRooms) {
        const cx = room.left + 2 + Math.floor(Math.random() * Math.max(1, room.right - room.left - 4));
        const cy = room.bottom - 1;
        if (cx > room.left && cx < room.right && cy >= 0 && cy < WORLD_HEIGHT) {
            wld[cx][cy] = BLOCKS.CHEST;
            initChestData(cx, cy, table);
        }
    }

    // ==========================================================
    // RAIDERS — spawn throughout the bunker (not on surface)
    // ==========================================================
    const raiderRooms = [hall, roomA, roomB, roomC, roomD, hall2, roomE, roomF, roomG];
    for (const room of raiderRooms) {
        // 1-3 raiders per room depending on room width
        const rw = room.right - room.left;
        const count = rw > 15 ? 2 + Math.floor(Math.random() * 2) : 1 + Math.floor(Math.random() * 2);
        for (let i = 0; i < count; i++) {
            const rx = room.left + 2 + Math.floor(Math.random() * Math.max(1, rw - 4));
            const ry = room.bottom - 2;
            if (rx > room.left && rx < room.right && ry >= 0 && ry < WORLD_HEIGHT) {
                const mob = createMob("raider", rx * BLOCK_SIZE, ry * BLOCK_SIZE);
                state.mobs.push(mob);
            }
        }
    }

    // ==========================================================
    // RADIATION-SAFE REGION — covers camp + all underground
    // ==========================================================
    const regionX1 = Math.max(0, Math.min(roomE.left, roomA.left, campLeft) - 1);
    const regionY1 = Math.max(0, surfaceY - 3);
    const regionX2 = Math.min(WORLD_WIDTH - 1, Math.max(roomF.right, roomB.right, campLeft + campW) + 1);
    const regionY2 = Math.min(WORLD_HEIGHT - 1, roomG.bottom + 1);
    state.bunkerRegions.push({ x1: regionX1, y1: regionY1, x2: regionX2, y2: regionY2 });

    state.structureLocations.push({ x: x * BLOCK_SIZE, y: surfaceY * BLOCK_SIZE, type: "bunker" });
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

    // Bunkers with camps — moderately common, spaced 150+ blocks apart
    let lastBunker = -999;
    for (let x = 40; x < WORLD_WIDTH - 70; x++) {
        if (x - lastBunker < 150) continue;
        // ~6% chance per eligible column
        if (Math.random() > 0.06) continue;
        let surfY = -1;
        for (let y = 0; y < WORLD_HEIGHT; y++) {
            if (state.wastelandWorld[x][y] !== BLOCKS.AIR) { surfY = y; break; }
        }
        if (surfY <= 0 || surfY > WORLD_HEIGHT - 35) continue;
        // Don't overlap with other structures
        let tooClose = false;
        for (const sl of state.structureLocations) {
            if (Math.abs(x - sl.x / BLOCK_SIZE) < 60) { tooClose = true; break; }
        }
        if (tooClose) continue;
        generateWastelandBunker(x, surfY);
        lastBunker = x;
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
