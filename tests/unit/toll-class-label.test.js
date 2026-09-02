import { describe, it, expect } from 'vitest';
import { classLabel } from '../../lib/corridor/tolls.js';

const row = {
  vehicle_class: 'car',
  class_labels: { en: 'Sedan / Private Car', bn: 'প্রাইভেট কার' },
};

describe('classLabel', () => {
  it('returns the requested locale', () => {
    expect(classLabel(row, 'bn')).toBe('প্রাইভেট কার');
  });

  it('falls back to English when the locale is missing', () => {
    expect(classLabel(row, 'zh')).toBe('Sedan / Private Car');
  });

  it('falls back to the raw class when there is no label at all', () => {
    // Ugly, but a price with no vehicle name beside it is unreadable.
    expect(classLabel({ vehicle_class: 'microbus', class_labels: {} }, 'en')).toBe('microbus');
    expect(classLabel({ vehicle_class: 'microbus', class_labels: null }, 'en')).toBe('microbus');
  });

  it('ignores an empty-string label rather than rendering a blank cell', () => {
    expect(classLabel({ vehicle_class: 'car', class_labels: { en: 'Car', bn: '' } }, 'bn')).toBe('Car');
  });

  it('does not resolve inherited Object properties', () => {
    // A hand-edited row could name a locale 'constructor' or 'toString'; a bare
    // labels[locale] lookup would find the prototype's and render it.
    expect(classLabel(row, 'constructor')).toBe('Sedan / Private Car');
    expect(classLabel(row, 'toString')).toBe('Sedan / Private Car');
  });

  it('survives a malformed class_labels value', () => {
    expect(classLabel({ vehicle_class: 'bus', class_labels: 'nope' }, 'en')).toBe('bus');
    expect(classLabel({ vehicle_class: 'bus', class_labels: ['a'] }, 'en')).toBe('bus');
  });

  it('returns empty string for a missing row rather than throwing', () => {
    expect(classLabel(null, 'en')).toBe('');
    expect(classLabel({}, 'en')).toBe('');
  });
});
