// ============================================================
// TERRAIN.JS - Tree and vegetation generators
// ============================================================
// generateOakTree, generateCactus, generateAcacia, generateSpruce
// Each takes (x, surfaceY, targetWorldArray) and places blocks.
// ============================================================

import { state } from '../state.js';
import { BLOCKS, WORLD_WIDTH } from '../constants.js';

export function generateOakTree(x, surfaceY, target) {
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

export function generateCactus(x, surfaceY, target) {
    const w = target || state.world;
    const h = 2 + Math.floor(Math.random() * 3); // 2-4 tall
    for (let i = 1; i <= h; i++) {
        if (surfaceY - i >= 0) w[x][surfaceY - i] = BLOCKS.CACTUS;
    }
}

export function generateAcacia(x, surfaceY, target) {
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

export function generateSpruce(x, surfaceY, target) {
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
