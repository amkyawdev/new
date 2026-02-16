// assets/three/scene.js
import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';
import { initLights } from './lights.js';
import { initCamera } from './camera.js';

export function initThreeScene(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return null;
    
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a1a);
    
    const camera = initCamera();
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    container.appendChild(renderer.domElement);
    
    // Lights
    const lights = initLights(scene);
    
    // Create floating geometric shapes
    createFloatingShapes(scene);
    
    // Animation
    let clock = new THREE.Clock();
    
    function animate() {
        requestAnimationFrame(animate);
        
        const delta = clock.getDelta();
        const elapsedTime = performance.now() / 1000;
        
        // Rotate shapes
        scene.children.forEach(child => {
            if (child.userData.rotate) {
                child.rotation.x += 0.001;
                child.rotation.y += 0.002;
                child.position.y += Math.sin(elapsedTime + child.position.x) * 0.002;
            }
        });
        
        renderer.render(scene, camera);
    }
    
    animate();
    
    // Handle resize
    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
    
    return { scene, camera, renderer };
}

function createFloatingShapes(scene) {
    const geometries = [
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.SphereGeometry(0.6, 32, 32),
        new THREE.TorusGeometry(0.5, 0.2, 16, 100),
        new THREE.IcosahedronGeometry(0.7),
        new THREE.ConeGeometry(0.7, 1.2, 8)
    ];
    
    const colors = [0x4f46e5, 0x7c3aed, 0x2563eb, 0x0891b2, 0x059669];
    
    for (let i = 0; i < 20; i++) {
        const geometry = geometries[Math.floor(Math.random() * geometries.length)];
        const material = new THREE.MeshStandardMaterial({
            color: colors[Math.floor(Math.random() * colors.length)],
            emissive: 0x000000,
            roughness: 0.3,
            metalness: 0.1,
            transparent: true,
            opacity: 0.8
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        
        // Random position in a sphere
        const radius = 5 + Math.random() * 5;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        mesh.position.x = radius * Math.sin(phi) * Math.cos(theta);
        mesh.position.y = radius * Math.sin(phi) * Math.sin(theta);
        mesh.position.z = radius * Math.cos(phi);
        
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData.rotate = true;
        
        scene.add(mesh);
    }
    
    // Add a central glowing sphere
    const sphereGeo = new THREE.SphereGeometry(1.5, 64, 64);
    const sphereMat = new THREE.MeshStandardMaterial({
        color: 0x4f46e5,
        emissive: 0x1e1b4b,
        roughness: 0.1,
        metalness: 0.2
    });
    const centerSphere = new THREE.Mesh(sphereGeo, sphereMat);
    centerSphere.position.set(0, 0, 0);
    centerSphere.userData.rotate = true;
    scene.add(centerSphere);
    
    // Add floating particles
    const particlesGeo = new THREE.BufferGeometry();
    const particlesCount = 1000;
    const posArray = new Float32Array(particlesCount * 3);
    
    for (let i = 0; i < particlesCount * 3; i += 3) {
        posArray[i] = (Math.random() - 0.5) * 30;
        posArray[i + 1] = (Math.random() - 0.5) * 30;
        posArray[i + 2] = (Math.random() - 0.5) * 30;
    }
    
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    
    const particlesMat = new THREE.PointsMaterial({
        size: 0.1,
        color: 0xffffff,
        transparent: true,
        opacity: 0.6
    });
    
    const particlesMesh = new THREE.Points(particlesGeo, particlesMat);
    scene.add(particlesMesh);
}
