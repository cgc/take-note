import { Octokit } from '@octokit/rest';
import { groupby, ensureEndsNewline, iso8601DayCurrTZ } from './utils';
import { Base64 } from 'js-base64';

export class Github {
  constructor(auth) {
    this.owner = auth.user.login;
    this.repo = auth.repo;
    this.auth = auth;
    this.api = new Octokit({ auth: auth.token });
  }

  async loadFile(path) {
    const repoQuery = {owner: this.owner, repo: this.repo};
    try {
      const {data} = await this.api.repos.getContents({path, ...repoQuery});
      const content = Base64.decode(data.content);
      return [content, data.sha];
    } catch(e) {
      if (e.status == 404 && e.name == 'HttpError' && e.message === "Not Found") {
        return ['', undefined];
      }
      throw e;
    }
  }

  async appendToFile(path, append) {
    const repoQuery = {owner: this.owner, repo: this.repo};
    let [content, sha] = await this.loadFile(path);
    if (content) {
      content = ensureEndsNewline(content);
    }
    content += ensureEndsNewline(append);
    await this.api.repos.createOrUpdateFile({
      path: path,
      message: 'Update',
      content: Base64.encode(content),
      name: this.auth.user.name,
      email: this.auth.user.email,
      sha: sha,
      ...repoQuery,
    });
  }

  serializeNote(note) {
    const multiline = note.text.indexOf('\n') !== -1;
    const markdownHeader = note.text[0] == '#';
    const join = multiline || markdownHeader ? '\n' : ' ';
    return [note.dtstr+':', note.text].join(join);
  }

  filename(day) {
    return `${day}.md`;
  }

  async loadNotes(day) {
    const dateRe = /^(\d{1,2}:\d\d[ap]m):(.*)/;
    const [content, sha] = await this.loadFile(this.filename(day));
    if (!content) {
      return [];
    }
    const notes = [];
    let curr = {dtstr: '', text: ''}; // start with a null one?
    for (const line of content.split('\n')) {
      const match = dateRe.exec(line);
      if (match) {
        if (curr.text) {
          notes.push(curr);
        }
        curr = {
          dtstr: match[1],
          text: match[2].trim(),
        };
      } else {
        curr.text += '\n' + line;
      }
    }
    if (curr.text) {
      notes.push(curr);
    }
    return notes;
  }

  async syncLocal(local) {
    const notes = local.loadAll();
    if (notes.length === 0) {
      return;
    }
    const notesByDay = groupby(notes, note => iso8601DayCurrTZ(note.dt));
    for (const key of Object.keys(notesByDay)) {
      const serialized = notesByDay[key].map(this.serializeNote).join('\n\n');
      await this.appendToFile(this.filename(key), serialized);
    }
    local._clear();
  }
};
