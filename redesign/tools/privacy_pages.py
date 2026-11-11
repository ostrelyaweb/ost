from html import escape

from regional_site import site_chrome


PRIVACY_PAGES = {"/privacy/": "privacy/index.html", "/hr/privatnost/": "hr/privatnost/index.html"}


def render_privacy(root, origin, path):
    croatian = path == "/hr/privatnost/"
    lang = "hr" if croatian else "en"
    title = "Politika privatnosti i kolačići" if croatian else "Privacy and cookies"
    description = ("Kako Ostrelya postupa s upitima i što se sprema u vašem pregledniku."
                   if croatian else "How Ostrelya handles enquiries and what is stored in your browser.")
    other_language = ('<a href="/privacy/" lang="en" hreflang="en">English</a>'
                      if croatian else '<a href="/hr/privatnost/" lang="hr" hreflang="hr">Hrvatski</a>')
    body = (root / "content" / f"privacy-{lang}.html").read_text(encoding="utf-8")
    header, footer = site_chrome(root, regional=False, croatian=croatian)
    contact = "/hr/usluge/web-dizajn/#contact" if croatian else "/#contact"
    header = header.replace('href="#contact"', f'href="{contact}"')
    footer = footer.replace('href="#contact"', f'href="{contact}"')
    return f"""<!doctype html>
<html lang="{lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title} | Ostrelya Studio</title>
  <meta name="description" content="{description}">
  <meta name="robots" content="noindex">
  <link rel="canonical" href="{escape(origin + path)}">
  <link rel="alternate" hreflang="hr" href="{escape(origin + '/hr/privatnost/')}">
  <link rel="alternate" hreflang="en" href="{escape(origin + '/privacy/')}">
  <link rel="icon" type="image/png" href="/assets/symbol-dark-small.png">
  <link rel="stylesheet" href="/assets/regional-fonts.css?v=1">
  <link rel="stylesheet" href="/styles.css?v=regional">
  <link rel="stylesheet" href="/assets/privacy.css">
  <script src="/assets/region-language.js?v=10" defer></script>
  <script src="/script.js?v=clean-routes" defer></script>
</head>
<body class="page-editorial" id="top">
  {header}
  <main class="page-container privacy-page" id="main-content">
    <div class="privacy-heading">
      <p class="services-kicker">Ostrelya Studio</p>
      {other_language}
    </div>
    <h1 class="editorial-heading">{title}</h1>
    {body}
  </main>
  {footer}
</body>
</html>
"""
