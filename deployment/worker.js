import site from '../redesign/tools/locale_worker.js';

const origin = 'https://ostrelya.com';

export class IndexNowPublisher {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
  }

  async fetch() {
    return this.ctx.blockConcurrencyWhile(async () => {
      const asset = await this.env.ASSETS.fetch(new Request(origin + '/indexnow-pages.json'));
      if (!asset.ok) throw new Error('IndexNow release manifest unavailable');
      const { key, pages } = await asset.json();
      if (!/^[A-Za-z0-9-]{8,128}$/.test(key) || !Object.keys(pages).length ||
          Object.entries(pages).some(([url, hash]) => !url.startsWith(origin + '/') || !/^[a-f0-9]{64}$/.test(hash))) {
        throw new Error('Invalid IndexNow release manifest');
      }
      const previous = await this.ctx.storage.get('pages');
      if (!previous) {
        await this.ctx.storage.put('pages', pages);
        console.log('IndexNow initialized', Object.keys(pages).length);
        return new Response(null, { status: 204 });
      }
      const urls = [...new Set([...Object.keys(previous), ...Object.keys(pages)])]
        .filter(url => previous[url] !== pages[url]);
      if (urls.length) {
        const result = await fetch('https://api.indexnow.org/IndexNow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ host: 'ostrelya.com', key, keyLocation: origin + '/' + key + '.txt', urlList: urls }),
          signal: AbortSignal.timeout(12000)
        });
        if (![200, 202].includes(result.status)) throw new Error('IndexNow HTTP ' + result.status);
        await this.ctx.storage.put('pages', pages);
        console.log('IndexNow accepted', result.status, urls.length);
      }
      return new Response(null, { status: 204 });
    });
  }
}

export default {
  fetch: site.fetch,
  async scheduled(_event, env) {
    const response = await env.INDEXNOW.get(env.INDEXNOW.idFromName('ostrelya.com')).fetch('https://internal/sync');
    if (!response.ok) throw new Error('IndexNow synchronization failed');
  }
};
