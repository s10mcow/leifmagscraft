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
import {
    startGame, startNewWorld, loadWorld, deleteSave, saveAndQuit,
    interact, executeTrade, placeBlock, toggleDoor, teleportToOtherDimension,
    handleGunFire
} from './game.js';
import { attackMob, getMobAtCursor, respawnPlayer } from './player.js';

// Wire up circular dependency functions
setToggleDoor(toggleDoor);
setTeleportToOtherDimension(teleportToOtherDimension);

// Register functions that input.js needs from other modules
registerFunctions({
    startNewWorld,
    loadWorld,
    deleteSave,
    saveAndQuit,
    interact,
    executeTrade,
    placeBlock,
    attackMob,
    getMobAtCursor,
    respawnPlayer,
});

// ============================================================
// RESPONSIVE CANVAS — fills the full browser window
// ============================================================
function resizeCanvas() {
    state.canvas.width  = window.innerWidth;
    state.canvas.height = window.innerHeight;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', () => {
    // Small delay lets the browser finish rotating before we read dimensions
    setTimeout(resizeCanvas, 100);
});

// Setup input listeners
setupInput();

// Start the game
startGame();
