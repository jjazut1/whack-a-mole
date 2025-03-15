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

// Add word lists
const shortAWords = ['hat', 'cat', 'bat', 'mad', 'sad', 'bad', 'dad', 'had', 'lap', 'map', 'nap', 'rap'];
const otherWords = ['hit', 'hot', 'but', 'set', 'sit', 'let', 'pot', 'put', 'met'];
let currentWord = '';
let isShortAWord = false;

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

// Add word display element
const wordElement = document.createElement('div');
wordElement.style.position = 'absolute';
wordElement.style.top = '50%';
wordElement.style.left = '50%';
wordElement.style.transform = 'translate(-50%, -50%)';
wordElement.style.color = 'white';
wordElement.style.fontSize = '48px';
wordElement.style.fontWeight = 'bold';
wordElement.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
document.body.appendChild(wordElement);

// Add instructions element
const instructionsElement = document.createElement('div');
instructionsElement.style.position = 'absolute';
instructionsElement.style.bottom = '20px';
instructionsElement.style.left = '50%';
instructionsElement.style.transform = 'translateX(-50%)';
instructionsElement.style.color = 'white';
instructionsElement.style.fontSize = '24px';
instructionsElement.style.textAlign = 'center';
instructionsElement.innerHTML = 'Hit the mole when you see a word with the short "a" sound!<br>Click anywhere to start';
document.body.appendChild(instructionsElement);

// Improved Lighting - using multiple lights for better illumination
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 5);
scene.add(directionalLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
fillLight.position.set(-5, 8, -5);
scene.add(fillLight);

// Ground
const groundGeometry = new THREE.PlaneGeometry(10, 10);
const groundMaterial = new THREE.MeshLambertMaterial({ 
    color: 0x4CAF50  // Brighter green color
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

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

// Mole materials with brighter colors
const moleBodyGeometry = new THREE.SphereGeometry(0.5, 32, 32);
const moleNoseGeometry = new THREE.SphereGeometry(0.15, 16, 16);
const moleEyeGeometry = new THREE.SphereGeometry(0.1, 16, 16);
const moleMaterial = new THREE.MeshLambertMaterial({ 
    color: 0xA0522D  // Warmer brown color
});
const moleNoseMaterial = new THREE.MeshLambertMaterial({ 
    color: 0x1A1A1A  // Dark gray for nose
});
const moleEyeMaterial = new THREE.MeshLambertMaterial({ 
    color: 0x1A1A1A  // Dark gray for eyes
});

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
    
    if (goingUp) {
        assignNewWord();
    }
    
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
            wordElement.textContent = '';
            instructionsElement.innerHTML = `Game Over! Final Score: ${score}<br>Click anywhere to play again`;
        }
    }, 1000);
}

function assignNewWord() {
    // 70% chance of short 'a' word
    isShortAWord = Math.random() < 0.7;
    const wordList = isShortAWord ? shortAWords : otherWords;
    currentWord = wordList[Math.floor(Math.random() * wordList.length)];
    wordElement.textContent = currentWord;
    // Change color based on word type
    wordElement.style.color = isShortAWord ? '#FFD700' : 'white';
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
        
        setTimeout(() => {
            if (randomMole.userData.isUp) {
                animateMole(randomMole, false);
                wordElement.textContent = '';
            }
        }, 1500); // Increased time to read the word
    }
    
    setTimeout(gameLoop, 2000); // Slightly slower pace for reading
}

// Modified click handler
window.addEventListener('click', (event) => {
    if (!gameActive) {
        startGame();
        instructionsElement.style.display = 'none';
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
            if (isShortAWord) {
                score += 10;
                // Add success feedback
                wordElement.style.color = '#00FF00';
                setTimeout(() => {
                    wordElement.style.color = 'white';
                }, 200);
            } else {
                score = Math.max(0, score - 5);
                // Add error feedback
                wordElement.style.color = '#FF0000';
                setTimeout(() => {
                    wordElement.style.color = 'white';
                }, 200);
            }
            updateUI();
            animateMole(hitMole, false);
            wordElement.textContent = '';
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
