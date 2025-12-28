/* global __APP_VERSION__, __BUILD_NUMBER__, __BUILD_COMMIT__, __BUILD_TIME__ */

// Guard access so Jest (without bundler defines) doesn’t throw.
export const BUILD = {
  version: (typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : undefined),
  number: (typeof __BUILD_NUMBER__ !== 'undefined' ? __BUILD_NUMBER__ : undefined),
  commit: (typeof __BUILD_COMMIT__ !== 'undefined' ? __BUILD_COMMIT__ : undefined),
  timeISO: (typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : undefined),
}
