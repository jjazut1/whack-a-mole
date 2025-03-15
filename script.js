// Import Three.js (Make sure you include Three.js in your HTML)
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.min.js';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Sky blue background
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.physicallyCorrectLights = true;
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

// Improved Lighting - using multiple lights for better illumination
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 5);
scene.add(directionalLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
fillLight.position.set(-5, 8, -5);
scene.add(fillLight);

// Add clouds
function createCloud() {
    const cloudGroup = new THREE.Group();
    const cloudMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
    
    // Create multiple spheres for each cloud
    const sphereSizes = [
        { radius: 0.5, x: 0, y: 0, z: 0 },
        { radius: 0.4, x: 0.4, y: -0.1, z: 0 },
        { radius: 0.4, x: -0.4, y: -0.1, z: 0 },
        { radius: 0.4, x: 0, y: -0.1, z: 0.4 },
        { radius: 0.4, x: 0, y: -0.1, z: -0.4 }
    ];

    sphereSizes.forEach(({ radius, x, y, z }) => {
        const cloudPiece = new THREE.Mesh(
            new THREE.SphereGeometry(radius, 16, 16),
            cloudMaterial
        );
        cloudPiece.position.set(x, y, z);
        cloudGroup.add(cloudPiece);
    });

    return cloudGroup;
}

// Add multiple clouds to the scene
const clouds = [];
for (let i = 0; i < 5; i++) {
    const cloud = createCloud();
    cloud.position.set(
        Math.random() * 20 - 10,
        Math.random() * 3 + 5,
        Math.random() * 20 - 10
    );
    cloud.scale.set(1.5, 1, 1.5);
    clouds.push(cloud);
    scene.add(cloud);
}

// Create hill (replacing the old ground)
const hillGeometry = new THREE.SphereGeometry(8, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
const hillMaterial = new THREE.MeshLambertMaterial({ 
    color: 0x4CAF50,
    wireframe: false
});
const hill = new THREE.Mesh(hillGeometry, hillMaterial);
hill.position.y = -7; // Adjust this value to position the hill correctly
scene.add(hill);

// Add grass detail texture overlay
const grassDetailGeometry = new THREE.PlaneGeometry(16, 16, 32, 32);
const grassVertices = grassDetailGeometry.attributes.position.array;
for (let i = 0; i < grassVertices.length; i += 3) {
    grassVertices[i + 1] = Math.random() * 0.2; // Random height variation
}
const grassDetailMaterial = new THREE.MeshLambertMaterial({
    color: 0x3d8c40,
    side: THREE.DoubleSide
});
const grassDetail = new THREE.Mesh(grassDetailGeometry, grassDetailMaterial);
grassDetail.rotation.x = -Math.PI / 2;
grassDetail.position.y = 0.1;
scene.add(grassDetail);

// Hole creation
const holeGeometry = new THREE.CircleGeometry(0.7, 32);
const holeMaterial = new THREE.MeshLambertMaterial({ 
    color: 0x2C2C2C  // Dark gray for holes
});
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

// Improved mole appearance with better face details
function createMole() {
    const moleGroup = new THREE.Group();
    
    // Body
    const body = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 32, 32),
        new THREE.MeshLambertMaterial({ color: 0x8B4513 })
    );
    moleGroup.add(body);

    // Snout
    const snout = new THREE.Mesh(
        new THREE.ConeGeometry(0.25, 0.3, 32),
        new THREE.MeshLambertMaterial({ color: 0x9B5523 })
    );
    snout.rotation.x = Math.PI / 2;
    snout.position.set(0, 0, 0.4);
    moleGroup.add(snout);

    // Nose
    const nose = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 16, 16),
        new THREE.MeshLambertMaterial({ color: 0x000000 })
    );
    nose.position.set(0, 0, 0.6);
    moleGroup.add(nose);

    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(0.08, 16, 16);
    const eyeMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
    const eyeWhiteMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
    
    // Left eye
    const leftEyeWhite = new THREE.Mesh(
        eyeGeometry,
        eyeWhiteMaterial
    );
    leftEyeWhite.position.set(-0.2, 0.2, 0.35);
    moleGroup.add(leftEyeWhite);
    
    const leftEye = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 16, 16),
        eyeMaterial
    );
    leftEye.position.set(-0.2, 0.2, 0.42);
    moleGroup.add(leftEye);

    // Right eye
    const rightEyeWhite = new THREE.Mesh(
        eyeGeometry,
        eyeWhiteMaterial
    );
    rightEyeWhite.position.set(0.2, 0.2, 0.35);
    moleGroup.add(rightEyeWhite);
    
    const rightEye = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 16, 16),
        eyeMaterial
    );
    rightEye.position.set(0.2, 0.2, 0.42);
    moleGroup.add(rightEye);

    // Whiskers
    const whiskerMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
    const whiskerGeometry = new THREE.BufferGeometry();
    
    const whiskerPositions = [
        // Left whiskers
        [-0.2, 0, 0.4, -0.5, 0.1, 0.5],
        [-0.2, 0, 0.4, -0.5, 0, 0.5],
        [-0.2, 0, 0.4, -0.5, -0.1, 0.5],
        // Right whiskers
        [0.2, 0, 0.4, 0.5, 0.1, 0.5],
        [0.2, 0, 0.4, 0.5, 0, 0.5],
        [0.2, 0, 0.4, 0.5, -0.1, 0.5]
    ];
    
    whiskerPositions.forEach(positions => {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        const whisker = new THREE.Line(geometry, whiskerMaterial);
        moleGroup.add(whisker);
    });

    return moleGroup;
}

// Replace existing moles with new detailed moles
const moles = [];
holes.forEach(pos => {
    const mole = createMole();
    mole.position.set(pos.x, -1.5, pos.z);
    mole.userData.isUp = false;
    mole.userData.isMoving = false;
    scene.add(mole);
    moles.push(mole);
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
    
    // Animate clouds
    clouds.forEach((cloud, index) => {
        cloud.position.x += 0.005 * (index % 2 ? 1 : -1);
        if (cloud.position.x > 15) cloud.position.x = -15;
        if (cloud.position.x < -15) cloud.position.x = 15;
    });
    
    renderer.render(scene, camera);
}
animate();
