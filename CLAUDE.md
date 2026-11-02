# Where's My Car (expo-fun)

One-screen Expo app: save your parking spot (GPS pin + optional note) and get
walking directions back to it via Apple/Google Maps. Runs in **Expo Go** —
there is no standalone build.

## ⚠️ Hard constraint: stay on Expo SDK 54

The App Store's Expo Go only runs SDK 54. Newer SDKs (what `create-expo-app`
scaffolds) fail on the phone with "Project is incompatible with this version of
Expo Go". **Do not upgrade the SDK** until Expo Go itself updates — check with:

```bash
curl -s "https://itunes.apple.com/lookup?id=982107779" | grep -o '"version":"[^"]*"'
```

When installing packages, always use `npx expo install <pkg>` (never plain
`npm install <pkg>`) so versions match SDK 54. Docs: https://docs.expo.dev/versions/v54.0.0/

## Development

```bash
npm run dev        # expo start, port 8081
```

- Phone must be on the same Wi-Fi as the Mac. Open via Expo Go's
  "Development servers" list, or scan a QR for `exp://<mac-lan-ip>:8081`
  with the iPhone **Camera app** (Expo Go has no scanner / manual URL entry).
- Verify without a phone: `npx tsc --noEmit`, then request the bundle —
  `curl -s -o /dev/null -w "%{http_code}" "http://localhost:8081/node_modules/expo-router/entry.bundle?platform=ios&dev=true&transform.routerRoot=src/app"`
  (200 = compiles).

## Deploy (EAS Update)

```bash
npx eas-cli@latest update --branch main --message "what changed"
```

- Account, slug and EAS project id come from env or the gitignored
  `expo.local.json` via app.config.js — never commit them.
  `npx eas-cli@latest whoami` first; if logged out, the **user** must run
  `npx eas-cli@latest login` themselves (browser flow).
- The user opens the app from Expo Go's **Projects** list (requires being
  signed in to Expo Go) — no Mac needed. Updates apply on next app open.
- `runtimeVersion.policy` in app.json must stay `"sdkVersion"` — that is what
  lets Expo Go open published updates. `"appVersion"` (the eas default) breaks it.

## Layout

- `src/app/index.tsx` — the entire app (spot saved in AsyncStorage under key `parking-spot`)
- `src/app/_layout.tsx` — minimal Stack, theme from @react-navigation/native
- `src/components/`, `src/hooks/`, `src/constants/theme.ts` — themed Text/View
  helpers kept from the template; the SDK-57-only template chrome (animated
  splash, native tabs, glass effects) was deleted during the SDK downgrade —
  don't reintroduce it.
