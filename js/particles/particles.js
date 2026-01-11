import * as THREE from 'three';
import { getGeometryForType } from './geometry.js';
import { sampleTreePosition, generateExplosionTargets } from './distribution.js';
import { getMaterialFromDefinition, validateAndMergeObjectDef, clearMaterialCache } from './materials.js';

export function createDefaultTestConfig() {
    return {
        count: 0,
        shape: 'star',
        materialType: 'glass',
        scale: 1.0,
        color: '#ffffff',
        emissive: '#000000',
        emissiveIntensity: 0.0,
        transmission: 0.9,
        thickness: 10.0,
        roughness: 0.15,
        metalness: 0.0,
        clearcoat: 0.0,
        clearcoatRoughness: 0.0,
        ior: 1.5,
        envMapIntensity: 1.5,
        particles: [],
    };
}

export function createParticleUserData(pos, explosionTarget) {
    return {
        originalPos: pos.clone(),
        explosionTarget: explosionTarget,
        velocity: new THREE.Vector3(0, 0, 0),
        rotSpeed: {
            x: (Math.random() - 0.5) * 0.02,
            y: (Math.random() - 0.5) * 0.02,
            z: (Math.random() - 0.5) * 0.02,
        },
        individualParallaxShift: new THREE.Vector3(0, 0, 0),
        baseParallaxSensitivity: 0.5 + Math.random() * 1.0,
    };
}

export function createTestParticle(config, explosionTarget, treeGroup, testParticles, CONFIG, envMap) {
    const geometry = getGeometryForType(config.shape);

    const materialOverrides = {};
    const preset = CONFIG.materialPresets[config.materialType] || {};

    if (config.transmission !== undefined && config.transmission !== (preset.transmission ?? CONFIG.materialDefaults.transmission)) {
        materialOverrides.transmission = config.transmission;
    }
    if (config.thickness !== undefined && config.thickness !== (preset.thickness ?? CONFIG.materialDefaults.thickness)) {
        materialOverrides.thickness = config.thickness;
    }
    if (config.roughness !== undefined && config.roughness !== (preset.roughness ?? CONFIG.materialDefaults.roughness)) {
        materialOverrides.roughness = config.roughness;
    }
    if (config.metalness !== undefined && config.metalness !== (preset.metalness ?? CONFIG.materialDefaults.metalness)) {
        materialOverrides.metalness = config.metalness;
    }
    if (config.clearcoat !== undefined && config.clearcoat !== (preset.clearcoat ?? CONFIG.materialDefaults.clearcoat)) {
        materialOverrides.clearcoat = config.clearcoat;
    }
    if (config.clearcoatRoughness !== undefined && config.clearcoatRoughness !== (preset.clearcoatRoughness ?? CONFIG.materialDefaults.clearcoatRoughness)) {
        materialOverrides.clearcoatRoughness = config.clearcoatRoughness;
    }
    if (config.ior !== undefined && config.ior !== (preset.ior ?? CONFIG.materialDefaults.ior)) {
        materialOverrides.ior = config.ior;
    }
    if (config.envMapIntensity !== undefined && config.envMapIntensity !== (preset.envMapIntensity ?? CONFIG.materialDefaults.envMapIntensity)) {
        materialOverrides.envMapIntensity = config.envMapIntensity;
    }

    const materialDef = {
        type: config.shape,
        color: parseInt(config.color.replace('#', ''), 16),
        emissive: parseInt(config.emissive.replace('#', ''), 16),
        emissiveIntensity: config.emissiveIntensity,
        materialType: config.materialType,
        materialOverrides: materialOverrides,
    };

    const material = getMaterialFromDefinition(materialDef, CONFIG, envMap);

    const mesh = new THREE.Mesh(geometry, material);
    mesh.scale.setScalar(config.scale);

    const pos = sampleTreePosition(CONFIG);
    mesh.position.copy(pos);
    mesh.userData = createParticleUserData(pos, explosionTarget);
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

    treeGroup.add(mesh);
    testParticles.push(mesh);
    return mesh;
}

export function rebuildTreeParticles(particles, treeGroup, testObjectGroups, camera, CONFIG, envMap, guiControls) {
    particles.forEach(mesh => {
        treeGroup.remove(mesh);
        mesh.material.dispose();
    });
    particles.length = 0;

    const totalParticleCount = CONFIG.objects.reduce((sum, obj) => sum + obj.count, 0);
    const explosionCenter = CONFIG.explosionCenterMode === 'camera'
        ? new THREE.Vector3(camera.position.x, camera.position.y, camera.position.z)
        : new THREE.Vector3(0, 0, 0);
    const explosionTargets = generateExplosionTargets(totalParticleCount, explosionCenter, CONFIG);

    let explosionTargetIndex = 0;

    CONFIG.objects.forEach(objectDef => {
        const fullDef = validateAndMergeObjectDef(objectDef);
        const geometry = getGeometryForType(fullDef.type);
        const material = getMaterialFromDefinition(fullDef, CONFIG, envMap);

        for (let i = 0; i < fullDef.count; i++) {
            const mesh = new THREE.Mesh(geometry, material);
            mesh.scale.setScalar(fullDef.scale);

            const pos = sampleTreePosition(CONFIG);
            mesh.userData = createParticleUserData(pos, explosionTargets[explosionTargetIndex++]);
            mesh.position.copy(pos);
            mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

            treeGroup.add(mesh);
            particles.push(mesh);
        }
    });

    const hasTestObjects = testObjectGroups.reduce((sum, g) => sum + g.count, 0) > 0;
    particles.forEach(p => {
        p.visible = CONFIG.showTreeParticles && !hasTestObjects;
    });
}

export function rebuildAllTestParticles(testParticles, testObjectGroups, particles, treeGroup, camera, CONFIG, envMap, guiControls) {
    clearMaterialCache();

    testParticles.forEach(mesh => {
        treeGroup.remove(mesh);
        mesh.geometry.dispose();
        mesh.material.dispose();
    });
    testParticles.length = 0;

    testObjectGroups.forEach(group => {
        group.particles = [];
    });

    const totalCount = testObjectGroups.reduce((sum, group) => sum + group.count, 0);

    const explosionCenter = CONFIG.explosionCenterMode === 'camera'
        ? new THREE.Vector3(camera.position.x, camera.position.y, camera.position.z)
        : new THREE.Vector3(0, 0, 0);
    const explosionTargets = generateExplosionTargets(totalCount, explosionCenter, CONFIG);

    let targetIndex = 0;
    testObjectGroups.forEach(group => {
        for (let i = 0; i < group.count; i++) {
            const mesh = createTestParticle(group, explosionTargets[targetIndex++], treeGroup, testParticles, CONFIG, envMap);
            group.particles.push(mesh);
        }
    });

    const hasTestObjects = totalCount > 0;
    particles.forEach(p => {
        p.visible = !hasTestObjects && guiControls.showTreeParticles;
    });
}

export function rebuildAllParticles(particles, testParticles, testObjectGroups, treeGroup, camera, CONFIG, envMap, guiControls) {
    clearMaterialCache();
    rebuildTreeParticles(particles, treeGroup, testObjectGroups, camera, CONFIG, envMap, guiControls);
    rebuildAllTestParticles(testParticles, testObjectGroups, particles, treeGroup, camera, CONFIG, envMap, guiControls);
}
