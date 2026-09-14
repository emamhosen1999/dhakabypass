# Content generators

The source of `db/sql/33-translation-parity.sql` and `db/sql/34-remaining-pages.sql`: the trilingual content drafted for the master plan's W3, W4 and W5 pages and the Bangla/Chinese parity of the recovered legacy blocks.

    python scripts/content/gen_parity.py
    python scripts/content/gen_pages.py

Once a numbered file has been imported in production, edit the content in the admin, not here: production's migration ledger already records the file as applied.
