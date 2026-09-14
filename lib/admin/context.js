import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * What one admin action knows about itself while it runs (W7.4): who is doing
 * it, whether it has already written its own activity row, and what the
 * "Saved." toast should say instead (with an Undo for a delete).
 *
 * Opened by runAction around every admin action; assertCan records the actor
 * as its first step; the history engine and setFlash read and write it. Outside
 * an action (a page render, a test) there is no store and every accessor is a
 * harmless no-op.
 */
const storage = new AsyncLocalStorage();

export function runInActionContext(fn) {
  return storage.run({ actor: '', audited: false, flash: null }, fn);
}

export function actionContext() {
  return storage.getStore() || null;
}

export function setActor(email) {
  const s = storage.getStore();
  if (s && email) s.actor = String(email);
}

export function currentActor() {
  return storage.getStore()?.actor || '';
}

export function markAudited() {
  const s = storage.getStore();
  if (s) s.audited = true;
}

/** The toast text for this action, and optionally a trash entry it can undo. */
export function setFlash(text, { undo = null } = {}) {
  const s = storage.getStore();
  if (s) s.flash = { t: String(text).slice(0, 200), ...(undo ? { u: Number(undo) } : {}) };
}
