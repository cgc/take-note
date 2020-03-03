// from https://github.com/edm00se/pointing-sound-board/blob/master/src/main.js
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('sw.js')
      .then(r => {
        console.log('service worker registered in scope: ', r.scope);
      })
      .catch(e => console.log('SW error: ', e));
  });
}

import {Github} from './gh';
import {githubLogin} from './auth';
import {iso8601DayCurrTZ} from './utils';
import marked from 'marked';

const DRAFT_KEY = 'draft';
class Draft {
  constructor(el) {
    this.el = el;
  }

  load() {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft !== '') {
      this.el.value = draft;
    }
  }

  save() {
    const draft = this.el.value;
    localStorage.setItem(DRAFT_KEY, draft);
  }

  addEventListeners() {
    document.addEventListener('blur', (e) => {
      this.save();
    }, true);
    document.addEventListener('visibilitychange', (e) => {
      if (document.hidden) {
        this.save();
      }
    }, false);
  }
}

const NOTES_KEY = 'notes';
class Local {
  loadAll() {
    const stored = localStorage.getItem(NOTES_KEY);
    const parsed = stored === null ? [] : JSON.parse(stored);
    for (const n of parsed) {
      n.dtstr = this.dtfmt(n.dt);
    }
    return parsed;
  }
  _clear() {
    /*
    Clears stored notes. Should only be called after server sync.
    */
    localStorage.removeItem(NOTES_KEY);
  }
  dtfmt(dt) {
    dt = new Date(dt);

    function ensure2digits(number) {
      return number < 10 ? '0'+number : ''+number;
    }

    let hour = dt.getHours();
    let ampm = hour >= 12 ? 'pm' : 'am';
    if (hour > 12) {
      hour -= 12;
    } else if (hour === 0) {
      hour = 12;
    }
    return `${hour}:${ensure2digits(dt.getMinutes())}${ampm}`;
  }
  save(text) { // TODO need saveAll for server?
    const parsed = this.loadAll();
    const dt = new Date();
    parsed.push({
      dt: +dt,
      text: text.trim(),
    });
    localStorage.setItem(NOTES_KEY, JSON.stringify(parsed));
  }
  serializeNote(note) {
    return `${this.dtfmt(note.dt)}\n${note.text}`;
  }
}

class Application {
  constructor() {
    this.local = new Local();

    this.notesEl = document.querySelector('.Notes');
    this.notesEl.querySelector('.Notes-error').addEventListener('click', (e) => {
      this.sync();
    });
    const noteForm = document.querySelector('form#note');
    this.textarea = noteForm.querySelector('[name=text]');

    this.draft = new Draft(this.textarea);

    noteForm.addEventListener('keydown', (e) => {
      if (e.metaKey && e.keyCode === 13) {
        e.preventDefault();
        this.formSubmit();
      }
    });
    noteForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.formSubmit();
    });

    this.loading = true;
    this.remote = this.loadRemoteLocal();
  }
  renderNotes() {
    const notes = this.local.loadAll();
    if (this.remote) {
      this.notesEl.querySelector('.Notes-remote').innerHTML = notesToDOM(this.remote);
    }
    this.notesEl.querySelector('.Notes-local').innerHTML = notesToDOM(notes);
    this.notesEl.querySelector('.Notes-loading').textContent = this.loading ? 'Loading...' : '';
    this.notesEl.querySelector('.Notes-error').textContent = this.error ? `Error: ${this.error}, Click to retry` : '';

    window.scrollTo(0, document.documentElement.scrollHeight);
    // example to scroll exactly to bottom window.scrollTo(0, document.documentElement.scrollHeight - document.documentElement.clientHeight)
  }

  formSubmit() {
    const text = this.textarea.value;
    if (text !== '') {
      this.textarea.value = '';
      this.local.save(text);
      this.sync()
    }
  }

  loadRemoteLocal() {
    const remoteKey = 'remote';
    const day = iso8601DayCurrTZ(new Date());
    const c = localStorage.getItem(remoteKey);
    if (!c) {
      return;
    }
    const parsed = JSON.parse(c);
    if (parsed.day === day) {
      return parsed.notes;
    }
  }

  async loadRemote() {
    const remoteKey = 'remote';
    const day = iso8601DayCurrTZ(new Date());
    const notes = await this.api.loadNotes(day);
    localStorage.setItem(remoteKey, JSON.stringify({day, notes}))
    return notes;
  }

  async sync() {
    this.loading = true;
    this.error = '';
    this.renderNotes();

    if (!this.api) {
      return;
    }

    try {
      // save them to github
      await this.api.syncLocal(this.local);

      // then reload & rerender
      this.remote = await this.loadRemote();
    } catch(e) {
      console.log(e.stack);
      this.loading = false;
      this.error = e;
      this.renderNotes();
      return;
    }

    this.loading = false;
    this.renderNotes();
  }
}


const noteRender = note => `
<div class="Note">
  <div class="Note-inner">
    <span class="Note-dt">${note.dtstr}</span>
    <span class="Note-text">${note.text}</span>
  </div>
</div>
`;

function notesToDOM(notes) {
  return notes.map(n => {
    n.text = marked(n.text);
    return noteRender(n);
  }).join('');
}

function main() {
  const app = new Application();
  app.draft.addEventListeners();
  app.draft.load();
  app.sync();

  githubLogin().then(function(auth) {
    app.api = new Github(auth);
    app.sync();
  });
}

main();
