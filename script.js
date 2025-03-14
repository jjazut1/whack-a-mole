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

const frontLight = new THREE.DirectionalLight(0xffffff, 0.8);
frontLight.position.set(0, 0, 5);
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

// Modify the text rendering function
function updateMoleText(mole, word) {
    const context = mole.userData.textContext;
    const texture = mole.userData.textTexture;
    
    // Clear the canvas
    context.clearRect(0, 0, 1024, 1024);
    
    // Add subtle background for better contrast
    context.fillStyle = 'rgba(255, 255, 255, 0.9)';
    context.fillRect(0, 0, 1024, 1024);
    
    // Set text properties
    context.fillStyle = 'black';
    context.font = 'bold 280px Arial'; // Larger font
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    // Add text shadow for better visibility
    context.shadowColor = 'rgba(0, 0, 0, 0.3)';
    context.shadowBlur = 4;
    context.shadowOffsetX = 2;
    context.shadowOffsetY = 2;
    
    // Draw text
    context.fillText(word, 512, 512);
    
    // Add stroke to the text
    context.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    context.lineWidth = 8;
    context.strokeText(word, 512, 512);
    
    // Reset shadow
    context.shadowColor = 'transparent';
    
    // Update the texture
    texture.needsUpdate = true;
}

// Modify mole creation function
function createMole() {
    const moleGroup = new THREE.Group();
    
    // Body - pure white like the image
    const bodyGeometry = new THREE.SphereGeometry(0.8, 32, 32);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF }); // Pure white
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    moleGroup.add(body);

    // Text plane - improved for better visibility
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 1024; // Increased resolution
    canvas.height = 1024; // Increased resolution
    
    const textTexture = new THREE.Texture(canvas);
    textTexture.minFilter = THREE.LinearFilter; // Improve text sharpness
    textTexture.magFilter = THREE.LinearFilter; // Improve text sharpness
    
    const textMaterial = new THREE.MeshBasicMaterial({
        map: textTexture,
        transparent: true,
        side: THREE.DoubleSide,
    });
    
    const textPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(1.4, 1.4), // Slightly larger text area
        textMaterial
    );
    // Adjusted position for better visibility
    textPlane.position.set(0, -0.15, 0.82); // Moved slightly forward
    moleGroup.add(textPlane);
    
    // Add a background plane behind text for better contrast
    const textBgGeometry = new THREE.PlaneGeometry(1.3, 0.7);
    const textBgMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFFFFF, // White background
        transparent: true,
        opacity: 0.8
    });
    const textBackground = new THREE.Mesh(textBgGeometry, textBgMaterial);
    textBackground.position.set(0, -0.15, 0.81); // Slightly behind text
    moleGroup.add(textBackground);
    
    moleGroup.userData.textTexture = textTexture;
    moleGroup.userData.textContext = context;

    // Eyes - small black dots positioned higher
    const eyeGeometry = new THREE.CircleGeometry(0.06, 32);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    
    // Left eye - moved higher
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.2, 0.4, 0.75);
    moleGroup.add(leftEye);
    
    // Right eye - moved higher
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.2, 0.4, 0.75);
    moleGroup.add(rightEye);

    // Nose - small black dot between and below eyes
    const nose = new THREE.Mesh(
        new THREE.CircleGeometry(0.06, 32),
        new THREE.MeshBasicMaterial({ color: 0x000000 })
    );
    nose.position.set(0, 0.3, 0.78);
    moleGroup.add(nose);

    // Simple straight mouth with slight curve
    const mouthGeometry = new THREE.Shape();
    mouthGeometry.moveTo(-0.15, 0);
    mouthGeometry.quadraticCurveTo(0, -0.03, 0.15, 0); // Very slight curve down
    
    const mouthMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const mouth = new THREE.Mesh(
        new THREE.ShapeGeometry(mouthGeometry),
        mouthMaterial
    );
    
    mouth.position.set(0, 0.2, 0.78); // Positioned between nose and text area
    moleGroup.add(mouth);

    return moleGroup;
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
    const targetY = goingUp ? 0.9 : -1.0; // Raised up position
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
            instructionsElement.innerHTML = `Game Over! Final Score: ${score}<br>Click anywhere to play again`;
            instructionsElement.style.display = 'block';
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
            }
        }, 1500);
    }
    
    setTimeout(gameLoop, 2000);
}
