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

// Initialize arrays and game state
const moles = []; // Define moles array globally
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

// Hole setup
const holeGeometry = new THREE.CircleGeometry(1.4, 32);
const holeMaterial = new THREE.MeshLambertMaterial({ 
    color: 0x404040  // Darker gray
});

// Define hole positions
const holes = [
    // Left side moles rotate counter-clockwise (+10 degrees = +0.175 radians)
    { x: -2, z: -2, rotation: Math.PI * 0.25 + 0.175 }, // Front left
    { x: -2, z: 2, rotation: Math.PI * 0.75 + 0.175 },  // Back left
    
    // Right side moles rotate clockwise (-10 degrees = -0.175 radians)
    { x: 2, z: -2, rotation: -Math.PI * 0.25 - 0.175 }, // Front right
    { x: 2, z: 2, rotation: -Math.PI * 0.75 - 0.175 }   // Back right
];

// Create holes
holes.forEach(pos => {
    const hole = new THREE.Mesh(holeGeometry, holeMaterial);
    hole.rotation.x = -Math.PI / 2;
    hole.position.set(pos.x * 1.5, 0.01, pos.z * 1.5);
    scene.add(hole);
});

// Add lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 5);
scene.add(directionalLight);

// Create moles
holes.forEach(pos => {
    const mole = createMole();
    mole.position.set(pos.x * 1.5, -1.0, pos.z * 1.5);
    
    // Base rotation toward center
    const targetPoint = new THREE.Vector3(0, 0, -3);
    mole.lookAt(targetPoint);
    mole.rotateX(Math.PI / 2);
    
    // Additional rotation based on side
    if (pos.x < 0) {
        mole.rotateY(0.175);
    } else {
        mole.rotateY(-0.175);
    }
    
    mole.userData.isUp = false;
    mole.userData.isMoving = false;
    scene.add(mole);
    moles.push(mole);
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

// Set camera position
camera.position.set(0, 8, 12);
camera.lookAt(0, 0, 0);

// Add ground (green hill)
const groundGeometry = new THREE.PlaneGeometry(20, 20);
const groundMaterial = new THREE.MeshLambertMaterial({ 
    color: 0x90EE90,  // Light green color
    side: THREE.DoubleSide 
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.y = 0;
scene.add(ground);

// Create a more natural hill shape with curved edges
function createHill() {
    // Create a custom shape for the hill
    const shape = new THREE.Shape();
    
    // Start from bottom left
    shape.moveTo(-10, -10);
    
    // Create curved front edge
    shape.quadraticCurveTo(-5, -8, 0, -8);
    shape.quadraticCurveTo(5, -8, 10, -10);
    
    // Create curved right edge
    shape.quadraticCurveTo(8, -5, 8, 0);
    shape.quadraticCurveTo(8, 5, 10, 10);
    
    // Create curved back edge
    shape.quadraticCurveTo(5, 8, 0, 8);
    shape.quadraticCurveTo(-5, 8, -10, 10);
    
    // Create curved left edge
    shape.quadraticCurveTo(-8, 5, -8, 0);
    shape.quadraticCurveTo(-8, -5, -10, -10);
    
    // Create geometry from shape
    const geometry = new THREE.ShapeGeometry(shape);
    const material = new THREE.MeshLambertMaterial({
        color: 0x90EE90,
        side: THREE.DoubleSide
    });
    
    // Create mesh and rotate to horizontal position
    const hill = new THREE.Mesh(geometry, material);
    hill.rotation.x = -Math.PI / 2;
    hill.position.y = 0;
    
    // Add subtle elevation variation
    const vertices = geometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
        const x = vertices[i];
        const z = vertices[i + 2];
        const distanceFromCenter = Math.sqrt(x * x + z * z);
        const elevation = Math.max(0, (distanceFromCenter - 5) * 0.1);
        vertices[i + 1] = -elevation;
    }
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
    
    return hill;
}

// Add hill to scene
const hill = createHill();
scene.add(hill);

// Add clouds to the scene
const clouds = [];
const cloudPositions = [
    { x: -4, y: 5, z: -3 },
    { x: 4, y: 6, z: -2 },
    { x: 0, y: 4.5, z: -4 }
];

// Clear existing clouds and add new ones
clouds.forEach(cloud => scene.remove(cloud));
clouds.length = 0;

cloudPositions.forEach(pos => {
    const cloud = createCloud();
    cloud.position.set(pos.x, pos.y, pos.z);
    scene.add(cloud);
    clouds.push(cloud);
});

// Add some subtle shadows
renderer.shadowMap.enabled = true;
directionalLight.castShadow = true;

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Update all moles to face camera
    moles.forEach(mole => {
        if (mole.userData.facingGroup) {
            mole.userData.facingGroup.lookAt(camera.position);
        }
    });
    
    // Animate clouds
    clouds.forEach((cloud, index) => {
        cloud.position.x += 0.003 * (index % 2 ? 1 : -1); // Slightly slower movement
        if (cloud.position.x > 10) cloud.position.x = -10;
        if (cloud.position.x < -10) cloud.position.x = 10;
    });
    
    renderer.render(scene, camera);
}

// Start animation
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

// Modify mole creation function
function createMole() {
    const moleGroup = new THREE.Group();
    
    // Body - now light brown
    const bodyGeometry = new THREE.SphereGeometry(0.8, 32, 32);
    const bodyMaterial = new THREE.MeshLambertMaterial({ 
        color: 0xD2B48C  // Light brown (tan)
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

// Update cloud positions and size
function createCloud() {
    const cloudGroup = new THREE.Group();
    
    const cloudGeometry = new THREE.SphereGeometry(0.8, 32, 32); // Slightly smaller clouds
    const cloudMaterial = new THREE.MeshLambertMaterial({ 
        color: 0xFFFFFF,
        transparent: true,
        opacity: 0.9
    });

    // Main cloud parts
    const mainSphere = new THREE.Mesh(cloudGeometry, cloudMaterial);
    mainSphere.scale.set(1, 0.6, 1);
    cloudGroup.add(mainSphere);

    const positions = [
        { x: -0.8, y: 0.2, z: 0, scale: 0.8 },
        { x: 0.8, y: 0.2, z: 0, scale: 0.8 },
        { x: 0, y: 0.3, z: 0, scale: 0.9 }
    ];

    positions.forEach(pos => {
        const cloudPiece = new THREE.Mesh(cloudGeometry, cloudMaterial);
        cloudPiece.position.set(pos.x, pos.y, pos.z);
        cloudPiece.scale.set(pos.scale, pos.scale * 0.6, pos.scale);
        cloudGroup.add(cloudPiece);
    });

    return cloudGroup;
}

// Add a second directional light to better show the slopes
const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
backLight.position.set(-5, 5, -5);
scene.add(backLight);
