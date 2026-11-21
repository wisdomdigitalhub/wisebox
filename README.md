# WiseBox

A responsive movie and TV discovery frontend built with HTML, CSS and vanilla JavaScript, powered by TMDB.

## 1. Add your TMDB API key

1. Open `js/config.js`.
2. Replace `PASTE_YOUR_NEW_V3_API_KEY_HERE` with your TMDB **API Key (v3 auth)**.
3. Save the file.
4. Do not add your TMDB v4 Read Access Token to this frontend. It is not needed by this starter.

**Important about hosting:** A static website runs JavaScript in every visitor's browser. That means any API key used by `js/config.js` can be viewed in the downloaded source or browser network tools. GitHub Pages cannot keep a frontend API key secret. If you publish this demo with a working key, assume that key is public. For a production app or if you do not want the key exposed, put TMDB requests behind a server/serverless proxy and keep the credential there. Never publish the v4 token. Check TMDB's current terms and commercial licensing requirements before public/commercial use.

## 2. Run locally first

Recommended: Visual Studio Code + Live Server.

1. Extract the WiseBox ZIP.
2. Open the extracted `WiseBox` folder in VS Code (`File > Open Folder`).
3. Install the **Live Server** extension if needed.
4. Right-click `index.html` and choose **Open with Live Server**.
5. The browser should open a local address such as `http://127.0.0.1:5500`.

Do not double-click `index.html`; use a local server for reliable fetch requests.

## 3. How the files are connected

- `index.html` loads `css/styles.css`, `js/config.js` and `js/app.js`.
- `js/config.js` stores the TMDB API configuration.
- `js/app.js` makes TMDB requests, renders pages and manages your local library.
- `css/styles.css` controls the visual styling.

The links are already written in `index.html`:

```html
<link rel="stylesheet" href="css/styles.css" />
<script src="js/config.js"></script>
<script src="js/app.js" defer></script>
```

Keep the folder names and file names exactly as provided.

## 4. Publish on GitHub Pages

GitHub Pages can host this static HTML/CSS/JavaScript project. On GitHub Free, use a **public repository** for GitHub Pages.

1. Sign in at <https://github.com/>.
2. Click **New repository**.
3. Name it `wisebox` (or another name you prefer).
4. Choose **Public**, then create the repository.
5. On your computer, open the extracted `WiseBox` folder. Open the folder itself, then select the files and folders inside it: `index.html`, `css`, `js`, and `README.md`.
6. On the new GitHub repository page, choose **Add file → Upload files**.
7. Drag the contents of the WiseBox folder into the upload area. Make sure `index.html` is at the top level of the repository, not buried inside another `WiseBox` folder.
8. Add a commit message such as `Add WiseBox website`, then click **Commit changes**.
9. In the repository, open **Settings → Pages**.
10. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
11. Select branch **main** and folder **/(root)**, then click **Save**.
12. Wait for the deployment to finish. Refresh **Settings → Pages**; GitHub will show the published site link. It will usually look like `https://YOUR-USERNAME.github.io/wisebox/`.

GitHub Pages may take several minutes to publish the first time. Check the repository's **Actions** tab if the deployment fails.

### API-key choice before publishing

- If you leave the placeholder in `js/config.js`, the hosted page will load but TMDB-powered sections will not work.
- If you insert a real v3 key and upload that file, the key becomes public. Only do this if you understand and accept that exposure for a non-commercial learning/portfolio demo. Do not upload the v4 token.
- To keep the credential private while the live site uses TMDB, add a backend/serverless proxy first; GitHub Pages alone cannot provide that protection.

## Features

- Cinematic homepage, featured title and mood shortcuts
- Trending, popular, top-rated and popular TV sections
- Discover filters: media type, genre, year, minimum rating and sort
- Search across titles
- Detail pages with overview, cast, trailer and recommendations
- Watchlist, favourites, watched list and personal ratings
- Local browser storage for library and profile
- Responsive desktop, tablet and mobile layouts

## Important notes

- WiseBox is a discovery app, not a streaming service. It does not host or play full films or episodes.
- Library data is stored in the current browser/device only. There is no account system or cloud sync.
- TMDB's API is free for qualifying non-commercial use with required attribution. Commercial use requires the appropriate licence/permission. Read TMDB's current FAQ and terms before publishing or monetizing.
- This product uses the TMDB API but is not endorsed or certified by TMDB.

Useful official guides:
- GitHub Pages: <https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site>
- Configure publishing source: <https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site>
- TMDB FAQ: <https://developer.themoviedb.org/docs/faq>
