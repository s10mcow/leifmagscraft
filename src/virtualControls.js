// ============================================================
// VIRTUAL CONTROLS - Mobile touch input (ES Module)
// ============================================================
// Renders a floating joystick (left) and action buttons (right)
// only on touch devices. Maps touches to state.keys and
// state.mouse so all existing game logic works unchanged.
// ============================================================

import { state } from './state.js';
import { getHotbarLayout } from './ui.js';
import { HOTBAR_SIZE } from './inventory.js';

const isTouch = () => ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

// Joystick tracking
let joystickTouchId = null;
let joystickCX = 0, joystickCY = 0;
const JOY_MOVE_R = 38; // max thumb travel radius
const JOY_DEAD   = 10; // dead-zone pixels

// Canvas aim tracking
let canvasTouchId = null;

export function setupVirtualControls() {
    if (!isTouch()) return;

    buildDOM();
    initJoystick();
    initButtons();
    initCanvasTouch();
}

// ---- DOM -------------------------------------------------------

function buildDOM() {
    // Joystick base
    const joyBase = document.createElement('div');
    joyBase.id = 'joy-base';
    joyBase.innerHTML = '<div id="joy-thumb"></div>';
    document.body.appendChild(joyBase);

    // Right-side action panel
    const panel = document.createElement('div');
    panel.id = 'vbtn-panel';
    panel.innerHTML = `
        <div class="vbtn-row">
            <div id="vbtn-inv"   class="vbtn vbtn-sm">INV</div>
            <div id="vbtn-use"   class="vbtn vbtn-sm">USE</div>
        </div>
        <div class="vbtn-row">
            <div id="vbtn-place" class="vbtn">📦</div>
            <div id="vbtn-mine"  class="vbtn">⛏</div>
        </div>
        <div class="vbtn-row">
            <div id="vbtn-jump"  class="vbtn vbtn-jump">▲</div>
        </div>
    `;
    document.body.appendChild(panel);
}

// ---- Joystick --------------------------------------------------

function initJoystick() {
    const base = document.getElementById('joy-base');

    function center() {
        const r = base.getBoundingClientRect();
        joystickCX = r.left + r.width  / 2;
        joystickCY = r.top  + r.height / 2;
    }

    base.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (joystickTouchId !== null) return;
        center();
        const t = e.changedTouches[0];
        joystickTouchId = t.identifier;
        applyJoystick(t.clientX, t.clientY);
    }, { passive: false });

    base.addEventListener('touchmove', (e) => {
        e.preventDefault();
        for (const t of e.changedTouches) {
            if (t.identifier === joystickTouchId) {
                applyJoystick(t.clientX, t.clientY);
                break;
            }
        }
    }, { passive: false });

    const release = (e) => {
        for (const t of e.changedTouches) {
            if (t.identifier === joystickTouchId) {
                joystickTouchId = null;
                resetJoystick();
                break;
            }
        }
    };
    base.addEventListener('touchend',   release, { passive: false });
    base.addEventListener('touchcancel', () => { joystickTouchId = null; resetJoystick(); }, { passive: false });
}

function applyJoystick(clientX, clientY) {
    const dx   = clientX - joystickCX;
    const dy   = clientY - joystickCY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const clamp = Math.min(dist, JOY_MOVE_R);
    const angle = Math.atan2(dy, dx);

    // Move thumb visually
    const thumb = document.getElementById('joy-thumb');
    if (thumb) {
        const tx = Math.cos(angle) * clamp;
        const ty = Math.sin(angle) * clamp;
        thumb.style.transform = `translate(${tx}px, ${ty}px)`;
    }

    // Map to game keys
    if (dist < JOY_DEAD) {
        state.keys['ArrowLeft']  = false;
        state.keys['ArrowRight'] = false;
        state.keys['Shift']      = false;
    } else {
        const nx = dx / dist;
        const ny = dy / dist;
        state.keys['ArrowLeft']  = nx < -0.3;
        state.keys['ArrowRight'] = nx >  0.3;
        state.keys['Shift']      = ny >  0.6; // crouch (hold down)
    }
}

function resetJoystick() {
    const thumb = document.getElementById('joy-thumb');
    if (thumb) thumb.style.transform = 'translate(0,0)';
    state.keys['ArrowLeft']  = false;
    state.keys['ArrowRight'] = false;
    state.keys['Shift']      = false;
}

// ---- Action buttons -------------------------------------------

function press(key)   { document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true })); }
function release(key) { document.dispatchEvent(new KeyboardEvent('keyup',   { key, bubbles: true })); }

function initButtons() {
    // Jump (space)
    const jump = document.getElementById('vbtn-jump');
    jump.addEventListener('touchstart',  (e) => { e.preventDefault(); state.keys[' '] = true;  }, { passive: false });
    jump.addEventListener('touchend',    (e) => { e.preventDefault(); state.keys[' '] = false; }, { passive: false });
    jump.addEventListener('touchcancel', ()  => { state.keys[' '] = false; });

    // Mine (hold left-click)
    const mine = document.getElementById('vbtn-mine');
    mine.addEventListener('touchstart',  (e) => { e.preventDefault(); state.mouse.leftDown = true;  }, { passive: false });
    mine.addEventListener('touchend',    (e) => { e.preventDefault(); state.mouse.leftDown = false; }, { passive: false });
    mine.addEventListener('touchcancel', ()  => { state.mouse.leftDown = false; });

    // Place (right-click)
    const place = document.getElementById('vbtn-place');
    place.addEventListener('touchstart',  (e) => { e.preventDefault(); state.mouse.rightDown = true;  }, { passive: false });
    place.addEventListener('touchend',    (e) => { e.preventDefault(); state.mouse.rightDown = false; }, { passive: false });
    place.addEventListener('touchcancel', ()  => { state.mouse.rightDown = false; });

    // Use / Interact (F key)
    const use = document.getElementById('vbtn-use');
    use.addEventListener('touchstart', (e) => { e.preventDefault(); press('f');   }, { passive: false });
    use.addEventListener('touchend',   (e) => { e.preventDefault(); release('f'); }, { passive: false });

    // Inventory (E key toggle)
    const inv = document.getElementById('vbtn-inv');
    inv.addEventListener('touchstart', (e) => { e.preventDefault(); press('e');   }, { passive: false });
    inv.addEventListener('touchend',   (e) => { e.preventDefault(); release('e'); }, { passive: false });
}

// ---- Canvas touch (aim / hotbar) ------------------------------

function initCanvasTouch() {
    state.canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        for (const t of e.changedTouches) {
            const { cx, cy } = toCanvasCoords(t);

            // Hotbar tap: select slot
            const { s, p, sx, sy } = getHotbarLayout();
            if (cy >= sy && cy <= sy + s) {
                for (let i = 0; i < HOTBAR_SIZE; i++) {
                    const slotX = sx + i * (s + p);
                    if (cx >= slotX && cx <= slotX + s) {
                        state.inventory.selectedSlot = i;
                        return;
                    }
                }
            }

            // First free touch becomes the aim touch
            if (canvasTouchId === null) {
                canvasTouchId = t.identifier;
                state.mouse.x = cx;
                state.mouse.y = cy;
            }
        }
    }, { passive: false });

    state.canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        for (const t of e.changedTouches) {
            if (t.identifier !== canvasTouchId) continue;
            const { cx, cy } = toCanvasCoords(t);
            state.mouse.x = cx;
            state.mouse.y = cy;
            break;
        }
    }, { passive: false });

    state.canvas.addEventListener('touchend', (e) => {
        for (const t of e.changedTouches) {
            if (t.identifier === canvasTouchId) { canvasTouchId = null; break; }
        }
    }, { passive: false });

    state.canvas.addEventListener('touchcancel', () => { canvasTouchId = null; });
}

function toCanvasCoords(touch) {
    const rect = state.canvas.getBoundingClientRect();
    const scaleX = state.canvas.width  / rect.width;
    const scaleY = state.canvas.height / rect.height;
    return {
        cx: (touch.clientX - rect.left) * scaleX,
        cy: (touch.clientY - rect.top)  * scaleY,
    };
}
