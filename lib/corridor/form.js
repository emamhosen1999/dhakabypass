import { parseChainage } from './chainage.js';

/**
 * Reads a chainage from an admin form. Pure and synchronous, so it cannot live
 * in the 'use server' module. Throws a message that tells the editor the format
 * rather than a validation code.
 */
export function parseChainageField(value) {
  const metres = parseChainage(typeof value === 'string' ? value : String(value ?? ''));
  if (metres === null) {
    throw new Error('Enter a chainage like K3+900, or a plain number of metres');
  }
  return metres;
}
