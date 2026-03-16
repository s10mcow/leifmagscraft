// ============================================================
// STATE-MANAGEMENT.JS - World lifecycle and save system
// ============================================================
// Handles: resetAllGameState, saveWorld, loadWorld,
//          startNewWorld, saveAndQuit, startGame,
//          refreshSaveList, deleteSave, updateSaveIndex
// ============================================================

import { state } from '../state.js';
import { BLOCKS, ITEMS, ITEM_INFO, WORLD_WIDTH, WORLD_HEIGHT, BLOCK_SIZE, MOB_DEFS, SAVE_KEY_PREFIX, SAVE_INDEX_KEY } from '../constants.js';
import { ARMOR_SLOT_TYPES, addToInventory } from '../inventory.js';
import { findSurfaceY, generateWorld, generateNetherWorld } from '../world.js';
import { checkExistingSession } from '../auth.js';
import { updateCamera } from '../player.js';
import { createMob, spawnVillagers } from '../mobs.js';
import { rleEncode, rleDecode } from './compression.js';
import { gameLoop } from './loop.js';

// ============================================================
// RESET ALL GAME STATE
// ============================================================

export function resetAllGameState() {
    // World data
    state.world.length = 0;
    state.netherWorld.length = 0;
    state.wastelandWorld.length = 0;
    state.possumWorld.length = 0;
    state.biomeMap.length = 0;
    state.netherBiomeMap.length = 0;
    state.wastelandBiomeMap.length = 0;
    state.bgWorld.length = 0;
    state.netherBgWorld.length = 0;
    state.wastelandBgWorld.length = 0;
    state.possumBgWorld.length = 0;
    state.activeBgWorld = null;
    for (const key in state.chestData) delete state.chestData[key];

    // Player
    state.player.x = 0; state.player.y = 0;
    state.player.velX = 0; state.player.velY = 0;
    state.player.health = 20; state.player.facing = 1;
    state.player.invincibleTimer = 0; state.player.attackCooldown = 0;
    state.player.onGround = false; state.player.isFalling = false;
    state.player.fallStartY = 0;

    // Inventory
    for (let i = 0; i < state.inventory.slots.length; i++) {
        state.inventory.slots[i] = { itemId: 0, count: 0, durability: 0 };
    }
    state.inventory.selectedSlot = 0;
    state.cursorItem.itemId = 0; state.cursorItem.count = 0; state.cursorItem.durability = 0;
    state.offhand.itemId = 0; state.offhand.count = 0; state.offhand.durability = 0;

    // Mobs & entities
    state.mobs.length = 0;
    state.projectiles.length = 0;
    state.particles.length = 0;
    state.floatingTexts.length = 0;
    state.mobSpawnTimer = 0;

    // Game flags
    state.gameOver = false;
    state.craftingOpen = false; state.craftingHover = -1; state.craftingScroll = 0;
    state.tradingOpen = false; state.tradingVillager = null; state.tradingHover = -1;
    state.chestOpen = false; state.chestPos = null; state.chestHover = -1;
    state.blastFurnaceOpen = false; state.blastFurnacePos = null; state.blastFurnaceHover = -1;
    state.sleeping = false; state.sleepTimer = 0;
    state.mining.active = false; state.mining.progress = 0;
    state.mining.blockX = -1; state.mining.blockY = -1;
    state.gunCooldown = 0;
    state.gunReloadTimer = 0;
    state.gunReloadingSlot = -1;
    state.glitchedActive = false;

    // Dimension
    state.inNether = false;
    state.inWasteland = false;
    state.inPossum = false;
    state.activeWorld = state.world;
    state.overworldPortalX = 0; state.overworldPortalY = 0;
    state.netherPortalX = 0; state.netherPortalY = 0;
    state.wastelandPortalX = 0; state.wastelandPortalY = 0;
    state.wastelandReturnX = 0; state.wastelandReturnY = 0;
    state.wastelandReturnDim = 'overworld';
    state.radiationTimer = 3000;
    state.possumReturnX = 0; state.possumReturnY = 0;
    state.possumReturnDim = 'overworld';
    state.portalCooldown = 0;

    // Time
    state.timeOfDay = 0;
    state.cachedDayBrightness = 1;

    // Dropped items, door break timers, bunker regions
    state.droppedItems.length = 0;
    state.doorBreakTimers.length = 0;
    state.bunkerRegions.length = 0;

    // Village/structure tracking
    state.villageLocations.length = 0;
    state.structureLocations.length = 0;

    // Plate timers
    state.plateTimers.length = 0;

    // Leaf decay
    state.leafDecayQueue.length = 0;
    state.placedBlocks.clear();

    // Music
    state.musicTimer = 0;
    state.musicNoteIndex = 0;

    // Camera
    state.camera.x = 0; state.camera.y = 0;
    state.screenShake.x = 0; state.screenShake.y = 0; state.screenShake.intensity = 0;
}

// ============================================================
// SAVE INDEX HELPERS
// ============================================================

export function refreshSaveList() {
    try {
        const raw = localStorage.getItem(SAVE_INDEX_KEY);
        state.menuSaveList = raw ? JSON.parse(raw) : [];
        state.menuSaveList = state.menuSaveList.filter(function(s) {
            return localStorage.getItem(SAVE_KEY_PREFIX + s.name) !== null;
        });
        localStorage.setItem(SAVE_INDEX_KEY, JSON.stringify(state.menuSaveList));
    } catch (e) {
        state.menuSaveList = [];
    }
}

function updateSaveIndex(name, timestamp) {
    refreshSaveList();
    const existing = state.menuSaveList.findIndex(function(s) { return s.name === name; });
    if (existing >= 0) {
        state.menuSaveList[existing].timestamp = timestamp;
    } else {
        state.menuSaveList.push({ name: name, timestamp: timestamp });
    }
    try { localStorage.setItem(SAVE_INDEX_KEY, JSON.stringify(state.menuSaveList)); } catch(e) {}
}

export function deleteSave(name) {
    try { localStorage.removeItem(SAVE_KEY_PREFIX + name); } catch(e) {}
    refreshSaveList();
}

// ============================================================
// SAVE WORLD
// ============================================================

export function saveWorld() {
    const saveData = {
        version: 1,
        name: state.currentWorldName,
        timestamp: Date.now(),
        world: rleEncode(state.world),
        netherWorld: state.netherWorld.length > 0 ? rleEncode(state.netherWorld) : null,
        wastelandWorld: state.wastelandWorld.length > 0 ? rleEncode(state.wastelandWorld) : null,
        possumWorld: state.possumWorld.length > 0 ? rleEncode(state.possumWorld) : null,
        biomeMap: state.biomeMap.slice(),
        netherBiomeMap: state.netherBiomeMap.slice(),
        wastelandBiomeMap: state.wastelandBiomeMap.slice(),
        bgWorld: state.bgWorld.length > 0 ? rleEncode(state.bgWorld) : null,
        netherBgWorld: state.netherBgWorld.length > 0 ? rleEncode(state.netherBgWorld) : null,
        wastelandBgWorld: state.wastelandBgWorld.length > 0 ? rleEncode(state.wastelandBgWorld) : null,
        possumBgWorld: state.possumBgWorld.length > 0 ? rleEncode(state.possumBgWorld) : null,
        chestData: JSON.parse(JSON.stringify(state.chestData)),
        inventory: {
            slots: state.inventory.slots.map(function(s) { return { itemId: s.itemId, count: s.count, durability: s.durability }; }),
            armor: {
                helmet: Object.assign({}, state.inventory.armor.helmet),
                chestplate: Object.assign({}, state.inventory.armor.chestplate),
                leggings: Object.assign({}, state.inventory.armor.leggings),
                boots: Object.assign({}, state.inventory.armor.boots)
            },
            selectedSlot: state.inventory.selectedSlot
        },
        cursorItem: { itemId: state.cursorItem.itemId, count: state.cursorItem.count, durability: state.cursorItem.durability },
        offhand: { itemId: state.offhand.itemId, count: state.offhand.count, durability: state.offhand.durability },
        placedBlocks: Array.from(state.placedBlocks),
        player: {
            x: state.player.x, y: state.player.y,
            health: state.player.health, facing: state.player.facing
        },
        timeOfDay: state.timeOfDay,
        difficulty: state.difficulty,
        keepInventory: state.keepInventory,
        inNether: state.inNether,
        inWasteland: state.inWasteland,
        inPossum: state.inPossum,
        overworldPortalX: state.overworldPortalX,
        overworldPortalY: state.overworldPortalY,
        netherPortalX: state.netherPortalX,
        netherPortalY: state.netherPortalY,
        wastelandPortalX: state.wastelandPortalX,
        wastelandPortalY: state.wastelandPortalY,
        wastelandReturnX: state.wastelandReturnX,
        wastelandReturnY: state.wastelandReturnY,
        wastelandReturnDim: state.wastelandReturnDim || 'overworld',
        possumReturnX: state.possumReturnX,
        possumReturnY: state.possumReturnY,
        possumReturnDim: state.possumReturnDim || 'overworld',
        bunkerRegions: state.bunkerRegions.slice(),
        mobs: state.mobs.filter(function(m) { return !MOB_DEFS[m.type].hostile; }).map(function(m) {
            const md = { type: m.type, x: m.x, y: m.y, health: m.health, facing: m.facing };
            if (m.type === "wolf") { md.tamed = m.tamed; md.sitting = m.sitting; }
            if (m.type === "companion") { md.hungerTimer = m.hungerTimer; md.askingForFood = m.askingForFood; md.foodAskTimer = m.foodAskTimer; }
            return md;
        })
    };

    try {
        localStorage.setItem(SAVE_KEY_PREFIX + state.currentWorldName, JSON.stringify(saveData));
        updateSaveIndex(state.currentWorldName, Date.now());
        return true;
    } catch (e) {
        console.error("Save failed:", e);
        return false;
    }
}

// ============================================================
// LOAD WORLD
// ============================================================

export function loadWorld(worldName) {
    state.gameState = "loading";
    setTimeout(function() {
        try {
            const raw = localStorage.getItem(SAVE_KEY_PREFIX + worldName);
            if (!raw) { state.gameState = "menu"; return; }

            const data = JSON.parse(raw);
            resetAllGameState();

            // World
            const decoded = rleDecode(data.world, WORLD_WIDTH, WORLD_HEIGHT);
            for (let x = 0; x < WORLD_WIDTH; x++) state.world[x] = decoded[x];

            if (data.netherWorld) {
                const nDecoded = rleDecode(data.netherWorld, WORLD_WIDTH, WORLD_HEIGHT);
                for (let x = 0; x < WORLD_WIDTH; x++) state.netherWorld[x] = nDecoded[x];
            }
            if (data.wastelandWorld) {
                const wDecoded = rleDecode(data.wastelandWorld, WORLD_WIDTH, WORLD_HEIGHT);
                for (let x = 0; x < WORLD_WIDTH; x++) state.wastelandWorld[x] = wDecoded[x];
            }
            if (data.possumWorld) {
                const pDecoded = rleDecode(data.possumWorld, WORLD_WIDTH, WORLD_HEIGHT);
                for (let x = 0; x < WORLD_WIDTH; x++) state.possumWorld[x] = pDecoded[x];
            }

            // BiomeMap
            for (let i = 0; i < data.biomeMap.length; i++) state.biomeMap[i] = data.biomeMap[i];
            if (data.netherBiomeMap) {
                for (let i = 0; i < data.netherBiomeMap.length; i++) state.netherBiomeMap[i] = data.netherBiomeMap[i];
            }
            if (data.wastelandBiomeMap) {
                for (let i = 0; i < data.wastelandBiomeMap.length; i++) state.wastelandBiomeMap[i] = data.wastelandBiomeMap[i];
            }
            if (data.bgWorld) {
                const bgDecoded = rleDecode(data.bgWorld, WORLD_WIDTH, WORLD_HEIGHT);
                for (let x = 0; x < WORLD_WIDTH; x++) state.bgWorld[x] = bgDecoded[x];
            }
            if (data.netherBgWorld) {
                const nbgDecoded = rleDecode(data.netherBgWorld, WORLD_WIDTH, WORLD_HEIGHT);
                for (let x = 0; x < WORLD_WIDTH; x++) state.netherBgWorld[x] = nbgDecoded[x];
            }
            if (data.wastelandBgWorld) {
                const wbgDecoded = rleDecode(data.wastelandBgWorld, WORLD_WIDTH, WORLD_HEIGHT);
                for (let x = 0; x < WORLD_WIDTH; x++) state.wastelandBgWorld[x] = wbgDecoded[x];
            }
            if (data.possumBgWorld) {
                const pbgDecoded = rleDecode(data.possumBgWorld, WORLD_WIDTH, WORLD_HEIGHT);
                for (let x = 0; x < WORLD_WIDTH; x++) state.possumBgWorld[x] = pbgDecoded[x];
            }

            // Chests
            for (const key in data.chestData) state.chestData[key] = data.chestData[key];

            // Inventory
            for (let i = 0; i < data.inventory.slots.length; i++) {
                state.inventory.slots[i] = data.inventory.slots[i];
            }
            state.inventory.selectedSlot = data.inventory.selectedSlot;
            for (const type of ARMOR_SLOT_TYPES) {
                state.inventory.armor[type] = data.inventory.armor[type];
            }
            state.cursorItem.itemId = data.cursorItem.itemId;
            state.cursorItem.count = data.cursorItem.count;
            state.cursorItem.durability = data.cursorItem.durability;
            if (data.offhand) {
                state.offhand.itemId = data.offhand.itemId;
                state.offhand.count = data.offhand.count;
                state.offhand.durability = data.offhand.durability;
            }
            if (data.placedBlocks) {
                for (const k of data.placedBlocks) state.placedBlocks.add(k);
            }

            // Player
            state.player.x = data.player.x;
            state.player.y = data.player.y;
            state.player.health = data.player.health;
            state.player.facing = data.player.facing;

            // Dimension & settings
            state.timeOfDay = data.timeOfDay;
            state.difficulty = data.difficulty || "normal";
            state.keepInventory = data.keepInventory !== undefined ? data.keepInventory : true;
            state.inNether = data.inNether;
            state.inWasteland = data.inWasteland || false;
            state.inPossum = data.inPossum || false;
            if (state.inPossum) {
                state.activeWorld   = state.possumWorld;
                state.activeBgWorld = state.possumBgWorld;
            } else if (state.inWasteland) {
                state.activeWorld   = state.wastelandWorld;
                state.activeBgWorld = state.wastelandBgWorld;
            } else if (state.inNether) {
                state.activeWorld   = state.netherWorld;
                state.activeBgWorld = state.netherBgWorld;
            } else {
                state.activeWorld   = state.world;
                state.activeBgWorld = state.bgWorld;
            }
            state.overworldPortalX = data.overworldPortalX;
            state.overworldPortalY = data.overworldPortalY;
            state.netherPortalX = data.netherPortalX;
            state.netherPortalY = data.netherPortalY;
            state.wastelandPortalX = data.wastelandPortalX || 0;
            state.wastelandPortalY = data.wastelandPortalY || 0;
            state.wastelandReturnX = data.wastelandReturnX || 0;
            state.wastelandReturnY = data.wastelandReturnY || 0;
            state.wastelandReturnDim = data.wastelandReturnDim || 'overworld';
            state.possumReturnX = data.possumReturnX || 0;
            state.possumReturnY = data.possumReturnY || 0;
            state.possumReturnDim = data.possumReturnDim || 'overworld';
            if (data.bunkerRegions) {
                for (const r of data.bunkerRegions) state.bunkerRegions.push(r);
            }

            // Mobs (passive only, hostile will respawn)
            if (data.mobs) {
                for (const mData of data.mobs) {
                    const mob = createMob(mData.type, mData.x, mData.y);
                    mob.health = mData.health;
                    mob.facing = mData.facing;
                    if (mData.tamed !== undefined) mob.tamed = mData.tamed;
                    if (mData.sitting !== undefined) mob.sitting = mData.sitting;
                    if (mData.hungerTimer !== undefined) mob.hungerTimer = mData.hungerTimer;
                    if (mData.askingForFood !== undefined) mob.askingForFood = mData.askingForFood;
                    if (mData.foodAskTimer !== undefined) mob.foodAskTimer = mData.foodAskTimer;
                    state.mobs.push(mob);
                }
            }

            state.currentWorldName = worldName;
            updateCamera();
            state.gameState = "playing";
            console.log("Loaded world:", worldName);
        } catch (e) {
            console.error("Load failed:", e);
            state.gameState = "menu";
        }
    }, 50);
}

// ============================================================
// START NEW WORLD
// ============================================================

export function startNewWorld(worldName) {
    state.gameState = "generating";
    console.log("startNewWorld called, state set to generating");
    setTimeout(function() {
        try {
            console.log("setTimeout fired, resetting state...");
            resetAllGameState();
            console.log("State reset, generating world...");
            generateWorld();
            console.log("World generated, world[0] length:", state.world[0] ? state.world[0].length : "EMPTY");
            state.activeWorld = state.world;
            console.log("Spawning villagers...");
            spawnVillagers();

            const startX = Math.floor(WORLD_WIDTH / 2);
            state.player.x = startX * BLOCK_SIZE;
            state.player.y = (findSurfaceY(startX) - 2) * BLOCK_SIZE;
            console.log("Player placed at x:", startX, "y:", state.player.y / BLOCK_SIZE);

            state.currentWorldName = worldName || ("World " + Date.now());
            state.gameState = "playing";
            console.log("New world created:", state.currentWorldName, "gameState:", state.gameState);
        } catch (e) {
            console.error("World generation error:", e);
            console.error("Stack:", e.stack);
            state.gameState = "menu";
        }
    }, 50);
}

// ============================================================
// START MULTIPLAYER WORLD
// ============================================================

export function startMultiplayerWorld(worldName) {
    state.multiplayerMode = true;
    state.gameState = "generating";
    setTimeout(function() {
        try {
            resetAllGameState();

            // Use a fixed seed for deterministic world generation so all
            // players in the same session get the same world layout.
            const MULTIPLAYER_SEED = 0xC0FFEE42;
            function mulberry32(s) {
                return function() {
                    s |= 0; s = s + 0x6D2B79F5 | 0;
                    let t = Math.imul(s ^ s >>> 15, 1 | s);
                    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
                    return ((t ^ t >>> 14) >>> 0) / 4294967296;
                };
            }
            const seededRng = mulberry32(MULTIPLAYER_SEED);
            const origRandom = Math.random;
            Math.random = seededRng;
            generateWorld();
            Math.random = origRandom;

            state.activeWorld = state.world;
            spawnVillagers();

            const startX = Math.floor(WORLD_WIDTH / 2);
            state.player.x = startX * BLOCK_SIZE;
            state.player.y = (findSurfaceY(startX) - 2) * BLOCK_SIZE;

            state.currentWorldName = worldName || ("World " + Date.now());
            state.gameState = "playing";

            // Connect to multiplayer server after world is ready
            import('../multiplayer.js').then(m => m.connectMultiplayer());
        } catch (e) {
            console.error("Multiplayer world generation error:", e);
            state.multiplayerMode = false;
            state.gameState = "menu";
        }
    }, 50);
}

// ============================================================
// SAVE AND QUIT
// ============================================================

export function saveAndQuit() {
    state.gameState = "saving";
    setTimeout(function() {
        saveWorld();
        refreshSaveList();
        state.menuHover = null;
        state.menuScrollOffset = 0;
        state.gameState = "menu";
    }, 50);
}

// ============================================================
// START GAME - kicks off the RAF loop
// ============================================================

export function startGame() {
    refreshSaveList();
    // Show a brief loading state while we check for an existing Supabase session
    state.gameState = 'authChecking';
    requestAnimationFrame(gameLoop);

    checkExistingSession().then((hasSession) => {
        if (hasSession) {
            // Valid session — show Welcome Back / Continue
            state.gameState = 'accountLogin';
            document.title = "Leef & Maggie's Minecraft 2D \u2014 A Two-Block Building Adventure";
        } else {
            // Always start at Create Account; Sign In link is on that screen
            state.gameState = 'accountCreate';
            document.title = 'Make an Account';
        }
    }).catch(() => {
        state.gameState = 'accountCreate';
        document.title = 'Make an Account';
    });
}
