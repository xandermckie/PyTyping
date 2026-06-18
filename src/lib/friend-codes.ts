import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import { importFriendShareJson, validateFriendShareBundle } from './friend-share';
import type { FriendShareBundle } from '../types/replay';
import type { ImportFriendShareResult } from './friend-share';

export const FRIEND_CODE_PREFIX = 'PYT1:';
export const FRIEND_CODE_MAX_LENGTH = 12_000;

export type EncodeFriendCodeResult = { ok: true; code: string } | { ok: false; error: string };

export function encodeFriendCode(bundle: FriendShareBundle): EncodeFriendCodeResult {
  const validated = validateFriendShareBundle(bundle);
  if (!validated) return { ok: false, error: 'Invalid share bundle.' };
  const json = JSON.stringify(validated);
  const compressed = compressToEncodedURIComponent(json);
  const code = `${FRIEND_CODE_PREFIX}${compressed}`;
  if (code.length > FRIEND_CODE_MAX_LENGTH) {
    return {
      ok: false,
      error: 'Code too long — remove profile photo or share a shorter replay.',
    };
  }
  return { ok: true, code };
}

export function decodeFriendCode(raw: string): ImportFriendShareResult {
  const trimmed = raw.trim();
  if (!trimmed.startsWith(FRIEND_CODE_PREFIX)) {
    return { ok: false, error: 'Invalid friend code (must start with PYT1:).' };
  }
  const payload = trimmed.slice(FRIEND_CODE_PREFIX.length);
  if (!payload) return { ok: false, error: 'Friend code is empty.' };
  if (trimmed.length > FRIEND_CODE_MAX_LENGTH) {
    return { ok: false, error: 'Friend code is too long.' };
  }
  let json: string | null;
  try {
    json = decompressFromEncodedURIComponent(payload);
  } catch {
    return { ok: false, error: 'Could not decode friend code.' };
  }
  if (!json) return { ok: false, error: 'Could not decode friend code.' };
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, error: 'Friend code contains invalid data.' };
  }
  const bundle = validateFriendShareBundle(parsed);
  if (!bundle) return { ok: false, error: 'Friend code is not a valid PyTyping friend bundle.' };
  return importFriendShareJson(JSON.stringify(bundle));
}

/** Import from friend code or JSON file text. */
export function importFriendPayload(text: string): ImportFriendShareResult {
  const trimmed = text.trim();
  if (trimmed.startsWith(FRIEND_CODE_PREFIX)) return decodeFriendCode(trimmed);
  return importFriendShareJson(trimmed);
}
