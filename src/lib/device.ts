const HASH_KEY = 'aloha-hunt-device-hash';

/** Stable per-browser device id used for abuse signals. Never a secret. */
export function getDeviceHash() {
  try {
    const existing = window.localStorage.getItem(HASH_KEY);
    if (existing && existing.length >= 8) return existing;
    const id = `dev_${crypto.randomUUID?.() ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`}`;
    window.localStorage.setItem(HASH_KEY, id);
    return id;
  } catch {
    return `dev_session_${Date.now().toString(36)}`;
  }
}

const INTERACT_PREFIX = 'aloha-hunt-interact:';
const COOLDOWN_KEY = 'aloha-hunt-interaction-cooldown-min';

export function readLocalInteractions(userId: string): Record<string, string> {
  if (!userId) return {};
  try {
    const raw = window.localStorage.getItem(INTERACT_PREFIX + userId);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export function writeLocalInteraction(userId: string, stopId: string, at = new Date().toISOString()) {
  const map = readLocalInteractions(userId);
  map[stopId] = at;
  try { window.localStorage.setItem(INTERACT_PREFIX + userId, JSON.stringify(map)); } catch { /* ignore */ }
  return map;
}

export function readInteractionCooldownMin(): number | null {
  try {
    const n = Number(window.localStorage.getItem(COOLDOWN_KEY));
    return Number.isFinite(n) && n >= 0 ? n : null;
  } catch {
    return null;
  }
}

export function writeInteractionCooldownMin(minutes: number) {
  try { window.localStorage.setItem(COOLDOWN_KEY, String(Math.max(0, minutes))); } catch { /* ignore */ }
}
