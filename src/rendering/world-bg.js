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
