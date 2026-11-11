// claude.ai runtime capabilities (db, user, sample, dictation, tts, assets, downloads).
// Every feature degrades gracefully when a capability is absent (null): local data, browser speech, placeholders.
import { useEffect, useState } from 'react';

/* eslint-disable @typescript-eslint/no-explicit-any */
const memo: Record<string, Promise<any>> = {};
export function cap<T = any>(name: string): Promise<T | null> {
  if (!memo[name]) {
    const c = (window as unknown as { claude?: { use: (n: string) => Promise<unknown> } }).claude;
    memo[name] = c?.use
      ? Promise.race([c.use(name).catch(() => null), new Promise((r) => setTimeout(() => r(null), 10000))])
      : Promise.resolve(null);
  }
  return memo[name] as Promise<T | null>;
}
/** undefined while loading, null when unavailable. */
export function useCap<T = any>(name: string): T | null | undefined {
  const [v, setV] = useState<T | null | undefined>(undefined);
  useEffect(() => { let on = true; cap<T>(name).then((x) => on && setV(x)); return () => { on = false; }; }, [name]);
  return v;
}

/** Viewer identity (null outside claude.ai). */
export function useViewer() {
  const user = useCap<any>('user');
  const [me, setMe] = useState<{ id: string | null; isOwner: boolean; canEdit: boolean } | null>(null);
  useEffect(() => {
    if (!user) return;
    Promise.all([user.id(), user.isOwner(), user.canEdit()]).then(([id, isOwner, canEdit]) => setMe({ id, isOwner, canEdit })).catch(() => {});
  }, [user]);
  return { user, me };
}

/* Voice: preloaded so dictation.start() can run directly inside a click. */
export const voice: { dict: any | null; tts: any | null } = { dict: null, tts: null };
export function initVoice() {
  cap('dictation').then((d) => { voice.dict = d; });
  cap('tts').then((t) => { voice.tts = t; });
}

/* Shared photos: slot id -> asset id, kept in db doc settings/photos and edited from the Team dashboard. */
let photoMap: Record<string, string> = {};
const listeners = new Set<() => void>();
export function initPhotos() {
  cap<any>('db').then((db) => {
    if (!db) return;
    try {
      db.doc('settings/photos').onSnapshot((snap: any) => {
        photoMap = (snap.exists ? snap.data() : {}) ?? {};
        listeners.forEach((f) => f());
      }, () => {});
    } catch { /* ignore */ }
  });
}
export function usePhotos() {
  const [, force] = useState(0);
  useEffect(() => { const f = () => force((n) => n + 1); listeners.add(f); return () => { listeners.delete(f); }; }, []);
  return photoMap;
}
export const blobUrl = (id: string) => `/_blob/${id}`;
