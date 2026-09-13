/**
 * The tables a database built from every db/sql file holds (W6.10). Checked
 * in, so a release verification compares against a list a reviewer can read
 * instead of a bare count (it used to be `tables.length !== 28`), and
 * tests/unit/db-tables.test.js fails when a file creates or drops a table
 * without this list changing with it.
 */
export const EXPECTED_TABLES = Object.freeze([
  'advisories', 'audit_log', 'block_translations', 'blocks', 'contact_messages',
  'corridor_geometry', 'corridor_geometry_source', 'corridor_roads', 'corridor_sections',
  'corridor_waypoints', 'interchanges', 'media', 'menu_items', 'menus', 'news_translations',
  'news_updates', 'newsletter_subscribers', 'page_translations', 'pages', 'redirects',
  'revisions', 'route_meta', 'schema_migrations', 'segments', 'service_requests',
  'site_settings', 'toll_od_rates', 'toll_rates', 'traffic_monthly', 'ui_strings', 'users',
]);
