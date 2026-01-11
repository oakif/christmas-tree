import * as THREE from 'three';

// Shared application state
export const state = {
    // Animation state machine
    animationState: 'IDLE',  // 'IDLE' | 'EXPLODING' | 'RETURNING'

    // Three.js scene objects (set during init)
    scene: null,
    camera: null,
    perspectiveCamera: null,
    orthographicCamera: null,
    renderer: null,
    composer: null,
    renderPass: null,
    bloomPass: null,
    treeGroup: null,
    envMap: null,

    // Particle arrays
    particles: [],
    testParticles: [],
    testObjectGroups: [],

    // Showcase state
    showcaseBox: null,
    showcaseTextures: [],
    showcaseCurrentIndex: 0,
    showcaseLastShownIndex: -1,
    showcaseImagesLoaded: false,
    showcaseBoxShouldShow: false,
    showcaseBoxTargetScale: 0,
    showcaseBoxTargetOpacity: 0,

    // Image sets
    availableImageSets: [],
    currentImageSet: null,
    decryptionKey: null,

    // Timers
    returnTimer: null,
    settingsAutoCloseTimer: null,
    settingsCountdown: 10,

    // Mouse tracking
    mouse: new THREE.Vector2(0, 0),
    prevMouse: new THREE.Vector2(0, 0),
    mouseVelocity: new THREE.Vector2(0, 0),
    targetRotation: new THREE.Vector2(0, 0),
    targetPosition: new THREE.Vector2(0, 0),
    lastMouseMoveTime: 0,

    // Lighting references
    lights: {
        ambient: null,
        hemi: null,
        key: null,
        fill: null,
        rim: null,
        overhead: null,
        topGlow: null,
    },

    // GUI
    gui: null,
    guiControls: null,

    // FPS tracking
    lastTime: 0,
    frameCount: 0,
    fps: 0,
    fpsHistory: [],
};

// State mutation helpers
export function setAnimationState(newState, CONFIG, updateCameraFn) {
    state.animationState = newState;
    if (updateCameraFn) {
        updateCameraFn(newState, CONFIG);
    }
}
