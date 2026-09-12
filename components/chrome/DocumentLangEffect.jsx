'use client';

import { useEffect } from 'react';

/**
 * The belt to DocumentLang's braces.
 *
 * The inline script in DocumentLang sets <html lang> during the initial HTML
 * parse, which is what a screen reader needs before it reads the first word.
 * On a 404 that script never runs: Next renders a not-found boundary through
 * a client transition, and a <script> element React inserts after the parse
 * is inert. So the same assignment is repeated here as an effect — a no-op on
 * an ordinary page, the only thing that works on a missing one.
 */
export default function DocumentLangEffect({ lang }) {
  useEffect(() => {
    if (lang && document.documentElement.lang !== lang) document.documentElement.lang = lang;
  }, [lang]);
  return null;
}
