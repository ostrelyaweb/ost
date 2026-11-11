import { loadStudioImage, setStudioSession, studioFetch } from './session.js';

const form = document.getElementById('edit-form');
const status = document.getElementById('editor-status');
const publish = document.getElementById('publish');
const articleIndex = document.getElementById('article-index');
const title = document.getElementById('editor-title');
const openPage = document.getElementById('open-page');
const tabs = [...document.querySelectorAll('[data-document]')];
const saveDraft = document.getElementById('save-draft');
const draftPreview = document.getElementById('draft-preview');
const historyPanel = document.getElementById('editor-history');
const auth = document.getElementById('editor-auth');
const authForm = document.getElementById('auth-form');
const authNote = document.getElementById('auth-note');
const layout = document.getElementById('editor-layout');
const logout = document.getElementById('logout');
const account = document.getElementById('editor-account');
const accountName = document.getElementById('editor-account-name');
const accountInitial = document.getElementById('editor-account-initial');
const boot = document.getElementById('editor-boot');
const bootFill = document.getElementById('editor-boot-fill');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const pages = new Map();
let current = 'about';
let articleIndexSelected = -1;

function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}

function action(label, className, callback) {
  const button = node('button', className, label);
  button.type = 'button';
  button.addEventListener('click', callback);
  return button;
}

function showStatus(message, error = false, busy = false) {
  status.textContent = message;
  status.toggleAttribute('data-error', error);
  status.toggleAttribute('data-busy', busy);
}

async function request(path, options) {
  const signal = options?.method ? undefined : AbortSignal.timeout(12000);
  const response = await studioFetch(path, { signal, ...options });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Radnja nije uspjela.');
  return result;
}

function activeKey(state) {
  return state.content.articles?.[articleIndexSelected]?._key || 'page';
}

function activeValue(state, key) {
  if (key !== 'page') return state.content.articles.find((item) => item._key === key);
  if (!state.content.articles) return state.content;
  const { title, intro } = state.content;
  return { title, intro };
}

function refreshPublish() {
  const state = pages.get(current);
  const key = state ? activeKey(state) : 'page';
  const busy = !state || state.saving || state.uploads > 0;
  const dirty = state?.dirty.has(key);
  const saved = state?.saved.includes(key);
  saveDraft.disabled = busy || !dirty;
  publish.disabled = busy || (!dirty && !saved);
  publish.textContent = key === 'page' ? 'Objavi stranicu' : 'Objavi članak';
  draftPreview.hidden = !saved;
  if (saved) {
    const url = new URL('/' + current + '/', location.origin);
    url.searchParams.set('studio-preview', key);
    if (key !== 'page') url.searchParams.set('article', 'studio-draft');
    draftPreview.href = url.href;
  }
}

function markDirty(state, key = activeKey(state)) {
  state.dirty.add(key);
  if (pages.get(current) === state && activeKey(state) === key) {
    showStatus('Imaš nespremljene izmjene.');
    refreshPublish();
  }
}

function renderHistory(state, key) {
  const container = document.getElementById('editor-history');
  container.replaceChildren();
  const entries = Object.entries(state.history).filter(([scope]) =>
    scope === key || (current === 'journal' && key === 'page' && !activeValue(state, scope)));
  if (!entries.length && !state.saved.includes(key)) return;
  const { section, heading } = panel('Nacrt i povijest');
  if (state.saved.includes(key)) {
    heading.append(action('Odbaci spremljeni nacrt', 'editor-add', () => {
      if (confirm('Odbaciti nacrt ove stavke?')) mutate('draft', key, { content: null });
    }));
  }
  for (const [scope, versions] of entries) {
    const group = node('details');
    const label = scope === key ? 'Prethodne objavljene verzije' : 'Uklonjeni članak · ' + scope.slice(5);
    group.append(node('summary', '', label));
    for (const version of versions) {
      const row = node('div', 'editor-actions');
      const date = new Intl.DateTimeFormat('hr-HR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(version.date));
      row.append(node('span', '', date + ' · ' + version.title),
        action('Vrati verziju', '', () => {
          mutate('restore', scope, { version: version.id });
        }));
      group.append(row);
    }
    section.append(group);
  }
  container.append(section);
}

function field(state, entry, key, label, options = {}) {
  const wrapper = node('label', 'editor-field', label);
  const input = node(options.rows ? 'textarea' : 'input');
  if (options.rows) input.rows = options.rows;
  else input.type = options.type || 'text';
  input.value = entry[key] || '';
  input.maxLength = options.max || 180;
  input.required = Boolean(options.required);
  input.readOnly = Boolean(options.readOnly);
  if (options.pattern) input.pattern = options.pattern;
  input.addEventListener('input', () => {
    entry[key] = input.value;
    markDirty(state);
    if (options.onInput) options.onInput();
  });
  wrapper.append(input);
  return wrapper;
}

function imageEditor(state, entry, label = 'Slika') {
  const panel = node('div', 'editor-image');
  const preview = node('img');
  preview.alt = '';
  const controls = node('div', 'editor-image-controls');
  const actions = node('div', 'editor-actions');
  const picker = node('label', 'editor-file-button', 'Učitaj sliku');
  const input = node('input');
  input.type = 'file';
  input.accept = 'image/png,image/jpeg,image/webp';
  input.setAttribute('aria-label', 'Učitaj ' + label.toLowerCase());
  picker.append(input);
  const remove = action('Makni sliku', '', () => {
    entry.image = '';
    entry.alt = '';
    render();
    markDirty(state);
  });

  function updateImage() {
    preview.hidden = !entry.image;
    remove.hidden = !entry.image;
    if (entry.image) {
      const asset = entry.image.replace(/^\//, '');
      if (/^assets\/uploads\/studio-[a-f0-9]{32}\.(?:jpg|png|webp)$/.test(asset)) {
        loadStudioImage(preview, asset.split('/').at(-1));
      } else {
        preview.src = new URL('/' + asset, location.origin).href;
      }
    }
    else preview.removeAttribute('src');
  }

  input.addEventListener('change', async () => {
    const file = input.files[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      showStatus('Slika smije imati najviše 8 MB.', true);
      input.value = '';
      return;
    }
    const key = activeKey(state);
    state.uploads++;
    refreshPublish();
    input.disabled = true;
    remove.disabled = true;
    showStatus('Učitavam sliku…', false, true);
    try {
      const result = await request('image', { method: 'POST', headers: { 'Content-Type': file.type }, body: file });
      entry.image = result.path;
      updateImage();
      if (!preview.isConnected && pages.get(current) === state && activeKey(state) === key) render();
      markDirty(state, key);
    } catch (error) {
      if (pages.get(current) === state) showStatus(error.message, true);
    } finally {
      input.disabled = false;
      remove.disabled = false;
      input.value = '';
      state.uploads--;
      refreshPublish();
    }
  });

  actions.append(picker, remove);
  controls.append(actions, field(state, entry, 'alt', 'Opis slike', { max: 250 }));
  panel.append(preview, controls);
  updateImage();
  return panel;
}

function panel(label) {
  const section = node('section', 'editor-panel');
  const heading = node('div', 'editor-panel-heading');
  heading.append(node('h2', '', label));
  section.append(heading);
  return { section, heading };
}

function sectionsEditor(state, sections, about) {
  const { section, heading } = panel('Sekcije');
  heading.append(action('Dodaj sekciju', 'editor-add', () => {
    sections.push({ title: '', text: '' });
    markDirty(state);
    render();
    form.querySelector('.editor-block:last-child input')?.focus();
  }));
  sections.forEach((entry, position) => {
    const block = node('div', 'editor-block');
    const line = node('div', 'editor-panel-heading');
    const controls = node('div', 'editor-actions');

    function move(by) {
      const next = position + by;
      [sections[position], sections[next]] = [sections[next], sections[position]];
      markDirty(state);
      render();
    }

    const up = action('↑ Pomakni gore', '', () => move(-1));
    up.disabled = position === 0;
    const down = action('↓ Pomakni dolje', '', () => move(1));
    down.disabled = position === sections.length - 1;
    controls.append(up, down, action('Ukloni sekciju', 'editor-delete', () => {
      sections.splice(position, 1);
      markDirty(state);
      render();
    }));
    line.append(node('h3', '', 'Sekcija ' + (position + 1)), controls);
    block.append(line);
    if (about) block.append(field(state, entry, 'eyebrow', 'Oznaka sekcije', { max: 120 }));
    block.append(field(state, entry, 'title', 'Naslov sekcije', { required: about }),
      field(state, entry, 'text', 'Tekst sekcije', { rows: 4, max: 20000, required: true }),
      imageEditor(state, entry, 'sliku sekcije'));
    section.append(block);
  });
  if (!sections.length) section.append(node('p', 'editor-status', 'Dodaj prvu sekciju.'));
  return section;
}

function localDate() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return date.getFullYear() + '-' + month + '-' + day;
}

function showArticleList(state) {
  articleIndex.replaceChildren(node('p', 'editor-label', 'Članci'));
  state.content.articles.forEach((entry, position) => {
    const button = action((entry.title || 'Novi članak') + (state.saved.includes(entry._key) ? ' · Nacrt' : ''), '', () => {
      articleIndexSelected = position;
      render();
    });
    if (position === articleIndexSelected) button.setAttribute('aria-current', 'true');
    articleIndex.append(button);
  });
  articleIndex.append(action('+ Novi članak', '', () => {
    state.content.articles.push({ _key: 'new:' + crypto.randomUUID(), title: '', slug: '', date: localDate(), summary: '', sections: [{ title: '', text: '' }] });
    articleIndexSelected = state.content.articles.length - 1;
    markDirty(state);
    render();
    form.querySelector('input')?.focus();
  }));
}

function render() {
  const state = pages.get(current);
  const about = current === 'about';
  articleIndex.hidden = about || !state;
  tabs.forEach((tab) => {
    if (tab.dataset.document === current) tab.setAttribute('aria-current', 'page');
    else tab.removeAttribute('aria-current');
  });
  form.replaceChildren();
  title.textContent = about ? 'About' : 'Journal';
  openPage.href = '/' + current + '/';
  refreshPublish();
  if (!state) return;
  const data = state.content;
  renderHistory(state, activeKey(state));
  if (!about) showArticleList(state);
  const article = !about && data.articles[articleIndexSelected];
  if (article) {
    const { section, heading } = panel('Uredi članak');
    heading.append(action('Natrag na postavke Journala', 'editor-add', () => {
      articleIndexSelected = -1;
      render();
    }));
    const updateArticleTitle = () => showArticleList(state);
    section.append(
      field(state, article, 'title', 'Naslov članka', { required: true, onInput: updateArticleTitle }),
      field(state, article, 'slug', 'URL oznaka članka', { required: true, max: 100, readOnly: article._key.startsWith('post:'), pattern: '[a-z0-9]+(?:-[a-z0-9]+)*' }),
      field(state, article, 'date', 'Datum objave', { type: 'date', required: true }),
      field(state, article, 'category', 'Kategorija', { max: 100 }),
      field(state, article, 'summary', 'Sažetak', { rows: 3, max: 1000, required: true }),
      imageEditor(state, article, 'naslovnu sliku')
    );
    const actions = node('div', 'editor-actions');
    const key = article._key;
    const published = key.startsWith('post:');
    actions.append(action(published ? 'Ukloni s weba' : 'Ukloni nacrt', 'editor-delete', () => {
      if (published) {
        if (confirm('Ukloniti ovaj članak s lokalnog weba?')) mutate('publish', key, { content: null });
      } else if (state.saved.includes(key)) {
        if (confirm('Ukloniti spremljeni nacrt?')) mutate('draft', key, { content: null });
      } else {
        data.articles.splice(articleIndexSelected, 1);
        state.dirty.delete(key);
        articleIndexSelected = -1;
        render();
      }
    }));
    section.append(actions);
    form.append(section, sectionsEditor(state, article.sections, false));
    return;
  }

  const { section } = panel('Postavke stranice');
  if (about) section.append(field(state, data, 'eyebrow', 'Oznaka stranice', { required: true, max: 120 }));
  section.append(field(state, data, 'title', 'Naslov stranice', { required: true }),
    field(state, data, 'intro', 'Uvod', { rows: 4, max: 2000, required: true }));
  if (about) section.append(imageEditor(state, data, 'naslovnu sliku'));
  form.append(section);
  if (about) form.append(sectionsEditor(state, data.sections, true));
}

async function selectPage(page) {
  const changed = current !== page;
  current = page;
  render();
  try {
    if (!pages.has(page)) {
      showStatus('Učitavam sadržaj…', false, true);
      const result = await request(page);
      if (!pages.has(page)) pages.set(page, { ...result, dirty: new Set(), saving: false, uploads: 0 });
    }
    if (current === page) {
      render();
      showStatus(pages.get(page).dirty.size ? 'Imaš nespremljene izmjene.' : 'Spremljeni nacrti označeni su u editoru.');
      if (changed && !reducedMotion.matches) {
        form.animate([{ opacity: .65, transform: 'translateY(5px)' }, { opacity: 1, transform: 'none' }],
          { duration: 200, easing: 'ease-out' });
      }
    }
  } catch (error) {
    if (current === page) showStatus(error.message, true);
  }
}

tabs.forEach((tab) => tab.addEventListener('click', () => selectPage(tab.dataset.document)));

function applySnapshot(state, result, changedKey) {
  state.dirty.delete(changedKey);
  const pending = [...state.dirty].map((key) => ({
    key, value: activeValue(state, key), revision: state.revisions[key]
  }));
  Object.assign(state, result);
  for (const { key, value, revision } of pending) {
    state.revisions[key] = revision;
    if (key === 'page') Object.assign(state.content, value);
    else {
      const position = state.content.articles.findIndex((article) => article._key === key);
      if (position < 0) state.content.articles.push(value);
      else state.content.articles[position] = value;
    }
  }
}

async function mutate(operation, key, body) {
  const state = pages.get(current);
  if (!state || state.saving || state.uploads) return;
  const page = current;
  const selected = activeKey(state);
  state.saving = true;
  form.inert = articleIndex.inert = historyPanel.inert = true;
  tabs.forEach((tab) => { tab.disabled = true; });
  logout.disabled = true;
  refreshPublish();
  showStatus(operation === 'publish' ? 'Objavljujem…'
    : operation === 'restore' ? 'Vraćam verziju…'
    : body.content === null ? 'Odbacujem nacrt…' : 'Spremam nacrt…', false, true);
  try {
    const result = await request(page + '/' + operation, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, key, revision: state.revisions[key] || null })
    });
    applySnapshot(state, result, key);
    const next = selected === key ? result.publishedKey || key : selected;
    articleIndexSelected = state.content.articles?.findIndex((item) => item._key === next) ?? -1;
    render();
    showStatus(operation === 'restore' ? 'Verzija vraćena na lokalni web.'
      : operation === 'publish' ? 'Objavljeno na lokalnom webu.'
      : body.content === null ? 'Nacrt odbačen.' : 'Nacrt spremljen.');
  } catch (error) {
    showStatus(error.message, true);
  } finally {
    state.saving = false;
    form.inert = articleIndex.inert = historyPanel.inert = false;
    tabs.forEach((tab) => { tab.disabled = false; });
    logout.disabled = false;
    refreshPublish();
  }
}

saveDraft.addEventListener('click', () => {
  const state = pages.get(current);
  const key = activeKey(state);
  mutate('draft', key, { content: activeValue(state, key) });
});
form.addEventListener('submit', (event) => {
  event.preventDefault();
  const state = pages.get(current);
  const key = activeKey(state);
  mutate('publish', key, { content: activeValue(state, key) });
});

function hasChanges() {
  return [...pages.values()].some((page) => page.dirty.size);
}

window.addEventListener('beforeunload', (event) => {
  if (hasChanges()) {
    event.preventDefault();
    event.returnValue = '';
  }
});

function authMode(session) {
  const username = session.user || '';
  const signedIn = Boolean(username);
  if (session.token || !signedIn) setStudioSession(session.token);
  auth.hidden = signedIn;
  layout.hidden = !signedIn;
  accountName.textContent = username;
  accountName.title = username;
  accountInitial.textContent = Array.from(username)[0]?.toLocaleUpperCase('hr') || '';
  account.hidden = !signedIn;
  if (signedIn) {
    authForm.reset();
    return selectPage('about');
  }
  authForm.hidden = !session.provisioned;
  authNote.textContent = session.provisioned
    ? 'Prijavi se svojim uredničkim računom.'
    : 'Urednički pristup još nije postavljen. Račun može otvoriti vlasnik projekta.';
}

authForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const values = new FormData(authForm);
  const submit = document.getElementById('auth-submit');
  submit.disabled = true;
  authNote.textContent = 'Prijavljujem…';
  authNote.toggleAttribute('data-busy', true);
  try {
    const session = await request('login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(values))
    });
    authMode(session);
  } catch (error) {
    authNote.textContent = error.message;
  } finally {
    submit.disabled = false;
    authNote.removeAttribute('data-busy');
  }
});
logout.addEventListener('click', async () => {
  if (hasChanges() && !confirm('Odjaviti se i odbaciti nespremljene izmjene?')) return;
  try {
    const session = await request('logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    pages.clear();
    articleIndexSelected = -1;
    form.replaceChildren();
    articleIndex.replaceChildren();
    historyPanel.replaceChildren();
    authMode(session);
  } catch (error) {
    showStatus(error.message, true);
  }
});
async function startEditor() {
  boot.hidden = false;
  const fill = Promise.allSettled(bootFill.getAnimations().map((animation) => animation.finished));
  try {
    await authMode(await request('session'));
  } catch {
    authNote.textContent = 'Editor nije dostupan. Osvježi stranicu ili provjeri radi li lokalni server.';
    authNote.toggleAttribute('data-error', true);
  } finally {
    await fill;
    boot.toggleAttribute('data-ready', true);
    await Promise.allSettled(boot.getAnimations().map((animation) => animation.finished));
    boot.hidden = true;
  }
}

startEditor();
