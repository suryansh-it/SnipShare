const gistService = require('./gistService');
const indexedDBService = require('./indexedDBService');

class StorageManager {
  constructor() {
    this.primary = gistService;
    this.fallback = indexedDBService;
  }

  /**
   * Initialize storage: ensure fallback and sync primary, errors are caught
   */
  async init() {
    // Initialize IndexedDB without failing the entire flow
    try {
      await this.fallback.init();
    } catch (err) {
      console.error('⚠️ IndexedDB init failed, continuing without offline cache:', err);
    }

    // Sync from primary gists
    let gists = [];
    try {
      gists = await this.primary.listGists();
    } catch (err) {
      console.error('❌ Could not list Gists:', err);
    }

    for (const gist of gists) {
      try {
        await this.fallback.saveSnippet({
          id: gist.id,
          description: gist.description,
          files: gist.files
        });
      } catch (err) {
        console.error(`⚠️ Failed to cache gist ${gist.id}:`, err);
      }
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
    try {
      await this.fallback.saveSnippet(snippet);
    } catch (err) {
      console.error(`⚠️ Failed to cache new snippet ${snippet.id}:`, err);
    }
    return snippet;
  }

  async update(id, { description, files }) {
    const gist = await this.primary.updateGist(id, { description, files });
    const snippet = { id: gist.id, description: gist.description, files: gist.files };
    try {
      await this.fallback.saveSnippet(snippet);
    } catch (err) {
      console.error(`⚠️ Failed to update cache for snippet ${id}:`, err);
    }
    return snippet;
  }

  async delete(id) {
    try {
      await this.primary.deleteGist(id);
    } catch (err) {
      console.error(`❌ Failed to delete gist ${id}:`, err);
    }
    try {
      await this.fallback.deleteSnippet(id);
    } catch (err) {
      console.error(`⚠️ Failed to delete snippet from cache ${id}:`, err);
    }
  }
}

module.exports = new StorageManager();