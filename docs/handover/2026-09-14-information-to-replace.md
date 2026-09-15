# Information to replace — one list

*Prepared 14 September 2026. Everything below is live on dhakabypass.com with sample data so the feature is complete; each row says where the real value goes. Every sample value carries the word "Sample" (English), "নমুনা" (Bangla) or "示例" (Chinese) on the page, so a search for those words on any page finds what is still to replace.*

Where the row says **/admin/…** the operator replaces it in the admin without a developer. Where it says **server** or **decision** it needs the person named.

## A. Emergency and contact

| # | What is shown now (sample) | Replace with | Where |
|---|---|---|---|
| A1 | DBEDC emergency line **+880 2 5555 0199** in every footer and on the breakdown page | The 24-hour control-room role number (never a staff mobile: master plan decision 0.13) | /admin/settings → Contact → Emergency assistance number |
| A2 | 999 as the national emergency number | Confirmed (no change expected) | /admin/settings |
| A3 | Office telephone +880 2 5555 0100, email info@dhakabypass.com | The landline and role mailbox | /admin/settings → Contact |
| A4 | Registered office "Level 8, Sample Tower, Gulshan Avenue, Dhaka 1212" (three languages) and hours Sun–Thu 9:00–17:00 | Registered office address and opening hours | /admin/settings → Contact |
| A5 | Office pin on /contact at Vogra Toll Plaza coordinates, marked "Sample location" | The office's coordinates and address | /admin/pages-v2 → Contact → "Where to find us" block |
| A6 | "Who to contact" directory on /contact: control room, customer service, grievance focal officer, appeal officer, RTI officer, RTI appellate authority, media, integrity focal point, each with a sample name, number and mailbox | The designated officers' role titles, names (optional), numbers and mailboxes | /admin/pages-v2 → Contact → "Who to contact" block |

## B. Statutory officers and legal sign-off

| # | Sample now | Replace with | Where |
|---|---|---|---|
| B1 | RTI Designated Information Officer "Company Secretary", appellate authority "Chief Executive Officer" on /disclosures/right-to-information | The officers designated under s.10 of the Right to Information Act 2009 | /admin/pages-v2 → Right to information → "Designated officers" block (and A6) |
| B2 | Proactive-disclosure documents (organisation structure, request form and fees, annual RTI report) linking to a placeholder PDF | The real PDFs | Upload under /admin/media, then edit the "Proactive disclosure" block |
| B3 | Grievance focal and appeal officers, 15-working-day review | The GRS focal and appeal officers and the approved time limits | /admin/pages-v2 → Grievances; /admin/requests → Standard response deadlines |
| B4 | Statutory pages drafted from public sources: citizen charter, integrity, RTI, grievance, toll dispute/refund, privacy, terms | Counsel's page-by-page approval; corrections typed in the editor | /admin/pages-v2 (each page keeps its history) |

## C. Tolls

| # | Sample now | Replace with | Where |
|---|---|---|---|
| C1 | Every rate for the open section cites "Sample: S.R.O. No. 000-Law/2025", dated 20 Aug 2025, linking to the placeholder PDF | The gazetted S.R.O. number, date and the PDF of the instrument | /admin/corridor/tolls → each rate's citation fields; upload the PDF under /admin/media |
| C2 | Fare matrix (270 pairs) marked provisional; the public calculator now offers only open plazas | The approved entry–exit schedule for each section as it opens, with its S.R.O. | /admin/corridor/toll-matrix (a fare becomes confirmed by entering its citation) |
| C3 | "Notifications in force" on /disclosures/tariff: sample toll schedule and sample exemptions notice | The real notifications and the exemption list | /admin/pages-v2 → Tariff notifications block |
| C4 | Payment methods on rate records | Accepted methods per plaza (cash, card, ETC tag) | /admin/corridor/tolls |
| C5 | "Mark this data as provisional" is on (site-wide notice) | Turn off once C1–C4 are confirmed | /admin/corridor (tick the confirmation) |

## D. Key facts and company identity

| # | Sample now | Replace with | Where |
|---|---|---|---|
| D1 | Key-facts table on /about/concession: project cost US$ 358.8 m; shareholding SRBG 70 % / SEL 30 %; concession term 25 years from Dec 2018; lenders CDB and BIFFL; RJSC number C-000000/2018; registered office | The figures from the share register, financing agreements, concession agreement and RJSC certificate, each with its source document and as-at date | /admin/pages-v2 → Concession → "Key facts" block |
| D2 | Governance page: board members list and shareholding narrative (60/30/10 in prose, from public sources) | Board names and roles; reconcile the prose with D1 | /admin/pages-v2 → Governance |
| D3 | Organisation chart with department heads | Named heads of department | /admin/pages-v2 → How DBEDC is organised |
| D4 | Corridor facts: 48 km published length, road code N105 | Confirm | /admin/corridor → Corridor facts |
| D5 | Opening date of the Purbachal–Madanpur section: removed (was an unverified 16 Sep 2026) | The confirmed programme date, when known | /admin/corridor/segments → "Planned to open" |
| D6 | Structures register, timeline dates, opening chronology | Confirm against the construction programme | /admin/pages-v2 → The project |

## E. Documents and reports

| # | Sample now | Replace with | Where |
|---|---|---|---|
| E1 | /disclosures/reports: sample annual report 2025, audited statements 2025, quarterly toll revenue and traffic | The approved annual report, audited accounts and quarterly figures | Upload PDFs, edit the "Reports and accounts" block |
| E2 | /disclosures/land-acquisition: sample resettlement plan, entitlement matrix (Bangla summary), social monitoring report Jan–Jun 2026, Grievance Redress Committee contacts | The approved RP, entitlement matrix, latest monitoring report, GRC members and contacts; correct the district list in the prose | Upload PDFs, edit the "Resettlement documents" block |
| E3 | /disclosures/environment: sample IEE/EMP, Environmental Clearance Certificate, monitoring report Jan–Jun 2026 | The real documents | Upload PDFs, edit the "Environmental documents" block |
| E4 | /disclosures/policies: sample anti-corruption, whistle-blowing, related-party, OHS, CCTV and personal-data policies | Board-approved policies | Upload PDFs, edit the "Policy documents" block |
| E5 | Monthly traffic counts (sample) | Plaza counts per month | /admin/corridor/monthly |
| E6 | Service-area and facility records | Real facilities, hours and amenities | /admin/pages-v2 → Facilities |

## F. Recognition and media

| # | Sample now | Replace with | Where |
|---|---|---|---|
| F1 | Two sample awards on /about/recognition | Awards on record (body, title, date) or delete the block | /admin/pages-v2 → Recognition |
| F2 | Press releases: drafted from public coverage | DBEDC's own releases in three languages | /admin/news |
| F3 | Photographs: 32 small copies from the old site marked "Too small" | Original camera files (see the media brief) | /admin/media → Replace |
| F4 | Videos: four public broadcast clips embedded from YouTube | DBEDC's own footage (see the media brief) | /admin/pages-v2 → Videos |
| F5 | 360° tour: two panoramas made from ordinary photographs, captioned as samples | Real equirectangular captures (see the media brief) | /admin/pages-v2 → 360° tour |
| F6 | Traffic cameras: four sample tiles showing stored photographs | Real camera feeds (see the CCTV request below) | /admin/corridor/cameras |

## G. Server, providers and decisions (not in the admin)

| # | Now | Needed | Who |
|---|---|---|---|
| G1 | Road alerts sign-up works; broadcasts are recorded as "not sent — no provider" | SMS gateway URL/token/sender and WhatsApp Cloud API token/phone-id/template in the server environment (ALERTS_SMS_*, ALERTS_WHATSAPP_*) | DBEDC procures; developer sets |
| G2 | Live traffic: Google Routes implemented; CRON_SECRET set and both cron jobs scheduled (15 Sep) | GOOGLE_ROUTES_API_KEY on the server (Google Cloud → Routes API) | DBEDC provides the key; developer sets |
| G2a | Request acknowledgement emails: built; not sent until a mail server is configured | MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASSWORD, MAIL_FROM (an SMTP account on the DBEDC domain) | DBEDC IT provides; developer sets |
| G3 | ETC tag, fleet account and frequent-traveller applications are collected with tracking numbers | Agreement with the national ETC operator; someone to process applications from /admin/requests | Decision (DBEDC) |
| G4 | The GitHub repository is public and contains the runbook and these audits | Make it private, or move docs/deployment, docs/source-data and docs/audit out of the public history (audit CON-SEC-01) | Decision (DBEDC/owner) |
| G5 | Admin reachable from any IP | IP allow-list or Cloudflare Access with MFA in front of /admin (W8C.4) | Developer + DBEDC IT |
| G6 | Email domain DMARC p=none | Move to p=quarantine after checking sending sources | DBEDC IT |
| G7 | Google Search Console, Google Business Profile, social accounts | Ownership handed to a DBEDC account; verified handles for the footer | DBEDC communications |

## H. CCTV: what the developer needs to switch from sample tiles to live cameras

1. The camera list: location name, chainage (K3+218 style), direction of view, latitude/longitude.
2. The NVR/VMS make and model, and whether it serves **JPEG snapshots** (URL pattern) and/or **HLS streams** (`.m3u8` URL pattern) — both are supported; RTSP alone is not and would need a relay.
3. A read-only account (username/password) per camera or per NVR. The site stores these sealed and never shows them.
4. Network access from the web server to the NVR: a public HTTPS address, or a VPN/allow-list for the server's IP.
5. The public-display policy: which cameras may be shown, still-image refresh interval, whether live video is allowed, and the privacy statement (people and number plates).
6. Confirmation that no camera shows identifiable people at rest (the audit flagged the current sample stills for this).

Once received: enter each camera at /admin/corridor/cameras, press "Test now", and the tile goes live.
