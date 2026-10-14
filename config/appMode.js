/**
 * APP_MODE controls the application entry point and behavior.
 *
 * 'multi'     — Default multi-device mode. Entry: device list.
 *               Supports multiple managed routers.
 *
 * 'h5_single' — H5 single-device mode. The H5 build is hosted directly
 *               on the router's web server (e.g. /www). The managed IP,
 *               port and protocol are auto-detected from window.location.
 *               Entry: login page. No device list shown.
 *
 * Change this value before building for router hosting:
 *   npm run build:h5  →  set APP_MODE = 'h5_single'
 *   npm run build:app →  keep APP_MODE = 'multi'
 */
export const APP_MODE = 'multi'
