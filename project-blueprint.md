# TwisterTools 2.0 - Project Blueprint

## Permanent Architecture Constraints

### Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React icons (SVG-based)
- **Database ORM**: Prisma ORM

### Database Strategy
- **Primary Option**: Free-tier Serverless Postgres (Neon)
- **Alternative Option**: Serverless SQLite (Turso)
- **Access Layer**: Prisma ORM
- **Resource Philosophy**: Minimize database calls; hardcode tool logic and content in components

### UI Guidelines
- **Design**: Modern, ultra-clean dark/light layout
- **Icons**: Strictly Lucide React SVG icons only
- **Emojis**: **PROHIBITED** - No emojis anywhere in the application
- **Consistency**: Clean, professional aesthetic throughout

### Image Strategy
- **Approach**: Static image assets + high-quality handcrafted AI prompts
- **Prohibited**: No dynamic canvas generation
- **Storage**: Static assets in `/public` directory

### SEO & Social Media
- **Implementation**: Native Next.js 15 Metadata API
- **OpenGraph**: Full support (Facebook/Tumblr compatible)
- **Twitter Cards**: Complete integration
- **Canonical URLs**: Proper canonical URL handling
- **Sitemap**: Static dynamic sitemap at `app/sitemap.ts`
- **Performance**: Server-side metadata generation

### Core Architecture Principles
1. **Performance First**: All tool logic and text content hardcoded in high-performance React components
2. **Resource Efficiency**: Prevent database resource exhaustion through strategic hardcoding
3. **Component Strategy**: Mix of client and server components for optimal performance
4. **Type Safety**: Full TypeScript coverage
5. **Scalability**: Design for free-tier constraints while maintaining professional quality

### Visual Component Patterns (Production-Grade Standards — Polishing Phase Final)
- **Horizontal Scroll Selector w/ Arrow Controls**: Template selectors use `overflow-x-auto` with `scrollbarWidth: thin / scrollbarColor: indigo transparent`. Left/right `<button>` overlays (absolute-positioned, rounded-full, shadow-md) call `scrollRef.current.scrollBy()`. Buttons are `w-20 h-20` for high touch-target accessibility. Applied to QR Code Generator content type selector.
- **Custom Canvas Rendering Engine**: Direct pixel-level manipulation using QRCode.create() matrix data. Enables rounded dot styles, transparent backgrounds, and gradient application to QR code pixels (not background). Canvas preview is hard-locked at `288×288px` via inline `style={{ width, height, minWidth, minHeight }}` to prevent layout jump on style changes (gradient, dot style toggles).
- **Fixed Color Picker Design**: All color inputs use strict `w-14 h-14 rounded-xl flex-shrink-0` dimensions with responsive hex text fields. Maintains visual consistency across all color controls.
- **Content Accent System**: Deep SEO guide content blocks feature `border-l-4 border-indigo-500` left accents with colored dot bullets in headers for enhanced readability and visual hierarchy.
- **Social Share Card Pattern**: Full-width card (`rounded-2xl`, gradient-bg, `p-5`) with left-aligned helper copy ("Found this tool helpful? Share it with others!") and right-aligned icon-only buttons (`w-10 h-10 rounded-lg`). Each button wrapped in `relative group` div for CSS-only tooltip: absolute `<span>` with `opacity-0 group-hover:opacity-100 transition-opacity` and a border-trick caret arrow beneath.
- **Header Icon Alignment**: Icon container uses `self-stretch` + `items-center justify-center` inside the flex row so it exactly fills the height of the text block (H1 + description) regardless of line count. Eliminates top/bottom misalignment.
- **Ad Slot Placeholder**: A `hidden xl:flex` dashed-border placeholder div (300×60px on XL, 728×90 target) is appended to the right of the header flex row for future responsive banner integration.

---

## Legacy Migration Roadmap — Fast-Track Launch Plan

### Context
All 146 legacy tool URLs from sitemap.xml have been mapped in `url-map.json` with 301 redirects configured. 33 tools are already implemented. The remaining 27 tool suites must be built before production launch. Priorities are ordered by SEO impact and user value.

### Priority 1 — Web & SEO (10 tools)
```
meta-tag-generator, open-graph-generator, domain-age-checker, domain-to-ip,
what-is-my-ip, ip-location, find-dns-record, ssl-checker, http-headers,
sitemap-generator
```
**Start**: Meta Tag Generator & Social Preview Suite — serves as the anchor tool with the highest SEO visibility.

### Priority 2 — Text & Generators (6 tools)
```
word-combiner, small-text-generator, rewrite-article, online-text-editor,
rgb-to-hex, credit-card-generator
```

### Priority 3 — Calculators (4 tools)
```
sales-tax-calculator, discount-calculator, adsense-calculator, probability-calculator
```

### Priority 4 — Master Converters (1 tool)
```
master-unit-converter
```

### Priority 5 — Media & Assets (6 tools)
```
png-to-jpg, image-resizer, image-compressor, favicon-generator,
svg-converter, heic-to-jpg
```

### Progress Summary
- **Completed**: 33 tools
- **Remaining**: 27 tool suites
- **Launch Criteria**: All 27 tools implemented, build verified, performance audit passed

---
*Last Updated: 2026-07-20 — Legacy Migration Launch Sprint*
