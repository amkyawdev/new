// assets/three/loaderScene.js
import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';

export function createLoaderScene(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return null;
    
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a1a);
    
    const camera = new THREE.PerspectiveCamera(
        45,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );
    camera.position.set(5, 2, 8);
    camera.lookAt(0, 0, 0);
    
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    
    // Lights
    const ambientLight = new THREE.AmbientLight(0x404060);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(2, 5, 3);
    scene.add(directionalLight);
    
    // Create robot loader
    const robotGroup = new THREE.Group();
    
    // Body
    const bodyGeo = new THREE.BoxGeometry(1.2, 1.5, 0.8);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x4f46e5, emissive: 0x1a1a3a });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.75;
    robotGroup.add(body);
    
    // Head
    const headGeo = new THREE.SphereGeometry(0.6, 32, 32);
    const headMat = new THREE.MeshStandardMaterial({ color: 0x7c3aed, emissive: 0x2a1a4a });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.8;
    robotGroup.add(head);
    
    // Eyes
    const eyeGeo = new THREE.SphereGeometry(0.15, 16, 16);
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x4488ff });
    
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.2, 1.9, 0.5);
    robotGroup.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.2, 1.9, 0.5);
    robotGroup.add(rightEye);
    
    // Antenna
    const antennaGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.4);
    const antennaMat = new THREE.MeshStandardMaterial({ color: 0xffaa00 });
    const antenna = new THREE.Mesh(antennaGeo, antennaMat);
    antenna.position.set(0, 2.3, 0.3);
    antenna.rotation.x = 0.2;
    robotGroup.add(antenna);
    
    // Arms
    const armGeo = new THREE.CylinderGeometry(0.15, 0.15, 1.2);
    const armMat = new THREE.MeshStandardMaterial({ color: 0x2563eb });
    
    const leftArm = new THREE.Mesh(armGeo, armMat);
    leftArm.position.set(-0.9, 1.2, 0);
    leftArm.rotation.z = 0.3;
    robotGroup.add(leftArm);
    
    const rightArm = new THREE.Mesh(armGeo, armMat);
    rightArm.position.set(0.9, 1.2, 0);
    rightArm.rotation.z = -0.3;
    robotGroup.add(rightArm);
    
    scene.add(robotGroup);
    
    // Floating particles
    const particlesGeo = new THREE.BufferGeometry();
    const particlesCount = 200;
    const posArray = new Float32Array(particlesCount * 3);
    
    for (let i = 0; i < particlesCount * 3; i += 3) {
        posArray[i] = (Math.random() - 0.5) * 10;
        posArray[i + 1] = (Math.random() - 0.5) * 10;
        posArray[i + 2] = (Math.random() - 0.5) * 10;
    }
    
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMat = new THREE.PointsMaterial({
        size: 0.1,
        color: 0x4f46e5,
        transparent: true
    });
    const particles = new THREE.Points(particlesGeo, particlesMat);
    scene.add(particles);
    
    // Animation
    let time = 0;
    
    function animate() {
        requestAnimationFrame(animate);
        
        time += 0.01;
        
        // Robot floating animation
        robotGroup.position.y = Math.sin(time) * 0.2;
        robotGroup.rotation.y += 0.005;
        
        // Rotate particles
        particles.rotation.y += 0.001;
        
        // Blink eyes
        if (Math.sin(time * 5) > 0.8) {
            leftEye.material.emissive.setHex(0x000000);
            rightEye.material.emissive.setHex(0x000000);
        } else {
            leftEye.material.emissive.setHex(0x4488ff);
            rightEye.material.emissive.setHex(0x4488ff);
        }
        
        renderer.render(scene, camera);
    }
    
    animate();
    
    // Handle resize
    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
    
    return { scene, camera, renderer, robotGroup };
}
