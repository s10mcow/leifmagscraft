// ============================================================
// MOBS/INDEX.JS - Re-exports all public mobs API
// ============================================================
// This file serves as the public interface for the mobs module,
// replacing the original src/mobs.js for all importing files.
// ============================================================

export { createMob } from './entities.js';

export { createParticles, updateParticles, fireballExplode, rocketExplode, creeperExplode } from './effects.js';

export { createArrow, createBullet, createRocket, createFlame, createFireball, createToothRope, updateProjectiles } from './projectiles.js';

export { updateMobs } from './ai.js';

export { spawnMobs, spawnVillagers } from './spawning.js';
