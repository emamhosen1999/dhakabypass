'use client';
import { useState } from 'react';

/**
 * The click-to-load facade for a third-party player.
 *
 * Until the visitor presses play, nothing but a poster and a button is on the
 * page — no request leaves this origin for YouTube or Vimeo. That is a privacy
 * property (the privacy page promises analytics is the only third party, and
 * this keeps that true until a person chooses to watch) and a weight property
 * (a YouTube iframe is roughly 500 kB of script; a page with three videos
 * would otherwise ship 1.5 MB before anyone watched anything).
 *
 * Progressive enhancement: the server renders the same poster wrapped in a
 * plain <a> to the watch page. With JavaScript, this component takes over the
 * click and swaps the frame in place. Without it, the link still works.
 */
export default function VideoEmbedPlayer({ embed, watch, title, poster, playLabel, children }) {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <div className="db-video-frame">
        <iframe
          src={embed}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <a
      className="db-video-facade"
      href={watch}
      target="_blank"
      rel="noopener noreferrer"
      style={poster ? { backgroundImage: `url("${poster}")` } : undefined}
      onClick={(e) => {
        e.preventDefault();
        setPlaying(true);
      }}
    >
      {children}
      <span className="db-video-play" aria-hidden="true" />
      <span className="db-visually-hidden">{playLabel}</span>
    </a>
  );
}
