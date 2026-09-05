import { describe, it, expect, vi } from 'vitest';
vi.mock('../../lib/db.js', () => ({ query: vi.fn(), withTransaction: vi.fn() }));
import { withTransaction } from '../../lib/db.js';
import { parseSection, parseMonthly, saveSection, saveSources } from '../../lib/corridor/traffic-admin.js';
import { parseFlow, freshSections, fetchSectionFlows, TOMTOM_FRESH_MS } from '../../lib/corridor/tomtom.js';

const form = values => new Map(Object.entries(values));
const point = { lat: 23.9, lng: 90.4 };
const payload = overrides => ({ flowSegmentData: {
  currentSpeed: 60, freeFlowSpeed: 80, confidence: .9, roadClosure: false, frc: 'FRC1',
  coordinates: { coordinate: [{ latitude: 23.899, longitude: 90.4 }, { latitude: 23.901, longitude: 90.4 }] },
  ...overrides,
} });

describe('operator traffic validation', () => {
  it('preserves zero and distinguishes an unmeasured section', () => {
    expect(parseSection(form({id:'1', condition_key:'closed', avg_speed_kmh:'0'}))).toEqual({id:1,condition:'closed',speed:0});
    expect(parseSection(form({id:'1', condition_key:'unknown', avg_speed_kmh:''})).speed).toBeNull();
  });
  it.each(['-1', '251', '1.5', 'Infinity', '1e2'])('rejects invalid speed %s', speed => {
    expect(() => parseSection(form({id:'1', condition_key:'free', avg_speed_kmh:speed}))).toThrow();
  });
  it.each(['unknown', 'closed'])('rejects moving speed for %s', condition => {
    expect(() => parseSection(form({id:'1', condition_key:condition, avg_speed_kmh:'20'}))).toThrow();
  });
  it('validates monthly rows without losing zero counts', () => {
    expect(parseMonthly(form({month:'2026-09',plaza:'all',vehicles:'0'}))).toEqual({id:null,month:'2026-09',plaza:'all',vehicles:0});
    for (const patch of [{month:'2026-13'}, {vehicles:'-1'}, {vehicles:'2147483648'}, {plaza:'<script>'}, {id:'0'}]) {
      expect(() => parseMonthly(form({month:'2026-09',plaza:'all',vehicles:'1',...patch}))).toThrow();
    }
  });
  it('requires separate confirmation before either sample label can disappear', async () => {
    await expect(saveSources(form({traffic_source:'operator',monthly_source:'sample'}))).rejects.toThrow(/Confirm/);
    await expect(saveSources(form({traffic_source:'sample',monthly_source:'operator'}))).rejects.toThrow(/Confirm/);
  });
  it('cannot turn on TomTom without a successful refresh', async () => {
    const q=vi.fn().mockResolvedValue([{value:'"sample"'}]);
    withTransaction.mockImplementation(fn=>fn(q));
    await expect(saveSources(form({traffic_source:'tomtom',monthly_source:'sample'}))).rejects.toThrow(/successful/);
    expect(q).toHaveBeenCalledTimes(1);
  });
  it('refuses to overwrite a TomTom reading through an operator form', async () => {
    const q=vi.fn().mockResolvedValue([{value:'"tomtom"'}]);
    withTransaction.mockImplementation(fn=>fn(q));
    await expect(saveSection({id:1,condition:'free',speed:70})).rejects.toThrow(/Switch/);
    expect(q).toHaveBeenCalledTimes(1);
  });
});

describe('traffic provider quality gates', () => {
  it('accepts a matched road reading and closure takes precedence', () => {
    expect(parseFlow(payload(),point)).toEqual({condition:'moderate',speed:60});
    expect(parseFlow(payload({roadClosure:true}),point)).toEqual({condition:'closed',speed:0});
  });
  it.each([{confidence:.6},{frc:'FRC6'},{currentSpeed:-1},{freeFlowSpeed:0},{roadClosure:'false'}])('rejects unusable readings %j', overrides => {
    expect(()=>parseFlow(payload(overrides),point)).toThrow();
  });
  it('rejects a reading on another nearby road', () => {
    expect(()=>parseFlow(payload(),{lat:23.9,lng:90.41})).toThrow(/matched/);
  });
  it('expires provider measurements but preserves operator measurements', () => {
    const now=Date.parse('2026-09-05T06:00:00Z');
    const rows=[{condition_key:'free',avg_speed_kmh:70,measured_at:new Date(now-TOMTOM_FRESH_MS-1)}];
    expect(freshSections(rows,'tomtom',now)[0].condition_key).toBe('unknown');
    expect(freshSections(rows,'operator',now)).toBe(rows);
    expect(freshSections([{...rows[0],measured_at:new Date(now)}],'tomtom',now)[0].condition_key).toBe('free');
  });
  it('fails the whole refresh if any section fails and hides the API key in errors', async () => {
    const fetchImpl=vi.fn().mockRejectedValue(new Error('secret-key'));
    await expect(fetchSectionFlows([{id:1,point}],{key:'secret-key',fetchImpl})).rejects.toThrow('Existing measurements were kept');
    expect(fetchImpl.mock.calls[0][0].searchParams.get('unit')).toBe('kmph');
  });
});
