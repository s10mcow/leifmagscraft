// ============================================================
// SYSTEMS.JS - Game systems running each frame
// ============================================================
// Handles: updateSleep, executeTrade, teleportToOtherDimension,
//          updateLeafDecay, scheduleLeafDecay (private helper),
//          and the block-set constants used by input-handlers.js
// ============================================================

import { state } from '../state.js';
import { BLOCKS, BLOCK_SIZE, WORLD_WIDTH, WORLD_HEIGHT, MOB_DEFS, getItemName } from '../constants.js';
import { addFloatingText, countItem, addToInventory } from '../inventory.js';
import { findSurfaceY, generateNetherWorld, switchDimension } from '../world.js';
import { playCraft } from '../audio.js';

// ============================================================
// LOCAL CONSTANTS (shared with input-handlers.js)
// ============================================================

export const WOOD_BLOCKS = new Set([BLOCKS.WOOD, BLOCKS.SPRUCE_WOOD, BLOCKS.ACACIA_WOOD, BLOCKS.NETHER_WOOD, BLOCKS.WARPED_WOOD]);
export const LEAF_BLOCKS = new Set([BLOCKS.LEAVES, BLOCKS.SPRUCE_LEAVES, BLOCKS.ACACIA_LEAVES, BLOCKS.NETHER_LEAVES, BLOCKS.WARPED_LEAVES]);
export const TREE_BLOCKS = new Set([BLOCKS.WOOD, BLOCKS.LEAVES, BLOCKS.SPRUCE_WOOD, BLOCKS.SPRUCE_LEAVES, BLOCKS.ACACIA_WOOD, BLOCKS.ACACIA_LEAVES, BLOCKS.NETHER_WOOD, BLOCKS.NETHER_LEAVES, BLOCKS.WARPED_WOOD, BLOCKS.WARPED_LEAVES]);

// ============================================================
// LEAF DECAY SYSTEM
// ============================================================

function hasNearbyWood(bx, by) {
    const range = 4;
    for (let dx = -range; dx <= range; dx++) {
        for (let dy = -range; dy <= range; dy++) {
            const nx = bx + dx, ny = by + dy;
            if (nx < 0 || nx >= WORLD_WIDTH || ny < 0 || ny >= WORLD_HEIGHT) continue;
            if (WOOD_BLOCKS.has(state.activeWorld[nx][ny])) return true;
        }
    }
    return false;
}

export function scheduleLeafDecay(wx, wy) {
    const range = 6;
    for (let dx = -range; dx <= range; dx++) {
        for (let dy = -range; dy <= range; dy++) {
            const nx = wx + dx, ny = wy + dy;
            if (nx < 0 || nx >= WORLD_WIDTH || ny < 0 || ny >= WORLD_HEIGHT) continue;
            if (!LEAF_BLOCKS.has(state.activeWorld[nx][ny])) continue;
            if (state.leafDecayQueue.some(function(e) { return e.x === nx && e.y === ny; })) continue;
            state.leafDecayQueue.push({ x: nx, y: ny, timer: 500 + Math.random() * 3500 });
        }
    }
}

export function updateLeafDecay(dt) {
    for (let i = state.leafDecayQueue.length - 1; i >= 0; i--) {
        const entry = state.leafDecayQueue[i];
        entry.timer -= dt;
        if (entry.timer <= 0) {
            state.leafDecayQueue.splice(i, 1);
            if (!LEAF_BLOCKS.has(state.activeWorld[entry.x][entry.y])) continue;
            if (!hasNearbyWood(entry.x, entry.y)) {
                state.activeWorld[entry.x][entry.y] = BLOCKS.AIR;
            }
        }
    }
}

// ============================================================
// SLEEP SYSTEM
// ============================================================

const SLEEP_DURATION = 2000; // 2 second animation

export function updateSleep(dt) {
    if (!state.sleeping) return;
    state.sleepTimer += dt;

    if (state.sleepTimer >= SLEEP_DURATION) {
        // Wake up! Set time to early morning
        state.timeOfDay = 0.05;
        state.sleeping = false;
        state.sleepTimer = 0;
        // Despawn hostile mobs
        for (let i = state.mobs.length - 1; i >= 0; i--) {
            if (MOB_DEFS[state.mobs[i].type].hostile) state.mobs.splice(i, 1);
        }
        addFloatingText(state.player.x, state.player.y - 30, "Good morning!", "#ffd700");
    }
}

// ============================================================
// TRADING
// ============================================================

export function executeTrade(trade) {
    const emeraldCount = countItem(BLOCKS.EMERALD);
    if (emeraldCount < trade.cost) {
        addFloatingText(state.player.x, state.player.y - 20, "Not enough emeralds!", "#ef4444");
        return;
    }
    let toRemove = trade.cost;
    for (let i = 0; i < state.inventory.slots.length && toRemove > 0; i++) {
        const slot = state.inventory.slots[i];
        if (slot.itemId === BLOCKS.EMERALD) {
            const take = Math.min(slot.count, toRemove);
            slot.count -= take;
            toRemove -= take;
            if (slot.count === 0) { slot.itemId = 0; slot.durability = 0; }
        }
    }
    addToInventory(trade.result, trade.resultCount);
    playCraft();
    addFloatingText(state.player.x, state.player.y - 30, "Traded for " + getItemName(trade.result) + "!", "#ffd700");
}

// ============================================================
// NETHER PORTAL / DIMENSION TELEPORT
// ============================================================

export function teleportToOtherDimension() {
    if (state.inNether) {
        // Return to overworld
        switchDimension(false);
        state.player.x = state.overworldPortalX * BLOCK_SIZE;
        state.player.y = (state.overworldPortalY - 2) * BLOCK_SIZE;
    } else {
        // Save overworld position
        state.overworldPortalX = Math.floor(state.player.x / BLOCK_SIZE);
        state.overworldPortalY = Math.floor(state.player.y / BLOCK_SIZE);

        // Generate Nether if first time
        if (state.netherWorld.length === 0) {
            generateNetherWorld();
        }

        switchDimension(true);

        // Find safe spawn in Nether
        const spawnX = Math.floor(WORLD_WIDTH / 2);
        const surfY = findSurfaceY(spawnX);
        state.netherPortalX = spawnX;
        state.netherPortalY = surfY;
        state.player.x = spawnX * BLOCK_SIZE;
        state.player.y = (surfY - 2) * BLOCK_SIZE;
    }

    // Clear mobs on dimension change
    state.mobs.length = 0;
    state.portalCooldown = 3000;
    state.player.velX = 0;
    state.player.velY = 0;
    addFloatingText(state.player.x, state.player.y - 30, state.inNether ? "Entered the Nether!" : "Returned to Overworld!", state.inNether ? "#ff4444" : "#4ade80");
}
