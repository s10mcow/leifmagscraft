// ============================================================
// MOBS/PROJECTILES.JS - Projectile creation and updates
// ============================================================

import { state } from '../state.js';
import { BLOCKS, BLOCK_SIZE, MOB_DEFS } from '../constants.js';
import { isBlockSolid } from '../world.js';
import { hurtPlayer } from '../player.js';
import { addFloatingText } from '../inventory.js';
import { playArrowShoot } from '../audio.js';
import { createParticles, fireballExplode, rocketExplode } from './effects.js';

// --- PROJECTILE CREATION ---

export function createArrow(x, y, targetX, targetY, damage) {
    playArrowShoot();
    const dx = targetX - x;
    const dy = targetY - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const speed = 7;
    // Compensate upward for gravity so the arrow actually reaches the target at any range.
    // Flight time: t = dist / speed.  Gravity applied per frame: 0.15.
    // Required velY: dy/t - 0.5 * 0.15 * t  =  (dy*speed/dist) - 0.075*(dist/speed)
    const t = dist / speed;
    const velY = (dy / dist) * speed - 0.075 * t + (Math.random() - 0.5) * 1.2;
    state.projectiles.push({
        x, y,
        velX: (dx / dist) * speed,
        velY,
        damage,
        life: 220
    });
}

export function createBullet(x, y, targetX, targetY, damage, fromMob = false) {
    const dx = targetX - x;
    const dy = targetY - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const speed = 14;
    state.projectiles.push({
        x, y,
        velX: (dx / dist) * speed,
        velY: (dy / dist) * speed,
        damage,
        life: 60,
        isBullet: true,
        fromMob
    });
}

export function createRocket(x, y, targetX, targetY, damage) {
    const dx = targetX - x;
    const dy = targetY - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const speed = 8;
    state.projectiles.push({
        x, y,
        velX: (dx / dist) * speed,
        velY: (dy / dist) * speed,
        damage,
        life: 120,
        isRocket: true
    });
}

export function createFlame(x, y, targetX, targetY, damage) {
    const dx = targetX - x, dy = targetY - y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const speed = 10;
    // Slight random spread for the flame cone effect
    const spread = (Math.random() - 0.5) * 2.5;
    state.projectiles.push({
        x, y,
        velX: (dx / dist) * speed + spread,
        velY: (dy / dist) * speed + spread,
        damage, life: 22, isFlame: true
    });
}

export function createToothRope(x, y, targetX, targetY, damage) {
    const dx = targetX - x, dy = targetY - y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const speed = 10;
    const t = dist / speed;
    state.projectiles.push({
        x, y,
        velX: (dx / dist) * speed,
        velY: (dy / dist) * speed - 0.075 * t,
        damage, life: 180, isToothRope: true
    });
}

export function createFireball(x, y, targetX, targetY, damage) {
    const dx = targetX - x, dy = targetY - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const speed = 5;
    state.projectiles.push({
        x, y,
        velX: (dx / dist) * speed,
        velY: (dy / dist) * speed,
        damage, life: 180, isFireball: true
    });
}

// --- PROJECTILE UPDATE ---

export function updateProjectiles(dt) {
    for (let i = state.projectiles.length - 1; i >= 0; i--) {
        const p = state.projectiles[i];
        if (!p.isBullet && !p.isRocket && !p.isFireball && !p.isFlame && !p.isToothRope) p.velY += 0.15; // Gravity for arrows only
        if (p.isToothRope) p.velY += 0.12; // Arc gravity for tooth rope
        if (p.isRocket) p.velY += 0.05; // Slight gravity for rockets
        p.x += p.velX;
        p.y += p.velY;
        p.life--;

        if (p.isFlame) {
            // Hit mob
            for (let j = state.mobs.length - 1; j >= 0; j--) {
                const mob = state.mobs[j];
                const def = MOB_DEFS[mob.type];
                if (mob.dead) continue;
                if (p.x >= mob.x && p.x <= mob.x + def.width &&
                    p.y >= mob.y && p.y <= mob.y + def.height) {
                    const armorReduction = (mob.equipment && mob.equipment.armor) ? 1 : 0;
                    const dmg = Math.max(1, p.damage - armorReduction);
                    mob.health -= dmg;
                    mob.hurtTimer = 200;
                    mob.aggroed = true;
                    mob.onFire = 3000;
                    mob.fireDamageCooldown = 0;
                    createParticles(p.x, p.y, 5, "#ff6600", 3);
                    state.projectiles.splice(i, 1);
                    break;
                }
            }
            if (!state.projectiles[i] || state.projectiles[i] !== p) continue;
            // Hit block
            const fbx = Math.floor(p.x / BLOCK_SIZE);
            const fby = Math.floor(p.y / BLOCK_SIZE);
            if (isBlockSolid(fbx, fby)) {
                createParticles(p.x, p.y, 3, "#ff8800", 2);
                state.projectiles.splice(i, 1);
                continue;
            }
            if (p.life <= 0) { state.projectiles.splice(i, 1); continue; }
        } else if (p.isFireball) {
            // Fireballs: stopped harmlessly by cobblestone; explode on other blocks; burn player on hit
            const bx = Math.floor(p.x / BLOCK_SIZE);
            const by = Math.floor(p.y / BLOCK_SIZE);
            if (isBlockSolid(bx, by)) {
                if (state.activeWorld[bx] && state.activeWorld[bx][by] === BLOCKS.COBBLESTONE) {
                    // Absorbed by cobblestone — no explosion, no damage
                    createParticles(p.x, p.y, 5, "#ff6600", 2);
                } else {
                    fireballExplode(p.x, p.y, p.damage);
                }
                state.projectiles.splice(i, 1);
                continue;
            }
            // Hit player
            if (p.x >= state.player.x && p.x <= state.player.x + state.player.width &&
                p.y >= state.player.y && p.y <= state.player.y + state.player.height) {
                hurtPlayer(p.damage, p.x);
                state.player.burnTimer = 3000;
                createParticles(p.x, p.y, 10, "#ff6600", 4);
                state.projectiles.splice(i, 1);
                continue;
            }
            if (p.life <= 0) {
                state.projectiles.splice(i, 1);
                continue;
            }
        } else if (p.isRocket) {
            // Rockets explode on hitting a mob, block, or at end of life
            let hit = false;

            // Check mob collision
            for (let j = state.mobs.length - 1; j >= 0; j--) {
                const mob = state.mobs[j];
                const def = MOB_DEFS[mob.type];
                if (p.x >= mob.x && p.x <= mob.x + def.width &&
                    p.y >= mob.y && p.y <= mob.y + def.height) {
                    hit = true;
                    break;
                }
            }

            // Check block collision
            const bx = Math.floor(p.x / BLOCK_SIZE);
            const by = Math.floor(p.y / BLOCK_SIZE);
            if (isBlockSolid(bx, by)) hit = true;

            if (hit || p.life <= 0) {
                rocketExplode(p.x, p.y, p.damage);
                state.projectiles.splice(i, 1);
                continue;
            }
        } else if (p.isBullet) {
            // Bullets hit mobs (fired by player)
            let hitMob = false;
            for (let j = state.mobs.length - 1; j >= 0; j--) {
                const mob = state.mobs[j];
                const def = MOB_DEFS[mob.type];
                if (p.x >= mob.x && p.x <= mob.x + def.width &&
                    p.y >= mob.y && p.y <= mob.y + def.height) {
                    const armorReduction = (mob.equipment && mob.equipment.armor) ? 2 : 0;
                    const dmg = Math.max(1, p.damage - armorReduction);
                    mob.health -= dmg;
                    mob.hurtTimer = 300;
                    mob.aggroed = true;
                    const kb = p.velX > 0 ? 4 : -4;
                    mob.velX = kb;
                    mob.velY = -3;
                    createParticles(p.x, p.y, 5, "#ffaa00");
                    addFloatingText(mob.x + def.width / 2, mob.y - 10, `-${dmg}`, "#ff4444");
                    hitMob = true;
                    break;
                }
            }
            if (hitMob) { state.projectiles.splice(i, 1); continue; }
            // Mob-fired bullets hit the player
            if (p.fromMob) {
                if (p.x >= state.player.x && p.x <= state.player.x + state.player.width &&
                    p.y >= state.player.y && p.y <= state.player.y + state.player.height) {
                    hurtPlayer(p.damage, p.x, "bullet");
                    createParticles(p.x, p.y, 3, "#ffaa00");
                    state.projectiles.splice(i, 1);
                    continue;
                }
            }
        } else {
            // Arrows hit player
            if (p.x >= state.player.x && p.x <= state.player.x + state.player.width &&
                p.y >= state.player.y && p.y <= state.player.y + state.player.height) {
                hurtPlayer(p.damage, p.x);
                createParticles(p.x, p.y, 3, "#8b6c42");
                state.projectiles.splice(i, 1);
                continue;
            }
        }

        // Tooth rope hits
        if (p.isToothRope) {
            let hitSomething = false;
            for (let j = state.mobs.length - 1; j >= 0; j--) {
                const mob = state.mobs[j];
                const def = MOB_DEFS[mob.type];
                if (mob.dead) continue;
                if (p.x >= mob.x && p.x <= mob.x + def.width &&
                    p.y >= mob.y && p.y <= mob.y + def.height) {
                    mob.health -= p.damage;
                    mob.hurtTimer = 400;
                    mob.aggroed = true;
                    mob.velX = (p.velX > 0 ? 6 : -6);
                    mob.velY = -5;
                    createParticles(p.x, p.y, 12, "#c4a040", 6);
                    createParticles(p.x, p.y, 6, "#ffffff", 3);
                    addFloatingText(mob.x + def.width / 2, mob.y - 16, `-${p.damage}`, "#c4a040");
                    hitSomething = true;
                    break;
                }
            }
            if (hitSomething) { state.projectiles.splice(i, 1); continue; }
            const trx = Math.floor(p.x / BLOCK_SIZE);
            const try_ = Math.floor(p.y / BLOCK_SIZE);
            if (isBlockSolid(trx, try_)) {
                createParticles(p.x, p.y, 5, "#c4a040", 3);
                state.projectiles.splice(i, 1);
                continue;
            }
            if (p.life <= 0) { state.projectiles.splice(i, 1); continue; }
            continue;
        }

        const bx = Math.floor(p.x / BLOCK_SIZE);
        const by = Math.floor(p.y / BLOCK_SIZE);
        if (isBlockSolid(bx, by)) {
            createParticles(p.x, p.y, 3, p.isBullet ? "#ffaa00" : "#8b6c42");
            state.projectiles.splice(i, 1);
            continue;
        }

        if (p.life <= 0) { state.projectiles.splice(i, 1); continue; }
    }
}
