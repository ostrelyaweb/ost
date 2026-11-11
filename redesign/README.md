# Ostrelya Studio — Homepage

Premium web design studio homepage for **OSTRELYA**.

## Features

- **Swiss-Inspired Editorial Design**: Asymmetric layouts, typography-driven visual hierarchy, and bespoke architectural elements.
- **Dynamic Process Trajectory**: Seamless Bézier curve transitions in the *How We Work* section with scroll-driven stroke reveal and interactive tracer beacon.
- **Micro-Interactions**: Custom needle hover physics in the *Philosophy* section, sticky header treatment, and mobile drawer.
- **Fully Responsive**: Crafted for mobile, tablet, and widescreen desktop displays.
- **Performance & Accessibility**: Semantic HTML5, CSS custom properties, and reduced-motion support.

## Tech Stack

- Semantic HTML5
- Vanilla CSS3 (Custom Properties, Flexbox, CSS Grid)
- Vanilla JavaScript (Hardware-accelerated RAF animations)

## Ostrelya content editor

From the project folder, run `python -B tools/studio_auth.py` in an interactive terminal to create the local editor account. Enter a username and a password of at least 16 characters when prompted. Start the site with `python -B tools/preview.py` and sign in at [Ostrelya Studio Editor](http://127.0.0.1:8765/studio-editor/?v=private-login). The web editor accepts only an account provisioned through this command.

- **Spremi nacrt** keeps the current page or article for later.
- **Pregled nacrta** opens the saved draft in the site layout for the signed-in editor.
- **Objavi članak** publishes the selected article only. **Objavi stranicu** publishes the About content or Journal page settings.
- **Nacrt i povijest** lists earlier versions of the selected page or article and lets you restore one.

The password hash, drafts, staged images and history live in the ignored `.studio-private/` directory. Published content and images live in `content/` and `assets/uploads/`. Sessions expire after eight hours or on server restart. The browser stores the local editor token for this exact origin (including its port), and only sends it to the CMS API. Sign in again after moving to a different local port. The preview server binds to loopback and rejects requests for other hosts. The former browser setup account and the local Decap proxy are disabled.

Publish only the public site and its published content. For a hosted CMS, require HTTPS and place the editor, its entire API, and draft media behind [Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/self-hosted-public-app/) with explicitly allowed editor identities. Use a private origin and validate Access tokens at the tunnel or origin so the policy cannot be bypassed. The Python preview is intended for local editing.

## Public site build

From the project folder, run `python -B tools/public_site.py --origin https://your-domain.example --output ./public-build` with the final HTTPS origin and a new output directory. Upload the generated directory to the public host. The build includes HTML for published About and Journal content, article pages, public assets, robots.txt and sitemap.xml. Generate a fresh directory after a content update.

The public build uses directory indexes for `/services/`, `/about/` and `/journal/`, with a Cloudflare Pages `_redirects` file for old page addresses and a top-level `404.html`. The local preview also maps old `/journal.html?article=SLUG` links to individual articles. Cloudflare Pages path redirects do not match the `article` query parameter.

The draft privacy pages and their links are local previews. Before publishing the policy, confirm the controller and hosting details, finalize both language versions, then include the pages and their links in the public build. Use the generated directory as the Cloudflare Pages output.

Regional service pages are built from `content/regional.json`. On Cloudflare Pages, the edge handler uses the country estimated from the IP address to redirect external homepage visits temporarily to the corresponding regional hub. For visitors in Croatia, the homepage opens in English and offers a choice between Croatian and English instead. An explicit language choice takes priority and is remembered. The English link on a regional page opens `/?lang=en` and remembers that choice. Without a matching country or language preference, the homepage is in English. Internal navigation to the homepage and direct links to regional pages and services stay on the requested page. The homepage and services page get suggestions via `/api/locale`, which is available in Cloudflare Pages and its development runtime. Regional pages link to the corresponding service in each language, and their canonical URLs are included in the sitemap.
