// ============================================================
// RENDERING/ITEMS.JS - Item icon drawing
// ============================================================

import { state } from '../state.js';
import { BLOCKS, ITEMS, BLOCK_INFO, ITEM_INFO, isBlockId } from '../constants.js';

export function drawItemIcon(itemId, x, y, size) {
    if (itemId === 0) return;

    // Wasteland Teleporter icon — cobblestone frame with swirling black interior
    if (itemId === ITEMS.WASTELAND_TELEPORTER) {
        const fw = size * 0.75, fh = size * 0.9;
        const fx = x + (size - fw) / 2, fy = y + (size - fh) / 2;
        const border = Math.max(2, size * 0.12);
        // Cobblestone frame — grey with darker spots
        state.ctx.fillStyle = "#6b6b6b";
        state.ctx.fillRect(fx, fy, fw, fh);
        state.ctx.fillStyle = "#888888";
        state.ctx.fillRect(fx + border * 0.3, fy + border * 0.3, border * 0.6, border * 0.6);
        state.ctx.fillRect(fx + fw - border * 0.9, fy + fh - border * 0.9, border * 0.6, border * 0.6);
        state.ctx.fillStyle = "#555555";
        state.ctx.fillRect(fx + border * 0.1, fy + fh - border, border * 0.7, border * 0.7);
        state.ctx.fillRect(fx + fw - border, fy + border * 0.1, border * 0.7, border * 0.7);
        // Black void interior with dark shimmer
        state.ctx.fillStyle = "#050508";
        state.ctx.fillRect(fx + border, fy + border, fw - border * 2, fh - border * 2);
        const t = performance.now() * 0.0015;
        const si1x = Math.sin(t) * 2 + border + 1;
        const si1y = Math.cos(t * 0.7) * 2 + border + 1;
        state.ctx.fillStyle = "rgba(40, 0, 60, 0.6)";
        state.ctx.fillRect(fx + si1x, fy + si1y, (fw - border * 2) * 0.5, fh - border * 2 - 2);
        state.ctx.fillStyle = "rgba(80, 20, 100, 0.3)";
        state.ctx.fillRect(fx + si1x, fy + si1y, (fw - border * 2) * 0.25, (fh - border * 2) * 0.4);
        // Frame outline
        state.ctx.fillStyle = "#4a4a4a";
        state.ctx.fillRect(fx, fy, fw, border);
        state.ctx.fillRect(fx, fy + fh - border, fw, border);
        state.ctx.fillRect(fx, fy, border, fh);
        state.ctx.fillRect(fx + fw - border, fy, border, fh);
        return;
    }

    // Possum Teleporter — a cute pixel possum
    if (itemId === ITEMS.POSSUM_TELEPORTER) {
        const ctx = state.ctx;
        const s = size;
        // Scale to fit the icon slot
        const cx = x, cy = y + Math.floor(s * 0.1);
        const p = Math.max(1, Math.floor(s / 16)); // pixel size

        // Body — grey
        ctx.fillStyle = "#aaaaaa";
        ctx.fillRect(cx + p*3, cy + p*5, p*9, p*6);
        // Belly — cream
        ctx.fillStyle = "#ede8e0";
        ctx.fillRect(cx + p*5, cy + p*6, p*5, p*4);

        // Head — white-faced
        ctx.fillStyle = "#aaaaaa";
        ctx.fillRect(cx + p*9, cy + p*3, p*6, p*6);
        ctx.fillStyle = "#ede8e0";
        ctx.fillRect(cx + p*10, cy + p*4, p*4, p*4);

        // Snout (pointy)
        ctx.fillStyle = "#ffaaaa";
        ctx.fillRect(cx + p*14, cy + p*5, p*2, p*2);

        // Eyes
        ctx.fillStyle = "#111111";
        ctx.fillRect(cx + p*11, cy + p*4, p*1, p*1);
        ctx.fillRect(cx + p*13, cy + p*4, p*1, p*1);

        // Ears
        ctx.fillStyle = "#cc8899";
        ctx.fillRect(cx + p*10, cy + p*2, p*2, p*2);
        ctx.fillRect(cx + p*13, cy + p*2, p*2, p*2);
        ctx.fillStyle = "#ffccdd";
        ctx.fillRect(cx + p*10, cy + p*2, p*1, p*1);
        ctx.fillRect(cx + p*13, cy + p*2, p*1, p*1);

        // Legs
        ctx.fillStyle = "#888888";
        ctx.fillRect(cx + p*4, cy + p*11, p*2, p*3);
        ctx.fillRect(cx + p*7, cy + p*11, p*2, p*3);
        // Feet
        ctx.fillStyle = "#777777";
        ctx.fillRect(cx + p*3, cy + p*13, p*3, p*1);
        ctx.fillRect(cx + p*6, cy + p*13, p*3, p*1);

        // Tail (thin, curling to left)
        ctx.fillStyle = "#ccbbaa";
        ctx.fillRect(cx + p*1, cy + p*7, p*3, p*1);
        ctx.fillRect(cx + p*0, cy + p*8, p*2, p*1);
        ctx.fillRect(cx + p*0, cy + p*9, p*2, p*2);

        // Tiny pink heart above possum (cheerful detail!)
        const t = performance.now() * 0.003;
        const heartBob = Math.round(Math.sin(t) * p);
        ctx.fillStyle = "#ff88bb";
        ctx.fillRect(cx + p*7, cy + p*0 + heartBob, p*1, p*1);
        ctx.fillRect(cx + p*9, cy + p*0 + heartBob, p*1, p*1);
        ctx.fillRect(cx + p*7, cy + p*1 + heartBob, p*3, p*1);
        ctx.fillRect(cx + p*8, cy + p*2 + heartBob, p*1, p*1);

        return;
    }

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

    // Glass Bottle — Minecraft-style glass bottle shape
    if (itemId === ITEMS.GLASS_BOTTLE) {
        const ctx = state.ctx;
        // Bottle body (rounded bottom)
        ctx.fillStyle = "rgba(180, 216, 240, 0.5)";
        ctx.beginPath();
        ctx.moveTo(x + size * 0.3, y + size * 0.35);
        ctx.lineTo(x + size * 0.7, y + size * 0.35);
        ctx.lineTo(x + size * 0.75, y + size * 0.55);
        ctx.lineTo(x + size * 0.7, y + size * 0.85);
        ctx.quadraticCurveTo(x + size * 0.5, y + size * 0.95, x + size * 0.3, y + size * 0.85);
        ctx.lineTo(x + size * 0.25, y + size * 0.55);
        ctx.closePath();
        ctx.fill();
        // Neck
        ctx.fillStyle = "rgba(180, 216, 240, 0.5)";
        ctx.fillRect(x + size * 0.38, y + size * 0.1, size * 0.24, size * 0.28);
        // Rim at top
        ctx.fillStyle = "rgba(200, 232, 255, 0.7)";
        ctx.fillRect(x + size * 0.34, y + size * 0.08, size * 0.32, size * 0.06);
        // Shine highlight
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.fillRect(x + size * 0.33, y + size * 0.4, size * 0.12, size * 0.35);
        // Outline
        ctx.strokeStyle = "rgba(150, 200, 230, 0.6)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + size * 0.34, y + size * 0.14);
        ctx.lineTo(x + size * 0.3, y + size * 0.35);
        ctx.lineTo(x + size * 0.25, y + size * 0.55);
        ctx.lineTo(x + size * 0.3, y + size * 0.85);
        ctx.quadraticCurveTo(x + size * 0.5, y + size * 0.95, x + size * 0.7, y + size * 0.85);
        ctx.lineTo(x + size * 0.75, y + size * 0.55);
        ctx.lineTo(x + size * 0.7, y + size * 0.35);
        ctx.lineTo(x + size * 0.66, y + size * 0.14);
        ctx.stroke();
        return;
    }

    // Water Bottle — glass bottle with blue water inside
    if (itemId === ITEMS.WATER_BOTTLE) {
        const ctx = state.ctx;
        // Water fill (bottom part)
        ctx.fillStyle = "rgba(50, 120, 220, 0.7)";
        ctx.beginPath();
        ctx.moveTo(x + size * 0.3, y + size * 0.5);
        ctx.lineTo(x + size * 0.7, y + size * 0.5);
        ctx.lineTo(x + size * 0.7, y + size * 0.85);
        ctx.quadraticCurveTo(x + size * 0.5, y + size * 0.95, x + size * 0.3, y + size * 0.85);
        ctx.closePath();
        ctx.fill();
        // Bottle body (transparent glass over water)
        ctx.fillStyle = "rgba(180, 216, 240, 0.35)";
        ctx.beginPath();
        ctx.moveTo(x + size * 0.3, y + size * 0.35);
        ctx.lineTo(x + size * 0.7, y + size * 0.35);
        ctx.lineTo(x + size * 0.75, y + size * 0.55);
        ctx.lineTo(x + size * 0.7, y + size * 0.85);
        ctx.quadraticCurveTo(x + size * 0.5, y + size * 0.95, x + size * 0.3, y + size * 0.85);
        ctx.lineTo(x + size * 0.25, y + size * 0.55);
        ctx.closePath();
        ctx.fill();
        // Neck
        ctx.fillStyle = "rgba(180, 216, 240, 0.45)";
        ctx.fillRect(x + size * 0.38, y + size * 0.1, size * 0.24, size * 0.28);
        // Rim
        ctx.fillStyle = "rgba(200, 232, 255, 0.7)";
        ctx.fillRect(x + size * 0.34, y + size * 0.08, size * 0.32, size * 0.06);
        // Shine
        ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
        ctx.fillRect(x + size * 0.33, y + size * 0.4, size * 0.12, size * 0.35);
        // Outline
        ctx.strokeStyle = "rgba(100, 160, 210, 0.6)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + size * 0.34, y + size * 0.14);
        ctx.lineTo(x + size * 0.3, y + size * 0.35);
        ctx.lineTo(x + size * 0.25, y + size * 0.55);
        ctx.lineTo(x + size * 0.3, y + size * 0.85);
        ctx.quadraticCurveTo(x + size * 0.5, y + size * 0.95, x + size * 0.7, y + size * 0.85);
        ctx.lineTo(x + size * 0.75, y + size * 0.55);
        ctx.lineTo(x + size * 0.7, y + size * 0.35);
        ctx.lineTo(x + size * 0.66, y + size * 0.14);
        ctx.stroke();
        return;
    }

    // Possum Candy — classic wrapped candy (pink body, white twist ends)
    if (itemId === ITEMS.POSSUM_CANDY) {
        const ctx = state.ctx;
        const cx = x + size * 0.1, cy = y + size * 0.3;
        const cw = size * 0.8, ch = size * 0.4;
        // Body — pink with white stripe
        ctx.fillStyle = "#ff44cc";
        ctx.fillRect(cx, cy, cw, ch);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(cx + cw * 0.35, cy, cw * 0.1, ch);
        ctx.fillRect(cx + cw * 0.55, cy, cw * 0.1, ch);
        // Highlight
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.fillRect(cx + 1, cy + 1, cw - 2, ch * 0.35);
        // Left twist (white wrapper end)
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(cx - size * 0.15, cy + ch * 0.1, size * 0.15, ch * 0.8);
        ctx.fillStyle = "#ffbbee";
        ctx.fillRect(cx - size * 0.15, cy + ch * 0.25, size * 0.07, ch * 0.5);
        // Right twist
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(cx + cw, cy + ch * 0.1, size * 0.15, ch * 0.8);
        ctx.fillStyle = "#ffbbee";
        ctx.fillRect(cx + cw + size * 0.08, cy + ch * 0.25, size * 0.07, ch * 0.5);
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
    } else if (itemId === ITEMS.COOKED_PORKCHOP) {
        // Browned cooked porkchop
        state.ctx.fillStyle = "#a06848";
        state.ctx.fillRect(x + 2, y + 4, size - 4, size - 6);
        state.ctx.fillStyle = "#8a5030";
        state.ctx.fillRect(x + 4, y + 6, size - 10, size - 12);
        state.ctx.fillStyle = "#c88860";
        state.ctx.fillRect(x + size * 0.3, y + size * 0.25, size * 0.4, size * 0.15);
    } else if (itemId === ITEMS.COOKED_BEEF) {
        // Browned cooked beef
        state.ctx.fillStyle = "#7a3020";
        state.ctx.fillRect(x + 2, y + 4, size - 4, size - 6);
        state.ctx.fillStyle = "#8a4030";
        state.ctx.fillRect(x + 4, y + 6, size - 10, size - 12);
        state.ctx.fillStyle = "#c8a080";
        state.ctx.fillRect(x + size * 0.6, y + size * 0.3, size * 0.2, size * 0.4);
        state.ctx.fillStyle = "#6a2818";
        state.ctx.fillRect(x + size * 0.2, y + size * 0.2, size * 0.3, size * 0.1);
    } else if (itemId === ITEMS.COOKED_MUTTON) {
        // Browned cooked mutton
        state.ctx.fillStyle = "#9a6858";
        state.ctx.fillRect(x + 2, y + 4, size - 4, size - 6);
        state.ctx.fillStyle = "#aa7868";
        state.ctx.fillRect(x + 4, y + 6, size - 10, size - 12);
        state.ctx.fillStyle = "#c8a080";
        state.ctx.fillRect(x + size * 0.15, y + size * 0.6, size * 0.2, size * 0.25);
    } else if (itemId === ITEMS.COOKED_CHICKEN) {
        // Browned cooked chicken
        state.ctx.fillStyle = "#b08050";
        state.ctx.fillRect(x + size * 0.2, y + size * 0.15, size * 0.6, size * 0.55);
        // Drumstick bone
        state.ctx.fillStyle = "#e0d0b0";
        state.ctx.fillRect(x + size * 0.35, y + size * 0.6, size * 0.12, size * 0.35);
        state.ctx.fillRect(x + size * 0.55, y + size * 0.6, size * 0.12, size * 0.35);
        // Golden-brown crispy top
        state.ctx.fillStyle = "#c89040";
        state.ctx.fillRect(x + size * 0.25, y + size * 0.18, size * 0.5, size * 0.15);
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
    } else if (itemId === ITEMS.FUEL_CANISTER) {
        // Cylindrical canister — yellow-green body with cap
        state.ctx.fillStyle = "#b8950a";
        state.ctx.fillRect(x + size * 0.2, y + size * 0.15, size * 0.6, size * 0.7);
        state.ctx.fillStyle = "#d4a820";
        state.ctx.fillRect(x + size * 0.25, y + size * 0.18, size * 0.25, size * 0.64);
        // Cap on top
        state.ctx.fillStyle = "#888";
        state.ctx.fillRect(x + size * 0.3, y + size * 0.08, size * 0.4, size * 0.1);
        // Toxic green glow stripe
        state.ctx.fillStyle = "#40cc40";
        state.ctx.fillRect(x + size * 0.2, y + size * 0.45, size * 0.6, size * 0.08);
    } else if (itemId === ITEMS.FLAMETHROWER) {
        // Dark olive body / tank
        state.ctx.fillStyle = "#3a3a1a";
        state.ctx.fillRect(x + size * 0.1, y + size * 0.28, size * 0.75, size * 0.22);
        // Fuel tank on back (round-ish)
        state.ctx.fillStyle = "#b8950a";
        state.ctx.fillRect(x + size * 0.62, y + size * 0.22, size * 0.28, size * 0.55);
        state.ctx.fillStyle = "#d4a820";
        state.ctx.fillRect(x + size * 0.65, y + size * 0.25, size * 0.1, size * 0.48);
        // Nozzle barrel (darker)
        state.ctx.fillStyle = "#222";
        state.ctx.fillRect(x + size * 0.0, y + size * 0.34, size * 0.16, size * 0.12);
        // Grip
        state.ctx.fillStyle = "#4a3520";
        state.ctx.fillRect(x + size * 0.38, y + size * 0.46, size * 0.14, size * 0.32);
        // Orange flame tip glow
        state.ctx.fillStyle = "#ff6600";
        state.ctx.fillRect(x + size * 0.0, y + size * 0.35, size * 0.06, size * 0.1);
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
    } else if (itemId === ITEMS.SHIELD) {
        // Minecraft-style shield: wooden board with iron trim and boss
        const cx = x + size / 2;
        // Main wood body (tapers to point at bottom)
        state.ctx.fillStyle = "#8b6c42";
        state.ctx.beginPath();
        state.ctx.moveTo(x + size * 0.15, y + size * 0.08);
        state.ctx.lineTo(x + size * 0.85, y + size * 0.08);
        state.ctx.lineTo(x + size * 0.85, y + size * 0.62);
        state.ctx.lineTo(cx, y + size * 0.96);
        state.ctx.lineTo(x + size * 0.15, y + size * 0.62);
        state.ctx.closePath();
        state.ctx.fill();
        // Wood grain lines
        state.ctx.fillStyle = "#7a5c32";
        state.ctx.fillRect(x + size * 0.28, y + size * 0.12, size * 0.08, size * 0.48);
        state.ctx.fillRect(x + size * 0.46, y + size * 0.12, size * 0.08, size * 0.52);
        state.ctx.fillRect(x + size * 0.64, y + size * 0.12, size * 0.08, size * 0.48);
        // Iron border (top, sides)
        state.ctx.fillStyle = "#c0c0c0";
        state.ctx.fillRect(x + size * 0.15, y + size * 0.08, size * 0.7, size * 0.07); // top bar
        state.ctx.fillRect(x + size * 0.15, y + size * 0.08, size * 0.07, size * 0.54); // left bar
        state.ctx.fillRect(x + size * 0.78, y + size * 0.08, size * 0.07, size * 0.54); // right bar
        // Iron boss (cross in center)
        state.ctx.fillStyle = "#d4d4d4";
        state.ctx.fillRect(cx - size * 0.06, y + size * 0.25, size * 0.12, size * 0.28); // vertical
        state.ctx.fillRect(cx - size * 0.16, y + size * 0.33, size * 0.32, size * 0.12); // horizontal
        // Boss centre highlight
        state.ctx.fillStyle = "#e8e8e8";
        state.ctx.fillRect(cx - size * 0.04, y + size * 0.33, size * 0.08, size * 0.12);
    } else if (itemId === ITEMS.IRON_INGOT) {
        // Silver-grey iron bar
        state.ctx.fillStyle = "#a0a0a0";
        state.ctx.fillRect(x + size * 0.1, y + size * 0.22, size * 0.8, size * 0.56);
        state.ctx.fillStyle = "#d4d4d4";
        state.ctx.fillRect(x + size * 0.15, y + size * 0.27, size * 0.7, size * 0.18);
        state.ctx.fillStyle = "#808080";
        state.ctx.fillRect(x + size * 0.15, y + size * 0.62, size * 0.7, size * 0.1);
    } else if (itemId === ITEMS.SILVER_INGOT) {
        // Bright silver bar
        state.ctx.fillStyle = "#a0a8b8";
        state.ctx.fillRect(x + size * 0.1, y + size * 0.22, size * 0.8, size * 0.56);
        state.ctx.fillStyle = "#d0d8e8";
        state.ctx.fillRect(x + size * 0.15, y + size * 0.27, size * 0.7, size * 0.18);
        state.ctx.fillStyle = "#e8eef8";
        state.ctx.fillRect(x + size * 0.3, y + size * 0.3, size * 0.1, size * 0.1);
        state.ctx.fillStyle = "#7a8090";
        state.ctx.fillRect(x + size * 0.15, y + size * 0.62, size * 0.7, size * 0.1);
    } else if (itemId === ITEMS.GOLD_INGOT) {
        // Gold bar
        state.ctx.fillStyle = "#c8a000";
        state.ctx.fillRect(x + size * 0.1, y + size * 0.22, size * 0.8, size * 0.56);
        state.ctx.fillStyle = "#ffd700";
        state.ctx.fillRect(x + size * 0.15, y + size * 0.27, size * 0.7, size * 0.18);
        state.ctx.fillStyle = "#ffe866";
        state.ctx.fillRect(x + size * 0.3, y + size * 0.3, size * 0.1, size * 0.1);
        state.ctx.fillStyle = "#a08000";
        state.ctx.fillRect(x + size * 0.15, y + size * 0.62, size * 0.7, size * 0.1);
    } else if (itemId === ITEMS.COPPER_INGOT) {
        // Copper bar
        state.ctx.fillStyle = "#b05830";
        state.ctx.fillRect(x + size * 0.1, y + size * 0.22, size * 0.8, size * 0.56);
        state.ctx.fillStyle = "#e07040";
        state.ctx.fillRect(x + size * 0.15, y + size * 0.27, size * 0.7, size * 0.18);
        state.ctx.fillStyle = "#904020";
        state.ctx.fillRect(x + size * 0.15, y + size * 0.62, size * 0.7, size * 0.1);
    } else if (itemId === ITEMS.STEEL_INGOT) {
        // Silver-blue steel ingot bar
        state.ctx.fillStyle = "#6a7a8a";
        state.ctx.fillRect(x + size * 0.1, y + size * 0.22, size * 0.8, size * 0.56);
        state.ctx.fillStyle = "#9ab0c0";
        state.ctx.fillRect(x + size * 0.15, y + size * 0.27, size * 0.7, size * 0.18);
        state.ctx.fillStyle = "#4a5a6a";
        state.ctx.fillRect(x + size * 0.15, y + size * 0.62, size * 0.7, size * 0.1);
    } else if (itemId === ITEMS.TITANIUM_INGOT) {
        // Pale blue-white metallic ingot
        state.ctx.fillStyle = "#7a90a8";
        state.ctx.fillRect(x + size * 0.1, y + size * 0.22, size * 0.8, size * 0.56);
        state.ctx.fillStyle = "#c0d8f0";
        state.ctx.fillRect(x + size * 0.15, y + size * 0.27, size * 0.7, size * 0.18);
        state.ctx.fillStyle = "#ddeeff";
        state.ctx.fillRect(x + size * 0.3, y + size * 0.3, size * 0.1, size * 0.1);
        state.ctx.fillStyle = "#5a6a7a";
        state.ctx.fillRect(x + size * 0.15, y + size * 0.62, size * 0.7, size * 0.1);
    } else if (itemId === ITEMS.RIOT_HELMET) {
        // Dark navy tactical helmet with visor
        state.ctx.fillStyle = "#2d3a4a";
        state.ctx.fillRect(x + size * 0.1, y + size * 0.12, size * 0.8, size * 0.7);
        state.ctx.fillStyle = "#1a2535";
        state.ctx.fillRect(x + size * 0.2, y + size * 0.55, size * 0.6, size * 0.27);
        // Visor slot
        state.ctx.fillStyle = "#88aacc";
        state.ctx.fillRect(x + size * 0.2, y + size * 0.38, size * 0.6, size * 0.16);
    } else if (itemId === ITEMS.RIOT_CHESTPLATE) {
        state.ctx.fillStyle = "#2d3a4a";
        state.ctx.fillRect(x + size * 0.1, y + size * 0.05, size * 0.8, size * 0.9);
        // Kevlar panel lines
        state.ctx.fillStyle = "#1a2535";
        state.ctx.fillRect(x + size * 0.3, y + size * 0.05, size * 0.4, size * 0.32);
        state.ctx.fillRect(x + size * 0.35, y + size * 0.58, size * 0.3, size * 0.37);
        state.ctx.fillStyle = "#3d5060";
        state.ctx.fillRect(x + size * 0.1, y + size * 0.38, size * 0.8, size * 0.05);
    } else if (itemId === ITEMS.RIOT_LEGGINGS) {
        state.ctx.fillStyle = "#2d3a4a";
        state.ctx.fillRect(x + size * 0.1, y + size * 0.05, size * 0.8, size * 0.4);
        state.ctx.fillRect(x + size * 0.1, y + size * 0.05, size * 0.35, size * 0.9);
        state.ctx.fillRect(x + size * 0.55, y + size * 0.05, size * 0.35, size * 0.9);
        state.ctx.fillStyle = "#3d5060";
        state.ctx.fillRect(x + size * 0.1, y + size * 0.44, size * 0.8, size * 0.04);
    } else if (itemId === ITEMS.RIOT_BOOTS) {
        state.ctx.fillStyle = "#2d3a4a";
        state.ctx.fillRect(x + size * 0.05, y + size * 0.4, size * 0.35, size * 0.55);
        state.ctx.fillRect(x + size * 0.6, y + size * 0.4, size * 0.35, size * 0.55);
        state.ctx.fillRect(x + size * 0.0, y + size * 0.7, size * 0.45, size * 0.25);
        state.ctx.fillRect(x + size * 0.55, y + size * 0.7, size * 0.45, size * 0.25);
        // Toe reinforcement
        state.ctx.fillStyle = "#3d5060";
        state.ctx.fillRect(x + size * 0.0, y + size * 0.78, size * 0.2, size * 0.17);
        state.ctx.fillRect(x + size * 0.8, y + size * 0.78, size * 0.2, size * 0.17);
    } else if (itemId === ITEMS.BUCKET || itemId === ITEMS.WATER_BUCKET || itemId === ITEMS.LAVA_BUCKET || itemId === ITEMS.TOXIC_BUCKET) {
        // Iron bucket body (wide top, narrow bottom)
        state.ctx.fillStyle = "#aaaaaa";
        state.ctx.beginPath();
        state.ctx.moveTo(x + size * 0.15, y + size * 0.25);
        state.ctx.lineTo(x + size * 0.85, y + size * 0.25);
        state.ctx.lineTo(x + size * 0.75, y + size * 0.88);
        state.ctx.lineTo(x + size * 0.25, y + size * 0.88);
        state.ctx.closePath();
        state.ctx.fill();
        // Handle arc
        state.ctx.strokeStyle = "#888888";
        state.ctx.lineWidth = Math.max(2, size * 0.07);
        state.ctx.beginPath();
        state.ctx.arc(x + size / 2, y + size * 0.22, size * 0.22, Math.PI, 0, false);
        state.ctx.stroke();
        // Liquid fill if not empty
        if (itemId === ITEMS.WATER_BUCKET) {
            state.ctx.fillStyle = "#3366ee";
            state.ctx.fillRect(x + size * 0.22, y + size * 0.58, size * 0.56, size * 0.26);
        } else if (itemId === ITEMS.LAVA_BUCKET) {
            state.ctx.fillStyle = "#dd4400";
            state.ctx.fillRect(x + size * 0.22, y + size * 0.58, size * 0.56, size * 0.26);
        } else if (itemId === ITEMS.TOXIC_BUCKET) {
            state.ctx.fillStyle = "#22aa22";
            state.ctx.fillRect(x + size * 0.22, y + size * 0.58, size * 0.56, size * 0.26);
        }
        state.ctx.lineWidth = 1;
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
