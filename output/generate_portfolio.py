#!/usr/bin/env python3
"""OSTRELYA Portfolio PDF Generator - Swiss Brutalist Style"""
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.colors import HexColor, Color
from reportlab.pdfgen import canvas
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.graphics.shapes import Drawing, Rect, String, Line
from reportlab.lib.styles import getSampleStyleSheet

# ── Brand colors ──────────────────────────────────────────────
OFF_WHITE  = HexColor("#f5f4f0")
WHITE      = HexColor("#ffffff")
BLACK      = HexColor("#141414")
RED        = HexColor("#e8432e")
GOLD       = HexColor("#e8b64c")
DARK_BG    = HexColor("#0d0d12")
GREY       = HexColor("#888888")
LIGHT_GREY = HexColor("#d0d0d0")
MID_GREY   = HexColor("#555555")

W, H = A4  # 595.27 x 841.89

OUT = os.path.join(os.path.dirname(__file__), "ostrelya-portfolio.pdf")

# ── Helpers ───────────────────────────────────────────────────
def registration_marks(c, margin=14*mm):
    """Draw + registration marks at corners"""
    c.setStrokeColor(BLACK)
    c.setLineWidth(0.5)
    size = 4*mm
    offsets = [
        (margin, H - margin),           # top-left
        (W - margin, H - margin),       # top-right
        (margin, margin),               # bottom-left
        (W - margin, margin),           # bottom-right
    ]
    for x, y in offsets:
        c.line(x - size, y, x + size, y)
        c.line(x, y - size, x, y + size)

def draw_brutalist_border(c, margin=18*mm):
    """Thick black border with offset shadow"""
    c.setStrokeColor(BLACK)
    c.setLineWidth(2.5)
    # shadow
    c.setFillColor(BLACK)
    c.rect(margin + 1.5*mm, margin - 1.5*mm, W - 2*margin, H - 2*margin, fill=0, stroke=1)
    # main border
    c.rect(margin, margin, W - 2*margin, H - 2*margin, fill=0, stroke=1)

def section_divider(c, y, label=""):
    """Horizontal rule with optional label"""
    c.setStrokeColor(BLACK)
    c.setLineWidth(1.5)
    c.line(22*mm, y, W - 22*mm, y)
    if label:
        c.setFillColor(BLACK)
        c.setFont("Helvetica-Bold", 7)
        c.drawString(22*mm, y + 3*mm, label)

def wireframe_browser(c, x, y, w, h, accent=RED, title="concept"):
    """Draw a stylized browser wireframe mockup"""
    # Browser chrome
    c.setStrokeColor(BLACK)
    c.setLineWidth(0.8)
    c.setFillColor(HexColor("#eaeaec"))
    c.roundRect(x, y + h - 14*mm, w, 14*mm, 2*mm, fill=1, stroke=1)
    # dots
    dot_y = y + h - 8*mm
    for i, col in enumerate([HexColor("#ff5f57"), HexColor("#febc2e"), HexColor("#28c840")]):
        c.setFillColor(col)
        c.circle(x + 5*mm + i * 4*mm, dot_y, 1.5*mm, fill=1, stroke=0)
    # title bar
    c.setFillColor(MID_GREY)
    c.setFont("Helvetica", 5)
    c.drawCentredString(x + w/2, dot_y - 1.5*mm, title.upper())
    # page body
    c.setFillColor(OFF_WHITE)
    c.rect(x, y, w, h - 14*mm, fill=1, stroke=1)
    return (x, y, w, h - 14*mm)  # return body rect

def wireframe_navbar(c, x, y, w, accent=RED):
    """Small nav bar wireframe"""
    c.setStrokeColor(LIGHT_GREY)
    c.setLineWidth(0.4)
    c.setFillColor(WHITE)
    c.rect(x, y, w, 5*mm, fill=1, stroke=1)
    # logo placeholder
    c.setFillColor(accent)
    c.rect(x + 2*mm, y + 1*mm, 12*mm, 3*mm, fill=1, stroke=0)
    # nav items
    c.setFillColor(LIGHT_GREY)
    for i in range(4):
        c.rect(x + w - 30*mm + i*7*mm, y + 1.5*mm, 5*mm, 2*mm, fill=1, stroke=0)

def wireframe_hero(c, x, y, w, h, accent=RED):
    """Hero section wireframe"""
    # big headline
    c.setFillColor(BLACK)
    c.rect(x + 3*mm, y + h - 8*mm, w * 0.7, 4*mm, fill=1, stroke=0)
    c.rect(x + 3*mm, y + h - 14*mm, w * 0.5, 3*mm, fill=1, stroke=0)
    # CTA button
    c.setFillColor(accent)
    c.roundRect(x + 3*mm, y + h - 22*mm, 28*mm, 5*mm, 1.5*mm, fill=1, stroke=0)
    # image placeholder
    c.setFillColor(HexColor("#e0e0e0"))
    c.rect(x + w*0.55, y + 2*mm, w*0.4, h - 6*mm, fill=1, stroke=1)

def wireframe_cards(c, x, y, w, count=3, accent=RED):
    """Three-card grid wireframe"""
    gap = 2*mm
    card_w = (w - gap * (count - 1)) / count
    for i in range(count):
        cx = x + i * (card_w + gap)
        c.setFillColor(HexColor("#f0f0f0"))
        c.rect(cx, y, card_w, 22*mm, fill=1, stroke=1)
        # image area
        c.setFillColor(HexColor("#d8d8d8"))
        c.rect(cx, y + 12*mm, card_w, 10*mm, fill=1, stroke=0)
        # text lines
        c.setFillColor(LIGHT_GREY)
        c.rect(cx + 2*mm, y + 7*mm, card_w - 4*mm, 2*mm, fill=1, stroke=0)
        c.rect(cx + 2*mm, y + 4*mm, card_w * 0.6, 1.5*mm, fill=1, stroke=0)

def wireframe_footer(c, x, y, w, accent=RED):
    """Footer wireframe"""
    c.setFillColor(BLACK)
    c.rect(x, y, w, 8*mm, fill=1, stroke=0)
    c.setFillColor(accent)
    c.rect(x + 2*mm, y + 2.5*mm, 10*mm, 3*mm, fill=1, stroke=0)
    c.setFillColor(MID_GREY)
    c.rect(x + w - 30*mm, y + 3*mm, 14*mm, 2*mm, fill=1, stroke=0)

# ── Page 1: Cover ─────────────────────────────────────────────
def page_cover(c):
    c.setFillColor(DARK_BG)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    # Registration marks
    c.setStrokeColor(GOLD)
    c.setLineWidth(0.4)
    size = 5*mm
    for mx, my in [(20*mm, H-20*mm), (W-20*mm, H-20*mm), (20*mm, 20*mm), (W-20*mm, 20*mm)]:
        c.line(mx - size, my, mx + size, my)
        c.line(mx, my - size, mx, my + size)

    # Main brand mark
    y_center = H * 0.58

    # Big cross / plus mark
    c.setStrokeColor(GOLD)
    c.setLineWidth(6)
    cross_size = 28*mm
    cx, cy = W/2, y_center + 20*mm
    c.line(cx - cross_size, cy, cx + cross_size, cy)
    c.line(cx, cy - cross_size, cx, cy + cross_size)

    # OSTRELYA text
    c.setFillColor(OFF_WHITE)
    c.setFont("Helvetica-Bold", 52)
    c.drawCentredString(W/2, y_center - 16*mm, "OSTRELYA")

    # TM
    c.setFont("Helvetica", 16)
    c.drawString(W/2 + 88*mm, y_center - 10*mm, "TM")

    # WEB STUDIO
    c.setFillColor(GOLD)
    c.setFont("Helvetica", 14)
    c.drawCentredString(W/2, y_center - 30*mm, "W E B   S T U D I O")

    # Tagline
    c.setFillColor(GREY)
    c.setFont("Helvetica", 9)
    c.drawCentredString(W/2, y_center - 48*mm, "Modern, mobile-first websites for small businesses")

    # Markets
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 8)
    c.drawCentredString(W/2, y_center - 58*mm, "HR  ·  BA  ·  RS  ·  EU  ·  CA  ·  US")

    # Bottom section
    c.setStrokeColor(GOLD)
    c.setLineWidth(0.5)
    line_y = 55*mm
    c.line(30*mm, line_y, W - 30*mm, line_y)

    c.setFillColor(GREY)
    c.setFont("Helvetica", 7)
    c.drawCentredString(W/2, line_y - 8*mm, "PORTFOLIO  ·  2026")

    c.setFillColor(OFF_WHITE)
    c.setFont("Helvetica-Bold", 10)
    c.drawCentredString(W/2, line_y - 20*mm, "DESIGN CONCEPTS & SAMPLE WORK")

    c.setFillColor(GREY)
    c.setFont("Helvetica", 7.5)
    lines = [
        "Custom website design  ·  Mobile-first development",
        "Hosting & care plans  ·  SEO & Google Business",
        "Delivered in ~10 days  ·  Fully owned by you"
    ]
    for i, line in enumerate(lines):
        c.drawCentredString(W/2, line_y - 32*mm - i*5*mm, line)

    # Contact bar at very bottom
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 7)
    c.drawCentredString(W/2, 28*mm, "HELLO@OSTRELYA.COM  ·  OSTRELYA.COM")


# ── Page 2: Portfolio ─────────────────────────────────────────
def page_portfolio(c):
    # Light background
    c.setFillColor(OFF_WHITE)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    draw_brutalist_border(c, margin=16*mm)
    registration_marks(c, margin=13*mm)

    # Header
    y = H - 30*mm
    c.setFillColor(BLACK)
    c.setFont("Helvetica-Bold", 22)
    c.drawString(22*mm, y, "SELECTED WORK")

    c.setFillColor(RED)
    c.setFont("Helvetica-Bold", 7)
    c.drawString(22*mm, y - 7*mm, "02")

    c.setFillColor(MID_GREY)
    c.setFont("Helvetica", 7.5)
    c.drawString(32*mm, y - 7*mm, "SIX DESIGN CONCEPTS  ·  EACH A FULLY WORKING SITE")

    section_divider(c, y - 11*mm)

    # ── Concept grid: 2 columns × 3 rows ──
    concepts = [
        {"name": "V01 - WARM EDITORIAL", "biz": "Boutique Hotel & Spa",
         "desc": "Cream tones, serif type, soft photography grid. Elegant, inviting layout for hospitality.",
         "accent": HexColor("#d96c2c"), "tags": ["EDITORIAL", "HOSPITALITY", "WARM PALETTE"]},
        {"name": "B01 - SWISS BRUTALIST", "biz": "Web Studio (Ostrelya Brand)",
         "desc": "Our own brand direction. Off-white, black rules, red accent, registration marks. Bold, structured.",
         "accent": RED, "tags": ["BRUTALIST", "SWISS", "STRUCTURED"]},
        {"name": "V03 - LUXURY DARK", "biz": "Premium Restaurant & Bar",
         "desc": "Dark backgrounds, gold accents, refined typography. High-end feel for premium venues.",
         "accent": GOLD, "tags": ["DARK MODE", "LUXURY", "GOLD ACCENT"]},
        {"name": "B06 - BROADSHEET EDITORIAL", "biz": "Law Firm & Consultancy",
         "desc": "Newspaper-style column layout, serif headlines. Trust, authority, tradition.",
         "accent": HexColor("#a31f1f"), "tags": ["EDITORIAL", "COLUMNS", "TRUST"]},
        {"name": "V45 - BENTO BOX", "biz": "Tech Startup & SaaS",
         "desc": "Asymmetric grid cards, modern dashboard aesthetic. Clean, information-rich, contemporary.",
         "accent": HexColor("#7c3aed"), "tags": ["BENTO GRID", "MODERN", "DASHBOARD"]},
        {"name": "B05 - BAUHAUS BRUTALIST", "biz": "Architecture & Design Studio",
         "desc": "Primary colors, geometric shapes, bold grid. Art-school meets functional design.",
         "accent": HexColor("#f2c200"), "tags": ["BAUHAUS", "GEOMETRIC", "PRIMARY COLOR"]},
    ]

    col_w = (W - 44*mm - 6*mm) / 2
    start_y = y - 16*mm
    row_h = 52*mm

    for idx, con in enumerate(concepts):
        col = idx % 2
        row = idx // 2
        bx = 22*mm + col * (col_w + 6*mm)
        by = start_y - row * (row_h + 4*mm) - row_h

        # Card background
        c.setFillColor(WHITE)
        c.setStrokeColor(BLACK)
        c.setLineWidth(0.8)
        c.roundRect(bx, by, col_w, row_h, 2*mm, fill=1, stroke=1)

        # Browser wireframe mockup
        mock_x = bx + 3*mm
        mock_y = by + 18*mm
        mock_w = col_w - 6*mm
        mock_h = row_h - 22*mm

        body = wireframe_browser(c, mock_x, mock_y, mock_w, mock_h,
                                  accent=con["accent"], title=con["name"])

        # Inside the browser: nav + hero + cards
        bx2, by2, bw2, bh2 = body
        wireframe_navbar(c, bx2 + 1*mm, by2 + bh2 - 6*mm, bw2 - 2*mm, accent=con["accent"])
        wireframe_hero(c, bx2 + 1*mm, by2 + bh2*0.3, bw2 - 2*mm, bh2*0.55, accent=con["accent"])
        wireframe_cards(c, bx2 + 1*mm, by2 + 1*mm, bw2 - 2*mm, count=3, accent=con["accent"])

        # Caption below wireframe
        cap_y = by + 14*mm
        # Tags
        tag_x = bx + 3*mm
        for t in con["tags"]:
            tw = len(t) * 2.1*mm + 3*mm
            c.setFillColor(con["accent"])
            c.roundRect(tag_x, cap_y + 5*mm, tw, 3.5*mm, 0.8*mm, fill=1, stroke=0)
            c.setFillColor(WHITE)
            c.setFont("Helvetica-Bold", 4.5)
            c.drawString(tag_x + 1.5*mm, cap_y + 6*mm, t)
            tag_x += tw + 1.5*mm

        # Concept name
        c.setFillColor(BLACK)
        c.setFont("Helvetica-Bold", 7)
        c.drawString(bx + 3*mm, cap_y, con["biz"])

        # Description
        c.setFillColor(MID_GREY)
        c.setFont("Helvetica", 5.5)
        desc = con["desc"]
        # simple word wrap
        words = desc.split()
        line = ""
        line_y = cap_y - 4.5*mm
        max_w = col_w - 6*mm
        for word in words:
            test = line + " " + word if line else word
            if c.stringWidth(test, "Helvetica", 5.5) < max_w:
                line = test
            else:
                c.drawString(bx + 3*mm, line_y, line)
                line_y -= 4*mm
                line = word
        if line:
            c.drawString(bx + 3*mm, line_y, line)

    # Page number
    c.setFillColor(GREY)
    c.setFont("Helvetica", 6)
    c.drawCentredString(W/2, 10*mm, "OSTRELYA WEB STUDIO  ·  PORTFOLIO  ·  PAGE 2")


# ── Page 3: Services & Contact ────────────────────────────────
def page_services(c):
    c.setFillColor(OFF_WHITE)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    draw_brutalist_border(c, margin=16*mm)
    registration_marks(c, margin=13*mm)

    y = H - 30*mm

    # ── SERVICES ──
    c.setFillColor(BLACK)
    c.setFont("Helvetica-Bold", 22)
    c.drawString(22*mm, y, "WHAT WE DO")
    c.setFillColor(RED)
    c.setFont("Helvetica-Bold", 7)
    c.drawString(22*mm, y - 7*mm, "01")
    c.setFillColor(MID_GREY)
    c.setFont("Helvetica", 7.5)
    c.drawString(32*mm, y - 7*mm, "THREE THINGS, ONE STUDIO")

    section_divider(c, y - 11*mm)

    # Service cards
    services = [
        {"idx": "A/01", "label": "BUILD", "title": "Your Website",
         "items": ["5-8 page custom site", "Mobile-first, fast, secure", "Two rounds of revisions", "Live in ~10 days"]},
        {"idx": "A/02", "label": "KEEP", "title": "Care & Hosting",
         "items": ["Hosting + domain + SSL", "Software & security updates", "Small edits on request", "Monthly retainer"]},
        {"idx": "A/03", "label": "GROW", "title": "Being Found",
         "items": ["Basic on-page SEO", "Google Business Profile", "Copy & photo add-ons", "Analytics setup"]},
    ]

    card_w = (W - 44*mm - 8*mm) / 3
    card_y = y - 22*mm
    card_h = 58*mm

    for i, svc in enumerate(services):
        sx = 22*mm + i * (card_w + 4*mm)
        sy = card_y - card_h

        # Card
        c.setFillColor(WHITE)
        c.setStrokeColor(BLACK)
        c.setLineWidth(1)
        c.rect(sx, sy, card_w, card_h, fill=1, stroke=1)

        # Accent bar top
        c.setFillColor(RED)
        c.rect(sx, sy + card_h - 3*mm, card_w, 3*mm, fill=1, stroke=0)

        # Index
        c.setFillColor(RED)
        c.setFont("Helvetica-Bold", 6)
        c.drawString(sx + 3*mm, sy + card_h - 9*mm, svc["idx"])

        # Label
        c.setFillColor(BLACK)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(sx + 3*mm, sy + card_h - 18*mm, svc["label"])

        # Title
        c.setFillColor(MID_GREY)
        c.setFont("Helvetica", 8)
        c.drawString(sx + 3*mm, sy + card_h - 25*mm, svc["title"])

        # Divider
        c.setStrokeColor(LIGHT_GREY)
        c.setLineWidth(0.4)
        c.line(sx + 3*mm, sy + card_h - 28*mm, sx + card_w - 3*mm, sy + card_h - 28*mm)

        # Items
        c.setFillColor(BLACK)
        c.setFont("Helvetica", 6.5)
        for j, item in enumerate(svc["items"]):
            iy = sy + card_h - 35*mm - j * 5.5*mm
            c.setFillColor(RED)
            c.setFont("Helvetica-Bold", 7)
            c.drawString(sx + 3*mm, iy, "+")
            c.setFillColor(BLACK)
            c.setFont("Helvetica", 6.5)
            c.drawString(sx + 8*mm, iy, item)

    # ── PROCESS ──
    proc_y = card_y - card_h - 14*mm
    section_divider(c, proc_y, "METHOD")

    proc_y -= 10*mm
    c.setFillColor(BLACK)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(22*mm, proc_y, "HOW IT WORKS")

    steps = [
        ("DAY 0-1", "KICKOFF", "Meet, gather text & photos,\nagree on 5-8 pages"),
        ("DAY 2-5", "BUILD", "Design & develop your\nmobile-first site"),
        ("DAY 6-8", "REVIEW", "Client review + two\nrounds of revisions"),
        ("DAY 9-10", "LAUNCH", "Domain, SSL, Google\nBusiness, Analytics"),
    ]

    step_w = (W - 44*mm - 18*mm) / 4
    step_y = proc_y - 8*mm

    for i, (day, label, desc) in enumerate(steps):
        sx = 22*mm + i * (step_w + 6*mm)

        # Step number circle
        c.setFillColor(BLACK)
        c.circle(sx + 5*mm, step_y - 5*mm, 5*mm, fill=1, stroke=0)
        c.setFillColor(OFF_WHITE)
        c.setFont("Helvetica-Bold", 9)
        c.drawCentredString(sx + 5*mm, step_y - 7*mm, str(i + 1))

        # Arrow (except last)
        if i < 3:
            c.setStrokeColor(LIGHT_GREY)
            c.setLineWidth(0.6)
            c.line(sx + 11*mm, step_y - 5*mm, sx + step_w - 2*mm, step_y - 5*mm)

        # Day label
        c.setFillColor(RED)
        c.setFont("Helvetica-Bold", 6)
        c.drawString(sx, step_y - 16*mm, day)

        # Label
        c.setFillColor(BLACK)
        c.setFont("Helvetica-Bold", 8)
        c.drawString(sx, step_y - 22*mm, label)

        # Description
        c.setFillColor(MID_GREY)
        c.setFont("Helvetica", 6)
        for li, line in enumerate(desc.split("\n")):
            c.drawString(sx, step_y - 28*mm - li * 4*mm, line)

    # ── RATES ──
    rates_y = step_y - 42*mm
    section_divider(c, rates_y, "RATES")

    rates_y -= 10*mm
    c.setFillColor(BLACK)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(22*mm, rates_y, "PRICING")

    # Pricing table
    markets = [
        ("CROATIA", "EUR", "400 - 800", "30 - 45/mo"),
        ("BOSNIA", "BAM", "800 - 1,500", "50 - 90/mo"),
        ("SERBIA", "RSD", "30k - 55k", "3k - 5k/mo"),
        ("US / CA / EU", "USD", "900 - 1,500", "40 - 75/mo"),
    ]

    table_y = rates_y - 10*mm
    col_widths = [30*mm, 18*mm, 35*mm, 35*mm]
    col_x = [22*mm]
    for w in col_widths[:-1]:
        col_x.append(col_x[-1] + w)

    # Header row
    c.setFillColor(BLACK)
    c.rect(22*mm, table_y, sum(col_widths), 6*mm, fill=1, stroke=0)
    c.setFillColor(OFF_WHITE)
    c.setFont("Helvetica-Bold", 6.5)
    headers = ["MARKET", "CURRENCY", "BUILD FEE", "MONTHLY RETAINER"]
    for i, h in enumerate(headers):
        c.drawString(col_x[i] + 2*mm, table_y + 1.8*mm, h)

    # Data rows
    for r, (market, cur, build, retainer) in enumerate(markets):
        ry = table_y - (r + 1) * 7*mm
        bg = OFF_WHITE if r % 2 == 0 else WHITE
        c.setFillColor(bg)
        c.rect(22*mm, ry, sum(col_widths), 7*mm, fill=1, stroke=0)
        c.setStrokeColor(LIGHT_GREY)
        c.setLineWidth(0.3)
        c.line(22*mm, ry, 22*mm + sum(col_widths), ry)

        c.setFillColor(BLACK)
        c.setFont("Helvetica-Bold", 7)
        c.drawString(col_x[0] + 2*mm, ry + 2*mm, market)
        c.setFont("Helvetica", 7)
        c.drawString(col_x[1] + 2*mm, ry + 2*mm, cur)
        c.drawString(col_x[2] + 2*mm, ry + 2*mm, build)
        c.drawString(col_x[3] + 2*mm, ry + 2*mm, retainer)

    # Table border
    c.setStrokeColor(BLACK)
    c.setLineWidth(0.8)
    c.rect(22*mm, table_y - 4 * 7*mm, sum(col_widths), 5 * 7*mm, fill=0, stroke=1)

    # ── CONTACT ──
    contact_y = table_y - 4*7*mm - 14*mm
    section_divider(c, contact_y, "CONTACT")

    contact_y -= 12*mm
    c.setFillColor(BLACK)
    c.setFont("Helvetica-Bold", 18)
    c.drawString(22*mm, contact_y, "LET'S BUILD YOUR SITE")

    c.setFillColor(MID_GREY)
    c.setFont("Helvetica", 8)
    c.drawString(22*mm, contact_y - 8*mm, "Response within 24 hours. No templates. No lock-in. Fully owned by you.")

    # Contact details
    details_y = contact_y - 20*mm
    c.setFillColor(BLACK)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(22*mm, details_y, "hello@ostrelya.com")
    c.setFillColor(MID_GREY)
    c.setFont("Helvetica", 8)
    c.drawString(22*mm, details_y - 6*mm, "ostrelya.com")
    c.drawString(22*mm, details_y - 12*mm, "HR  ·  BA  ·  RS  ·  EU  ·  CA  ·  US")

    # CTA box
    cta_y = details_y - 24*mm
    c.setFillColor(BLACK)
    c.roundRect(22*mm, cta_y, 60*mm, 10*mm, 2*mm, fill=1, stroke=0)
    c.setFillColor(OFF_WHITE)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(26*mm, cta_y + 3*mm, "START A PROJECT  >>")

    # Bottom brand
    c.setFillColor(GREY)
    c.setFont("Helvetica", 6)
    c.drawCentredString(W/2, 10*mm, "OSTRELYA WEB STUDIO  ·  PORTFOLIO  ·  PAGE 3")


# ── Build PDF ─────────────────────────────────────────────────
def main():
    c = canvas.Canvas(OUT, pagesize=A4)
    c.setTitle("OSTRELYA Web Studio - Portfolio")
    c.setAuthor("OSTRELYA Web Studio")
    c.setSubject("Portfolio of web design and development work")

    page_cover(c)
    c.showPage()

    page_portfolio(c)
    c.showPage()

    page_services(c)
    c.showPage()

    c.save()
    print(f"PDF saved: {OUT}")
    print(f"Size: {os.path.getsize(OUT) / 1024:.1f} KB")

if __name__ == "__main__":
    main()
