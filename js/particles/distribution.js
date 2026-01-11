import * as THREE from 'three';

// Density-corrected position sampling for cone surface
// Uses sqrt sampling biased toward bottom where circumference is larger
export function sampleTreePosition(CONFIG) {
    const u = Math.random();
    const heightFraction = Math.sqrt(u);
    const height = heightFraction * CONFIG.treeHeight;

    const radiusAtHeight = (height / CONFIG.treeHeight) * CONFIG.treeRadius;

    const theta = Math.random() * Math.PI * 2;
    // Push particles to the edge (hollow cone: 0.6 to 1.0 of radius)
    const r = radiusAtHeight * (0.6 + Math.random() * 0.4);

    const x = r * Math.cos(theta);
    const z = r * Math.sin(theta);
    const y = (CONFIG.treeHeight / 2) - height;

    return new THREE.Vector3(x, y, z);
}

// Generate explosion target positions in a hollow sphere distribution
export function generateExplosionTargets(count, center, CONFIG) {
    const targets = [];
    const innerR = CONFIG.explosionInnerRadius;
    const outerR = CONFIG.explosionOuterRadius;

    const explosionCenter = new THREE.Vector3(
        center.x + CONFIG.explosionOffsetX,
        center.y + CONFIG.explosionOffsetY,
        center.z + CONFIG.explosionOffsetZ,
    );

    for (let i = 0; i < count; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = innerR + Math.random() * (outerR - innerR);

        const x = explosionCenter.x + r * Math.sin(phi) * Math.cos(theta);
        const y = explosionCenter.y + r * Math.sin(phi) * Math.sin(theta);
        const z = explosionCenter.z + r * Math.cos(phi);

        targets.push(new THREE.Vector3(x, y, z));
    }

    return targets;
}
