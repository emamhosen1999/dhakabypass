-- 07-block-order.sql
-- W1.4 — drag-and-drop block reordering.
--
-- NO COLUMN CHANGE IS NEEDED. The audit note says `blocks` carries
-- `page_id` + `position`; the real column, in 01-schema.sql, is `sort_order`
-- (INT NOT NULL DEFAULT 0) with KEY `idx_page_sort` (`page_id`,`sort_order`).
-- Drag-and-drop writes through the existing `reorderBlocks()` in
-- lib/content/pages.js, which already renumbers a page's blocks 0..n-1 inside
-- one transaction. So this file changes no schema; it makes the DATA the new
-- editor starts from consistent, and re-adds the index on any database that
-- predates it.
--
-- Idempotent: safe to run repeatedly. Re-running is a no-op.
--
-- Run it after 01/02/03 on existing installs, and after 01/02 on fresh ones.

-- ---------------------------------------------------------------------------
-- 1. The (page_id, sort_order) index.
--
-- 01-schema.sql uses CREATE TABLE IF NOT EXISTS, so a database created before
-- `idx_page_sort` was added never got it and re-importing the schema will not
-- add it either. Every block read is `WHERE page_id = ? ORDER BY sort_order,
-- id`, and reordering now issues one UPDATE per block, so the index is load
-- bearing. MySQL has no CREATE INDEX IF NOT EXISTS, hence the guard.
-- ---------------------------------------------------------------------------
SET @idx_exists := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'blocks'
    AND index_name = 'idx_page_sort'
);
SET @sql := IF(@idx_exists = 0,
  'ALTER TABLE `blocks` ADD KEY `idx_page_sort` (`page_id`, `sort_order`)',
  'DO 0');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------------------------
-- 2. Densify sort_order to 0..n-1 per page.
--
-- `sort_order` defaults to 0, so any block inserted by hand-written SQL, the
-- legacy import, or a seed that did not set it explicitly sits at 0 alongside
-- others. Readers ORDER BY `sort_order, id`, so the page still renders in a
-- stable order today — but the FIRST drag on such a page rewrites every row,
-- which looks to an operator like the editor moved blocks they did not touch.
-- Normalising once, ahead of time, means a drag moves exactly one block.
--
-- The ordering used here is precisely the readers' ordering, so no block
-- changes its rendered position: this renumbers, it does not reorder.
-- ---------------------------------------------------------------------------
UPDATE `blocks` b
JOIN (
  SELECT `id`,
         ROW_NUMBER() OVER (PARTITION BY `page_id` ORDER BY `sort_order`, `id`) - 1 AS rn
  FROM `blocks`
) o ON o.`id` = b.`id`
SET b.`sort_order` = o.rn
WHERE b.`sort_order` <> o.rn;
