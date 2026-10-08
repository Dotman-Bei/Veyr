# Veyr logo

## Concept

A heavy geometric **V** with a flat-cut vertex, seated on a small **verdict block** exactly as wide as the vertex. The V is the letter, and it is also two arms converging on one decision. The block is that decision, written to a block on-chain.

In the **logo**, the mark is the "V" of **veyr**. The V's height equals the x-height of the lettering, so the verdict block sits below the baseline next to the descender of the "y". This makes the name read as one word instead of "v veyr", and the block works as a signature.

Flat colour only, no gradients. Every file is pure vector paths: the lettering is outlined from Outfit Bold (SIL Open Font License 1.1), so no font is needed to display it.

## Files

| File | Use |
|---|---|
| `veyr-logo.svg` | **Primary logo.** Ink + ember on light backgrounds |
| `veyr-logo-on-dark.svg` | Cream + bright ember on dark backgrounds |
| `veyr-logo-mono-black.svg` / `-mono-white.svg` | One-colour printing, embossing, overlays |
| `veyr-mark.svg` (+ `-on-dark`, `-mono-black`, `-mono-white`) | Mark alone, where the name is already present or space is square |
| `veyr-app-icon.svg` | App icon / favicon tile (also `public/favicon.svg`) |
| `veyr-app-icon-mono.svg` | One-colour tile; the mark is a true knockout (transparent) |
| `veyr-brand-sheet.png` | Overview of every variant and the favicon sizes |
| `png/` | 16–1024 px app icons, `favicon.ico` (16/32/48), 512 px mark, 1200 px logos |
| `source/` | Generator: `python3 brand/source/build_brand.py` (needs `fonttools brotli` and `npm install`) |

`src/components/brand/geometry.ts` is generated from the same source. The app's `<Logotype>`, `<LogoMark>` and `<AppIcon>` components use it, so the UI and these files can't drift apart.

## Colour

| Name | Hex | Use | Contrast |
|---|---|---|---|
| Ink | `#1E174F` | V and lettering on light; icon tile | 16.3:1 on white |
| Ember | `#B83A14` | Verdict block on light | 5.8:1 on white |
| Ember bright | `#E2622B` | Verdict block on Ink or dark backgrounds | 4.7:1 on Ink |
| Cream | `#F7F1E9` | V and lettering on dark | 14.5:1 on Ink |

Don't put standard Ember on Ink: it measures only 2.8:1. Use Ember bright there.

## Clear space and size

- **Clear space:** keep at least the width of the verdict block (¼ of the mark's width) free on every side.
- **Minimum size:** logo 64 px / 16 mm wide; mark 16 px; app icon 16 px (it was designed to read at favicon size).
- Below 24 px, prefer the app icon to the bare mark.

## Don't

- Re-type "veyr" in a font. Use the outlined files.
- Separate the block from the V, recolour it to match the V in the colour version, or move it.
- Add gradients, outlines, shadows or effects.
- Stretch, rotate, or rearrange the mark and lettering.
- Put the colour logo on mid-tone or busy backgrounds. Use a mono version instead.
