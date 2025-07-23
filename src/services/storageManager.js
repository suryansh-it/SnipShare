const gistService = require('./gistService');
const indexedDBService = require('./indexedDBService');

class StorageManager {
  constructor() {
    this.primary = gistService;
    this.fallback = indexedDBService;
  }

  async init() {
    await this.fallback.init();
    const gists = await this.primary.listGists();
    for (const gist of gists) {
      await this.fallback.saveSnippet({ id: gist.id, description: gist.description, files: gist.files });
    }
  }

  async list() {
    return this.fallback.getAllSnippets();
  }

  async search(query) {
    const snippets = await this.list();
    return snippets.filter(s =>
      s.description.includes(query) ||
      Object.values(s.files).some(f => f.content.includes(query))
    );
  }

  async create({ description, files }) {
    const gist = await this.primary.createGist({ description, files, public: false });
    const snippet = { id: gist.id, description: gist.description, files: gist.files };
    await this.fallback.saveSnippet(snippet);
    return snippet;
  }

  async update(id, { description, files }) {
    const gist = await this.primary.updateGist(id, { description, files });
    const snippet = { id: gist.id, description: gist.description, files: gist.files };
    await this.fallback.saveSnippet(snippet);
    return snippet;
  }

  async delete(id) {
    await this.primary.deleteGist(id);
    await this.fallback.deleteSnippet(id);
  }
}

module.exports = new StorageManager();0