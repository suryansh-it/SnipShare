// src/services/storageManager.js

const { listGists, createGist } = require('./gistService');

class StorageManager {
  /** No initialization needed */
  async init() {}

  /** Return all gists */
  async list() {
    return listGists();
  }

  /** Filter by description substring */
  async search(q) {
    const all = await this.list();
    return all.filter(g => g.description.includes(q));
  }

  /** Create a new private gist */
  async create({ description, files }) {
    return createGist({ description, files });
  }
}

module.exports = new StorageManager();
