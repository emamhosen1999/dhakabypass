'use client';

import { useEffect, useState } from 'react';
import IllustrativeNoticeView from '../corridor/IllustrativeNoticeView.jsx';

/**
 * The answer panel — server-rendered first, then made instant.
 *
 * ---------------------------------------------------------------------------
 * THIS IS THE ENHANCEMENT LAYER, AND IT IS THE SAME MARKUP AS THE FALLBACK
 * ---------------------------------------------------------------------------
 * A client component in the App Router is still rendered on the server. So the
 * HTML a reader with no JavaScript receives is produced by THIS function, from
 * `initial` — the answer the server computed out of the query string. There is
 * no second copy of the panel for the no-JS path to drift away from: the
 * fallback and the enhancement are one component, and the only thing hydration
 * adds is that changing a dropdown answers without a round trip.
 *
 * ---------------------------------------------------------------------------
 * IT LOOKS UP. IT DOES NOT CALCULATE.
 * ---------------------------------------------------------------------------
 * `answers` is every fare the server already computed and formatted — thirty
 * ordered pairs times nine classes on this corridor. The client picks one out
 * of a Map by key. It cannot round, cannot interpolate, cannot apply a formula
 * and cannot invent a taka figure for a journey the matrix does not price,
 * because it has no arithmetic in it at all. A key that is not in the map is
 * an unpriced journey, and it says so.
 *
 * That also settles the provisional question for the client path: the flag is
 * carried in the same tuple as the fare, straight off `is_provisional`, so a
 * fare and its warning arrive together or not at all.
 *
 * ---------------------------------------------------------------------------
 * WHAT THIS FILE IS ALLOWED TO IMPORT
 * ---------------------------------------------------------------------------
 * React, and a component that imports nothing. Every string it shows —
 * including the provisional warning — is resolved on the server and passed in.
 * Importing `t()` here instead would ship lib/i18n/ui.js's 161 keys in three
 * languages to every reader of every page that renders blocks: +11 kB First
 * Load JS, measured, for eleven words of warning.
 *
 * ---------------------------------------------------------------------------
 * WHY THE FORM IS FOUND BY ID RATHER THAN CONTROLLED
 * ---------------------------------------------------------------------------
 * The <select>s are server-rendered, uncontrolled, and stay that way. Making
 * them React-controlled would mean the panel owns the form's state, and a
 * reader who submits before hydration finishes would have their selection
 * reset by the component mounting. Listening to `change` on the form leaves
 * the browser in charge of the inputs and adds behaviour on top — which is
 * what CorridorExplorer does with the map's own controls.
 */
export default function TollCalculatorResult({
  formId, keys, initial, answers = [], strings = {}, noticeId,
}) {
  const [view, setView] = useState(initial);

  useEffect(() => {
    const form = document.getElementById(formId);
    if (!form) return undefined;

    const lookup = new Map();
    for (const a of answers) lookup.set(`${a[0]}|${a[1]}|${a[2]}`, a);

    const read = () => {
      const value = (name) => {
        const el = form.elements.namedItem(name);
        return el && typeof el.value === 'string' ? el.value : '';
      };
      const from = value(keys.from);
      const to = value(keys.to);
      const vehicle = value(keys.vehicle);

      if (!from && !to && !vehicle) return { status: 'idle', provisional: true };
      if (!from || !to || !vehicle) return { status: 'incomplete', provisional: true };
      if (from === to) return { status: 'same-point', provisional: true };
      const hit = lookup.get(`${from}|${to}|${vehicle}`);
      // Not in the table is not "near enough to something in the table".
      if (!hit) return { status: 'unpriced', provisional: true };
      return {
        status: 'priced',
        fare: hit[3],
        km: hit[4],
        provisional: hit[5] === 1,
        minutes: hit[6] ?? null,
        sroNumber: hit[7] || '',
        sroDate: hit[8] || '',
        sroLink: hit[9] || '',
      };
    };

    const onChange = () => {
      const next = read();
      setView(next);
      // The URL stays the answer's address, so the link in the address bar is
      // still the link a driver can send to somebody else. replaceState, not
      // pushState: changing a dropdown is not a navigation, and filling one in
      // three times should not cost three presses of the back button.
      try {
        const url = new URL(window.location.href);
        for (const name of [keys.from, keys.to, keys.vehicle]) {
          const el = form.elements.namedItem(name);
          const v = el && typeof el.value === 'string' ? el.value : '';
          if (v) url.searchParams.set(name, v);
          else url.searchParams.delete(name);
        }
        window.history.replaceState(null, '', url);
      } catch { /* a sandboxed history is not a reason to withhold the fare */ }
    };

    form.addEventListener('change', onChange);
    // A submit is now redundant, but a reader who presses the button anyway —
    // or presses Enter — should not be sent on a page load for an answer that
    // is already on screen.
    const onSubmit = (e) => { e.preventDefault(); onChange(); };
    form.addEventListener('submit', onSubmit);
    return () => {
      form.removeEventListener('change', onChange);
      form.removeEventListener('submit', onSubmit);
    };
  }, [formId, keys, answers]);

  const status = view?.status || 'idle';
  // Nothing asked, or asked only halfway: no panel at all. `required` on the
  // three <select>s means a browser will not submit a half-filled form even
  // with scripting off, so `incomplete` is reachable only from a hand-edited
  // URL — and answering that with "no fare is published for that journey"
  // would be a false statement about a journey nobody named.
  if (status === 'idle' || status === 'incomplete') return null;

  const provisional = view?.provisional !== false;
  const priced = status === 'priced';
  // `unknown-point` is a hand-edited id. It reads as unpriced, which is what
  // it is: this matrix has no fare for what was asked.
  const message = status === 'same-point' ? strings.samePoint : strings.unpriced;

  return (
    <div className="db-tollcalc-answer">
      {/* The warning sits ABOVE the figure and is pointed at by it. A notice
          under a price is a footnote; a notice the price is described by is
          read out before the price is. */}
      {priced && provisional ? (
        <IllustrativeNoticeView id={noticeId} tag={strings.provisionalTag} body={strings.provisionalBody} />
      ) : null}

      <div
        className="db-tollcalc-result"
        role="status"
        aria-live="polite"
        aria-describedby={priced && provisional ? noticeId : undefined}
      >
        {priced ? (
          <>
            {/* Keyed on the figure itself: React replaces the node when the
                fare changes, which replays the fade for a sighted reader. The
                live region around it is NOT keyed — remounting an aria-live
                element is how you stop a screen reader observing it. */}
            <p className="db-tollcalc-fare" key={view.fare}>
              <span className="db-tollcalc-figlabel">{strings.fare}</span>
              <span className="db-tollcalc-amount db-num">{view.fare}</span>
            </p>
            <dl className="db-tollcalc-figures">
              <div className="db-tollcalc-figure">
                <dt className="db-tollcalc-figlabel">{strings.distance}</dt>
                <dd className="db-num">{view.km} {strings.km}</dd>
              </div>
              {strings.time ? (
                <div className="db-tollcalc-figure">
                  <dt className="db-tollcalc-figlabel">{strings.time}</dt>
                  {/* No measured speed, no number. `traffic_unknown` is the
                      string the map and the status table already use for a
                      section nobody has measured — the same fact, said the
                      same way. */}
                  <dd className="db-num">
                    {view.minutes === null || view.minutes === undefined
                      ? strings.notMeasured
                      : `${view.minutes} ${strings.timeUnit}`}
                  </dd>
                </div>
              ) : null}
            </dl>
            {view.sroNumber ? (
              <p className="db-table-note db-toll-provenance">
                {view.sroLink
                  ? <a className="db-toll-sro" href={view.sroLink}>{view.sroNumber}</a>
                  : <span className="db-toll-sro">{view.sroNumber}</span>}
                {view.sroDate ? <span className="db-toll-srodate">{view.sroDate}</span> : null}
              </p>
            ) : null}
          </>
        ) : (
          <p className="db-empty-inline">{message}</p>
        )}
      </div>
    </div>
  );
}
