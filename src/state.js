// ============================================================
// STATE.JS - All mutable shared state in one place
// ============================================================
// Every file imports from here instead of using globals.
// This breaks circular dependencies cleanly.
// ============================================================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

export const state = {
    // Canvas
    canvas,
    ctx,

    // Game state machine
    gameState: "menu",  // "menu" | "generating" | "loading" | "saving" | "playing" | "paused"
    currentWorldName: "",
    cachedDayBrightness: 1,
    lastTime: 0,

    // Game flags
    timeOfDay: 0,
    gameOver: false,
    craftingOpen: false,
    craftingHover: -1,
    craftingScroll: 0,
    sleeping: false,
    sleepTimer: 0,
    tradingOpen: false,
    tradingVillager: null,
    tradingHover: -1,
    chestOpen: false,
    chestPos: null,
    chestHover: -1,
    mining: {
        active: false,
        blockX: -1, blockY: -1,
        progress: 0, targetTime: 0,
        canMine: true,
        isBgBlock: false
    },
    gunCooldown: 0,

    // World data
    world: [],
    biomeMap: [],
    netherBiomeMap: [],
    chestData: {},
    netherWorld: [],
    inNether: false,
    activeWorld: null, // set to world after init
    overworldPortalX: 0,
    overworldPortalY: 0,
    netherPortalX: 0,
    netherPortalY: 0,
    portalCooldown: 0,
    villageLocations: [],
    structureLocations: [],
    bgWorld: [],
    netherBgWorld: [],
    activeBgWorld: null,

    // Player
    player: {
        x: 0, y: 0, width: 24, height: 46,
        velX: 0, velY: 0,
        speed: 4, jumpForce: -9.5,
        onGround: false, facing: 1,
        health: 20, maxHealth: 20,
        invincibleTimer: 0,
        attackCooldown: 0,
        fallStartY: 0,
        isFalling: false,
        burnTimer: 0,
        crouching: false
    },
    camera: { x: 0, y: 0 },
    screenShake: { x: 0, y: 0, intensity: 0 },
    plateTimers: [],

    // Inventory
    inventory: {
        slots: [],
        selectedSlot: 0,
        armor: {
            helmet: { itemId: 0, count: 0, durability: 0 },
            chestplate: { itemId: 0, count: 0, durability: 0 },
            leggings: { itemId: 0, count: 0, durability: 0 },
            boots: { itemId: 0, count: 0, durability: 0 }
        }
    },
    cursorItem: { itemId: 0, count: 0, durability: 0 },
    offhand: { itemId: 0, count: 0, durability: 0 },
    leafDecayQueue: [],
    placedBlocks: new Set(),
    floatingTexts: [],

    // Mobs & entities
    mobs: [],
    projectiles: [],
    particles: [],
    mobSpawnTimer: 0,

    // Input
    keys: {},
    mouse: { x: 0, y: 0, leftDown: false, rightDown: false },

    // Audio
    musicEnabled: true,
    musicTimer: 0,
    musicNoteIndex: 0,
    musicIsNight: false,

    // Menu UI
    menuHover: null,
    menuSaveList: [],
    menuScrollOffset: 0,
    MENU_BUTTONS: { newWorld: null, savedWorlds: [] },
    PAUSE_BUTTONS: { resume: null, saveQuit: null },
};

// Initialize inventory slots
for (let i = 0; i < 27; i++) {
    state.inventory.slots.push({ itemId: 0, count: 0, durability: 0 });
}

// activeWorld points to world by default
state.activeWorld = state.world;
