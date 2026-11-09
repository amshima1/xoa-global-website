# XOA Solutions Limited

Official corporate website for XOA Solutions Limited, built with plain HTML, CSS and JavaScript. The pages are static and can be published with GitHub Pages without a build step.

## Pages

- `index.html` — homepage
- `about.html` — company, vision, mission and values
- `services.html` — areas of work
- `projects.html` — illustrative visual concepts, not verified company projects
- `contact.html` — contact placeholders and a non-submitting enquiry form preview

Shared styles and behaviour live in `assets/css/style.css` and `assets/js/main.js`. Optimized WebP photography is stored in `assets/images/`; the `assets/images/README.md` file explains how to replace it with approved company images. No contact details, clients, certifications, project claims or performance results have been invented.

The reusable chatbot is styled in `assets/css/chatbot.css` and implemented in `assets/js/chatbot.js`. It appears on every page and saves conversation history in the current browser tab's session storage. When served with the backend, it sends the conversation to `/api/chat` for AI responses grounded in the published site content.

## Preview locally

Open `index.html` in a browser, or start a simple local server from the repository root:

```sh
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Edit the site

- Update page copy and SEO descriptions in the corresponding HTML files.
- Adjust colours, typography, layouts and responsive breakpoints in `assets/css/style.css`.
- Update mobile navigation, gallery filters, reveal effects and the contact-form preview in `assets/js/main.js`.
- Replace the illustrative WebP files in `assets/images/` with approved company photography. The project gallery must continue to distinguish illustrative concepts from verified work until project details and images are approved.
- Replace the email, telephone and WhatsApp placeholders only after the company confirms the correct contact details.
- Connect the contact form to an approved backend before presenting it as a working enquiry channel. The current form intentionally prevents submission.
- The chatbot endpoint is `api/chat.js`, a Node.js serverless function compatible with Vercel. It uses `OPENAI_API_KEY` from the server environment and optionally `OPENAI_MODEL` (defaults to `gpt-4o-mini`). The key is never included in browser code. Its knowledge snapshot is maintained in `api/knowledge.js` and is sourced from the five published pages; update it when company copy changes.
- For local development, install the Vercel CLI if needed and run `npx vercel dev` from the repository root. Add `OPENAI_API_KEY` and, optionally, `OPENAI_MODEL` to a local `.env.local` file. Never commit `.env.local`; `.gitignore` excludes local environment files.
- For deployment, import this repository into Vercel, add `OPENAI_API_KEY` (and optionally `OPENAI_MODEL`) in the project's environment-variable settings, then deploy. Hosting the pages and `/api/chat` on the same origin lets the existing chatbot call the API without cross-origin access. GitHub Pages alone cannot run serverless functions; if keeping GitHub Pages, deploy an API separately and configure a secure same-origin proxy rather than exposing credentials or enabling permissive CORS.
- `GET /api/chat` reports only whether the server key is configured, so the widget can distinguish a live AI backend from demo mode without exposing a credential. `POST /api/chat` accepts a JSON `messages` array containing recent user and assistant messages and returns `{ "reply": "..." }`. It validates roles and message sizes, checks same-origin requests, applies a best-effort per-instance rate limit, and returns generic errors without exposing provider details. For higher traffic, add durable edge rate limiting and monitoring. The model is instructed to use the published-site knowledge base for XOA-specific facts and say when information is not published.
- Run backend tests with `node --test api/chat.test.js`. Tests mock the AI provider; real responses require a valid server-side API key and a deployed/configured backend.

## Publish with GitHub Pages

1. Push the website files to the GitHub repository's default branch.
2. In the repository, open **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select the default branch and the `/(root)` folder, then save.
5. Wait for the Pages deployment to complete and open the published URL shown in the Pages settings.

All internal links use relative paths, so the pages work from the repository root and on GitHub Pages. If the site is published under a project subpath, keep asset and page links relative as they are now.
