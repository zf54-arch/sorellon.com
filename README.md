# Sorellon Limited website

Static corporate website for a UK general goods procurement and supply business. Content supports supplier due diligence, with public correspondence directed to sales@sorellon.com.

## Local preview

Requires Node.js 20 or newer.

```sh
npm install
npm run build
npm run preview
```

Open <http://127.0.0.1:4174/>. Set `PORT` to use another port. The local server supports clean URLs and the explicit rules in `_redirects`.

`npm run build` rebuilds the CSS bundle and runs the static checks. `npm test` checks page metadata, landmarks, local links, contact details and legacy redirects.

## Documents

```sh
npm run pdf:all
```

The existing Puppeteer helper generates the capability statement, privacy policy and terms PDFs from their HTML pages using a temporary local server. A Chromium download may be needed when Puppeteer is first installed. Rebuild these documents whenever their source content changes, then inspect their extracted text and pagination.

## Hosting configuration

The existing Netlify configuration uses the repository root as the publish directory and an empty build command. `_headers` provides security headers; `_redirects` preserves clean URLs and legacy contact and sourcing links. Local build and document generation do not deploy the site.

## Content maintenance

The incorporation date is 10 July 2025. Policy review dates are separate and should only be changed following an actual policy review. Company registration, insurance, certification and other procurement claims must remain consistent with company records.

The homepage, About, Capabilities, Sectors and public-sector information pages explain the supply process. The capability statement provides a downloadable overview. Contact is by email. Policy pages set out the current position and limitations.

Capability and sector icons are inline SVGs. The homepage uses decorative CSS animations with pause/resume controls and reduced-motion support. Shared visual refinements live in `assets/refinement.css`.
