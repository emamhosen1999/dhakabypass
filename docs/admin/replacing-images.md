# Replacing the images on the website

A guide for DBEDC staff. No technical knowledge needed.

---

## Why every image says "placeholder"

The photographs on the new site came from the old website. They are DBEDC's own
pictures of DBEDC's own road — but they are **small copies**, made years ago to
load quickly on slower connections.

The largest is 1024 pixels wide. The big picture at the top of the home page is
686 pixels wide. A modern laptop screen is around 2560 pixels wide.

So those pictures have to be stretched to fill the space, and stretching makes
them soft and slightly blurry. Nothing is broken. They will simply look better
the day you send the originals.

**Every one of them is marked "placeholder" in the Media screen** so you can see
at a glance what still needs replacing.

## What to send

The **original files from the camera or the phone**, exactly as they came off it.

- Do not resize them, crop them, or "optimise" them first. Bigger is better; the
  website makes its own smaller copies.
- JPEG, PNG or WebP are all fine.
- For the big picture at the top of the home page, at least **2400 pixels wide**.
- If you have the photographer's original files on a hard drive somewhere, those
  are what we want, not the copies that ended up on the old website.

## How to replace one

1. Sign in to the admin.
2. Go to **Media**.
3. Placeholders are listed first, so what needs replacing is at the top.
4. Find the picture you want to change. Each row shows the picture, its size in
   pixels, and a warning if it is too small.
5. Choose your new file and press **Replace**.

That is all. Every page using that picture updates at once — you do not have to
go and edit the home page, or any other page, separately.

The change is live immediately. If a page still looks like the old picture,
refresh it once; browsers hold on to pictures for a while.

## Please do not take pictures from Google

This matters, and the old website shows why.

A Google image search is a list of **other people's photographs**. Finding one
there does not give DBEDC permission to publish it. Using one on the company
website means publishing somebody else's property without asking.

**Ten files from the old website were excluded from the new one for this
reason.** Four of them are still on the live old site today:

| What it is | The problem |
|---|---|
| A Belt and Road Initiative route map | Somebody else's infographic |
| A "Surface / Base / Subbase Course" diagram | Stock illustration, not DBEDC's |
| An aerial photo of a motorway | **Not this road, and not Bangladesh.** It was captioned as the corridor |
| Two Google Maps screenshots | One still shows "Map data ©2015 Google" printed on it |
| A newspaper graphic, "DHAKA BYPASS PROJECT IN A JAM" | A press graphic about land-acquisition delays, republished on your own site |
| A China–Bangladesh flag illustration | Stock artwork, source unknown |
| Three internal engineering drawings | Working documents, including land-acquisition notes |

The two Google ones are the most urgent. Google's terms are the most likely of
these to be enforced, and the copyright line is printed on the picture itself
where anyone can see it.

**If you need a photograph DBEDC does not own, commission a photographer or buy
a licence.** For a road you own and operate, the cheapest option is usually to
send someone out with a camera.

## Describing each picture

Every picture needs one sentence saying what is in it. For example:

> A gantry over the carriageway reading "Welcome to Dhaka Bypass Expressway",
> with the toll plaza and trucks beyond.

This is used by two groups of people:

- **Drivers using screen readers** — blind and partially sighted visitors hear
  this sentence instead of seeing the picture.
- **Google** — it is one of the ways search engines understand your pages.

Write it in each language if you can. Describe what is actually in the frame,
not what the picture is *for*: "Trucks queueing at the Vogra plaza", not
"Economic impact".

## Where to start — the priority list

If you can only send a few pictures, send these, in this order:

1. **The home page banner** (`bg-hero.webp`) — 686 pixels wide, and the most
   visible image on the entire website. One good aerial replaces it.
2. **The toll plaza gantry** (`bypass-ex.webp`) — the clearest picture you have
   of the road being the road. Worth reshooting at full size.
3. **The four aerials** (`photo/20` to `photo/23`) — the completed expressway
   and the viaduct over the river. These carry the middle of the home page.

After those, anything showing the road in use: traffic at the plazas, the
carriageway at different times of day, night shots, the bridges.

## What we still cannot show you

The **Facilities** page is empty. Not because of a picture — because nobody has
told us what each service area actually offers. Fuel? Food? Toilets? Repairs?
Send a list and the page fills itself in.

---

## If something looks wrong

**A page shows an old picture.** Refresh once. Browsers keep copies of images.

**A page shows old *text* after somebody ran a data script.** This one is for
whoever maintains the site: content loaded through the page cache does not
refresh when a script writes to the database directly. Stop the server, delete
the `.next/cache/fetch-cache` folder, and start it again. Replacing an image
through the Media screen does not have this problem — that path clears the cache
properly.

**A picture will not upload.** The site accepts JPEG, PNG and WebP. It does not
accept SVG: the site cannot measure an SVG's size, and without that measurement
pages jump around while they load.
