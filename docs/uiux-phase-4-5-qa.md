# UI/UX phase 4–5 QA checklist

## Static UI/UX guard

Run:

```bash
npm run test:uiux
```

The guard checks the implementation contract for:

- canonical UI token loading,
- scanner route links,
- result deep-link restoration,
- explicit loading and empty states,
- semantic scanner tabs,
- current navigation state,
- mobile and reduced-motion guardrails,
- baseline documentation.

## Manual validation matrix

Run the existing project checks when the repository is available locally:

```bash
npm run build
npm run test:ui
npm run test:responsive
npm run test:uiux
```

Check these viewport widths:

- 320 px
- 375 px
- 390 px
- 768 px
- 1024 px
- desktop wide screen

Check these journeys:

- Landing page → scanner
- Scanner → result
- Result URL opened in a new tab
- Dashboard → scanner
- Emergency case selection
- Education level selection
- Tool selection
- Keyboard-only navigation
- Reduced-motion preference

## Release gate

A phase 4–5 release is ready for review when:

- all static UI/UX checks pass,
- no primary CTA leads to an invalid scanner anchor,
- result URLs restore their saved result,
- no critical action depends on color alone,
- mobile layout does not clip primary actions,
- manual responsive and keyboard checks are recorded.
