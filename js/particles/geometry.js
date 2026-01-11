import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Cached geometries
let geomGiftBox = null;
let geomSphere = null;
let geomSnowflake = null;
let geomStar = null;
let geomHeart = null;

// Gift box with ribbon and bow
function createGiftBoxGeometry() {
    const boxSize = 0.5;
    const ribbonWidth = 0.08;
    const ribbonHeight = 0.02;
    const ribbonOverhang = 0.02;
    const ribbonOffset = ribbonHeight / 2;
    const loopRadius = 0.12;
    const tubeRadius = 0.025;
    const loopDistance = 0.08;
    const loopHeight = boxSize / 2 + ribbonHeight + 0.02;

    const boxGeom = new THREE.BoxGeometry(boxSize, boxSize, boxSize);

    function createRibbon(width, height, depth, tx, ty, tz) {
        const ribbon = new THREE.BoxGeometry(width, height, depth);
        ribbon.translate(tx, ty, tz);
        return ribbon;
    }

    function createBowLoop(angleY) {
        const loop = new THREE.TorusGeometry(loopRadius, tubeRadius, 8, 12, Math.PI);
        loop.rotateZ(Math.PI / 2);
        loop.rotateX(-Math.PI / 4);
        loop.rotateY(angleY);
        const offsetX = Math.cos(angleY) * loopDistance;
        const offsetZ = Math.sin(angleY) * loopDistance;
        loop.translate(offsetX, loopHeight, offsetZ);
        return loop;
    }

    const ribbons = [
        createRibbon(boxSize + ribbonOverhang, ribbonHeight, ribbonWidth, 0, boxSize / 2 + ribbonOffset, 0),
        createRibbon(ribbonWidth, ribbonHeight, boxSize + ribbonOverhang, 0, boxSize / 2 + ribbonOffset, 0),
        createRibbon(boxSize + ribbonOverhang, ribbonHeight, ribbonWidth, 0, -(boxSize / 2 + ribbonOffset), 0),
        createRibbon(ribbonWidth, ribbonHeight, boxSize + ribbonOverhang, 0, -(boxSize / 2 + ribbonOffset), 0),
        createRibbon(ribbonWidth, boxSize + ribbonOverhang, ribbonHeight, 0, 0, boxSize / 2 + ribbonOffset),
        createRibbon(ribbonWidth, boxSize + ribbonOverhang, ribbonHeight, 0, 0, -(boxSize / 2 + ribbonOffset)),
        createRibbon(ribbonHeight, boxSize + ribbonOverhang, ribbonWidth, boxSize / 2 + ribbonOffset, 0, 0),
        createRibbon(ribbonHeight, boxSize + ribbonOverhang, ribbonWidth, -(boxSize / 2 + ribbonOffset), 0, 0),
    ];

    const bowLoops = [
        createBowLoop(Math.PI / 4),
        createBowLoop(3 * Math.PI / 4),
        createBowLoop(5 * Math.PI / 4),
        createBowLoop(7 * Math.PI / 4),
    ];

    const knot = new THREE.SphereGeometry(0.04, 8, 8);
    knot.translate(0, boxSize / 2 + ribbonHeight + 0.02, 0);

    return mergeGeometries([boxGeom, ...ribbons, ...bowLoops, knot]);
}

function createSphereGeometry() {
    return new THREE.SphereGeometry(0.5, 32, 32);
}

function createSnowflakeGeometry() {
    const shape = new THREE.Shape();
    const armLength = 0.5;
    const armWidth = 0.04;
    const branchLength = 0.18;
    const branchAngle = Math.PI / 4;

    for (let arm = 0; arm < 6; arm++) {
        const angle = (arm * Math.PI) / 3;
        const ax = Math.cos(angle) * armLength;
        const ay = Math.sin(angle) * armLength;
        const perpX = Math.cos(angle + Math.PI / 2) * armWidth;
        const perpY = Math.sin(angle + Math.PI / 2) * armWidth;

        if (arm === 0) {
            shape.moveTo(perpX, perpY);
        } else {
            shape.lineTo(perpX, perpY);
        }
        shape.lineTo(ax + perpX, ay + perpY);

        const b1x = Math.cos(angle) * armLength * 0.6;
        const b1y = Math.sin(angle) * armLength * 0.6;
        const branch1EndX = b1x + Math.cos(angle + branchAngle) * branchLength;
        const branch1EndY = b1y + Math.sin(angle + branchAngle) * branchLength;
        shape.lineTo(branch1EndX, branch1EndY);
        shape.lineTo(b1x + perpX * 0.5, b1y + perpY * 0.5);

        const branch2EndX = b1x + Math.cos(angle - branchAngle) * branchLength;
        const branch2EndY = b1y + Math.sin(angle - branchAngle) * branchLength;
        shape.lineTo(branch2EndX, branch2EndY);
        shape.lineTo(ax - perpX, ay - perpY);

        const b2x = Math.cos(angle) * armLength * 0.35;
        const b2y = Math.sin(angle) * armLength * 0.35;
        const branch3EndX = b2x + Math.cos(angle + branchAngle) * branchLength * 0.7;
        const branch3EndY = b2y + Math.sin(angle + branchAngle) * branchLength * 0.7;
        shape.lineTo(branch3EndX, branch3EndY);
        shape.lineTo(b2x, b2y);

        const branch4EndX = b2x + Math.cos(angle - branchAngle) * branchLength * 0.7;
        const branch4EndY = b2y + Math.sin(angle - branchAngle) * branchLength * 0.7;
        shape.lineTo(branch4EndX, branch4EndY);

        shape.lineTo(-perpX, -perpY);
    }

    shape.closePath();

    return new THREE.ExtrudeGeometry(shape, {
        depth: 0.02,
        bevelEnabled: false,
    });
}

function createStarGeometry() {
    const shape = new THREE.Shape();
    const outerRadius = 0.5;
    const innerRadius = 0.25;
    const points = 5;

    for (let i = 0; i < points * 2; i++) {
        const angle = (i * Math.PI) / points - Math.PI / 2;
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (i === 0) shape.moveTo(x, y);
        else shape.lineTo(x, y);
    }
    shape.closePath();

    return new THREE.ExtrudeGeometry(shape, {
        depth: 0.15,
        bevelEnabled: true,
        bevelThickness: 0.02,
        bevelSize: 0.02,
        bevelSegments: 2,
    });
}

function createHeartGeometry() {
    const x = 0, y = 0;
    const shape = new THREE.Shape();
    shape.moveTo(x + 0.25, y + 0.25);
    shape.bezierCurveTo(x + 0.25, y + 0.25, x + 0.20, y, x, y);
    shape.bezierCurveTo(x - 0.30, y, x - 0.30, y + 0.35, x - 0.30, y + 0.35);
    shape.bezierCurveTo(x - 0.30, y + 0.55, x - 0.10, y + 0.77, x + 0.25, y + 0.95);
    shape.bezierCurveTo(x + 0.60, y + 0.77, x + 0.80, y + 0.55, x + 0.80, y + 0.35);
    shape.bezierCurveTo(x + 0.80, y + 0.35, x + 0.80, y, x + 0.50, y);
    shape.bezierCurveTo(x + 0.35, y, x + 0.25, y + 0.25, x + 0.25, y + 0.25);

    return new THREE.ExtrudeGeometry(shape, {
        depth: 0.12,
        bevelEnabled: true,
        bevelThickness: 0.03,
        bevelSize: 0.03,
        bevelSegments: 4,
    });
}

export function initGeometries() {
    geomGiftBox = createGiftBoxGeometry();
    geomSphere = createSphereGeometry();
    geomSnowflake = createSnowflakeGeometry();
    geomStar = createStarGeometry();
    geomHeart = createHeartGeometry();
}

export function getGeometryForType(type) {
    const geometries = {
        'star': geomStar,
        'heart': geomHeart,
        'snowflake': geomSnowflake,
        'present': geomGiftBox,
        'sphere': geomSphere,
        'circle': geomStar,
    };

    if (!geometries[type]) {
        console.warn(`Unknown geometry type: ${type}, falling back to star`);
        return geometries['star'];
    }

    return geometries[type];
}

export function getGeometries() {
    return {
        star: geomStar,
        heart: geomHeart,
        snowflake: geomSnowflake,
        present: geomGiftBox,
        sphere: geomSphere,
    };
}
