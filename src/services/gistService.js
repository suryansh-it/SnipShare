const vscode = require('vscode');
const fetch = require('node-fetch');

/**
 * @typedef {{id: string, description: string, files: Record<string,{content:string}>}} Gist
 */

class GistService {
  /** @param {string} token GitHub OAuth token */
  constructor(token) {
    this.token = token;
    this.apiBase = 'https://api.github.com';
  }

  /**
   * List user gists
   * @returns {Promise<Gist[]>}
   */
  async listGists() {
    const res = await fetch(`${this.apiBase}/gists`, {
      headers: { Authorization: `token ${this.token}` }
    });
    if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
    return res.json();
  }

  /**
   * Create a new gist
   * @param {{description: string, files: Record<string,{content:string}>, public?: boolean}} body
   * @returns {Promise<Gist>}
   */
  async createGist(body) {
    const res = await fetch(`${this.apiBase}/gists`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `token ${this.token}`
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
    return res.json();
  }

  /**
   * Update an existing gist
   * @param {string} id
   * @param {{description?: string, files?: Record<string,{content:string}>}} body
   * @returns {Promise<Gist>}
   */
  async updateGist(id, body) {
    const res = await fetch(`${this.apiBase}/gists/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `token ${this.token}`
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
    return res.json();
  }

  /**
   * Delete a gist
   * @param {string} id
   * @returns {Promise<void>}
   */
  async deleteGist(id) {
    const res = await fetch(`${this.apiBase}/gists/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `token ${this.token}` }
    });
    if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  }
}

// Retrieve token from extension configuration or globalState
const config = vscode.workspace.getConfiguration('snipshare');
const token = config.get('githubToken') || '';
module.exports = new GistService(token);