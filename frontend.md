# frontend.md: Open SaaS frontend style & structure

Source: https://github.com/wasp-lang/open-saas (MIT, © 2023 wasp-lang). Live showcase: https://opensaas.sh · Docs: https://docs.opensaas.sh
Purpose: a spec another building agent can follow to rebuild this look and page structure for a **different product**. Every product-specific string, image, link and number is marked with a **Replace:** line and collected in the §7 replace map.

---

## 0. Read this first

**What the style is.** A conventional, friendly SaaS marketing site in the Tailwind UI / shadcn mould: centred bold hero over two blurred amber→purple gradient blobs, a big product screenshot, an auto-scrolling "Used by" carousel, alternating text/visual feature rows, an emoji bento grid, masonry testimonials, an accordion FAQ, and a minimal footer. The palette is **navy + warm amber/peach** in light mode and **near-black + cream + sky blue** in dark mode, all as shadcn HSL tokens. A sticky navbar **morphs into a floating pill** once you scroll.

**There are two versions in this repo. Know which one you are copying.**

| | `template/app` (what you get from `wasp new -t saas`) | `opensaas-sh/app_diff` (the live opensaas.sh site) |
|---|---|---|
| Fonts | none set: Tailwind's default system sans | **Satoshi** (Black headings) + **mono for every `<p>`** |
| Hero | centred h1 + 2 buttons + banner screenshot | left-aligned h1 + 2 buttons, right side **orbiting logos** around "100% Open Source" |
| Highlighted features | 1 (`AIReady` placeholder) | 4: AI Ready, interactive **Auth** playground, Payments, Admin |
| Bento | placeholder emoji cards | real features with illustrations, a `highlight` card with radial gradient |
| Extra sections | none | **Roadmap** from GitHub issues |
| Extra tokens | none | `--shadow-outer`/`--shadow-inner` (neumorphic button/card), `.bg-radial-gradient` |
| Copy | "Some *cool* words about your product" placeholders | Open SaaS's real copy and real testimonials |

`opensaas-sh` is stored only as `.diff` files against the template (patched with `tools/patch.sh`), so it does not run on its own. This spec documents the **template as the base** and marks the opensaas.sh additions as **[showcase]** upgrades you can choose to adopt.

**Licence.** MIT for the code. Do **not** carry over: the Wasp logo (`static/logo.svg`, yellow `#f5c842` square), the "Da Boi" mascot avatar, the Open SaaS banners and screenshots, the example-app screenshots (Kivo, Messync, PromptPanda, …), or third-party brand logos (`landing-page/logos/*`: Salesforce, OpenAI, Astro, Prisma, React, shadcn; Stripe/Node/Tailwind webp). **Satoshi is not MIT**: it is a Fontshare font under the ITF Free Font License; download your own copy if you use it. **The opensaas.sh testimonials are real, named people with their photos: never reuse them, and never fill this section with invented quotes presented as real.** Use real customer quotes or remove the section.

**Caveats an agent must know before copying:**

1. **Framework.** Wasp ^0.26 (config in TypeScript, `main.wasp.ts` + `src/**/*.wasp.ts`), React 19, React Router 8, Vite 8, **Tailwind v4** (CSS-first `@theme inline` in `src/client/Main.css`, no `tailwind.config`). Landing and pricing routes are **prerendered**. If you rebuild outside Wasp, replace `wasp/client/router` `Link`/`routes`, `useAuth`, `useQuery` with your router/auth/data layer.
2. **`components.json` is stale**: it points shadcn at `tailwind.config.cjs`, which does not exist in Tailwind v4. `shadcn add` will need the config path fixed.
3. **Undefined classes (silent no-ops)**, leftovers from an earlier TailAdmin-based admin: `dark:bg-boxdark-2` (footer), `text-bodydark` (404), `bg-meta-1`, `dark:bg-meta-4`, `border-stroke`, `dark:border-strokedark`, `text-card-faded-foreground` (card `faded` variant), and `max-w-8xl` (hero; not a v4 default). `animate-accordion-up/down` on the accordion come from shadcn's old config and are **not** defined by `tailwindcss-animate` here, so the FAQ most likely opens without its height animation. Verify in a build, then define or delete.
4. **Dead code.** `Clients.tsx` (logo wall) and `Features.tsx` (dl list) are not rendered; `Features.tsx` is imported only for its `Feature` type. Most of the `@theme` extras (`--text-title-*`, `--max-height-*`, `--min-width-*`, `--z-index-*`, `--shadow-1…8`, `--animate-rotating`, `.chat-height`, `.inbox-height`) serve the admin dashboard, not the landing.
5. **Colour mode** is stored in `localStorage("color-theme")`, defaults to **light**, ignores `prefers-color-scheme`, and adds `.dark` to **`<body>`** inside a `useEffect`. On prerendered pages a dark-mode user sees a light flash first. The custom variant is `@custom-variant dark (&:where(.dark, .dark *))`.
6. **No reduced-motion handling anywhere** (no `prefers-reduced-motion`, no `motion-safe`). The carousel auto-advances with smooth scrolling and the showcase orbit spins forever.
7. **Light-mode contrast failures** (§2.3): white text on the amber `--accent` is **2.03:1**, and that is exactly what outline and ghost buttons show **on hover**, plus the announcement bar's left end and the 404 button. The hero text gradient starts at peach `--secondary-muted`, **1.54:1** on white.
8. **Typos in shipped copy**: test card "4242 4242 4242 4242 **4242**" on the pricing page (one group too many); mobile announcement "Star **the Our** Repo". Fix if you keep them.

---

## 1. Stack & file map

| Layer | Choice |
|---|---|
| Framework | Wasp ^0.26 (React 19 + Node + Prisma), React Router 8, Vite 8, TypeScript |
| Styling | Tailwind **v4** + `@tailwindcss/forms`, `@tailwindcss/typography`, `tailwindcss-animate`; `prettier-plugin-tailwindcss` |
| Components | shadcn/ui "new-york" style on Radix primitives (`src/client/components/ui/*`), `cva` + `cn()` (`clsx` + `tailwind-merge`) |
| Icons | `lucide-react` (+ `react-icons/fa` in the showcase Auth demo) |
| Charts | ApexCharts (admin only) |
| Forms | react-hook-form + zod |
| Payments | Stripe / Lemon Squeezy / Polar (pick one) |
| Other UI | `vanilla-cookieconsent` banner, Radix toast (`<Toaster position="bottom-right"/>`) |

```
template/app/
  main.wasp.ts                 routes: "/" LandingPage (prerender), "*" NotFound; app.client.rootComponent = App
  src/client/
    Main.css                   ALL tokens (@theme inline + :root/.dark HSL vars) + gradient utilities
    App.tsx                    shell: NavBar (marketing vs demo links) + max-w-(--breakpoint-2xl) wrapper + Toaster + CookieConsent
    head.wasp.ts               <head> meta / OG / Plausible
    components/NavBar/         NavBar.tsx (morphing sticky bar) · Announcement.tsx · constants.ts (nav items)
    components/ui/             shadcn: accordion alert avatar button card checkbox dialog dropdown-menu form input label progress select separator sheet switch textarea toast
    components/DarkModeSwitcher.tsx · NotFoundPage.tsx · cookie-consent/
    hooks/useColorMode.ts useLocalStorage.ts useIsLandingPage.ts
    static/                    logo.svg, open-saas-banner-{light,dark}.svg, assets/*.webp, examples/*.webp, logos/*.webp
  src/landing-page/
    LandingPage.tsx            section order
    contentSections.tsx        ALL landing data: features, testimonials, faqs, footerNavigation, examples
    ExampleHighlightedFeature.tsx   AIReady placeholder
    components/  Hero · ExamplesCarousel · HighlightedFeature · FeaturesGrid · Testimonials · FAQ · Footer · SectionTitle · SchemaMarkup · (Clients, Features: unused)
  src/payment/PricingPage.tsx  /pricing
  src/auth/                    /login /signup /request-password-reset /password-reset /email-verification (AuthPageLayout)
  src/user/AccountPage.tsx     /account
  src/demo-ai-app/             /demo-app (AI scheduler demo)
  src/file-upload/             /file-upload
  src/admin/                   /admin, /admin/users, /admin/settings, /admin/calendar, /admin/ui/buttons, /admin/messages
opensaas-sh/app_diff/          [showcase] diffs: Hero/Orbit, Examples/{AIReady,Auth,Payments,Admin}, Roadmap*, Main.css (Satoshi, shadows), card/button variants, RepoInfo in nav
```

**The content/presentation split is the most reusable idea**: every landing list lives in `contentSections.tsx` as typed data; components only render. Rebranding the template is mostly editing that one file plus the hero.

---

## 2. Colour tokens

### 2.1 Tokens (Main.css; HSL triplets consumed as `hsl(var(--x))`)

| Token | Light | ≈ hex | Dark | ≈ hex | Role |
|---|---|---|---|---|---|
| `--background` | `0 0% 100%` | #ffffff | `210 50% 5%` | #060d13 | page |
| `--foreground` | `0 0% 3.9%` | #0a0a0a | `0 0% 98%` | #fafafa | text |
| `--card` | `0 0% 100%` | #fff | `210 50% 5%` | #060d13 | cards |
| `--card-accent` | `0 0% 100%` | #fff | `31 57% 93%` | #f7ede3 | accent card |
| `--card-subtle` | `31 57% 96%` | #fbf5ef | `233 24% 15%` | #1d1f2f | **bento tiles** |
| `--primary` | `210 100% 13%` | **#002142 navy** | `31 57% 93%` | **#f7ede3 cream** | primary button, links, check icons |
| `--primary-foreground` | `0 0% 98%` | | `0 0% 9%` | | text on primary |
| `--secondary` | `32 100% 37%` | **#bd6500 amber** | `209 91% 61%` | **#419ff6 sky** | gradient end |
| `--secondary-muted` | `32 75% 78%` | #f1ca9d peach | `210 67% 94%` | ice | gradient start |
| `--muted` | `0 0% 96.1%` | #f5f5f5 | `210 100% 13%` | #002142 | wells, switch track |
| `--muted-foreground` | `0 0% 45.1%` | #737373 | `0 0% 63.9%` | #a3a3a3 | secondary text |
| `--accent` | `33 74% 62%` | **#e6a556** | `31 57% 93%` | cream | hover bg (outline/ghost), announcement start |
| `--accent-foreground` | `0 0% 98%` | white ⚠ | `210 100% 13%` | navy | text on accent |
| `--destructive` | `0 84.2% 60.2%` | #ef4444 | `0 62.8% 63%` | | errors |
| `--success` / `--warning` | `141 71% 48%` / `36 100% 50%` | | same | | demo-app status tints |
| `--border` / `--input` | `0 0% 89.8%` | #e5e5e5 | `0 0% 14.9%` | #262626 | lines |
| `--ring` | `0 0% 3.9%` | | `0 0% 83.1%` | | focus ring |
| `--radius` | `0.5rem` | | | | `lg`=r, `md`=r-2px, `sm`=r-4px |

Note the **role swap between modes**: light primary is navy and the accent is amber; dark primary is cream and the gradient turns blue. The brand reads "navy + amber" by day and "cream + sky" by night. Keep that swap when you pick your own pair.

**Gradient utilities (Main.css):**
```css
@utility text-gradient-primary { background: linear-gradient(to right, hsl(var(--secondary-muted)), hsl(var(--secondary)));
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
@utility text-gradient-primary-diagonal { /* same, 135deg */ }
@utility border-gradient-primary { background: linear-gradient(to right, hsl(var(--secondary-muted)), hsl(var(--secondary))); padding: 1px; & > * { background: hsl(var(--background)); } }
```
**Hero blobs** (hard-coded Tailwind colours, not tokens): `bg-linear-to-tr from-amber-400 to-purple-300 opacity-10 blur-3xl` clipped to a polygon (top-right) and an ellipse (lower-left), `-z-10`, `aria-hidden`, `dark:hidden`.

**[showcase] additions:** `--font-satoshi`; `--shadow-outer`/`--shadow-inner` (stacked inset highlights from `--background` and inset shadows tinted with `--primary`, giving a soft pressed/raised look; used on the primary button, `outer`/`inner` card and button variants, and `bentoHighlight`); `.bg-radial-gradient` (light: `radial-gradient(circle at 30% 30%, card-accent/.5, accent/.15)`; dark: `card-subtle/.8 → card`).

### 2.2 Colour rules
- Neutral body (white or near-black), colour only in: the primary button, the hero gradient word, the announcement bar, check icons, link hovers (`hover:text-primary`), bento tile tint, and the blurred blobs.
- The amber/peach warmth is the brand signal in light mode; **one** gradient word per headline at most.
- Images come in light and dark pairs toggled with `dark:hidden` / `hidden dark:block`.
- Hard-coded grays (`text-gray-600/900`, `ring-gray-900/10`) still exist in the footer, auth pages and the hero image ring; map them to tokens when rebuilding.

### 2.3 Measured contrast (WCAG 2.x)

| Pair | Ratio | Verdict |
|---|---|---|
| L foreground on background | 19.80 | AAA |
| L muted-foreground on background | 4.74 | AA |
| L muted-foreground on `--muted` | **4.35** | ✗ (just under) |
| L muted-foreground on `--card-subtle` (bento descriptions) | **4.38** | ✗ (just under) → use `0 0% 40%` (5.30) |
| L primary-foreground on primary (default button) | 15.48 | AAA |
| L navy primary as text | 16.17 | AAA |
| L **white on accent** (outline/ghost **hover**, 404 button, announcement left end) | **2.03** | ✗ → set light `--accent-foreground` to navy (7.62) |
| L white on secondary (announcement right end) | 4.02 | ✗ for its 14-16px semibold text |
| L secondary amber as text (gradient end) | 4.20 | ok at hero size (≥3:1 large) |
| L **secondary-muted peach as text (gradient start)** | **1.54** | ✗ even for large text → start the gradient at `--accent` or darker |
| L white on destructive | **3.60** | ✗ for small button/toast text → `0 72% 45%` |
| L white on success / warning | 1.93 / 2.05 | ✗ (only used as 10% tints in the template; never put text on the solid colour) |
| L faded carousel card (50% opacity) text | 3.72 | inactive state, decorative |
| L footer `gray-600` links | 7.56 | AA |
| D foreground on background | 18.72 | AAA |
| D muted-foreground on bg / muted / card-subtle | 7.75 / 6.41 / 6.44 | AA |
| D primary-foreground on cream primary | 15.58 | AAA |
| D sky secondary as text | 6.97 | AA |
| D navy on cream accent | 14.05 | AAA |
| D white on destructive | **3.29** | ✗ |
| border / input lines (both modes) | 1.26 / 1.29 | inputs rely on the border alone: acceptable only with a visible focus ring |

---

## 3. Typography

**Template:** no font is loaded; everything uses Tailwind's default `font-sans` (system UI stack). Hierarchy is weight and size only.

| Role | Classes |
|---|---|
| Hero h1 | `text-5xl sm:text-6xl font-bold text-foreground`, one *italic* word + one `text-gradient-primary` phrase |
| Hero sub | `text-lg leading-8 text-muted-foreground max-w-2xl mx-auto mt-6` |
| Section title (`SectionTitle`) | `text-4xl sm:text-5xl font-bold tracking-tight mt-2` (rendered as **h3**, see §9) + `text-lg leading-8 text-muted-foreground mt-4` |
| Highlighted feature title | `text-4xl font-bold mb-2` (h2) |
| FAQ title | `text-2xl font-bold leading-10 tracking-tight` |
| "Used by:" label | `font-semibold tracking-wide text-muted-foreground` |
| Card title | shadcn `CardTitle`: `font-semibold leading-none tracking-tight` (bento) / `text-sm` (testimonials) |
| Card description | `text-xs leading-relaxed text-muted-foreground` (bento), `text-xs` (carousel) |
| Testimonial quote | `text-sm italic` |
| Price | `text-4xl font-bold tracking-tight` + `/month` `text-sm font-semibold muted` |
| Buttons | `text-sm font-medium` |
| Nav links | `text-sm font-normal leading-6`, brand `font-semibold text-sm → text-xs` when scrolled |

**[showcase] typography** (this is what makes opensaas.sh look distinct):
```css
h1,h2,h3,h4,h5,h6 { @apply font-satoshi font-black leading-tight; }
p { @apply font-mono text-base leading-relaxed; }
```
Hero h1 becomes `text-5xl md:text-6xl font-extrabold leading-none` with the gradient word `font-black`; hero sub `font-mono text-md`. Satoshi loaded via `@font-face` (Light 300 / Regular / Medium 500 / Bold / Black 900, `font-display: swap`) from `/fonts/*.woff2`. A heavy geometric display face over monospace body copy gives the "developer tool" feel. Note the blanket `p { font-mono }` rule also hits every paragraph in the app and admin.

---

## 4. Surface grammar & components

**Buttons** (`ui/button.tsx`, cva):
- base: `inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50 [&_svg]:size-4`
- variants: `default` (bg-primary, shadow, hover /90) · `outline` (border-input bg-background shadow-sm, **hover bg-accent + accent-foreground**) · `secondary` · `ghost` · `destructive` · `link`
- sizes: `default h-9 px-4` · `sm h-8 px-3 text-xs` · `lg h-10 px-8` · `icon h-9 w-9`
- `asChild` (Radix Slot) wraps router links.
- [showcase]: default uses `shadow-outer`; ghost becomes `hover:bg-muted text-muted-foreground`; adds `selected`, `outer`, `inner` variants and `iconLg h-12 w-12`.
- Hero pairing: **outline first, primary second** ("Learn More" then "Get Started →"), arrow as text `→` or `<ArrowRight/>`.

**Cards** (`ui/card.tsx`): base `rounded-xl border shadow hover:shadow-lg transition-all duration-300`. Variants: `default` (bg-card) · `accent` (card-accent, hover `scale-[1.02]`) · `faded` (`scale-95 opacity-50`, used for non-current carousel cards) · `bento` (card-subtle, no border/shadow, hover `scale-[1.02]`) · [showcase] `bentoHighlight`, `outer`, `inner`. Subparts: `CardHeader p-6 space-y-1.5`, `CardContent p-6 pt-0`, `CardFooter flex items-center p-6 pt-0`.

**Other recurring pieces:**
- Product image frame: `rounded-md shadow-2xl ring-1 ring-gray-900/10` inside `rounded-xl lg:rounded-2xl lg:p-4 lg:-m-4`.
- FAQ item: bordered `rounded-lg border px-6 py-2 hover:bg-muted/20`, trigger `text-base font-semibold leading-7 hover:text-primary`, chevron rotates 180°; optional "Learn more →" link in `text-primary`.
- Testimonial: card, italic quote, footer link with 40px round avatar (`ring-2 ring-border/20 group-hover:ring-primary/30`), name + role truncated.
- Pricing card: best plan gets `ring-2 ring-primary bg-transparent` plus a blurred `from-primary/40 via-primary/20 to-primary/10` glow behind; others `ring-1 ring-border lg:my-8` (so the featured card stands taller); feature rows with `CheckCircle text-primary`.
- Dark-mode switch: 56×30 `bg-muted` pill with a white knob sliding right, sun (amber fill) / moon (slate fill) cross-fading; a transparent checkbox on top carries `aria-label="Toggle dark mode"`.
- Mobile menu: shadcn `Sheet` from the right, 300/400px, links in a `divide-y` list.

---

## 5. Layout & breakpoints

- Tailwind breakpoints plus extras: `2xsm 375`, `xsm 425`, `sm 640`, `md 768`, `lg 1024`, `xl 1280`, `2xl 1536`, `3xl 2000`.
- App shell: `<div class="bg-background text-foreground min-h-screen">` → NavBar → `<div class="max-w-(--breakpoint-2xl) mx-auto">` (1536px cap) → page. The admin dashboard bypasses this shell and uses its own sidebar layout.
- Section containers vary: `max-w-7xl px-6 lg:px-8` (features, testimonials, footer, pricing), `max-w-6xl px-8 md:px-4` (highlighted features), `max-w-4xl lg:max-w-7xl` (FAQ), `max-w-3xl` (hero copy). The carousel breaks out to full viewport width with `relative left-1/2 w-screen -translate-x-1/2`.
- Vertical rhythm is large and uneven: hero `pt-14 md:p-24`, carousel `my-16`, highlighted features **`my-50`** (12.5rem), features grid `my-16 md:my-24 lg:my-40`, testimonials `mt-32 sm:mt-56`, FAQ `mt-32 lg:py-32`, footer `py-24 sm:mt-32`.

### Navbar (marketing pages)
```
[ Announcement gradient bar (landing only) ]
[logo 32px + "Your SaaS"] [Features · Pricing · Documentation · Blog (≥lg)]      [dark switch] [Log in ⇥]  | ☰ (<lg)
```
- `header.sticky top-0 z-50 transition-all duration-300`; scroll listener (throttled 50ms) sets `isScrolled = scrollY > 0`.
- **Unscrolled**: full width, `bg-background/80 backdrop-blur-lg border-b`, nav `p-6 lg:px-8`, logo `size-8`, brand `text-sm`.
- **Scrolled**: `top-4`, `mx-4 md:mx-20 rounded-full border shadow-lg bg-background/90 backdrop-blur-lg`, nav `p-3 lg:px-6`, logo `size-7`, brand `text-xs`, Log-in icon shrinks. All transitions 300ms. This morph is the template's signature interaction.
- Nav sets: marketing (`/` and `/pricing`) shows Features (`/#features`), Pricing, Documentation, Blog; every other page shows the demo links (AI Scheduler, File Upload, Documentation, Blog). External links open in a new tab.
- Right side: logged out → "Log in" + `LogIn` icon; logged in → `UserDropdown`.
- Hidden on `/login` and `/signup`.
- **Announcement** (landing only): `bg-linear-to-r from-accent to-secondary text-primary-foreground p-3 font-semibold text-center`; desktop shows message · 2px divider · pill link (`bg-background/20 rounded-full px-2.5 py-1 text-xs`); mobile shows one pill.
- [showcase]: scrolled margins `mx-4 lg:mx-10 xl:mx-30`; adds `RepoInfo` (GitHub stars) next to the switch; "Log in" becomes "Demo App".

---

## 6. Landing blueprint (`src/landing-page/LandingPage.tsx`)

```tsx
<div className="bg-background text-foreground">
  <SchemaMarkup />                       // JSON-LD
  <main className="isolate">
    <Hero />
    <ExamplesCarousel examples={examples} />
    <AIReady />                          // one HighlightedFeature   [showcase: AIReady, Auth, Payments, Admin]
    <FeaturesGrid features={features} /> // id="features"
                                         // [showcase: <Roadmap /> id="roadmap"]
    <Testimonials testimonials={testimonials} />
    <FAQ faqs={faqs} />
  </main>
  <Footer footerNavigation={footerNavigation} />
</div>
```
All sections share one background; separation comes from whitespace, not alternating bands.

### 6.1 Hero (`components/Hero.tsx`)
```
<div relative w-full pt-14>
  <TopGradient/> <BottomGradient/>                      blurred amber→purple blobs, opacity-10, light mode only
  <div md:p-24><div max-w-8xl(no-op) mx-auto px-6 lg:px-8>
    <div mx-auto max-w-3xl text-center lg:mb-18>
      <h1>Some <i>cool</i> words about <span.text-gradient-primary>your product</span></h1>
      <p>With some more exciting words about your product!</p>
      <div mt-10 flex justify-center gap-x-6>
        [Learn More] outline lg → /pricing       [Get Started →] default lg → /signup
    <div mt-14 flow-root>
      <div hidden md:flex justify-center lg:-m-4 lg:p-4 rounded-xl lg:rounded-2xl>
        <img banner-light 1000×530 dark:hidden/>  <img banner-dark hidden dark:block/>
```
- The screenshot is **hidden below 768px**, so mobile visitors see text and buttons only.
- [showcase] Hero: `max-w-7xl flex-col lg:flex-row`, copy left-aligned on md+ (`text-center md:text-left`), h1 "The *free* SaaS template with **superpowers**", mono sub with a bold inline link, buttons "Try the Demo App" (outline, → demo or login) + "Get Started →" (default, → docs). Right column (`hidden lg:block`) is **`Orbit`**: a 500×500 box with "100%" (gradient, `text-6xl font-black`) over "Open Source" in the centre, 4 thin rings (radius 120/180/240/300, each a 1-2px ring cut from a `conic-gradient` of `--primary` at 0-20% alpha using a radial mask, spinning 180-720s), and tech logos riding 3 of the rings (orbit 72/120/180s) with a counter-rotation so logos stay upright. Inline `<style>` keyframes `ring-spin`, `orbit-spin`, `orbit-counter-spin`.

**Replace:** h1 (keep the pattern: plain words + one *italic* word + one gradient phrase), sub, both CTA labels/routes, the light/dark banner pair (your real product screenshot, ~1000×530), blob colours if your brand isn't warm. For the showcase orbit, swap the centre stat and the logos for **your own integrations or customers' logos only where you have permission**, never third-party marks implying endorsement.

### 6.2 "Used by" carousel (`ExamplesCarousel.tsx`)
- Full-bleed strip, `my-16`; label `h2` "Used by:" in muted semibold.
- Horizontal `snap-x snap-mandatory overflow-x-auto scroll-smooth no-scrollbar gap-4 px-4 pb-10 pt-4` row of cards (`w-[280px] sm:w-[320px] md:w-[350px]`, hover `scale-105`): 16:9 screenshot (`object-cover object-top`), bold name, `text-xs` muted description. Each card is an external link (`target=_blank`).
- Behaviour: an IntersectionObserver (`threshold .5`, rootMargin `-200px 0px -100px 0px`) starts a **3s auto-advance** while in view; the current card is `default`, others `faded` (`scale-95 opacity-50`); the strip smooth-scrolls to centre the current card; hovering a card makes it current and restarts the timer.

**Replace:** `examples` in `contentSections.tsx` (`name, description, imageSrc, href`) with **real** customer products or your own templates/use cases, and the label ("Used by:" only if true; otherwise "Built with it:", "Templates", "Examples").

### 6.3 Highlighted feature(s) (`HighlightedFeature.tsx`)
```tsx
<HighlightedFeature name description highlightedComponent direction="row"|"row-reverse" tilt?="left"|"right" />
```
- Layout: `my-50 mx-auto max-w-6xl flex flex-col md:flex-row(-reverse) items-center justify-between gap-x-20 gap-y-10 px-8 md:px-4`. Left half: `h2 text-4xl font-bold` + muted description (string or any node). Right half: the visual, optionally tilted `rotate-1`/`-rotate-1`.
- Template ships one: `AIReady` ("Example Feature Highlight" / "Yo! Use this component to show off the most important features in your app.") with a light/dark image pair, `row-reverse`.
- [showcase] four stacked rows, alternating direction: **AI Ready** (row-reverse, image), **"DIY Auth Done for you"** (tilt left, `h-100`; the description is an interactive playground of provider toggle buttons Google/GitHub/Discord/Slack and the visual is a live mock login card that adds/removes provider buttons), **Payments** (row-reverse, image), **Admin Dashboard** (row, image). Adds `id`, `className`, `url` (title becomes a link), `scroll-mt-24`.

**Replace:** one row per headline capability (2-4 rows), alternating `direction`. Prefer a small **interactive** demo (like the Auth playground) for at least one row; it is the most convincing pattern on the page.

### 6.4 Features bento (`FeaturesGrid.tsx`, `id="features"`)
- Wrapper `mx-auto my-16 md:my-24 lg:my-40 max-w-7xl`; `SectionTitle` "Features" / "These are some of the features of the product."
- Grid: `grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 auto-rows-[minmax(140px,auto)] gap-4 mx-4 md:mx-6 lg:mx-8`.
- Item sizes: `small` = 1 col · `medium` = 2 cols · `large` = 2 cols × 2 rows. Card variant `bento` (warm `--card-subtle` tint, no border, hover scale 1.02 + shadow), content centred; `fullWidthIcon` (template default true) shows a big emoji/icon above the title, otherwise icon and title sit side by side (`direction`, `align`). Items with `href` become external links.
- Template data: 9 placeholder items "Cool Feature 1-9" with emojis 🤝 🔐 🥞 💸 💼 📈 📧 🤖 🚀, sizes `S S M L L S S M M` (fills a 6-col grid as 2 rows of 6 with two 2×2 blocks).
- [showcase]: real features with illustration images (`fullWidthIcon`, `col-reverse` for image-below), one `highlight` card ("Open SaaS / Try the demo app", `bentoHighlight` + radial gradient, moved last on mobile via `order-last md:order-none`).

**Replace:** `features` array (`name, description, emoji | icon, href?, size, direction?, align?, fullWidthIcon?`). Plan sizes so each 6-col row sums to 6 and large tiles pair up; check the 2-col mobile and 4-col tablet packing too.

### 6.5 Testimonials (`Testimonials.tsx`)
- `mx-auto mt-32 sm:mt-56 max-w-7xl`, `SectionTitle` "What Our Users Say".
- **Masonry with CSS columns**: `columns-1 md:columns-2 lg:columns-3 gap-2 md:gap-6`, each card `mb-6 break-inside-avoid`.
- Template: if there are more than 5, mobile shows 3 plus a "Show N More / Show Less" button (`text-primary bg-primary/10 rounded-lg`). [showcase] removes that and shows all.
- Template data: 3 joke placeholders ("Da Boi, Wasp Mascot: I don't even know how to code. I'm just a plushie." etc.).

**Replace:** `testimonials` (`name, role, avatarSrc, socialUrl, quote`) with **real, attributable** quotes you have permission to use. If you have none yet, delete the section rather than writing fake ones.

### 6.6 FAQ (`FAQ.tsx`)
- `mx-auto mt-32 max-w-4xl lg:max-w-7xl px-6 lg:px-8 lg:py-32`; centred `h2` "Frequently asked questions".
- Radix `Accordion type="single" collapsible`, each item a bordered rounded card (`space-y-4`); answer in muted `text-base leading-7` with an optional "Learn more →" link.
- Template data: one item ("Whats the meaning of life?" → "42.").

**Replace:** `faqs` (`id, question, answer, href?`), 5-8 real questions (pricing, data, cancellation, support, integrations).

### 6.7 Footer (`Footer.tsx`)
- `mx-auto mt-6 max-w-7xl px-6 lg:px-8` → `footer.border-t border-gray-900/10 dark:border-gray-200/10 py-24 sm:mt-32`, sr-only `h2` "Footer".
- Only two **right-aligned** link columns (`flex justify-end gap-20`): **App** (Documentation, Blog) and **Company** (About → wasp.sh, Privacy `#`, Terms of Service `#`). Headings `text-sm font-semibold`, links `text-sm text-gray-600 hover:text-gray-900`.
- No logo, copyright, or social links.

**Replace:** `footerNavigation.app` and `.company` (real Privacy/Terms URLs, not `#`). Consider adding brand + copyright on the left; the template leaves that side empty.

### 6.8 [showcase] Roadmap (`Roadmap.tsx`, `id="roadmap"`)
- Server query `getGithubRoadmap` reads GitHub epics; renders loading (`Loader2 animate-spin text-yellow-500`), error, empty ("No roadmap items yet. Add your idea here."), or a 4-column status board (`RoadmapStatusColumn` → `RoadmapEpicCard`). Header "The Roadmap" / "High-level topics we are planning and working on."

**Replace:** data source (your issue tracker or a static list) and copy, or omit.

### 6.9 SEO
`SchemaMarkup` emits JSON-LD (`SoftwareApplication` + `WebSite`, placeholders `your-saas-app.com`, price "0"). `head.wasp.ts` holds description/author/keywords/OG/Twitter meta and Plausible scripts (Google Analytics is loaded only after cookie consent).

**Replace:** every `your-saas-app.com`, name, description, OG image (`public-banner.webp`, 800×400), Plausible `data-domain`.

### 6.10 Other pages (structure only)
- **`/pricing`** (`PricingPage`): centred h2 "Pick your <span class=text-primary>pricing</span>", muted sub explaining providers + a mono test-card pill, optional destructive `Alert`, a 3-col grid (`max-w-md` stacked on mobile) of plan cards: Hobby $9.99/month, **Pro $19.99/month (featured: ring-2 + glow, not pushed down)**, 10 Credits $9.99 one-time. CTA per card: "Buy plan" / "Log in to buy plan", or "Manage Subscription" (customer portal) for subscribers. Data in `paymentPlanCards` (`name, price, description, features`) + `paymentPlans` (subscription vs credits).
- **Auth** (`/login`, `/signup`, reset, verify): `AuthPageLayout` = centred `max-w-md` white card `shadow-xl ring-1 ring-gray-900/10 sm:rounded-lg` holding Wasp's built-in `LoginForm`/`SignupForm` + underlined helper links. The card is forced white even in dark mode. No navbar on login/signup.
- **`/account`**: card with a `divide-y` list of label/value rows (email, username, plan, credits, About) and a manage/upgrade action.
- **`/demo-app`**: AI day-scheduler demo (task input, list, generated schedule table, status tints using `success/warning/destructive` at 10%).
- **`/file-upload`**: S3 presigned upload form + file list.
- **`/admin/*`**: sidebar + sticky header dashboard (analytics cards with 46px muted icon circles and `text-title-md` numbers, ApexCharts revenue chart, sources table, users table with filters, settings form, calendar, buttons showcase, messages). Uses the admin-only `@theme` tokens.
- **404**: centred "404" `text-6xl font-bold`, "Oops! The page you're looking for doesn't exist.", accent button "Go Back Home" (→ demo app if logged in, else landing).
- **Cookie consent**: `vanilla-cookieconsent` bottom banner; analytics scripts gated on accept.

---

## 7. Replace map

| What | Where | Current value | Replace with |
|---|---|---|---|
| App name/title | `main.wasp.ts` `name`, `title` | "OpenSaaS", "My Open SaaS App" | yours |
| Brand text | `NavBar.tsx` (2×, incl. sr-only), `NavLogo` alt | "Your SaaS", "Your SaaS App" | yours |
| Logo | `src/client/static/logo.svg`, `public/favicon.ico` | Wasp yellow logo | your mark |
| Announcement | `Announcement.tsx` `ANNOUNCEMENT_URL` + 3 strings | "Support Open-Source Software!", "Star Our Repo on Github ⭐️ →" | launch/news line, or delete the component |
| Nav links | `NavBar/constants.ts` | Features, Pricing, Documentation, Blog / AI Scheduler, File Upload | your marketing + app links |
| Docs/Blog URLs | `shared/common.ts` | docs.opensaas.sh(/blog) | yours |
| Hero h1/sub/CTAs | `landing-page/components/Hero.tsx` | "Some *cool* words about your product" … Learn More / Get Started | headline + value prop + 2 CTAs |
| Hero image | `static/open-saas-banner-{light,dark}.svg` | Open SaaS banner | your screenshot pair |
| Hero blobs | `Hero.tsx` `TopGradient`/`BottomGradient` | amber-400 → purple-300, 10% | your brand pair |
| Carousel | `contentSections.tsx` `examples` + `ExamplesCarousel` label | 7 "Example #n" with real apps' screenshots | real customers or use cases |
| Highlighted features | `ExampleHighlightedFeature.tsx` (template) or `components/Examples/*` (showcase) | "Example Feature Highlight" | 2-4 key capabilities with visuals |
| Bento | `contentSections.tsx` `features` + `FeaturesGrid` SectionTitle | "Cool Feature 1-9" | your feature list |
| Testimonials | `contentSections.tsx` `testimonials`, `static/da-boi.webp` | mascot jokes (template) / real people (showcase) | your real quotes, or remove |
| FAQ | `contentSections.tsx` `faqs` | "Whats the meaning of life?" | your questions |
| Footer | `contentSections.tsx` `footerNavigation` | Documentation, Blog, About (wasp.sh), Privacy `#`, Terms `#` | your links |
| Pricing | `payment/PricingPage.tsx` `paymentPlanCards`, heading/sub, `bestDealPaymentPlanId`; `payment/plans.ts` | Hobby / Pro / 10 Credits | your plans + provider IDs |
| SEO | `head.wasp.ts`, `SchemaMarkup.tsx` | `your-saas-app.com`, placeholders | your domain, copy, OG image |
| 404 copy | `client/components/NotFoundPage.tsx` | "Oops! …" | yours |
| Colours | `Main.css` `:root` / `.dark` | navy/amber (light), cream/sky (dark) | your two-colour pair per mode |
| [showcase] fonts | `Main.css` `@font-face`, `public/fonts` | Satoshi (ITF licence) | your licensed display + mono pair |
| [showcase] Orbit | `components/Hero/Orbit.tsx` | "100% Open Source" + 9 tech logos | your stat + your own integration icons |
| [showcase] Roadmap | `Roadmap*.tsx`, `operations.ts` | GitHub epics | your roadmap or omit |

---

## 8. Motion

- Default durations: `transition-all duration-300` (navbar, cards, highlighted rows), `duration-200` (carousel cards, FAQ, testimonials), `duration-500` (nav logo).
- Hover: cards `hover:shadow-lg`, bento/accent `hover:scale-[1.02]`, carousel `hover:scale-105`, links `hover:text-primary`, buttons `/90` background.
- Navbar morph on first scroll (300ms, see §5).
- Carousel: 3s auto-advance + smooth `scrollTo` centring, only while visible.
- Accordion chevron rotate 180°; height animation intended via `animate-accordion-*` (probably undefined, §0.3).
- Dark-mode knob slide + icon cross-fade 300ms.
- [showcase] Orbit: linear infinite rotations 72-720s.
- No entrance/scroll-reveal animations at all; the page is static apart from the above. **Add `motion-safe:`/`motion-reduce:` guards** to the carousel (no auto-advance, `scroll-behavior: auto`) and the orbit (`animation: none`) when you rebuild.

---

## 9. Accessibility & known issues

Good patterns to keep: Radix primitives (accordion, sheet, dropdown, dialog) with correct roles and focus handling; sr-only labels ("Open main menu", "Footer" heading, sr-only brand in the sheet); decorative blobs `aria-hidden`; arrows in CTAs `aria-hidden`; `aria-label="Toggle dark mode"`; visible `focus-visible:ring-1 ring-ring` on buttons; `loading="lazy"` images with alt text; pricing buttons `aria-describedby` the plan title.

| Issue | Detail | Fix |
|---|---|---|
| Outline/ghost hover text | white on amber `--accent` = 2.03:1 (also 404 button, mobile menu link hover) | light `--accent-foreground: 210 100% 13%` (navy, 7.62:1) |
| Announcement bar (light) | white on accent→secondary gradient 2.03-4.02:1 | navy text, or darken the gradient |
| Gradient headline start | peach `--secondary-muted` 1.54:1 | start from `--accent` or `--secondary` mixed darker |
| Muted text on tinted tiles | 4.35-4.38:1 on `--muted` / `--card-subtle` | `--muted-foreground: 0 0% 40%` |
| Destructive buttons/toasts | white on red 3.60 (light) / 3.29 (dark) | darker red, e.g. `0 72% 45%` |
| Heading order | `SectionTitle` renders **h3** for "Features" and "What Our Users Say" while sibling sections use h2 (and "Used by:" is an h2 label) | make `SectionTitle` an h2; demote "Used by:" to a `<p>` |
| Auto-advancing carousel | changes every 3s with no pause control (WCAG 2.2.2), keyboard focus on cards does not pause it (only mouse hover), no reduced-motion check | pause on focus/hover, add a pause button, disable under `prefers-reduced-motion` |
| Dark-mode flash | `.dark` added in `useEffect` on prerendered pages, ignores system preference | inline pre-hydration script that reads storage / `prefers-color-scheme` and sets the class on `<html>` |
| Mobile hero has no visual | screenshot `hidden md:flex` | show a cropped/compact image on mobile |
| Auth card in dark mode | forced `bg-white dark:bg-white` with gray text | tokenise (`bg-card`) or accept as intentional |
| Undefined classes | `boxdark-2`, `bodydark`, `meta-1/4`, `stroke`, `strokedark`, `card-faded-foreground`, `max-w-8xl`, `animate-accordion-*` | define in `@theme` or delete |
| Placeholder links | Privacy/Terms `href="#"`, testimonial `socialUrl: ""` renders an `<a href="">` | real URLs; render a `<div>` when there is no URL |
| Card `col-span` duplicated | bento size classes are applied to both the `<a>` wrapper and the inner Card | apply only to the grid child |

---

## 10. Copy voice

- **Template:** deliberately silly placeholders ("Some *cool* words", "It is cool", "My cats love it!", "42.") so nobody ships them by accident. Treat every string as a slot.
- **Showcase (opensaas.sh):** casual, developer-to-developer, playful: "The *free* SaaS template with **superpowers**", "DIY Auth Done for you", "Graphs! Tables! Analytics w/ Plausible or Google! All in one place. Ooooooooh.", "Deploy Anywhere. Easily.", "w/" abbreviations, emojis in the announcement and bento. Concrete claims about what is included ("pre-configured checkout and webhooks for Stripe, Polar.sh, and Lemon Squeezy").
- Headline pattern: plain words + an *italic* qualifier + a **gradient** payoff phrase.
- CTA pair: low-commitment outline ("Learn More", "Try the Demo App") then high-intent primary ("Get Started →").

---

## 11. Build checklist for an agent

1. React + Vite (or Wasp) + Tailwind v4 + shadcn/ui (new-york, neutral, CSS variables) + lucide. Fix `components.json` to point at your CSS entry.
2. Paste the §2.1 `:root`/`.dark` HSL tokens and the `@theme inline` colour mappings; apply the §9 contrast fixes (accent-foreground, muted-foreground, destructive). Add the three gradient utilities. Drop the admin-only theme extras unless you build the admin.
3. Implement colour mode with a pre-hydration script (class on `<html>`, honour `prefers-color-scheme`) plus the pill switch.
4. Build `NavBar` with the scrolled/unscrolled morph, marketing vs app link sets, Sheet mobile menu, and an optional gradient announcement bar.
5. Put all landing content in one typed `contentSections` file.
6. Build sections in order: Hero (blobs + centred copy + CTA pair + light/dark screenshot) → logo/example carousel → 1-4 `HighlightedFeature` rows alternating direction → bento grid (`small/medium/large`) → masonry testimonials (real only) → accordion FAQ → footer.
7. Pricing page with a featured middle plan (ring + glow, not offset) and per-state CTAs.
8. Auth pages in a centred `max-w-md` card; 404 with one CTA.
9. Optional [showcase] upgrades: a display font for headings + mono body, `shadow-outer` buttons, the Orbit hero, an interactive feature demo, a roadmap board.
10. Verify: 375px (hero still has a visual), heading order h1→h2, reduced motion stops the carousel/orbit, light and dark contrast re-measured, no `href="#"` left, no placeholder or borrowed testimonials.

---

## 12. Keep vs change

**Keep (this is the style):**
- shadcn token system with a **different brand pair per mode** (navy/amber light, cream/sky dark).
- Sticky bar that morphs into a floating rounded pill on scroll.
- One gradient phrase per headline; soft blurred colour blobs behind the hero only.
- Outline-then-primary CTA pair.
- Full-bleed snap carousel with a highlighted current card and faded neighbours.
- Alternating text/visual feature rows with very generous vertical spacing.
- Warm-tinted, borderless bento tiles in three sizes.
- CSS-columns masonry for testimonials.
- All marketing content as typed data in one file.

**Change for a new product:** every string, the logo, screenshots and example images, the blob and token colours, testimonials (real ones only), FAQ, footer links, pricing plans, SEO/OG placeholders; fix the contrast, heading and reduced-motion issues; delete the unused `Clients`/`Features` components and undefined classes.

**The idea to think hardest about:** the template's landing is a **slot machine**: generic, interchangeable sections fed from `contentSections.tsx`, which is why it is fast to rebrand and also why sites built on it look alike. The opensaas.sh version shows how to escape that without rebuilding: a distinctive type pairing (heavy display + mono body), one bespoke hero visual (the orbit), and one **interactive** highlighted feature (the Auth provider playground) that lets visitors poke the product instead of reading about it. When porting, keep the section skeleton but spend your effort on those three things for your own product.
