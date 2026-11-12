"""Check the HTML and alternate links represented in the production sitemap."""

from html.parser import HTMLParser
from urllib.parse import quote, unquote, urlsplit
from xml.etree import ElementTree


class SearchPage(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.canonicals = []
        self.alternates = {}
        self.duplicate_alternates = set()
        self.descriptions = []
        self.titles = []
        self.heading_count = 0
        self.noindex = False
        self.in_title = False
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if tag == "link" and values.get("rel") == "canonical":
            self.canonicals.append(values.get("href", ""))
        elif tag == "link" and values.get("rel") == "alternate" and "hreflang" in values:
            language = values["hreflang"]
            if language in self.alternates:
                self.duplicate_alternates.add(language)
            self.alternates[language] = values.get("href", "")
        elif tag == "meta":
            name = values.get("name", "").lower()
            content = values.get("content", "")
            if name == "description":
                self.descriptions.append(content)
            elif name in {"robots", "googlebot", "bingbot"}:
                self.noindex |= "noindex" in content.lower()
        elif tag == "h1":
            self.heading_count += 1
        elif tag == "title":
            self.titles.append("")
            self.in_title = True

    def handle_data(self, data):
        if self.in_title:
            self.titles[-1] += data

    def handle_endtag(self, tag):
        if tag == "title":
            self.in_title = False


def page_url(url):
    parts = urlsplit(url)
    return parts._replace(path=quote(unquote(parts.path), safe="/")).geturl()


def check_indexable(output, origin):
    urls = [page_url(item.text) for item in ElementTree.parse(output / "sitemap.xml").findall(".//{*}loc")]
    pages = {}
    errors = []
    titles = {}
    for url in urls:
        if url in pages:
            errors.append(f"{url}: duplicate sitemap entry")
            continue
        if not url.startswith(origin + "/") or urlsplit(url).query or urlsplit(url).fragment:
            errors.append(f"{url}: expected a clean URL on {origin}")
            continue
        path = unquote(urlsplit(url).path).lstrip("/")
        target = output / (path + "index.html" if url.endswith("/") else path + ".html")
        if not target.is_file():
            errors.append(f"{url}: missing HTML file")
            continue
        page = SearchPage(target.read_text(encoding="utf-8"))
        pages[url] = page
        if [page_url(value) for value in page.canonicals] != [url]:
            errors.append(f"{url}: canonical must point to itself")
        if page.noindex or page.heading_count != 1:
            errors.append(f"{url}: expected indexable HTML with one H1")
        for label, values in (("title", page.titles), ("description", page.descriptions)):
            if len(values) != 1 or not values[0].strip():
                errors.append(f"{url}: missing or repeated {label}")
        if page.titles and page.titles[0].strip():
            title = page.titles[0].strip()
            if title in titles:
                errors.append(f"{url}: title also used by {titles[title]}")
            titles[title] = url

    for url, page in pages.items():
        alternates = {language: page_url(link) for language, link in page.alternates.items()}
        if not alternates:
            continue
        if page.duplicate_alternates or url not in alternates.values():
            errors.append(f"{url}: expected unique hreflang entries including this page")
        for alternate in set(alternates.values()):
            other = pages.get(alternate)
            if not other or {key: page_url(link) for key, link in other.alternates.items()} != alternates:
                errors.append(f"{url}: hreflang cluster disagrees with {alternate}")

    if not urls or errors:
        raise ValueError("Invalid production sitemap:\n" + "\n".join(errors or ["sitemap is empty"]))
    return len(pages)
