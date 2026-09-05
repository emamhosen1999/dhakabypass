/**
 * The corridor, drawn from surveyed coordinates.
 *
 * Presentational only: it is handed a fully-formatted view (lib/corridor/view.js)
 * and draws it. No data access, no geometry, no i18n — so it renders identically
 * on the server and in the browser, which is what lets the map work with
 * JavaScript off and gain zoom, pan and highlighting when JavaScript arrives.
 *
 * NO MAP LIBRARY, and that is a decision rather than a limitation:
 *
 *  - It renders identically for a reader on a 3G phone in Gazipur and one on a
 *    desk in Dhaka. The road-user audience is mobile-heavy and the spec sets a
 *    performance budget on a throttled 3G profile; a map SDK is 200KB+ of
 *    JavaScript before it draws anything.
 *  - It costs no API key, no per-tile billing and no third-party licence on the
 *    operator's own map of the operator's own road.
 *  - It works with JavaScript off, which a schematic of a public road should.
 *
 * A raster basemap can sit UNDERNEATH this: the projection is Web Mercator
 * precisely so an overlay lines up with tiles rather than drifting.
 *
 * ACCESSIBILITY. An SVG map is a picture to a screen reader however carefully
 * it is drawn, so it carries role="img" and one honest label, and the section
 * list beside it is the accessible equivalent — every fact on the map is in
 * that list as text, as a real button, in the tab order. Nothing inside the
 * drawing is focusable: an interactive descendant of role="img" would be
 * announced from inside something assistive technology treats as one picture.
 */
export default function CorridorMap({
  view, viewBox, hovered, selected, onHoverSection, onSelectSection,
}) {
  if (!view || !view.ok) return null;
  const active = selected || hovered;

  return (
    <svg
      className="db-map"
      viewBox={viewBox || view.viewBox}
      role="img"
      aria-label={view.alt}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        {/* Hatching for a closed section — the pattern is what carries the
            meaning for a reader who cannot distinguish the colour. */}
        <pattern id="db-map-closed" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="8" height="8" fill="var(--db-ink-3)" />
          <rect width="4" height="8" fill="var(--db-surface-2)" />
        </pattern>
        <filter id="db-map-pin" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* The coordinate grid, under everything. This is the only thing on the
          map that answers "where is this?" without a basemap: the corridor is
          drawn from surveyed coordinates and the grid is what shows it. The
          degree values are labelled on the two edges the drawing leaves empty
          — meridians along the top, parallels down the far left. */}
      {view.graticule ? (
        <g className="db-map-grid" aria-hidden="true">
          {view.graticule.meridians.map((m) => (
            <g key={`mer-${m.text}`}>
              <line x1={m.x} y1={view.graticule.box.y0} x2={m.x} y2={view.graticule.box.y1} />
              <text x={m.x} y={view.graticule.box.y0 - 12} textAnchor="middle" className="db-map-grid-label">
                {m.text}
              </text>
            </g>
          ))}
          {view.graticule.parallels.map((p) => (
            <g key={`par-${p.text}`}>
              <line x1={view.graticule.box.x0} y1={p.y} x2={view.graticule.box.x1} y2={p.y} />
              <text x="6" y={p.y} dominantBaseline="central" className="db-map-grid-label">
                {p.text}
              </text>
            </g>
          ))}
        </g>
      ) : null}

      {/* The casing: one continuous dark stroke under the coloured sections, so
          the road reads as a single object and the joins between sections do
          not show as seams. */}
      <path d={view.d} className="db-map-casing" />

      {/*
        Each section is a link to its own row in the list beside the map, so the
        map is navigable with no JavaScript at all — the row highlights through
        CSS :target. With JavaScript the same click selects it in place instead,
        and hovering previews it.
      */}
      {view.sections.map((s) => (
        <a
          key={s.id}
          href={`#sec-${s.id}`}
          className={`db-map-hit${active === s.id ? ' is-active' : ''}`}
          aria-hidden="true"
          tabIndex={-1}
          onMouseEnter={onHoverSection ? () => onHoverSection(s.id) : undefined}
          onMouseLeave={onHoverSection ? () => onHoverSection(null) : undefined}
          onClick={onSelectSection ? (e) => { e.preventDefault(); onSelectSection(s.id); } : undefined}
        >
          <title>{s.title}</title>
          {/* An invisible fat stroke: a 7-unit line is a 5px pointer target. */}
          <path d={s.d} className="db-map-hitarea" />
          <path d={s.d} className="db-map-section" stroke={s.stroke} />
        </a>
      ))}

      {/* Facilities are drawn before the waypoints, so a plaza marker never
          covers a numbered corridor point. A facility that is not open yet is
          drawn hollow and dashed: most of the named facilities on this corridor
          are still under construction, and showing them the same as the open
          ones would tell a driver they can stop at a toll plaza that does not
          exist. */}
      {view.features.map((f) => (
        <circle
          key={`f-${f.id}`} cx={f.x} cy={f.y} r="5"
          className={`db-map-feature db-map-feature-${f.kind}${f.pending ? ' db-map-feature-pending' : ''}`}
        />
      ))}

      {/* Facility names, stacked down the right-hand gutter with a leader back
          to the marker. The label may move to avoid its neighbour; the leader
          is what keeps it attached to the place it names. */}
      {view.labels.map((f) => (
        <g key={`l-${f.id}`} className="db-map-label">
          <path
            className="db-map-leader"
            d={`M${f.x.toFixed(1)},${f.y.toFixed(1)} L${(f.labelX - 16).toFixed(1)},${f.labelY.toFixed(1)} L${(f.labelX - 4).toFixed(1)},${f.labelY.toFixed(1)}`}
          />
          <text x={f.labelX} y={f.labelY} fontSize={view.labelFont} dominantBaseline="central" className="db-map-label-text">
            {f.name}
          </text>
        </g>
      ))}

      {view.waypoints.map((w) => (
        <g key={w.code} className="db-map-wp" filter="url(#db-map-pin)">
          <circle cx={w.x} cy={w.y} r={w.terminal ? 14 : 11} className={w.terminal ? 'db-map-terminal' : 'db-map-wp-dot'} />
          <text x={w.x} y={w.y} className={`db-map-wp-label${w.terminal ? ' db-map-wp-label-terminal' : ''}`}
                dominantBaseline="central" textAnchor="middle">
            {w.code}
          </text>
          {/* Suppressed where two waypoints sit too close to label both — the
              marker stays, only the redundant distance goes. Chainage sits to
              the LEFT: the right-hand side of the road is the facility label
              column, and the two ran into each other. */}
          {w.chainageLabel ? (
            <text x={w.x - (w.terminal ? 20 : 16)} y={w.y} className="db-map-wp-km"
                  textAnchor="end" dominantBaseline="central">
              {w.chainageLabel}
            </text>
          ) : null}
        </g>
      ))}

      {/* North arrow, grouped with the scale bar in the bottom-left corner —
          the conventional place for a map's furniture, and the one part of this
          frame the corridor and the label column both leave empty. */}
      <g className="db-map-north" transform={`translate(34, ${(view.height - 78).toFixed(1)})`} aria-hidden="true">
        <path d="M0,-14 L6,8 L0,3 L-6,8 Z" className="db-map-north-arrow" />
        <text y="22" textAnchor="middle" className="db-map-north-label">{view.north}</text>
      </g>

      {view.scale ? (
        <g className="db-map-scale" transform={`translate(24, ${(view.height - 26).toFixed(1)})`} aria-hidden="true">
          <line x1="0" y1="0" x2={view.scale.px.toFixed(1)} y2="0" className="db-map-scale-line" />
          <line x1="0" y1="-4" x2="0" y2="4" className="db-map-scale-line" />
          <line x1={view.scale.px.toFixed(1)} y1="-4" x2={view.scale.px.toFixed(1)} y2="4" className="db-map-scale-line" />
          <text x={(view.scale.px / 2).toFixed(1)} y="-8" textAnchor="middle" className="db-map-scale-label">
            {view.scale.text}
          </text>
        </g>
      ) : null}
    </svg>
  );
}
