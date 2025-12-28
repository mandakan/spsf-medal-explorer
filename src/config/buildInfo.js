/* global __APP_VERSION__, __BUILD_NUMBER__, __BUILD_COMMIT__, __BUILD_TIME__ */

export const BUILD = {
  version: __APP_VERSION__,
  number: __BUILD_NUMBER__,
  commit: __BUILD_COMMIT__,
  timeISO: __BUILD_TIME__,
}
