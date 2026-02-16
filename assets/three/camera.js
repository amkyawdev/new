// assets/three/camera.js
import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';

export function initCamera() {
    const camera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    
    camera.position.set(10, 5, 15);
    camera.lookAt(0, 0, 0);
    
    return camera;
}

export function createOrbitControls(camera, renderer) {
    // Simple auto-rotation
    let angle = 0;
    
    function update() {
        angle += 0.001;
        camera.position.x = 15 * Math.sin(angle);
        camera.position.z = 15 * Math.cos(angle);
        camera.lookAt(0, 0, 0);
        
        requestAnimationFrame(update);
    }
    
    update();
}
