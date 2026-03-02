// ============================================================
// STATE-MANAGEMENT.JS - World lifecycle and save system
// ============================================================
// Handles: resetAllGameState, saveWorld, loadWorld,
//          startNewWorld, saveAndQuit, startGame,
//          refreshSaveList, deleteSave, updateSaveIndex
// ============================================================

import { state } from '../state.js';
import { BLOCKS, ITEMS, WORLD_WIDTH, WORLD_HEIGHT, BLOCK_SIZE, ITEM_INFO, MOB_DEFS, SAVE_KEY_PREFIX, SAVE_INDEX_KEY } from '../constants.js';
import { ARMOR_SLOT_TYPES } from '../inventory.js';
import { findSurfaceY, generateWorld, generateNetherWorld } from '../world.js';
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
    state.biomeMap.length = 0;
    state.netherBiomeMap.length = 0;
    state.bgWorld.length = 0;
    state.netherBgWorld.length = 0;
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
    state.inventory.slots[0] = { itemId: ITEMS.PISTOL, count: 1, durability: ITEM_INFO[ITEMS.PISTOL].durability };
    state.inventory.slots[1] = { itemId: ITEMS.BULLETS, count: 64, durability: 0 };
    state.inventory.slots[2] = { itemId: ITEMS.MINIATURE_NETHER_PORTAL, count: 1, durability: 0 };
    for (const type of ARMOR_SLOT_TYPES) {
        state.inventory.armor[type] = { itemId: 0, count: 0, durability: 0 };
    }
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
    state.sleeping = false; state.sleepTimer = 0;
    state.mining.active = false; state.mining.progress = 0;
    state.mining.blockX = -1; state.mining.blockY = -1;
    state.gunCooldown = 0;

    // Dimension
    state.inNether = false;
    state.activeWorld = state.world;
    state.overworldPortalX = 0; state.overworldPortalY = 0;
    state.netherPortalX = 0; state.netherPortalY = 0;
    state.portalCooldown = 0;

    // Time
    state.timeOfDay = 0;
    state.cachedDayBrightness = 1;

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
        biomeMap: state.biomeMap.slice(),
        netherBiomeMap: state.netherBiomeMap.slice(),
        bgWorld: state.bgWorld.length > 0 ? rleEncode(state.bgWorld) : null,
        netherBgWorld: state.netherBgWorld.length > 0 ? rleEncode(state.netherBgWorld) : null,
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
        inNether: state.inNether,
        overworldPortalX: state.overworldPortalX,
        overworldPortalY: state.overworldPortalY,
        netherPortalX: state.netherPortalX,
        netherPortalY: state.netherPortalY,
        mobs: state.mobs.filter(function(m) { return !MOB_DEFS[m.type].hostile; }).map(function(m) {
            const md = { type: m.type, x: m.x, y: m.y, health: m.health, facing: m.facing };
            if (m.type === "wolf") { md.tamed = m.tamed; md.sitting = m.sitting; }
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

            // BiomeMap
            for (let i = 0; i < data.biomeMap.length; i++) state.biomeMap[i] = data.biomeMap[i];
            if (data.netherBiomeMap) {
                for (let i = 0; i < data.netherBiomeMap.length; i++) state.netherBiomeMap[i] = data.netherBiomeMap[i];
            }
            if (data.bgWorld) {
                const bgDecoded = rleDecode(data.bgWorld, WORLD_WIDTH, WORLD_HEIGHT);
                for (let x = 0; x < WORLD_WIDTH; x++) state.bgWorld[x] = bgDecoded[x];
                state.activeBgWorld = state.inNether ? state.netherBgWorld : state.bgWorld;
            }
            if (data.netherBgWorld) {
                const nbgDecoded = rleDecode(data.netherBgWorld, WORLD_WIDTH, WORLD_HEIGHT);
                for (let x = 0; x < WORLD_WIDTH; x++) state.netherBgWorld[x] = nbgDecoded[x];
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

            // Dimension
            state.timeOfDay = data.timeOfDay;
            state.inNether = data.inNether;
            state.activeWorld = state.inNether ? state.netherWorld : state.world;
            state.activeBgWorld = state.inNether ? state.netherBgWorld : state.bgWorld;
            state.overworldPortalX = data.overworldPortalX;
            state.overworldPortalY = data.overworldPortalY;
            state.netherPortalX = data.netherPortalX;
            state.netherPortalY = data.netherPortalY;

            // Mobs (passive only, hostile will respawn)
            if (data.mobs) {
                for (const mData of data.mobs) {
                    const mob = createMob(mData.type, mData.x, mData.y);
                    mob.health = mData.health;
                    mob.facing = mData.facing;
                    if (mData.tamed !== undefined) mob.tamed = mData.tamed;
                    if (mData.sitting !== undefined) mob.sitting = mData.sitting;
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
    requestAnimationFrame(gameLoop);
}
