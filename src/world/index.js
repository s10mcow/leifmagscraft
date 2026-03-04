// ============================================================
// WORLD/INDEX.JS - Public API re-exports
// ============================================================
// Re-exports everything that was exported from the original
// src/world.js so all existing import paths continue to work.
// ============================================================

// Runtime world management
export { switchDimension, initChestData, removeChestData, isBlockSolid, findSurfaceY } from './chunks.js';

// Main world generation
export { generateWorld } from './generation.js';

// Nether world generation
export { generateNetherWorld } from './nether.js';

// Wasteland world generation
export { generateWastelandWorld } from './wasteland.js';

// Possum Realm world generation
export { generatePossumWorld } from './possum.js';

// Underground lava-water interaction (runtime)
export { checkLavaWaterInteraction } from './caves.js';
