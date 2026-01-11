// Click/touch handlers and resize events

let returnTimer = null;
let CONFIG = null;

// Callbacks set during initialization
let onExplosion = null;
let onReturn = null;
let getAnimationState = null;
let setAnimationState = null;

// Touch tracking to distinguish tap from drag
let touchStartPos = null;
const TAP_THRESHOLD = 10; // pixels - movement less than this is considered a tap

export function initEvents(configRef, callbacks) {
    CONFIG = configRef;
    onExplosion = callbacks.onExplosion;
    onReturn = callbacks.onReturn;
    getAnimationState = callbacks.getAnimationState;
    setAnimationState = callbacks.setAnimationState;

    window.addEventListener('mousedown', triggerExplosion);

    // For touch: track start position and only trigger on tap (not drag)
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: false });
}

export function initResizeHandler(context) {
    const {
        perspectiveCamera,
        orthographicCamera,
        renderer,
        composer,
    } = context;

    window.addEventListener('resize', () => {
        const newAspect = window.innerWidth / window.innerHeight;

        // Update perspective camera
        perspectiveCamera.aspect = newAspect;
        perspectiveCamera.updateProjectionMatrix();

        // Update orthographic camera
        const frustumSize = CONFIG.isometricZoom;
        orthographicCamera.left = frustumSize * newAspect / -2;
        orthographicCamera.right = frustumSize * newAspect / 2;
        orthographicCamera.top = frustumSize / 2;
        orthographicCamera.bottom = frustumSize / -2;
        orthographicCamera.updateProjectionMatrix();

        renderer.setSize(window.innerWidth, window.innerHeight);
        composer.setSize(window.innerWidth, window.innerHeight);
    });
}

function handleTouchStart(event) {
    // Ignore touches on dat.GUI elements
    if (event.target.closest('.dg')) return;

    // Prevent default to avoid scroll/zoom
    event.preventDefault();

    // Record start position
    if (event.touches.length > 0) {
        touchStartPos = {
            x: event.touches[0].clientX,
            y: event.touches[0].clientY,
        };
    }
}

function handleTouchEnd(event) {
    // Ignore touches on dat.GUI elements
    if (event.target.closest('.dg')) return;

    if (!touchStartPos) return;

    // Check if this was a tap (not a drag)
    const endPos = event.changedTouches[0];
    const dx = endPos.clientX - touchStartPos.x;
    const dy = endPos.clientY - touchStartPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    touchStartPos = null;

    // Only trigger explosion if it was a tap (minimal movement)
    if (distance < TAP_THRESHOLD) {
        triggerExplosion(event);
    }
}

function triggerExplosion(event) {
    // Ignore clicks on dat.GUI elements
    const target = event.target;
    if (target.closest('.dg')) {
        return; // Click was on GUI, ignore it
    }

    const state = getAnimationState();

    // If already exploding and reassembleOnClick is enabled, start returning immediately
    if (state === "EXPLODING" && CONFIG.reassembleOnClick) {
        // Clear any pending timers
        if (returnTimer) {
            clearTimeout(returnTimer);
            returnTimer = null;
        }

        // Trigger return callback
        onReturn();

        setAnimationState("RETURNING");
        // Don't set a timer here - we'll transition to IDLE based on position convergence
        return;
    }

    // Allow exploding from IDLE or RETURNING state (can re-explode while returning)
    if (state !== "IDLE" && state !== "RETURNING") return;

    // Clear any pending timers from previous explosion
    if (returnTimer) {
        clearTimeout(returnTimer);
        returnTimer = null;
    }

    setAnimationState("EXPLODING");

    // Trigger explosion callback
    onExplosion();

    returnTimer = setTimeout(() => {
        onReturn();
        setAnimationState("RETURNING");
        // IDLE transition now happens automatically based on particle convergence
        returnTimer = null;
    }, CONFIG.holdDuration);
}

export function clearReturnTimer() {
    if (returnTimer) {
        clearTimeout(returnTimer);
        returnTimer = null;
    }
}
