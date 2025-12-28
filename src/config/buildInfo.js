export const BUILD = {
  version: import.meta.env.VITE_APP_VERSION,
  number: import.meta.env.VITE_BUILD_NUMBER,
  commit: import.meta.env.VITE_BUILD_COMMIT,
  timeISO: import.meta.env.VITE_BUILD_TIME,
}
