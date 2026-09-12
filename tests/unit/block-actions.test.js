// tests/unit/block-actions.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../auth.js', () => ({ auth: vi.fn() }));
vi.mock('../../lib/content/pages.js', () => ({
  getPageBlocks: vi.fn(),
  addBlock: vi.fn(),
  deleteBlock: vi.fn(),
  reorderBlocks: vi.fn(),
  duplicateBlock: vi.fn(),
  saveBlockTranslation: vi.fn(),
  // Also imported by the sibling actions.js module (same DB module, resolved
  // to the same path) — stub the rest so its top-level import doesn't blow up.
  listPages: vi.fn(),
  createPage: vi.fn(),
  deletePageIfChildless: vi.fn(),
  getPageBySlug: vi.fn(),
}));
vi.mock('../../lib/revalidate.js', () => ({ revalidatePage: vi.fn(), pageTag: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
// The production transport (redirect-with-notice) is tested on its own in
// run-action.test.js; here the bodies' thrown messages are the subject.
vi.mock('../../lib/admin/run-action.js', () => ({ runAction: (fn) => fn() }));

import { auth } from '../../auth.js';
import {
  getPageBlocks, addBlock, deleteBlock, reorderBlocks, duplicateBlock, saveBlockTranslation,
} from '../../lib/content/pages.js';
import { revalidatePage } from '../../lib/revalidate.js';
import { revalidatePath } from 'next/cache';
import { resetRegistry } from '../../lib/blocks/registry.js';
import { registerAllBlocks } from '../../lib/blocks/index.js';
import * as blockActions from '../../app/admin/(dash)/pages-v2/[id]/block-actions.js';
import {
  addBlockAction, deleteBlockAction, duplicateBlockAction, reorderBlocksAction, saveTranslationAction,
} from '../../app/admin/(dash)/pages-v2/[id]/block-actions.js';

function formData(entries) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.set(k, v);
  return fd;
}

const ADMIN_SESSION = { user: { id: 7, isAdmin: true, role: 'admin' } };
const TRANSLATOR_SESSION = { user: { id: 3, isAdmin: true, role: 'translator' } };

function driverError() {
  const err = new Error('Connection lost: The server closed the connection');
  err.code = 'PROTOCOL_CONNECTION_LOST';
  err.sqlMessage = 'Connection lost: The server closed the connection';
  return err;
}

beforeEach(() => {
  vi.clearAllMocks();
  resetRegistry();
  registerAllBlocks();
  auth.mockResolvedValue(ADMIN_SESSION);
});

describe('addBlockAction — error handling', () => {
  it("assertCan's rejection reaches the caller unchanged, and the DB is never touched", async () => {
    auth.mockResolvedValue({ user: { isAdmin: false, role: 'admin' } });
    await expect(
      addBlockAction(formData({ pageId: '1', slug: 'home', type: 'rich-text' }))
    ).rejects.toThrow('Sign in to continue');
    expect(addBlock).not.toHaveBeenCalled();
  });

  it('turns a database failure into the generic message, never the driver text', async () => {
    addBlock.mockRejectedValue(driverError());
    await expect(
      addBlockAction(formData({ pageId: '1', slug: 'home', type: 'rich-text' }))
    ).rejects.toThrow('Could not add the block. Please try again.');
    await expect(
      addBlockAction(formData({ pageId: '1', slug: 'home', type: 'rich-text' }))
    ).rejects.not.toThrow(/Connection lost|PROTOCOL_/);
  });

  it('succeeds and revalidates when the write goes through', async () => {
    addBlock.mockResolvedValue(42);
    await addBlockAction(formData({ pageId: '1', slug: 'home', type: 'rich-text' }));
    expect(revalidatePage).toHaveBeenCalledWith('home');
    expect(revalidatePath).toHaveBeenCalledWith('/admin/pages-v2/1');
  });
});

describe('deleteBlockAction — error handling', () => {
  it('turns a database failure into the generic message, never the driver text', async () => {
    deleteBlock.mockRejectedValue(driverError());
    await expect(
      deleteBlockAction(formData({ pageId: '1', slug: 'home', blockId: '9' }))
    ).rejects.toThrow('Could not delete the block. Please try again.');
    await expect(
      deleteBlockAction(formData({ pageId: '1', slug: 'home', blockId: '9' }))
    ).rejects.not.toThrow(/Connection lost|PROTOCOL_/);
  });

  it("assertCan's rejection reaches the caller unchanged", async () => {
    auth.mockResolvedValue(null);
    await expect(
      deleteBlockAction(formData({ pageId: '1', slug: 'home', blockId: '9' }))
    ).rejects.toThrow('Sign in to continue');
    expect(deleteBlock).not.toHaveBeenCalled();
  });
});

describe('duplicateBlockAction — error handling', () => {
  it('turns a database failure into the generic message, never the driver text', async () => {
    duplicateBlock.mockRejectedValue(driverError());
    await expect(
      duplicateBlockAction(formData({ pageId: '1', slug: 'home', blockId: '9' }))
    ).rejects.toThrow('Could not duplicate the block. Please try again.');
    await expect(
      duplicateBlockAction(formData({ pageId: '1', slug: 'home', blockId: '9' }))
    ).rejects.not.toThrow(/Connection lost|PROTOCOL_/);
  });
});

describe('reorderBlocksAction', () => {
  it("assertCan's rejection reaches the caller unchanged, and the DB is never touched", async () => {
    auth.mockResolvedValue({ user: { isAdmin: true, role: 'translator' } });
    await expect(
      reorderBlocksAction(formData({ pageId: '1', slug: 'home', order: '3,1,2' }))
    ).rejects.toThrow('Your role cannot edit blocks');
    expect(reorderBlocks).not.toHaveBeenCalled();
  });

  it('writes the whole new ordering in ONE reorderBlocks call — no read-modify-write round trip', async () => {
    reorderBlocks.mockResolvedValue(undefined);
    await reorderBlocksAction(formData({ pageId: '1', slug: 'home', order: '9,4,7,2' }));
    expect(reorderBlocks).toHaveBeenCalledTimes(1);
    expect(reorderBlocks).toHaveBeenCalledWith(1, [9, 4, 7, 2]);
    // The old up/down action had to re-read the page to compute a swap.
    expect(getPageBlocks).not.toHaveBeenCalled();
  });

  it('revalidates the public page and the admin path on success', async () => {
    reorderBlocks.mockResolvedValue(undefined);
    await reorderBlocksAction(formData({ pageId: '5', slug: 'about', order: '1,2' }));
    expect(revalidatePage).toHaveBeenCalledWith('about');
    expect(revalidatePath).toHaveBeenCalledWith('/admin/pages-v2/5');
  });

  it.each([
    ['empty', ''],
    ['non-numeric', '3,abc,1'],
    ['duplicated ids', '3,1,3'],
    ['a zero id', '0,1'],
    ['a negative id', '-2,1'],
    ['a fractional id', '1.5,2'],
  ])('rejects a %s order without writing', async (_label, order) => {
    await expect(
      reorderBlocksAction(formData({ pageId: '1', slug: 'home', order }))
    ).rejects.toThrow('That is not a valid block order.');
    expect(reorderBlocks).not.toHaveBeenCalled();
  });

  it('turns a database failure into the generic message, never the driver text', async () => {
    reorderBlocks.mockRejectedValue(driverError());
    await expect(
      reorderBlocksAction(formData({ pageId: '1', slug: 'home', order: '2,1,3' }))
    ).rejects.toThrow('Could not reorder the blocks. Please try again.');
    await expect(
      reorderBlocksAction(formData({ pageId: '1', slug: 'home', order: '2,1,3' }))
    ).rejects.not.toThrow(/Connection lost|PROTOCOL_/);
  });

  it('no longer exports moveBlockAction — one drag is one action, not one swap per reload', () => {
    expect(blockActions.moveBlockAction).toBeUndefined();
  });
});

describe('saveTranslationAction — type validation', () => {
  it('rejects an unregistered block type before any write, leaving the existing translation intact', async () => {
    auth.mockResolvedValue(TRANSLATOR_SESSION);
    // Without this check, an unknown type would flow through parseBlockForm
    // (which returns {} for it) straight to saveBlockTranslation — and
    // because a draft save skips validateBlockData entirely, the ON
    // DUPLICATE KEY UPDATE would silently overwrite the block's existing
    // translation for this locale with an empty object.
    await expect(
      saveTranslationAction(formData({
        pageId: '1', slug: 'home', blockId: '9', locale: 'en', type: 'not-a-real-block', status: 'draft',
      }))
    ).rejects.toThrow('"not-a-real-block" is not a block type');
    expect(saveBlockTranslation).not.toHaveBeenCalled();
  });

  it('rejects an unregistered block type even when publishing', async () => {
    auth.mockResolvedValue(TRANSLATOR_SESSION);
    await expect(
      saveTranslationAction(formData({
        pageId: '1', slug: 'home', blockId: '9', locale: 'en', type: 'not-a-real-block', status: 'published',
      }))
    ).rejects.toThrow('"not-a-real-block" is not a block type');
    expect(saveBlockTranslation).not.toHaveBeenCalled();
  });
});

describe('saveTranslationAction — locale validation', () => {
  it('rejects an unsupported locale before any write, leaving the existing translation intact', async () => {
    auth.mockResolvedValue(TRANSLATOR_SESSION);
    await expect(
      saveTranslationAction(formData({
        pageId: '1', slug: 'home', blockId: '9', locale: 'fr', type: 'rich-text', status: 'draft',
        'f.heading': 'Hi', 'f.body': '<p>x</p>',
      }))
    ).rejects.toThrow('"fr" is not a supported language');
    expect(saveBlockTranslation).not.toHaveBeenCalled();
  });

  it('rejects an empty locale', async () => {
    auth.mockResolvedValue(TRANSLATOR_SESSION);
    await expect(
      saveTranslationAction(formData({
        pageId: '1', slug: 'home', blockId: '9', locale: '', type: 'rich-text', status: 'draft',
      }))
    ).rejects.toThrow('is not a supported language');
    expect(saveBlockTranslation).not.toHaveBeenCalled();
  });
});

describe('saveTranslationAction — status validation', () => {
  it('rejects an invalid status with a clear message and does not write', async () => {
    auth.mockResolvedValue(TRANSLATOR_SESSION);
    await expect(
      saveTranslationAction(formData({
        pageId: '1', slug: 'home', blockId: '9', locale: 'en', type: 'rich-text',
        status: 'xyz', 'f.heading': 'Hi', 'f.body': '<p>x</p>',
      }))
    ).rejects.toThrow('Status must be "draft" or "published"');
    expect(saveBlockTranslation).not.toHaveBeenCalled();
  });

  it('rejects a "missing" status the same as any other invalid value', async () => {
    auth.mockResolvedValue(TRANSLATOR_SESSION);
    await expect(
      saveTranslationAction(formData({
        pageId: '1', slug: 'home', blockId: '9', locale: 'en', type: 'rich-text',
        status: 'missing', 'f.heading': 'Hi', 'f.body': '<p>x</p>',
      }))
    ).rejects.toThrow('Status must be "draft" or "published"');
    expect(saveBlockTranslation).not.toHaveBeenCalled();
  });

  it('accepts "draft", even with required fields missing', async () => {
    auth.mockResolvedValue(TRANSLATOR_SESSION);
    saveBlockTranslation.mockResolvedValue(undefined);
    await saveTranslationAction(formData({
      pageId: '1', slug: 'home', blockId: '9', locale: 'en', type: 'rich-text', status: 'draft',
    }));
    expect(saveBlockTranslation).toHaveBeenCalledWith(
      expect.objectContaining({ blockId: 9, locale: 'en', status: 'draft' })
    );
  });

  it('accepts "published" when validation passes', async () => {
    auth.mockResolvedValue(TRANSLATOR_SESSION);
    saveBlockTranslation.mockResolvedValue(undefined);
    await saveTranslationAction(formData({
      pageId: '1', slug: 'home', blockId: '9', locale: 'en', type: 'rich-text', status: 'published',
      'f.heading': 'Hi', 'f.body': '<p>x</p>',
    }));
    expect(saveBlockTranslation).toHaveBeenCalledWith(
      expect.objectContaining({ blockId: 9, locale: 'en', status: 'published' })
    );
  });

  it('still rejects an incomplete publish with the validation message', async () => {
    auth.mockResolvedValue(TRANSLATOR_SESSION);
    await expect(
      saveTranslationAction(formData({
        pageId: '1', slug: 'home', blockId: '9', locale: 'en', type: 'rich-text', status: 'published',
      }))
    ).rejects.toThrow(/required/);
    expect(saveBlockTranslation).not.toHaveBeenCalled();
  });
});

describe('saveTranslationAction — error handling', () => {
  it('turns a database failure into the generic message, never the driver text', async () => {
    auth.mockResolvedValue(TRANSLATOR_SESSION);
    saveBlockTranslation.mockRejectedValue(driverError());
    await expect(
      saveTranslationAction(formData({
        pageId: '1', slug: 'home', blockId: '9', locale: 'en', type: 'rich-text', status: 'draft',
        'f.heading': 'Hi', 'f.body': '<p>x</p>',
      }))
    ).rejects.toThrow('Could not save. Please try again.');
    await expect(
      saveTranslationAction(formData({
        pageId: '1', slug: 'home', blockId: '9', locale: 'en', type: 'rich-text', status: 'draft',
        'f.heading': 'Hi', 'f.body': '<p>x</p>',
      }))
    ).rejects.not.toThrow(/Connection lost|PROTOCOL_/);
  });

  it("assertCan's rejection ('translate' required) reaches the caller unchanged, and the DB is never touched", async () => {
    auth.mockResolvedValue({ user: { isAdmin: true, role: 'nobody' } });
    await expect(
      saveTranslationAction(formData({
        pageId: '1', slug: 'home', blockId: '9', locale: 'en', type: 'rich-text', status: 'draft',
      }))
    ).rejects.toThrow('Your role cannot translate');
    expect(saveBlockTranslation).not.toHaveBeenCalled();
  });
});

describe('revalidatePage empty-slug guard', () => {
  it('addBlockAction still revalidates the admin path when slug is missing, without throwing', async () => {
    addBlock.mockResolvedValue(1);
    await expect(
      addBlockAction(formData({ pageId: '1', slug: '', type: 'rich-text' }))
    ).resolves.toBeUndefined();
    expect(revalidatePage).not.toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith('/admin/pages-v2/1');
  });

  it('saveTranslationAction still revalidates the admin path when slug is missing, without throwing', async () => {
    auth.mockResolvedValue(TRANSLATOR_SESSION);
    saveBlockTranslation.mockResolvedValue(undefined);
    await expect(
      saveTranslationAction(formData({
        pageId: '1', slug: '', blockId: '9', locale: 'en', type: 'rich-text', status: 'draft',
      }))
    ).resolves.toBeUndefined();
    expect(revalidatePage).not.toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith('/admin/pages-v2/1');
  });
});
