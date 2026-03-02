// ============================================================
// AUDIO.JS - Sound effects using Web Audio API (ES Module)
// ============================================================
// Instead of loading sound files, we CREATE sounds using math!
// The Web Audio API lets us generate tones, noise, and effects
// right in the browser. This gives us retro 8-bit style sounds.
// ============================================================

import { state } from './state.js';

// The AudioContext is the "sound engine" of the browser.
// Browsers require a user click/keypress before allowing audio,
// so we create it on the first interaction.
let audioCtx = null;
let audioReady = false;

function initAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    audioReady = true;
}

// Initialize audio on first user interaction (touchstart needed for iOS Safari)
document.addEventListener("click",      initAudio, { once: false });
document.addEventListener("keydown",    initAudio, { once: false });
document.addEventListener("touchstart", initAudio, { once: false });

// Master volume (0 to 1)
const MASTER_VOLUME = 0.3;

// Cooldowns to prevent sound spam
const soundCooldowns = {};
function canPlaySound(name, cooldownMs) {
    const now = performance.now();
    if (soundCooldowns[name] && now - soundCooldowns[name] < cooldownMs) return false;
    soundCooldowns[name] = now;
    return true;
}

// ============================================================
// SOUND HELPER FUNCTIONS
// ============================================================

// Create a simple tone (beep/boop)
function playTone(frequency, duration, type = "square", volume = 0.3, fadeOut = true) {
    if (!audioReady) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    gain.gain.setValueAtTime(volume * MASTER_VOLUME, audioCtx.currentTime);
    if (fadeOut) {
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    }
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + duration);
}

// Create a tone that slides from one pitch to another
function playSlide(startFreq, endFreq, duration, type = "square", volume = 0.3) {
    if (!audioReady) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, audioCtx.currentTime + duration);
    gain.gain.setValueAtTime(volume * MASTER_VOLUME, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + duration);
}

// Create a noise burst (for crunchy/percussive sounds)
function playNoise(duration, volume = 0.3, filterFreq = 4000) {
    if (!audioReady) return;
    const bufferSize = audioCtx.sampleRate * duration;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;

    // Filter to shape the noise
    const filter = audioCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(filterFreq, audioCtx.currentTime);

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(volume * MASTER_VOLUME, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    source.start(audioCtx.currentTime);
}

// ============================================================
// GAME SOUNDS
// ============================================================

// --- MINING HIT (plays repeatedly while mining) ---
export function playMineHit() {
    if (!canPlaySound("mineHit", 150)) return;
    // Short crunchy tap
    playNoise(0.05, 0.2, 2000 + Math.random() * 1000);
    playTone(200 + Math.random() * 100, 0.05, "square", 0.1);
}

// --- BLOCK BREAK (when a block is fully mined) ---
export function playBlockBreak() {
    if (!canPlaySound("blockBreak", 100)) return;
    // Crunchy shatter - multiple quick noise bursts
    playNoise(0.08, 0.3, 3000);
    setTimeout(() => { if (audioReady) playNoise(0.06, 0.2, 2000); }, 30);
    setTimeout(() => { if (audioReady) playNoise(0.04, 0.15, 1500); }, 60);
    playTone(150, 0.1, "square", 0.15);
}

// --- PLACE BLOCK ---
export function playBlockPlace() {
    if (!canPlaySound("blockPlace", 80)) return;
    // Solid thud
    playTone(180, 0.1, "sine", 0.25);
    playNoise(0.04, 0.15, 1500);
}

// --- FOOTSTEP ---
export function playFootstep() {
    if (!canPlaySound("footstep", 250)) return;
    // Soft quick tap
    playNoise(0.03, 0.08, 800 + Math.random() * 400);
}

// --- JUMP ---
export function playJump() {
    if (!canPlaySound("jump", 200)) return;
    // Quick upward swoosh
    playSlide(150, 400, 0.15, "sine", 0.2);
}

// --- LAND (after falling) ---
export function playLand() {
    if (!canPlaySound("land", 150)) return;
    // Thump
    playTone(100, 0.1, "sine", 0.25);
    playNoise(0.05, 0.12, 600);
}

// --- ITEM PICKUP ---
export function playPickup() {
    if (!canPlaySound("pickup", 50)) return;
    // Happy ascending two-note ding
    playTone(600, 0.08, "sine", 0.2);
    setTimeout(() => { if (audioReady) playTone(900, 0.12, "sine", 0.2); }, 60);
}

// --- CRAFTING COMPLETE ---
export function playCraft() {
    if (!canPlaySound("craft", 200)) return;
    // Satisfying metallic clink + ascending notes
    playTone(500, 0.06, "triangle", 0.2);
    setTimeout(() => { if (audioReady) playTone(700, 0.06, "triangle", 0.2); }, 80);
    setTimeout(() => { if (audioReady) playTone(1000, 0.1, "triangle", 0.2); }, 160);
}

// --- EAT FOOD ---
export function playEat() {
    if (!canPlaySound("eat", 150)) return;
    // Crunchy munch sounds
    playNoise(0.04, 0.15, 2500);
    setTimeout(() => { if (audioReady) playNoise(0.04, 0.12, 2000); }, 100);
    setTimeout(() => { if (audioReady) playNoise(0.04, 0.1, 1800); }, 200);
}

// --- HURT (player takes damage) ---
export function playHurt() {
    if (!canPlaySound("hurt", 300)) return;
    // Oof - low hit sound
    playSlide(400, 100, 0.2, "sawtooth", 0.25);
    playNoise(0.08, 0.2, 2000);
}

// --- MOB HIT (when you hit a mob) ---
export function playMobHit() {
    if (!canPlaySound("mobHit", 100)) return;
    // Punchy hit
    playTone(200, 0.08, "square", 0.2);
    playNoise(0.05, 0.15, 3000);
}

// --- TOOL BREAK ---
export function playToolBreak() {
    if (!canPlaySound("toolBreak", 200)) return;
    // Sad descending break sound
    playSlide(800, 200, 0.3, "square", 0.2);
    playNoise(0.1, 0.2, 4000);
}

// --- EXPLOSION (creeper) ---
export function playExplosion() {
    if (!canPlaySound("explosion", 200)) return;
    // Big boom!
    playNoise(0.4, 0.5, 1000);
    playTone(60, 0.3, "sine", 0.4);
    setTimeout(() => { if (audioReady) playNoise(0.3, 0.3, 600); }, 50);
    setTimeout(() => { if (audioReady) playTone(40, 0.2, "sine", 0.3); }, 100);
}

// --- ARROW SHOOT ---
export function playArrowShoot() {
    if (!canPlaySound("arrowShoot", 300)) return;
    // Twang!
    playSlide(800, 200, 0.15, "sawtooth", 0.15);
}

// --- GRUNTURE ROAR ---
export function playGruntureRoar() {
    if (!canPlaySound("gruntureRoar", 4000)) return;
    // Deep, bassy beast roar — low sawtooth growl + sub-bass + noise texture
    playSlide(200, 55, 0.8, "sawtooth", 0.7);
    setTimeout(() => { if (audioReady) playSlide(170, 45, 0.6, "sawtooth", 0.5); }, 120);
    setTimeout(() => { if (audioReady) playSlide(140, 35, 0.5, "sawtooth", 0.35); }, 280);
    playNoise(0.7, 0.35, 350);
    setTimeout(() => { if (audioReady) playNoise(0.5, 0.25, 250); }, 200);
    // Sub-bass punch
    playTone(38, 0.4, "sine", 0.6);
    setTimeout(() => { if (audioReady) playTone(30, 0.3, "sine", 0.4); }, 200);
}

// --- SELECT SLOT ---
export function playSelect() {
    if (!canPlaySound("select", 50)) return;
    // Quick subtle click
    playTone(800, 0.03, "sine", 0.1);
}

// ============================================================
// BACKGROUND MUSIC - Procedural chiptune soundtrack!
// ============================================================
// Plays a calm melody during the day and a spookier one at night.
// Press M to toggle music on/off.
// ============================================================

const MUSIC_VOLUME = 0.12;
const NOTE_INTERVAL = 400; // ms between notes

// Musical notes as frequencies (Hz)
// C4=262, D4=294, E4=330, F4=349, G4=392, A4=440, B4=494, C5=523
const NOTE = {
    C3: 131, D3: 147, E3: 165, F3: 175, G3: 196, A3: 220, B3: 247,
    C4: 262, D4: 294, E4: 330, F4: 349, G4: 392, A4: 440, B4: 494,
    C5: 523, D5: 587, E5: 659, G5: 784,
    REST: 0
};

// Day melody - calm, happy, Minecraft-vibes
const DAY_MELODY = [
    NOTE.E4, NOTE.G4, NOTE.A4, NOTE.G4,
    NOTE.E4, NOTE.REST, NOTE.C4, NOTE.D4,
    NOTE.E4, NOTE.REST, NOTE.G4, NOTE.A4,
    NOTE.G4, NOTE.E4, NOTE.D4, NOTE.C4,
    NOTE.REST, NOTE.REST, NOTE.D4, NOTE.E4,
    NOTE.G4, NOTE.A4, NOTE.REST, NOTE.G4,
    NOTE.E4, NOTE.D4, NOTE.C4, NOTE.REST,
    NOTE.E4, NOTE.G4, NOTE.C5, NOTE.REST,
    NOTE.A4, NOTE.G4, NOTE.E4, NOTE.REST,
    NOTE.C4, NOTE.D4, NOTE.E4, NOTE.G4,
    NOTE.A4, NOTE.REST, NOTE.REST, NOTE.G4,
    NOTE.E4, NOTE.C4, NOTE.D4, NOTE.REST,
];

// Night melody - mysterious, minor key, slightly spooky
const NIGHT_MELODY = [
    NOTE.E3, NOTE.REST, NOTE.G3, NOTE.A3,
    NOTE.REST, NOTE.E3, NOTE.REST, NOTE.B3,
    NOTE.A3, NOTE.REST, NOTE.REST, NOTE.G3,
    NOTE.E3, NOTE.REST, NOTE.D3, NOTE.REST,
    NOTE.E3, NOTE.G3, NOTE.REST, NOTE.A3,
    NOTE.REST, NOTE.REST, NOTE.G3, NOTE.E3,
    NOTE.REST, NOTE.D3, NOTE.E3, NOTE.REST,
    NOTE.REST, NOTE.G3, NOTE.REST, NOTE.A3,
    NOTE.B3, NOTE.REST, NOTE.A3, NOTE.G3,
    NOTE.REST, NOTE.E3, NOTE.REST, NOTE.REST,
    NOTE.D3, NOTE.E3, NOTE.REST, NOTE.G3,
    NOTE.REST, NOTE.REST, NOTE.E3, NOTE.REST,
];

// Bass notes that play alongside the melody (every 4 notes)
const DAY_BASS = [NOTE.C3, NOTE.G3, NOTE.A3, NOTE.E3, NOTE.C3, NOTE.G3, NOTE.F3, NOTE.G3, NOTE.A3, NOTE.E3, NOTE.C3, NOTE.G3];
const NIGHT_BASS = [NOTE.E3, NOTE.D3, NOTE.C3, NOTE.B3, NOTE.A3, NOTE.G3, NOTE.E3, NOTE.D3, NOTE.C3, NOTE.B3, NOTE.A3, NOTE.E3];

// Play a single music note (softer, longer, more musical than SFX)
function playMusicNote(freq, duration, type = "triangle", vol = MUSIC_VOLUME) {
    if (!audioReady || freq === 0) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    // Gentle attack and release for a piano-like feel
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(vol * MASTER_VOLUME, audioCtx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + duration);
}

// Called from the game loop to advance the music
export function updateMusic(dt, dayBrightness) {
    if (!state.musicEnabled || !audioReady) return;

    state.musicTimer += dt;
    if (state.musicTimer < NOTE_INTERVAL) return;
    state.musicTimer -= NOTE_INTERVAL;

    // Pick day or night melody based on brightness
    const isNight = dayBrightness < 0.4;
    if (isNight !== state.musicIsNight) {
        state.musicIsNight = isNight;
        state.musicNoteIndex = 0; // Reset when mood changes
    }

    const melody = isNight ? NIGHT_MELODY : DAY_MELODY;
    const bass = isNight ? NIGHT_BASS : DAY_BASS;

    // Play melody note
    const note = melody[state.musicNoteIndex % melody.length];
    if (note !== NOTE.REST) {
        playMusicNote(note, 0.5, "triangle", MUSIC_VOLUME);
        // Add a quiet octave-up shimmer for richness
        playMusicNote(note * 2, 0.3, "sine", MUSIC_VOLUME * 0.2);
    }

    // Play bass note every 4th beat
    if (state.musicNoteIndex % 4 === 0) {
        const bassNote = bass[Math.floor(state.musicNoteIndex / 4) % bass.length];
        if (bassNote !== NOTE.REST) {
            playMusicNote(bassNote * 0.5, 0.8, "sine", MUSIC_VOLUME * 0.6);
        }
    }

    state.musicNoteIndex++;
}
