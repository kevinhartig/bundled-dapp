'use client';

import { init } from './init';

// Ensure window.DApp is set when this module loads on the client.
// The bundler uses globalExport: "DApp" in manifest.json to call window.DApp.init.
if (typeof window !== 'undefined') {
    (window as unknown as { DApp: { init: typeof init } }).DApp = { init };
}

export { init };
