# Dwello

A responsive, database-backed property marketplace demo inspired by real-estate portals. Built with browser JavaScript, CSS, Node.js 24 and its built-in SQLite driver. No package installation is required.

## Run

```sh
npm start
```

Open http://localhost:3000. Use `npm run dev` to restart the server when server files change. Use `npm test` for backend integration checks. Set `PORT` to choose another port. The server binds to loopback by default; `HOST` can change this explicitly.

## Included

- Responsive buy/rent discovery for Bengaluru, Mumbai and Pune.
- Locality/project search, bedrooms, type, budget and owner filters; sorting and shareable filter URLs.
- Property detail dialogs, photo gallery and amenities.
- Saved properties persisted in SQLite for each demo session.
- Enquiries with validation and explicit contact-sharing consent.
- Listing submission, pending-review status and an advertiser dashboard with close-listing action.
- Backend ownership checks, parameterized queries, same-origin writes, HttpOnly cookies, security headers, request limits and body limits.
- Illustrative sample inventory. Images are externally hosted by Unsplash; Google Fonts supplies the typefaces. Internet access is needed for those assets.

## Data and access

Runtime data is stored in `data/dwello.sqlite` (excluded from Git). `DB_PATH` overrides this location. A random HttpOnly cookie identifies the local demo session. The cookie lasts 30 days. Clearing it or switching browsers creates a new session with a different shortlist and dashboard. Sessions are not verified user accounts. Test data uses an isolated in-memory database.

## Share a live demo with GitHub Pages

This repository includes `.github/workflows/pages.yml`. It tests the app and deploys a browser-only showcase when changes reach `main`. Pull requests run checks without deploying.

1. Push this project to your GitHub repository on the `main` branch.
2. In the repository, open **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
3. Open **Actions → Test and deploy showcase → Run workflow** if the initial push ran before Pages was enabled.
4. Open the deployment URL shown in the workflow. A project repository normally uses `https://YOUR_USERNAME.github.io/YOUR_REPOSITORY/`.
5. Add that URL to the repository's **About → Website** field so visitors can find the live demo.

GitHub Pages is static hosting. The showcase uses illustrative inventory and browser storage for favorites, pending submissions and enquiry receipts. Each browser has its own data. It does not send or store enquiry contact details, contact real advertisers, accept uploads or publish submissions. The original Node/SQLite version is unchanged. Never upload `data/`, credentials or real customer information to GitHub.

To build the showcase yourself:

```sh
npm run build
python3 -m http.server 8080 --directory dist
```

Open http://localhost:8080. The generated `dist/` folder is excluded from Git; Actions rebuilds it. Relative asset links support repository subpaths. The build exports only seed data, never your SQLite database. GitHub Free supports Pages from public repositories; private repository availability depends on your GitHub plan. See [GitHub Pages documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages).

Seed listings are illustrative, not real offers. Enquiries are saved locally; no email/SMS is sent. Submitted properties remain private and pending. There is no moderator interface or publish endpoint. Listing photos use a placeholder; uploads are not implemented. Do not enter sensitive personal information in this demo.

## Before a production launch

Integrate verified authentication, account recovery and staff MFA; account-bound permissions; a moderation workflow and appeals; private document storage and validated media processing; transactional notifications with reliable retries; distributed rate limits; session expiry and retention cleanup; data deletion and consent management; production logs/monitoring and backups with restoration drills. Complete privacy/regulatory review for the intended market and security testing before accepting real customer data. Use HTTPS and `COOKIE_SECURE=true` behind an appropriately configured proxy. Payments and promoted listings are not implemented.

The current in-process rate limiter and single-node SQLite deployment are intended for local evaluation. A GitHub Pages workflow is prepared, but a live URL is available only after pushing to your repository and successfully deploying it. Hosting the shared backend requires a Node-compatible service with durable storage; GitHub Pages cannot run that server.
