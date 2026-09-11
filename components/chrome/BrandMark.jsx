/**
 * The DBEDC mark.
 *
 * The header rendered the letters "DB" in a filled amber square. The company
 * has a distinctive logo — a blue ellipse with a road opening through it — and
 * the site never used it; /logo.webp was referenced only by the JSON-LD.
 *
 * Inlined rather than an <img> so the ring can take `currentColor`: the mark
 * sits on the dark plate in the header and on light surfaces elsewhere, and
 * DBEDC blue measures only 3.06:1 on --db-plate-bg, which would leave it
 * barely visible. The wedge keeps the brand orange in both places (5.83:1 on
 * the plate). Decorative here — the brand name beside it is the accessible
 * name of the link — so it carries aria-hidden and no title.
 *
 * Geometry matches public/brand/dbedc-mark.svg. That file is a REDRAW from a
 * 215px raster, not a vectorisation of the original artwork; it still needs
 * checking against DBEDC's official brand file before it becomes the favicon.
 */
export default function BrandMark({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 212 156"
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      <g fill="currentColor">
        <path
          fillRule="evenodd"
          d="M 106 0 A 106 74 0 1 1 105.99 0 Z M 106 8 A 80 68 0 1 0 106.01 8 Z"
        />
        <path d="M 100 24 C 92 44 88 60 84 72 C 80 86 76 96 72 108 L 38 108 C 44 88 54 66 68 46 C 76 34 90 26 100 24 Z" />
        <path
          transform="translate(212,0) scale(-1,1)"
          d="M 100 24 C 92 44 88 60 84 72 C 80 86 76 96 72 108 L 38 108 C 44 88 54 66 68 46 C 76 34 90 26 100 24 Z"
        />
      </g>
      <path
        fill="var(--db-plate-accent)"
        d="M 98 18 L 114 18 C 122 58 129 108 133 152 L 79 152 C 83 108 90 58 98 18 Z"
      />
    </svg>
  );
}
