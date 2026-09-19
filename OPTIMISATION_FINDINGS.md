# Optimisation Findings — MK.Portfolio

Scan performed: 2026-06-16. Read-only audit of every HTML / CSS / JS / config file plus the `images/` directory. **No code has been changed.** This document is the working brief for the optimisation pass before deploy.

---

## 1. Executive Summary

The site is functionally complete (5 pages, contact form, video background, mobile menu) but is shipping ~22 MB of assets on every visit, most of which is unnecessary. The single most impactful change is the background video. After that, three large images and a stack of unused image files are the next-biggest wins. There are also a handful of correctness bugs (broken nav link, dead serverless API, placeholder social links) that should be fixed before going live.

**Estimated total page weight today (home page):** ~15.3 MB (13.65 MB video + 1.46 MB profile PNG + fonts + CSS/JS).
**Achievable after optimisation:** ~1–2 MB without sacrificing visual fidelity.

---

## 2. Critical issues (fix before deploy)

### 2.1 `live_background.mp4` is 13.65 MB and loads on every page
- File: `images/live_background.mp4` — **13,649,907 bytes**.
- Embedded in **all 5 pages** (`index.html`, `cv.html`, `projects.html`, `contact.html`, `modules.html`) with `autoplay muted loop playsinline` and no `preload` hint.
- Browsers will fetch the full file on every navigation (HTTP cache helps on repeat visits, not first paint).
- On mobile/3G this alone is a 30+ second hit to first interactive.

**Suggested actions:**
- Re-encode at 720p / CRF 28 with H.264 + a WebM fallback. Target 1.5–2 MB. Use `ffmpeg -i live_background.mp4 -vf scale=-2:720 -c:v libx264 -crf 28 -preset slow -an out.mp4`.
- Add a `poster="images/landing_background.jpg"` attribute so users see something while the video loads.
- Add `preload="metadata"` (or `preload="none"` on mobile via media-query JS).
- On `max-width: 768px`, hide the `<video>` and use the static `landing_background.jpg` as the background. Saves 13 MB on mobile and the CPU/battery cost of decoding video.
- Strip audio track (already muted, so it's just bytes).

### 2.2 `jlr.jpg` is 5.63 MB
- File: `images/jlr.jpg` — **5,629,276 bytes** — used as a 320 × 200 px card thumbnail on `projects.html`.
- The image is being served at ~50× the resolution actually rendered.

**Suggested action:** resize to ~640 × 400 and re-save as JPEG quality 80. Target < 80 KB. Consider WebP for an extra 25 % saving.

### 2.3 `munaf_img.png` is 1.46 MB
- File: `images/munaf_img.png` — **1,455,644 bytes** — rendered as a 200–320 px circular profile image (`index.html` line 31 and 106).
- PNG is the wrong format for a photo; this should be JPEG/WebP. Also the source is being scaled down ~6×.

**Suggested action:** convert to JPEG/WebP at 640 × 640. Target < 60 KB.

### 2.4 Broken navigation link: `about.html`
- File: `index.html` lines 59 and 77 link to `about.html`.
- `about.html` **does not exist** in the repo. Clicking "ABOUT ME" from `index.html` returns 404.
- Every other page links "ABOUT ME" → `index.html`, which is correct since the home page *is* the about section.

**Suggested action:** change both `about.html` references in `index.html` to `index.html` (or remove the ABOUT ME entry from the home-page nav entirely — you're already on it).

### 2.5 Placeholder social links
- `index.html` lines 115, 118, 121 — Instagram / GitHub / LinkedIn all `href="#"`.
- `contact.html` lines 60, 63, 66 — same.
- CV cites `linkedin.com/in/munafkazi` and `github.com/kazman21` — wire those in.

### 2.6 Dead serverless API code path
- `api/send-email.js` is a Vercel serverless function that talks to EmailJS via env vars `EMAILJS_PUBLIC_KEY`, `EMAILJS_SERVICE_ID`, `EMAILJS_TEMPLATE_ID`.
- `contact.js` (line 1, line 124) actually posts to **`https://formsubmit.co/ajax/munafkazi2006@gmail.com`** — bypassing the API entirely.
- This contradicts `CLAUDE.md`, which documents the form flow as `contact.js → POST /api/send-email → EmailJS`.

**Decision needed before deploy:** pick one path.
- *Option A* — keep FormSubmit: delete `api/send-email.js`, remove `vercel-dev` script if not needed, update `CLAUDE.md`. Simpler, no env vars to manage, but the email address is exposed in client JS (already is anyway).
- *Option B* — switch back to the serverless API: change `FORMSUBMIT_URL` in `contact.js` to `/api/send-email` and adjust the request body to match (`fullName/email/message` keys, not `name/_subject/_captcha`). Requires the three `EMAILJS_*` env vars in Vercel.

---

## 3. High-impact performance improvements

### 3.1 No image lazy loading
- None of the `<img>` tags use `loading="lazy"`. The Projects page has 6 thumbnails (~7.3 MB combined) all loaded eagerly.

**Action:** add `loading="lazy" decoding="async"` to every non-hero `<img>` in `projects.html` and the social icons in `index.html` / `contact.html`.

### 3.2 No image width/height attributes
- Missing intrinsic dimensions cause layout shift (CLS) and force the browser to wait for image headers before painting.

**Action:** add `width` and `height` attributes to all `<img>` tags. Use the post-optimisation pixel dimensions.

### 3.3 Image format & dimension cleanup
| Asset | Current | Used at | Recommendation |
|---|---|---|---|
| `live_background.mp4` | 13.65 MB | full-screen | 720p, < 2 MB, WebM + MP4 |
| `jlr.jpg` | 5.63 MB | 320 × 200 card | 640 × 400 JPEG q80 |
| `munaf_img.png` | 1.46 MB | 200–320 px circle | 640 × 640 WebP/JPEG |
| `paloalto.jpg` | 853 KB | 320 × 200 card | 640 × 400 JPEG q80 |
| `watertreatment.jpg` | 529 KB | unused | delete |
| `webdev.jpg` | 530 KB | unused | delete |
| `editing.jpg` | 426 KB | unused | delete |
| `holyfamily.jpg` | 224 KB | unused | delete |
| `ibmquantumcomp.jpg` | 215 KB | 320 × 200 card | resize, q80 |
| `operatingsystems.jpg` | 212 KB | unused | delete |
| `responsivewebdev.jpg` | 202 KB | 320 × 200 card | resize, q80 |

### 3.4 Unused images (delete to slim the deploy)
Referenced nowhere in code; safe to remove:
`X.png`, `badminton.jpg`, `ballyalla.jpg`, `compmaths.jpg`, `comporg.jpg`, `corballybaths.jpg`, `dataessentials.png`, `drawing.jpg`, `editing.jpg`, `flannans.jpg`, `heroimg.jpeg`, `holyfamily.jpg`, `interpersonalskills.jpg`, `mathematicalmethods.jpg`, `montisarry.jpg`, `munafimg.jpeg`, `operatingsystems.jpg`, `soccer.jpg`, `sql.jpg`, `tus.jpg`, `watertreatment.jpg`, `webdev.jpg`.

Combined ≈ 3.8 MB of dead weight in the repo. (They still get deployed via Vercel even if unreferenced.)

### 3.5 Font loading
- All 5 pages duplicate the same Google Fonts `<link>` for Poppins + JetBrains Mono and request 5 weights total. `&display=swap` is present (good — avoids FOIT).
- Two `preconnect` hints already present (good).

**Action:** subset to the weights actually used:
- Poppins: 700, 800 (CSS uses 400/600/700/800 but 400 only appears in `portfolio-subtitle`; consider dropping or consolidating).
- JetBrains Mono: 400 (500 is loaded but not obviously used — grep `font-weight: 500` to confirm).

### 3.6 CSS duplication across pages
- The animated `nav-link:before` gradient/glow rule is copy-pasted in `style.css`, `cv.css`, `projects.css`, `contact.css`, `modules.css` (~50 lines each).
- Same for the `.projects-link` / `.projects-white` / `.projects-black` rules.
- The mobile-menu / hamburger CSS is also duplicated in `style.css`, `projects.css`, `modules.css`.

**Action (low risk, big win):** extract a `shared.css` (nav + mobile menu + glow animation + reset + font/body defaults + background-video rules) and `<link>` it on every page **before** the page-specific stylesheet. Probably saves ~600 lines and one round of cache-miss bytes per page navigation.

### 3.7 Background video on internal pages uses `position: fixed`
- `cv.css`, `contact.css`, `projects.css`, `modules.css` all set `.background-video { position: fixed }` — that means the 13.65 MB video stays in memory and keeps decoding while the user scrolls a long page.
- On low-end mobiles this is the biggest cause of jank.

**Action:** for these content-heavy pages, replace the `<video>` with the static `landing_background.jpg` (or a smaller blurred derivative). Only the home page really needs the motion.

---

## 4. Page-specific issues

### 4.1 `index.html` / `style.css`
- **Conflicting mobile container heights.** Lines 788–805 of `style.css` redeclare `.container { display: flex; height: 100vh }` and force `.left-section { flex: 0 0 70%; height: 70% }` / `.right-section { flex: 0 0 30%; height: 30% }`. This forces a hard 100vh layout on mobile and overrides the earlier `auto` height. On phones with browser chrome (Safari iOS) `100vh` overflows. Use `100dvh` / `min-height` instead, or remove the override.
- **Background overlay sits at z-index 0 with video also at z-index 0.** Works because of source order, but fragile. Bump fallback to `z-index: -1`.
- **Typing animation runs even when prefers-reduced-motion is set.** The keyframes are suppressed but the JS `setInterval` still ticks. Wrap `initTypingAnimation()` in a `matchMedia('(prefers-reduced-motion: reduce)')` check and just set the final text immediately.
- The `.profile-image-container` desktop element exists in DOM and is hidden via `display: none` on mobile but the 1.46 MB image is still downloaded. (Browsers download `display:none` images for the most part.) Either move the image into the mobile container only, or rely on a single `<img>` element shared between layouts.

### 4.2 `cv.html` / `cv.css`
- "Download CV" links to `CV - MK.pdf` (note the space). The file is **untracked** (`?? "CV - MK.pdf"` in `git status`). It needs to be added before deploy or the download 404s.
- File name with space and capitals — URL-encode (`CV%20-%20MK.pdf`) or rename to `cv.pdf` for portability.
- Mobile nav uses horizontal scroll (`overflow-x: auto`) — works, but pages 1/3/4 use a hamburger menu instead. **Inconsistent UX.** CV + Contact should match Projects/Modules pattern (hamburger).
- Right column has `align-self: flex-start` on a grid child — CSS Grid doesn't use `flex-start`, should be `start`. Currently a no-op.

### 4.3 `projects.html` / `projects.css`
- Project cards have no link / call-to-action. Adding "View Project ↗" buttons with real GitHub/live URLs would increase engagement.
- 6 cards × 200–500 KB images = ~7 MB on first paint with no lazy load.
- `<script>` at the bottom of `projects.html` will throw if `.background-video` is missing — wrap in null guard like `cv.js` does.

### 4.4 `contact.html` / `contact.css` / `contact.js`
- Form posts to FormSubmit.co — see §2.6.
- Client-side rate limit is in-memory and resets on reload — purely cosmetic, attacker just reloads. The notice "Maximum 3 messages per minute" is misleading. Either disable the message or move rate limiting server-side (via the now-dead `api/send-email.js`).
- `tel:+353894218115` matches the CV phone (good).
- Missing `autocomplete` attributes on inputs — add `autocomplete="name"`, `autocomplete="email"`.

### 4.5 `modules.html` / `modules.css`
- No `prefers-reduced-motion` rule (unlike `style.css` / `cv.css` / `contact.css`).
- No page fade-in animation (unlike the other pages); minor consistency issue.
- 12 module cards rendered without any lazy hydration — fine because they're text-only.

---

## 5. Accessibility

- **Colour contrast:** `.portfolio-subtitle` and `.date` use white text on a light gradient background (`rgba(255,255,255,0.85)` → `rgba(255,255,255,0.5)`). Likely fails WCAG AA. (`style.css` lines 411, 427.)
- **Skip-to-content link missing** on every page.
- **`<main>` landmark missing** — all pages wrap content in `<section>` directly inside `<body>`.
- **Heading order** on `index.html` is fine (h1 → h2 → … inside), but the visual-only "MUNAF" / "KAZI" are two h1s — should be one h1 ("MUNAF KAZI") with visual splitting via spans.
- **Form labels:** good — labels are associated via `for=`. Error messages use `role="alert"` (good).
- **Focus styles:** present on form inputs and social links; not on nav links. Add `:focus-visible` for keyboard users.
- **Background video has no `aria-hidden="true"`** — screen readers may announce it.

---

## 6. SEO / metadata

Every page is missing:
- `<meta name="description">`
- `<meta name="author">`
- Open Graph (`og:title`, `og:description`, `og:image`, `og:url`)
- Twitter Card metadata
- `<link rel="canonical">`
- Favicon (`<link rel="icon">`) — currently no favicon at all
- `<meta name="theme-color">` for mobile browser chrome
- A `sitemap.xml` and `robots.txt`

Page titles are all "Munaf Kazi - X" (good).

---

## 7. Security & privacy

- Email address `munafkazi2006@gmail.com` is hardcoded in client JS (`contact.js` line 1) and in the success-text HTML. FormSubmit.co URL exposes it directly. Acceptable trade-off for a personal portfolio, but worth knowing.
- Phone number `(+353) 089 421 8115` is hardcoded in two places (`cv.html`, `contact.html`). Be aware.
- No CSP header. Vercel allows `headers` in `vercel.json` — adding even a relaxed `Content-Security-Policy` would block trivial XSS via injected scripts.
- `vercel.json` currently only has `"devCommand": "npm run dev"`. Consider adding cache headers for `/images/*` (`Cache-Control: public, max-age=31536000, immutable`) — biggest win after compressing the assets themselves.

---

## 8. Build / repo hygiene

- `node_modules/` is gitignored (good) and **not** committed.
- `CV - MK.pdf` is **untracked** but linked from the CV page — must be added before deploy.
- `CoverLetter & CV- Munaf Kazi.docx` was **deleted** (`AD` in status) — confirm intentional.
- `package.json` lists `vercel ^33.0.0` as a devDep but is invoked via `npx vercel` — fine, but adds 100+ MB to `node_modules` on `npm install`. Could drop the dep and rely purely on `npx` (which already fetches it on demand).
- No `README.md` in the repo root for visitors.
- No `.editorconfig` or formatter config — CSS uses a mix of 4-space and 2-space indentation.

---

## 9. Suggested optimisation order

1. **Re-encode `live_background.mp4`** and add `poster` + `preload="metadata"`. (Single biggest win.)
2. **Resize `jlr.jpg`, `munaf_img.png`, `paloalto.jpg`** and add `loading="lazy"` + `width/height` to every `<img>`.
3. **Delete the 22 unused images.**
4. **Fix the `about.html` 404** in `index.html`.
5. **Decide FormSubmit vs serverless API** and delete the dead path.
6. **Wire up real social links** on `index.html` and `contact.html`.
7. **Add `CV - MK.pdf`** to the repo (or remove the download button).
8. **Add favicon + meta description + OG tags** to all 5 pages.
9. **Extract `shared.css`** to deduplicate ~600 lines of CSS.
10. **Replace fixed-position video with static image** on cv/contact/projects/modules pages.
11. Accessibility pass: skip link, `<main>` landmark, `aria-hidden` on background video, fix subtitle contrast.
12. Add `Cache-Control` headers in `vercel.json` for `/images/*`.

Steps 1–4 alone should drop home-page weight by ~95 % and clear the most embarrassing bug. Steps 5–12 are quality-of-life improvements.
