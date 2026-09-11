-- 19-service-requests.sql — tracked service requests (INT.8).
--
-- One table behind the `request-form` block, which an operator configures as
-- a grievance form, a toll dispute, a breakdown-assistance request or a lost
-- & found report. Each submission gets a tracking number the visitor can
-- quote in a follow-up, and a due date from the block's SLA setting, so the
-- queue at /admin/requests can show what is overdue rather than merely what
-- is unread.
--
-- Deliberately NOT contact_messages with more columns. That table is the
-- untyped inbox; this one has a lifecycle (new -> in_progress -> resolved ->
-- closed), a deadline and an identifier. Peer operators (PLUS, Linkt, NHAI)
-- all run these as separate queues, and a compensation claim under the
-- grievance redress mechanism cannot share a "read/unread" flag with "when
-- does the toll plaza open".
--
-- DDL only, idempotent. No rows are seeded: the form is placed by an operator
-- from the block editor.

CREATE TABLE IF NOT EXISTS `service_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tracking_no` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `kind` enum('grievance','toll_dispute','breakdown','lost_found','general') COLLATE utf8mb4_unicode_ci NOT NULL,
  `locale` varchar(5) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'en',
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `vehicle_no` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `location` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `subject` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('new','in_progress','resolved','closed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'new',
  `due_at` datetime NULL DEFAULT NULL,
  `resolved_at` datetime NULL DEFAULT NULL,
  `admin_note` text COLLATE utf8mb4_unicode_ci NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tracking_no` (`tracking_no`),
  KEY `idx_kind_status` (`kind`, `status`),
  KEY `idx_status_due` (`status`, `due_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
