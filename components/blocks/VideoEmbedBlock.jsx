import { t } from '../../lib/i18n/ui.js';
import { resolveVideo } from '../../lib/blocks/video.js';
import VideoEmbedPlayer from './VideoEmbedPlayer.jsx';

const text = (v) => (typeof v === 'string' ? v.trim() : '');

/**
 * Video, resolved strictly and loaded only on request.
 *
 * The provider and reference are resolved by lib/blocks/video.js, which builds
 * the embed URL from a fixed template and a validated id — never from the
 * operator's string. A reference that does not parse renders nothing: a
 * missing video is an honest gap, a broken frame is a bug on the page.
 *
 * YouTube and Vimeo go behind a click-to-load facade (VideoEmbedPlayer), so
 * no third-party request happens until a person presses play. Hosted files
 * use a native <video> element with the browser's own controls, which is the
 * most accessible player there is and costs zero script.
 */
export default function VideoEmbedBlock({ data, locale }) {
  const video = resolveVideo(data?.provider, data?.reference);
  if (!video) return null;

  const heading = text(data?.heading);
  const intro = text(data?.intro);
  const caption = text(data?.caption);
  const poster = text(data?.poster);
  const transcript = text(data?.transcriptHref);
  const title = heading || caption || t(locale, 'videoTitle');

  return (
    <section className="db-block db-video">
      {heading ? <h2 className="db-h2">{heading}</h2> : null}
      {intro ? <p className="db-lede">{intro}</p> : null}
      <figure className="db-video-figure">
        {video.provider === 'hosted' ? (
          <div className="db-video-frame">
            {/* eslint-disable-next-line jsx-a11y/media-has-caption -- a caption
                track is the operator's to supply; the transcript link below is
                the accessible alternative this block can guarantee. */}
            <video controls preload="metadata" poster={poster || undefined} playsInline>
              <source src={video.src} />
              <a href={video.src}>{t(locale, 'videoDownload')}</a>
            </video>
          </div>
        ) : (
          <VideoEmbedPlayer
            embed={video.embed}
            watch={video.watch}
            title={title}
            // No fallback to the provider's own thumbnail. Pulling it from
            // i.ytimg.com would be a third-party request BEFORE anyone
            // pressed play — the exact thing the facade exists to prevent —
            // and img-src 'self' would block it regardless. No poster means a
            // plain play button on the site's own ground.
            poster={poster}
            playLabel={`${t(locale, 'videoPlay')}: ${title}`}
          />
        )}
        {caption || transcript ? (
          <figcaption className="db-video-caption">
            {caption ? <span>{caption}</span> : null}
            {transcript ? (
              <a className="db-video-transcript" href={transcript}>{t(locale, 'videoTranscript')}</a>
            ) : null}
          </figcaption>
        ) : null}
      </figure>
    </section>
  );
}
