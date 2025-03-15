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
camera.position.set(0, 4, 8);
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

// Add wooden sign for rules
function createWoodenSign() {
    const signGroup = new THREE.Group();
    
    // Post
    const postGeometry = new THREE.BoxGeometry(0.2, 2, 0.2);
    const woodMaterial = new THREE.MeshLambertMaterial({ color: 0x4A3219 });
    const post = new THREE.Mesh(postGeometry, woodMaterial);
    post.position.set(0, 1, 0);
    signGroup.add(post);

    // Sign boards
    const createBoard = (text, y) => {
        const boardGeometry = new THREE.BoxGeometry(2, 0.4, 0.1);
        const board = new THREE.Mesh(boardGeometry, woodMaterial);
        board.position.set(0, y, 0);

        // Text on board
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 128;
        
        context.fillStyle = 'white';
        context.font = 'bold 48px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(text, 256, 64);

        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;

        const textGeometry = new THREE.PlaneGeometry(1.8, 0.3);
        const textMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide
        });
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        textMesh.position.set(0, y, 0.06);
        
        signGroup.add(board);
        signGroup.add(textMesh);
    };

    createBoard('The Rules', 1.5);
    createBoard('Hit words', 1.0);
    createBoard('with letter b', 0.5);
    createBoard('Hit mole to start', 0);

    signGroup.position.set(0, 1, -2);
    return signGroup;
}

// Modified mole creation function
function createMole() {
    const moleGroup = new THREE.Group();
    
    // Body - more rectangular shape
    const bodyGeometry = new THREE.BoxGeometry(1.2, 1.4, 0.8);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0xFFD280 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    bodyGeometry.vertices.forEach(v => {
        if (v.y > 0) {
            v.y += Math.random() * 0.1; // Slight randomness at top
        }
    });
    moleGroup.add(body);

    // Text background - rectangular card
    const cardGeometry = new THREE.BoxGeometry(1, 0.8, 0.05);
    const cardMaterial = new THREE.MeshLambertMaterial({ color: 0xFFF5E1 }); // Light cream color
    const card = new THREE.Mesh(cardGeometry, cardMaterial);
    card.position.set(0, 0, 0.43);
    moleGroup.add(card);

    // Text setup
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
        new THREE.PlaneGeometry(0.95, 0.75),
        textMaterial
    );
    textPlane.position.set(0, 0, 0.46);
    moleGroup.add(textPlane);
    
    moleGroup.userData.textTexture = textTexture;
    moleGroup.userData.textContext = context;

    // Eyes - more cartoon style
    const eyeGeometry = new THREE.SphereGeometry(0.12, 16, 16);
    const eyeMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.25, 0.5, 0.4);
    leftEye.scale.y = 0.5; // Make eyes more oval
    moleGroup.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.25, 0.5, 0.4);
    rightEye.scale.y = 0.5; // Make eyes more oval
    moleGroup.add(rightEye);

    // Whiskers using curves
    const whiskerMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
    
    const createWhisker = (side, height) => {
        const points = [];
        points.push(new THREE.Vector3(side * 0.2, height, 0.4));
        points.push(new THREE.Vector3(side * 0.6, height + 0.1, 0.3));
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const whisker = new THREE.Line(geometry, whiskerMaterial);
        moleGroup.add(whisker);
    };

    // Add multiple whiskers
    createWhisker(-1, 0.3);
    createWhisker(-1, 0.2);
    createWhisker(1, 0.3);
    createWhisker(1, 0.2);

    return moleGroup;
}

// Update text rendering function
function updateMoleText(mole, word) {
    const context = mole.userData.textContext;
    const texture = mole.userData.textTexture;
    
    // Clear the canvas
    context.clearRect(0, 0, 512, 256);
    
    // Set text properties
    context.fillStyle = 'black';
    context.font = 'bold 96px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    // Draw text
    context.fillText(word, 256, 128);
    
    // Update the texture
    texture.needsUpdate = true;
}

// Add sign to scene
scene.add(createWoodenSign());

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
