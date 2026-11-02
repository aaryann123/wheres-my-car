# Building

| | |
|---|---|
| Node | 20 or later |
| Expo SDK | 54 (pinned) |
| Phone | Expo Go from the App Store or Play Store |
| Browser | optional, for `w` in `expo start` and the screenshot script |
| Chrome | only for `Tools/screenshots.mjs` |

## First run

```bash
npm install
npm run dev            # expo start on port 8081
```

The phone must be on the same Wi-Fi. On iPhone, scan the QR code with the Camera app; Expo Go has no scanner.

Check it compiles without a phone:

```bash
npx tsc --noEmit
curl -s -o /dev/null -w "%{http_code}\n" \
  "http://localhost:8081/node_modules/expo-router/entry.bundle?platform=ios&dev=true&transform.routerRoot=src/app"
# 200 = the bundle builds
```

## Publishing with EAS Update (optional)

1. `npx eas-cli@latest login`, then `npx eas-cli@latest init` to create a project on your account.
2. Put your details where `app.config.js` reads them, either as environment variables
   (`EXPO_OWNER`, `EXPO_SLUG`, `EAS_PROJECT_ID`) or in a gitignored `expo.local.json`:
   ```json
   { "owner": "your-account", "slug": "your-slug", "projectId": "00000000-0000-0000-0000-000000000000" }
   ```
3. `npx eas-cli@latest update --branch main --message "what changed"`.

Open the app from Expo Go's Projects list while signed in. Updates apply on next open. Keep
`runtimeVersion.policy` as `sdkVersion`.

## Layout

```
src/app/              expo-router routes (index, _layout)
src/components/       themed primitives
src/constants/        theme tokens
src/hooks/            colour scheme hooks
assets/               app icon, adaptive icon layers, splash, favicon
app.json              Expo config
app.config.js         EAS identity from env / expo.local.json
Tools/screenshots.mjs screenshots
```

## Adding a field to the spot

Extend `Spot` in `index.tsx`, write it in `savePin`, show it in the saved view. Keep it optional so spots saved by
older versions still load.

## Regenerating screenshots

```bash
node Tools/screenshots.mjs
```

It exports the web build to a temp folder, serves it, drives headless Chrome over the DevTools protocol at
390x844 @2x, seeds a made-up spot into `localStorage`, and writes four PNGs to `docs/screenshots/`. Look at each
before committing. Set `CHROME=` if Chrome isn't in `/Applications`.

## Not supported yet

- No standalone iOS or Android build; `/ios` and `/android` are gitignored if you prebuild.
- One spot at a time.
