# BRIEF: Veyr core-flow walkthrough

**Spec:** `1920x1080@60, 121s (50 bars + 60 f tail), 100BPM, audio: synthesized, captions: burned-in + SRT`

## Ask
"Make a 2 min walkthrough of our core flow with captions," using the cinetic skill.

## Assumptions (inferred, not asked)
- **Product:** Veyr, a decentralized community forum on GenLayer. Every post is moderated by validator LLM consensus inside an Intelligent Contract; the verdict and the author's reputation are stored on-chain. Live at veyr-eight.vercel.app.
- **Core flow:** open the board → connect a wallet (Studionet) → write a post → sign → validators reach consensus → verdict written on-chain → feed and reputation update. A second, rejected post proves the moderation can't be talked round. The feed filter shows every verdict is auditable.
- **Format:** UI walkthrough (formats.md §6). The brief's 2 minutes overrides the format's 20–90 s range; it gets one act per chapter, so a fix re-renders one chapter.
- **Destination:** README, the repository page and social posts, so it must read muted. Burned-in lower-third captions plus `captions.srt`. One 16:9 master; no 9:16 re-layout was asked for.
- **Data:** the board shows illustrative posts written for the film. They are not the live contract's posts, and the film never claims they are.

## Brand-supplied exceptions (the brand wins: these are Veyr's, not defaults)
The live product's identity uses looks the house bans list. They are recorded here so the critics don't flag them, and the lines that set them carry `// cinetic:brand-supplied <what>`.
- **Ink violet `#1E174F`** (the logo, primary buttons): banned family indigo/violet. Brand-supplied.
- **Ember `#B83A14` / bright ember `#E2622B`** (the logo's verdict block): banned family orange. Brand-supplied, and it is the film's one accent.
- **Cream `#F7F1E9`** (the V on dark, the app icon): banned cream. Brand-supplied, used only for the mark on the dark chapter.
- **Not carried over:** the app's ember→violet gradient headline and its italic word. The film never shows the hero headline, so no gradient and no italic appear.

## Hard bans (copied verbatim for the critics)
- Words: no eyebrow or kicker labels above a headline; no stacked taglines or "Introducing…"; no text walls or filler text (decorative mono captions, fake metrics, labels nobody needs, lorem ipsum). Every word earns its place.
- Type: no serif, no italic or oblique (or a skew faking one). One clean modern sans (Outfit) plus a mono (JetBrains Mono) for addresses and code.
- Colour: no orange/amber/beige/cream/tan/sand, neon or glows, purple/violet/indigo or multi-hue gradients, or glassmorphism, except the brand-supplied entries above.
- Decoration: no emoji or stock icons; no AI sparkles, particles, confetti, lens flares or code rain; no bouncy overshoot on anything that isn't landing.
