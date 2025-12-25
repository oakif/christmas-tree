/**
 * Christmas Tree Configuration
 *
 * OBJECTS:
 * Define particles using the objects array. Each object creates a set of particles.
 *
 * Required properties:
 *   - type: 'star' | 'heart' | 'snowflake' | 'present'
 *   - count: number of particles to create
 *
 * Optional properties (with defaults):
 *   - scale: 1.0 (size multiplier)
 *   - color: 0xffffff (base color)
 *   - emissive: 0x000000 (glow color)
 *   - emissiveIntensity: 0.0 (glow strength, affects bloom)
 *   - metalness: 0.5 (0 = matte, 1 = metallic)
 *   - roughness: 0.5 (0 = smooth, 1 = rough)
 *
 * TIP: To create multiple variants (e.g., different colored presents),
 * create separate object definitions.
 */
export const CONFIG = {
    // --- TREE APPEARANCE ---
    treeHeight: 40,
    treeRadius: 18,
    treeYOffset: 3,        // Shift the entire tree up (+) or down (-)

    // --- OBJECTS ---
    objects: [
        {
            type: 'star',
            count: 400,
            scale: 1.0,
            color: 0xfffea8,
            emissive: 0xfffea8,
            emissiveIntensity: 0.5,
            metalness: 0.3,
            roughness: 0.4
        },
        {
            type: 'heart',
            count: 600,
            scale: 0.8,
            color: 0xff0055,
            emissive: 0x220011,
            emissiveIntensity: 0.15,
            metalness: 0.0,
            roughness: 0.35
        },
        // {
        //     type: 'snowflake',
        //     count: 1200,
        //     scale: 1.0,
        //     color: 0xf0f8ff,
        //     emissive: 0x88aacc,
        //     emissiveIntensity: 0.15,
        //     metalness: 0.1,
        //     roughness: 0.3
        // },
        {
            type: 'present',
            count: 133,
            scale: 0.8,
            color: 0xff3333,
            emissive: 0xff3333,
            emissiveIntensity: 0.05,
            metalness: 0.2,
            roughness: 0.4
        },
        {
            type: 'present',
            count: 133,
            scale: 0.8,
            color: 0x33ff33,
            emissive: 0x33ff33,
            emissiveIntensity: 0.05,
            metalness: 0.2,
            roughness: 0.4
        },
        {
            type: 'present',
            count: 134,
            scale: 0.8,
            color: 0x3333ff,
            emissive: 0x3333ff,
            emissiveIntensity: 0.05,
            metalness: 0.2,
            roughness: 0.4
        }
    ],

    // --- ANIMATION / PHYSICS ---
    animationSpeed: 0.12,      // Unified speed for explosion spread and return (0.01 = slow, 0.2 = fast)
    explosionForce: 120,       // Initial blast speed
    explosionFriction: 0.97,   // Air resistance
    idleFloatSpeed: 0.005,     // Wobble speed when idle
    idleFloatAmount: 0.02,     // How much it wobbles

    // --- PARALLAX ---
    parallaxStrengthX: 1.2,    // Mouse Y -> rotation X
    parallaxStrengthY: 1.5,    // Mouse X -> rotation Y
    parallaxSmoothing: 0.05,   // How smooth the parallax follows (lower = smoother)
    parallaxPositionStrengthX: 0.0, // Mouse X -> position movement strength (0 = disabled)
    parallaxPositionStrengthY: 0,   // Mouse Y -> position movement strength (0 = disabled)
    explodedParallaxStrength: 0, // Individual particle parallax when exploded

    // --- CAMERA / VIEW ---
    // Camera position (X, Y, Z) - adjust these for different viewing angles
    // For overhead view: increase Y (height), adjust Z (distance), keep X centered
    // Example: X=0, Y=25, Z=40 gives ~45° overhead angle
    cameraX: 0,
    cameraY: 25,
    cameraZ: 30,

    // --- TIMING ---
    holdDuration: 15000,        // Milliseconds before reforming

    // --- EXPLOSION DISTRIBUTION ---
    // When exploded, particles distribute in a hollow sphere (spherical shell)
    explosionInnerRadius: 30,   // Inner radius - prevents particles too close to camera
    explosionOuterRadius: 60,   // Outer radius - maximum distance from center
    explosionCenterMode: 'tree', // 'camera' or 'tree' - where the explosion sphere is centered
    explosionOffsetX: 0,        // X offset from the center point
    explosionOffsetY: -3,        // Y offset from the center point
    explosionOffsetZ: 0,        // Z offset from the center point

    // --- REWARD IMAGE ---
    rewardImage: "",
    imageDelay: 500,

    // --- INTERACTION ---
    reassembleOnClick: true,   // If true, clicking while exploded will reassemble immediately

    // --- BLOOM (GLOW EFFECT) ---
    bloomStrength: 0.35,       // Reduced slightly
    bloomRadius: 0.5,
    bloomThreshold: 0.2        // Raised threshold so only bright things bloom
};
