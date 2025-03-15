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

    // Add a quick smile animation
    const mole = moles.find(m => m.position.equals(position));
    if (mole) {
        const originalY = mole.scale.y;
        mole.scale.y *= 1.2; // Stretch up slightly
        setTimeout(() => {
            mole.scale.y = originalY;
        }, 200);
    }
}

// Modify the text rendering function
function updateMoleText(mole, word) {
    const context = mole.userData.textContext;
    const texture = mole.userData.textTexture;
    
    // Clear the canvas
    context.clearRect(0, 0, 256, 128);
    
    // Set text properties with larger, bolder font
    context.fillStyle = 'black';
    context.font = 'bold 84px Arial'; // Increased font size
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    // Draw text
    context.fillText(word, 128, 64);
    
    // Update the texture
    texture.needsUpdate = true;
}

// Modify mole creation function
function createMole() {
    const moleGroup = new THREE.Group();
    
    // Body
    const bodyGeometry = new THREE.SphereGeometry(0.8, 32, 32);
    bodyGeometry.scale(1, 1.2, 0.8);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0xFFD280 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    moleGroup.add(body);

    // Text plane setup remains the same
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 256;
    
    const textTexture = new THREE.Texture(canvas);
    const textMaterial = new THREE.MeshBasicMaterial({
        map: textTexture,
        transparent: true,
        side: THREE.DoubleSide
    });
    
    const textPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(1.4, 0.7),
        textMaterial
    );
    textPlane.position.set(0, -0.1, 0.65);
    textPlane.rotation.x = -0.3;
    moleGroup.add(textPlane);
    
    moleGroup.userData.textTexture = textTexture;
    moleGroup.userData.textContext = context;

    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(0.15, 16, 16);
    const eyeWhiteMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    const eyePupilMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
    
    // Left eye
    const leftEyeWhite = new THREE.Mesh(eyeGeometry, eyeWhiteMaterial);
    leftEyeWhite.position.set(-0.3, 0.6, 0.45);
    moleGroup.add(leftEyeWhite);
    
    const leftEyePupil = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 16, 16),
        eyePupilMaterial
    );
    leftEyePupil.position.set(-0.3, 0.6, 0.58);
    moleGroup.add(leftEyePupil);
    
    // Right eye
    const rightEyeWhite = new THREE.Mesh(eyeGeometry, eyeWhiteMaterial);
    rightEyeWhite.position.set(0.3, 0.6, 0.45);
    moleGroup.add(rightEyeWhite);
    
    const rightEyePupil = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 16, 16),
        eyePupilMaterial
    );
    rightEyePupil.position.set(0.3, 0.6, 0.58);
    moleGroup.add(rightEyePupil);

    // Nose
    const nose = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 16, 16),
        new THREE.MeshLambertMaterial({ color: 0x000000 })
    );
    nose.position.set(0, 0.45, 0.65);
    moleGroup.add(nose);

    // New cartoon-style mouth
    // Create mouth background (white area)
    const mouthBgGeometry = new THREE.CircleGeometry(0.25, 32);
    const mouthBgMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    const mouthBg = new THREE.Mesh(mouthBgGeometry, mouthBgMaterial);
    mouthBg.position.set(0, 0.25, 0.65);
    mouthBg.rotation.y = Math.PI;
    moleGroup.add(mouthBg);

    // Create smile line
    const smileShape = new THREE.Shape();
    smileShape.moveTo(-0.2, 0);
    smileShape.quadraticCurveTo(0, -0.15, 0.2, 0);
    
    const smileGeometry = new THREE.ShapeGeometry(smileShape);
    const smileMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const smile = new THREE.Mesh(smileGeometry, smileMaterial);
    smile.position.set(0, 0.25, 0.66);
    smile.rotation.y = Math.PI;
    moleGroup.add(smile);

    // Integrated whiskers with curved geometry
    const whiskerMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    
    // Create curved whiskers using custom geometry
    const createWhisker = (side, height, angle) => {
        const curve = new THREE.QuadraticBezierCurve3(
            new THREE.Vector3(0, height, 0.65),
            new THREE.Vector3(side * 0.3, height, 0.75),
            new THREE.Vector3(side * 0.6, height + 0.1, 0.65)
        );

        const points = curve.getPoints(10);
        const whiskerGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const whisker = new THREE.Line(whiskerGeometry, whiskerMaterial);
        moleGroup.add(whisker);
    };

    // Add whiskers on both sides
    createWhisker(-1, 0.3, Math.PI / 6);  // Upper left
    createWhisker(-1, 0.2, Math.PI / 8);  // Lower left
    createWhisker(1, 0.3, -Math.PI / 6);  // Upper right
    createWhisker(1, 0.2, -Math.PI / 8);  // Lower right

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
    const targetY = goingUp ? 0.7 : -1.0; // Adjusted up position
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
