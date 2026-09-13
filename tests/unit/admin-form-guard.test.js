import { describe, it, expect } from 'vitest';
import { flashText } from '../../components/admin/AdminFormGuard.jsx';

describe('AdminFormGuard', () => {
  it('names the outcome after the button that was pressed', () => {
    expect(flashText('Delete this interchange')).toBe('Deleted.');
    expect(flashText('Remove')).toBe('Deleted.');
    expect(flashText('Publish')).toBe('Published.');
    expect(flashText('Save')).toBe('Saved.');
    expect(flashText('')).toBe('Saved.');
  });
});
