"""Submit changed, published Ostrelya pages to IndexNow."""

import argparse
import json
from pathlib import Path
import re
from urllib.parse import urlsplit
from urllib.request import Request, urlopen
from xml.etree import ElementTree

from check_indexable import page_url


ORIGIN = "https://ostrelya.com"
ENDPOINT = "https://api.indexnow.org/IndexNow"
KEY_FILE = Path(__file__).with_name("indexnow-key.txt")
USER_AGENT = "OstrelyaReleaseCheck/1.0"


def read_key():
    key = KEY_FILE.read_text(encoding="ascii").strip()
    if not re.fullmatch(r"[A-Za-z0-9-]{8,128}", key):
        raise ValueError("Invalid IndexNow key format.")
    return key


def read_live(url):
    with urlopen(Request(url, headers={"User-Agent": USER_AGENT}), timeout=20) as response:
        if response.status != 200 or response.geturl() != url:
            raise ValueError(f"Expected a direct HTTP 200 from {urlsplit(url).path}.")
        return response.read()


def submit(paths):
    urls = list(dict.fromkeys(
        page_url(ORIGIN + path if path.startswith("/") else path) for path in paths
    ))
    if not 1 <= len(urls) <= 10000:
        raise ValueError("Provide between 1 and 10,000 distinct URLs.")
    sitemap = ElementTree.fromstring(read_live(ORIGIN + "/sitemap.xml"))
    published = {page_url(item.text) for item in sitemap.findall("{*}url/{*}loc")}
    invalid = [url for url in urls if not url.startswith(ORIGIN + "/") or url not in published]
    if invalid:
        raise ValueError("URLs outside the live Ostrelya sitemap: " + ", ".join(invalid))

    key = read_key()
    key_location = f"{ORIGIN}/{key}.txt"
    if read_live(key_location).decode("utf-8").strip() != key:
        raise ValueError("The IndexNow key file on production does not match.")
    payload = {
        "host": urlsplit(ORIGIN).hostname,
        "key": key,
        "keyLocation": key_location,
        "urlList": urls,
    }
    request = Request(
        ENDPOINT,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json; charset=utf-8", "User-Agent": USER_AGENT},
    )
    with urlopen(request, timeout=25) as response:
        if response.status not in (200, 202):
            raise ValueError(f"Unexpected IndexNow response: HTTP {response.status}.")
        status = "submitted" if response.status == 200 else "received, key validation pending"
        print(f"IndexNow HTTP {response.status}: {len(urls)} URLs {status}.")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("urls", nargs="+", help="Canonical paths or URLs already on the live sitemap.")
    args = parser.parse_args()
    try:
        submit(args.urls)
    except (OSError, ValueError, ElementTree.ParseError) as error:
        parser.exit(1, f"IndexNow error: {error}\n")


if __name__ == "__main__":
    main()
