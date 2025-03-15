// Import Three.js (Make sure you include Three.js in your HTML)
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.min.js';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x87CEEB); // Sky blue background
renderer.outputEncoding = THREE.sRGBEncoding; // Add proper color encoding
document.body.appendChild(renderer.domElement);

// Game state
let score = 0;
let gameActive = false;
let timeRemaining = 30; // 30 seconds game duration

// UI Setup
const scoreElement = document.createElement('div');
scoreElement.style.position = 'absolute';
scoreElement.style.top = '20px';
scoreElement.style.left = '20px';
scoreElement.style.color = 'white';
scoreElement.style.fontSize = '24px';
document.body.appendChild(scoreElement);

const timerElement = document.createElement('div');
timerElement.style.position = 'absolute';
timerElement.style.top = '20px';
timerElement.style.right = '20px';
timerElement.style.color = 'white';
timerElement.style.fontSize = '24px';
document.body.appendChild(timerElement);

// Improved Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 5);
scene.add(directionalLight);

// Ground with better material
const groundGeometry = new THREE.PlaneGeometry(10, 10);
const groundMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x3c8f3c,  // Green color instead of texture
    side: THREE.DoubleSide
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// Hole creation
const holeGeometry = new THREE.CircleGeometry(0.7, 32);
const holeMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a }); // Dark gray instead of pure black
const holes = [
    { x: -2, z: -2 }, { x: 2, z: -2 },
    { x: -2, z: 2 }, { x: 2, z: 2 }
];

holes.forEach(pos => {
    const hole = new THREE.Mesh(holeGeometry, holeMaterial);
    hole.rotation.x = -Math.PI / 2;
    hole.position.set(pos.x, 0.01, pos.z);
    scene.add(hole);
});

// Improved mole appearance
const moleBodyGeometry = new THREE.SphereGeometry(0.5, 32, 32);
const moleNoseGeometry = new THREE.SphereGeometry(0.15, 16, 16);
const moleEyeGeometry = new THREE.SphereGeometry(0.1, 16, 16);
const moleMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 }); // Changed to MeshPhongMaterial
const moleNoseMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
const moleEyeMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });

const moles = [];
holes.forEach(pos => {
    const moleGroup = new THREE.Group();
    
    const moleBody = new THREE.Mesh(moleBodyGeometry, moleMaterial);
    const moleNose = new THREE.Mesh(moleNoseGeometry, moleNoseMaterial);
    const moleEyeLeft = new THREE.Mesh(moleEyeGeometry, moleEyeMaterial);
    const moleEyeRight = new THREE.Mesh(moleEyeGeometry, moleEyeMaterial);
    
    moleNose.position.z = 0.5;
    moleEyeLeft.position.set(-0.2, 0.2, 0.4);
    moleEyeRight.position.set(0.2, 0.2, 0.4);
    
    moleGroup.add(moleBody);
    moleGroup.add(moleNose);
    moleGroup.add(moleEyeLeft);
    moleGroup.add(moleEyeRight);
    
    moleGroup.position.set(pos.x, -1.5, pos.z);
    moleGroup.userData.isUp = false;
    moleGroup.userData.isMoving = false;
    
    scene.add(moleGroup);
    moles.push(moleGroup);
});

// Improved mole animation
function animateMole(mole, goingUp) {
    if (mole.userData.isMoving) return;
    
    mole.userData.isMoving = true;
    const targetY = goingUp ? 0 : -1.5;
    const duration = 200;
    const startY = mole.position.y;
    const startTime = Date.now();
    
    function update() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const ease = progress < 0.5 
            ? 2 * progress * progress 
            : -1 + (4 - 2 * progress) * progress;
            
        mole.position.y = startY + (targetY - startY) * ease;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            mole.userData.isMoving = false;
            mole.userData.isUp = goingUp;
        }
    }
    update();
}

// Game logic
function startGame() {
    score = 0;
    timeRemaining = 30;
    gameActive = true;
    updateUI();
    gameLoop();
    
    const gameTimer = setInterval(() => {
        timeRemaining--;
        updateUI();
        if (timeRemaining <= 0) {
            gameActive = false;
            clearInterval(gameTimer);
            alert(`Game Over! Final Score: ${score}`);
        }
    }, 1000);
}

function updateUI() {
    scoreElement.textContent = `Score: ${score}`;
    timerElement.textContent = `Time: ${timeRemaining}s`;
}

function gameLoop() {
    if (!gameActive) return;
    
    const availableMoles = moles.filter(mole => !mole.userData.isUp && !mole.userData.isMoving);
    if (availableMoles.length > 0) {
        const randomMole = availableMoles[Math.floor(Math.random() * availableMoles.length)];
        animateMole(randomMole, true);
        
        // Hide mole after random time
        setTimeout(() => {
            if (randomMole.userData.isUp) {
                animateMole(randomMole, false);
            }
        }, 800 + Math.random() * 500);
    }
    
    setTimeout(gameLoop, 1000 + Math.random() * 500);
}

// Enhanced click detection
window.addEventListener('click', (event) => {
    if (!gameActive) {
        startGame();
        return;
    }
    
    const mouse = new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
    );
    
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    
    const intersects = raycaster.intersectObjects(
        moles.map(moleGroup => moleGroup.children[0])
    );
    
    if (intersects.length > 0) {
        const hitMole = intersects[0].object.parent;
        if (hitMole.userData.isUp && !hitMole.userData.isMoving) {
            score += 10;
            updateUI();
            animateMole(hitMole, false);
        }
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
