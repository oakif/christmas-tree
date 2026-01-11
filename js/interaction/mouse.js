// Mouse parallax tracking
import * as THREE from 'three';

const mouse = new THREE.Vector2(0, 0);
const prevMouse = new THREE.Vector2(0, 0);
const mouseVelocity = new THREE.Vector2(0, 0);
const targetRotation = new THREE.Vector2(0, 0);
const targetPosition = new THREE.Vector2(0, 0);
let lastMouseMoveTime = 0;
let CONFIG = null;

export function initMouseTracking(configRef) {
    CONFIG = configRef;

    // Track mouse using multiple event types for reliability
    // Using document-level listeners to work even without focus
    document.addEventListener('mousemove', updateMousePosition, { passive: true });
    document.addEventListener('pointermove', updateMousePosition, { passive: true });

    // Reset when mouse leaves the document/window
    document.addEventListener('mouseleave', resetMousePosition);
    document.addEventListener('mouseout', (event) => {
        // Only reset if actually leaving the document (not just moving between elements)
        if (event.relatedTarget === null || event.relatedTarget.nodeName === 'HTML') {
            resetMousePosition();
        }
    });
    window.addEventListener('pointerleave', resetMousePosition);

    // Handle visibility changes
    document.addEventListener('visibilitychange', onVisibilityChange);

    // When mouse enters, immediately start tracking
    document.addEventListener('mouseenter', (event) => {
        updateMousePosition(event);
    });

    // Backup listeners to ensure mouse position updates after clicks
    document.addEventListener('mouseup', updateMousePosition, { passive: true });
    document.addEventListener('click', updateMousePosition, { passive: true });
    document.addEventListener('mousedown', updateMousePosition, { passive: true });

    // Edge-specific fix: release pointer capture which can block mousemove events
    window.addEventListener('pointerdown', (event) => {
        // Update position on pointer down
        updateMousePosition(event);
        // Release any implicit pointer capture that Edge might set
        if (event.target.releasePointerCapture) {
            try {
                event.target.releasePointerCapture(event.pointerId);
            } catch (e) {
                // Ignore - pointer might not be captured
            }
        }
    }, { passive: true });
}

function updateMousePosition(event) {
    prevMouse.copy(mouse);
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    mouseVelocity.x = mouse.x - prevMouse.x;
    mouseVelocity.y = mouse.y - prevMouse.y;
    lastMouseMoveTime = performance.now();
}

function resetMousePosition() {
    if (CONFIG && CONFIG.resetMouseOnLeave) {
        mouse.x = 0;
        mouse.y = 0;
    }
}

// Reset mouse tracking on visibility changes
function onVisibilityChange() {
    if (document.hidden) {
        resetMousePosition();
    }
}

export function getMouse() {
    return mouse;
}

export function getMouseVelocity() {
    return mouseVelocity;
}

export function getLastMouseMoveTime() {
    return lastMouseMoveTime;
}

export function getTargetRotation() {
    return targetRotation;
}

export function getTargetPosition() {
    return targetPosition;
}

// Calculate parallax targets based on animation state
export function updateParallaxTargets(animationState) {
    const isExploding = animationState === "EXPLODING";
    const parallaxActive = isExploding ? CONFIG.explodedParallaxEnabled : CONFIG.parallaxEnabled;

    if (parallaxActive) {
        const parallaxX = isExploding ? CONFIG.explodedParallaxStrengthX : CONFIG.parallaxStrengthX;
        const parallaxY = isExploding ? CONFIG.explodedParallaxStrengthY : CONFIG.parallaxStrengthY;
        targetRotation.x = mouse.y * parallaxX;
        targetRotation.y = mouse.x * parallaxY;
        targetPosition.x = mouse.x * CONFIG.parallaxPositionStrengthX;
        targetPosition.y = mouse.y * CONFIG.parallaxPositionStrengthY;
    } else {
        targetRotation.x = 0;
        targetRotation.y = 0;
        targetPosition.x = 0;
        targetPosition.y = 0;
    }

    return { targetRotation, targetPosition };
}

// Apply parallax to tree group
export function applyParallaxToGroup(treeGroup) {
    treeGroup.rotation.x += (targetRotation.x - treeGroup.rotation.x) * CONFIG.parallaxSmoothing;
    treeGroup.rotation.y += (targetRotation.y - treeGroup.rotation.y) * CONFIG.parallaxSmoothing;
    treeGroup.position.x += (targetPosition.x - treeGroup.position.x) * CONFIG.parallaxSmoothing;
    treeGroup.position.y += (targetPosition.y + CONFIG.treeYOffset - treeGroup.position.y) * CONFIG.parallaxSmoothing;
}
