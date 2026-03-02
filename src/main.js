// ============================================================
// MAIN.JS - Entry point (ES Module)
// ============================================================

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

// Setup input listeners
setupInput();

// Start the game
startGame();
