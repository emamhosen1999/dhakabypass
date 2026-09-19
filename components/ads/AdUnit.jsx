'use client';

import { useEffect, useRef, useState } from 'react';
import { CONSENT_KEY } from '../chrome/consent-key.js';

/**
 * The `<ins>` AdSense fills, and the push that asks it to.
 *
 * WHY IT WAITS FOR CONSENT. Google Consent Mode is initialised with
 * `ad_storage`, `ad_user_data` and `ad_personalization` denied before the tag
 * loads (components/chrome/Analytics.jsx). Requesting an ad before the reader
 * has answered would serve a non-personalised ad at best and, in a
 * jurisdiction that enforces it, an unlawful one at worst. So the unit holds
 * its reserved box and asks for nothing until a choice exists.
 *
 * WHY IT WAITS FOR VIEWPORT. An ad below the fold that loads on first paint
 * spends main-thread time the reader has not asked for, on a site whose
 * mobile Lighthouse score is 44 and whose Total Blocking Time is already
 * 1,690 ms. The observer costs nothing and the impression is only countable
 * once it is on screen anyway.
 */
export default function AdUnit({ client, slot, testMode }) {
  const ref = useRef(null);
  const [ready, setReady] = useState(false);
  const pushed = useRef(false);

  // The reader's answer, and any later change of mind from the footer control.
  useEffect(() => {
    const read = () => {
      try {
        setReady(localStorage.getItem(CONSENT_KEY) !== null);
      } catch {
        // Blocked storage: treat as unanswered rather than as agreement.
        setReady(false);
      }
    };
    read();
    window.addEventListener('storage', read);
    return () => window.removeEventListener('storage', read);
  }, []);

  useEffect(() => {
    if (!ready || pushed.current || !ref.current) return undefined;
    const el = ref.current;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting || pushed.current) continue;
        pushed.current = true;
        observer.disconnect();
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch {
          // An ad blocker, or the script never arrived. The reserved box stays
          // empty; nothing else on the page is affected.
        }
      }
    }, { rootMargin: '200px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ready]);

  return (
    <ins
      ref={ref}
      className="adsbygoogle db-ad-ins"
      style={{ display: 'block' }}
      data-ad-client={client}
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="false"
      {...(testMode ? { 'data-adtest': 'on' } : {})}
    />
  );
}
