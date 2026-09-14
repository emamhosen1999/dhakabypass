import { describe, it, expect, vi } from 'vitest';
import { sealSecret, openSecret } from '../../lib/cameras/secret.js';
import { rewritePlaylist, upstreamFor, authHeaders, fetchUpstream } from '../../lib/cameras/upstream.js';

vi.mock('../../lib/db.js', () => ({ query: vi.fn() }));

const ENV = { AUTH_SECRET: 'x'.repeat(40) };

describe('camera credentials', () => {
  it('seal and open round-trip, and a different secret cannot open them', () => {
    const sealed = sealSecret('nvr-pass!', ENV);
    expect(sealed).toMatch(/^v1:/);
    expect(sealed).not.toContain('nvr-pass');
    expect(openSecret(sealed, ENV)).toBe('nvr-pass!');
    expect(openSecret(sealed, { AUTH_SECRET: 'y'.repeat(40) })).toBe('');
    expect(sealSecret('', ENV)).toBe('');
  });

  it('sends HTTP Basic only when a username is set', () => {
    expect(authHeaders({ username: '' }).authorization).toBeUndefined();
    expect(authHeaders({ username: 'admin', password: 'p' }).authorization).toBe(`Basic ${Buffer.from('admin:p').toString('base64')}`);
  });
});

describe('HLS relay', () => {
  const stream = 'http://10.0.0.5:8080/live/cam21/index.m3u8';

  it('rewrites segments and child playlists to this camera\'s relay, and drops anything elsewhere', () => {
    const playlist = [
      '#EXTM3U', '#EXT-X-VERSION:3', '#EXT-X-KEY:METHOD=AES-128,URI="key.bin"',
      '#EXTINF:2.0,', 'seg_001.ts', '#EXTINF:2.0,', 'http://10.0.0.5:8080/live/cam21/seg_002.ts?t=9',
      '#EXTINF:2.0,', 'http://evil.example/steal.ts', 'low/index.m3u8',
    ].join('\n');
    const out = rewritePlaylist(playlist, stream, 7).split('\n');
    expect(out).toContain('seg_001.ts'.replace(/^/, '/api/cameras/7/hls/'));
    expect(out).toContain('/api/cameras/7/hls/seg_002.ts?t=9');
    expect(out).toContain('/api/cameras/7/hls/low/index.m3u8');
    expect(out.some((l) => l.includes('evil.example'))).toBe(false);
    expect(out).toContain('#EXT-X-KEY:METHOD=AES-128,URI="/api/cameras/7/hls/key.bin"');
  });

  it('resolves a child playlist\'s segments against the child, relative to the stream root', () => {
    const child = 'http://10.0.0.5:8080/live/cam21/hd/index.m3u8';
    expect(rewritePlaylist('#EXTINF:2,\nseg1.ts\n#EXTINF:2,\n../sd/seg1.ts', child, 7, stream).split('\n'))
      .toEqual(['#EXTINF:2,', '/api/cameras/7/hls/hd/seg1.ts', '#EXTINF:2,', '/api/cameras/7/hls/sd/seg1.ts']);
  });

  it('maps a relay path back inside the stream directory only', () => {
    expect(upstreamFor(stream, ['index.m3u8'])).toBe(stream);
    expect(upstreamFor(stream, ['seg_001.ts'])).toBe('http://10.0.0.5:8080/live/cam21/seg_001.ts');
    expect(upstreamFor(stream, ['low', 'index.m3u8'], '?a=1')).toBe('http://10.0.0.5:8080/live/cam21/low/index.m3u8?a=1');
    expect(upstreamFor(stream, ['..', 'cam22', 'index.m3u8'])).toBeNull();
    expect(upstreamFor(stream, ['../../etc'])).toBeNull();
  });

  it('refuses an upstream body over the size limit', async () => {
    const fetchImpl = vi.fn(async () => new Response(new Uint8Array(20), { status: 200, headers: { 'content-length': '20' } }));
    await expect(fetchUpstream('http://cam/x.jpg', {}, { maxBytes: 10, fetchImpl })).rejects.toThrow(/too large/);
  });
});
