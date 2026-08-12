# Google Safe Browsing — clear Chrome “Dangerous site”

Operator + agent assist for `https://t360-web.vercel.app` (and any future custom origin).

Code redeploys **do not** clear Safe Browsing by themselves. Clearing requires Google to accept a Search Console security review (and optionally a false-positive report). Typical wait: **24–72 hours**.

## Current status (operator checklist)

| Step | Status |
|------|--------|
| Property verified (HTML file `google9898b8c079878468.html`) | Done |
| Security issues → Deceptive pages → **Request a review** | Submitted by operator |
| Parallel [report_error](https://safebrowsing.google.com/safebrowsing/report_error/) | Do this if not already |
| Wait for Google delist | In progress — recheck phone after 24–72h |
| Custom domain | Not yet — staying on `*.vercel.app` |

### If Chrome still shows “Dangerous site” on your phone

1. Confirm Search Console → **Security & Manual Actions → Security issues** — review pending or cleared?
2. Submit / re-submit [Safe Browsing report error](https://safebrowsing.google.com/safebrowsing/report_error/) for `https://t360-web.vercel.app` → “I believe this isn’t a safety threat”.
3. Temporary bypass (you only): red screen → **Details** → visit this unsafe site. Customers still see the warning until Google delists.
4. After **72 hours** still blocked: check review status in Search Console (do **not** expect another code-only redeploy to clear it).

## Status check

1. Open [Safe Browsing site status](https://transparencyreport.google.com/safe-browsing/search?url=https://t360-web.vercel.app).
2. Note whether Google still flags the URL (social engineering / malware / clean).

Storefront hardening is live: branded OTP, security headers, OG metadata, Organization JSON-LD, robots allow crawl.

## A. Search Console verification

1. [Google Search Console](https://search.google.com/search-console) → **Add property** → **URL prefix** → `https://t360-web.vercel.app/`.
2. Choose one verification method:

### HTML meta tag

1. Copy the `content` value from the meta tag Google shows.
2. Paste it into chat **or** set Vercel env on project `t360-web`:

   | Name | Value |
   |------|--------|
   | `GOOGLE_SITE_VERIFICATION` | the meta `content` string only |

3. Redeploy web. Next.js emits the meta tag when that env var is set (`apps/web/src/app/layout.tsx`).
4. In Search Console, click **Verify**.

### HTML file (already used)

Live at `https://t360-web.vercel.app/google9898b8c079878468.html` (keep this file in `apps/web/public/`).

## B. Request a security review

1. Search Console → **Security & Manual Actions** → **Security issues**.
2. Click **Request a review**. Sample text:

   > This is the legitimate THARAGAI Readymades ecommerce storefront (Pudukkottai) hosted on Vercel. Customer sign-in uses mobile OTP for our own account pages only. There is no malware, phishing of third-party brands, or unwanted software. We believe this is a false positive on a new `*.vercel.app` host.

3. Expect **24–72 hours** before mobile Chrome drops the red interstitial.

## C. Parallel false-positive report

Same Google account:

1. Open [Safe Browsing report error](https://safebrowsing.google.com/safebrowsing/report_error/).
2. URL: `https://t360-web.vercel.app`
3. Choose **I believe this isn’t a safety threat** (or equivalent).
4. Submit. This does not replace Search Console review; it runs in parallel.

## D. Custom domain (recommended longer-term)

If you own a hostname (e.g. `shop.tharagai…`), tell the agent. They will:

1. Attach it to Vercel project `t360-web` (and `t360-admin` if needed).
2. Set `NEXT_PUBLIC_SITE_URL` to the custom origin.
3. Update Railway API `CORS_ORIGINS` if required.
4. Redeploy and re-run Search Console / review on the **new** origin.

Until then, clear Chrome via Search Console on `t360-web.vercel.app`.

## Agent-side already done

- Live `/` and GSC verification file return 200
- Security headers / branded storefront / OG on production
- Organization JSON-LD (Pudukkottai) + robots allow crawl
- Report-error + wait checklist documented above
