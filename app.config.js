// Your EAS account lives outside git: set EXPO_OWNER / EXPO_SLUG / EAS_PROJECT_ID, or put
// { "owner", "slug", "projectId" } in the gitignored expo.local.json. Without either, the app
// still runs in Expo Go from `expo start`; only `eas update` needs them.
let local = {};
try {
  local = require('./expo.local.json');
} catch {}

module.exports = ({ config }) => {
  const owner = process.env.EXPO_OWNER ?? local.owner;
  const slug = process.env.EXPO_SLUG ?? local.slug ?? config.slug;
  const projectId = process.env.EAS_PROJECT_ID ?? local.projectId;
  return {
    ...config,
    slug,
    ...(owner && { owner }),
    ...(projectId && {
      extra: { ...config.extra, eas: { projectId } },
      updates: { url: `https://u.expo.dev/${projectId}` },
    }),
  };
};
