// Import Three.js (Make sure you include Three.js in your HTML)
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.min.js';

// First define all necessary global variables and scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
scene.background = new THREE.Color(0x87CEEB); // Sky blue

// Cloud positions
const cloudPositions = [
    { x: -8, y: 8, z: -8 },
    { x: 0, y: 10, z: -6 },
    { x: 8, y: 9, z: -8 }
];

// Hole positions
const holes = [
    { x: -2.5, z: -2.5, y: 0.2 },
    { x: 2.5, z: -2.5, y: 0.2 },
    { x: -2.5, z: 2.5, y: 0.2 },
    { x: 2.5, z: 2.5, y: 0.2 }
];

// Initialize arrays and game state
const moles = [];
let score = 0;
let gameActive = false;
let timeRemaining = 30;

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

// Helper functions
function createCloud() {
    const cloudGroup = new THREE.Group();
    const cloudMaterial = new THREE.MeshPhongMaterial({ // Changed to PhongMaterial
        color: 0xFFFFFF,
        transparent: true,
        opacity: 0.9,
        emissive: 0x333333 // Slight emissive for better visibility
    });

    // Create main cloud shapes
    const positions = [
        { x: 0, y: 0, z: 0, scale: 1 },
        { x: -1, y: 0, z: 0, scale: 0.8 },
        { x: 1, y: 0, z: 0, scale: 0.8 },
        { x: 0, y: 0.5, z: 0, scale: 0.7 }
    ];

    positions.forEach(pos => {
        const cloudPiece = new THREE.Mesh(
            new THREE.SphereGeometry(1, 16, 16),
            cloudMaterial
        );
        cloudPiece.position.set(pos.x, pos.y, pos.z);
        cloudPiece.scale.set(pos.scale, pos.scale * 0.6, pos.scale);
        cloudGroup.add(cloudPiece);
    });

    return cloudGroup;
}

function createHole() {
    const hole = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.05, 0.5),
        new THREE.MeshBasicMaterial({ color: 0x000000 })
    );
    return hole;
}

function createMole() {
    const moleGroup = new THREE.Group();
    
    // Smaller body size
    const bodyGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const bodyMaterial = new THREE.MeshPhongMaterial({
        color: 0xF5E6D3, // Lighter beige color
        emissive: 0x1a1a1a,
        shininess: 30
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    moleGroup.add(body);

    // Create a front-facing group that will always face the camera
    const facingGroup = new THREE.Group();
    moleGroup.add(facingGroup);

    // Text plane - attached to facing group
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 256;
    
    const textTexture = new THREE.Texture(canvas);
    textTexture.minFilter = THREE.LinearFilter;
    textTexture.magFilter = THREE.LinearFilter;
    
    const textMaterial = new THREE.MeshBasicMaterial({
        map: textTexture,
        transparent: true,
        side: THREE.DoubleSide,
    });
    
    const textPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(0.8, 0.4),
        textMaterial
    );
    textPlane.position.set(0, 0, 0.81);
    facingGroup.add(textPlane);
    
    // Eyes - attached to facing group
    const eyeGeometry = new THREE.CircleGeometry(0.03, 32);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.15, 0.4, 0.81);
    facingGroup.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.15, 0.4, 0.81);
    facingGroup.add(rightEye);
    
    moleGroup.userData.textTexture = textTexture;
    moleGroup.userData.textContext = context;
    moleGroup.userData.facingGroup = facingGroup; // Store reference to facing group

    return moleGroup;
}

function createTerrain() {
    const geometry = new THREE.PlaneGeometry(30, 30, 50, 50);
    const material = new THREE.MeshPhongMaterial({
        color: 0x90EE90,
        side: THREE.DoubleSide,
        shininess: 0
    });
    
    const terrain = new THREE.Mesh(geometry, material);
    terrain.rotation.x = -Math.PI / 2;
    terrain.position.y = -0.5;

    // Create natural curved surface and edges
    const vertices = geometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
        const x = vertices[i];
        const z = vertices[i + 2];
        const distance = Math.sqrt(x * x + z * z);
        
        vertices[i + 1] = Math.max(0, 
            2 * Math.exp(-distance * distance / 100) + 
            -0.05 * (distance * distance)
        );
    }
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();

    return terrain;
}

function setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(5, 10, 5);
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-5, 8, -5);
    scene.add(fillLight);
}

function setupHolesAndMoles() {
    holes.forEach(holePos => {
        const hole = createHole();
        hole.position.set(holePos.x, holePos.y, holePos.z);
        scene.add(hole);
        
        const mole = createMole();
        mole.position.set(holePos.x, holePos.y + 0.1, holePos.z);
        scene.add(mole);
    });
}

// Main setup function
function setupScene() {
    // Clear existing scene
    while(scene.children.length > 0) { 
        scene.remove(scene.children[0]); 
    }
    
    // Setup camera
    camera.position.set(0, 10, 15);
    camera.lookAt(0, 0, 0);
    
    // Setup renderer
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    
    // Add elements to scene
    setupLighting();
    
    const terrain = createTerrain();
    scene.add(terrain);
    
    cloudPositions.forEach(pos => {
        const cloud = createCloud();
        cloud.position.set(pos.x, pos.y, pos.z);
        scene.add(cloud);
    });
    
    setupHolesAndMoles();
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

// Initialize everything
document.body.appendChild(renderer.domElement);
setupScene();
animate();

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Mole materials with brighter colors
const moleBodyGeometry = new THREE.SphereGeometry(0.5, 32, 32);
const moleNoseGeometry = new THREE.SphereGeometry(0.15, 16, 16);
const moleEyeGeometry = new THREE.SphereGeometry(0.1, 16, 16);
const moleMaterial = new THREE.MeshLambertMaterial({ 
    color: 0xD2B48C  // Light brown (tan)
});
const moleNoseMaterial = new THREE.MeshLambertMaterial({ 
    color: 0x1A1A1A  // Dark gray for nose
});
const moleEyeMaterial = new THREE.MeshLambertMaterial({ 
    color: 0x1A1A1A  // Dark gray for eyes
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
    context.clearRect(0, 0, 512, 256);
    
    // Set text properties
    context.fillStyle = 'black';
    context.font = 'bold 140px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    // Draw text
    context.fillText(word, 256, 128);
    
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
    const targetY = goingUp ? 1.0 : -1.0; // Higher up position
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

// Add a second directional light to better show the slopes
const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
backLight.position.set(-5, 5, -5);
scene.add(backLight);

// Adjust camera position and field of view
camera.position.set(0, 10, 15);
camera.fov = 60; // Wider field of view
camera.updateProjectionMatrix();
