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
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 5);
scene.add(directionalLight);

const frontLight = new THREE.DirectionalLight(0xffffff, 0.5);
frontLight.position.set(0, 2, 8);
scene.add(frontLight);

// Ground
const groundGeometry = new THREE.PlaneGeometry(10, 10);
const groundMaterial = new THREE.MeshLambertMaterial({ 
    color: 0x4CAF50  // Brighter green color
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// Hole creation
const holeGeometry = new THREE.CircleGeometry(1.0, 32);
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
    hole.position.set(pos.x * 1.5, 0.01, pos.z * 1.5);
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
    const mole = createMole();
    mole.position.set(pos.x * 1.5, -1.5, pos.z * 1.5);
    mole.userData.isUp = false;
    mole.userData.isMoving = false;
    scene.add(mole);
    moles.push(mole);
});

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
                // Add success indicator at hit position
                createSuccessIndicator(hitMole.position.clone().add(new THREE.Vector3(0, 1, 0)));
            } else {
                score = Math.max(0, score - 5);
            }
            updateUI();
            animateMole(hitMole, false);
        }
    }
});

// Camera Position
camera.position.set(0, 6, 8);
camera.lookAt(0, 0, 0);

// Animation Loop
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();

// Add success indicator function
function createSuccessIndicator(position) {
    const particles = [];
    const particleCount = 20;
    const colors = [0xFFFF00, 0x00FF00, 0xFF00FF]; // Yellow, green, and pink particles
    
    for (let i = 0; i < particleCount; i++) {
        const geometry = new THREE.SphereGeometry(0.1, 8, 8);
        const material = new THREE.MeshBasicMaterial({ 
            color: colors[Math.floor(Math.random() * colors.length)],
            transparent: true 
        });
        const particle = new THREE.Mesh(geometry, material);
        
        // Set initial position at hit point
        particle.position.copy(position);
        
        // Random velocity
        particle.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.3,
            Math.random() * 0.2,
            (Math.random() - 0.5) * 0.3
        );
        
        scene.add(particle);
        particles.push(particle);
    }
    
    // Animate particles
    let elapsed = 0;
    function animateParticles() {
        elapsed += 0.016; // Approximate for 60fps
        
        particles.forEach((particle, i) => {
            particle.position.add(particle.velocity);
            particle.velocity.y -= 0.01; // Gravity
            particle.material.opacity = 1 - (elapsed * 2);
            particle.scale.multiplyScalar(0.98); // Shrink particles
        });
        
        if (elapsed < 0.5) { // Animation duration
            requestAnimationFrame(animateParticles);
        } else {
            // Clean up particles
            particles.forEach(particle => scene.remove(particle));
        }
    }
    
    animateParticles();
}

// Modify mole creation function
function createMole() {
    const moleGroup = new THREE.Group();
    
    // Body - make it larger
    const bodyGeometry = new THREE.SphereGeometry(0.8, 32, 32);
    bodyGeometry.scale(1, 1.2, 0.8);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0xFFD280 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    moleGroup.add(body);

    // Text plane - moved lower
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 128;
    
    const textTexture = new THREE.Texture(canvas);
    const textMaterial = new THREE.MeshBasicMaterial({
        map: textTexture,
        transparent: true,
        side: THREE.DoubleSide
    });
    
    const textPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(1.2, 0.6), // Larger text area
        textMaterial
    );
    textPlane.position.set(0, -0.1, 0.42); // Moved down
    textPlane.rotation.x = -0.2;
    moleGroup.add(textPlane);
    
    moleGroup.userData.textTexture = textTexture;
    moleGroup.userData.textContext = context;

    // Larger eyes
    const eyeGeometry = new THREE.SphereGeometry(0.15, 16, 16);
    const eyeWhiteMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    const eyePupilMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
    
    // Eyes with pupils
    const leftEyeWhite = new THREE.Mesh(eyeGeometry, eyeWhiteMaterial);
    leftEyeWhite.position.set(-0.3, 0.6, 0.35);
    moleGroup.add(leftEyeWhite);
    
    const leftEyePupil = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 16, 16),
        eyePupilMaterial
    );
    leftEyePupil.position.set(-0.3, 0.6, 0.48);
    moleGroup.add(leftEyePupil);
    
    const rightEyeWhite = new THREE.Mesh(eyeGeometry, eyeWhiteMaterial);
    rightEyeWhite.position.set(0.3, 0.6, 0.35);
    moleGroup.add(rightEyeWhite);
    
    const rightEyePupil = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 16, 16),
        eyePupilMaterial
    );
    rightEyePupil.position.set(0.3, 0.6, 0.48);
    moleGroup.add(rightEyePupil);

    // Add smile
    const smile = new THREE.Mesh(
        new THREE.TorusGeometry(0.2, 0.05, 16, 32, Math.PI),
        new THREE.MeshLambertMaterial({ color: 0x000000 })
    );
    smile.position.set(0, 0.2, 0.6);
    smile.rotation.x = -Math.PI / 2;
    moleGroup.add(smile);

    // Nose
    const nose = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 16, 16),
        new THREE.MeshLambertMaterial({ color: 0x000000 })
    );
    nose.position.set(0, 0.4, 0.6);
    moleGroup.add(nose);

    // Updated whisker positions
    const whiskerMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const whiskerGeometry = new THREE.CylinderGeometry(0.005, 0.005, 0.4);
    
    // Whiskers adjusted for larger mole
    [-1, 1].forEach(side => {
        [0.4, 0.2].forEach(height => {
            const whisker = new THREE.Mesh(whiskerGeometry, whiskerMaterial);
            whisker.position.set(0.4 * side, height, 0.4);
            whisker.rotation.z = Math.PI / 6 * -side;
            whisker.rotation.y = Math.PI / 6 * side;
            moleGroup.add(whisker);
        });
    });

    return moleGroup;
}

// Update the text rendering function for a more cartoon-like style
function updateMoleText(mole, word) {
    const context = mole.userData.textContext;
    const texture = mole.userData.textTexture;
    
    // Clear the canvas
    context.clearRect(0, 0, 256, 128);
    
    // Set text properties
    context.fillStyle = 'black';
    context.font = 'bold 72px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    // Draw text
    context.fillText(word, 128, 64);
    
    // Update the texture
    texture.needsUpdate = true;
}

// Modify the assignNewWord function
function assignNewWord(mole) {
    isShortAWord = Math.random() < 0.7;
    const wordList = isShortAWord ? shortAWords : otherWords;
    currentWord = wordList[Math.floor(Math.random() * wordList.length)];
    updateMoleText(mole, currentWord);
}

// Modify the animateMole function
function animateMole(mole, goingUp) {
    if (mole.userData.isMoving) return;
    
    mole.userData.isMoving = true;
    const targetY = goingUp ? 0.5 : -1.0; // Adjusted up position to be higher, down position to be less deep
    const duration = 200;
    const startY = mole.position.y;
    const startTime = Date.now();
    
    if (goingUp) {
        assignNewWord(mole);
    } else {
        updateMoleText(mole, '');
    }
    
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
