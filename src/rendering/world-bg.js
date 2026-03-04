// ============================================================
// RENDERING/WORLD-BG.JS - Sky and background tree rendering
// ============================================================

import { state } from '../state.js';
import { BLOCKS, BLOCK_SIZE, WORLD_WIDTH, WORLD_HEIGHT } from '../constants.js';
import { drawBlock } from './blocks.js';

// --- BACKGROUND TREES (parallax layer) ---
export function drawBackgroundTrees() {
    if (!state.activeBgWorld) return;
    const camX = state.camera.x + state.screenShake.x;
    const camY = state.camera.y + state.screenShake.y;

    const sc = Math.max(0, Math.floor(camX / BLOCK_SIZE) - 1);
    const ec = Math.min(WORLD_WIDTH, Math.ceil((camX + state.canvas.width) / BLOCK_SIZE) + 1);
    const sr = Math.max(0, Math.floor(camY / BLOCK_SIZE) - 1);
    const er = Math.min(WORLD_HEIGHT, Math.ceil((camY + state.canvas.height) / BLOCK_SIZE) + 1);

    state.ctx.save();
    state.ctx.globalAlpha = 0.9;

    for (let x = sc; x < ec; x++) {
        if (!state.activeBgWorld[x]) continue;
        for (let y = sr; y < er; y++) {
            const b = state.activeBgWorld[x][y];
            if (b !== BLOCKS.AIR) {
                drawBlock(b, x * BLOCK_SIZE - camX, y * BLOCK_SIZE - camY);
            }
        }
    }

    state.ctx.restore();
}

// --- SKY ---
export function drawSky(dayBrightness) {
    if (state.inNether) {
        state.ctx.fillStyle = "#1a0505";
        state.ctx.fillRect(0, 0, state.canvas.width, state.canvas.height);
        state.ctx.fillStyle = "rgba(80, 10, 5, 0.3)";
        state.ctx.fillRect(0, 0, state.canvas.width, state.canvas.height * 0.3);
        return;
    }
    if (state.inPossum) {
        // Soft pastel pink-to-lilac gradient sky
        const w = state.canvas.width, h = state.canvas.height;
        const grad = state.ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, "#f7c8e8");
        grad.addColorStop(0.5, "#ffe8f5");
        grad.addColorStop(1, "#d4f5c0");
        state.ctx.fillStyle = grad;
        state.ctx.fillRect(0, 0, w, h);
        // Cheerful sun with sparkle
        const t = performance.now() * 0.001;
        const sunX = w * 0.75, sunY = h * 0.18;
        state.ctx.fillStyle = "rgba(255, 220, 80, 0.95)";
        state.ctx.beginPath(); state.ctx.arc(sunX, sunY, 28, 0, Math.PI * 2); state.ctx.fill();
        state.ctx.fillStyle = "rgba(255, 240, 160, 0.5)";
        state.ctx.beginPath(); state.ctx.arc(sunX, sunY, 42, 0, Math.PI * 2); state.ctx.fill();
        // Sparkle rays
        state.ctx.strokeStyle = "rgba(255, 230, 100, 0.6)";
        state.ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 + t * 0.3;
            const r1 = 48, r2 = 60 + Math.sin(t * 2 + i) * 6;
            state.ctx.beginPath();
            state.ctx.moveTo(sunX + Math.cos(angle) * r1, sunY + Math.sin(angle) * r1);
            state.ctx.lineTo(sunX + Math.cos(angle) * r2, sunY + Math.sin(angle) * r2);
            state.ctx.stroke();
        }
        // A few fluffy white clouds
        state.ctx.fillStyle = "rgba(255,255,255,0.85)";
        const clouds = [[w*0.1, h*0.1, 60, 22], [w*0.4, h*0.07, 80, 26], [w*0.6, h*0.13, 55, 20]];
        for (const [cx, cy, cw, ch] of clouds) {
            state.ctx.beginPath(); state.ctx.ellipse(cx, cy, cw, ch, 0, 0, Math.PI * 2); state.ctx.fill();
            state.ctx.beginPath(); state.ctx.ellipse(cx - cw * 0.35, cy + 5, cw * 0.6, ch * 0.7, 0, 0, Math.PI * 2); state.ctx.fill();
            state.ctx.beginPath(); state.ctx.ellipse(cx + cw * 0.35, cy + 4, cw * 0.55, ch * 0.65, 0, 0, Math.PI * 2); state.ctx.fill();
        }
        return;
    }
    if (state.inWasteland) {
        // Dark orange-brown dusty haze
        state.ctx.fillStyle = "#1e1005";
        state.ctx.fillRect(0, 0, state.canvas.width, state.canvas.height);
        // Toxic dust cloud at top
        state.ctx.fillStyle = "rgba(160, 90, 10, 0.25)";
        state.ctx.fillRect(0, 0, state.canvas.width, state.canvas.height * 0.45);
        // Dim orange glow at horizon
        state.ctx.fillStyle = "rgba(200, 110, 20, 0.12)";
        state.ctx.fillRect(0, state.canvas.height * 0.35, state.canvas.width, state.canvas.height * 0.2);
        // Faint green tint near ground (toxic atmosphere)
        state.ctx.fillStyle = "rgba(20, 60, 0, 0.08)";
        state.ctx.fillRect(0, state.canvas.height * 0.55, state.canvas.width, state.canvas.height * 0.45);
        return;
    }
    const r = Math.floor(10 + 125 * dayBrightness);
    const g = Math.floor(10 + 196 * dayBrightness);
    const b = Math.floor(40 + 195 * dayBrightness);
    state.ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    state.ctx.fillRect(0, 0, state.canvas.width, state.canvas.height);

    const cx = state.canvas.width * 0.5 + Math.cos(state.timeOfDay * Math.PI * 2 - Math.PI / 2) * 350;
    const cy = state.canvas.height * 0.3 - Math.sin(state.timeOfDay * Math.PI * 2 - Math.PI / 2) * 200;

    if (dayBrightness > 0.3) {
        state.ctx.fillStyle = `rgba(255, 255, 100, ${dayBrightness})`;
        state.ctx.beginPath(); state.ctx.arc(cx, cy, 30, 0, Math.PI * 2); state.ctx.fill();
        state.ctx.fillStyle = `rgba(255, 255, 100, ${dayBrightness * 0.2})`;
        state.ctx.beginPath(); state.ctx.arc(cx, cy, 50, 0, Math.PI * 2); state.ctx.fill();
    } else {
        state.ctx.fillStyle = `rgba(220, 220, 240, ${1 - dayBrightness})`;
        state.ctx.beginPath(); state.ctx.arc(cx, cy, 25, 0, Math.PI * 2); state.ctx.fill();
    }
    if (dayBrightness < 0.5) {
        const a = (0.5 - dayBrightness) * 1.6;
        state.ctx.fillStyle = `rgba(255, 255, 255, ${a})`;
        for (let i = 0; i < 50; i++) {
            state.ctx.fillRect((i * 137.5 + 50) % state.canvas.width, (i * 97.3 + 20) % (state.canvas.height * 0.5), 2, 2);
        }
    }
}
