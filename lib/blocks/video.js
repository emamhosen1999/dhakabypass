/**
 * Video references, resolved strictly.
 *
 * This is the one block that puts a third-party frame on the page, and
 * lib/html/sanitize.js strips <iframe> from every rich-text field precisely so
 * that nobody else can. So the rule here is: an embed URL is NEVER built from
 * operator input. The operator supplies a provider and an id (or pastes a
 * watch URL, which is what they will actually do), the id is validated against
 * the provider's own format, and the embed URL is assembled from a fixed
 * template. Anything that does not parse resolves to null and renders nothing.
 *
 * YouTube goes through youtube-nocookie.com, the privacy-enhanced host: no
 * tracking cookie is set until the visitor presses play. Combined with the
 * click-to-load facade in the component, no request leaves this origin until
 * a person asks to watch.
 */

const YT_ID = /^[A-Za-z0-9_-]{11}$/;
const VIMEO_ID = /^\d{6,12}$/;

/** youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID, youtube.com/shorts/ID, or a bare id. */
function youtubeId(raw) {
  const s = String(raw || '').trim();
  if (YT_ID.test(s)) return s;
  try {
    const u = new URL(s);
    const host = u.hostname.replace(/^www\./, '').replace(/^m\./, '');
    if (host === 'youtu.be') {
      const id = u.pathname.slice(1).split('/')[0];
      return YT_ID.test(id) ? id : null;
    }
    if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      const v = u.searchParams.get('v');
      if (v && YT_ID.test(v)) return v;
      const m = u.pathname.match(/^\/(?:embed|shorts|v)\/([A-Za-z0-9_-]{11})(?:[/?]|$)/);
      if (m) return m[1];
    }
  } catch { /* not a URL */ }
  return null;
}

/** vimeo.com/ID, player.vimeo.com/video/ID, or a bare numeric id. */
function vimeoId(raw) {
  const s = String(raw || '').trim();
  if (VIMEO_ID.test(s)) return s;
  try {
    const u = new URL(s);
    const host = u.hostname.replace(/^www\./, '');
    if (host === 'vimeo.com' || host === 'player.vimeo.com') {
      const m = u.pathname.match(/(\d{6,12})(?:[/?]|$)/);
      if (m) return m[1];
    }
  } catch { /* not a URL */ }
  return null;
}

/**
 * A hosted file must be same-origin: an absolute path under /uploads/ or a
 * bare path into public/. Anything with a scheme or host is refused, so a
 * hosted "video" can never be a request to somebody else's server.
 */
function hostedPath(raw) {
  const s = String(raw || '').trim();
  if (!s) return null;
  if (/^[a-z][a-z0-9+.-]*:/i.test(s) || s.startsWith('//')) return null;
  if (!s.startsWith('/')) return null;
  if (s.includes('..')) return null;
  if (!/\.(mp4|webm|m4v)(\?.*)?$/i.test(s)) return null;
  return s;
}

/**
 * @returns {null | { provider:'youtube', id, embed, watch }
 *                | { provider:'vimeo', id, embed, watch }
 *                | { provider:'hosted', src }}
 */
export function resolveVideo(provider, reference) {
  switch (provider) {
    case 'youtube': {
      const id = youtubeId(reference);
      return id
        ? {
            provider,
            id,
            embed: `https://www.youtube-nocookie.com/embed/${id}?rel=0&autoplay=1`,
            watch: `https://www.youtube.com/watch?v=${id}`,
          }
        : null;
    }
    case 'vimeo': {
      const id = vimeoId(reference);
      return id
        ? {
            provider,
            id,
            embed: `https://player.vimeo.com/video/${id}?dnt=1&autoplay=1`,
            watch: `https://vimeo.com/${id}`,
          }
        : null;
    }
    case 'hosted': {
      const src = hostedPath(reference);
      return src ? { provider, src } : null;
    }
    default:
      return null;
  }
}

/** The hosts the CSP must allow in frame-src for the two providers above. */
export const VIDEO_FRAME_HOSTS = ['https://www.youtube-nocookie.com', 'https://player.vimeo.com'];
