import { describe, it, expect } from 'vitest';
import { stitch, clipToTerminals, simplify, chainages, nearestOnLine, clipChainage } from '../../lib/corridor/geometry-import.js';
const p=(lng,lat=24)=>({lat,lng});

describe('continuous road import',()=>{
  it('finds the terminal through an interior junction, ignoring a nearby dead end',()=>{
    const a=p(90),b=p(90.01),c=p(90.02),d=p(90.03),dead=p(90.001,24.001);
    const route=stitch([[dead,a],[c,b,a],[d,c]],a,d,0);
    expect(route).toEqual([a,b,c,d]);
  });
  it('does not double back along a parallel carriageway',()=>{
    const a=p(90),b=p(90.01),c=p(90.02),parallel=p(90.01,24.001);
    expect(stitch([[a,b,c],[c,parallel,a]],a,c,0)).toEqual([a,b,c]);
  });
  it('refuses disconnected fragments instead of inventing a long straight link',()=>{
    expect(stitch([[p(90),p(90.01)],[p(90.014),p(90.03)]],p(90),p(90.03))).toEqual([]);
  });
  it('accepts a bounded endpoint rounding gap',()=>{
    const route=stitch([[p(90),p(90.01)],[p(90.01001),p(90.02)]],p(90),p(90.02));
    expect(route).toHaveLength(4);
  });
  it('finds distance to a long segment rather than just its sparse vertices',()=>{
    expect(nearestOnLine([p(90),p(90.1)],p(90.05)).metres).toBeLessThan(.001);
  });
  it('clips terminals inside segments and preserves travel direction',()=>{
    const result=clipToTerminals([p(90.03),p(90.02),p(90.01),p(90)],p(90.005),p(90.025));
    expect(result.line.map(q=>q.lng)).toEqual([90.005,90.01,90.02,90.025]);
    expect(result.startOffM).toBeLessThan(.001);
  });
  it('clips two terminals within the same segment',()=>{
    expect(clipToTerminals([p(90),p(90.1)],p(90.02),p(90.04)).line).toEqual([p(90.02),p(90.04)]);
  });
  it('keeps real bends and removes collinear samples',()=>{
    const line=[p(90),p(90.005),p(90.01),p(90.015,24.005),p(90.02)];
    expect(simplify(line,5)).toEqual([line[0],line[2],line[3],line[4]]);
  });
  it('measures chainage cumulatively without rounding every leg',()=>{
    const line=[p(90),p(90.01),p(90.02)];
    const measured=chainages(line);
    expect(measured[0].chainage_m).toBe(0);
    expect(measured[2].chainage_m).toBeGreaterThan(2000);
    expect(measured[2].chainage_m).toBeLessThan(2050);
  });
  it('clips approach highlights to the same 500 metre standard',()=>{
    const result=clipChainage([p(90),p(90.01),p(90.02)],300,1300);
    expect(chainages(result).at(-1).chainage_m).toBeCloseTo(1000,0);
  });
});
