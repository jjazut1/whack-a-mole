// Import Three.js (Make sure you include Three.js in your HTML)
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.min.js';

// Add this at the beginning of your script to check Three.js version
console.log("Three.js version:", THREE.REVISION);

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.sortObjects = true;
renderer.setClearColor(0x87CEEB, 1);
document.body.appendChild(renderer.domElement);

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

// Simplified terrain creation
function createTerrain() {
    // Use PlaneGeometry instead of PlaneBufferGeometry (which is deprecated)
    const geometry = new THREE.PlaneGeometry(40, 40, 50, 50);
    
    // Modify vertices for curved edges
    const positionAttribute = geometry.getAttribute('position');
    
    for (let i = 0; i < positionAttribute.count; i++) {
        const x = positionAttribute.getX(i);
        const y = positionAttribute.getY(i);
        const distance = Math.sqrt(x * x + y * y);
        
        if (distance > 10) {
            // Create curved falloff
            const z = -0.5 * Math.pow((distance - 10) / 10, 2);
            positionAttribute.setZ(i, z);
        }
    }
    
    geometry.computeVertexNormals();
    
    // Create material with solid color
    const material = new THREE.MeshLambertMaterial({
        color: 0x90EE90, // Light green
        side: THREE.DoubleSide
    });
    
    const terrain = new THREE.Mesh(geometry, material);
    terrain.rotation.x = Math.PI / 2; // Rotate to be horizontal
    terrain.position.y = -0.1; // Position slightly below holes
    
    return terrain;
}

// Setup scene function
function setupScene() {
    // Clear existing scene elements but keep lights
    const lights = scene.children.filter(child => child instanceof THREE.Light);
    scene.children.length = 0;
    lights.forEach(light => scene.add(light));

    // Add terrain first (so it's in the background)
    const terrain = createTerrain();
    terrain.position.y = -0.5; // Move terrain down slightly
    scene.add(terrain);

    // Create and add clouds
    const cloudPositions = [
        { x: -5, y: 5, z: -5 },
        { x: 0, y: 6, z: -4 },
        { x: 5, y: 5, z: -5 }
    ];

    cloudPositions.forEach(pos => {
        const cloud = createCloud();
        cloud.position.set(pos.x, pos.y, pos.z);
        scene.add(cloud);
    });

    // Add holes and moles after terrain
    setupHolesAndMoles();

    // Setup camera
    camera.position.set(0, 8, 12);
    camera.lookAt(0, 0, 0);
}

// Setup holes and moles
function setupHolesAndMoles() {
    const holeGeometry = new THREE.CircleGeometry(1.4, 32);
    const holeMaterial = new THREE.MeshLambertMaterial({ 
        color: 0x404040  // Dark gray
    });

const holes = [
        { x: -2, z: -2, rotation: Math.PI * 0.25 + 0.175 },
        { x: 2, z: -2, rotation: -Math.PI * 0.25 - 0.175 },
        { x: -2, z: 2, rotation: Math.PI * 0.75 + 0.175 },
        { x: 2, z: 2, rotation: -Math.PI * 0.75 - 0.175 }
    ];

    holes.forEach(pos => {
        // Create hole
        const hole = new THREE.Mesh(holeGeometry, holeMaterial);
        hole.rotation.x = -Math.PI / 2;
        hole.position.set(pos.x * 1.5, 0.01, pos.z * 1.5);
        scene.add(hole);

        // Create mole
        const mole = createMole();
        mole.position.set(pos.x * 1.5, -1.0, pos.z * 1.5);
        
        // Set mole rotation
        const targetPoint = new THREE.Vector3(0, 0, -3);
        mole.lookAt(targetPoint);
        mole.rotateX(Math.PI / 2);
        
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
}

// Initialize scene
setupScene();

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Update mole faces
    moles.forEach(mole => {
        if (mole.userData.facingGroup) {
            mole.userData.facingGroup.lookAt(camera.position);
        }
    });
    
    // Animate clouds
    scene.children.forEach(child => {
        if (child.isGroup && child.children[0]?.material?.color?.equals(new THREE.Color(0xFFFFFF))) {
            child.position.x += 0.01;
            if (child.position.x > 15) child.position.x = -15;
        }
    });
    
    renderer.render(scene, camera);
}

animate();

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
    context.font = 'bold 160px Arial'; // Larger font
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    // Draw text with white outline for better visibility on brown
    context.strokeStyle = 'white';
    context.lineWidth = 10;
    context.strokeText(word, 256, 128);
    context.fillText(word, 256, 128);
    
    // Update the texture
    texture.needsUpdate = true;
}

// Modify mole creation function
function createMole() {
    const moleGroup = new THREE.Group();
    
    // Body - light brown color
    const bodyGeometry = new THREE.SphereGeometry(0.8, 32, 32);
    const bodyMaterial = new THREE.MeshLambertMaterial({ 
        color: 0xD2B48C  // Light brown (tan) color
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    moleGroup.add(body);

    // Create a front-facing group for text and facial features
    const facingGroup = new THREE.Group();
    moleGroup.add(facingGroup);

    // Text plane
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
    
    // Eyes - make slightly larger
    const eyeGeometry = new THREE.CircleGeometry(0.04, 32);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.15, 0.4, 0.81);
    facingGroup.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.15, 0.4, 0.81);
    facingGroup.add(rightEye);
    
    moleGroup.userData.textTexture = textTexture;
    moleGroup.userData.textContext = context;
    moleGroup.userData.facingGroup = facingGroup;

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

// Simplified cloud creation
function createCloud() {
    const group = new THREE.Group();
    
    // Create simple white spheres
    const sphereGeometry = new THREE.SphereGeometry(1, 16, 16);
    const material = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
    
    // Main sphere
    const mainSphere = new THREE.Mesh(sphereGeometry, material);
    group.add(mainSphere);
    
    // Add additional spheres
    const positions = [
        { x: -1, y: 0.3, z: 0 },
        { x: 1, y: 0.3, z: 0 },
        { x: 0, y: 0.5, z: 0 }
    ];
    
    positions.forEach(pos => {
        const sphere = new THREE.Mesh(sphereGeometry, material);
        sphere.position.set(pos.x, pos.y, pos.z);
        sphere.scale.set(0.7, 0.5, 0.7);
        group.add(sphere);
    });
    
    return group;
}

// Explicitly add terrain and clouds to scene
function addTerrainAndClouds() {
    // Add terrain
    const terrain = createTerrain();
    scene.add(terrain);
    console.log("Terrain added:", terrain);
    
    // Add clouds
    const cloudPositions = [
        { x: -8, y: 7, z: -5 },  // Higher y value
        { x: 0, y: 8, z: -4 },   // Higher y value
        { x: 8, y: 7, z: -5 }    // Higher y value
    ];
    
    cloudPositions.forEach(pos => {
        const cloud = createCloud();
        cloud.position.set(pos.x, pos.y, pos.z);
        scene.add(cloud);
        console.log("Cloud added:", cloud);
    });
}

// Call this function after scene initialization
addTerrainAndClouds();

// Add debug info to check what's in the scene
console.log("Scene children:", scene.children);

// Add a second directional light to better show the slopes
const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
backLight.position.set(-5, 5, -5);
scene.add(backLight);

// Move clouds higher
function adjustCloudPositions() {
    // Find all clouds in the scene
    scene.children.forEach(child => {
        // Identify clouds by checking if they're groups with white material children
        if (child.isGroup && child.children.length > 0) {
            const firstChild = child.children[0];
            if (firstChild.material && firstChild.material.color && 
                firstChild.material.color.getHexString() === 'ffffff') {
                // Move cloud up by 2 units
                child.position.y += 2;
            }
        }
    });
}

// Call this function to adjust existing clouds
adjustCloudPositions();

// Update hole color to be less dark
function updateHoleColor() {
    scene.children.forEach(child => {
        if (child.geometry && child.geometry.type === 'CircleGeometry') {
            child.material.color.set(0x505050); // Lighter gray for holes
        }
    });
}

// Improve lighting for better visibility
function enhanceLighting() {
    // Remove existing lights
    scene.children.forEach(child => {
        if (child instanceof THREE.Light) {
            scene.remove(child);
        }
    });
    
    // Add stronger ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    
    // Add directional light from front
    const frontLight = new THREE.DirectionalLight(0xffffff, 1.0);
    frontLight.position.set(0, 5, 10);
    scene.add(frontLight);
    
    // Add directional light from above
    const topLight = new THREE.DirectionalLight(0xffffff, 0.8);
    topLight.position.set(0, 10, 0);
    scene.add(topLight);
}

// Call these functions to update the scene
updateHoleColor();
enhanceLighting();

// Make the ground green again
function updateGroundColor() {
    scene.children.forEach(child => {
        if (child.geometry && 
            (child.geometry.type === 'PlaneGeometry' || child.geometry.type === 'PlaneBufferGeometry') && 
            child.rotation.x === -Math.PI / 2) {
            child.material.color.set(0x90EE90); // Light green color
        }
    });
}

// Adjust eye position for better visibility
function adjustEyePositions() {
    moles.forEach(mole => {
        if (mole.userData.facingGroup) {
            mole.userData.facingGroup.children.forEach(child => {
                // Identify eyes by their geometry and position
                if (child.geometry && child.geometry.type === 'CircleGeometry') {
                    // Make eyes larger
                    child.scale.set(1.5, 1.5, 1.5);
                    
                    // Move eyes higher if they're the eye positions
                    if (Math.abs(child.position.x) > 0.1) { // This is an eye
                        child.position.y += 0.1; // Move higher
                    }
                }
            });
        }
    });
}

// Call these functions to update the scene
// Uncomment if you want the ground to be green again
// updateGroundColor();
adjustEyePositions();

// Update mole color to light brown
function updateMoleColor() {
    moles.forEach(mole => {
        // Find the body (first child, which is the sphere)
        if (mole.children && mole.children.length > 0) {
            const body = mole.children[0];
            if (body.material) {
                body.material.color.set(0xD2B48C); // Light brown (tan) color
            }
        }
    });
}

// Call this function to ensure good lighting
enhanceLighting();

// More direct approach to update ground color
function fixGroundColor() {
    // Log all scene children to debug
    console.log("Scene children:", scene.children);
    
    // Try multiple approaches to find and update the ground
    scene.traverse(function(object) {
        // Look for large plane geometries that are likely to be the ground
        if (object.geometry && 
            (object.geometry.type === 'PlaneGeometry' || object.geometry.type === 'PlaneBufferGeometry') && 
            object.geometry.parameters && 
            object.geometry.parameters.width > 10) {
            
            console.log("Found potential ground:", object);
            
            // Force update the material
            object.material = new THREE.MeshLambertMaterial({
                color: 0x4CAF50, // Brighter green
                side: THREE.DoubleSide
            });
            
            console.log("Updated ground color");
        }
    });
}

// More direct approach to update mole color
function fixMoleColor() {
    // Log all moles to debug
    console.log("Moles array:", moles);
    
    moles.forEach((mole, index) => {
        console.log(`Examining mole ${index}:`, mole);
        
        // Try to find the body mesh (usually the first child or the object itself)
        let bodyMesh = null;
        
        if (mole.children && mole.children.length > 0) {
            // Try to find a sphere geometry which is likely the body
            mole.traverse(function(child) {
                if (child.geometry && 
                    (child.geometry.type === 'SphereGeometry' || child.geometry.type === 'SphereBufferGeometry')) {
                    bodyMesh = child;
                }
            });
            
            if (!bodyMesh && mole.children[0].isMesh) {
                bodyMesh = mole.children[0];
            }
        }
        
        if (bodyMesh) {
            console.log("Found mole body:", bodyMesh);
            
            // Force update the material
            bodyMesh.material = new THREE.MeshLambertMaterial({
                color: 0xC19A6B // Warmer, more visible light brown
            });
            
            console.log("Updated mole color");
        }
    });
}

// Ensure proper lighting
function fixLighting() {
    // Remove any existing lights
    const existingLights = [];
    scene.traverse(function(object) {
        if (object.isLight) {
            existingLights.push(object);
        }
    });
    
    existingLights.forEach(light => scene.remove(light));
    
    // Add new lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    scene.add(directionalLight);
    
    const frontLight = new THREE.DirectionalLight(0xffffff, 0.6);
    frontLight.position.set(0, 5, 10);
    scene.add(frontLight);
}

// Call all fix functions
fixGroundColor();
fixMoleColor();
fixLighting();

// Log the scene after fixes
console.log("Scene after fixes:", scene);
