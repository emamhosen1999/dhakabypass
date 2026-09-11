// The video block is the ONLY sanctioned path to a third-party frame on this
// site — lib/html/sanitize.js strips <iframe> from everything else on purpose.
// So the security here is that an embed URL is never built from operator
// input, and the CSP allows exactly the two hosts the resolver can produce.
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { resolveVideo, VIDEO_FRAME_HOSTS } from '../../lib/blocks/video.js';
import VideoEmbedBlock from '../../components/blocks/VideoEmbedBlock.jsx';
import { getBlock } from '../../lib/blocks/registry.js';
import '../../lib/blocks/index.js';
import nextConfig from '../../next.config.mjs';

const render = (data, locale = 'en') =>
  renderToStaticMarkup(<VideoEmbedBlock data={data} locale={locale} />);

describe('resolveVideo — the id is validated, the URL is a template', () => {
  it('accepts every form an operator will actually paste for YouTube', () => {
    for (const ref of [
      'dQw4w9WgXcQ',
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://youtu.be/dQw4w9WgXcQ',
      'https://m.youtube.com/watch?v=dQw4w9WgXcQ&t=30',
      'https://www.youtube.com/embed/dQw4w9WgXcQ',
      'https://www.youtube.com/shorts/dQw4w9WgXcQ',
    ]) {
      const v = resolveVideo('youtube', ref);
      expect(v?.id, ref).toBe('dQw4w9WgXcQ');
      expect(v.embed).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&autoplay=1');
    }
  });

  it('accepts Vimeo urls and bare ids', () => {
    expect(resolveVideo('vimeo', '76979871')?.id).toBe('76979871');
    expect(resolveVideo('vimeo', 'https://vimeo.com/76979871')?.embed)
      .toBe('https://player.vimeo.com/video/76979871?dnt=1&autoplay=1');
    expect(resolveVideo('vimeo', 'https://player.vimeo.com/video/76979871?h=abc')?.id).toBe('76979871');
  });

  it('never lets a hostile reference through as an embed', () => {
    for (const ref of [
      'https://evil.example/embed/dQw4w9WgXcQ',
      'javascript:alert(1)',
      '"><iframe src=x>',
      'https://www.youtube.com/watch?v=<script>',
      'https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ',
      '',
    ]) {
      expect(resolveVideo('youtube', ref), ref).toBeNull();
      expect(resolveVideo('vimeo', ref), ref).toBeNull();
    }
  });

  it('hosted files are same-origin video paths only', () => {
    expect(resolveVideo('hosted', '/uploads/tour.mp4')?.src).toBe('/uploads/tour.mp4');
    expect(resolveVideo('hosted', '/media/flyover.webm')?.src).toBe('/media/flyover.webm');
    for (const ref of [
      'https://cdn.example/tour.mp4',
      '//cdn.example/tour.mp4',
      'uploads/tour.mp4',
      '/uploads/../.env',
      '/uploads/tour.exe',
    ]) {
      expect(resolveVideo('hosted', ref), ref).toBeNull();
    }
  });

  it('refuses an unknown provider', () => {
    expect(resolveVideo('dailymotion', 'x7abc')).toBeNull();
  });
});

describe('the CSP allows exactly the hosts the resolver can produce', () => {
  it('frame-src lists VIDEO_FRAME_HOSTS and nothing more', async () => {
    const headers = await nextConfig.headers();
    const csp = headers.find((h) => h.source === '/:locale(en|bn|zh)/:path*')
      .headers.find((x) => x.key === 'Content-Security-Policy').value;
    const frameSrc = csp.split(';').map((s) => s.trim()).find((s) => s.startsWith('frame-src'));
    expect(frameSrc).toBeTruthy();
    const hosts = frameSrc.split(/\s+/).slice(1).filter((h) => h !== "'self'");
    expect(hosts.sort()).toEqual([...VIDEO_FRAME_HOSTS].sort());
  });

  it('every embed the resolver produces is on an allowed host', () => {
    for (const [provider, ref] of [['youtube', 'dQw4w9WgXcQ'], ['vimeo', '76979871']]) {
      const { embed } = resolveVideo(provider, ref);
      expect(VIDEO_FRAME_HOSTS.some((h) => embed.startsWith(h + '/'))).toBe(true);
    }
  });
});

describe('VideoEmbedBlock — click-to-load, and nothing before', () => {
  it('is registered', () => {
    expect(getBlock('video-embed')).toBeTruthy();
  });

  it('server-renders a link to the watch page, never an iframe', () => {
    const html = render({ provider: 'youtube', reference: 'dQw4w9WgXcQ', caption: 'Flyover' });
    expect(html).not.toContain('<iframe');
    expect(html).toContain('href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it('makes no third-party request before play — no provider thumbnail is pulled', () => {
    const html = render({ provider: 'youtube', reference: 'dQw4w9WgXcQ' });
    expect(html).not.toContain('ytimg.com');
    expect(html).not.toContain('vimeocdn');
  });

  it('renders nothing for a reference that does not parse', () => {
    expect(render({ provider: 'youtube', reference: 'not a video' })).toBe('');
  });

  it('uses a native <video> for hosted files — zero script, browser controls', () => {
    const html = render({ provider: 'hosted', reference: '/uploads/tour.mp4' });
    expect(html).toMatch(/<video[^>]*controls/);
    expect(html).not.toContain('<iframe');
  });

  it('gives the play control an accessible name that includes the title', () => {
    const html = render({ provider: 'vimeo', reference: '76979871', heading: 'Naojor interchange from the air' });
    expect(html).toContain('Play video: Naojor interchange from the air');
  });

  it('links the transcript when one is given, localised', () => {
    const html = render(
      { provider: 'vimeo', reference: '76979871', transcriptHref: '/en/transcripts/naojor' },
      'bn',
    );
    expect(html).toContain('প্রতিলিপি পড়ুন');
    expect(html).toContain('href="/en/transcripts/naojor"');
  });
});
