// ============================================================
// FRAME-RENDERER.JS - Rendering coordinator
// ============================================================
// The drawGameFrame() function orchestrates all rendering calls.
// This file contains no game logic — only decides what gets
// drawn and in what order for each frame.
// ============================================================

import { state } from '../state.js';
import { BLOCKS, BLOCK_SIZE, WORLD_WIDTH, WORLD_HEIGHT, TORCH_LIGHT_RADIUS, ITEMS } from '../constants.js';
import { drawSky, drawBackgroundTrees, drawBlock, drawAllMobs, drawProjectiles, drawParticles, drawPlayer } from '../rendering.js';
import { drawFloatingTexts, drawHotbar, drawHealthBar, drawBlockHighlight, drawMiningProgress, drawCraftingMenu, drawChestMenu, drawBlastFurnaceMenu, drawFurnaceMenu, drawSmokerMenu, drawTradingMenu, drawDeathScreen, drawHUD, drawChat } from '../ui.js';

// SLEEP_DURATION must match the value in systems.js
const PLAYER_COLORS = ['#e07040','#40a0e0','#e040a0','#40e080','#e0c040','#a040e0','#40e0c0'];

function drawOtherPlayers() {
    const players = Object.values(state.otherPlayers);
    if (!players.length) return;
    const myDim = state.inNether ? 'nether' : state.inWasteland ? 'wasteland' : state.inPossum ? 'possum' : 'overworld';
    const camX = state.camera.x - state.screenShake.x;
    const camY = state.camera.y - state.screenShake.y;
    for (let pi = 0; pi < players.length; pi++) {
        const p = players[pi];
        if ((p.dim || 'overworld') !== myDim) continue; // hide players in other dimensions
        const sx = p.x - camX;
        const sy = p.y - camY;
        const col = PLAYER_COLORS[pi % PLAYER_COLORS.length];
        // Body
        state.ctx.fillStyle = col;
        state.ctx.fillRect(sx + 4, sy + 14, 16, 16);
        // Head
        state.ctx.fillStyle = "#c69c6d";
        state.ctx.fillRect(sx + 4, sy, 16, 14);
        // Eyes
        state.ctx.fillStyle = "#4a3728";
        if ((p.facing || 1) === 1) state.ctx.fillRect(sx + 15, sy + 4, 3, 4);
        else                        state.ctx.fillRect(sx + 6,  sy + 4, 3, 4);
        // Legs
        state.ctx.fillStyle = col;
        state.ctx.fillRect(sx + 4,  sy + 30, 7, 10);
        state.ctx.fillRect(sx + 13, sy + 30, 7, 10);
        // Name tag
        state.ctx.save();
        state.ctx.font = "bold 10px 'Courier New', monospace";
        state.ctx.textAlign = "center";
        state.ctx.fillStyle = "rgba(0,0,0,0.55)";
        state.ctx.fillRect(sx + 12 - state.ctx.measureText(p.name || 'Player').width / 2 - 2, sy - 16, state.ctx.measureText(p.name || 'Player').width + 4, 13);
        state.ctx.fillStyle = col;
        state.ctx.fillText(p.name || 'Player', sx + 12, sy - 5);
        state.ctx.restore();
    }
}
const SLEEP_DURATION = 2000;

export function drawGameFrame(timestamp) {
    const camX = state.camera.x - state.screenShake.x;
    const camY = state.camera.y - state.screenShake.y;

    // CSS filter on canvas — GPU composited, no render cost
    state.canvas.style.filter = state.glitchedActive ? "grayscale(100%)" :
                                 state.inPossum      ? "saturate(140%) brightness(1.08)" : "";

    // 1. Sky
    drawSky(state.cachedDayBrightness);

    // 1.5. Background trees (parallax layer, before foreground blocks)
    drawBackgroundTrees();

    // 2. Blocks (only visible ones)
    const sc = Math.max(0, Math.floor(camX / BLOCK_SIZE));
    const ec = Math.min(WORLD_WIDTH, Math.ceil((camX + state.canvas.width) / BLOCK_SIZE) + 1);
    const sr = Math.max(0, Math.floor(camY / BLOCK_SIZE));
    const er = Math.min(WORLD_HEIGHT, Math.ceil((camY + state.canvas.height) / BLOCK_SIZE) + 1);

    for (let x = sc; x < ec; x++) {
        for (let y = sr; y < er; y++) {
            if (state.activeWorld[x][y] !== BLOCKS.AIR) {
                drawBlock(state.activeWorld[x][y], x * BLOCK_SIZE - state.camera.x + state.screenShake.x, y * BLOCK_SIZE - state.camera.y + state.screenShake.y);
            }
        }
    }

    // 3. Night overlay with torch lighting
    if (state.cachedDayBrightness < 0.7) {
        const nightAlpha = (0.7 - state.cachedDayBrightness) * 0.7;
        state.ctx.fillStyle = state.inNether    ? `rgba(10,0,0,${nightAlpha})`    :
                              state.inWasteland ? `rgba(5,15,0,${nightAlpha})`    :
                              state.inVoid      ? `rgba(0,0,20,${nightAlpha})`    :
                                                  `rgba(0,0,20,${nightAlpha})`;
        state.ctx.fillRect(0, 0, state.canvas.width, state.canvas.height);

        if (nightAlpha > 0.05) {
            state.ctx.save();
            state.ctx.globalCompositeOperation = "lighter";
            const lightPx = TORCH_LIGHT_RADIUS * BLOCK_SIZE;
            for (let x = sc; x < ec; x++) {
                for (let y = sr; y < er; y++) {
                    const block = state.activeWorld[x][y];
                    let glowColor = null, glowRadius = lightPx, glowStrength = 1.0;
                    if (block === BLOCKS.TORCH) {
                        glowColor = [255, 200, 80];
                    } else if (block === BLOCKS.GLOWSTONE) {
                        glowColor = [255, 230, 120];
                        glowRadius = lightPx * 1.2;
                    } else if (block === BLOCKS.LAVA) {
                        glowColor = [255, 100, 20];
                        glowRadius = lightPx * 0.7;
                        glowStrength = 0.6;
                    } else if (block === BLOCKS.TOXIC_PUDDLE) {
                        glowColor = [40, 200, 60];
                        glowRadius = lightPx * 0.6;
                        glowStrength = 0.5;
                    }
                    if (glowColor) {
                        const tx = x * BLOCK_SIZE - state.camera.x + state.screenShake.x + BLOCK_SIZE / 2;
                        const ty = y * BLOCK_SIZE - state.camera.y + state.screenShake.y + BLOCK_SIZE / 2;
                        const flicker = 1.0 + Math.sin(timestamp * 0.008 + x * 7 + y * 13) * 0.06;
                        const radius = glowRadius * flicker;
                        const glow = state.ctx.createRadialGradient(tx, ty, 0, tx, ty, radius);
                        const strength = Math.min(nightAlpha * 0.45 * glowStrength, 0.22);
                        glow.addColorStop(0, `rgba(${glowColor[0]},${glowColor[1]},${glowColor[2]},${strength})`);
                        glow.addColorStop(0.5, `rgba(${glowColor[0]},${glowColor[1]},${glowColor[2]},${strength * 0.4})`);
                        glow.addColorStop(1, `rgba(${glowColor[0]},${glowColor[1]},${glowColor[2]},0)`);
                        state.ctx.fillStyle = glow;
                        state.ctx.beginPath();
                        state.ctx.arc(tx, ty, radius, 0, Math.PI * 2);
                        state.ctx.fill();
                    }
                }
            }
            state.ctx.globalCompositeOperation = "source-over";
            state.ctx.restore();
        }
    }

    // 4. Block highlight
    drawBlockHighlight();

    // 5. Mining progress
    drawMiningProgress();

    // 6. Mobs
    drawAllMobs();

    // 7. Projectiles
    drawProjectiles();

    // 8. Particles
    drawParticles();

    // 9. Other players (multiplayer)
    drawOtherPlayers();

    // 9.5. Local player
    drawPlayer();

    // 10. Floating texts
    drawFloatingTexts();

    // 11. UI
    drawHotbar();
    drawHealthBar();
    drawHUD();

    // 12. Crafting overlay
    drawCraftingMenu();

    // 12.5. Chest overlay
    drawChestMenu();

    // 12.55. Blast furnace overlay
    drawBlastFurnaceMenu();

    // 12.57. Furnace overlay
    drawFurnaceMenu();

    // 12.58. Smoker overlay
    drawSmokerMenu();

    // 12.6. Trading overlay
    drawTradingMenu();

    // 13. Death screen
    drawDeathScreen();

    // 13.1. Chat overlay
    drawChat();


    // 13.5. Radiation overlay (wasteland without full hazmat)
    if (state.inWasteland) {
        const armor = state.inventory.armor;
        const fullHazmat =
            armor.helmet.itemId    === ITEMS.HAZMAT_HELMET &&
            armor.chestplate.itemId === ITEMS.HAZMAT_CHESTPLATE &&
            armor.leggings.itemId   === ITEMS.HAZMAT_LEGGINGS &&
            armor.boots.itemId      === ITEMS.HAZMAT_BOOTS;
        if (!fullHazmat) {
            const pulse = 0.06 + Math.sin(timestamp * 0.003) * 0.04;
            const w = state.canvas.width, h = state.canvas.height;
            const grad = state.ctx.createRadialGradient(w / 2, h / 2, h * 0.25, w / 2, h / 2, h * 0.75);
            grad.addColorStop(0, `rgba(0,200,0,0)`);
            grad.addColorStop(1, `rgba(0,200,0,${pulse})`);
            state.ctx.fillStyle = grad;
            state.ctx.fillRect(0, 0, w, h);
        }
    }

    // 14. Sleep overlay
    if (state.sleeping) {
        const progress = state.sleepTimer / SLEEP_DURATION;
        const alpha = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
        state.ctx.fillStyle = `rgba(0, 0, 20, ${Math.min(alpha, 0.95)})`;
        state.ctx.fillRect(0, 0, state.canvas.width, state.canvas.height);
        state.ctx.fillStyle = "#ffffff"; state.ctx.font = "bold 28px 'Courier New', monospace"; state.ctx.textAlign = "center";
        state.ctx.fillText("Sleeping...", state.canvas.width / 2, state.canvas.height / 2);
        const dots = ".".repeat(Math.floor((state.sleepTimer / 400) % 4));
        state.ctx.fillStyle = "#9ca3af"; state.ctx.font = "16px 'Courier New', monospace";
        state.ctx.fillText(`Zzz${dots}`, state.canvas.width / 2, state.canvas.height / 2 + 35);
    }
}
