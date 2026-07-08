# Deploying the builder to Contentful (master environment)

A Contentful **App** isn't "deployed to an environment". Three separate things:

1. **Bundle** — the built `dist/` (frontend code), hosted somewhere.
2. **App Definition** — lives at the **organization** level; points at the bundle and declares
   which locations the app uses (Entry editor, Page, Sidebar, Config screen…).
3. **Installation** — per **space + environment**. Installing the app into the `master`
   environment is what makes it appear there.

Upload + activate a bundle **once** and it updates every environment the app is installed in.
So "push to master" = host the bundle → set the definition to use it → install in `master`.

---

## A) Contentful-hosted (recommended — "push up to Contentful")

### One-time
- **App Definition** (if you don't have one yet): `pnpm run create-app-definition`
  (interactive: name + locations). Note its **definition id**.
- Gather 3 credentials:
  | flag | where |
  | --- | --- |
  | `--organization-id` | Org settings → the id in the URL `…/organizations/<ORG_ID>/…` |
  | `--definition-id` | Apps → **Manage app definitions** → your app → General (or the URL) |
  | `--token` | Account **Settings → Tokens → Personal access tokens → Generate**. This is a **CMA** (write) token — keep secret, never commit, never put in a `VITE_` var |

### Each release
```bash
# 1. make sure .env holds PRODUCTION preview-route values (baked into the bundle):
#    VITE_CONTENTFUL_SPACE_ID, VITE_CONTENTFUL_ENVIRONMENT=master, VITE_CONTENTFUL_CPA_TOKEN
# 2. build + upload + activate (the CMA token is used only here, not bundled):
pnpm run build
pnpm exec contentful-app-scripts upload --bundle-dir ./dist \
  --organization-id <ORG_ID> --definition-id <APP_DEF_ID> --token <CMA_TOKEN>
#    (omit the flags to be prompted interactively; add --skip-activation to NOT auto-activate)
```
Then in Contentful:
- **Apps → Manage app definitions → your app → Frontend = "Hosted by Contentful"** (uses the
  activated bundle, instead of a localhost / external URL).
- **Your space → Apps → (your app) → Install**, with the environment switcher on **master**.
  Already installed? The freshly-activated bundle is live automatically — no reinstall.

`pnpm run deploy` = build + upload (prompts for the 3 values).

## B) Self-hosted (what we used for the server deploy)

Host `dist/` on your own **HTTPS** server, then set the App Definition's **Frontend URL** to
`https://your-server/`, and install in `master` the same way. Re-deploy = re-upload `dist/` to
your server (no Contentful CLI needed).

---

## Gotchas
- **CPA vs CMA tokens are different.** CPA (read-only preview) is inlined into the bundle for the
  `/?entryId=…` preview route — semi-public, low risk. CMA (write) is for `upload` only — secret.
- **Content-preview URL** (Settings → Content preview) is separate from the app: point it at your
  preview host, `https://…/?entryId={entry.sys.id}&locale={locale}`.
- The App Definition's Frontend currently points at `http://localhost:3000` (dev). Switch it to
  "Hosted by Contentful" (A) or your server URL (B) for master, or ops still load your laptop.
