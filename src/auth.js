// ============================================================
// AUTH.JS - Supabase account creation and login
// ============================================================
import { state } from './state.js';
import { supabase, usernameToEmail } from './supabase.js';

function setAccountReady(username, session) {
    state.playerAccount       = username;
    state.multiplayerName     = username;
    state.supabaseSession     = session;
    state.accountError        = null;
    state.accountLoading      = false;
    state.accountInput        = '';
    state.accountPassword     = '';
    localStorage.setItem('lm2d_account', username);
    state.gameState = 'menu';
    document.title = "Leef & Maggie's Minecraft 2D \u2014 A Two-Block Building Adventure";
}

export async function createAccount(username, password) {
    state.accountLoading = true;
    state.accountError   = null;

    const { data, error } = await supabase.auth.signUp({
        email: usernameToEmail(username),
        password,
        options: { data: { username } }
    });

    if (error) {
        state.accountLoading = false;
        // Friendlier messages for common cases
        if (error.message.includes('already registered')) {
            state.accountError = 'Username taken — try a different one.';
        } else if (error.message.includes('Password')) {
            state.accountError = 'Password must be at least 6 characters.';
        } else {
            state.accountError = error.message;
        }
        return;
    }

    setAccountReady(username, data.session);
}

export async function loginAccount(username, password) {
    state.accountLoading = true;
    state.accountError   = null;

    const { data, error } = await supabase.auth.signInWithPassword({
        email: usernameToEmail(username),
        password,
    });

    if (error) {
        state.accountLoading = false;
        if (error.message.includes('Invalid login')) {
            state.accountError = 'Wrong password — try again.';
        } else {
            state.accountError = error.message;
        }
        return;
    }

    const displayName = data.user.user_metadata?.username || username;
    setAccountReady(displayName, data.session);
}

export async function checkExistingSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        const username = session.user.user_metadata?.username
            || session.user.email.split('@')[0];
        state.playerAccount   = username;
        state.multiplayerName = username;
        state.supabaseSession = session;
        localStorage.setItem('lm2d_account', username);
        return true;
    }
    return false;
}

export async function signOut() {
    await supabase.auth.signOut();
    state.supabaseSession = null;
    state.playerAccount   = null;
    state.multiplayerName = 'Player';
    localStorage.removeItem('lm2d_account');
}
