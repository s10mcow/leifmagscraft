// Barrel re-export — mirrors original game.js public API
export { rleEncode, rleDecode } from './compression.js';
export { drawGameFrame } from './frame-renderer.js';
export {
    updateMining,
    placeBlock,
    interact,
    toggleDoor,
    handleGunFire,
} from './input-handlers.js';
export { gameLoop } from './loop.js';
export {
    resetAllGameState,
    refreshSaveList,
    deleteSave,
    saveWorld,
    loadWorld,
    startNewWorld,
    saveAndQuit,
    startGame,
} from './state-management.js';
export {
    WOOD_BLOCKS,
    LEAF_BLOCKS,
    TREE_BLOCKS,
    scheduleLeafDecay,
    updateLeafDecay,
    updateSleep,
    executeTrade,
    teleportToOtherDimension,
} from './systems.js';
