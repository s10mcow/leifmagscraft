// ============================================================
// MOBS/EFFECTS.JS - Particles and explosions
// ============================================================

import { state } from '../state.js';
import { BLOCKS, BLOCK_SIZE, WORLD_WIDTH, WORLD_HEIGHT, MOB_DEFS } from '../constants.js';
import { hurtPlayer } from '../player.js';
import { addFloatingText } from '../inventory.js';
import { playExplosion } from '../audio.js';

// --- PARTICLES ---

export function createParticles(x, y, count, color, speed = 3) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const vel = Math.random() * speed;
        state.particles.push({
            x, y,
            velX: Math.cos(angle) * vel,
            velY: Math.sin(angle) * vel - 2,
            color,
            size: 2 + Math.random() * 4,
            life: 20 + Math.random() * 30
        });
    }
}

export function updateParticles(dt) {
    for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x += p.velX;
        p.y += p.velY;
        p.velY += 0.1;
        p.life--;
        if (p.life <= 0) state.particles.splice(i, 1);
    }
}

// --- EXPLOSIONS ---

export function fireballExplode(px, py, damage) {
    const cx = Math.floor(px / BLOCK_SIZE);
    const cy = Math.floor(py / BLOCK_SIZE);
    const radius = 1;
    for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
            if (dx * dx + dy * dy <= radius * radius) {
                const bx = cx + dx, by = cy + dy;
                if (bx >= 0 && bx < WORLD_WIDTH && by >= 0 && by < WORLD_HEIGHT) {
                    const block = state.activeWorld[bx][by];
                    if (block !== BLOCKS.BEDROCK && block !== BLOCKS.AIR && block !== BLOCKS.COBBLESTONE) {
                        state.activeWorld[bx][by] = BLOCKS.AIR;
                    }
                }
            }
        }
    }
    createParticles(px, py, 20, "#ff6600", 5);
    createParticles(px, py, 10, "#ffcc00", 4);
    playExplosion();
}

export function rocketExplode(px, py, damage) {
    const cx = Math.floor(px / BLOCK_SIZE);
    const cy = Math.floor(py / BLOCK_SIZE);
    const radius = 3; // Same as creeper

    // Destroy blocks
    for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
            if (dx * dx + dy * dy <= radius * radius) {
                const bx = cx + dx, by = cy + dy;
                if (bx >= 0 && bx < WORLD_WIDTH && by >= 0 && by < WORLD_HEIGHT) {
                    if (state.activeWorld[bx][by] !== BLOCKS.BEDROCK && state.activeWorld[bx][by] !== BLOCKS.AIR) {
                        state.activeWorld[bx][by] = BLOCKS.AIR;
                    }
                }
            }
        }
    }

    // Damage nearby mobs
    for (let i = state.mobs.length - 1; i >= 0; i--) {
        const mob = state.mobs[i];
        const def = MOB_DEFS[mob.type];
        const mcx = mob.x + def.width / 2;
        const mcy = mob.y + def.height / 2;
        const dist = Math.sqrt((px - mcx) * (px - mcx) + (py - mcy) * (py - mcy));
        if (dist < (radius + 2) * BLOCK_SIZE) {
            const dmg = Math.floor(damage * (1 - dist / ((radius + 2) * BLOCK_SIZE)));
            if (dmg > 0) {
                mob.health -= dmg;
                mob.hurtTimer = 300;
                mob.aggroed = true;
                const kb = px < mcx ? 5 : -5;
                mob.velX = kb;
                mob.velY = -4;
                addFloatingText(mob.x + def.width / 2, mob.y - 10, `-${dmg}`, "#ff4444");
            }
        }
    }

    // Damage player if nearby
    const pcx = state.player.x + state.player.width / 2;
    const pcy = state.player.y + state.player.height / 2;
    const playerDist = Math.sqrt((px - pcx) * (px - pcx) + (py - pcy) * (py - pcy));
    if (playerDist < (radius + 2) * BLOCK_SIZE) {
        const dmg = Math.floor(damage * (1 - playerDist / ((radius + 2) * BLOCK_SIZE)));
        if (dmg > 0) hurtPlayer(dmg, px);
    }

    // Effects
    createParticles(px, py, 40, "#ff8800", 8);
    createParticles(px, py, 20, "#ffff00", 6);
    state.screenShake.intensity = 15;
    playExplosion();
    addFloatingText(px, py - 20, "BOOM!", "#ff4444");
}

export function creeperExplode(mob) {
    const def = MOB_DEFS.creeper;
    const cx = Math.floor((mob.x + def.width / 2) / BLOCK_SIZE);
    const cy = Math.floor((mob.y + def.height / 2) / BLOCK_SIZE);
    const radius = def.explosionRadius;

    for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
            if (dx * dx + dy * dy <= radius * radius) {
                const bx = cx + dx, by = cy + dy;
                if (bx >= 0 && bx < WORLD_WIDTH && by >= 0 && by < WORLD_HEIGHT) {
                    if (state.activeWorld[bx][by] !== BLOCKS.BEDROCK && state.activeWorld[bx][by] !== BLOCKS.AIR) {
                        state.activeWorld[bx][by] = BLOCKS.AIR;
                    }
                }
            }
        }
    }

    const distX = state.player.x + state.player.width / 2 - (mob.x + def.width / 2);
    const distY = state.player.y + state.player.height / 2 - (mob.y + def.height / 2);
    const dist = Math.sqrt(distX * distX + distY * distY);
    if (dist < (radius + 2) * BLOCK_SIZE) {
        const dmg = Math.floor(def.damage * (1 - dist / ((radius + 2) * BLOCK_SIZE)));
        if (dmg > 0) hurtPlayer(dmg, mob.x);
    }

    createParticles(mob.x + def.width / 2, mob.y + def.height / 2, 40, "#ff8800", 8);
    createParticles(mob.x + def.width / 2, mob.y + def.height / 2, 20, "#ffff00", 6);
    state.screenShake.intensity = 15;
    playExplosion();
    addFloatingText(mob.x + def.width / 2, mob.y - 20, "BOOM!", "#ff4444");
}
