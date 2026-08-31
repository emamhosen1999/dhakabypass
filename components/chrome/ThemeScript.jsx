import { themeScriptSource } from '../../lib/theme.js';

/** Must render before any visible content. */
export default function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: themeScriptSource() }} />;
}
