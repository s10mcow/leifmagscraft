// ============================================================
// CONSTANTS.JS - All the definitions for the game (ES Module)
// ============================================================

// --- BLOCK IDs (0-49) ---
export const BLOCKS = {
  AIR: 0, GRASS: 1, DIRT: 2, STONE: 3, COAL: 4, IRON: 5, GOLD: 6,
  DIAMOND: 7, WOOD: 8, LEAVES: 9, BEDROCK: 10, SAND: 11, WATER: 12,
  PLANKS: 13, COBBLESTONE: 14, BED: 15, SNOW: 16, ICE: 17, CACTUS: 18,
  DRY_GRASS: 19, SPRUCE_WOOD: 20, SPRUCE_LEAVES: 21, ACACIA_WOOD: 22,
  ACACIA_LEAVES: 23, TORCH: 24, EMERALD: 25, CHEST: 26,
  DOOR_CLOSED: 27, DOOR_OPEN: 28, GRAVEL: 29, LAVA: 30, OBSIDIAN: 31,
  NETHER_PORTAL: 32, NETHERRACK: 33, SOUL_SAND: 34, GLOWSTONE: 35,
  NETHER_BRICK: 36, COPPER: 37, PRESSURE_PLATE: 38,
  NETHER_WOOD: 39, NETHER_LEAVES: 40,
  WARPED_GRASS: 41, WARPED_WOOD: 42, WARPED_LEAVES: 43,
  // Wasteland blocks
  CRACKED_EARTH: 44, ASH: 45, DEAD_WOOD: 46, WASTELAND_STONE: 47, TOXIC_PUDDLE: 48,
  // Industrial/new
  BLAST_FURNACE: 49, RAW_STEEL_ORE: 50, TITANIUM_ORE: 51, URANIUM_ORE: 52,
  // Possum Realm / Candy Land
  CANDY_GROUND: 53, LOLLIPOP_TOP: 54, CANDY_CANE: 55,
  // Overworld furnace
  FURNACE: 56,
  // Silver ore
  SILVER_ORE: 57,
  // Smoker (food cooker)
  SMOKER: 58,
  // Glass
  GLASS: 59,
  // Iron doors (mobs cannot open or break)
  IRON_DOOR_CLOSED: 60,
  IRON_DOOR_OPEN: 61,
};

// --- ITEM IDs (100+) ---
export const ITEMS = {
  STICK: 100, WOODEN_PICKAXE: 101, STONE_PICKAXE: 102, IRON_PICKAXE: 103,
  GOLD_PICKAXE: 104, DIAMOND_PICKAXE: 105, WOODEN_SWORD: 106,
  STONE_SWORD: 107, IRON_SWORD: 108, GOLD_SWORD: 109, DIAMOND_SWORD: 110,
  WOODEN_AXE: 111, STONE_AXE: 112, IRON_AXE: 113, GOLD_AXE: 114,
  DIAMOND_AXE: 115, RAW_PORKCHOP: 116, BONE: 117, GUNPOWDER: 118,
  ROTTEN_FLESH: 119,
  // Armor (120-131)
  IRON_HELMET: 120, IRON_CHESTPLATE: 121, IRON_LEGGINGS: 122,
  IRON_BOOTS: 123, GOLD_HELMET: 124, GOLD_CHESTPLATE: 125,
  GOLD_LEGGINGS: 126, GOLD_BOOTS: 127, DIAMOND_HELMET: 128,
  DIAMOND_CHESTPLATE: 129, DIAMOND_LEGGINGS: 130, DIAMOND_BOOTS: 131,
  // Hazmat suit (151-154)
  HAZMAT_HELMET: 151, HAZMAT_CHESTPLATE: 152, HAZMAT_LEGGINGS: 153, HAZMAT_BOOTS: 154,
  // Mob drops
  WOOL: 132, MUTTON: 133, LEATHER: 134, STEAK: 135,
  // New items
  FLINT: 136, FLINT_AND_STEEL: 137,
  // Guns & ammo
  BULLETS: 138, PISTOL: 139, AK47: 140,
  ENDER_PEARL: 141, FEATHER: 142, RAW_CHICKEN: 143,
  ROCKET_LAUNCHER: 144, ROCKET: 145,
  HUMAN_MEAT: 146,
  MINIATURE_NETHER_PORTAL: 147,
  SHIELD: 148,
  NETHERITE_INGOT: 149,
  FLOWER: 150,
  WASTELAND_TELEPORTER: 155,
  // Steel & Titanium
  STEEL_INGOT: 156, TITANIUM_INGOT: 157,
  // Riot armor
  RIOT_HELMET: 158, RIOT_CHESTPLATE: 159, RIOT_LEGGINGS: 160, RIOT_BOOTS: 161,
  // Buckets
  BUCKET: 162, WATER_BUCKET: 163, LAVA_BUCKET: 164, TOXIC_BUCKET: 165,
  // Flamethrower
  FUEL_CANISTER: 166, FLAMETHROWER: 167,
  // Possum Realm
  POSSUM_TELEPORTER: 169,
  POSSUM_TOOTH: 170,
  POSSUM_TAIL: 171,
  // Overworld ingots (smelted in furnace)
  IRON_INGOT: 173, COPPER_INGOT: 174, GOLD_INGOT: 175,
  SILVER_INGOT: 176,
  // Cooked meats (cooked in smoker)
  COOKED_PORKCHOP: 177, COOKED_BEEF: 178, COOKED_MUTTON: 179, COOKED_CHICKEN: 180,
  // Glass bottle + water bottle
  GLASS_BOTTLE: 181, WATER_BOTTLE: 182,
  // Wool armor (warmth in cold climates)
  WOOL_HELMET: 183, WOOL_CHESTPLATE: 184, WOOL_LEGGINGS: 185, WOOL_BOOTS: 186,
  POSSUM_CANDY: 187,
  COOL_PACK: 188,
};

// --- WORLD SETTINGS ---
export const BLOCK_SIZE = 32;
export const WORLD_WIDTH = 1600;
export const WORLD_HEIGHT = 100;
export const SURFACE_LEVEL = 35;
export const SEA_LEVEL = 42;
export const GRAVITY = 0.45;
export const MAX_FALL_SPEED = 12;
export const PLAYER_REACH = 5.5;
export const SAFE_FALL_BLOCKS = 3;
export const NIGHT_THRESHOLD = 0.4;
export const TORCH_LIGHT_RADIUS = 5;
export const TORCH_SPAWN_RADIUS = 8;

// --- UI LAYOUT ---
export const UI = {
  CRAFTING_PANEL_W: 750, CRAFTING_PANEL_H: 600,
  RECIPE_W: 320, RECIPE_H: 52, RECIPE_COLS: 2, RECIPE_GAP: 15,
  RECIPE_START_X: 20, RECIPE_START_Y: 70,
  SLOT_SIZE: 36, SLOT_PAD: 3, INV_COLS: 9,
  INV_OFFSET_X: -30, ARMOR_GAP: 20, INV_BOTTOM_MARGIN: 120,
  HOTBAR_ROW_Y: -90, BACKPACK_ROW_Y: -50,
  TRADING_PANEL_W: 450, TRADING_PANEL_H: 500,
  TRADE_ROW_H: 46, TRADE_START_Y: 95, TRADE_MARGIN: 15,
  CHEST_PANEL_W: 500, CHEST_PANEL_H: 500,
  CHEST_SLOTS: 9, CHEST_SLOT_COLS: 9, CHEST_SLOT_START_Y: 70,
};
UI.INV_TOTAL_W = UI.INV_COLS * (UI.SLOT_SIZE + UI.SLOT_PAD) - UI.SLOT_PAD;

// --- SAVE SYSTEM ---
export const SAVE_KEY_PREFIX = "lm2d_save_";
export const SAVE_INDEX_KEY = "lm2d_saveIndex";
export const MAX_SAVES = 10;

// --- BIOME DEFINITIONS ---
export const BIOMES = { FOREST: 0, DESERT: 1, SAVANNAH: 2, TUNDRA: 3 };
export const NETHER_BIOMES = { CRIMSON: 0, WARPED: 1, WASTES: 2 };
export const WASTELAND_BIOMES = { FLATS: 0, BADLANDS: 1, RUINS: 2 };

export const BIOME_INFO = {
  [BIOMES.FOREST]: { name: "Forest", surfaceBlock: BLOCKS.GRASS, subSurfaceBlock: BLOCKS.DIRT, treeChance: 0.10, treeType: "oak", heightAmplitude: 1.0, heightOffset: 0 },
  [BIOMES.DESERT]: { name: "Desert", surfaceBlock: BLOCKS.SAND, subSurfaceBlock: BLOCKS.SAND, treeChance: 0.025, treeType: "cactus", heightAmplitude: 0.4, heightOffset: 2 },
  [BIOMES.SAVANNAH]: { name: "Savannah", surfaceBlock: BLOCKS.DRY_GRASS, subSurfaceBlock: BLOCKS.DIRT, treeChance: 0.04, treeType: "acacia", heightAmplitude: 0.6, heightOffset: 0 },
  [BIOMES.TUNDRA]: { name: "Tundra", surfaceBlock: BLOCKS.SNOW, subSurfaceBlock: BLOCKS.DIRT, treeChance: 0.05, treeType: "spruce", heightAmplitude: 0.8, heightOffset: -2 },
};

// --- HELPER FUNCTIONS ---
export function isBlockId(id) { return id >= 0 && id < 100; }
export function isTool(id) { return id >= 101 && id <= 115; }
export function isArmor(id) { return (id >= 120 && id <= 131) || (id >= 151 && id <= 154) || (id >= 158 && id <= 161) || (id >= 183 && id <= 186) || id === 188; }
export function isFood(id) {
  return id === ITEMS.RAW_PORKCHOP || id === ITEMS.ROTTEN_FLESH ||
         id === ITEMS.MUTTON || id === ITEMS.STEAK ||
         id === ITEMS.RAW_CHICKEN || id === ITEMS.HUMAN_MEAT ||
         id === ITEMS.COOKED_PORKCHOP || id === ITEMS.COOKED_BEEF ||
         id === ITEMS.COOKED_MUTTON || id === ITEMS.COOKED_CHICKEN;
}

export function getItemName(id) {
  if (id === 0) return "Empty";
  if (isBlockId(id) && BLOCK_INFO[id]) return BLOCK_INFO[id].name;
  if (ITEM_INFO[id]) return ITEM_INFO[id].name;
  return "Unknown";
}

export function getItemColor(id) {
  if (isBlockId(id) && BLOCK_INFO[id]) return BLOCK_INFO[id].color;
  if (ITEM_INFO[id]) return ITEM_INFO[id].color || "#888";
  return "#888";
}

export function isStackable(id) {
  if (id === 0) return false;
  if (isBlockId(id)) return true;
  if (ITEM_INFO[id]) return ITEM_INFO[id].stackable !== false;
  return true;
}

export function maxStackSize(id) {
  if (isBlockId(id)) return 64;
  if (ITEM_INFO[id] && ITEM_INFO[id].maxStack) return ITEM_INFO[id].maxStack;
  if (ITEM_INFO[id] && ITEM_INFO[id].stackable === false) return 1;
  return 64;
}

// --- BLOCK PROPERTIES ---
export const BLOCK_INFO = {
  [BLOCKS.AIR]: { name: "Air", color: null, breakable: false, mineTime: 0, toolType: null, minTier: 0, drops: null },
  [BLOCKS.GRASS]: { name: "Grass", color: "#4b8b3b", topColor: "#5dad3c", breakable: true, mineTime: 300, toolType: "shovel", minTier: 0, drops: BLOCKS.DIRT },
  [BLOCKS.DIRT]: { name: "Dirt", color: "#8b6914", breakable: true, mineTime: 250, toolType: "shovel", minTier: 0, drops: BLOCKS.DIRT },
  [BLOCKS.STONE]: { name: "Stone", color: "#808080", breakable: true, mineTime: 750, toolType: "pickaxe", minTier: 1, drops: BLOCKS.COBBLESTONE },
  [BLOCKS.COAL]: { name: "Coal Ore", color: "#505050", spots: "#2a2a2a", breakable: true, mineTime: 600, toolType: "pickaxe", minTier: 1, drops: BLOCKS.COAL },
  [BLOCKS.IRON]: { name: "Iron Ore", color: "#808080", spots: "#d4a574", breakable: true, mineTime: 900, toolType: "pickaxe", minTier: 2, drops: BLOCKS.IRON },
  [BLOCKS.GOLD]: { name: "Gold Ore", color: "#808080", spots: "#ffd700", breakable: true, mineTime: 1100, toolType: "pickaxe", minTier: 3, drops: BLOCKS.GOLD },
  [BLOCKS.DIAMOND]: { name: "Diamond Ore", color: "#808080", spots: "#4dfff3", breakable: true, mineTime: 1200, toolType: "pickaxe", minTier: 3, drops: BLOCKS.DIAMOND },
  [BLOCKS.WOOD]: { name: "Wood", color: "#8b6c42", breakable: true, mineTime: 400, toolType: "axe", minTier: 0, drops: BLOCKS.WOOD },
  [BLOCKS.LEAVES]: { name: "Leaves", color: "#2d8a4e", breakable: true, mineTime: 100, toolType: null, minTier: 0, drops: null },
  [BLOCKS.BEDROCK]: { name: "Bedrock", color: "#1a1a1a", spots: "#333333", breakable: false, mineTime: 0, toolType: null, minTier: 99, drops: null },
  [BLOCKS.SAND]: { name: "Sand", color: "#e8d68e", breakable: true, mineTime: 200, toolType: "shovel", minTier: 0, drops: BLOCKS.SAND },
  [BLOCKS.WATER]: { name: "Water", color: "#3b7dd8", breakable: false, mineTime: 0, toolType: null, minTier: 0, drops: null },
  [BLOCKS.PLANKS]: { name: "Planks", color: "#c4a047", breakable: true, mineTime: 350, toolType: "axe", minTier: 0, drops: BLOCKS.PLANKS },
  [BLOCKS.COBBLESTONE]: { name: "Cobblestone", color: "#6b6b6b", spots: "#888888", breakable: true, mineTime: 700, toolType: "pickaxe", minTier: 1, drops: BLOCKS.COBBLESTONE },
  [BLOCKS.BED]: { name: "Bed", color: "#8b4040", breakable: true, mineTime: 300, toolType: null, minTier: 0, drops: BLOCKS.BED },
  [BLOCKS.SNOW]: { name: "Snow", color: "#f0f0ff", topColor: "#ffffff", breakable: true, mineTime: 150, toolType: "shovel", minTier: 0, drops: BLOCKS.SNOW },
  [BLOCKS.ICE]: { name: "Ice", color: "#a0d8ef", breakable: true, mineTime: 250, toolType: "pickaxe", minTier: 0, drops: null },
  [BLOCKS.CACTUS]: { name: "Cactus", color: "#2d6a1e", breakable: true, mineTime: 200, toolType: null, minTier: 0, drops: BLOCKS.CACTUS },
  [BLOCKS.DRY_GRASS]: { name: "Dry Grass", color: "#8a7a3b", topColor: "#a89a4c", breakable: true, mineTime: 300, toolType: "shovel", minTier: 0, drops: BLOCKS.DIRT },
  [BLOCKS.SPRUCE_WOOD]: { name: "Spruce Wood", color: "#5a3a1e", breakable: true, mineTime: 400, toolType: "axe", minTier: 0, drops: BLOCKS.WOOD },
  [BLOCKS.SPRUCE_LEAVES]: { name: "Spruce Leaves", color: "#1a4a2a", breakable: true, mineTime: 100, toolType: null, minTier: 0, drops: null },
  [BLOCKS.ACACIA_WOOD]: { name: "Acacia Wood", color: "#a06030", breakable: true, mineTime: 400, toolType: "axe", minTier: 0, drops: BLOCKS.WOOD },
  [BLOCKS.ACACIA_LEAVES]: { name: "Acacia Leaves", color: "#7aaa3a", breakable: true, mineTime: 100, toolType: null, minTier: 0, drops: null },
  [BLOCKS.TORCH]: { name: "Torch", color: "#e8a030", breakable: true, mineTime: 0, toolType: null, minTier: 0, drops: BLOCKS.TORCH },
  [BLOCKS.EMERALD]: { name: "Emerald Ore", color: "#808080", spots: "#2dd84a", breakable: true, mineTime: 900, toolType: "pickaxe", minTier: 2, drops: BLOCKS.EMERALD },
  [BLOCKS.CHEST]: { name: "Chest", color: "#8b6c42", breakable: true, mineTime: 400, toolType: "axe", minTier: 0, drops: BLOCKS.CHEST },
  [BLOCKS.DOOR_CLOSED]: { name: "Door", color: "#8b6c42", breakable: true, mineTime: 300, toolType: "axe", minTier: 0, drops: BLOCKS.DOOR_CLOSED },
  [BLOCKS.DOOR_OPEN]: { name: "Door (Open)", color: "#8b6c42", breakable: true, mineTime: 300, toolType: "axe", minTier: 0, drops: BLOCKS.DOOR_CLOSED },
  [BLOCKS.IRON_DOOR_CLOSED]: { name: "Iron Door", color: "#aaaaaa", breakable: true, mineTime: 600, toolType: "pickaxe", minTier: 1, drops: BLOCKS.IRON_DOOR_CLOSED },
  [BLOCKS.IRON_DOOR_OPEN]: { name: "Iron Door (Open)", color: "#aaaaaa", breakable: true, mineTime: 600, toolType: "pickaxe", minTier: 1, drops: BLOCKS.IRON_DOOR_CLOSED },
  [BLOCKS.GRAVEL]: { name: "Gravel", color: "#8a8a7a", breakable: true, mineTime: 250, toolType: "shovel", minTier: 0, drops: BLOCKS.GRAVEL },
  [BLOCKS.LAVA]: { name: "Lava", color: "#e04010", breakable: false, mineTime: 0, toolType: null, minTier: 0, drops: null },
  [BLOCKS.OBSIDIAN]: { name: "Obsidian", color: "#1a0a2e", breakable: true, mineTime: 9000, toolType: "pickaxe", minTier: 4, drops: BLOCKS.OBSIDIAN },
  [BLOCKS.NETHER_PORTAL]: { name: "Nether Portal", color: "#8800cc", breakable: false, mineTime: 0, toolType: null, minTier: 0, drops: null },
  [BLOCKS.NETHERRACK]: { name: "Netherrack", color: "#703030", breakable: true, mineTime: 200, toolType: "pickaxe", minTier: 1, drops: BLOCKS.NETHERRACK },
  [BLOCKS.SOUL_SAND]: { name: "Soul Sand", color: "#4a3a2a", breakable: true, mineTime: 300, toolType: "shovel", minTier: 0, drops: BLOCKS.SOUL_SAND },
  [BLOCKS.GLOWSTONE]: { name: "Glowstone", color: "#dda520", breakable: true, mineTime: 400, toolType: null, minTier: 0, drops: BLOCKS.GLOWSTONE },
  [BLOCKS.NETHER_BRICK]: { name: "Nether Brick", color: "#3a1515", breakable: true, mineTime: 750, toolType: "pickaxe", minTier: 1, drops: BLOCKS.NETHER_BRICK },
  [BLOCKS.COPPER]: { name: "Copper Ore", color: "#808080", spots: "#e07040", breakable: true, mineTime: 600, toolType: "pickaxe", minTier: 1, drops: BLOCKS.COPPER },
  [BLOCKS.PRESSURE_PLATE]: { name: "Pressure Plate", color: "#8a8a7a", breakable: true, mineTime: 200, toolType: null, minTier: 0, drops: BLOCKS.PRESSURE_PLATE },
  [BLOCKS.NETHER_WOOD]: { name: "Nether Wood", color: "#6b1010", breakable: true, mineTime: 400, toolType: "axe", minTier: 0, drops: BLOCKS.NETHER_WOOD },
  [BLOCKS.NETHER_LEAVES]: { name: "Nether Leaves", color: "#aa1a00", breakable: true, mineTime: 100, toolType: null, minTier: 0, drops: null },
  [BLOCKS.WARPED_GRASS]: { name: "Warped Grass", color: "#1e1a3a", topColor: "#1a8abf", breakable: true, mineTime: 300, toolType: "shovel", minTier: 0, drops: BLOCKS.NETHERRACK },
  [BLOCKS.WARPED_WOOD]: { name: "Warped Wood", color: "#4a1060", breakable: true, mineTime: 400, toolType: "axe", minTier: 0, drops: BLOCKS.WARPED_WOOD },
  [BLOCKS.WARPED_LEAVES]: { name: "Warped Leaves", color: "#0e5070", breakable: true, mineTime: 100, toolType: null, minTier: 0, drops: null },
  // Wasteland blocks
  [BLOCKS.CRACKED_EARTH]: { name: "Cracked Earth", color: "#7a5a2a", topColor: "#8a6535", breakable: true, mineTime: 200, toolType: "shovel", minTier: 0, drops: BLOCKS.CRACKED_EARTH },
  [BLOCKS.ASH]: { name: "Ash", color: "#5a5555", topColor: "#6a6565", breakable: true, mineTime: 150, toolType: "shovel", minTier: 0, drops: BLOCKS.ASH },
  [BLOCKS.DEAD_WOOD]: { name: "Dead Wood", color: "#5a4030", breakable: true, mineTime: 400, toolType: "axe", minTier: 0, drops: BLOCKS.DEAD_WOOD },
  [BLOCKS.WASTELAND_STONE]: { name: "Wasteland Stone", color: "#4a4030", spots: "#6a7040", breakable: true, mineTime: 700, toolType: "pickaxe", minTier: 1, drops: BLOCKS.WASTELAND_STONE },
  [BLOCKS.TOXIC_PUDDLE]:   { name: "Toxic Puddle",   color: "#1a7020", breakable: false, mineTime: 0,    toolType: null,      minTier: 0, drops: null },
  [BLOCKS.BLAST_FURNACE]:  { name: "Blast Furnace",  color: "#5a5a5a", breakable: true,  mineTime: 1200, toolType: "pickaxe", minTier: 1, drops: BLOCKS.BLAST_FURNACE },
  [BLOCKS.RAW_STEEL_ORE]:  { name: "Raw Steel Ore",  color: "#7a8a9a", spots: "#aabac8", breakable: true,  mineTime: 2000, toolType: "pickaxe", minTier: 4, drops: BLOCKS.RAW_STEEL_ORE },
  [BLOCKS.TITANIUM_ORE]:   { name: "Titanium Ore",   color: "#111820", spots: "#1e3040", breakable: true,  mineTime: 2400, toolType: "pickaxe", minTier: 4, drops: BLOCKS.TITANIUM_ORE },
  [BLOCKS.URANIUM_ORE]:    { name: "Uranium Ore",    color: "#0d0820", spots: "#3a1a70", breakable: true,  mineTime: 2800, toolType: "pickaxe", minTier: 4, drops: BLOCKS.URANIUM_ORE },
  // Possum Realm / Candy Land
  [BLOCKS.CANDY_GROUND]:  { name: "Candy Ground",  color: "#f9a8d4", topColor: "#fce7f3", breakable: true, mineTime: 200, toolType: "shovel", minTier: 0, drops: BLOCKS.CANDY_GROUND },
  [BLOCKS.LOLLIPOP_TOP]:  { name: "Lollipop Top",  color: "#f472b6", breakable: true, mineTime: 100, toolType: null, minTier: 0, drops: null },
  [BLOCKS.CANDY_CANE]:    { name: "Candy Cane",    color: "#ef4444", breakable: true, mineTime: 350, toolType: "axe", minTier: 0, drops: BLOCKS.CANDY_CANE },
  // Overworld furnace
  [BLOCKS.FURNACE]: { name: "Furnace", color: "#5a5050", breakable: true, mineTime: 900, toolType: "pickaxe", minTier: 1, drops: BLOCKS.FURNACE },
  [BLOCKS.SILVER_ORE]: { name: "Silver Ore", color: "#8896a8", breakable: true, mineTime: 800, toolType: "pickaxe", minTier: 1, drops: BLOCKS.SILVER_ORE },
  [BLOCKS.SMOKER]:     { name: "Smoker",     color: "#4a5040", breakable: true, mineTime: 900, toolType: "pickaxe", minTier: 1, drops: BLOCKS.SMOKER },
  [BLOCKS.GLASS]:      { name: "Glass",      color: "#b8d8f0", breakable: true, mineTime: 250, toolType: null,      minTier: 0, drops: BLOCKS.GLASS },
};

// --- ITEM PROPERTIES ---
export const ITEM_INFO = {
  [ITEMS.STICK]: { name: "Stick", stackable: true, maxStack: 64 },
  [ITEMS.RAW_PORKCHOP]: { name: "Raw Porkchop", stackable: true, maxStack: 64, food: true, healAmount: 1, rawMeat: true },
  [ITEMS.BONE]: { name: "Bone", stackable: true, maxStack: 64 },
  [ITEMS.GUNPOWDER]: { name: "Gunpowder", stackable: true, maxStack: 64 },
  [ITEMS.ROTTEN_FLESH]: { name: "Rotten Flesh", stackable: true, maxStack: 64, food: true, healAmount: 2 },
  [ITEMS.HUMAN_MEAT]: { name: "Human Meat", stackable: true, maxStack: 64, food: true, healAmount: 3 },
  [ITEMS.WOODEN_PICKAXE]: { name: "Wood Pickaxe", stackable: false, toolType: "pickaxe", tier: 1, speed: 2, durability: 60, color: "#c4a047" },
  [ITEMS.STONE_PICKAXE]: { name: "Stone Pickaxe", stackable: false, toolType: "pickaxe", tier: 2, speed: 3, durability: 132, color: "#6b6b6b" },
  [ITEMS.IRON_PICKAXE]: { name: "Iron Pickaxe", stackable: false, toolType: "pickaxe", tier: 3, speed: 4, durability: 251, color: "#d4d4d4" },
  [ITEMS.GOLD_PICKAXE]: { name: "Gold Pickaxe", stackable: false, toolType: "pickaxe", tier: 3, speed: 6, durability: 33, color: "#ffd700" },
  [ITEMS.DIAMOND_PICKAXE]: { name: "Diamond Pickaxe", stackable: false, toolType: "pickaxe", tier: 4, speed: 5, durability: 500, color: "#4dfff3" },
  [ITEMS.WOODEN_SWORD]: { name: "Wood Sword", stackable: false, toolType: "sword", tier: 1, speed: 1, durability: 60, color: "#c4a047", damage: 5 },
  [ITEMS.STONE_SWORD]: { name: "Stone Sword", stackable: false, toolType: "sword", tier: 2, speed: 1, durability: 132, color: "#6b6b6b", damage: 6 },
  [ITEMS.IRON_SWORD]: { name: "Iron Sword", stackable: false, toolType: "sword", tier: 3, speed: 1, durability: 251, color: "#d4d4d4", damage: 7 },
  [ITEMS.GOLD_SWORD]: { name: "Gold Sword", stackable: false, toolType: "sword", tier: 3, speed: 1, durability: 33, color: "#ffd700", damage: 5 },
  [ITEMS.DIAMOND_SWORD]: { name: "Diamond Sword", stackable: false, toolType: "sword", tier: 4, speed: 1, durability: 500, color: "#4dfff3", damage: 8 },
  [ITEMS.WOODEN_AXE]: { name: "Wood Axe", stackable: false, toolType: "axe", tier: 1, speed: 2, durability: 60, color: "#c4a047" },
  [ITEMS.STONE_AXE]: { name: "Stone Axe", stackable: false, toolType: "axe", tier: 2, speed: 3, durability: 132, color: "#6b6b6b" },
  [ITEMS.IRON_AXE]: { name: "Iron Axe", stackable: false, toolType: "axe", tier: 3, speed: 4, durability: 251, color: "#d4d4d4" },
  [ITEMS.GOLD_AXE]: { name: "Gold Axe", stackable: false, toolType: "axe", tier: 3, speed: 6, durability: 33, color: "#ffd700" },
  [ITEMS.DIAMOND_AXE]: { name: "Diamond Axe", stackable: false, toolType: "axe", tier: 4, speed: 5, durability: 500, color: "#4dfff3" },
  [ITEMS.IRON_HELMET]: { name: "Iron Helmet", stackable: false, armorType: "helmet", defense: 1, durability: 165, color: "#d4d4d4" },
  [ITEMS.IRON_CHESTPLATE]: { name: "Iron Chestplate", stackable: false, armorType: "chestplate", defense: 2, durability: 240, color: "#d4d4d4" },
  [ITEMS.IRON_LEGGINGS]: { name: "Iron Leggings", stackable: false, armorType: "leggings", defense: 2, durability: 225, color: "#d4d4d4" },
  [ITEMS.IRON_BOOTS]: { name: "Iron Boots", stackable: false, armorType: "boots", defense: 1, durability: 195, color: "#d4d4d4" },
  [ITEMS.GOLD_HELMET]: { name: "Gold Helmet", stackable: false, armorType: "helmet", defense: 1, durability: 77, color: "#ffd700" },
  [ITEMS.GOLD_CHESTPLATE]: { name: "Gold Chestplate", stackable: false, armorType: "chestplate", defense: 1, durability: 112, color: "#ffd700" },
  [ITEMS.GOLD_LEGGINGS]: { name: "Gold Leggings", stackable: false, armorType: "leggings", defense: 1, durability: 105, color: "#ffd700" },
  [ITEMS.GOLD_BOOTS]: { name: "Gold Boots", stackable: false, armorType: "boots", defense: 1, durability: 91, color: "#ffd700" },
  [ITEMS.DIAMOND_HELMET]: { name: "Diamond Helmet", stackable: false, armorType: "helmet", defense: 2, durability: 363, color: "#4dfff3" },
  [ITEMS.DIAMOND_CHESTPLATE]: { name: "Diamond Chestplate", stackable: false, armorType: "chestplate", defense: 3, durability: 528, color: "#4dfff3" },
  [ITEMS.DIAMOND_LEGGINGS]: { name: "Diamond Leggings", stackable: false, armorType: "leggings", defense: 2, durability: 495, color: "#4dfff3" },
  [ITEMS.DIAMOND_BOOTS]: { name: "Diamond Boots", stackable: false, armorType: "boots", defense: 1, durability: 429, color: "#4dfff3" },
  [ITEMS.HAZMAT_HELMET]:     { name: "Hazmat Helmet",     stackable: false, armorType: "helmet",     defense: 2, durability: 180, color: "#e8e820", radiation: true },
  [ITEMS.HAZMAT_CHESTPLATE]: { name: "Hazmat Chestplate", stackable: false, armorType: "chestplate", defense: 3, durability: 270, color: "#e8e820", radiation: true },
  [ITEMS.HAZMAT_LEGGINGS]:   { name: "Hazmat Leggings",   stackable: false, armorType: "leggings",   defense: 2, durability: 240, color: "#e8e820", radiation: true },
  [ITEMS.HAZMAT_BOOTS]:      { name: "Hazmat Boots",      stackable: false, armorType: "boots",      defense: 1, durability: 210, color: "#e8e820", radiation: true },
  [ITEMS.WOOL]: { name: "Wool", stackable: true, maxStack: 64 },
  [ITEMS.MUTTON]: { name: "Raw Mutton", stackable: true, maxStack: 64, food: true, healAmount: 1, rawMeat: true },
  [ITEMS.LEATHER]: { name: "Leather", stackable: true, maxStack: 64 },
  [ITEMS.STEAK]: { name: "Raw Beef", stackable: true, maxStack: 64, food: true, healAmount: 1, rawMeat: true },
  [ITEMS.FLINT]: { name: "Flint", stackable: true, maxStack: 64 },
  [ITEMS.FLINT_AND_STEEL]: { name: "Flint & Steel", stackable: false, toolType: "flint_steel", tier: 0, speed: 1, durability: 64, color: "#888888" },
  [ITEMS.BULLETS]: { name: "Bullets", stackable: true, maxStack: 64 },
  [ITEMS.PISTOL]: { name: "Pistol", stackable: false, toolType: "gun", tier: 1, speed: 1, durability: 200, damage: 6, color: "#888888", fireRate: 600, magSize: 8, reloadTime: 1800 },
  [ITEMS.AK47]: { name: "AK-47", stackable: false, toolType: "gun", tier: 2, speed: 1, durability: 400, damage: 4, color: "#5a5a3a", fireRate: 150, magSize: 24, reloadTime: 3000 },
  [ITEMS.ENDER_PEARL]: { name: "Ender Pearl", stackable: true, maxStack: 16 },
  [ITEMS.FEATHER]: { name: "Feather", stackable: true, maxStack: 64 },
  [ITEMS.RAW_CHICKEN]: { name: "Raw Chicken", stackable: true, maxStack: 64, food: true, healAmount: 1, rawMeat: true },
  [ITEMS.ROCKET_LAUNCHER]: { name: "Rocket Launcher", stackable: false, toolType: "gun", tier: 3, speed: 1, durability: 100, damage: 12, color: "#556b2f", fireRate: 1500, ammoType: "rocket", magSize: 1, reloadTime: 3000 },
  [ITEMS.ROCKET]: { name: "Rocket", stackable: true, maxStack: 16 },
  [ITEMS.MINIATURE_NETHER_PORTAL]: { name: "Miniature Nether Portal", stackable: false, color: "#8800cc" },
  [ITEMS.SHIELD]: { name: "Shield", stackable: false, durability: 336, color: "#8b6c42" },
  [ITEMS.NETHERITE_INGOT]: { name: "Netherite Ingot", stackable: true, maxStack: 64, color: "#444455" },
  [ITEMS.FLOWER]: { name: "Flower", stackable: true, maxStack: 64, color: "#ff6688" },
  [ITEMS.WASTELAND_TELEPORTER]: { name: "Wasteland Teleporter", stackable: false, color: "#c8a030" },
  // Steel & Titanium ingots
  [ITEMS.STEEL_INGOT]:    { name: "Steel Ingot",    stackable: true, maxStack: 64, color: "#8a9aaa" },
  [ITEMS.TITANIUM_INGOT]: { name: "Titanium Ingot", stackable: true, maxStack: 64, color: "#aac4e0" },
  // Riot armor — heavy defense + 15% bullet resistance per piece (60% total for full set)
  [ITEMS.RIOT_HELMET]:     { name: "Riot Helmet",     stackable: false, armorType: "helmet",     defense: 3, durability: 350, color: "#3a4a5a", bulletResistance: 0.15 },
  [ITEMS.RIOT_CHESTPLATE]: { name: "Riot Chestplate", stackable: false, armorType: "chestplate", defense: 5, durability: 520, color: "#3a4a5a", bulletResistance: 0.15 },
  [ITEMS.RIOT_LEGGINGS]:   { name: "Riot Leggings",   stackable: false, armorType: "leggings",   defense: 4, durability: 480, color: "#3a4a5a", bulletResistance: 0.15 },
  [ITEMS.RIOT_BOOTS]:      { name: "Riot Boots",      stackable: false, armorType: "boots",      defense: 2, durability: 400, color: "#3a4a5a", bulletResistance: 0.15 },
  // Buckets
  [ITEMS.BUCKET]:       { name: "Bucket",       stackable: false, color: "#aaaaaa" },
  [ITEMS.WATER_BUCKET]: { name: "Water Bucket", stackable: false, color: "#4488ff" },
  [ITEMS.LAVA_BUCKET]:  { name: "Lava Bucket",  stackable: false, color: "#ff6600" },
  [ITEMS.TOXIC_BUCKET]:  { name: "Toxic Bucket",  stackable: false, color: "#40cc40" },
  // Flamethrower
  [ITEMS.FUEL_CANISTER]: { name: "Fuel Canister", stackable: true, maxStack: 10, color: "#d4a820" },
  [ITEMS.FLAMETHROWER]:  { name: "Flamethrower",  stackable: false, toolType: "gun", tier: 3, speed: 1, durability: 300, damage: 5, color: "#4a2a10", fireRate: 80, ammoType: "fuel", magSize: 60, reloadTime: 2500 },
  // Possum Realm
  [ITEMS.POSSUM_TELEPORTER]: { name: "Possum Teleporter", stackable: false, color: "#e8a0d0" },
  [ITEMS.POSSUM_TOOTH]: { name: "Possum's Tooth", stackable: true, maxStack: 16, color: "#fffff0" },
  [ITEMS.POSSUM_TAIL]: { name: "Possum's Tail", stackable: true, maxStack: 16, color: "#ccbbaa" },
  // Glass bottles
  [ITEMS.GLASS_BOTTLE]: { name: "Glass Bottle",  stackable: true,  maxStack: 16, color: "#b8d8f0" },
  [ITEMS.WATER_BOTTLE]: { name: "Water Bottle",  stackable: false, color: "#4090e0" },
  // Wool armor (low defense, keeps you warm)
  [ITEMS.WOOL_HELMET]:     { name: "Wool Hat",      stackable: false, armorType: "helmet",     defense: 1, durability: 80,  color: "#f0f0f0", warmth: true },
  [ITEMS.WOOL_CHESTPLATE]: { name: "Wool Sweater",  stackable: false, armorType: "chestplate", defense: 2, durability: 120, color: "#f0f0f0", warmth: true },
  [ITEMS.WOOL_LEGGINGS]:   { name: "Wool Pants",    stackable: false, armorType: "leggings",   defense: 1, durability: 100, color: "#f0f0f0", warmth: true },
  [ITEMS.WOOL_BOOTS]:      { name: "Wool Boots",    stackable: false, armorType: "boots",      defense: 1, durability: 70,  color: "#f0f0f0", warmth: true },
  [ITEMS.POSSUM_CANDY]:   { name: "Possum Candy",  stackable: true,  maxStack: 16, food: true, healAmount: 2, candyBuff: true, color: "#ff44cc" },
  [ITEMS.COOL_PACK]:      { name: "Cool Pack",     stackable: false, armorType: "boots", defense: 1, durability: 300, color: "#c0c8d8", coolPack: true },
  // Cooked meats
  [ITEMS.COOKED_PORKCHOP]: { name: "Cooked Porkchop", stackable: true, maxStack: 64, food: true, healAmount: 6 },
  [ITEMS.COOKED_BEEF]:     { name: "Cooked Beef",     stackable: true, maxStack: 64, food: true, healAmount: 8 },
  [ITEMS.COOKED_MUTTON]:   { name: "Cooked Mutton",   stackable: true, maxStack: 64, food: true, healAmount: 5 },
  [ITEMS.COOKED_CHICKEN]:  { name: "Cooked Chicken",  stackable: true, maxStack: 64, food: true, healAmount: 6 },
  // Overworld ingots
  [ITEMS.IRON_INGOT]:   { name: "Iron Ingot",   stackable: true, maxStack: 64, color: "#d4d4d4" },
  [ITEMS.COPPER_INGOT]: { name: "Copper Ingot", stackable: true, maxStack: 64, color: "#e07040" },
  [ITEMS.GOLD_INGOT]:   { name: "Gold Ingot",   stackable: true, maxStack: 64, color: "#ffd700" },
  [ITEMS.SILVER_INGOT]: { name: "Silver Ingot", stackable: true, maxStack: 64, color: "#c0c8d8" },
};

// --- MOB DEFINITIONS ---
export const MOB_DEFS = {
  zombie: { name: "Zombie", width: 24, height: 46, maxHealth: 20, speed: 0.5, damage: 3, hostile: true, detectRange: 16, attackRange: 32, knockback: 5, drops: [{ id: ITEMS.ROTTEN_FLESH, min: 1, max: 3 }] },
  skeleton: { name: "Skeleton", width: 22, height: 46, maxHealth: 20, speed: 1.3, damage: 3, hostile: true, detectRange: 16, attackRange: 450, shootInterval: 2000, knockback: 4, drops: [{ id: ITEMS.BONE, min: 0, max: 2 }] },
  creeper: { name: "Creeper", width: 20, height: 42, maxHealth: 20, speed: 1.0, damage: 12, hostile: true, detectRange: 16, fuseRange: 96, fuseTime: 1500, explosionRadius: 3, knockback: 8, drops: [{ id: ITEMS.GUNPOWDER, min: 0, max: 2 }] },
  pig: { name: "Pig", width: 30, height: 22, maxHealth: 10, speed: 0.8, damage: 0, hostile: false, knockback: 3, drops: [{ id: ITEMS.RAW_PORKCHOP, min: 1, max: 3 }] },
  cow: { name: "Cow", width: 30, height: 22, maxHealth: 10, speed: 0.8, damage: 0, hostile: false, knockback: 3, drops: [{ id: ITEMS.LEATHER, min: 1, max: 2 }, { id: ITEMS.STEAK, min: 1, max: 3 }] },
  sheep: { name: "Sheep", width: 28, height: 20, maxHealth: 8, speed: 0.9, damage: 0, hostile: false, knockback: 3, drops: [{ id: ITEMS.WOOL, min: 1, max: 3 }, { id: ITEMS.MUTTON, min: 1, max: 2 }] },
  villager: { name: "Villager", width: 24, height: 46, maxHealth: 20, speed: 0.4, damage: 0, hostile: false, knockback: 2, drops: [{ id: ITEMS.HUMAN_MEAT, min: 1, max: 3 }] },
  husk: { name: "Husk", width: 24, height: 46, maxHealth: 22, speed: 0.8, damage: 4, hostile: true, detectRange: 16, attackRange: 32, knockback: 5, drops: [{ id: ITEMS.ROTTEN_FLESH, min: 0, max: 2 }] },
  enderman: { name: "Enderman", width: 20, height: 56, maxHealth: 40, speed: 1.5, damage: 7, hostile: true, detectRange: 12, attackRange: 40, knockback: 6, teleportCooldown: 3000, drops: [{ id: ITEMS.ENDER_PEARL, min: 1, max: 1 }] },
  spider: { name: "Spider", width: 32, height: 18, maxHealth: 16, speed: 1.2, damage: 3, hostile: true, detectRange: 12, attackRange: 32, knockback: 4, drops: [{ id: ITEMS.FEATHER, min: 0, max: 2 }] },
  chicken: { name: "Chicken", width: 16, height: 16, maxHealth: 4, speed: 0.7, damage: 0, hostile: false, knockback: 5, drops: [{ id: ITEMS.FEATHER, min: 1, max: 2 }, { id: ITEMS.RAW_CHICKEN, min: 1, max: 1 }] },
  wolf: { name: "Wolf", width: 28, height: 22, maxHealth: 20, speed: 2.2, damage: 4, hostile: false, knockback: 4, drops: [] },
  pigman: { name: "Pigman", width: 24, height: 46, maxHealth: 20, speed: 0.9, damage: 5, hostile: true, detectRange: 16, attackRange: 350, shootInterval: 2500, knockback: 5, drops: [{ id: BLOCKS.GOLD, min: 0, max: 2 }] },
  ghast: { name: "Ghast", width: 56, height: 56, maxHealth: 30, speed: 1.5, damage: 8, hostile: true, detectRange: 20, attackRange: 500, shootInterval: 3000, knockback: 0, drops: [{ id: BLOCKS.GLOWSTONE, min: 1, max: 2 }] },
  iron_golem: { name: "Iron Golem", width: 32, height: 54, maxHealth: 100, speed: 0.55, damage: 10, hostile: false, knockback: 10, detectRange: 16, attackRange: 55, drops: [{ id: BLOCKS.IRON, min: 1, max: 5 }, { id: ITEMS.FLOWER, min: 1, max: 1, chance: 0.1 }] },
  grunture: { name: "Grunture", width: 48, height: 56, maxHealth: 160, speed: 3.2, damage: 5, fireDamage: 7, hostile: true, detectRange: 18, attackRange: 60, shootRange: 420, shootInterval: 2600, knockback: 10, drops: [{ id: BLOCKS.GLOWSTONE, min: 2, max: 5 }, { id: ITEMS.GUNPOWDER, min: 0, max: 2, chance: 0.7 }, { id: ITEMS.WASTELAND_TELEPORTER, min: 1, max: 1, chance: 0.35 }] },
  raider:    { name: "Raider",        width: 24, height: 46, maxHealth: 30, speed: 1.2, damage: 4, hostile: true,  detectRange: 18,   attackRange: 380, shootInterval: 150, knockback: 5, drops: [{ id: ITEMS.GUNPOWDER, min: 0, max: 2 }, { id: ITEMS.BULLETS, min: 5, max: 15 }, { id: ITEMS.AK47, min: 1, max: 1, chance: 0.12 }] },
  companion: { name: "The Companion", width: 24, height: 46, maxHealth: 60,  speed: 3.0, damage: 3, hostile: false, detectRange: 0,    attackRange: 36,  knockback: 4, drops: [] },
  glitched:  { name: "The Glitched",  width: 24, height: 46, maxHealth: 200, speed: 5.5, damage: 8, hostile: true,  detectRange: 9999, attackRange: 40,  knockback: 6, drops: [] },
  possum:    { name: "Possum",         width: 26, height: 16, maxHealth: 8,   speed: 1.0, damage: 0, hostile: false, knockback: 2, drops: [{ id: ITEMS.FLOWER, min: 1, max: 2 }] },
  possum_protector: { name: "Possum Protector", width: 56, height: 66, maxHealth: 1280, speed: 2.5, damage: 12, hostile: true, detectRange: 9999, attackRange: 64, squeezeRange: 80, knockback: 8, drops: [{ id: ITEMS.FLOWER, min: 5, max: 10 }, { id: BLOCKS.DIAMOND, min: 1, max: 3, chance: 0.5 }, { id: ITEMS.POSSUM_TOOTH, min: 1, max: 1 }, { id: ITEMS.POSSUM_TAIL, min: 1, max: 1 }] },
  possum_god: { name: "The Possum God", width: 80, height: 90, maxHealth: 64000, speed: 7.5, damage: 10, hostile: true, detectRange: 9999, attackRange: 80, knockback: 14, drops: [{ id: BLOCKS.DIAMOND, min: 10, max: 20 }, { id: ITEMS.POSSUM_TOOTH, min: 3, max: 5 }] },
};

// --- CRAFTING RECIPES ---
export const RECIPES = [
  { result: BLOCKS.PLANKS, resultCount: 4, ingredients: [{ id: BLOCKS.WOOD, count: 1 }] },
  { result: ITEMS.STICK, resultCount: 4, ingredients: [{ id: BLOCKS.PLANKS, count: 2 }] },
  { result: ITEMS.WOODEN_PICKAXE, resultCount: 1, ingredients: [{ id: BLOCKS.PLANKS, count: 3 }, { id: ITEMS.STICK, count: 2 }] },
  { result: ITEMS.WOODEN_SWORD, resultCount: 1, ingredients: [{ id: BLOCKS.PLANKS, count: 2 }, { id: ITEMS.STICK, count: 1 }] },
  { result: ITEMS.WOODEN_AXE, resultCount: 1, ingredients: [{ id: BLOCKS.PLANKS, count: 3 }, { id: ITEMS.STICK, count: 2 }] },
  { result: ITEMS.STONE_PICKAXE, resultCount: 1, ingredients: [{ id: BLOCKS.COBBLESTONE, count: 3 }, { id: ITEMS.STICK, count: 2 }] },
  { result: ITEMS.STONE_SWORD, resultCount: 1, ingredients: [{ id: BLOCKS.COBBLESTONE, count: 2 }, { id: ITEMS.STICK, count: 1 }] },
  { result: ITEMS.STONE_AXE, resultCount: 1, ingredients: [{ id: BLOCKS.COBBLESTONE, count: 3 }, { id: ITEMS.STICK, count: 2 }] },
  { result: ITEMS.IRON_PICKAXE, resultCount: 1, ingredients: [{ id: ITEMS.IRON_INGOT, count: 3 }, { id: ITEMS.STICK, count: 2 }] },
  { result: ITEMS.IRON_SWORD, resultCount: 1, ingredients: [{ id: ITEMS.IRON_INGOT, count: 2 }, { id: ITEMS.STICK, count: 1 }] },
  { result: ITEMS.IRON_AXE, resultCount: 1, ingredients: [{ id: ITEMS.IRON_INGOT, count: 3 }, { id: ITEMS.STICK, count: 2 }] },
  { result: ITEMS.GOLD_PICKAXE, resultCount: 1, ingredients: [{ id: ITEMS.GOLD_INGOT, count: 3 }, { id: ITEMS.STICK, count: 2 }] },
  { result: ITEMS.GOLD_SWORD, resultCount: 1, ingredients: [{ id: ITEMS.GOLD_INGOT, count: 2 }, { id: ITEMS.STICK, count: 1 }] },
  { result: ITEMS.GOLD_AXE, resultCount: 1, ingredients: [{ id: ITEMS.GOLD_INGOT, count: 3 }, { id: ITEMS.STICK, count: 2 }] },
  { result: ITEMS.DIAMOND_PICKAXE, resultCount: 1, ingredients: [{ id: BLOCKS.DIAMOND, count: 3 }, { id: ITEMS.STICK, count: 2 }] },
  { result: ITEMS.DIAMOND_SWORD, resultCount: 1, ingredients: [{ id: BLOCKS.DIAMOND, count: 2 }, { id: ITEMS.STICK, count: 1 }] },
  { result: ITEMS.DIAMOND_AXE, resultCount: 1, ingredients: [{ id: BLOCKS.DIAMOND, count: 3 }, { id: ITEMS.STICK, count: 2 }] },
  { result: BLOCKS.TORCH, resultCount: 4, ingredients: [{ id: ITEMS.STICK, count: 1 }, { id: BLOCKS.COAL, count: 1 }] },
  { result: BLOCKS.BED, resultCount: 1, ingredients: [{ id: BLOCKS.PLANKS, count: 3 }, { id: ITEMS.WOOL, count: 3 }] },
  { result: ITEMS.IRON_HELMET, resultCount: 1, ingredients: [{ id: ITEMS.IRON_INGOT, count: 5 }] },
  { result: ITEMS.IRON_CHESTPLATE, resultCount: 1, ingredients: [{ id: ITEMS.IRON_INGOT, count: 8 }] },
  { result: ITEMS.IRON_LEGGINGS, resultCount: 1, ingredients: [{ id: ITEMS.IRON_INGOT, count: 7 }] },
  { result: ITEMS.IRON_BOOTS, resultCount: 1, ingredients: [{ id: ITEMS.IRON_INGOT, count: 4 }] },
  { result: ITEMS.GOLD_HELMET, resultCount: 1, ingredients: [{ id: ITEMS.GOLD_INGOT, count: 5 }] },
  { result: ITEMS.GOLD_CHESTPLATE, resultCount: 1, ingredients: [{ id: ITEMS.GOLD_INGOT, count: 8 }] },
  { result: ITEMS.GOLD_LEGGINGS, resultCount: 1, ingredients: [{ id: ITEMS.GOLD_INGOT, count: 7 }] },
  { result: ITEMS.GOLD_BOOTS, resultCount: 1, ingredients: [{ id: ITEMS.GOLD_INGOT, count: 4 }] },
  { result: ITEMS.DIAMOND_HELMET, resultCount: 1, ingredients: [{ id: BLOCKS.DIAMOND, count: 5 }] },
  { result: ITEMS.DIAMOND_CHESTPLATE, resultCount: 1, ingredients: [{ id: BLOCKS.DIAMOND, count: 8 }] },
  { result: ITEMS.DIAMOND_LEGGINGS, resultCount: 1, ingredients: [{ id: BLOCKS.DIAMOND, count: 7 }] },
  { result: ITEMS.DIAMOND_BOOTS, resultCount: 1, ingredients: [{ id: BLOCKS.DIAMOND, count: 4 }] },
  { result: ITEMS.HAZMAT_HELMET,     resultCount: 1, ingredients: [{ id: BLOCKS.GLOWSTONE, count: 5 }] },
  { result: ITEMS.HAZMAT_CHESTPLATE, resultCount: 1, ingredients: [{ id: BLOCKS.GLOWSTONE, count: 8 }] },
  { result: ITEMS.HAZMAT_LEGGINGS,   resultCount: 1, ingredients: [{ id: BLOCKS.GLOWSTONE, count: 7 }] },
  { result: ITEMS.HAZMAT_BOOTS,      resultCount: 1, ingredients: [{ id: BLOCKS.GLOWSTONE, count: 1 }] },
  { result: BLOCKS.CHEST, resultCount: 1, ingredients: [{ id: BLOCKS.PLANKS, count: 4 }] },
  { result: BLOCKS.DOOR_CLOSED, resultCount: 1, ingredients: [{ id: BLOCKS.PLANKS, count: 6 }] },
  { result: BLOCKS.IRON_DOOR_CLOSED, resultCount: 1, ingredients: [{ id: ITEMS.IRON_INGOT, count: 6 }] },
  { result: BLOCKS.PRESSURE_PLATE, resultCount: 1, ingredients: [{ id: BLOCKS.COBBLESTONE, count: 2 }] },
  { result: ITEMS.FLINT_AND_STEEL, resultCount: 1, ingredients: [{ id: ITEMS.FLINT, count: 1 }, { id: ITEMS.IRON_INGOT, count: 1 }] },
  { result: ITEMS.PISTOL, resultCount: 1, ingredients: [{ id: ITEMS.IRON_INGOT, count: 2 }, { id: ITEMS.COPPER_INGOT, count: 1 }, { id: ITEMS.GUNPOWDER, count: 1 }] },
  { result: ITEMS.AK47, resultCount: 1, resultDurability: 80,   ingredients: [{ id: ITEMS.IRON_INGOT, count: 4 }, { id: ITEMS.COPPER_INGOT, count: 2 }, { id: ITEMS.GUNPOWDER, count: 1 }] },
  { result: ITEMS.AK47, resultCount: 1, resultDurability: 2000, ingredients: [{ id: ITEMS.STEEL_INGOT, count: 4 }, { id: ITEMS.COPPER_INGOT, count: 2 }, { id: ITEMS.GUNPOWDER, count: 1 }] },
  { result: ITEMS.BULLETS, resultCount: 24, ingredients: [{ id: ITEMS.IRON_INGOT, count: 1 }, { id: ITEMS.COPPER_INGOT, count: 1 }, { id: ITEMS.GUNPOWDER, count: 1 }] },
  { result: ITEMS.ROCKET_LAUNCHER, resultCount: 1, resultDurability: 30,  ingredients: [{ id: ITEMS.IRON_INGOT,   count: 2 }, { id: ITEMS.COPPER_INGOT, count: 2 }, { id: ITEMS.GUNPOWDER, count: 2 }] },
  { result: ITEMS.ROCKET_LAUNCHER, resultCount: 1, resultDurability: 800, ingredients: [{ id: ITEMS.STEEL_INGOT, count: 2 }, { id: ITEMS.COPPER_INGOT, count: 2 }, { id: ITEMS.GUNPOWDER, count: 2 }] },
  { result: ITEMS.FUEL_CANISTER,   resultCount: 1, ingredients: [{ id: ITEMS.IRON_INGOT, count: 1 }, { id: ITEMS.TOXIC_BUCKET, count: 1 }] },
  { result: ITEMS.FLAMETHROWER,    resultCount: 1, ingredients: [{ id: ITEMS.GUNPOWDER, count: 1 }, { id: ITEMS.STEEL_INGOT, count: 4 }, { id: ITEMS.TITANIUM_INGOT, count: 2 }, { id: ITEMS.FUEL_CANISTER, count: 1 }] },
  { result: ITEMS.ROCKET, resultCount: 4, ingredients: [{ id: ITEMS.IRON_INGOT, count: 1 }, { id: ITEMS.GUNPOWDER, count: 1 }] },
  { result: ITEMS.MINIATURE_NETHER_PORTAL, resultCount: 1, ingredients: [{ id: BLOCKS.OBSIDIAN, count: 4 }, { id: ITEMS.FLINT_AND_STEEL, count: 1 }] },
  { result: ITEMS.WASTELAND_TELEPORTER, resultCount: 1, ingredients: [{ id: BLOCKS.COBBLESTONE, count: 24 }, { id: BLOCKS.OBSIDIAN, count: 4 }] },
  { result: ITEMS.POSSUM_TELEPORTER, resultCount: 1, ingredients: [{ id: ITEMS.RAW_PORKCHOP, count: 10 }, { id: ITEMS.STEAK, count: 10 }, { id: BLOCKS.GLOWSTONE, count: 5 }] },
  { result: ITEMS.SHIELD, resultCount: 1, ingredients: [{ id: BLOCKS.PLANKS, count: 6 }, { id: ITEMS.IRON_INGOT, count: 1 }] },
  // Furnace
  { result: BLOCKS.FURNACE, resultCount: 1, ingredients: [{ id: BLOCKS.COBBLESTONE, count: 8 }] },
  // Smoker (food cooker)
  { result: BLOCKS.SMOKER, resultCount: 1, ingredients: [{ id: BLOCKS.WOOD, count: 8 }] },
  // Blast furnace
  { result: BLOCKS.BLAST_FURNACE, resultCount: 1, ingredients: [{ id: ITEMS.IRON_INGOT, count: 5 }, { id: BLOCKS.COBBLESTONE, count: 8 }] },
  // Riot armor (steel ingots)
  { result: ITEMS.RIOT_HELMET,     resultCount: 1, ingredients: [{ id: ITEMS.TITANIUM_INGOT, count: 5 }] },
  { result: ITEMS.RIOT_CHESTPLATE, resultCount: 1, ingredients: [{ id: ITEMS.TITANIUM_INGOT, count: 8 }] },
  { result: ITEMS.RIOT_LEGGINGS,   resultCount: 1, ingredients: [{ id: ITEMS.TITANIUM_INGOT, count: 7 }] },
  { result: ITEMS.RIOT_BOOTS,      resultCount: 1, ingredients: [{ id: ITEMS.TITANIUM_INGOT, count: 4 }] },
  // Bucket
  { result: ITEMS.BUCKET, resultCount: 1, ingredients: [{ id: ITEMS.IRON_INGOT, count: 3 }] },
  // Glass bottle (3 glass)
  { result: ITEMS.GLASS_BOTTLE, resultCount: 1, ingredients: [{ id: BLOCKS.GLASS, count: 3 }] },
  // Wool armor
  { result: ITEMS.WOOL_HELMET,     resultCount: 1, ingredients: [{ id: ITEMS.WOOL, count: 5 }] },
  { result: ITEMS.WOOL_CHESTPLATE, resultCount: 1, ingredients: [{ id: ITEMS.WOOL, count: 8 }] },
  { result: ITEMS.WOOL_LEGGINGS,   resultCount: 1, ingredients: [{ id: ITEMS.WOOL, count: 7 }] },
  { result: ITEMS.WOOL_BOOTS,      resultCount: 1, ingredients: [{ id: ITEMS.WOOL, count: 4 }] },
  // Cool Pack (silver boots — keeps you cool)
  { result: ITEMS.COOL_PACK, resultCount: 1, ingredients: [{ id: ITEMS.SILVER_INGOT, count: 6 }] },
];

// --- SMELTING RECIPES (blast furnace) ---
export const SMELTING_RECIPES = [
  { input: BLOCKS.RAW_STEEL_ORE, output: ITEMS.STEEL_INGOT,    outputCount: 1 },
  { input: BLOCKS.TITANIUM_ORE,  output: ITEMS.TITANIUM_INGOT, outputCount: 1 },
];

// --- FURNACE RECIPES (overworld furnace) ---
export const FURNACE_RECIPES = [
  { input: BLOCKS.IRON,       output: ITEMS.IRON_INGOT,   smeltTime: 3000 },
  { input: BLOCKS.COPPER,     output: ITEMS.COPPER_INGOT, smeltTime: 3000 },
  { input: BLOCKS.GOLD,       output: ITEMS.GOLD_INGOT,   smeltTime: 5000 },
  { input: BLOCKS.SILVER_ORE, output: ITEMS.SILVER_INGOT, smeltTime: 4000 },
  { input: BLOCKS.SAND,       output: BLOCKS.GLASS,       smeltTime: 2000 },
];

// Food cooking recipes (used by Smoker)
export const FOOD_RECIPES = [
  { input: ITEMS.RAW_PORKCHOP, output: ITEMS.COOKED_PORKCHOP, cookTime: 2000 },
  { input: ITEMS.STEAK,        output: ITEMS.COOKED_BEEF,     cookTime: 2000 },
  { input: ITEMS.MUTTON,       output: ITEMS.COOKED_MUTTON,   cookTime: 2000 },
  { input: ITEMS.RAW_CHICKEN,  output: ITEMS.COOKED_CHICKEN,  cookTime: 2000 },
];

// Fuel values in ms (how long one item burns)
export const FUEL_VALUES = {
  [BLOCKS.COAL]:         24000, // 8 smelt-cycles worth of fuel
  [BLOCKS.WOOD]:          8000, // 4 food cooks
  [BLOCKS.SPRUCE_WOOD]:   8000,
  [BLOCKS.ACACIA_WOOD]:   8000,
  [BLOCKS.NETHER_WOOD]:   8000,
  [BLOCKS.WARPED_WOOD]:   8000,
  [BLOCKS.DEAD_WOOD]:     8000,
  [BLOCKS.PLANKS]:        4000, // 2 food cooks
};

// --- VILLAGER TRADES ---
export const TRADES = [
  { cost: 1, result: BLOCKS.TORCH, resultCount: 4 },
  { cost: 1, result: ITEMS.STEAK, resultCount: 2 },
  { cost: 2, result: BLOCKS.PLANKS, resultCount: 8 },
  { cost: 2, result: ITEMS.IRON_PICKAXE, resultCount: 1 },
  { cost: 3, result: ITEMS.IRON_SWORD, resultCount: 1 },
  { cost: 4, result: ITEMS.IRON_HELMET, resultCount: 1 },
  { cost: 5, result: BLOCKS.DIAMOND, resultCount: 1 },
  { cost: 6, result: ITEMS.IRON_CHESTPLATE, resultCount: 1 },
];

// --- VILLAGER PROFESSION TRADE SETS ---
export const TRADE_SETS = {
    blacksmith: [
        { cost: 2, result: ITEMS.IRON_PICKAXE, resultCount: 1 },
        { cost: 3, result: ITEMS.IRON_SWORD, resultCount: 1 },
        { cost: 4, result: ITEMS.IRON_HELMET, resultCount: 1 },
        { cost: 5, result: ITEMS.IRON_CHESTPLATE, resultCount: 1 },
        { cost: 5, result: ITEMS.IRON_LEGGINGS, resultCount: 1 },
        { cost: 6, result: BLOCKS.DIAMOND, resultCount: 1 },
    ],
    merchant: [
        { cost: 1, result: BLOCKS.TORCH, resultCount: 6 },
        { cost: 1, result: BLOCKS.PLANKS, resultCount: 12 },
        { cost: 2, result: ITEMS.IRON_AXE, resultCount: 1 },
        { cost: 3, result: ITEMS.STONE_PICKAXE, resultCount: 1 },
        { cost: 4, result: ITEMS.GOLD_PICKAXE, resultCount: 1 },
        { cost: 5, result: ITEMS.SHIELD, resultCount: 1 },
    ],
    farmer: [
        { cost: 1, result: ITEMS.STEAK, resultCount: 4 },
        { cost: 1, result: ITEMS.MUTTON, resultCount: 4 },
        { cost: 2, result: ITEMS.BONE, resultCount: 6 },
        { cost: 3, result: ITEMS.GOLD_SWORD, resultCount: 1 },
        { cost: 4, result: BLOCKS.GOLD, resultCount: 8 },
        { cost: 2, result: ITEMS.RAW_PORKCHOP, resultCount: 6 },
    ],
};
export const PROFESSION_LIST = ["blacksmith", "merchant", "farmer"];

// --- STRUCTURE LOOT TABLES ---
export const LOOT_TABLES = {
  desert_temple: [
    { id: BLOCKS.DIAMOND, min: 1, max: 3, chance: 0.7 },
    { id: BLOCKS.GOLD, min: 2, max: 5, chance: 0.8 },
    { id: BLOCKS.EMERALD, min: 1, max: 4, chance: 0.6 },
    { id: BLOCKS.IRON, min: 3, max: 6, chance: 0.9 },
    { id: ITEMS.IRON_SWORD, min: 1, max: 1, chance: 0.3 },
    { id: ITEMS.GOLD_PICKAXE, min: 1, max: 1, chance: 0.2 },
  ],
  forest_cabin: [
    { id: BLOCKS.IRON, min: 2, max: 5, chance: 0.8 },
    { id: ITEMS.STEAK, min: 2, max: 4, chance: 0.9 },
    { id: BLOCKS.COAL, min: 3, max: 6, chance: 0.8 },
    { id: ITEMS.IRON_PICKAXE, min: 1, max: 1, chance: 0.3 },
    { id: BLOCKS.TORCH, min: 2, max: 4, chance: 0.7 },
    { id: BLOCKS.PLANKS, min: 4, max: 8, chance: 0.5 },
  ],
  savannah_ruins: [
    { id: BLOCKS.IRON, min: 2, max: 4, chance: 0.8 },
    { id: BLOCKS.GOLD, min: 1, max: 3, chance: 0.5 },
    { id: BLOCKS.EMERALD, min: 1, max: 3, chance: 0.6 },
    { id: ITEMS.STONE_SWORD, min: 1, max: 1, chance: 0.4 },
    { id: ITEMS.IRON_AXE, min: 1, max: 1, chance: 0.2 },
  ],
  nether_fortress: [
    { id: BLOCKS.DIAMOND, min: 2, max: 5, chance: 0.7 },
    { id: BLOCKS.IRON, min: 4, max: 10, chance: 0.9 },
    { id: ITEMS.NETHERITE_INGOT, min: 1, max: 2, chance: 0.5 },
    { id: BLOCKS.GOLD, min: 3, max: 6, chance: 0.8 },
  ],
  wasteland_ruin: [
    { id: ITEMS.GUNPOWDER, min: 1, max: 4, chance: 0.7 },
    { id: ITEMS.BULLETS, min: 8, max: 24, chance: 0.6 },
    { id: BLOCKS.WASTELAND_STONE, min: 4, max: 12, chance: 0.5 },
    { id: ITEMS.BONE, min: 1, max: 5, chance: 0.6 },
    { id: BLOCKS.GLOWSTONE, min: 1, max: 3, chance: 0.4 },
    { id: ITEMS.WASTELAND_TELEPORTER, min: 1, max: 1, chance: 0.05 },
  ],
  wasteland_bunker: [
    { id: ITEMS.AK47, min: 1, max: 1, chance: 0.4 },
    { id: ITEMS.BULLETS, min: 16, max: 48, chance: 0.9 },
    { id: ITEMS.ROCKET_LAUNCHER, min: 1, max: 1, chance: 0.15 },
    { id: ITEMS.ROCKET, min: 4, max: 8, chance: 0.3 },
    { id: ITEMS.STEEL_INGOT, min: 2, max: 6, chance: 0.6 },
    { id: ITEMS.TITANIUM_INGOT, min: 1, max: 3, chance: 0.3 },
    { id: BLOCKS.GLOWSTONE, min: 2, max: 5, chance: 0.5 },
    { id: ITEMS.GUNPOWDER, min: 3, max: 8, chance: 0.7 },
    { id: ITEMS.WASTELAND_TELEPORTER, min: 1, max: 1, chance: 0.1 },
  ],
  wasteland_camp: [
    { id: ITEMS.PISTOL, min: 1, max: 1, chance: 0.8 },
    { id: ITEMS.AK47, min: 1, max: 1, chance: 0.7 },
    { id: ITEMS.AK47, min: 1, max: 1, chance: 0.5 },
    { id: ITEMS.PISTOL, min: 1, max: 1, chance: 0.6 },
    { id: ITEMS.BULLETS, min: 24, max: 64, chance: 0.95 },
    { id: ITEMS.BULLETS, min: 16, max: 48, chance: 0.8 },
    { id: ITEMS.ROCKET_LAUNCHER, min: 1, max: 1, chance: 0.25 },
    { id: ITEMS.ROCKET, min: 4, max: 12, chance: 0.4 },
    { id: ITEMS.FLAMETHROWER, min: 1, max: 1, chance: 0.15 },
  ],
  possum_cache: [
    { id: ITEMS.FLOWER, min: 4, max: 10, chance: 0.9 },
    { id: ITEMS.WOOL, min: 2, max: 6, chance: 0.8 },
    { id: ITEMS.STEAK, min: 2, max: 5, chance: 0.7 },
    { id: BLOCKS.DIAMOND, min: 1, max: 3, chance: 0.4 },
    { id: ITEMS.POSSUM_TELEPORTER, min: 1, max: 1, chance: 0.10 },
  ],
};
