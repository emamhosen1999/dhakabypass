import VideoEmbedBlock from '../../../components/blocks/VideoEmbedBlock.jsx';

/**
 * Video — drone footage, a 360° tour, a construction milestone film.
 *
 * Until this existed there was NO path to video on the site: the sanitiser
 * strips <iframe> from every rich-text field, on purpose, so nobody can paste
 * an arbitrary third-party frame into a page. This block is the single
 * sanctioned way in, and it stays safe by never building an embed URL from
 * what the operator typed — see lib/blocks/video.js.
 *
 * The operator can paste the ordinary watch URL; the id is extracted and
 * validated. A reference that does not parse renders nothing rather than a
 * broken frame.
 */
export default {
  type: 'video-embed',
  label: 'Video',
  fields: [
    { name: 'heading', type: 'text', label: 'Heading' },
    { name: 'intro', type: 'text', label: 'Introduction' },
    {
      name: 'provider', type: 'select', label: 'Where the video is', default: 'youtube',
      options: [
        { value: 'youtube', label: 'YouTube' },
        { value: 'vimeo', label: 'Vimeo' },
        { value: 'hosted', label: 'A file uploaded to this site' },
      ],
    },
    {
      name: 'reference', type: 'text', label: 'Video link or id', required: true,
      // e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ, or /uploads/tour.mp4
    },
    // Shown until the visitor presses play. Without it, YouTube's own thumbnail
    // is used for YouTube; hosted files show a plain play button.
    { name: 'poster', type: 'image', label: 'Poster image (shown before play)' },
    { name: 'caption', type: 'text', label: 'Caption' },
    // A transcript or text description is what makes video accessible to a
    // reader who cannot watch it. Optional here, but the block labels it.
    { name: 'transcriptHref', type: 'text', label: 'Link to a transcript or description' },
  ],
  Component: VideoEmbedBlock,
};
