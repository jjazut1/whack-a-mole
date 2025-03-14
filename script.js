// Import Three.js (Make sure you include Three.js in your HTML)
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.min.js';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting
const light = new THREE.AmbientLight(0xffffff, 1);
scene.add(light);

// Ground
const groundGeometry = new THREE.PlaneGeometry(10, 10);
const groundMaterial = new THREE.MeshBasicMaterial({ color: 0x228B22, side: THREE.DoubleSide });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// Mole Holes Positions
const holes = [
    { x: -2, z: -2 }, { x: 2, z: -2 },
    { x: -2, z: 2 }, { x: 2, z: 2 }
];

// Moles
const moles = [];
const moleGeometry = new THREE.SphereGeometry(0.5, 32, 32);
const moleMaterial = new THREE.MeshBasicMaterial({ color: 0x8B4513 });

holes.forEach(pos => {
    const mole = new THREE.Mesh(moleGeometry, moleMaterial);
    mole.position.set(pos.x, -0.5, pos.z); // Start hidden
    scene.add(mole);
    moles.push(mole);
});

// Animate Moles Randomly
function popUpMole() {
    const mole = moles[Math.floor(Math.random() * moles.length)];
    mole.position.y = 0.5;
    setTimeout(() => mole.position.y = -0.5, 800);
    setTimeout(popUpMole, 1000 + Math.random() * 2000);
}
popUpMole();

// Mouse Click Detection
window.addEventListener('click', (event) => {
    const mouse = new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
    );
    
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    
    const intersects = raycaster.intersectObjects(moles);
    if (intersects.length > 0) {
        intersects[0].object.position.y = -0.5; // Hide the mole
        console.log('Mole Whacked!');
    }
});

// Camera Position
camera.position.set(0, 5, 5);
camera.lookAt(0, 0, 0);

// Animation Loop
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();
