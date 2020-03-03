import { Octokit } from '@octokit/rest';

const loginTemplate = `
<div class="Popup-outer">
<div class="Login Popup">
  <form class="Login-form">
    <label>Token <input type="text" name="token" /></label><br />
    <label>Repo <input type="text" name="repo" /></label><br />
    <input type="submit" value="Login" />
  </form>
  <br />
  <div class="Login-info"></div>
  <button disabled>Save Credentials</button>
</div>
</div>
`;

const AUTH_KEY = 'auth';
export async function githubLogin() {
  let auth = localStorage.getItem(AUTH_KEY);
  if (auth) {
    return JSON.parse(auth);
  }

  let resolve;
  const promise = new Promise(function(res, rej) {
    resolve = res;
  });

  const div = document.createElement('div');
  div.innerHTML = loginTemplate;
  document.body.appendChild(div);
  const form = div.querySelector('form');
  const info = div.querySelector('.Login-info');

  function saveButton(auth) {
    const button = div.querySelector('button');
    button.disabled = false;
    button.addEventListener('click', function(e) {
      e.preventDefault();
      localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
      div.parentNode.removeChild(div);
      resolve(auth);
    });
  }

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    info.textContent = '';
    const token = form.querySelector('[name=token]').value;
    const repo = form.querySelector('[name=repo]').value;
    const api = new Octokit({ auth: token });
    (async () => {
      const { data: user } = await api.request('/user');
      const query = {owner: user.login, repo: repo};
      const { data: repoData } = await api.repos.get(query);
      const p = repoData.permissions;
      if (!(p.push && p.pull)) {
        throw new Error(`Repo permission error: ${p}`);
      }
      const { data: commits } = await api.repos.listCommits({per_page: 1, ...query});
      const commit = commits[0];
      return [user, repoData, commit];
    })().then(function([user, repoData, commit]) {
      const email = commit.commit.author.email;
      info.innerHTML = `Login: ${user.login}<br />Name: ${user.name}<br />Repo: ${repoData.name}<br />Email: ${email}<br />`;
      saveButton({
        repo,
        token,
        user: {email, login: user.login, name: user.name},
      });
    }).catch(function(e) {
      console.log(e.stack);
      info.textContent = e;
    });
  });
  return promise;
}
