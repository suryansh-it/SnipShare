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

  async listGists() {
    const res = await fetch(`${this.apiBase}/gists`, {
      headers: { Authorization: `token ${this.token}` }
    });
    if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
    return res.json();
  }

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

  async deleteGist(id) {
    const res = await fetch(`${this.apiBase}/gists/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `token ${this.token}` }
    });
    if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  }
}

const config = vscode.workspace.getConfiguration('snipshare');
const token = config.get('githubToken') || '';
module.exports = new GistService(token);