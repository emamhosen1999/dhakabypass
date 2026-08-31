import { t } from '../../lib/i18n/ui.js';

export default function SiteFooterV2({ locale }) {
  const year = new Date().getFullYear();
  return (
    <footer className="db-footer">
      <div className="db-footer-inner">
        <p className="db-footer-brand">Dhaka Bypass Expressway Development Company</p>
        <p className="db-footer-legal">© {year} DBEDC. {t(locale, 'allRights')}</p>
      </div>
    </footer>
  );
}
