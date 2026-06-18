# Slice 11 — Design polish (control-room aesthetic)

Status: not-started
Depends on: 09-reasoning-panel
Build step: 4 (hardening)

## Requirement

Apply the low-glare, knowledge-first "control room / edit suite" look and the
accessibility/error states, without drifting into a marketing site.

## Contracts touched

Tailwind v4 `@theme` tokens in `app.css`; UI components.

## Acceptance criteria

- [ ] Theme tokens defined in CSS `@theme`: obsidian `#0B0B0B`, surfaces `#141414/#1C1C1C/#262626`, hairline `#2A2A2A`, ink `#E8E6E3`, muted `#8A8A85`, teal `#2DD4BF`, amber `#FBBF24`.
- [ ] Exactly **one** bold accent moment (teal on wordmark + `focus-within` search ring); everything else monochrome/functional hover.
- [ ] Content placed in an offset reading column (`max-w-[68ch]`), not full-bleed; generous top breathing room; no decorative dividers.
- [ ] Wayfinding: no nav bar/hamburger; `.. /` "go up" (= `<A href="/">`), `~/search/<q>` mono breadcrumb, `#` markers in the panel.
- [ ] Result cards show title, source, snippet, `sourceType` badge, "why ranked #N"; subtle desaturate-on-hover; no ads/sponsored/infinite-scroll.
- [ ] Motion 150-700ms ease; no scale/parallax/particles/popups/sticky-CTA.
- [ ] A11y: `aria-live="polite"` stage text; `<form>` Enter-submit + autofocus + `focus-visible`; results as `<ol>`; mid-stream error keeps `partialResults` + mono `✕ ... [retry]`; `<noscript>` -> json fallback.

## Done when

The UI matches the aesthetic spec, passes a reduced-motion check, and keyboard-only use works end-to-end.

## Out of scope

Lenses / source-diversity visuals (post-MVP).
