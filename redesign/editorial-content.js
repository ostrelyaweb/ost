import { loadStudioImage, studioFetch } from '/studio-editor/session.js';

const contentPage = document.querySelector('[data-content-page]');
const title = document.getElementById('content-title');
const intro = document.getElementById('content-intro');
const status = document.getElementById('content-status');
const previewKey = new URLSearchParams(location.search).get('studio-preview');

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function addText(parent, className, text) {
  for (const paragraph of (text || '').trim().split(/\r?\n\s*\r?\n/)) {
    if (paragraph.trim()) parent.append(element('p', className, paragraph.trim()));
  }
}

function applyImage(image, src, alt) {
  if (typeof src !== 'string' || !/^\/?assets\//.test(src)) return false;
  const assets = new URL('/assets/', location.origin);
  const url = new URL('/' + src.replace(/^\//, ''), location.origin);
  if (url.origin !== assets.origin || !url.pathname.startsWith(assets.pathname)) return false;
  const staged = /^\/?assets\/uploads\/(studio-[a-f0-9]{32}\.(?:jpg|png|webp))$/.exec(src);
  if (previewKey && staged) loadStudioImage(image, staged[1]);
  else image.src = url.href;
  image.alt = alt || '';
  image.hidden = false;
  return true;
}

function addImage(parent, src, alt) {
  const image = element('img', 'content-image');
  image.loading = 'lazy';
  image.decoding = 'async';
  if (applyImage(image, src, alt)) parent.append(image);
}

function renderAbout(data) {
  document.getElementById('content-eyebrow').textContent = data.eyebrow;
  title.textContent = data.title;
  intro.textContent = data.intro;
  applyImage(document.getElementById('about-cover'), data.image, data.alt);
  const sections = document.getElementById('about-sections');
  for (const section of data.sections || []) {
    const row = element('section', 'about-section');
    const heading = element('div', 'about-section-heading');
    if (section.eyebrow) heading.append(element('p', 'services-kicker', section.eyebrow));
    heading.append(element('h2', 'editorial-heading', section.title));
    const body = element('div', 'about-section-body');
    addText(body, '', section.text);
    addImage(body, section.image, section.alt);
    row.append(heading, body);
    sections.append(row);
  }
}

function dateLabel(value) {
  const date = new Date(value + 'T00:00:00Z');
  if (Number.isNaN(date.valueOf())) return value;
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeZone: 'UTC' }).format(date);
}

function metadata(article) {
  const row = element('div', 'journal-meta');
  if (article.category) row.append(element('span', '', article.category));
  if (article.date) {
    const date = element('time', '', dateLabel(article.date));
    date.dateTime = article.date;
    row.append(date);
  }
  return row;
}

function renderJournal(data) {
  const articles = (data.articles || []).filter(({ slug }) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug));
  const requested = new URLSearchParams(location.search).get('article');
  const list = document.getElementById('journal-list');
  if (requested) {
    document.getElementById('journal-hero').hidden = true;
    const article = articles.find(({ slug }) => slug === requested);
    const page = document.getElementById('journal-article');
    const back = element('a', 'journal-back', '← All articles');
    back.href = '/journal/';
    page.append(back);
    page.hidden = false;
    if (!article) {
      page.append(element('h1', 'editorial-heading', 'Article unavailable.'));
      return;
    }

    document.title = article.title + ' — Ostrelya Journal';
    page.append(metadata(article), element('h1', 'editorial-heading', article.title), element('p', 'content-intro', article.summary));
    addImage(page, article.image, article.alt);
    for (const section of article.sections || []) {
      const block = element('section', 'journal-block');
      if (section.title) block.append(element('h2', '', section.title));
      addText(block, '', section.text);
      addImage(block, section.image, section.alt);
      page.append(block);
    }
    return;
  }

  title.textContent = data.title;
  intro.textContent = data.intro;
  articles.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  for (const article of articles) {
    const link = element('a', 'journal-card');
    link.href = '/journal/' + encodeURIComponent(article.slug) + '/';
    const copy = element('div', 'journal-card-copy');
    copy.append(metadata(article), element('h2', 'editorial-heading', article.title),
      element('p', '', article.summary), element('span', 'journal-read', 'Read article ↗'));
    link.append(copy);
    addImage(link, article.image, article.alt);
    list.append(link);
  }
  if (!articles.length) list.append(element('p', 'content-status', 'No articles yet.'));
}

const pageName = contentPage.dataset.contentPage;
const contentRequest = previewKey
  ? studioFetch(pageName + '/preview?key=' + encodeURIComponent(previewKey))
  : fetch('/content/' + pageName + '.json', { cache: 'no-cache' });
if (previewKey) {
  const robots = document.createElement('meta');
  robots.name = 'robots';
  robots.content = 'noindex';
  document.head.append(robots);
  const banner = element('p', 'studio-preview-banner', 'Preview of saved draft');
  contentPage.prepend(banner);
}
contentRequest
  .then((response) => {
    if (!response.ok) throw new Error('Content unavailable');
    return response.json();
  })
  .then((data) => {
    if (pageName === 'about') renderAbout(data);
    else renderJournal(data);
    status.hidden = true;
  })
  .catch(() => { status.textContent = previewKey ? 'Draft preview unavailable. Sign in to the editor and save a draft.' : 'The content could not load. Try refreshing the page.'; });
