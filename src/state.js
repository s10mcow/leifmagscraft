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
    blastFurnaceOpen: false,
    blastFurnacePos: null,
    blastFurnaceHover: -1,
    furnaceOpen: false,
    furnacePos: null,
    furnaceData: {},        // keyed "x,y" → { inputSlot, fuelSlot, outputSlot, progress, fuelLeft, maxFuel }
    furnaceSlotRects: null, // set by drawFurnaceMenu for click detection
    smokerOpen: false,
    smokerPos: null,
    smokerData: {},         // keyed "x,y" → { inputSlot, fuelSlot, outputSlot, progress, fuelLeft, maxFuel }
    smokerSlotRects: null,  // set by drawSmokerMenu for click detection
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
    gunReloadTimer: 0,
    gunReloadingSlot: -1,
    glitchedActive: false,

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
    // Wasteland dimension
    wastelandWorld: [],
    wastelandBgWorld: [],
    wastelandBiomeMap: [],
    inWasteland: false,
    wastelandPortalX: 0,
    wastelandPortalY: 0,
    wastelandReturnX: 0,
    wastelandReturnY: 0,
    radiationTimer: 3000,
    // Possum Realm dimension
    possumWorld: [],
    possumBgWorld: [],
    inPossum: false,
    possumReturnX: 0,
    possumReturnY: 0,
    possumReturnDim: 'overworld',
    // Void dimension
    voidWorld: [],
    voidBgWorld: [],
    inTheVoid: false,
    voidReturnX: 0,
    voidReturnY: 0,
    voidReturnDim: 'overworld',
    // Dungeon
    dungeonLocation: null,
    gaslyArenaX: 0, // left edge X of Gasly's arena in nether
    possumProtectorKills: 0, // track kills for possum god summoning
    possumPetTarget: null, // mob the player hit — pet Posse attacks it

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
        crouching: false,
        rawMeatDebuffTimer: 0,
        temperature: 50,
        tempDamageTimer: 0,
        candyBuffTimer: 0,
        candyBuffType: null,  // "speed" | "jump" | "strength" | "regen"
        regenHealTimer: 0,
        sugarCrashTimer: 0,
    },
    camera: { x: 0, y: 0 },
    screenShake: { x: 0, y: 0, intensity: 0 },
    laserBeam: null,
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
    isMobHost: true,

    // Input
    keys: {},
    mouse: { x: 0, y: 0, leftDown: false, rightDown: false },

    // Audio
    musicEnabled: true,
    musicTimer: 0,
    musicNoteIndex: 0,
    musicIsNight: false,

    // Account
    playerAccount: null,        // current username (persisted in localStorage)
    supabaseSession: null,      // active Supabase session object
    accountInput: '',           // username being typed
    accountPassword: '',        // password being typed
    accountActiveField: 'username', // 'username' | 'password'
    accountError: null,         // error string from Supabase
    accountLoading: false,      // true while awaiting Supabase

    // Menu UI
    menuHover: null,
    menuSaveList: [],
    menuScrollOffset: 0,
    MENU_BUTTONS: { newWorld: null, savedWorlds: [], modeSP: null, modeMP: null, modeBack: null,
                    diffEasy: null, diffNormal: null, diffHard: null, keepInv: null, createWorld: null,
                    accountCreate: null, accountLogin: null, accountChange: null,
                    accountUsernameField: null, accountPasswordField: null },
    PAUSE_BUTTONS: { resume: null, saveQuit: null },

    // Mode selection
    pendingWorldName: null,
    pendingDifficulty: "normal",  // "easy" | "normal" | "hard"
    pendingKeepInventory: true,

    // World settings (per-world)
    difficulty: "normal",
    keepInventory: true,
    droppedItems: [],       // items dropped on death [{x, y, velX, velY, itemId, count, durability, timer}]
    doorBreakTimers: [],    // mobs breaking doors on hard [{x, y, timer, mobId}]
    bunkerRegions: [],      // [{x1, y1, x2, y2}] — radiation-safe zones in wasteland

    // Multiplayer
    multiplayerMode: false,
    multiplayerConnected: false,
    myPlayerId: null,
    multiplayerName: 'Player',
    otherPlayers: {},           // { id: {x, y, facing, health, name} }

    // Chat
    chatMessages: [],           // [{text, color, timer}]
    chatOpen: false,
    chatInput: '',
};

// Initialize inventory slots
for (let i = 0; i < 27; i++) {
    state.inventory.slots.push({ itemId: 0, count: 0, durability: 0 });
}

// activeWorld points to world by default
state.activeWorld = state.world;
