// assets/three/lights.js
import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';

export function initLights(scene) {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404060);
    scene.add(ambientLight);
    
    // Main directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);
    
    // Fill light
    const fillLight = new THREE.DirectionalLight(0x4466ff, 0.5);
    fillLight.position.set(-5, 0, 5);
    scene.add(fillLight);
    
    // Back light
    const backLight = new THREE.DirectionalLight(0xff44aa, 0.3);
    backLight.position.set(0, 5, -10);
    scene.add(backLight);
    
    // Point lights for color
    const colors = [0x4f46e5, 0x7c3aed, 0x2563eb];
    colors.forEach((color, i) => {
        const light = new THREE.PointLight(color, 0.5, 20);
        light.position.set(
            Math.sin(i * 2.09) * 5,
            2,
            Math.cos(i * 2.09) * 5
        );
        scene.add(light);
    });
    
    return {
        ambient: ambientLight,
        directional: directionalLight,
        fill: fillLight,
        back: backLight
    };
}
