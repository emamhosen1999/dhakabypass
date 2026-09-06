-- 11-block-fields.sql
-- W1.22 — the ten new block types, and the `select` field type.
--
-- NO SCHEMA CHANGE IS NEEDED, and none is made here.
--
--   * `blocks`.`type` is varchar(64) (01-schema.sql:84), not an enum, so the
--     ten new type names — person-card, document-list, faq, data-table,
--     timeline, tabs, contact-directory, map-pin-list, stat-dashboard,
--     logo-row — need no DDL. A block type exists when it is registered in
--     lib/blocks/index.js and nowhere else.
--   * `block_translations`.`data` is JSON, so the new fields (a nested cells
--     list, amenity tags, `progress`, `asOf`) need no column.
--
-- What this file does is repair DATA that the new `select` validation would
-- otherwise refuse. `media-prose.side` used to be free text while
-- MediaProseBlock tests `data.side === 'left'`, so every value except exactly
-- 'left' rendered as a right-hand image, silently. It is now a select over
-- {left, right}: any other stored value becomes a validation error the next
-- time an operator opens that block and saves it, on a block they did not
-- break. This normalises what is stored to what was actually being rendered,
-- so nothing on any page changes appearance.
--
-- Idempotent: safe to run repeatedly. Re-running is a no-op — the WHERE
-- clause matches only rows that are not already normalised.
--
-- Run after 01/02/03 on existing installs, and after 01/02 on fresh ones.
-- Requires MySQL 8.0 / MariaDB 10.6 for the JSON functions (the same
-- requirement db/sql/README.md already records for this project).

-- ---------------------------------------------------------------------------
-- 1. media-prose.side — case and whitespace.
--
-- 'Left', ' left ' and 'LEFT' were all authored as left-hand images by an
-- operator and all rendered right. The rendering does not change here (it was
-- and remains whatever `side === 'left'` produced BEFORE this file ran, for
-- the rows this statement does not touch); this only makes the stored value
-- one the field now accepts.
-- ---------------------------------------------------------------------------
UPDATE `block_translations` bt
JOIN `blocks` b ON b.`id` = bt.`block_id`
SET bt.`data` = JSON_SET(bt.`data`, '$.side', LOWER(TRIM(JSON_UNQUOTE(JSON_EXTRACT(bt.`data`, '$.side')))))
WHERE b.`type` = 'media-prose'
  AND JSON_EXTRACT(bt.`data`, '$.side') IS NOT NULL
  AND JSON_TYPE(JSON_EXTRACT(bt.`data`, '$.side')) = 'STRING'
  AND LOWER(TRIM(JSON_UNQUOTE(JSON_EXTRACT(bt.`data`, '$.side')))) IN ('left', 'right')
  AND JSON_UNQUOTE(JSON_EXTRACT(bt.`data`, '$.side')) <> LOWER(TRIM(JSON_UNQUOTE(JSON_EXTRACT(bt.`data`, '$.side'))));

-- ---------------------------------------------------------------------------
-- 2. media-prose.side — anything else.
--
-- A value that is not a case variant of left or right ('', 'Right side',
-- 'true', a number) was rendering as a right-hand image, because that is the
-- else branch in MediaProseBlock. It is written out as 'right' so the stored
-- record says what the page has been showing all along. Deliberately NOT
-- deleted: an absent `side` is legal and defaults to 'right' at render time,
-- but leaving a junk value in place would fail validation on the operator's
-- next save of an untouched block.
-- ---------------------------------------------------------------------------
UPDATE `block_translations` bt
JOIN `blocks` b ON b.`id` = bt.`block_id`
SET bt.`data` = JSON_SET(bt.`data`, '$.side', 'right')
WHERE b.`type` = 'media-prose'
  AND JSON_EXTRACT(bt.`data`, '$.side') IS NOT NULL
  AND (
    JSON_TYPE(JSON_EXTRACT(bt.`data`, '$.side')) <> 'STRING'
    OR LOWER(TRIM(JSON_UNQUOTE(JSON_EXTRACT(bt.`data`, '$.side')))) NOT IN ('left', 'right')
  );
