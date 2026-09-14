import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from parity_data import ENTRIES, LEGAL_TITLES

def q(s):
    return "'" + s.replace("\\", "\\\\").replace("'", "''") + "'"

out = []
out.append("""-- 33-translation-parity.sql — every published block and page in Bangla and Chinese (W3.25).
--
-- The Bangla-parity audit found 23 blocks recovered from the previous website
-- (24-legacy-content.sql) published in English only — the project timeline,
-- progress, specifications, objectives, pavement, vision; the partners,
-- financing and governance structure; the Chinese contribution; the economic
-- figures; the first-section history — and no page titles at all for the
-- privacy, terms and accessibility pages. A Bangla or Chinese reader got
-- English for those sections.
--
-- Each block is located by page, type and a phrase of its English row, never
-- by id. INSERT IGNORE: a translation an operator has already written is kept.
-- tests/db/fresh-import.test.js asserts no published block or page is left
-- without all three languages.
""")
for slug, btype, path, value, langs in ENTRIES:
    out.append(f"-- {slug} · {btype} · {value}")
    out.append("SET @b = (SELECT b.`id` FROM `blocks` b JOIN `pages` p ON p.`id` = b.`page_id` JOIN `block_translations` t ON t.`block_id` = b.`id` AND t.`locale` = 'en'")
    out.append(f"  WHERE p.`slug` = {q(slug)} AND b.`type` = {q(btype)} AND JSON_UNQUOTE(JSON_EXTRACT(t.`data`, {q(path)})) = {q(value)} LIMIT 1);")
    for loc in ("bn", "zh"):
        data = json.dumps(langs[loc], ensure_ascii=False, separators=(",", ":"))
        out.append(f"INSERT IGNORE INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, {q(loc)}, {q(data)}, 'published' FROM DUAL WHERE @b IS NOT NULL;")
    out.append("")

out.append("-- Page titles and search descriptions for the three legal pages.")
for slug, locs in LEGAL_TITLES.items():
    for loc, (title, desc) in locs.items():
        out.append(f"INSERT INTO `page_translations` (`page_id`, `locale`, `title`, `seo_description`, `status`) SELECT p.`id`, {q(loc)}, {q(title)}, {q(desc)}, 'published' FROM `pages` p WHERE p.`slug` = {q(slug)}")
        out.append("  ON DUPLICATE KEY UPDATE `title` = IF(`title` = '', VALUES(`title`), `title`), `seo_description` = IF(`seo_description` = '', VALUES(`seo_description`), `seo_description`), `page_translations`.`status` = 'published';")
out.append("")
out.append("INSERT IGNORE INTO `schema_migrations` (`name`) VALUES ('33-translation-parity');")
open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'db', 'sql', '33-translation-parity.sql'), 'w', encoding='utf-8', newline='\n').write("\n".join(out) + "\n")
print('written', len(ENTRIES))
