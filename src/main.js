// ============================================================
// MAIN.JS - Entry point (ES Module)
// ============================================================

import { state } from './state.js';
import './constants.js';
import './audio.js';
import './world.js';
import './inventory.js';
import { setToggleDoor, setTeleportToOtherDimension } from './player.js';
import './mobs.js';
import './rendering.js';
import './ui.js';
import { setupInput, registerFunctions } from './input.js';
import { setupVirtualControls } from './virtualControls.js';
import {
    startGame, startNewWorld, startMultiplayerWorld, loadWorld, deleteSave, saveAndQuit,
    interact, executeTrade, placeBlock, toggleDoor, teleportToOtherDimension,
    handleGunFire
} from './game.js';
import { attackMob, getMobAtCursor, getPlayerAtCursor, attackPlayer, respawnPlayer } from './player.js';

// Wire up circular dependency functions
setToggleDoor(toggleDoor);
setTeleportToOtherDimension(teleportToOtherDimension);

// Register functions that input.js needs from other modules
registerFunctions({
    startNewWorld,
    startMultiplayerWorld,
    loadWorld,
    deleteSave,
    saveAndQuit,
    interact,
    executeTrade,
    placeBlock,
    attackMob,
    getMobAtCursor,
    getPlayerAtCursor,
    attackPlayer,
    respawnPlayer,
});

// ============================================================
// RESPONSIVE CANVAS — fills the full browser window
// ============================================================
// Cap internal render resolution so large windows don't tank performance.
// CSS stretches the canvas to fill the viewport (style.css sets width/height: 100vw/100vh).
const MAX_RENDER_W = 1280;
const MAX_RENDER_H = 800;
function resizeCanvas() {
    state.canvas.width  = Math.min(window.innerWidth,  MAX_RENDER_W);
    state.canvas.height = Math.min(window.innerHeight, MAX_RENDER_H);
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', () => {
    // Small delay lets the browser finish rotating before we read dimensions
    setTimeout(resizeCanvas, 100);
});

// Setup input listeners
setupInput();

// Mobile virtual controls (no-op on desktop/mouse devices)
setupVirtualControls();

// Start the game
startGame();
