# Pet Yuka

## Design System
Always read DESIGN.md before making any visual or UI decisions.
All font choices, colors, spacing, and aesthetic direction are defined there.
Do not deviate without explicit user approval.
In QA mode, flag any code that doesn't match DESIGN.md.

## Deploy Configuration (configured by /setup-deploy)
- Platform: Vercel (static export)
- Production URL: https://dist-amber-seven-22.vercel.app
- Deploy workflow: `npx expo export --platform web && cd dist && vercel --prod --yes`
- Deploy status command: HTTP health check
- Merge method: squash
- Project type: Web app (Expo React Native, static export)
- Post-deploy health check: https://dist-amber-seven-22.vercel.app

### Custom deploy hooks
- Pre-merge: `npx jest` (run tests)
- Deploy trigger: Manual via `vercel --prod` after `expo export`
- Deploy status: Poll production URL
- Health check: https://dist-amber-seven-22.vercel.app

### Deploy steps
1. `npx expo export --platform web` — build static web export to `dist/`
2. `cd dist && vercel --prod --yes` — deploy to Vercel
3. Verify: `curl -sf https://dist-amber-seven-22.vercel.app -o /dev/null -w "%{http_code}"`
