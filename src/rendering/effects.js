// ============================================================
// RENDERING/EFFECTS.JS - Projectiles and particles
// ============================================================

import { state } from '../state.js';

// --- PROJECTILES ---
export function drawProjectiles() {
    for (const p of state.projectiles) {
        const sx = p.x - state.camera.x + state.screenShake.x;
        const sy = p.y - state.camera.y + state.screenShake.y;
        if (p.isFlame) {
            // Flickering flame blob
            const flicker = Math.random();
            state.ctx.fillStyle = flicker > 0.5 ? "#ff4400" : "#ff6600";
            state.ctx.fillRect(sx - 4, sy - 4, 8, 8);
            state.ctx.fillStyle = flicker > 0.5 ? "#ffaa00" : "#ffcc00";
            state.ctx.fillRect(sx - 2, sy - 2, 4, 4);
            state.ctx.fillStyle = "rgba(255, 80, 0, 0.25)";
            state.ctx.fillRect(sx - 7, sy - 7, 14, 14);
        } else if (p.isLaser) {
            // Bright green nuclear laser beam
            state.ctx.save();
            state.ctx.translate(sx, sy);
            state.ctx.rotate(Math.atan2(p.velY, p.velX));
            // Outer glow
            state.ctx.fillStyle = "rgba(0, 255, 100, 0.2)";
            state.ctx.fillRect(-10, -5, 20, 10);
            // Core beam
            state.ctx.fillStyle = "#00ff66";
            state.ctx.fillRect(-8, -2, 16, 4);
            // Bright center
            state.ctx.fillStyle = "#aaffcc";
            state.ctx.fillRect(-6, -1, 12, 2);
            state.ctx.restore();
        } else if (p.isFireball) {
            // Glowing orange fireball
            state.ctx.fillStyle = "#ff2200";
            state.ctx.fillRect(sx - 7, sy - 7, 14, 14);
            state.ctx.fillStyle = "#ff6600";
            state.ctx.fillRect(sx - 5, sy - 5, 10, 10);
            state.ctx.fillStyle = "#ffcc00";
            state.ctx.fillRect(sx - 3, sy - 3, 6, 6);
            state.ctx.fillStyle = "rgba(255, 80, 0, 0.3)";
            state.ctx.fillRect(sx - 10, sy - 10, 20, 20);
        } else if (p.isRocket) {
            // Rocket projectile
            state.ctx.save();
            state.ctx.translate(sx, sy);
            state.ctx.rotate(Math.atan2(p.velY, p.velX));
            // Body (red)
            state.ctx.fillStyle = "#cc3333";
            state.ctx.fillRect(-6, -3, 12, 6);
            // Nose (gray)
            state.ctx.fillStyle = "#aaa";
            state.ctx.beginPath();
            state.ctx.moveTo(8, 0);
            state.ctx.lineTo(6, -3);
            state.ctx.lineTo(6, 3);
            state.ctx.closePath();
            state.ctx.fill();
            // Fins
            state.ctx.fillStyle = "#cc3333";
            state.ctx.fillRect(-6, -5, 4, 2);
            state.ctx.fillRect(-6, 3, 4, 2);
            // Flame trail
            state.ctx.fillStyle = "#ff8800";
            state.ctx.fillRect(-10, -2, 4, 4);
            state.ctx.fillStyle = "#ffcc00";
            state.ctx.fillRect(-8, -1, 2, 2);
            state.ctx.restore();
        } else if (p.isBullet) {
            // Small fast bullet
            state.ctx.fillStyle = "#ffcc44";
            state.ctx.save();
            state.ctx.translate(sx, sy);
            state.ctx.rotate(Math.atan2(p.velY, p.velX));
            state.ctx.fillRect(-3, -1, 6, 2);
            state.ctx.restore();
            // Muzzle trail
            state.ctx.fillStyle = "rgba(255, 200, 50, 0.3)";
            state.ctx.fillRect(sx - 6, sy - 1, 4, 2);
        } else {
            // Arrow
            state.ctx.fillStyle = "#8b6c42";
            state.ctx.save();
            state.ctx.translate(sx, sy);
            state.ctx.rotate(Math.atan2(p.velY, p.velX));
            state.ctx.fillRect(-8, -1, 16, 3);
            state.ctx.fillStyle = "#aaaaaa";
            state.ctx.fillRect(6, -2, 4, 5);
            state.ctx.fillStyle = "#ffffff";
            state.ctx.fillRect(-8, -3, 4, 2);
            state.ctx.fillRect(-8, 2, 4, 2);
            state.ctx.restore();
        }
    }
}

// --- PARTICLES ---
export function drawParticles() {
    for (const p of state.particles) {
        const sx = p.x - state.camera.x + state.screenShake.x;
        const sy = p.y - state.camera.y + state.screenShake.y;
        state.ctx.globalAlpha = p.life / 50;
        state.ctx.fillStyle = p.color;
        state.ctx.fillRect(sx - p.size / 2, sy - p.size / 2, p.size, p.size);
    }
    state.ctx.globalAlpha = 1;
}
