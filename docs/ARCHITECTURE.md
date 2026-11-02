# Architecture

The app is one screen, one storage key and two URLs.

```
index.tsx ── AsyncStorage "parking-spot"  { lat, lng, savedAt, note? }
   │
   ├─ Save:  expo-location (foreground permission, Accuracy.High)  ->  setItem
   ├─ Show:  timeAgo(savedAt), refreshed by a 60 s interval
   ├─ Go:    Linking.openURL(Apple Maps on iOS | Google Maps elsewhere, walking)
   └─ Clear: removeItem
_layout.tsx ── Stack, no header, DarkTheme / DefaultTheme by system scheme
```

## Files

| File | Responsibility |
|---|---|
| `src/app/index.tsx` | `ParkingScreen`: state, permission, save, directions, clear, styles |
| `src/app/_layout.tsx` | Root `Stack` and navigation theme |
| `src/components/themed-text.tsx`, `themed-view.tsx` | Text and View that pick colours from the theme |
| `src/hooks/use-theme.ts`, `use-color-scheme*.ts` | Current colour set; the web variant reports light until hydrated, for static rendering |
| `src/constants/theme.ts` | `Colors`, `Spacing`, `Fonts` |
| `app.json` | Name, icons, splash, `runtimeVersion.policy: sdkVersion` |
| `app.config.js` | Merges EAS owner, slug and project id from env or the gitignored `expo.local.json` |

## Why Expo Go and EAS Update

There is no standalone build. Expo Go from the App Store loads the JavaScript bundle, and `eas update` publishes new
bundles that Expo Go fetches on next open. That keeps the app on a phone without a paid developer account or
expiring sideloads. The price is the SDK pin: Expo Go only runs one SDK at a time.

## Storage

AsyncStorage holds one JSON value. On the web it is `localStorage`, which the screenshot script seeds directly.
There is no migration story because there is one field set; add optional fields the way `note` was added.

## Directions

`maps.apple.com/?daddr=lat,lng&dirflg=w` opens Apple Maps walking directions on iOS; everywhere else
`google.com/maps/dir/?api=1&destination=lat,lng&travelmode=walking` opens Google Maps, or the browser.

## Things that bit us

- **create-expo-app scaffolds the newest SDK.** It produced SDK 57, which the App Store's Expo Go refuses with
  "Project is incompatible with this version of Expo Go". The template was downgraded to SDK 54 and its
  SDK-57-only chrome (native tabs, glass effects, animated splash) removed.
- **`runtimeVersion` must be `sdkVersion`.** The EAS default `appVersion` makes published updates invisible to
  Expo Go.
- **`npm install` picks versions for the wrong SDK.** `npx expo install` pins them to SDK 54.
