// ============================================================
// INVENTORY.JS - Inventory management and crafting (ES Module)
// ============================================================
// Handles picking up items, storing them, and crafting.
// ============================================================

import { state } from './state.js';
import { ITEM_INFO, isStackable, maxStackSize, isFood, getItemName } from './constants.js';
import { playToolBreak, playCraft, playPickup, playEat, playSelect, playBlockPlace } from './audio.js';

export const HOTBAR_SIZE = 9;
export const BACKPACK_SIZE = 18;
export const TOTAL_SLOTS = HOTBAR_SIZE + BACKPACK_SIZE;
export const ARMOR_SLOT_TYPES = ["helmet", "chestplate", "leggings", "boots"];

export function addFloatingText(x, y, text, color = "#ffffff") {
    state.floatingTexts.push({ x, y, text, color, life: 60 });
}

// Get info about equipped tool (or null if holding block/nothing)
export function getEquippedTool() {
    const slot = state.inventory.slots[state.inventory.selectedSlot];
    if (slot.count === 0 || slot.itemId === 0) return null;
    if (ITEM_INFO[slot.itemId] && ITEM_INFO[slot.itemId].toolType) {
        return ITEM_INFO[slot.itemId];
    }
    return null;
}

export function getEquippedTier() {
    const tool = getEquippedTool();
    return tool ? tool.tier : 0;
}

// Count total of an item across all inventory slots
export function countItem(itemId) {
    let total = 0;
    for (const slot of state.inventory.slots) {
        if (slot.itemId === itemId) total += slot.count;
    }
    return total;
}

// Remove items from inventory (used by crafting)
export function removeItems(itemId, amount) {
    let remaining = amount;
    for (let i = 0; i < state.inventory.slots.length && remaining > 0; i++) {
        if (state.inventory.slots[i].itemId === itemId) {
            const take = Math.min(state.inventory.slots[i].count, remaining);
            state.inventory.slots[i].count -= take;
            remaining -= take;
            if (state.inventory.slots[i].count === 0) {
                state.inventory.slots[i].itemId = 0;
                state.inventory.slots[i].durability = 0;
            }
        }
    }
}

// Add items to inventory. Returns true if successful.
// durabilityOverride: if provided, newly created stacks use this durability instead of the item default.
export function addToInventory(itemId, count = 1, durabilityOverride = null) {
    if (itemId === 0 || itemId === null) return false;
    const stackable = isStackable(itemId);
    const max = maxStackSize(itemId);
    let remaining = count;

    // Stack with existing slots first
    if (stackable) {
        for (let i = 0; i < state.inventory.slots.length && remaining > 0; i++) {
            if (state.inventory.slots[i].itemId === itemId && state.inventory.slots[i].count < max) {
                const add = Math.min(remaining, max - state.inventory.slots[i].count);
                state.inventory.slots[i].count += add;
                remaining -= add;
            }
        }
    }

    // Then find empty slots
    while (remaining > 0) {
        let found = false;
        for (let i = 0; i < state.inventory.slots.length; i++) {
            if (state.inventory.slots[i].count === 0) {
                const add = stackable ? Math.min(remaining, max) : 1;
                state.inventory.slots[i].itemId = itemId;
                state.inventory.slots[i].count = add;
                if (ITEM_INFO[itemId] && ITEM_INFO[itemId].durability) {
                    state.inventory.slots[i].durability = durabilityOverride !== null ? durabilityOverride : ITEM_INFO[itemId].durability;
                }
                remaining -= add;
                found = true;
                break;
            }
        }
        if (!found) return false; // Inventory full!
    }
    return true;
}

// Reduce durability of equipped tool. Breaks if it hits 0.
export function damageEquippedTool() {
    const slot = state.inventory.slots[state.inventory.selectedSlot];
    if (slot.count === 0 || !ITEM_INFO[slot.itemId] || !ITEM_INFO[slot.itemId].durability) return;
    slot.durability--;
    if (slot.durability <= 0) {
        slot.itemId = 0;
        slot.count = 0;
        slot.durability = 0;
        addFloatingText(state.player.x, state.player.y - 20, "Tool broke!", "#ff4444");
        playToolBreak();
    }
}

// Crafting
export function canCraft(recipe) {
    for (const ing of recipe.ingredients) {
        if (countItem(ing.id) < ing.count) return false;
    }
    return true;
}

export function craft(recipe) {
    if (!canCraft(recipe)) return;
    for (const ing of recipe.ingredients) {
        removeItems(ing.id, ing.count);
    }
    const dur = recipe.resultDurability !== undefined ? recipe.resultDurability : null;
    if (addToInventory(recipe.result, recipe.resultCount, dur)) {
        addFloatingText(state.player.x, state.player.y - 30,
            `Crafted ${recipe.resultCount}x ${getItemName(recipe.result)}!`, "#4ade80");
        playCraft();
    }
}

// Eat food to restore health
export function eatFood() {
    const slot = state.inventory.slots[state.inventory.selectedSlot];
    if (slot.count === 0) return;
    const info = ITEM_INFO[slot.itemId];
    if (!info || !info.food) return;
    if (info.rawMeat) {
        // Raw meat: apply slowness + weakness debuff, minimal heal
        state.player.rawMeatDebuffTimer = 30000;
        addFloatingText(state.player.x, state.player.y - 20, "Raw meat! Debuffed!", "#ff9900");
        playEat();
        slot.count--;
        if (slot.count === 0) { slot.itemId = 0; slot.durability = 0; }
        return;
    }
    if (state.player.health >= state.player.maxHealth) {
        addFloatingText(state.player.x, state.player.y - 20, "Already full health!", "#ffaa00");
        return;
    }
    state.player.health = Math.min(state.player.maxHealth, state.player.health + info.healAmount);
    addFloatingText(state.player.x, state.player.y - 20, `+${info.healAmount} HP`, "#ff6b6b");
    playEat();
    slot.count--;
    if (slot.count === 0) { slot.itemId = 0; slot.durability = 0; }
}

// ============================================================
// INVENTORY MANAGEMENT (click to move items around)
// ============================================================

// Click on an inventory slot: pick up, place, swap, or stack
export function clickInventorySlot(slotIndex) {
    if (slotIndex < 0 || slotIndex >= TOTAL_SLOTS) return;
    const slot = state.inventory.slots[slotIndex];

    if (state.cursorItem.itemId === 0) {
        // Nothing held - pick up this slot
        if (slot.itemId === 0) return; // Empty slot, nothing to do
        state.cursorItem.itemId = slot.itemId;
        state.cursorItem.count = slot.count;
        state.cursorItem.durability = slot.durability;
        slot.itemId = 0;
        slot.count = 0;
        slot.durability = 0;
        playSelect();
    } else {
        // Holding something - place it
        if (slot.itemId === 0) {
            // Slot is empty, just place it
            slot.itemId = state.cursorItem.itemId;
            slot.count = state.cursorItem.count;
            slot.durability = state.cursorItem.durability;
            state.cursorItem.itemId = 0;
            state.cursorItem.count = 0;
            state.cursorItem.durability = 0;
            playBlockPlace();
        } else if (slot.itemId === state.cursorItem.itemId && isStackable(slot.itemId)) {
            // Same item, try to stack
            const max = maxStackSize(slot.itemId);
            const canAdd = max - slot.count;
            const toAdd = Math.min(state.cursorItem.count, canAdd);
            slot.count += toAdd;
            state.cursorItem.count -= toAdd;
            if (state.cursorItem.count === 0) {
                state.cursorItem.itemId = 0;
                state.cursorItem.durability = 0;
            }
            playSelect();
        } else {
            // Different items - swap!
            const tmpId = slot.itemId;
            const tmpCount = slot.count;
            const tmpDur = slot.durability;
            slot.itemId = state.cursorItem.itemId;
            slot.count = state.cursorItem.count;
            slot.durability = state.cursorItem.durability;
            state.cursorItem.itemId = tmpId;
            state.cursorItem.count = tmpCount;
            state.cursorItem.durability = tmpDur;
            playSelect();
        }
    }
}

// Right-click: place just ONE item from cursor into slot
export function rightClickInventorySlot(slotIndex) {
    if (slotIndex < 0 || slotIndex >= TOTAL_SLOTS) return;
    if (state.cursorItem.itemId === 0) return;
    const slot = state.inventory.slots[slotIndex];

    if (slot.itemId === 0 || (slot.itemId === state.cursorItem.itemId && isStackable(slot.itemId) && slot.count < maxStackSize(slot.itemId))) {
        if (slot.itemId === 0) {
            slot.itemId = state.cursorItem.itemId;
            slot.count = 0;
            slot.durability = state.cursorItem.durability;
        }
        slot.count++;
        state.cursorItem.count--;
        if (state.cursorItem.count === 0) {
            state.cursorItem.itemId = 0;
            state.cursorItem.durability = 0;
        }
        playSelect();
    }
}

// When closing inventory, drop cursor items back into inventory
export function returnCursorItem() {
    if (state.cursorItem.itemId === 0) return;
    if (addToInventory(state.cursorItem.itemId, state.cursorItem.count)) {
        // If it was a tool, we need to find the slot and set durability
        if (ITEM_INFO[state.cursorItem.itemId] && ITEM_INFO[state.cursorItem.itemId].durability) {
            for (let i = 0; i < state.inventory.slots.length; i++) {
                if (state.inventory.slots[i].itemId === state.cursorItem.itemId && state.inventory.slots[i].durability === ITEM_INFO[state.cursorItem.itemId].durability) {
                    state.inventory.slots[i].durability = state.cursorItem.durability;
                    break;
                }
            }
        }
    }
    state.cursorItem.itemId = 0;
    state.cursorItem.count = 0;
    state.cursorItem.durability = 0;
}

// ============================================================
// ARMOR SYSTEM
// ============================================================

// Get total defense from all equipped armor
export function getArmorDefense() {
    let total = 0;
    for (const type of ARMOR_SLOT_TYPES) {
        const slot = state.inventory.armor[type];
        if (slot.itemId !== 0 && ITEM_INFO[slot.itemId]) {
            total += ITEM_INFO[slot.itemId].defense || 0;
        }
    }
    return total;
}

// Click on an armor slot: equip from cursor or unequip to cursor
export function clickArmorSlot(slotType) {
    const slot = state.inventory.armor[slotType];

    if (state.cursorItem.itemId === 0) {
        // Nothing held - pick up armor from slot
        if (slot.itemId === 0) return;
        state.cursorItem.itemId = slot.itemId;
        state.cursorItem.count = 1;
        state.cursorItem.durability = slot.durability;
        slot.itemId = 0;
        slot.count = 0;
        slot.durability = 0;
        playSelect();
    } else {
        // Holding something - try to equip it
        const info = ITEM_INFO[state.cursorItem.itemId];
        if (!info || !info.armorType || info.armorType !== slotType) return; // Wrong type!

        if (slot.itemId === 0) {
            // Empty slot - equip
            slot.itemId = state.cursorItem.itemId;
            slot.count = 1;
            slot.durability = state.cursorItem.durability;
            state.cursorItem.itemId = 0;
            state.cursorItem.count = 0;
            state.cursorItem.durability = 0;
            playBlockPlace();
        } else {
            // Swap armor pieces
            const tmpId = slot.itemId;
            const tmpDur = slot.durability;
            slot.itemId = state.cursorItem.itemId;
            slot.count = 1;
            slot.durability = state.cursorItem.durability;
            state.cursorItem.itemId = tmpId;
            state.cursorItem.count = 1;
            state.cursorItem.durability = tmpDur;
            playSelect();
        }
    }
}

// Reduce durability on all worn armor when taking damage
export function damageAllArmor() {
    for (const type of ARMOR_SLOT_TYPES) {
        const slot = state.inventory.armor[type];
        if (slot.itemId === 0) continue;
        slot.durability--;
        if (slot.durability <= 0) {
            addFloatingText(state.player.x, state.player.y - 30, `${ITEM_INFO[slot.itemId].name} broke!`, "#ff4444");
            playToolBreak();
            slot.itemId = 0;
            slot.count = 0;
            slot.durability = 0;
        }
    }
}

// Click the offhand slot: pick up or place any item
export function clickOffhandSlot() {
    const slot = state.offhand;
    if (state.cursorItem.itemId === 0) {
        if (slot.itemId === 0) return;
        state.cursorItem.itemId = slot.itemId;
        state.cursorItem.count = slot.count;
        state.cursorItem.durability = slot.durability;
        slot.itemId = 0; slot.count = 0; slot.durability = 0;
        playSelect();
    } else {
        if (slot.itemId === 0) {
            slot.itemId = state.cursorItem.itemId;
            slot.count = 1;
            slot.durability = state.cursorItem.durability || (ITEM_INFO[state.cursorItem.itemId] ? ITEM_INFO[state.cursorItem.itemId].durability || 0 : 0);
            state.cursorItem.count--;
            if (state.cursorItem.count <= 0) { state.cursorItem.itemId = 0; state.cursorItem.count = 0; state.cursorItem.durability = 0; }
            playBlockPlace();
        } else {
            const tmpId = slot.itemId, tmpCount = slot.count, tmpDur = slot.durability;
            slot.itemId = state.cursorItem.itemId;
            slot.count = 1;
            slot.durability = state.cursorItem.durability || 0;
            state.cursorItem.itemId = tmpId; state.cursorItem.count = tmpCount; state.cursorItem.durability = tmpDur;
            playSelect();
        }
    }
}

// Get the color of armor equipped in a specific slot (for drawing on player)
export function getArmorColor(slotType) {
    const slot = state.inventory.armor[slotType];
    if (slot.itemId === 0) return null;
    const info = ITEM_INFO[slot.itemId];
    return info ? info.color : null;
}
