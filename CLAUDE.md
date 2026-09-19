# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Local development — static file server on http://localhost:3000
npm run dev        # runs: npx serve -p 3000 .

# Deploy to production (Vercel)
npm run deploy     # runs: npx vercel --prod
```

The site is fully static — `npm run dev` serves every page correctly, including the contact form (which posts directly to FormSubmit's public API from the browser, no server needed).

## Architecture

Static multi-page portfolio. No build step — pages are plain HTML files served directly.

**Pages and their assets:**

| Page | HTML | CSS | JS |
|---|---|---|---|
| Home / About | `index.html` | `style.css` | `script.js` |
| CV | `cv.html` | `cv.css` | `cv.js` |
| Projects | `projects.html` | `projects.css` | inline `<script>` |
| Contact | `contact.html` | `contact.css` | `contact.js` |
| Modules | `modules.html` | `modules.css` | inline `<script>` |

Each page is self-contained with its own stylesheet. There is no shared CSS — common patterns (nav, video background, fonts) are duplicated per page.

**Contact form flow:**

`contact.js` → `POST https://formsubmit.co/ajax/munafkazi2006@gmail.com` → email delivered.

No server-side component. Client-side rate limit (3 submissions per minute) lives in `contact.js` and resets on page reload — it's a UX hint, not security.

**Shared patterns across pages:**

- Background: `<video class="background-video">` with `<div class="background-overlay">` fallback; video error/load events toggle the fallback visibility.
- Navigation: Each page duplicates the nav bar with an active class for the current page (e.g., `cv-active`, `contact-active`, `modules-active`). The home page (`index.html`) has both a desktop nav (`.main-nav`) and a CSS-checkbox-driven fullscreen mobile menu.
- Fonts: Poppins + JetBrains Mono loaded from Google Fonts on every page.
- Images: All assets live in `images/`.
