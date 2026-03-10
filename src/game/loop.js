// ============================================================
// LOOP.JS - Main game loop
// ============================================================
// The gameLoop() requestAnimationFrame callback.
// Orchestrates all per-frame updates and delegates rendering
// to frame-renderer.js.
// ============================================================

import { state } from '../state.js';
import { BLOCK_SIZE, ITEMS } from '../constants.js';
import { updatePlayer, updateCamera, updatePlateTimers, hurtPlayer } from '../player.js';
import { updateMobs, updateProjectiles, updateParticles, spawnMobs } from '../mobs.js';
import { addFloatingText } from '../inventory.js';
import { updateMusic } from '../audio.js';
import { drawTitleScreen, drawPauseMenu, drawGeneratingScreen, drawLoadingScreen, drawSavingScreen, drawModeSelectScreen, drawAccountCreateScreen, drawAccountLoginScreen, drawAuthCheckingScreen } from '../ui.js';
import { updateMining, handleGunFire } from './input-handlers.js';
import { updateSleep, updateLeafDecay, updateFurnaces, updateSmokers } from './systems.js';
import { drawGameFrame } from './frame-renderer.js';

// --- LOCAL CONSTANTS ---
const DAY_CYCLE_SPEED = 0.00004; // Slower = longer days and nights

// ============================================================
// MAIN GAME LOOP - runs ~60 times per second!
// ============================================================

export function gameLoop(timestamp) {
    const dt = timestamp - state.lastTime;
    state.lastTime = timestamp;

    try {
        switch (state.gameState) {
            case "authChecking":
                drawAuthCheckingScreen();
                break;

            case "accountCreate":
                drawAccountCreateScreen();
                break;

            case "accountLogin":
                drawAccountLoginScreen();
                break;

            case "menu":
                drawTitleScreen();
                break;

            case "modeSelect":
                drawModeSelectScreen();
                break;

            case "generating":
                drawGeneratingScreen();
                break;

            case "loading":
                drawLoadingScreen();
                break;

            case "saving":
                drawSavingScreen();
                break;

            case "paused":
                drawGameFrame(timestamp);
                drawPauseMenu();
                break;

            case "playing":
                state.cachedDayBrightness = Math.cos(state.timeOfDay * Math.PI * 2) * 0.5 + 0.5;
                if (state.inNether) state.cachedDayBrightness = 0.3;
                if (state.inWasteland) state.cachedDayBrightness = 0.25;
                if (state.inPossum) state.cachedDayBrightness = 1.0;

                if (state.portalCooldown > 0) state.portalCooldown -= dt;

                // Player burn damage (from ghast fireballs)
                if (state.player.burnTimer > 0) {
                    state.player.burnTimer -= dt;
                    if (Math.floor(state.player.burnTimer / 500) < Math.floor((state.player.burnTimer + dt) / 500)) {
                        hurtPlayer(1, state.player.x);
                        addFloatingText(state.player.x, state.player.y - 30, "Burning!", "#ff6600");
                    }
                }

                // Radiation damage in Wasteland (requires full hazmat suit)
                if (state.inWasteland) {
                    const armor = state.inventory.armor;
                    const fullHazmat =
                        armor.helmet.itemId    === ITEMS.HAZMAT_HELMET &&
                        armor.chestplate.itemId === ITEMS.HAZMAT_CHESTPLATE &&
                        armor.leggings.itemId   === ITEMS.HAZMAT_LEGGINGS &&
                        armor.boots.itemId      === ITEMS.HAZMAT_BOOTS;
                    if (!fullHazmat) {
                        state.radiationTimer -= dt;
                        if (state.radiationTimer <= 0) {
                            state.radiationTimer = 3000;
                            hurtPlayer(1, state.player.x);
                            addFloatingText(state.player.x, state.player.y - 30, "☢ Radiation!", "#80ff40");
                        }
                    } else {
                        state.radiationTimer = 3000;
                    }
                }

                updateSleep(dt);
                if (!state.sleeping) {
                    updatePlayer(dt);
                    updatePlateTimers(dt);
                    updateCamera();
                    handleGunFire(dt);
                    updateMining(dt);
                    updateMobs(dt, state.cachedDayBrightness);
                    updateProjectiles(dt);
                    updateParticles(dt);
                    updateLeafDecay(dt);
                    updateFurnaces(dt);
                    updateSmokers(dt);
                    if (state.isMobHost || !state.multiplayerMode) spawnMobs(dt, state.cachedDayBrightness);
                }
                updateMusic(dt, state.cachedDayBrightness);
                if (!state.inNether && !state.inWasteland && !state.inVoid && !state.inPossum) state.timeOfDay = (state.timeOfDay + DAY_CYCLE_SPEED) % 1;

                drawGameFrame(timestamp);
                break;
        }
    } catch (e) {
        // Show error on screen so we can debug
        state.ctx.fillStyle = "#1a1a2e";
        state.ctx.fillRect(0, 0, state.canvas.width, state.canvas.height);
        state.ctx.fillStyle = "#ef4444";
        state.ctx.font = "bold 20px 'Courier New', monospace";
        state.ctx.textAlign = "center";
        state.ctx.fillText("Runtime Error: " + e.message, state.canvas.width / 2, state.canvas.height / 2 - 20);
        state.ctx.fillStyle = "#9ca3af";
        state.ctx.font = "14px 'Courier New', monospace";
        state.ctx.fillText("State: " + state.gameState + " | Check console (F12)", state.canvas.width / 2, state.canvas.height / 2 + 15);
        console.error("Game loop error in state '" + state.gameState + "':", e);
        console.error("Stack:", e.stack);
    }

    requestAnimationFrame(gameLoop);
}
