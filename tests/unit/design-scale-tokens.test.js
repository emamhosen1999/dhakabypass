// W8.15 (UI-DS-02): corners and elevation come from the token scale, so a
// fifth near-identical radius cannot creep back in beside the four.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const css = readFileSync(path.resolve(import.meta.dirname, '../../app/design-tokens.css'), 'utf8');

describe('radius and shadow scale', () => {
  it('defines the scale once', () => {
    for (const token of ['--db-radius-xs:', '--db-radius-sm:', '--db-radius-md:', '--db-radius-lg:', '--db-shadow-1:', '--db-shadow-2:']) {
      expect(css.split(token).length - 1, token).toBe(1);
    }
  });
  it('uses the tokens instead of the literal steps', () => {
    const body = css.replace(/--db-radius-[a-z]+:[^;]+;|--db-shadow-\d:[^;]+;/g, '');
    expect(body.match(/border-radius:(2|3|4|8)px(?=[;}])/g) || []).toEqual([]);
    expect(body.match(/box-shadow:0 (3px 12px #18334508|5px 20px #18334515)/g) || []).toEqual([]);
  });
});

describe('the traffic ramp is colour-blind safe (W8.15, UI-MAP-01)', () => {
  it('does not use the open-road green for free-flowing traffic', async () => {
    const { CONDITION_COLOUR } = await import('../../lib/corridor/conditions.js');
    expect(CONDITION_COLOUR.free).toBe('var(--db-traffic-free)');
    expect(CONDITION_COLOUR.free).not.toBe(CONDITION_COLOUR.heavy);
  });
  it('defines the blue in light and in both dark forms', () => {
    expect(css.split('--db-traffic-free:').length - 1).toBe(3);
  });
  it('dashes the heaviest condition, so the line is not colour alone', () => {
    expect(css).toMatch(/\.db-map-section\[data-condition="heavy"\]\{[^}]*stroke-dasharray/);
  });
});

describe('print (W8.15, UI-EDGE-02)', () => {
  it('drops the interactive chrome from paper', () => {
    const print = css.slice(css.lastIndexOf('@media print{'));
    for (const cls of ['.db-nav', '.db-locale-switch', '.db-subnav', '.db-footer-nav', '.db-tollcalc']) {
      expect(print, cls).toContain(cls);
    }
  });
  it('sets an A4 page with margins', () => {
    expect(css).toMatch(/@page\{size:A4/);
  });
  it('keeps a section whole rather than splitting it across sheets', () => {
    expect(css).toMatch(/main > \.db-block\{break-inside:avoid/);
  });
});

describe('secondary buttons keep their border', () => {
  // The base .db-btn rule sets a transparent border; a .db-btn-secondary rule
  // declared before it lost by source order and every secondary button on the
  // site rendered as bare text. The restated rule must come after the base.
  it('restates .db-btn-secondary after the base .db-btn rule', () => {
    const base = css.lastIndexOf('.db-btn{');
    const secondary = css.lastIndexOf('.db-btn.db-btn-secondary{');
    expect(secondary).toBeGreaterThan(base);
    expect(css.slice(secondary, secondary + 120)).toMatch(/border-color:var\(--db-ink-3\)/);
  });
});

describe('the corridor map takes the site theme with it', () => {
  // The map shipped with its own palette and a dark branch under
  // [data-theme="dark"] only, so a reader whose system is dark and who has
  // never touched the theme control got a light map on a dark page.
  const mapVars = ['--map-toll', '--map-service', '--map-edge', '--map-median', '--map-ground', '--map-lane-wash', '--map-geo-filter', '--map-direction'];

  it('defines every map colour of its own in light and in both dark forms', () => {
    for (const token of mapVars) {
      expect(css.split(`${token}:`).length - 1, token).toBe(3);
    }
  });

  it('reads the panel, text and rule colours from the site tokens', () => {
    const wrap = css.slice(css.indexOf('.db-map-wrap{--map-'));
    const declared = wrap.slice(0, wrap.indexOf('}'));
    for (const token of ['--map-card', '--map-text', '--map-border', '--map-muted', '--map-selection']) {
      expect(declared, token).toContain(`${token}:var(--db-`);
    }
  });

  it('leaves no map rule that only an explicit dark choice can reach', () => {
    expect(css.match(/\[data-theme="dark"\] \.db-map[a-z-]*/g) || []).toEqual([]);
  });

  it('draws the geography filter and the wrap ground from those variables', () => {
    expect(css).toMatch(/\.db-map-geography\{[^}]*filter:var\(--map-geo-filter\)/);
    expect(css).toMatch(/\.db-map-wrap\{[^}]*background:var\(--map-ground\)/);
    expect(css).toMatch(/\.db-map-lane-sample\{[^}]*background:var\(--map-lane-wash\)/);
  });

  it('corners and elevation stay on the four-step scale', () => {
    // Scoped to the map: a radius that rounds a bar into a pill elsewhere
    // on the site is a shape, not a fifth step.
    const map = css.slice(css.indexOf('/* Geographic corridor explorer'));
    expect(map.match(/border-radius:(5|9|10|14)px(?=[;}])/g) || []).toEqual([]);
    expect(map.match(/#1833450c|#18334510|#19334620/g) || []).toEqual([]);
  });
});
