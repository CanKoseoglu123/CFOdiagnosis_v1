# PDF Generation Test Results - Railway

## Test Date: January 2, 2026

## Summary

**Status: FAILED** - Puppeteer with @sparticuz/chromium does not work on Railway.

## What Was Tested

1. Installed `puppeteer-core` and `@sparticuz/chromium`
2. Created `/pdf-test` endpoint with HTML → PDF generation
3. Tried multiple approaches:
   - nixpacks.toml with Chromium dependencies
   - Dockerfile with apt-installed Chromium
   - railway.json to force Dockerfile builder

## Error

```json
{
  "error": "PDF generation failed",
  "message": "Failed to launch the browser process: Code: 127\nstderr:\n/tmp/chromium: error while loading shared libraries: libnspr4.so: cannot open shared object file: No such file or directory"
}
```

## Root Cause

Railway's build system doesn't seem to respect the Dockerfile or nixpacks.toml configuration properly. The `@sparticuz/chromium` library extracts a pre-built Chromium to `/tmp`, but Railway's container lacks the required shared libraries (libnspr4.so, libnss3.so, etc.).

## Alternative Approaches

### Option A: Cloud PDF API Service (Recommended)

Use a dedicated PDF generation API like:
- **DocRaptor** - $15-100/month, HTML to PDF, great quality
- **PDF.co** - Pay-per-use, ~$0.01/PDF
- **Anvil PDF** - $100/month, templates + HTML

**Pros:** Reliable, no infrastructure headaches, professional output
**Cons:** Monthly cost, external dependency

### Option B: Separate Vercel Serverless Function

Deploy PDF generation as a standalone Vercel function with special configuration.

```js
// api/generate-pdf.js on Vercel
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
// Vercel supports this pattern
```

**Pros:** Free tier available, @sparticuz/chromium works on Vercel/Lambda
**Cons:** Separate deployment, CORS handling needed

### Option C: AWS Lambda (Best for @sparticuz/chromium)

`@sparticuz/chromium` is specifically designed for AWS Lambda's constrained environment.

**Pros:** @sparticuz/chromium was built for this, scalable
**Cons:** Adds AWS to stack, cold starts

### Option D: Browserless.io

Managed headless Chrome cloud service.

```js
const browser = await puppeteer.connect({
  browserWSEndpoint: 'wss://chrome.browserless.io?token=YOUR_TOKEN'
});
```

**Pros:** $20/month, no infrastructure, always warm
**Cons:** Monthly cost, network latency

### Option E: Client-Side PDF Generation

Use libraries like jsPDF + html2canvas in the React frontend.

**Pros:** No server infrastructure, works immediately
**Cons:** Less control over output, browser-dependent

## Recommendation

**For MVP:** Option A (Cloud PDF API) - Use DocRaptor or PDF.co for reliable, professional PDF output without infrastructure complexity.

**Long-term:** Option C (AWS Lambda) or Option B (Vercel Function) - Once MVP is stable, migrate PDF generation to a platform that properly supports Puppeteer.

## Cleanup Required

If proceeding with an alternative, remove:
- `puppeteer-core` and `@sparticuz/chromium` from package.json
- `/pdf-test` endpoint from src/index.ts
- nixpacks.toml, Dockerfile, railway.json

## Files Added During Test

- `src/index.ts` - Added `/pdf-test` endpoint (lines 131-240)
- `nixpacks.toml` - Chromium dependencies
- `Dockerfile` - Chromium via apt
- `railway.json` - Force Dockerfile builder
- `.dockerignore` - Reduce image size
