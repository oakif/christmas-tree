// Animation loop and state machine

let CONFIG = null;
let animationState = "IDLE";

// External references
let particles = null;
let testParticles = null;
let treeGroup = null;
let camera = null;
let renderer = null;
let composer = null;
let scene = null;

// Callbacks
let updateFpsFn = null;
let updateParallaxTargetsFn = null;
let applyParallaxToGroupFn = null;
let animateShowcaseBoxFn = null;
let renderShowcaseFn = null;
let getMouseFn = null;
let getLastMouseMoveTimeFn = null;
let updateCameraFn = null;

export function initAnimation(configRef, context, callbacks) {
    CONFIG = configRef;

    particles = context.particles;
    testParticles = context.testParticles;
    treeGroup = context.treeGroup;
    camera = context.camera;
    renderer = context.renderer;
    composer = context.composer;
    scene = context.scene;

    updateFpsFn = callbacks.updateFps;
    updateParallaxTargetsFn = callbacks.updateParallaxTargets;
    applyParallaxToGroupFn = callbacks.applyParallaxToGroup;
    animateShowcaseBoxFn = callbacks.animateShowcaseBox;
    renderShowcaseFn = callbacks.renderShowcase;
    getMouseFn = callbacks.getMouse;
    getLastMouseMoveTimeFn = callbacks.getLastMouseMoveTime;
    updateCameraFn = callbacks.updateCamera;
}

export function getAnimationState() {
    return animationState;
}

export function setAnimationState(newState) {
    animationState = newState;
    if (updateCameraFn) {
        updateCameraFn(newState);
    }
}

export function updateCameraReference(cam) {
    camera = cam;
}

export function startAnimationLoop() {
    animate();
}

function animate() {
    if (CONFIG.uncapFPS) {
        setTimeout(animate, 0);
    } else {
        requestAnimationFrame(animate);
    }

    const time = Date.now();

    // Update FPS
    if (updateFpsFn) {
        updateFpsFn(CONFIG.showFPS);
    }

    // Update parallax targets and apply to tree group
    if (updateParallaxTargetsFn && applyParallaxToGroupFn) {
        updateParallaxTargetsFn(animationState);
        applyParallaxToGroupFn(treeGroup);
    }

    // Animate showcase box
    if (animateShowcaseBoxFn && getMouseFn && getLastMouseMoveTimeFn) {
        animateShowcaseBoxFn(camera, getMouseFn(), getLastMouseMoveTimeFn());
    }

    // Animate particles
    const allReturned = animateParticles(time);

    // Transition to IDLE when all particles have returned
    if (animationState === "RETURNING" && allReturned) {
        setAnimationState("IDLE");
    }

    // Render
    if (renderShowcaseFn) {
        renderShowcaseFn(renderer, scene, camera, composer);
    }
}

function animateParticles(time) {
    let allReturned = true;

    // Animate tree particles
    particles.forEach((p, index) => {
        animateSingleParticle(p, index, time);

        if (animationState === "RETURNING") {
            const dist = p.position.distanceTo(p.userData.originalPos);
            if (dist > 0.1) {
                allReturned = false;
            }
        }
    });

    // Animate test particles (same logic as tree particles)
    testParticles.forEach((p, index) => {
        animateSingleParticle(p, index, time);

        if (animationState === "RETURNING") {
            const dist = p.position.distanceTo(p.userData.originalPos);
            if (dist > 0.1) {
                allReturned = false;
            }
        }
    });

    return allReturned;
}

function animateSingleParticle(p, index, time) {
    // Constant gentle rotation for all states
    p.rotation.x += p.userData.rotSpeed.x;
    p.rotation.y += p.userData.rotSpeed.y;
    p.rotation.z += p.userData.rotSpeed.z;

    if (animationState === "IDLE") {
        // Gentle floating motion
        const floatOffset = Math.sin(time * CONFIG.idleFloatSpeed + index * 0.1) * CONFIG.idleFloatAmount;
        p.position.y = p.userData.originalPos.y + floatOffset;
        p.position.x = p.userData.originalPos.x;
        p.position.z = p.userData.originalPos.z;
    }
    else if (animationState === "EXPLODING") {
        const mouse = getMouseFn ? getMouseFn() : { x: 0, y: 0 };

        // Calculate parallax offset based on mouse position (if enabled)
        if (CONFIG.explodedParallaxEnabled) {
            const parallaxX = mouse.x * CONFIG.explodedParallaxStrength * p.userData.baseParallaxSensitivity;
            const parallaxY = mouse.y * CONFIG.explodedParallaxStrength * p.userData.baseParallaxSensitivity;
            p.userData.individualParallaxShift.x += (parallaxX - p.userData.individualParallaxShift.x) * 0.08;
            p.userData.individualParallaxShift.y += (parallaxY - p.userData.individualParallaxShift.y) * 0.08;
        } else {
            p.userData.individualParallaxShift.x *= 0.95;
            p.userData.individualParallaxShift.y *= 0.95;
        }

        // Calculate target position with parallax applied
        const targetX = p.userData.explosionTarget.x + p.userData.individualParallaxShift.x;
        const targetY = p.userData.explosionTarget.y + p.userData.individualParallaxShift.y;
        const targetZ = p.userData.explosionTarget.z;

        // Lerp toward parallax-adjusted target
        p.position.x += (targetX - p.position.x) * CONFIG.animationSpeed;
        p.position.y += (targetY - p.position.y) * CONFIG.animationSpeed;
        p.position.z += (targetZ - p.position.z) * CONFIG.animationSpeed;

        // Add subtle floating motion on top
        const floatOffset = Math.sin(time * CONFIG.idleFloatSpeed * 2 + index * 0.1) * CONFIG.idleFloatAmount;
        p.position.x += Math.sin(time * 0.001 + index) * 0.01;
        p.position.y += floatOffset;
        p.position.z += Math.cos(time * 0.001 + index) * 0.01;

        // Faster rotation when exploding
        p.rotation.x += 0.02;
        p.rotation.y += 0.01;
    }
    else if (animationState === "RETURNING") {
        // Return to original tree position using same animation speed
        p.position.lerp(p.userData.originalPos, CONFIG.animationSpeed);

        // Fade out parallax shift
        p.userData.individualParallaxShift.multiplyScalar(0.95);
    }
}
