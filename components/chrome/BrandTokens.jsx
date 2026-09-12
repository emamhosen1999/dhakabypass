import { getBrandTokensCached } from '../../lib/settings-cache.js';
import { brandCss } from '../../lib/brand/tokens.js';

/**
 * The operator's brand colours and page width as a <style> override
 * (W1.16). Renders nothing while the brand is the shipped one, so an
 * untouched site carries no extra bytes. A failed read renders nothing
 * too: the shipped tokens are the fallback, and they are already on the page.
 * The CSP allows inline styles ('unsafe-inline' in style-src, for the
 * corridor strip's computed offsets), so this needs no nonce.
 */
export default async function BrandTokens() {
  let stored = {};
  try { stored = await getBrandTokensCached(); } catch { stored = {}; }
  const css = brandCss(stored);
  if (!css) return null;
  return <style id="db-brand" dangerouslySetInnerHTML={{ __html: css }} />;
}
