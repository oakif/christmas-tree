import * as THREE from 'three';

export const OBJECT_DEFAULTS = {
    scale: 1.0,
    color: 0xffffff,
    emissive: 0x000000,
    emissiveIntensity: 0.0,
    metalness: 0.5,
    roughness: 0.5,
    materialType: 'matte',
    materialOverrides: {},
};

export const materialCache = new Map();

export function clearMaterialCache() {
    materialCache.clear();
}

export function validateAndMergeObjectDef(objectDef) {
    if (!objectDef.type) {
        throw new Error('Object definition must have a type');
    }
    if (objectDef.count === undefined || objectDef.count < 0) {
        throw new Error('Object definition must have a valid count');
    }
    return { ...OBJECT_DEFAULTS, ...objectDef };
}

export function getMaterialFromDefinition(def, CONFIG, envMap) {
    const useMaterialPreset = def.materialType !== null && def.materialType !== undefined;

    const cacheKeyBase = {
        color: def.color,
        emissive: def.emissive,
        emissiveIntensity: def.emissiveIntensity,
    };

    let key;
    if (useMaterialPreset) {
        const materialProps = {
            ...CONFIG.materialDefaults,
            ...(CONFIG.materialPresets[def.materialType] || {}),
            ...(def.materialOverrides || {}),
        };
        key = JSON.stringify({
            ...cacheKeyBase,
            materialType: def.materialType,
            performanceMode: CONFIG.performanceMode,
            materialProps: materialProps,
        });
    } else {
        key = JSON.stringify({
            ...cacheKeyBase,
            metalness: def.metalness,
            roughness: def.roughness,
        });
    }

    if (materialCache.has(key)) {
        return materialCache.get(key);
    }

    let material;
    if (useMaterialPreset) {
        const materialProps = {
            ...CONFIG.materialDefaults,
            ...(CONFIG.materialPresets[def.materialType] || {}),
            ...(def.materialOverrides || {}),
        };

        const materialClass = materialProps.materialClass || 'Standard';

        if (materialClass === 'Physical') {
            material = CONFIG.performanceMode
                ? createPerformanceMaterial(def, materialProps, envMap)
                : createPhysicalMaterial(def, materialProps, envMap);
        } else {
            material = createStandardMaterial(def, materialProps, envMap);
        }
    } else {
        material = new THREE.MeshStandardMaterial({
            color: def.color,
            emissive: def.emissive,
            emissiveIntensity: def.emissiveIntensity,
            metalness: def.metalness,
            roughness: def.roughness,
            side: def.type === 'snowflake' ? THREE.DoubleSide : THREE.FrontSide,
        });
    }

    materialCache.set(key, material);
    return material;
}

export function createPhysicalMaterial(def, materialProps, envMap) {
    return new THREE.MeshPhysicalMaterial({
        color: def.color,
        emissive: def.emissive,
        emissiveIntensity: def.emissiveIntensity,
        transmission: materialProps.transmission || 0,
        thickness: materialProps.thickness || 0,
        roughness: materialProps.roughness,
        metalness: materialProps.metalness || 0,
        clearcoat: materialProps.clearcoat || 0,
        clearcoatRoughness: materialProps.clearcoatRoughness || 0,
        ior: materialProps.ior || 1.5,
        envMap: envMap,
        envMapIntensity: materialProps.envMapIntensity || 1.0,
        side: def.type === 'snowflake' ? THREE.DoubleSide : THREE.FrontSide,
        transparent: materialProps.transmission > 0,
        opacity: 1.0,
    });
}

export function createPerformanceMaterial(def, materialProps, envMap) {
    const opacity = materialProps.transmission > 0
        ? 0.4 + (1 - materialProps.transmission) * 0.6
        : 1.0;

    return new THREE.MeshStandardMaterial({
        color: def.color,
        emissive: def.emissive,
        emissiveIntensity: def.emissiveIntensity,
        metalness: materialProps.metalness || 0.1,
        roughness: materialProps.roughness,
        envMap: envMap,
        envMapIntensity: materialProps.envMapIntensity || 1.0,
        transparent: materialProps.transmission > 0,
        opacity: opacity,
        side: def.type === 'snowflake' ? THREE.DoubleSide : THREE.FrontSide,
    });
}

export function createStandardMaterial(def, materialProps, envMap) {
    return new THREE.MeshStandardMaterial({
        color: def.color,
        emissive: def.emissive,
        emissiveIntensity: def.emissiveIntensity,
        roughness: materialProps.roughness,
        metalness: materialProps.metalness || 0,
        envMap: envMap,
        envMapIntensity: materialProps.envMapIntensity || 1.0,
        side: def.type === 'snowflake' ? THREE.DoubleSide : THREE.FrontSide,
        transparent: false,
    });
}
