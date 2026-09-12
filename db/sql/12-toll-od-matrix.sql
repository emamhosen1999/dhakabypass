-- 12-toll-od-matrix.sql
-- INT.1 — the origin-destination toll fare matrix.
--
-- Creates `toll_od_rates` and seeds it with 270 PROVISIONAL fares, so INT.2's
-- toll calculator has a real matrix to be built and demonstrated against.
-- Run after 01/02 (and 03 on an existing install). Idempotent: re-importing
-- creates nothing twice, overwrites nothing, and never touches a row an
-- operator has edited.
--
-- ===========================================================================
-- 1. WHY A NEW TABLE, AND WHY `toll_rates` IS NOT TOUCHED
-- ===========================================================================
-- `toll_rates` cannot express an O-D fare, and cannot be made to without
-- changing what is published today:
--
--   * `section` is a free-text LABEL ("Vogra - Purbachal"), not a from/to
--     pair. Nothing can compute a distance from it or join it to a plaza.
--   * `UNIQUE KEY uq_class_effective (vehicle_class, effective_from)` means
--     the table PHYSICALLY CANNOT HOLD two sections' rates for one vehicle
--     class on one date. That is why all nine seeded rates are one section.
--     It is the constraint talking, not a coincidence.
--
-- Widening that key would change the meaning of every row that /travel/toll,
-- the `toll-table` block and `toll-preview` read right now. So this table is
-- added ALONGSIDE and the flat rates are left exactly as they are. Migrating
-- them onto this table is a separate, later decision, taken once DBEDC has
-- confirmed a real per-pair tariff.
--
-- ===========================================================================
-- 2. WHY THIS FILE SEEDS ROWS WHEN 09 AND 10 DELIBERATELY DO NOT
-- ===========================================================================
-- `09-ui-strings.sql` and `10-route-meta.sql` are DDL-only on purpose, and
-- both state the rule: A ROW IN AN OVERRIDE TABLE MEANS "AN OPERATOR SET
-- THIS." Seeding one would mark untouched settings as edited and would
-- outrank a later correction shipped in code.
--
-- That rule does not apply here, because this is not an override table. There
-- is no code-side fallback matrix for a row to outrank; an empty table means
-- no calculator, which is the thing the client asked to be able to see. The
-- seed IS the deliverable.
--
-- The danger the rule protects against is still real, though, and here it is
-- sharper: a row in this table reads as "this is what you will be charged".
-- A driver who budgets 260 taka from a computed figure and is charged 400 at
-- the plaza has been misled by this website. The master plan's Global
-- Constraints are unambiguous — "every published rate cites its SRO/gazette
-- number and date and links the PDF; never publish a rate without it", and
-- "operator-verified facts only".
--
-- So the same protection is carried by a different mechanism. Instead of
-- withholding the seed, the seed is marked, and marked in a way nobody can
-- undo by editing text:
--
--   * `is_provisional` is a STORED GENERATED COLUMN over `sro_number`. It is
--     not a flag somebody sets. `UPDATE toll_od_rates SET is_provisional = 0`
--     is REJECTED BY THE SERVER — a generated column may not appear in a SET
--     list. The ONLY way a fare stops being provisional is for somebody to
--     type the S.R.O. number that makes it true.
--   * The seed's column list below does not mention `sro_number`, `sro_date`
--     or `sro_link`. All three take their '' default, so all 270 seeded rows
--     are provisional the instant they land, without a single INSERT having
--     to remember to say so.
--   * `chk_toll_od_citation` refuses a half-written citation, so "confirmed"
--     cannot be reached by typing a number and leaving the date blank.
--   * Every renderer reads `is_provisional` off the row and shows an
--     unmissable trilingual notice bound to the table with `aria-describedby`.
--     No block field can suppress it — see
--     tests/unit/blocks-toll-matrix.test.jsx, which asserts the notice
--     survives eight hostile block configurations.
--
-- Provenance is not prose here. It is a column the database computes and a
-- constraint it enforces.
--
-- ===========================================================================
-- 3. WHERE THE NUMBERS COME FROM
-- ===========================================================================
-- Not from invention. The legacy site's /routes-facilities page published
-- DBEDC's own toll calculation method — a "Complete Toll Rate Table" giving,
-- for all nine vehicle classes, a full-distance toll, a formula of the shape
-- `(4.31X18+50)X115%`, and the partial-section toll it yields. The page is
-- still on disk at old_dhakabypass/routes-facilities/index.html.
--
-- Reading it out: the leading figure is a per-kilometre rate in taka; `18` is
-- the section length in KILOMETRES, which is the input, not a constant; `+50`
-- is a flat access charge; `X115%` a uniform uplift; and the result is rounded
-- to the nearest 10 taka. Substituting 18 back reproduces DBEDC's own
-- published partial-section column for all nine classes — asserted nine times
-- in tests/unit/toll-formula.test.js.
--
-- lib/corridor/toll-formula.js carries the full reading and the constants.
-- tests/unit/toll-matrix-seed.test.js PARSES THIS FILE and recomputes every
-- amount below from that module, so these literals cannot drift away from the
-- formula they claim to come from.
--
-- Two things are recorded in the `derivation` column rather than left implicit:
--
--   dbedc-2025-formula         straight out of the published formula.
--   dbedc-2025-formula-capped  the formula, limited to the published
--                              full-distance toll. Applied without limit the
--                              formula eventually charges more for part of the
--                              corridor than for all of it (a car over 42.7 km
--                              computes to 270 taka against a published 200
--                              end-to-end). Treating the full-distance toll as
--                              a ceiling is a READING of the published table,
--                              not a quotation from it, so rows that hit it
--                              say so. 26 of the 270 do.
--   dbedc-2025-published       NOT computed. `toll_rates` already publishes
--                              nine rates for section "Vogra - Purbachal", so
--                              that pair quotes them in both directions.
--                              Deriving it from chainage instead would put
--                              160 taka in the matrix beside the 150 that
--                              /travel/toll shows for the same journey.
--
-- ===========================================================================
-- 4. WHICH PLAZAS, AND THE ONE EDITORIAL JUDGEMENT IN THIS FILE
-- ===========================================================================
-- Toll plazas are identified by `interchanges`.`kind` = 'toll_plaza'. That is
-- a typed enum member, so NO NAME MATCHING IS INVOLVED anywhere in the shipped
-- code — see the note at the top of lib/corridor/toll-matrix.js about the
-- display-side name-matching defect the block catalogue tracks separately.
--
-- The corridor records NINE `toll_plaza` rows, and several are the two
-- carriageways of one physical site. Collapsing them into six tolling sites
-- was read off the names ONCE, by a human, and is recorded here as chainage
-- literals so an operator can see and correct it — rather than as a rule in
-- code that would silently re-derive it on every request:
--
--   Vogra Toll Plaza      K3+218   also K3+706  (RHS / LHS carriageways)
--   Mirer Bazar           K11+365  also K13+184, K13+403  ((A) / RHS / LHS)
--   Purbachal Toll Plaza  K24+522
--   Toll Plaza (K34)      K34+353
--   Toll Plaza (K36)      K36+554
--   Toll Plaza (K46)      K45+965
--
-- The lowest-chainage member anchors each site: it is the first tolling point
-- reached there travelling southbound, and it makes every `distance_m` below
-- reproducible as a subtraction of two `interchanges`.`chainage_m` values that
-- anyone can check.
--
-- THREE THINGS TO PUT TO DBEDC, recorded here because they are visible in the
-- data and should not be discovered later:
--
--   (a) K34+353 and K36+554 are 2.2 km apart and both unnamed. They are very
--       likely the two carriageways of one site, in which case this matrix has
--       one plaza too many and a 70-taka "journey" that does not exist.
--   (b) Mirer Bazar (A) at K11+365 is 1.8 km from the RHS/LHS pair at K13.
--       Whether it is the same site is unconfirmed.
--   (c) DBEDC's own formula charges "Vogra - Purbachal" as 18 km. The
--       surveyed chainages make it 21.3 km. Either the plaza chainages are
--       provisional (Purbachal is still status='construction') or 18 km is
--       the chargeable, as opposed to the physical, length. This matters to
--       every computed figure below.
--
-- ===========================================================================
-- 5. IDEMPOTENCE
-- ===========================================================================
-- CREATE TABLE IF NOT EXISTS; INSERT IGNORE; nothing that drops, truncates or
-- upserts. Re-importing fills in missing rows and leaves every
-- existing one alone, so a fare an operator has confirmed survives. If the
-- plaza records are absent the `@p_*` lookups resolve to NULL, the foreign key
-- rejects the row, and INSERT IGNORE skips it — the import reports warnings
-- instead of installing 270 fares pointing at nothing.

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `toll_od_rates` (
  `id` int NOT NULL AUTO_INCREMENT,

  -- Real `interchanges` rows, not copies of their names. One plaza, one
  -- record, renamed once — the records-vs-blocks rule the client locked on
  -- 2026-09-06. ON DELETE CASCADE because a fare between a plaza that no
  -- longer exists is not a fare, it is an orphan quoting a price under no
  -- name.
  `origin_interchange_id` int NOT NULL,
  `destination_interchange_id` int NOT NULL,

  -- The corridor carries traffic both ways and entry/exit pairs are
  -- directional, so (A to B) and (B to A) are separate rows that may hold
  -- different amounts. `direction` names the carriageway: the corridor runs
  -- north to south, Naojor (K0, Gazipur) to Madanpur (K47+611, Narayanganj),
  -- so increasing chainage is southbound.
  `direction` enum('southbound','northbound') COLLATE utf8mb4_unicode_ci NOT NULL,

  -- Matches `toll_rates`.`vehicle_class` exactly. The published NAME of the
  -- class is NOT duplicated here: it lives once on `toll_rates`.`class_labels`
  -- and the reader joins to it, so a microbus cannot be called one thing on
  -- the toll page and another in the matrix.
  `vehicle_class` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,

  -- Stored, not computed at read time, so the calculator can show the driver
  -- the distance the fare was worked on even after a plaza's surveyed
  -- chainage is corrected — and so a corrected chainage shows up as a
  -- disagreement to investigate rather than as a silently changed price.
  `distance_m` int NOT NULL,

  `amount_bdt` decimal(10,2) NOT NULL,
  `effective_from` date NOT NULL,

  -- How this number was produced. See section 3 above.
  `derivation` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'gazette',

  -- Gazette provenance, per row. On `toll_rates` the citation is authored on
  -- the BLOCK, because one notification fixes that whole flat schedule. Here
  -- it must be per row: the matrix will be confirmed pair by pair as DBEDC
  -- gazettes them, and a block-level citation would certify 270 fares the
  -- moment one of them was real.
  `sro_number` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `sro_date` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `sro_link` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',

  -- ------------------------------------------------------------------------
  -- THE MECHANISM. Read section 2 before changing anything on this line.
  -- ------------------------------------------------------------------------
  -- Not a flag. A STORED GENERATED COLUMN, which means the server REFUSES to
  -- let it appear in the SET list of an UPDATE or the column list of an
  -- INSERT. There is no statement — admin action, migration, or phpMyAdmin
  -- session — that can mark a fare confirmed. A fare becomes authoritative by
  -- acquiring the citation that makes it authoritative, and by no other route.
  `is_provisional` tinyint(1) GENERATED ALWAYS AS (CASE WHEN TRIM(`sro_number`) = '' THEN 1 ELSE 0 END) STORED,

  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),

  -- ORDERED pair: the two directions are two rows, which is what makes a
  -- per-direction tariff expressible at all.
  UNIQUE KEY `uq_toll_od` (`origin_interchange_id`,`destination_interchange_id`,`vehicle_class`,`effective_from`),
  KEY `idx_toll_od_origin` (`origin_interchange_id`,`direction`,`effective_from`),
  KEY `idx_toll_od_class` (`vehicle_class`,`effective_from`),
  KEY `idx_toll_od_provisional` (`is_provisional`),
  KEY `idx_toll_od_destination` (`destination_interchange_id`),

  -- A citation is a number AND the date it was notified, or it is not a
  -- citation. Without this, "confirmed" is reachable by typing a number and
  -- leaving the date blank.
  CONSTRAINT `chk_toll_od_citation` CHECK (TRIM(`sro_number`) = '' OR TRIM(`sro_date`) <> ''),
  CONSTRAINT `chk_toll_od_distinct` CHECK (`origin_interchange_id` <> `destination_interchange_id`),
  CONSTRAINT `chk_toll_od_amount` CHECK (`amount_bdt` >= 0),
  CONSTRAINT `chk_toll_od_distance` CHECK (`distance_m` >= 0),

  CONSTRAINT `fk_toll_od_origin` FOREIGN KEY (`origin_interchange_id`)
    REFERENCES `interchanges` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_toll_od_destination` FOREIGN KEY (`destination_interchange_id`)
    REFERENCES `interchanges` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- The six tolling sites, resolved from the RECORDS by chainage and kind.
-- NULL if a plaza is missing, which the foreign key then turns into a skipped
-- row rather than a fare pointing at nothing.
-- ---------------------------------------------------------------------------
SET @p_3218  = (SELECT id FROM `interchanges` WHERE `kind`='toll_plaza' AND `chainage_m`=3218  ORDER BY id LIMIT 1);
SET @p_11365 = (SELECT id FROM `interchanges` WHERE `kind`='toll_plaza' AND `chainage_m`=11365 ORDER BY id LIMIT 1);
SET @p_24522 = (SELECT id FROM `interchanges` WHERE `kind`='toll_plaza' AND `chainage_m`=24522 ORDER BY id LIMIT 1);
SET @p_34353 = (SELECT id FROM `interchanges` WHERE `kind`='toll_plaza' AND `chainage_m`=34353 ORDER BY id LIMIT 1);
SET @p_36554 = (SELECT id FROM `interchanges` WHERE `kind`='toll_plaza' AND `chainage_m`=36554 ORDER BY id LIMIT 1);
SET @p_45965 = (SELECT id FROM `interchanges` WHERE `kind`='toll_plaza' AND `chainage_m`=45965 ORDER BY id LIMIT 1);

-- ---------------------------------------------------------------------------
-- 270 provisional fares: 6 sites -> 30 ordered pairs x 9 vehicle classes.
--
-- NOTE THE COLUMN LIST. `sro_number`, `sro_date` and `sro_link` are absent, so
-- every row takes their '' default and every row is therefore provisional by
-- construction. `is_provisional` is absent because it CANNOT be written.
-- ---------------------------------------------------------------------------
INSERT IGNORE INTO `toll_od_rates`
  (`origin_interchange_id`, `destination_interchange_id`, `direction`,
   `vehicle_class`, `distance_m`, `amount_bdt`, `effective_from`, `derivation`)
VALUES
-- Vogra Toll Plaza -> Mirer Bazar · 8.147 km · southbound
  (@p_3218, @p_11365, 'southbound', 'car', 8147, 100.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_3218, @p_11365, 'southbound', 'pickup', 8147, 110.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_3218, @p_11365, 'southbound', 'microbus', 8147, 120.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_3218, @p_11365, 'southbound', 'minibus', 8147, 130.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_3218, @p_11365, 'southbound', 'small_truck', 8147, 150.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_3218, @p_11365, 'southbound', 'large_bus', 8147, 170.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_3218, @p_11365, 'southbound', 'medium_truck', 8147, 210.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_3218, @p_11365, 'southbound', 'heavy_truck', 8147, 310.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_3218, @p_11365, 'southbound', 'large_truck', 8147, 370.00, '2025-08-23', 'dbedc-2025-formula'),
-- Vogra Toll Plaza -> Purbachal Toll Plaza · 21.304 km · southbound
  (@p_3218, @p_24522, 'southbound', 'car', 21304, 150.00, '2025-08-23', 'dbedc-2025-published'),
  (@p_3218, @p_24522, 'southbound', 'pickup', 21304, 180.00, '2025-08-23', 'dbedc-2025-published'),
  (@p_3218, @p_24522, 'southbound', 'microbus', 21304, 190.00, '2025-08-23', 'dbedc-2025-published'),
  (@p_3218, @p_24522, 'southbound', 'minibus', 21304, 210.00, '2025-08-23', 'dbedc-2025-published'),
  (@p_3218, @p_24522, 'southbound', 'small_truck', 21304, 260.00, '2025-08-23', 'dbedc-2025-published'),
  (@p_3218, @p_24522, 'southbound', 'large_bus', 21304, 310.00, '2025-08-23', 'dbedc-2025-published'),
  (@p_3218, @p_24522, 'southbound', 'medium_truck', 21304, 400.00, '2025-08-23', 'dbedc-2025-published'),
  (@p_3218, @p_24522, 'southbound', 'heavy_truck', 21304, 610.00, '2025-08-23', 'dbedc-2025-published'),
  (@p_3218, @p_24522, 'southbound', 'large_truck', 21304, 740.00, '2025-08-23', 'dbedc-2025-published'),
-- Vogra Toll Plaza -> Toll Plaza (K34) · 31.135 km · southbound
  (@p_3218, @p_34353, 'southbound', 'car', 31135, 200.00, '2025-08-23', 'dbedc-2025-formula-capped'),
  (@p_3218, @p_34353, 'southbound', 'pickup', 31135, 260.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_3218, @p_34353, 'southbound', 'microbus', 31135, 290.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_3218, @p_34353, 'southbound', 'minibus', 31135, 320.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_3218, @p_34353, 'southbound', 'small_truck', 31135, 410.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_3218, @p_34353, 'southbound', 'large_bus', 31135, 500.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_3218, @p_34353, 'southbound', 'medium_truck', 31135, 650.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_3218, @p_34353, 'southbound', 'heavy_truck', 31135, 1000.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_3218, @p_34353, 'southbound', 'large_truck', 31135, 1240.00, '2025-08-23', 'dbedc-2025-formula'),
-- Vogra Toll Plaza -> Toll Plaza (K36) · 33.336 km · southbound
  (@p_3218, @p_36554, 'southbound', 'car', 33336, 200.00, '2025-08-23', 'dbedc-2025-formula-capped'),
  (@p_3218, @p_36554, 'southbound', 'pickup', 33336, 280.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_3218, @p_36554, 'southbound', 'microbus', 33336, 310.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_3218, @p_36554, 'southbound', 'minibus', 33336, 340.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_3218, @p_36554, 'southbound', 'small_truck', 33336, 440.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_3218, @p_36554, 'southbound', 'large_bus', 33336, 530.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_3218, @p_36554, 'southbound', 'medium_truck', 33336, 690.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_3218, @p_36554, 'southbound', 'heavy_truck', 33336, 1070.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_3218, @p_36554, 'southbound', 'large_truck', 33336, 1320.00, '2025-08-23', 'dbedc-2025-formula'),
-- Vogra Toll Plaza -> Toll Plaza (K46) · 42.747 km · southbound
  (@p_3218, @p_45965, 'southbound', 'car', 42747, 200.00, '2025-08-23', 'dbedc-2025-formula-capped'),
  (@p_3218, @p_45965, 'southbound', 'pickup', 42747, 280.00, '2025-08-23', 'dbedc-2025-formula-capped'),
  (@p_3218, @p_45965, 'southbound', 'microbus', 42747, 320.00, '2025-08-23', 'dbedc-2025-formula-capped'),
  (@p_3218, @p_45965, 'southbound', 'minibus', 42747, 360.00, '2025-08-23', 'dbedc-2025-formula-capped'),
  (@p_3218, @p_45965, 'southbound', 'small_truck', 42747, 480.00, '2025-08-23', 'dbedc-2025-formula-capped'),
  (@p_3218, @p_45965, 'southbound', 'large_bus', 42747, 600.00, '2025-08-23', 'dbedc-2025-formula-capped'),
  (@p_3218, @p_45965, 'southbound', 'medium_truck', 42747, 800.00, '2025-08-23', 'dbedc-2025-formula-capped'),
  (@p_3218, @p_45965, 'southbound', 'heavy_truck', 42747, 1280.00, '2025-08-23', 'dbedc-2025-formula-capped'),
  (@p_3218, @p_45965, 'southbound', 'large_truck', 42747, 1600.00, '2025-08-23', 'dbedc-2025-formula-capped'),
-- Mirer Bazar -> Vogra Toll Plaza · 8.147 km · northbound
  (@p_11365, @p_3218, 'northbound', 'car', 8147, 100.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_11365, @p_3218, 'northbound', 'pickup', 8147, 110.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_11365, @p_3218, 'northbound', 'microbus', 8147, 120.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_11365, @p_3218, 'northbound', 'minibus', 8147, 130.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_11365, @p_3218, 'northbound', 'small_truck', 8147, 150.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_11365, @p_3218, 'northbound', 'large_bus', 8147, 170.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_11365, @p_3218, 'northbound', 'medium_truck', 8147, 210.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_11365, @p_3218, 'northbound', 'heavy_truck', 8147, 310.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_11365, @p_3218, 'northbound', 'large_truck', 8147, 370.00, '2025-08-23', 'dbedc-2025-formula'),
-- Mirer Bazar -> Purbachal Toll Plaza · 13.157 km · southbound
  (@p_11365, @p_24522, 'southbound', 'car', 13157, 120.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_11365, @p_24522, 'southbound', 'pickup', 13157, 150.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_11365, @p_24522, 'southbound', 'microbus', 13157, 160.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_11365, @p_24522, 'southbound', 'minibus', 13157, 170.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_11365, @p_24522, 'southbound', 'small_truck', 13157, 210.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_11365, @p_24522, 'southbound', 'large_bus', 13157, 250.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_11365, @p_24522, 'southbound', 'medium_truck', 13157, 310.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_11365, @p_24522, 'southbound', 'heavy_truck', 13157, 460.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_11365, @p_24522, 'southbound', 'large_truck', 13157, 560.00, '2025-08-23', 'dbedc-2025-formula'),
-- Mirer Bazar -> Toll Plaza (K34) · 22.988 km · southbound
  (@p_11365, @p_34353, 'southbound', 'car', 22988, 170.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_11365, @p_34353, 'southbound', 'pickup', 22988, 210.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_11365, @p_34353, 'southbound', 'microbus', 22988, 230.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_11365, @p_34353, 'southbound', 'minibus', 22988, 250.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_11365, @p_34353, 'southbound', 'small_truck', 22988, 320.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_11365, @p_34353, 'southbound', 'large_bus', 22988, 390.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_11365, @p_34353, 'southbound', 'medium_truck', 22988, 490.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_11365, @p_34353, 'southbound', 'heavy_truck', 22988, 760.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_11365, @p_34353, 'southbound', 'large_truck', 22988, 930.00, '2025-08-23', 'dbedc-2025-formula'),
-- Mirer Bazar -> Toll Plaza (K36) · 25.189 km · southbound
  (@p_11365, @p_36554, 'southbound', 'car', 25189, 180.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_11365, @p_36554, 'southbound', 'pickup', 25189, 230.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_11365, @p_36554, 'southbound', 'microbus', 25189, 250.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_11365, @p_36554, 'southbound', 'minibus', 25189, 270.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_11365, @p_36554, 'southbound', 'small_truck', 25189, 340.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_11365, @p_36554, 'southbound', 'large_bus', 25189, 420.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_11365, @p_36554, 'southbound', 'medium_truck', 25189, 540.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_11365, @p_36554, 'southbound', 'heavy_truck', 25189, 820.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_11365, @p_36554, 'southbound', 'large_truck', 25189, 1020.00, '2025-08-23', 'dbedc-2025-formula'),
-- Mirer Bazar -> Toll Plaza (K46) · 34.600 km · southbound
  (@p_11365, @p_45965, 'southbound', 'car', 34600, 200.00, '2025-08-23', 'dbedc-2025-formula-capped'),
  (@p_11365, @p_45965, 'southbound', 'pickup', 34600, 280.00, '2025-08-23', 'dbedc-2025-formula-capped'),
  (@p_11365, @p_45965, 'southbound', 'microbus', 34600, 320.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_11365, @p_45965, 'southbound', 'minibus', 34600, 350.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_11365, @p_45965, 'southbound', 'small_truck', 34600, 450.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_11365, @p_45965, 'southbound', 'large_bus', 34600, 550.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_11365, @p_45965, 'southbound', 'medium_truck', 34600, 720.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_11365, @p_45965, 'southbound', 'heavy_truck', 34600, 1110.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_11365, @p_45965, 'southbound', 'large_truck', 34600, 1370.00, '2025-08-23', 'dbedc-2025-formula'),
-- Purbachal Toll Plaza -> Vogra Toll Plaza · 21.304 km · northbound
  (@p_24522, @p_3218, 'northbound', 'car', 21304, 150.00, '2025-08-23', 'dbedc-2025-published'),
  (@p_24522, @p_3218, 'northbound', 'pickup', 21304, 180.00, '2025-08-23', 'dbedc-2025-published'),
  (@p_24522, @p_3218, 'northbound', 'microbus', 21304, 190.00, '2025-08-23', 'dbedc-2025-published'),
  (@p_24522, @p_3218, 'northbound', 'minibus', 21304, 210.00, '2025-08-23', 'dbedc-2025-published'),
  (@p_24522, @p_3218, 'northbound', 'small_truck', 21304, 260.00, '2025-08-23', 'dbedc-2025-published'),
  (@p_24522, @p_3218, 'northbound', 'large_bus', 21304, 310.00, '2025-08-23', 'dbedc-2025-published'),
  (@p_24522, @p_3218, 'northbound', 'medium_truck', 21304, 400.00, '2025-08-23', 'dbedc-2025-published'),
  (@p_24522, @p_3218, 'northbound', 'heavy_truck', 21304, 610.00, '2025-08-23', 'dbedc-2025-published'),
  (@p_24522, @p_3218, 'northbound', 'large_truck', 21304, 740.00, '2025-08-23', 'dbedc-2025-published'),
-- Purbachal Toll Plaza -> Mirer Bazar · 13.157 km · northbound
  (@p_24522, @p_11365, 'northbound', 'car', 13157, 120.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_24522, @p_11365, 'northbound', 'pickup', 13157, 150.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_24522, @p_11365, 'northbound', 'microbus', 13157, 160.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_24522, @p_11365, 'northbound', 'minibus', 13157, 170.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_24522, @p_11365, 'northbound', 'small_truck', 13157, 210.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_24522, @p_11365, 'northbound', 'large_bus', 13157, 250.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_24522, @p_11365, 'northbound', 'medium_truck', 13157, 310.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_24522, @p_11365, 'northbound', 'heavy_truck', 13157, 460.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_24522, @p_11365, 'northbound', 'large_truck', 13157, 560.00, '2025-08-23', 'dbedc-2025-formula'),
-- Purbachal Toll Plaza -> Toll Plaza (K34) · 9.831 km · southbound
  (@p_24522, @p_34353, 'southbound', 'car', 9831, 110.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_24522, @p_34353, 'southbound', 'pickup', 9831, 120.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_24522, @p_34353, 'southbound', 'microbus', 9831, 130.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_24522, @p_34353, 'southbound', 'minibus', 9831, 140.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_24522, @p_34353, 'southbound', 'small_truck', 9831, 170.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_24522, @p_34353, 'southbound', 'large_bus', 9831, 200.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_24522, @p_34353, 'southbound', 'medium_truck', 9831, 240.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_24522, @p_34353, 'southbound', 'heavy_truck', 9831, 360.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_24522, @p_34353, 'southbound', 'large_truck', 9831, 430.00, '2025-08-23', 'dbedc-2025-formula'),
-- Purbachal Toll Plaza -> Toll Plaza (K36) · 12.032 km · southbound
  (@p_24522, @p_36554, 'southbound', 'car', 12032, 120.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_24522, @p_36554, 'southbound', 'pickup', 12032, 140.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_24522, @p_36554, 'southbound', 'microbus', 12032, 150.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_24522, @p_36554, 'southbound', 'minibus', 12032, 160.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_24522, @p_36554, 'southbound', 'small_truck', 12032, 190.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_24522, @p_36554, 'southbound', 'large_bus', 12032, 230.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_24522, @p_36554, 'southbound', 'medium_truck', 12032, 290.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_24522, @p_36554, 'southbound', 'heavy_truck', 12032, 420.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_24522, @p_36554, 'southbound', 'large_truck', 12032, 510.00, '2025-08-23', 'dbedc-2025-formula'),
-- Purbachal Toll Plaza -> Toll Plaza (K46) · 21.443 km · southbound
  (@p_24522, @p_45965, 'southbound', 'car', 21443, 160.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_24522, @p_45965, 'southbound', 'pickup', 21443, 200.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_24522, @p_45965, 'southbound', 'microbus', 21443, 220.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_24522, @p_45965, 'southbound', 'minibus', 21443, 240.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_24522, @p_45965, 'southbound', 'small_truck', 21443, 300.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_24522, @p_45965, 'southbound', 'large_bus', 21443, 360.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_24522, @p_45965, 'southbound', 'medium_truck', 21443, 470.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_24522, @p_45965, 'southbound', 'heavy_truck', 21443, 710.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_24522, @p_45965, 'southbound', 'large_truck', 21443, 870.00, '2025-08-23', 'dbedc-2025-formula'),
-- Toll Plaza (K34) -> Vogra Toll Plaza · 31.135 km · northbound
  (@p_34353, @p_3218, 'northbound', 'car', 31135, 200.00, '2025-08-23', 'dbedc-2025-formula-capped'),
  (@p_34353, @p_3218, 'northbound', 'pickup', 31135, 260.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_34353, @p_3218, 'northbound', 'microbus', 31135, 290.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_34353, @p_3218, 'northbound', 'minibus', 31135, 320.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_34353, @p_3218, 'northbound', 'small_truck', 31135, 410.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_34353, @p_3218, 'northbound', 'large_bus', 31135, 500.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_34353, @p_3218, 'northbound', 'medium_truck', 31135, 650.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_34353, @p_3218, 'northbound', 'heavy_truck', 31135, 1000.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_34353, @p_3218, 'northbound', 'large_truck', 31135, 1240.00, '2025-08-23', 'dbedc-2025-formula'),
-- Toll Plaza (K34) -> Mirer Bazar · 22.988 km · northbound
  (@p_34353, @p_11365, 'northbound', 'car', 22988, 170.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_34353, @p_11365, 'northbound', 'pickup', 22988, 210.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_34353, @p_11365, 'northbound', 'microbus', 22988, 230.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_34353, @p_11365, 'northbound', 'minibus', 22988, 250.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_34353, @p_11365, 'northbound', 'small_truck', 22988, 320.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_34353, @p_11365, 'northbound', 'large_bus', 22988, 390.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_34353, @p_11365, 'northbound', 'medium_truck', 22988, 490.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_34353, @p_11365, 'northbound', 'heavy_truck', 22988, 760.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_34353, @p_11365, 'northbound', 'large_truck', 22988, 930.00, '2025-08-23', 'dbedc-2025-formula'),
-- Toll Plaza (K34) -> Purbachal Toll Plaza · 9.831 km · northbound
  (@p_34353, @p_24522, 'northbound', 'car', 9831, 110.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_34353, @p_24522, 'northbound', 'pickup', 9831, 120.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_34353, @p_24522, 'northbound', 'microbus', 9831, 130.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_34353, @p_24522, 'northbound', 'minibus', 9831, 140.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_34353, @p_24522, 'northbound', 'small_truck', 9831, 170.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_34353, @p_24522, 'northbound', 'large_bus', 9831, 200.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_34353, @p_24522, 'northbound', 'medium_truck', 9831, 240.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_34353, @p_24522, 'northbound', 'heavy_truck', 9831, 360.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_34353, @p_24522, 'northbound', 'large_truck', 9831, 430.00, '2025-08-23', 'dbedc-2025-formula'),
-- Toll Plaza (K34) -> Toll Plaza (K36) · 2.201 km · southbound
  (@p_34353, @p_36554, 'southbound', 'car', 2201, 70.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_34353, @p_36554, 'southbound', 'pickup', 2201, 70.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_34353, @p_36554, 'southbound', 'microbus', 2201, 70.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_34353, @p_36554, 'southbound', 'minibus', 2201, 80.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_34353, @p_36554, 'southbound', 'small_truck', 2201, 80.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_34353, @p_36554, 'southbound', 'large_bus', 2201, 90.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_34353, @p_36554, 'southbound', 'medium_truck', 2201, 100.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_34353, @p_36554, 'southbound', 'heavy_truck', 2201, 120.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_34353, @p_36554, 'southbound', 'large_truck', 2201, 140.00, '2025-08-23', 'dbedc-2025-formula'),
-- Toll Plaza (K34) -> Toll Plaza (K46) · 11.612 km · southbound
  (@p_34353, @p_45965, 'southbound', 'car', 11612, 120.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_34353, @p_45965, 'southbound', 'pickup', 11612, 130.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_34353, @p_45965, 'southbound', 'microbus', 11612, 150.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_34353, @p_45965, 'southbound', 'minibus', 11612, 160.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_34353, @p_45965, 'southbound', 'small_truck', 11612, 190.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_34353, @p_45965, 'southbound', 'large_bus', 11612, 220.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_34353, @p_45965, 'southbound', 'medium_truck', 11612, 280.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_34353, @p_45965, 'southbound', 'heavy_truck', 11612, 410.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_34353, @p_45965, 'southbound', 'large_truck', 11612, 500.00, '2025-08-23', 'dbedc-2025-formula'),
-- Toll Plaza (K36) -> Vogra Toll Plaza · 33.336 km · northbound
  (@p_36554, @p_3218, 'northbound', 'car', 33336, 200.00, '2025-08-23', 'dbedc-2025-formula-capped'),
  (@p_36554, @p_3218, 'northbound', 'pickup', 33336, 280.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_36554, @p_3218, 'northbound', 'microbus', 33336, 310.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_36554, @p_3218, 'northbound', 'minibus', 33336, 340.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_36554, @p_3218, 'northbound', 'small_truck', 33336, 440.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_36554, @p_3218, 'northbound', 'large_bus', 33336, 530.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_36554, @p_3218, 'northbound', 'medium_truck', 33336, 690.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_36554, @p_3218, 'northbound', 'heavy_truck', 33336, 1070.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_36554, @p_3218, 'northbound', 'large_truck', 33336, 1320.00, '2025-08-23', 'dbedc-2025-formula'),
-- Toll Plaza (K36) -> Mirer Bazar · 25.189 km · northbound
  (@p_36554, @p_11365, 'northbound', 'car', 25189, 180.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_36554, @p_11365, 'northbound', 'pickup', 25189, 230.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_36554, @p_11365, 'northbound', 'microbus', 25189, 250.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_36554, @p_11365, 'northbound', 'minibus', 25189, 270.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_36554, @p_11365, 'northbound', 'small_truck', 25189, 340.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_36554, @p_11365, 'northbound', 'large_bus', 25189, 420.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_36554, @p_11365, 'northbound', 'medium_truck', 25189, 540.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_36554, @p_11365, 'northbound', 'heavy_truck', 25189, 820.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_36554, @p_11365, 'northbound', 'large_truck', 25189, 1020.00, '2025-08-23', 'dbedc-2025-formula'),
-- Toll Plaza (K36) -> Purbachal Toll Plaza · 12.032 km · northbound
  (@p_36554, @p_24522, 'northbound', 'car', 12032, 120.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_36554, @p_24522, 'northbound', 'pickup', 12032, 140.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_36554, @p_24522, 'northbound', 'microbus', 12032, 150.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_36554, @p_24522, 'northbound', 'minibus', 12032, 160.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_36554, @p_24522, 'northbound', 'small_truck', 12032, 190.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_36554, @p_24522, 'northbound', 'large_bus', 12032, 230.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_36554, @p_24522, 'northbound', 'medium_truck', 12032, 290.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_36554, @p_24522, 'northbound', 'heavy_truck', 12032, 420.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_36554, @p_24522, 'northbound', 'large_truck', 12032, 510.00, '2025-08-23', 'dbedc-2025-formula'),
-- Toll Plaza (K36) -> Toll Plaza (K34) · 2.201 km · northbound
  (@p_36554, @p_34353, 'northbound', 'car', 2201, 70.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_36554, @p_34353, 'northbound', 'pickup', 2201, 70.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_36554, @p_34353, 'northbound', 'microbus', 2201, 70.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_36554, @p_34353, 'northbound', 'minibus', 2201, 80.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_36554, @p_34353, 'northbound', 'small_truck', 2201, 80.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_36554, @p_34353, 'northbound', 'large_bus', 2201, 90.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_36554, @p_34353, 'northbound', 'medium_truck', 2201, 100.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_36554, @p_34353, 'northbound', 'heavy_truck', 2201, 120.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_36554, @p_34353, 'northbound', 'large_truck', 2201, 140.00, '2025-08-23', 'dbedc-2025-formula'),
-- Toll Plaza (K36) -> Toll Plaza (K46) · 9.411 km · southbound
  (@p_36554, @p_45965, 'southbound', 'car', 9411, 100.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_36554, @p_45965, 'southbound', 'pickup', 9411, 120.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_36554, @p_45965, 'southbound', 'microbus', 9411, 130.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_36554, @p_45965, 'southbound', 'minibus', 9411, 140.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_36554, @p_45965, 'southbound', 'small_truck', 9411, 160.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_36554, @p_45965, 'southbound', 'large_bus', 9411, 190.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_36554, @p_45965, 'southbound', 'medium_truck', 9411, 240.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_36554, @p_45965, 'southbound', 'heavy_truck', 9411, 340.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_36554, @p_45965, 'southbound', 'large_truck', 9411, 420.00, '2025-08-23', 'dbedc-2025-formula'),
-- Toll Plaza (K46) -> Vogra Toll Plaza · 42.747 km · northbound
  (@p_45965, @p_3218, 'northbound', 'car', 42747, 200.00, '2025-08-23', 'dbedc-2025-formula-capped'),
  (@p_45965, @p_3218, 'northbound', 'pickup', 42747, 280.00, '2025-08-23', 'dbedc-2025-formula-capped'),
  (@p_45965, @p_3218, 'northbound', 'microbus', 42747, 320.00, '2025-08-23', 'dbedc-2025-formula-capped'),
  (@p_45965, @p_3218, 'northbound', 'minibus', 42747, 360.00, '2025-08-23', 'dbedc-2025-formula-capped'),
  (@p_45965, @p_3218, 'northbound', 'small_truck', 42747, 480.00, '2025-08-23', 'dbedc-2025-formula-capped'),
  (@p_45965, @p_3218, 'northbound', 'large_bus', 42747, 600.00, '2025-08-23', 'dbedc-2025-formula-capped'),
  (@p_45965, @p_3218, 'northbound', 'medium_truck', 42747, 800.00, '2025-08-23', 'dbedc-2025-formula-capped'),
  (@p_45965, @p_3218, 'northbound', 'heavy_truck', 42747, 1280.00, '2025-08-23', 'dbedc-2025-formula-capped'),
  (@p_45965, @p_3218, 'northbound', 'large_truck', 42747, 1600.00, '2025-08-23', 'dbedc-2025-formula-capped'),
-- Toll Plaza (K46) -> Mirer Bazar · 34.600 km · northbound
  (@p_45965, @p_11365, 'northbound', 'car', 34600, 200.00, '2025-08-23', 'dbedc-2025-formula-capped'),
  (@p_45965, @p_11365, 'northbound', 'pickup', 34600, 280.00, '2025-08-23', 'dbedc-2025-formula-capped'),
  (@p_45965, @p_11365, 'northbound', 'microbus', 34600, 320.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_45965, @p_11365, 'northbound', 'minibus', 34600, 350.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_45965, @p_11365, 'northbound', 'small_truck', 34600, 450.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_45965, @p_11365, 'northbound', 'large_bus', 34600, 550.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_45965, @p_11365, 'northbound', 'medium_truck', 34600, 720.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_45965, @p_11365, 'northbound', 'heavy_truck', 34600, 1110.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_45965, @p_11365, 'northbound', 'large_truck', 34600, 1370.00, '2025-08-23', 'dbedc-2025-formula'),
-- Toll Plaza (K46) -> Purbachal Toll Plaza · 21.443 km · northbound
  (@p_45965, @p_24522, 'northbound', 'car', 21443, 160.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_45965, @p_24522, 'northbound', 'pickup', 21443, 200.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_45965, @p_24522, 'northbound', 'microbus', 21443, 220.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_45965, @p_24522, 'northbound', 'minibus', 21443, 240.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_45965, @p_24522, 'northbound', 'small_truck', 21443, 300.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_45965, @p_24522, 'northbound', 'large_bus', 21443, 360.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_45965, @p_24522, 'northbound', 'medium_truck', 21443, 470.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_45965, @p_24522, 'northbound', 'heavy_truck', 21443, 710.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_45965, @p_24522, 'northbound', 'large_truck', 21443, 870.00, '2025-08-23', 'dbedc-2025-formula'),
-- Toll Plaza (K46) -> Toll Plaza (K34) · 11.612 km · northbound
  (@p_45965, @p_34353, 'northbound', 'car', 11612, 120.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_45965, @p_34353, 'northbound', 'pickup', 11612, 130.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_45965, @p_34353, 'northbound', 'microbus', 11612, 150.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_45965, @p_34353, 'northbound', 'minibus', 11612, 160.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_45965, @p_34353, 'northbound', 'small_truck', 11612, 190.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_45965, @p_34353, 'northbound', 'large_bus', 11612, 220.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_45965, @p_34353, 'northbound', 'medium_truck', 11612, 280.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_45965, @p_34353, 'northbound', 'heavy_truck', 11612, 410.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_45965, @p_34353, 'northbound', 'large_truck', 11612, 500.00, '2025-08-23', 'dbedc-2025-formula'),
-- Toll Plaza (K46) -> Toll Plaza (K36) · 9.411 km · northbound
  (@p_45965, @p_36554, 'northbound', 'car', 9411, 100.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_45965, @p_36554, 'northbound', 'pickup', 9411, 120.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_45965, @p_36554, 'northbound', 'microbus', 9411, 130.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_45965, @p_36554, 'northbound', 'minibus', 9411, 140.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_45965, @p_36554, 'northbound', 'small_truck', 9411, 160.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_45965, @p_36554, 'northbound', 'large_bus', 9411, 190.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_45965, @p_36554, 'northbound', 'medium_truck', 9411, 240.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_45965, @p_36554, 'northbound', 'heavy_truck', 9411, 340.00, '2025-08-23', 'dbedc-2025-formula'),
  (@p_45965, @p_36554, 'northbound', 'large_truck', 9411, 420.00, '2025-08-23', 'dbedc-2025-formula')
;
