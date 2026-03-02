// ============================================================
// RENDERING/INDEX.JS - Public API barrel file
// Re-exports everything that was exported from rendering.js
// so that all existing importers continue to work.
// ============================================================

export { drawBlock } from './blocks.js';
export { drawItemIcon } from './items.js';
export { drawBackgroundTrees, drawSky } from './world-bg.js';
export { drawPlayer, drawAllMobs } from './entities.js';
export { drawProjectiles, drawParticles } from './effects.js';
