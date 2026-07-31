/* === Singapore Property Dashboard — SPA entry (ES Modules) === */
import { router, exposeGlobals } from './modules/router.js';

// Expose functions needed by inline onclick handlers in rendered templates
exposeGlobals();

// ── Init ──
window.addEventListener('hashchange', router);
window.addEventListener('load', router);
