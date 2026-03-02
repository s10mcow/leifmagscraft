// ============================================================
// INVENTORY.JS - Inventory management and crafting
// ============================================================
// Handles picking up items, storing them, and crafting.
// ============================================================

const HOTBAR_SIZE = 9;
const BACKPACK_SIZE = 18;
const TOTAL_SLOTS = HOTBAR_SIZE + BACKPACK_SIZE;

const inventory = {
    slots: Array(TOTAL_SLOTS).fill(null).map(() => ({ itemId: 0, count: 0, durability: 0 })),
    selectedSlot: 0,
    // 4 dedicated armor equipment slots
    armor: {
        helmet:     { itemId: 0, count: 0, durability: 0 },
        chestplate: { itemId: 0, count: 0, durability: 0 },
        leggings:   { itemId: 0, count: 0, durability: 0 },
        boots:      { itemId: 0, count: 0, durability: 0 }
    }
};

// The item currently "held" on the cursor while managing inventory.
// Click a slot to pick up its contents, click another to place/swap.
const cursorItem = { itemId: 0, count: 0, durability: 0 };

// Floating text popups ("+1 Cobblestone", "Tool broke!", etc.)
const floatingTexts = [];

function addFloatingText(x, y, text, color = "#ffffff") {
    floatingTexts.push({ x, y, text, color, life: 60 });
}

// Get info about equipped tool (or null if holding block/nothing)
function getEquippedTool() {
    const slot = inventory.slots[inventory.selectedSlot];
    if (slot.count === 0 || slot.itemId === 0) return null;
    if (ITEM_INFO[slot.itemId] && ITEM_INFO[slot.itemId].toolType) {
        return ITEM_INFO[slot.itemId];
    }
    return null;
}

function getEquippedTier() {
    const tool = getEquippedTool();
    return tool ? tool.tier : 0;
}

// Count total of an item across all inventory slots
function countItem(itemId) {
    let total = 0;
    for (const slot of inventory.slots) {
        if (slot.itemId === itemId) total += slot.count;
    }
    return total;
}

// Remove items from inventory (used by crafting)
function removeItems(itemId, amount) {
    let remaining = amount;
    for (let i = 0; i < inventory.slots.length && remaining > 0; i++) {
        if (inventory.slots[i].itemId === itemId) {
            const take = Math.min(inventory.slots[i].count, remaining);
            inventory.slots[i].count -= take;
            remaining -= take;
            if (inventory.slots[i].count === 0) {
                inventory.slots[i].itemId = 0;
                inventory.slots[i].durability = 0;
            }
        }
    }
}

// Add items to inventory. Returns true if successful.
function addToInventory(itemId, count = 1) {
    if (itemId === 0 || itemId === null) return false;
    const stackable = isStackable(itemId);
    const max = maxStackSize(itemId);
    let remaining = count;

    // Stack with existing slots first
    if (stackable) {
        for (let i = 0; i < inventory.slots.length && remaining > 0; i++) {
            if (inventory.slots[i].itemId === itemId && inventory.slots[i].count < max) {
                const add = Math.min(remaining, max - inventory.slots[i].count);
                inventory.slots[i].count += add;
                remaining -= add;
            }
        }
    }

    // Then find empty slots
    while (remaining > 0) {
        let found = false;
        for (let i = 0; i < inventory.slots.length; i++) {
            if (inventory.slots[i].count === 0) {
                const add = stackable ? Math.min(remaining, max) : 1;
                inventory.slots[i].itemId = itemId;
                inventory.slots[i].count = add;
                if (ITEM_INFO[itemId] && ITEM_INFO[itemId].durability) {
                    inventory.slots[i].durability = ITEM_INFO[itemId].durability;
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
function damageEquippedTool() {
    const slot = inventory.slots[inventory.selectedSlot];
    if (slot.count === 0 || !ITEM_INFO[slot.itemId] || !ITEM_INFO[slot.itemId].durability) return;
    slot.durability--;
    if (slot.durability <= 0) {
        slot.itemId = 0;
        slot.count = 0;
        slot.durability = 0;
        addFloatingText(player.x, player.y - 20, "Tool broke!", "#ff4444");
        playToolBreak();
    }
}

// Crafting
function canCraft(recipe) {
    for (const ing of recipe.ingredients) {
        if (countItem(ing.id) < ing.count) return false;
    }
    return true;
}

function craft(recipe) {
    if (!canCraft(recipe)) return;
    for (const ing of recipe.ingredients) {
        removeItems(ing.id, ing.count);
    }
    if (addToInventory(recipe.result, recipe.resultCount)) {
        addFloatingText(player.x, player.y - 30,
            `Crafted ${recipe.resultCount}x ${getItemName(recipe.result)}!`, "#4ade80");
        playCraft();
    }
}

// Eat food to restore health
function eatFood() {
    const slot = inventory.slots[inventory.selectedSlot];
    if (slot.count === 0) return;
    const info = ITEM_INFO[slot.itemId];
    if (!info || !info.food) return;
    if (player.health >= player.maxHealth) {
        addFloatingText(player.x, player.y - 20, "Already full health!", "#ffaa00");
        return;
    }
    player.health = Math.min(player.maxHealth, player.health + info.healAmount);
    addFloatingText(player.x, player.y - 20, `+${info.healAmount} HP`, "#ff6b6b");
    playEat();
    slot.count--;
    if (slot.count === 0) { slot.itemId = 0; slot.durability = 0; }
}

// ============================================================
// INVENTORY MANAGEMENT (click to move items around)
// ============================================================

// Click on an inventory slot: pick up, place, swap, or stack
function clickInventorySlot(slotIndex) {
    if (slotIndex < 0 || slotIndex >= TOTAL_SLOTS) return;
    const slot = inventory.slots[slotIndex];

    if (cursorItem.itemId === 0) {
        // Nothing held - pick up this slot
        if (slot.itemId === 0) return; // Empty slot, nothing to do
        cursorItem.itemId = slot.itemId;
        cursorItem.count = slot.count;
        cursorItem.durability = slot.durability;
        slot.itemId = 0;
        slot.count = 0;
        slot.durability = 0;
        playSelect();
    } else {
        // Holding something - place it
        if (slot.itemId === 0) {
            // Slot is empty, just place it
            slot.itemId = cursorItem.itemId;
            slot.count = cursorItem.count;
            slot.durability = cursorItem.durability;
            cursorItem.itemId = 0;
            cursorItem.count = 0;
            cursorItem.durability = 0;
            playBlockPlace();
        } else if (slot.itemId === cursorItem.itemId && isStackable(slot.itemId)) {
            // Same item, try to stack
            const max = maxStackSize(slot.itemId);
            const canAdd = max - slot.count;
            const toAdd = Math.min(cursorItem.count, canAdd);
            slot.count += toAdd;
            cursorItem.count -= toAdd;
            if (cursorItem.count === 0) {
                cursorItem.itemId = 0;
                cursorItem.durability = 0;
            }
            playSelect();
        } else {
            // Different items - swap!
            const tmpId = slot.itemId;
            const tmpCount = slot.count;
            const tmpDur = slot.durability;
            slot.itemId = cursorItem.itemId;
            slot.count = cursorItem.count;
            slot.durability = cursorItem.durability;
            cursorItem.itemId = tmpId;
            cursorItem.count = tmpCount;
            cursorItem.durability = tmpDur;
            playSelect();
        }
    }
}

// Right-click: place just ONE item from cursor into slot
function rightClickInventorySlot(slotIndex) {
    if (slotIndex < 0 || slotIndex >= TOTAL_SLOTS) return;
    if (cursorItem.itemId === 0) return;
    const slot = inventory.slots[slotIndex];

    if (slot.itemId === 0 || (slot.itemId === cursorItem.itemId && isStackable(slot.itemId) && slot.count < maxStackSize(slot.itemId))) {
        if (slot.itemId === 0) {
            slot.itemId = cursorItem.itemId;
            slot.count = 0;
            slot.durability = cursorItem.durability;
        }
        slot.count++;
        cursorItem.count--;
        if (cursorItem.count === 0) {
            cursorItem.itemId = 0;
            cursorItem.durability = 0;
        }
        playSelect();
    }
}

// When closing inventory, drop cursor items back into inventory
function returnCursorItem() {
    if (cursorItem.itemId === 0) return;
    if (addToInventory(cursorItem.itemId, cursorItem.count)) {
        // If it was a tool, we need to find the slot and set durability
        if (ITEM_INFO[cursorItem.itemId] && ITEM_INFO[cursorItem.itemId].durability) {
            for (let i = 0; i < inventory.slots.length; i++) {
                if (inventory.slots[i].itemId === cursorItem.itemId && inventory.slots[i].durability === ITEM_INFO[cursorItem.itemId].durability) {
                    inventory.slots[i].durability = cursorItem.durability;
                    break;
                }
            }
        }
    }
    cursorItem.itemId = 0;
    cursorItem.count = 0;
    cursorItem.durability = 0;
}

// ============================================================
// ARMOR SYSTEM
// ============================================================

const ARMOR_SLOT_TYPES = ["helmet", "chestplate", "leggings", "boots"];

// Get total defense from all equipped armor
function getArmorDefense() {
    let total = 0;
    for (const type of ARMOR_SLOT_TYPES) {
        const slot = inventory.armor[type];
        if (slot.itemId !== 0 && ITEM_INFO[slot.itemId]) {
            total += ITEM_INFO[slot.itemId].defense || 0;
        }
    }
    return total;
}

// Click on an armor slot: equip from cursor or unequip to cursor
function clickArmorSlot(slotType) {
    const slot = inventory.armor[slotType];

    if (cursorItem.itemId === 0) {
        // Nothing held - pick up armor from slot
        if (slot.itemId === 0) return;
        cursorItem.itemId = slot.itemId;
        cursorItem.count = 1;
        cursorItem.durability = slot.durability;
        slot.itemId = 0;
        slot.count = 0;
        slot.durability = 0;
        playSelect();
    } else {
        // Holding something - try to equip it
        const info = ITEM_INFO[cursorItem.itemId];
        if (!info || !info.armorType || info.armorType !== slotType) return; // Wrong type!

        if (slot.itemId === 0) {
            // Empty slot - equip
            slot.itemId = cursorItem.itemId;
            slot.count = 1;
            slot.durability = cursorItem.durability;
            cursorItem.itemId = 0;
            cursorItem.count = 0;
            cursorItem.durability = 0;
            playBlockPlace();
        } else {
            // Swap armor pieces
            const tmpId = slot.itemId;
            const tmpDur = slot.durability;
            slot.itemId = cursorItem.itemId;
            slot.count = 1;
            slot.durability = cursorItem.durability;
            cursorItem.itemId = tmpId;
            cursorItem.count = 1;
            cursorItem.durability = tmpDur;
            playSelect();
        }
    }
}

// Reduce durability on all worn armor when taking damage
function damageAllArmor() {
    for (const type of ARMOR_SLOT_TYPES) {
        const slot = inventory.armor[type];
        if (slot.itemId === 0) continue;
        slot.durability--;
        if (slot.durability <= 0) {
            addFloatingText(player.x, player.y - 30, `${ITEM_INFO[slot.itemId].name} broke!`, "#ff4444");
            playToolBreak();
            slot.itemId = 0;
            slot.count = 0;
            slot.durability = 0;
        }
    }
}

// Get the color of armor equipped in a specific slot (for drawing on player)
function getArmorColor(slotType) {
    const slot = inventory.armor[slotType];
    if (slot.itemId === 0) return null;
    const info = ITEM_INFO[slot.itemId];
    return info ? info.color : null;
}
