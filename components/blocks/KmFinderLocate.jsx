'use client';

import { useEffect, useState } from 'react';
import { track } from '../../lib/analytics/events.js';

/**
 * The "use my location" button. It fills the finder form's two hidden
 * coordinate inputs from the browser's position and submits the same GET
 * form the typed marker uses, so there is one answer path and one renderer.
 * Rendered only after hydration has confirmed the API exists; with script
 * off the typed marker is the whole feature.
 */
export default function KmFinderLocate({ formId, keys, labels }) {
  const [state, setState] = useState('idle');
  // Decided after mount, so the server and the first client render agree.
  const [supported, setSupported] = useState(false);
  useEffect(() => { setSupported(typeof navigator !== 'undefined' && 'geolocation' in navigator); }, []);
  if (!supported) return null;

  const find = () => {
    const form = document.getElementById(formId);
    if (!form) return;
    setState('busy');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const set = (name, value) => {
          let input = form.querySelector(`input[name="${name}"]`);
          if (!input) {
            input = document.createElement('input');
            input.type = 'hidden';
            input.name = name;
            form.appendChild(input);
          }
          input.value = value;
        };
        set(keys.lat, pos.coords.latitude.toFixed(6));
        set(keys.lng, pos.coords.longitude.toFixed(6));
        const marker = form.querySelector(`input[name="${keys.marker}"]`);
        if (marker) marker.value = '';
        // That the browser gave a position, never the position itself.
        track('kmpost_located', { source: 'browser' });
        form.requestSubmit();
      },
      () => setState('denied'),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
    );
  };

  return (
    <div className="db-locate-geo">
      <button type="button" className="db-btn db-btn-secondary" onClick={find} disabled={state === 'busy'}>
        {state === 'busy' ? labels.busy : labels.use}
      </button>
      <p className="db-form-live db-form-note" role="status" aria-live="polite">
        {state === 'denied' ? labels.denied : ''}
      </p>
    </div>
  );
}
