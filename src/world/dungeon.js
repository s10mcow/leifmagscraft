// ============================================================
// DUNGEON.JS - Deep underground dungeon with Orium shrine
// ============================================================

import { state } from '../state.js';
import { BLOCKS, WORLD_WIDTH, WORLD_HEIGHT, SURFACE_LEVEL } from '../constants.js';

export function generateDungeon(seed) {
    // Place dungeon deep underground, directly below spawn point
    const dungeonY = Math.floor(WORLD_HEIGHT * 0.78);
    const spawnX = Math.floor(WORLD_WIDTH / 2);
    const dungeonX = spawnX - Math.floor(25 / 2); // center chamber under spawn

    // Main chamber: 25 wide x 15 tall
    const chamberW = 25;
    const chamberH = 15;
    const cx = dungeonX;
    const cy = dungeonY;

    // Carve main chamber
    for (let dx = 0; dx < chamberW; dx++) {
        for (let dy = 0; dy < chamberH; dy++) {
            const bx = cx + dx;
            const by = cy + dy;
            if (bx >= 0 && bx < WORLD_WIDTH && by >= 0 && by < WORLD_HEIGHT - 1) {
                if (dx === 0 || dx === chamberW - 1 || dy === 0 || dy === chamberH - 1) {
                    state.world[bx][by] = BLOCKS.NETHER_BRICK;
                } else {
                    state.world[bx][by] = BLOCKS.AIR;
                }
            }
        }
    }

    // Floor detail: obsidian checkerboard
    for (let dx = 1; dx < chamberW - 1; dx++) {
        const bx = cx + dx;
        const by = cy + chamberH - 1;
        if (bx >= 0 && bx < WORLD_WIDTH && by < WORLD_HEIGHT) {
            state.world[bx][by] = (dx % 2 === 0) ? BLOCKS.OBSIDIAN : BLOCKS.NETHER_BRICK;
        }
    }

    // Pillars inside chamber (4 pillars)
    const pillarOffsets = [5, 10, 15, 20];
    for (const px of pillarOffsets) {
        const bx = cx + px;
        if (bx >= 0 && bx < WORLD_WIDTH) {
            for (let dy = 2; dy < chamberH - 1; dy++) {
                const by = cy + dy;
                if (by >= 0 && by < WORLD_HEIGHT) {
                    state.world[bx][by] = BLOCKS.OBSIDIAN;
                }
            }
        }
    }

    // Place the Orium Shrine in the center of the chamber
    const shrineX = cx + Math.floor(chamberW / 2);
    const shrineY = cy + chamberH - 2; // on the floor
    if (shrineX >= 0 && shrineX < WORLD_WIDTH && shrineY >= 0 && shrineY < WORLD_HEIGHT) {
        state.world[shrineX][shrineY] = BLOCKS.ORIUM_SHRINE;
        // Clear the pillar at shrine position if it overlaps
        for (let dy = 2; dy < chamberH - 2; dy++) {
            const by = cy + dy;
            if (state.world[shrineX][by] === BLOCKS.OBSIDIAN) {
                state.world[shrineX][by] = BLOCKS.AIR;
            }
        }
    }

    // Entrance corridor going up from the chamber ceiling to make it accessible
    // Carve a winding tunnel from above the chamber up toward the cave layer
    let tunnelX = cx + Math.floor(chamberW / 2);
    let tunnelY = cy; // start at chamber ceiling
    const tunnelTargetY = SURFACE_LEVEL + 20; // tunnel up to near cave depth
    let angle = -Math.PI / 2; // mostly upward

    while (tunnelY > tunnelTargetY) {
        // Carve 2-wide tunnel
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const bx = Math.floor(tunnelX) + dx;
                const by = Math.floor(tunnelY) + dy;
                if (bx >= 1 && bx < WORLD_WIDTH - 1 && by > SURFACE_LEVEL + 3 && by < WORLD_HEIGHT - 1) {
                    if (state.world[bx][by] !== BLOCKS.AIR && state.world[bx][by] !== BLOCKS.ORIUM_SHRINE && state.world[bx][by] !== BLOCKS.NETHER_BRICK) {
                        state.world[bx][by] = BLOCKS.AIR;
                    }
                }
            }
        }

        // Wander upward
        angle += (Math.random() - 0.5) * 0.6;
        // Bias strongly upward
        if (angle > -Math.PI / 6) angle = -Math.PI / 6;
        if (angle < -5 * Math.PI / 6) angle = -5 * Math.PI / 6;

        tunnelX += Math.cos(angle) * 1.5;
        tunnelY += Math.sin(angle) * 1.5;

        // Keep in bounds
        if (tunnelX < 5) tunnelX = 5;
        if (tunnelX >= WORLD_WIDTH - 5) tunnelX = WORLD_WIDTH - 5;
    }

    // Add some torches in the dungeon for atmosphere
    const torchPositions = [3, 8, 13, 18, 22];
    for (const tx of torchPositions) {
        const bx = cx + tx;
        const by = cy + chamberH - 2;
        if (bx >= 0 && bx < WORLD_WIDTH && by >= 0 && by < WORLD_HEIGHT) {
            if (state.world[bx][by] === BLOCKS.AIR) {
                state.world[bx][by] = BLOCKS.TORCH;
            }
        }
    }

    // Store dungeon location for reference
    state.dungeonLocation = { x: shrineX, y: shrineY };
}
