// ============================================================
// RENDERING/ITEMS.JS - Item icon drawing
// ============================================================

import { state } from '../state.js';
import { BLOCKS, ITEMS, BLOCK_INFO, ITEM_INFO, isBlockId } from '../constants.js';

export function drawItemIcon(itemId, x, y, size) {
    if (itemId === 0) return;

    // Miniature Nether Portal icon
    if (itemId === ITEMS.MINIATURE_NETHER_PORTAL) {
        const fw = size * 0.75, fh = size * 0.9;
        const fx = x + (size - fw) / 2, fy = y + (size - fh) / 2;
        const border = Math.max(2, size * 0.12);
        // Obsidian frame
        state.ctx.fillStyle = "#1a0a2e";
        state.ctx.fillRect(fx, fy, fw, fh);
        // Purple portal interior
        state.ctx.fillStyle = "#6600cc";
        state.ctx.fillRect(fx + border, fy + border, fw - border * 2, fh - border * 2);
        // Inner shimmer
        state.ctx.fillStyle = "#9933ff";
        state.ctx.fillRect(fx + border + 1, fy + border + 1, (fw - border * 2) * 0.5, fh - border * 2 - 2);
        state.ctx.fillStyle = "#cc66ff";
        state.ctx.fillRect(fx + border + 1, fy + border + 1, (fw - border * 2) * 0.25, (fh - border * 2) * 0.4);
        // Frame highlight edges
        state.ctx.fillStyle = "#2a1a4e";
        state.ctx.fillRect(fx, fy, fw, border);
        state.ctx.fillRect(fx, fy + fh - border, fw, border);
        state.ctx.fillRect(fx, fy, border, fh);
        state.ctx.fillRect(fx + fw - border, fy, border, fh);
        return;
    }

    // Torch mini icon (before generic block path)
    if (itemId === BLOCKS.TORCH) {
        state.ctx.fillStyle = "#8b6c42";
        state.ctx.fillRect(x + size * 0.4, y + size * 0.3, size * 0.2, size * 0.6);
        state.ctx.fillStyle = "#e8a030";
        state.ctx.fillRect(x + size * 0.3, y + size * 0.05, size * 0.4, size * 0.35);
        state.ctx.fillStyle = "#ffdd44";
        state.ctx.fillRect(x + size * 0.35, y, size * 0.3, size * 0.2);
        return;
    }
    // Cactus mini icon
    if (itemId === BLOCKS.CACTUS) {
        state.ctx.fillStyle = "#2d6a1e";
        state.ctx.fillRect(x + size * 0.3, y + size * 0.1, size * 0.4, size * 0.8);
        state.ctx.fillStyle = "#3a8a2e";
        state.ctx.fillRect(x + size * 0.35, y + size * 0.15, size * 0.3, size * 0.7);
        // Thorns
        state.ctx.fillStyle = "#1a5a0e";
        state.ctx.fillRect(x + size * 0.15, y + size * 0.3, size * 0.15, 2);
        state.ctx.fillRect(x + size * 0.7, y + size * 0.55, size * 0.15, 2);
        return;
    }

    // Door mini icon
    if (itemId === BLOCKS.DOOR_CLOSED) {
        state.ctx.fillStyle = "#8b6c42";
        state.ctx.fillRect(x + size * 0.15, y + size * 0.05, size * 0.7, size * 0.9);
        state.ctx.fillStyle = "#7a5c32";
        state.ctx.fillRect(x + size * 0.2, y + size * 0.1, size * 0.15, size * 0.8);
        state.ctx.fillRect(x + size * 0.65, y + size * 0.1, size * 0.15, size * 0.8);
        state.ctx.fillStyle = "#c0c0c0";
        state.ctx.fillRect(x + size * 0.6, y + size * 0.45, size * 0.1, size * 0.1);
        return;
    }
    // Pressure plate icon
    if (itemId === BLOCKS.PRESSURE_PLATE) {
        state.ctx.fillStyle = "#7a7a6a";
        state.ctx.fillRect(x + size * 0.1, y + size * 0.65, size * 0.8, size * 0.2);
        state.ctx.fillStyle = "#9a9a8a";
        state.ctx.fillRect(x + size * 0.15, y + size * 0.65, size * 0.7, size * 0.1);
        return;
    }

    if (isBlockId(itemId)) {
        const info = BLOCK_INFO[itemId];
        if (!info || !info.color) return;
        state.ctx.fillStyle = info.color;
        state.ctx.fillRect(x, y, size, size);
        if (info.topColor) {
            state.ctx.fillStyle = info.topColor;
            state.ctx.fillRect(x, y, size, Math.max(2, size * 0.2));
        }
        if (info.spots) {
            state.ctx.fillStyle = info.spots;
            const s = Math.max(2, size * 0.2);
            state.ctx.fillRect(x + size * 0.15, y + size * 0.2, s, s);
            state.ctx.fillRect(x + size * 0.55, y + size * 0.5, s, s);
        }
        if (itemId === BLOCKS.PLANKS) {
            state.ctx.fillStyle = "#b08930";
            state.ctx.fillRect(x, y + size * 0.3, size, 1);
            state.ctx.fillRect(x, y + size * 0.6, size, 1);
        }
        if (itemId === BLOCKS.CHEST) {
            state.ctx.fillStyle = "#8b6c42";
            state.ctx.fillRect(x + 2, y + size * 0.2, size - 4, size * 0.7);
            state.ctx.fillStyle = "#a07840";
            state.ctx.fillRect(x + 2, y + size * 0.1, size - 4, size * 0.25);
            state.ctx.fillStyle = "#c0c0c0";
            state.ctx.fillRect(x + size * 0.4, y + size * 0.3, size * 0.2, size * 0.15);
        }
        if (itemId === BLOCKS.BED) {
            state.ctx.fillStyle = "#8b6c42";
            state.ctx.fillRect(x, y + size * 0.5, size, size * 0.5);
            state.ctx.fillStyle = "#cc3333";
            state.ctx.fillRect(x + 2, y + size * 0.15, size - 4, size * 0.4);
            state.ctx.fillStyle = "#e8e8e8";
            state.ctx.fillRect(x + 3, y + size * 0.2, size * 0.3, size * 0.25);
        }
    } else if (itemId === ITEMS.STICK) {
        state.ctx.fillStyle = "#8b6c42";
        state.ctx.save();
        state.ctx.translate(x + size / 2, y + size / 2);
        state.ctx.rotate(Math.PI / 4);
        state.ctx.fillRect(-2, -size * 0.4, 4, size * 0.8);
        state.ctx.restore();
    } else if (itemId === ITEMS.RAW_PORKCHOP) {
        state.ctx.fillStyle = "#e88a8a";
        state.ctx.fillRect(x + 2, y + 4, size - 4, size - 6);
        state.ctx.fillStyle = "#c46060";
        state.ctx.fillRect(x + 4, y + 6, size - 10, size - 12);
    } else if (itemId === ITEMS.ROTTEN_FLESH) {
        state.ctx.fillStyle = "#7a9a4a";
        state.ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
        state.ctx.fillStyle = "#5a7a3a";
        state.ctx.fillRect(x + 5, y + 5, size - 10, size - 10);
    } else if (itemId === ITEMS.BONE) {
        state.ctx.fillStyle = "#e8e8d0";
        state.ctx.fillRect(x + size * 0.3, y + 2, size * 0.4, size - 4);
        state.ctx.fillRect(x + size * 0.15, y + 2, size * 0.7, size * 0.25);
        state.ctx.fillRect(x + size * 0.15, y + size * 0.7, size * 0.7, size * 0.25);
    } else if (itemId === ITEMS.GUNPOWDER) {
        state.ctx.fillStyle = "#555555";
        state.ctx.beginPath();
        state.ctx.arc(x + size / 2, y + size / 2, size * 0.35, 0, Math.PI * 2);
        state.ctx.fill();
        state.ctx.fillStyle = "#333333";
        state.ctx.fillRect(x + size * 0.3, y + size * 0.3, 3, 3);
        state.ctx.fillRect(x + size * 0.55, y + size * 0.5, 3, 3);
    } else if (itemId === ITEMS.WOOL) {
        state.ctx.fillStyle = "#e8e8e8";
        state.ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
        state.ctx.fillStyle = "#f4f4f4";
        state.ctx.fillRect(x + size * 0.2, y + size * 0.15, size * 0.3, size * 0.3);
        state.ctx.fillRect(x + size * 0.5, y + size * 0.45, size * 0.3, size * 0.3);
    } else if (itemId === ITEMS.LEATHER) {
        state.ctx.fillStyle = "#8B6538";
        state.ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
        state.ctx.fillStyle = "#a07848";
        state.ctx.fillRect(x + 4, y + 4, size - 8, size - 8);
    } else if (itemId === ITEMS.STEAK) {
        state.ctx.fillStyle = "#aa3333";
        state.ctx.fillRect(x + 2, y + 4, size - 4, size - 6);
        state.ctx.fillStyle = "#cc5555";
        state.ctx.fillRect(x + 4, y + 6, size - 10, size - 12);
        state.ctx.fillStyle = "#e8ccaa";
        state.ctx.fillRect(x + size * 0.6, y + size * 0.3, size * 0.2, size * 0.4);
    } else if (itemId === ITEMS.MUTTON) {
        state.ctx.fillStyle = "#d88888";
        state.ctx.fillRect(x + 2, y + 4, size - 4, size - 6);
        state.ctx.fillStyle = "#eaaaaa";
        state.ctx.fillRect(x + 4, y + 6, size - 10, size - 12);
        state.ctx.fillStyle = "#e8ccaa";
        state.ctx.fillRect(x + size * 0.15, y + size * 0.6, size * 0.2, size * 0.25);
    } else if (itemId === ITEMS.HUMAN_MEAT) {
        // Distinct leg/drumstick shape — dark red with bone handle
        // Bone handle (bottom right)
        state.ctx.fillStyle = "#e8d8b0";
        state.ctx.fillRect(x + size * 0.55, y + size * 0.55, size * 0.22, size * 0.38);
        // Round bone knob
        state.ctx.fillRect(x + size * 0.5, y + size * 0.85, size * 0.32, size * 0.12);
        // Meat bulb (top left, irregular)
        state.ctx.fillStyle = "#cc2233";
        state.ctx.fillRect(x + size * 0.1, y + size * 0.08, size * 0.62, size * 0.55);
        // Darker inner detail
        state.ctx.fillStyle = "#991122";
        state.ctx.fillRect(x + size * 0.18, y + size * 0.14, size * 0.38, size * 0.28);
        // Blood drip
        state.ctx.fillStyle = "#770011";
        state.ctx.fillRect(x + size * 0.3, y + size * 0.58, size * 0.1, size * 0.18);
        state.ctx.fillRect(x + size * 0.18, y + size * 0.52, size * 0.08, size * 0.12);
    } else if (itemId === ITEMS.NETHERITE_INGOT) {
        // Dark metallic ingot bar
        state.ctx.fillStyle = "#2a2a35";
        state.ctx.fillRect(x + size * 0.1, y + size * 0.2, size * 0.8, size * 0.6);
        state.ctx.fillStyle = "#4a4a5a";
        state.ctx.fillRect(x + size * 0.15, y + size * 0.25, size * 0.7, size * 0.2);
        state.ctx.fillStyle = "#1a1a22";
        state.ctx.fillRect(x + size * 0.15, y + size * 0.6, size * 0.7, size * 0.1);
    } else if (itemId === ITEMS.FLOWER) {
        // Stem
        state.ctx.fillStyle = "#44aa44";
        state.ctx.fillRect(x + size * 0.45, y + size * 0.45, size * 0.12, size * 0.5);
        // Petals (5 squares around center)
        state.ctx.fillStyle = "#ff6688";
        state.ctx.fillRect(x + size * 0.35, y + size * 0.1, size * 0.3, size * 0.22);  // top
        state.ctx.fillRect(x + size * 0.62, y + size * 0.22, size * 0.25, size * 0.25); // top-right
        state.ctx.fillRect(x + size * 0.13, y + size * 0.22, size * 0.25, size * 0.25); // top-left
        state.ctx.fillRect(x + size * 0.62, y + size * 0.48, size * 0.22, size * 0.22); // right
        state.ctx.fillRect(x + size * 0.16, y + size * 0.48, size * 0.22, size * 0.22); // left
        // Yellow center
        state.ctx.fillStyle = "#ffee44";
        state.ctx.fillRect(x + size * 0.35, y + size * 0.28, size * 0.3, size * 0.26);
    } else if (itemId === ITEMS.FLINT) {
        state.ctx.fillStyle = "#555555";
        state.ctx.beginPath();
        state.ctx.moveTo(x + size * 0.5, y + size * 0.1);
        state.ctx.lineTo(x + size * 0.8, y + size * 0.5);
        state.ctx.lineTo(x + size * 0.6, y + size * 0.9);
        state.ctx.lineTo(x + size * 0.2, y + size * 0.7);
        state.ctx.lineTo(x + size * 0.3, y + size * 0.3);
        state.ctx.closePath();
        state.ctx.fill();
        state.ctx.fillStyle = "#777777";
        state.ctx.fillRect(x + size * 0.35, y + size * 0.3, size * 0.2, size * 0.3);
    } else if (itemId === ITEMS.FLINT_AND_STEEL) {
        state.ctx.fillStyle = "#555555";
        state.ctx.fillRect(x + size * 0.15, y + size * 0.3, size * 0.3, size * 0.5);
        state.ctx.fillStyle = "#cccccc";
        state.ctx.fillRect(x + size * 0.5, y + size * 0.2, size * 0.35, size * 0.15);
        state.ctx.fillRect(x + size * 0.55, y + size * 0.2, size * 0.1, size * 0.6);
        state.ctx.fillStyle = "#ffaa00";
        state.ctx.fillRect(x + size * 0.4, y + size * 0.15, 3, 3);
    } else if (itemId === ITEMS.BULLETS) {
        state.ctx.fillStyle = "#c4a030";
        state.ctx.fillRect(x + size * 0.2, y + size * 0.3, size * 0.15, size * 0.4);
        state.ctx.fillRect(x + size * 0.45, y + size * 0.3, size * 0.15, size * 0.4);
        state.ctx.fillRect(x + size * 0.7, y + size * 0.3, size * 0.15, size * 0.4);
        state.ctx.fillStyle = "#dd8844";
        state.ctx.fillRect(x + size * 0.2, y + size * 0.2, size * 0.15, size * 0.15);
        state.ctx.fillRect(x + size * 0.45, y + size * 0.2, size * 0.15, size * 0.15);
        state.ctx.fillRect(x + size * 0.7, y + size * 0.2, size * 0.15, size * 0.15);
    } else if (itemId === ITEMS.PISTOL) {
        state.ctx.fillStyle = "#666666";
        state.ctx.fillRect(x + size * 0.1, y + size * 0.25, size * 0.7, size * 0.2);
        state.ctx.fillRect(x + size * 0.3, y + size * 0.4, size * 0.2, size * 0.4);
        state.ctx.fillStyle = "#888888";
        state.ctx.fillRect(x + size * 0.1, y + size * 0.28, size * 0.65, size * 0.14);
        state.ctx.fillStyle = "#555555";
        state.ctx.fillRect(x + size * 0.75, y + size * 0.3, size * 0.1, size * 0.1);
    } else if (itemId === ITEMS.AK47) {
        state.ctx.fillStyle = "#5a5a3a";
        state.ctx.fillRect(x + size * 0.05, y + size * 0.3, size * 0.9, size * 0.15);
        state.ctx.fillStyle = "#8b6c42";
        state.ctx.fillRect(x + size * 0.55, y + size * 0.4, size * 0.3, size * 0.35);
        state.ctx.fillStyle = "#4a4a2a";
        state.ctx.fillRect(x + size * 0.05, y + size * 0.32, size * 0.5, size * 0.1);
        state.ctx.fillStyle = "#666";
        state.ctx.fillRect(x + size * 0.2, y + size * 0.2, size * 0.15, size * 0.12);
    } else if (itemId === ITEMS.ENDER_PEARL) {
        state.ctx.fillStyle = "#1a3a2a";
        state.ctx.beginPath();
        state.ctx.arc(x + size / 2, y + size / 2, size * 0.35, 0, Math.PI * 2);
        state.ctx.fill();
        state.ctx.fillStyle = "#2a5a3a";
        state.ctx.beginPath();
        state.ctx.arc(x + size * 0.45, y + size * 0.4, size * 0.15, 0, Math.PI * 2);
        state.ctx.fill();
    } else if (itemId === ITEMS.FEATHER) {
        // Quill shape
        state.ctx.fillStyle = "#f5f5f5";
        state.ctx.beginPath();
        state.ctx.moveTo(x + size * 0.5, y + size * 0.05);
        state.ctx.lineTo(x + size * 0.7, y + size * 0.5);
        state.ctx.lineTo(x + size * 0.55, y + size * 0.9);
        state.ctx.lineTo(x + size * 0.45, y + size * 0.9);
        state.ctx.lineTo(x + size * 0.3, y + size * 0.5);
        state.ctx.closePath();
        state.ctx.fill();
        // Shaft
        state.ctx.strokeStyle = "#aaa";
        state.ctx.lineWidth = 1;
        state.ctx.beginPath();
        state.ctx.moveTo(x + size * 0.5, y + size * 0.05);
        state.ctx.lineTo(x + size * 0.5, y + size * 0.95);
        state.ctx.stroke();
    } else if (itemId === ITEMS.RAW_CHICKEN) {
        // Pinkish raw meat
        state.ctx.fillStyle = "#e8a0a0";
        state.ctx.fillRect(x + size * 0.2, y + size * 0.15, size * 0.6, size * 0.55);
        // Drumstick bone
        state.ctx.fillStyle = "#f0d8b0";
        state.ctx.fillRect(x + size * 0.35, y + size * 0.6, size * 0.12, size * 0.35);
        state.ctx.fillRect(x + size * 0.55, y + size * 0.6, size * 0.12, size * 0.35);
        // Darker shading
        state.ctx.fillStyle = "rgba(0,0,0,0.1)";
        state.ctx.fillRect(x + size * 0.2, y + size * 0.45, size * 0.6, size * 0.15);
    } else if (itemId === ITEMS.ROCKET_LAUNCHER) {
        // Olive green launcher tube
        state.ctx.fillStyle = "#556b2f";
        state.ctx.fillRect(x + size * 0.05, y + size * 0.25, size * 0.85, size * 0.25);
        // Wider opening at front
        state.ctx.fillStyle = "#3a4a1f";
        state.ctx.fillRect(x + size * 0.0, y + size * 0.2, size * 0.15, size * 0.35);
        // Grip
        state.ctx.fillStyle = "#444";
        state.ctx.fillRect(x + size * 0.5, y + size * 0.45, size * 0.15, size * 0.35);
        // Sight on top
        state.ctx.fillStyle = "#333";
        state.ctx.fillRect(x + size * 0.3, y + size * 0.15, size * 0.1, size * 0.12);
    } else if (itemId === ITEMS.ROCKET) {
        // Rocket body (red)
        state.ctx.fillStyle = "#cc3333";
        state.ctx.fillRect(x + size * 0.3, y + size * 0.1, size * 0.4, size * 0.6);
        // Nose cone
        state.ctx.fillStyle = "#aaa";
        state.ctx.beginPath();
        state.ctx.moveTo(x + size * 0.5, y + size * 0.0);
        state.ctx.lineTo(x + size * 0.7, y + size * 0.15);
        state.ctx.lineTo(x + size * 0.3, y + size * 0.15);
        state.ctx.closePath();
        state.ctx.fill();
        // Fins
        state.ctx.fillStyle = "#cc3333";
        state.ctx.fillRect(x + size * 0.2, y + size * 0.6, size * 0.15, size * 0.2);
        state.ctx.fillRect(x + size * 0.65, y + size * 0.6, size * 0.15, size * 0.2);
        // Exhaust
        state.ctx.fillStyle = "#ff8800";
        state.ctx.fillRect(x + size * 0.35, y + size * 0.7, size * 0.3, size * 0.15);
    } else if (ITEM_INFO[itemId] && ITEM_INFO[itemId].armorType) {
        const ac = ITEM_INFO[itemId].color;
        const at = ITEM_INFO[itemId].armorType;
        if (at === "helmet") {
            state.ctx.fillStyle = ac;
            state.ctx.fillRect(x + size * 0.1, y + size * 0.15, size * 0.8, size * 0.7);
            state.ctx.fillStyle = "rgba(0,0,0,0.2)";
            state.ctx.fillRect(x + size * 0.2, y + size * 0.55, size * 0.6, size * 0.3);
        } else if (at === "chestplate") {
            state.ctx.fillStyle = ac;
            state.ctx.fillRect(x + size * 0.1, y + size * 0.05, size * 0.8, size * 0.9);
            state.ctx.fillStyle = "rgba(0,0,0,0.15)";
            state.ctx.fillRect(x + size * 0.3, y + size * 0.05, size * 0.4, size * 0.35);
            state.ctx.fillRect(x + size * 0.35, y + size * 0.6, size * 0.3, size * 0.35);
        } else if (at === "leggings") {
            state.ctx.fillStyle = ac;
            state.ctx.fillRect(x + size * 0.1, y + size * 0.05, size * 0.8, size * 0.4);
            state.ctx.fillRect(x + size * 0.1, y + size * 0.05, size * 0.35, size * 0.9);
            state.ctx.fillRect(x + size * 0.55, y + size * 0.05, size * 0.35, size * 0.9);
        } else if (at === "boots") {
            state.ctx.fillStyle = ac;
            state.ctx.fillRect(x + size * 0.05, y + size * 0.4, size * 0.35, size * 0.55);
            state.ctx.fillRect(x + size * 0.6, y + size * 0.4, size * 0.35, size * 0.55);
            state.ctx.fillRect(x + size * 0.0, y + size * 0.7, size * 0.45, size * 0.25);
            state.ctx.fillRect(x + size * 0.55, y + size * 0.7, size * 0.45, size * 0.25);
        }
    } else if (ITEM_INFO[itemId] && ITEM_INFO[itemId].toolType) {
        const info = ITEM_INFO[itemId];
        const tc = info.color;
        const hc = "#8b6c42";
        if (info.toolType === "pickaxe") {
            state.ctx.fillStyle = hc;
            state.ctx.save(); state.ctx.translate(x + size / 2, y + size / 2); state.ctx.rotate(Math.PI / 4);
            state.ctx.fillRect(-2, -2, 4, size * 0.6);
            state.ctx.fillStyle = tc;
            state.ctx.fillRect(-size * 0.35, -size * 0.3, size * 0.7, 4);
            state.ctx.restore();
        } else if (info.toolType === "sword") {
            state.ctx.save(); state.ctx.translate(x + size / 2, y + size / 2); state.ctx.rotate(-Math.PI / 4);
            state.ctx.fillStyle = tc;
            state.ctx.fillRect(-2, -size * 0.45, 5, size * 0.5);
            state.ctx.fillStyle = hc;
            state.ctx.fillRect(-2, size * 0.05, 4, size * 0.35);
            state.ctx.fillStyle = "#444";
            state.ctx.fillRect(-5, 0, 10, 3);
            state.ctx.restore();
        } else if (info.toolType === "axe") {
            state.ctx.fillStyle = hc;
            state.ctx.save(); state.ctx.translate(x + size / 2, y + size / 2); state.ctx.rotate(Math.PI / 4);
            state.ctx.fillRect(-2, -2, 4, size * 0.6);
            state.ctx.fillStyle = tc;
            state.ctx.fillRect(-2, -size * 0.35, size * 0.35, size * 0.3);
            state.ctx.restore();
        }
    }
}
