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

// Zoom in the camera
function zoomInCamera() {
    // Move camera closer to the scene
    camera.position.set(0, 5, 6); // Reduced z value to zoom in
camera.lookAt(0, 0, 0);
    console.log("Camera zoomed in:", camera.position);
}

// Load Google Cosmic Neue font
function loadCustomFont() {
    // Create a link element to load the font
    const fontLink = document.createElement('link');
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Comic+Neue:wght@700&display=swap';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);
    
    // Add a style element for font-family
    const style = document.createElement('style');
    style.textContent = `
        @font-face {
            font-family: 'Comic Neue';
            font-style: normal;
            font-weight: 700;
            src: url(https://fonts.gstatic.com/s/comicneue/v8/4UaErEJDsxBrF37olUeD_xHM8pxULg.woff2) format('woff2');
        }
    `;
    document.head.appendChild(style);
    
    console.log("Custom font loaded");
}

// Improve text rendering with the new font
function updateTextRendering() {
    // Update the text rendering function
    window.updateMoleText = function(mole, word) {
        const context = mole.userData.textContext;
        const texture = mole.userData.textTexture;
        
        // Clear the canvas
        context.clearRect(0, 0, 512, 256);
        
        // Set text properties with Comic Neue font
        context.fillStyle = 'black';
        context.font = 'bold 140px "Comic Neue", sans-serif';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        // Draw text with outline for better visibility
        context.strokeStyle = 'white';
        context.lineWidth = 8;
        context.strokeText(word, 256, 128);
        context.fillText(word, 256, 128);
        
        // Update the texture
        texture.needsUpdate = true;
    };
    
    // Update UI text elements
    const textElements = [scoreElement, timerElement, instructionsElement];
    textElements.forEach(element => {
        if (element) {
            element.style.fontFamily = '"Comic Neue", sans-serif';
            element.style.fontSize = '28px';
            element.style.fontWeight = 'bold';
            element.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
        }
    });
    
    console.log("Text rendering updated");
}

// Make text planes larger for better visibility
function enlargeTextPlanes() {
    moles.forEach(mole => {
        if (mole.userData.facingGroup) {
            mole.userData.facingGroup.children.forEach(child => {
                // Find the text plane
                if (child.geometry && 
                    child.geometry.type === 'PlaneGeometry' && 
                    child.material && 
                    child.material.map) {
                    
                    // Make it larger
                    child.scale.set(1.5, 1.5, 1.5);
                    console.log("Text plane enlarged");
                }
            });
        }
    });
}

// Apply all improvements
loadCustomFont();
zoomInCamera();
updateTextRendering();
enlargeTextPlanes();

// Update any existing mole text
moles.forEach(mole => {
    if (mole.userData.textContext && mole.userData.isUp) {
        updateMoleText(mole, currentWord);
    }
});

// Ensure UI is updated
updateUI();

// Improve text rendering for better clarity
function improveTextClarity() {
    // Update the text rendering function
    window.updateMoleText = function(mole, word) {
        const context = mole.userData.textContext;
        const texture = mole.userData.textTexture;
        
        // Increase canvas resolution for sharper text
        if (context.canvas.width < 1024) {
            context.canvas.width = 1024;
            context.canvas.height = 512;
        }
        
        // Clear the canvas
        context.clearRect(0, 0, context.canvas.width, context.canvas.height);
        
        // Add a subtle background for better contrast
        context.fillStyle = 'rgba(255, 255, 255, 0.3)';
        context.fillRect(0, 0, context.canvas.width, context.canvas.height);
        
        // Set text properties
        context.fillStyle = 'black';
        context.font = 'bold 180px Arial'; // Larger, simpler font
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        // Add strong white outline
        context.strokeStyle = 'white';
        context.lineWidth = 12;
        context.strokeText(word, context.canvas.width/2, context.canvas.height/2);
        
        // Fill text
        context.fillText(word, context.canvas.width/2, context.canvas.height/2);
        
        // Update the texture with better filtering
        texture.needsUpdate = true;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = false;
    };
    
    // Update existing mole text
    moles.forEach(mole => {
        if (mole.userData.textContext) {
            // Get current word or use a default
            const word = currentWord || "nap";
            updateMoleText(mole, word);
        }
    });
    
    console.log("Text clarity improved");
}

// Make text planes larger and better positioned
function improveTextPlanes() {
    moles.forEach(mole => {
        if (mole.userData.facingGroup) {
            mole.userData.facingGroup.children.forEach(child => {
                // Find the text plane
                if (child.geometry && 
                    child.geometry.type === 'PlaneGeometry' && 
                    child.material && 
                    child.material.map) {
                    
                    // Replace with larger plane
                    const newPlane = new THREE.Mesh(
                        new THREE.PlaneGeometry(1.2, 0.6),
                        child.material
                    );
                    
                    // Position it better
                    newPlane.position.copy(child.position);
                    newPlane.position.z = 0.82; // Slightly more forward
                    
                    // Replace the old plane
                    const parent = child.parent;
                    parent.remove(child);
                    parent.add(newPlane);
                    
                    console.log("Text plane improved");
                }
            });
        }
    });
}

// Add directional lighting specifically for text
function addTextLighting() {
    const textLight = new THREE.DirectionalLight(0xffffff, 1.0);
    textLight.position.set(0, 0, 10); // Light directly from camera
    camera.add(textLight);
    scene.add(camera); // Ensure camera is in scene
    
    console.log("Text lighting added");
}

// Apply all text improvements
improveTextClarity();
improveTextPlanes();
addTextLighting();

// Improve text rendering with anti-aliasing and smoother edges
function fixPixelatedText() {
    // Update the text rendering function
    window.updateMoleText = function(mole, word) {
        const context = mole.userData.textContext;
        const texture = mole.userData.textTexture;
        
        // Increase canvas resolution significantly for smoother text
        if (context.canvas.width < 2048) {
            context.canvas.width = 2048;
            context.canvas.height = 1024;
        }
        
        // Clear the canvas
        context.clearRect(0, 0, context.canvas.width, context.canvas.height);
        
        // Enable anti-aliasing
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
        
        // Set text properties
        context.fillStyle = 'black';
        context.font = '300px Arial'; // Clean, sans-serif font
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        // Use a technique to render smoother text
        // First, render at a larger size
        const scaleFactor = 2;
        context.scale(scaleFactor, scaleFactor);
        
        // Draw text with smooth edges
        context.fillText(word, context.canvas.width/(2*scaleFactor), context.canvas.height/(2*scaleFactor));
        
        // Reset scale
        context.setTransform(1, 0, 0, 1, 0, 0);
        
        // Update the texture with better filtering
        texture.needsUpdate = true;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        texture.generateMipmaps = false;
    };
    
    // Update existing mole text
    moles.forEach(mole => {
        if (mole.userData.textContext) {
            const word = currentWord || "nap";
            updateMoleText(mole, word);
        }
    });
    
    console.log("Text rendering improved to fix pixelation");
}

// Fix the renderer settings function to avoid reassigning constants
function improveRendererSettings() {
    // Check if renderer exists and is a constant
    if (typeof renderer !== 'undefined') {
        // Update settings without reassigning the renderer
        renderer.setPixelRatio(window.devicePixelRatio);
        
        // Enable anti-aliasing if possible without reassigning
        if (renderer.capabilities && renderer.capabilities.isWebGL2) {
            try {
                // Try to modify context parameters without reassignment
                const context = renderer.getContext();
                if (context && context.getContextAttributes) {
                    const attributes = context.getContextAttributes();
                    if (attributes) {
                        attributes.antialias = true;
                    }
                }
            } catch (e) {
                console.log("Could not modify WebGL context attributes:", e);
            }
        }
        
        console.log("Renderer settings updated without reassignment");
    } else {
        console.log("Renderer not available or is not a constant");
    }
}

// Version indicator that doesn't interfere with constants
function addVersionIndicator() {
    // Create a unique version timestamp
    const versionTimestamp = new Date().toISOString();
    const versionNumber = "1.0.1"; // Incremented to reflect the fix
    
    // Create a distinctive console message
    console.log(
        "%c Whack-a-Mole Educational Game - Latest Version Running %c",
        "background: #4CAF50; color: white; font-size: 16px; padding: 5px; border-radius: 5px;",
        ""
    );
    
    console.log(
        "%c Version: " + versionNumber + " | Loaded: " + versionTimestamp + " %c",
        "background: #2196F3; color: white; font-size: 14px; padding: 3px; border-radius: 3px;",
        ""
    );
    
    // Add a global variable to check in the console
    window.gameVersionInfo = {
        version: versionNumber,
        timestamp: versionTimestamp,
        cacheStatus: "Fresh Load - Fixed Constant Error"
    };
    
    // Add a visual indicator on the screen
    const versionIndicator = document.createElement('div');
    versionIndicator.style.position = 'absolute';
    versionIndicator.style.bottom = '10px';
    versionIndicator.style.right = '10px';
    versionIndicator.style.background = 'rgba(0,0,0,0.5)';
    versionIndicator.style.color = 'white';
    versionIndicator.style.padding = '5px';
    versionIndicator.style.borderRadius = '3px';
    versionIndicator.style.fontSize = '12px';
    versionIndicator.style.fontFamily = 'monospace';
    versionIndicator.textContent = 'v' + versionNumber;
    document.body.appendChild(versionIndicator);
    
    console.log("Version indicator added - running latest version with fixes");
    
    return "Version indicator added successfully";
}

// Call the fixed functions
improveRendererSettings();
addVersionIndicator();

// You can also add this at the end of your main code
console.log("Game initialization complete - running latest version");

// Version 1.3.0 - Simple Cartoonish Hair
function addSimpleCartoonishHair() {
    // Create a unique version identifier
    const versionNumber = "1.3.0";
    const uniqueId = Math.random().toString(36).substring(2, 6);
    
    console.log(
        `%c Simple Hair v${versionNumber}-${uniqueId} %c`,
        "background: #9C27B0; color: white; font-size: 14px; padding: 5px; border-radius: 3px;",
        ""
    );
    
    // First, remove any existing hair
    moles.forEach(mole => {
        if (mole.userData.facingGroup) {
            // Remove any existing hair elements from the facing group
            const hairElements = mole.userData.facingGroup.children.filter(
                child => child.userData && child.userData.isHair
            );
            
            hairElements.forEach(hair => {
                mole.userData.facingGroup.remove(hair);
            });
        }
    });
    
    // Function to add simple hair to moles
    function addHairToMoles() {
        moles.forEach((mole, index) => {
            if (!mole.userData.facingGroup) return;
            
            const facingGroup = mole.userData.facingGroup;
            
            // Create simple hair - 3 triangular spikes
            const hairColors = [0x000000, 0x3D2314, 0x654321]; // Black, dark brown, brown
            const hairColor = hairColors[Math.floor(Math.random() * hairColors.length)];
            
            // Create 3 hair spikes
            for (let i = 0; i < 3; i++) {
                // Create a triangle shape for each spike
                const spikeGeometry = new THREE.ConeGeometry(0.05, 0.15, 8);
                const spikeMaterial = new THREE.MeshBasicMaterial({ color: hairColor });
                const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
                
                // Position spikes in a row just above the eyes
                // Eyes are at y=0.4, so place hair at y=0.55
                const xPos = -0.15 + (i * 0.15); // -0.15, 0, 0.15
                spike.position.set(xPos, 0.55, 0.81);
                
                // Rotate to point upward
                spike.rotation.x = Math.PI;
                
                // Mark as hair for future reference
                spike.userData = { isHair: true };
                
                // Add to facing group (same as eyes)
                facingGroup.add(spike);
            }
            
            console.log(`Added hair to mole ${index}`);
        });
    }
    
    // Add hair to all moles
    addHairToMoles();
    
    // Update version indicator
    const existingIndicator = document.querySelector('[data-version-indicator="true"]');
    if (existingIndicator) {
        existingIndicator.textContent = `Simple Hair v${versionNumber}`;
        existingIndicator.style.backgroundColor = 'rgba(156, 39, 176, 0.7)';
    } else {
        // Create new indicator if none exists
        const indicator = document.createElement('div');
        indicator.setAttribute('data-version-indicator', 'true');
        indicator.style.position = 'fixed';
        indicator.style.bottom = '40px';
        indicator.style.right = '10px';
        indicator.style.backgroundColor = 'rgba(156, 39, 176, 0.7)';
        indicator.style.color = 'white';
        indicator.style.padding = '5px 10px';
        indicator.style.borderRadius = '5px';
        indicator.style.fontFamily = 'Arial, sans-serif';
        indicator.style.fontSize = '12px';
        indicator.style.zIndex = '1002';
        indicator.textContent = `Simple Hair v${versionNumber}`;
        document.body.appendChild(indicator);
    }
    
    // Force a render update
    if (typeof renderer !== 'undefined' && typeof scene !== 'undefined' && typeof camera !== 'undefined') {
    renderer.render(scene, camera);
}
    
    return "Simple cartoonish hair added";
}

// Execute the function
addSimpleCartoonishHair();

// Version 1.3.1 - Improved Hair Placement
function improveCartoonishHair() {
    // Create a unique version identifier
    const versionNumber = "1.3.1";
    const uniqueId = Math.random().toString(36).substring(2, 6);
    
    console.log(
        `%c Improved Hair v${versionNumber}-${uniqueId} %c`,
        "background: #673AB7; color: white; font-size: 14px; padding: 5px; border-radius: 3px;",
        ""
    );
    
    // First, remove any existing hair from all objects in the scene
    scene.traverse(object => {
        if (object.userData && object.userData.isHair) {
            if (object.parent) {
                object.parent.remove(object);
            }
        }
    });
    
    // Function to add improved hair to moles
    function addImprovedHairToMoles() {
        moles.forEach((mole, index) => {
            if (!mole.userData.facingGroup) return;
            
            const facingGroup = mole.userData.facingGroup;
            
            // Only add hair to moles that are visible (up)
            if (!mole.userData.isUp) {
                console.log(`Skipping hair for mole ${index} - not visible`);
                return;
            }
            
            // Create more realistic hair - curved strands
            const hairColors = [0x000000, 0x3D2314, 0x654321]; // Black, dark brown, brown
            const hairColor = hairColors[Math.floor(Math.random() * hairColors.length)];
            
            // Create a hair group
            const hairGroup = new THREE.Group();
            hairGroup.userData = { isHair: true };
            
            // Create 5 hair strands
            const strandCount = 5;
            for (let i = 0; i < strandCount; i++) {
                // Create a curved cylinder for each strand
                const strandGeometry = new THREE.CylinderGeometry(0.02, 0.01, 0.2, 8);
                const strandMaterial = new THREE.MeshBasicMaterial({ color: hairColor });
                const strand = new THREE.Mesh(strandGeometry, strandMaterial);
                
                // Position strands in an arc above the eyes (not overlapping)
                // Eyes are at y=0.4, so place hair at y=0.65 (higher than before)
                const angle = (i / (strandCount - 1)) * Math.PI * 0.6 - Math.PI * 0.3;
                const radius = 0.25;
                const xPos = Math.sin(angle) * radius;
                strand.position.set(xPos, 0.65, 0.81);
                
                // Rotate to point outward from the head
                strand.rotation.x = Math.PI / 2 - angle * 0.5;
                strand.rotation.z = angle;
                
                // Add slight random variation
                strand.rotation.x += (Math.random() - 0.5) * 0.2;
                strand.rotation.z += (Math.random() - 0.5) * 0.2;
                
                // Mark as hair for future reference
                strand.userData = { isHair: true };
                
                // Add to hair group
                hairGroup.add(strand);
            }
            
            // Add hair group to facing group
            facingGroup.add(hairGroup);
            
            console.log(`Added improved hair to mole ${index}`);
        });
    }
    
    // Add hair to visible moles
    addImprovedHairToMoles();
    
    // Hook into the animateMole function to add/remove hair when moles move
    const originalAnimateMole = window.animateMole;
    if (originalAnimateMole) {
        window.animateMole = function(mole, goingUp) {
            // Call the original function first
            originalAnimateMole.apply(this, arguments);
            
            // After animation starts, add or remove hair based on mole state
            setTimeout(() => {
                if (goingUp) {
                    // Mole is coming up - add hair after a delay
                    setTimeout(() => {
                        if (mole.userData.facingGroup) {
                            // Remove any existing hair
                            mole.userData.facingGroup.children.forEach(child => {
                                if (child.userData && child.userData.isHair) {
                                    mole.userData.facingGroup.remove(child);
                                }
                            });
                            
                            // Create hair group
                            const hairGroup = new THREE.Group();
                            hairGroup.userData = { isHair: true };
                            
                            // Add hair strands
                            const hairColor = 0x3D2314; // Dark brown
                            const strandCount = 5;
                            
                            for (let i = 0; i < strandCount; i++) {
                                const strandGeometry = new THREE.CylinderGeometry(0.02, 0.01, 0.2, 8);
                                const strandMaterial = new THREE.MeshBasicMaterial({ color: hairColor });
                                const strand = new THREE.Mesh(strandGeometry, strandMaterial);
                                
                                const angle = (i / (strandCount - 1)) * Math.PI * 0.6 - Math.PI * 0.3;
                                const radius = 0.25;
                                const xPos = Math.sin(angle) * radius;
                                strand.position.set(xPos, 0.65, 0.81);
                                
                                strand.rotation.x = Math.PI / 2 - angle * 0.5;
                                strand.rotation.z = angle;
                                
                                strand.userData = { isHair: true };
                                hairGroup.add(strand);
                            }
                            
                            mole.userData.facingGroup.add(hairGroup);
                        }
                    }, 100);
                } else {
                    // Mole is going down - remove hair
                    if (mole.userData.facingGroup) {
                        mole.userData.facingGroup.children.forEach(child => {
                            if (child.userData && child.userData.isHair) {
                                mole.userData.facingGroup.remove(child);
                            }
                        });
                    }
                }
            }, 10);
        };
    }
    
    // Update version indicator
    const existingIndicator = document.querySelector('[data-version-indicator="true"]');
    if (existingIndicator) {
        existingIndicator.textContent = `Improved Hair v${versionNumber}`;
        existingIndicator.style.backgroundColor = 'rgba(103, 58, 183, 0.7)';
    } else {
        // Create new indicator if none exists
        const indicator = document.createElement('div');
        indicator.setAttribute('data-version-indicator', 'true');
        indicator.style.position = 'fixed';
        indicator.style.bottom = '40px';
        indicator.style.right = '10px';
        indicator.style.backgroundColor = 'rgba(103, 58, 183, 0.7)';
        indicator.style.color = 'white';
        indicator.style.padding = '5px 10px';
        indicator.style.borderRadius = '5px';
        indicator.style.fontFamily = 'Arial, sans-serif';
        indicator.style.fontSize = '12px';
        indicator.style.zIndex = '1002';
        indicator.textContent = `Improved Hair v${versionNumber}`;
        document.body.appendChild(indicator);
    }
    
    // Force a render update
    if (typeof renderer !== 'undefined' && typeof scene !== 'undefined' && typeof camera !== 'undefined') {
        renderer.render(scene, camera);
    }
    
    return "Improved cartoonish hair added";
}

// Execute the function
improveCartoonishHair();

// Version 1.3.3 - Definitive Hair Implementation
function definitiveMoleHair() {
    // Create a unique version identifier
    const versionNumber = "1.3.3";
    const uniqueId = Math.random().toString(36).substring(2, 6);
    
    console.log(
        `%c Definitive Hair v${versionNumber}-${uniqueId} %c`,
        "background: #4CAF50; color: white; font-size: 14px; padding: 5px; border-radius: 3px;",
        ""
    );
    
    // Check if we've already applied this version to avoid duplicates
    if (window.currentHairVersion === versionNumber) {
        console.log("This version is already applied. Skipping to avoid duplicates.");
        return "Already applied";
    }
    
    // Store current version in window object
    window.currentHairVersion = versionNumber;
    
    // Function to clean up any existing hair implementations
    function cleanupExistingHair() {
        try {
            // Remove hair from all moles
            if (moles && moles.length > 0) {
                moles.forEach((mole, index) => {
                    if (mole && mole.userData && mole.userData.facingGroup) {
                        const facingGroup = mole.userData.facingGroup;
                        
                        // Remove any elements marked as hair
                        for (let i = facingGroup.children.length - 1; i >= 0; i--) {
                            const child = facingGroup.children[i];
                            if (child && child.userData && child.userData.isHair) {
                                facingGroup.remove(child);
                            }
                        }
                        
                        // Also check direct children of mole
                        for (let i = mole.children.length - 1; i >= 0; i--) {
                            const child = mole.children[i];
                            if (child && child.userData && child.userData.isHair) {
                                mole.remove(child);
                            }
                        }
                    }
                });
                console.log("Cleaned up existing hair from all moles");
            }
            
            // Remove any existing animation hooks
            if (window.originalAnimateMole) {
                window.animateMole = window.originalAnimateMole;
                console.log("Restored original animateMole function");
            }
        } catch (error) {
            console.error("Error cleaning up existing hair:", error);
        }
    }
    
    // Function to add definitive hair to visible moles
    function addDefinitiveHair() {
        try {
            if (!moles || moles.length === 0) {
                console.log("No moles found to add hair to");
                return;
            }
            
            console.log(`Found ${moles.length} moles`);
            
            moles.forEach((mole, index) => {
                if (!mole.userData || !mole.userData.facingGroup) {
                    console.log(`Mole ${index} has no facing group`);
                    return;
                }
                
                const facingGroup = mole.userData.facingGroup;
                
                // Only add hair to moles that are visible (up)
                if (!mole.userData.isUp) {
                    console.log(`Skipping hair for mole ${index} - not visible`);
                    return;
                }
                
                console.log(`Adding hair to mole ${index}`);
                
                // Create simple, effective hair - three small spikes
                const hairColor = 0x3D2314; // Dark brown
                
                // Create 3 hair spikes
                for (let i = 0; i < 3; i++) {
                    // Create a simple cone for each spike
                    const spikeGeometry = new THREE.ConeGeometry(0.03, 0.15, 8);
                    const spikeMaterial = new THREE.MeshBasicMaterial({ color: hairColor });
                    const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
                    
                    // Position spikes in a row above the eyes
                    // Eyes are at y=0.4, so place hair at y=0.65
                    const xPos = -0.1 + (i * 0.1); // -0.1, 0, 0.1
                    spike.position.set(xPos, 0.65, 0.81);
                    
                    // Rotate to point upward
                    spike.rotation.x = Math.PI;
                    
                    // Add slight random variation
                    spike.rotation.x += (Math.random() - 0.5) * 0.1;
                    spike.rotation.z += (Math.random() - 0.5) * 0.1;
                    
                    // Mark as hair for future reference
                    spike.userData = { isHair: true };
                    
                    // Add directly to facing group
                    facingGroup.add(spike);
                }
            });
        } catch (error) {
            console.error("Error adding hair to moles:", error);
        }
    }
    
    // First clean up any existing implementations
    cleanupExistingHair();
    
    // Then add new hair to visible moles
    addDefinitiveHair();
    
    // Store the original animateMole function if we haven't already
    if (!window.originalAnimateMole && window.animateMole) {
        window.originalAnimateMole = window.animateMole;
    }
    
    // Hook into the animateMole function to add/remove hair when moles move
    try {
        if (window.animateMole) {
            window.animateMole = function(mole, goingUp) {
                // Call the original function first
                window.originalAnimateMole.apply(this, arguments);
                
                // After animation starts, add or remove hair based on mole state
                setTimeout(() => {
                    try {
                        if (goingUp) {
                            // Mole is coming up - add hair after a delay
                            setTimeout(() => {
                                if (mole.userData && mole.userData.facingGroup) {
                                    // Remove any existing hair
                                    const facingGroup = mole.userData.facingGroup;
                                    for (let i = facingGroup.children.length - 1; i >= 0; i--) {
                                        const child = facingGroup.children[i];
                                        if (child.userData && child.userData.isHair) {
                                            facingGroup.remove(child);
                                        }
                                    }
                                    
                                    // Add hair spikes
                                    const hairColor = 0x3D2314; // Dark brown
                                    
                                    // Create 3 hair spikes
                                    for (let i = 0; i < 3; i++) {
                                        const spikeGeometry = new THREE.ConeGeometry(0.03, 0.15, 8);
                                        const spikeMaterial = new THREE.MeshBasicMaterial({ color: hairColor });
                                        const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
                                        
                                        const xPos = -0.1 + (i * 0.1);
                                        spike.position.set(xPos, 0.65, 0.81);
                                        
                                        spike.rotation.x = Math.PI;
                                        spike.rotation.x += (Math.random() - 0.5) * 0.1;
                                        spike.rotation.z += (Math.random() - 0.5) * 0.1;
                                        
                                        spike.userData = { isHair: true };
                                        facingGroup.add(spike);
                                    }
                                }
                            }, 100);
                        } else {
                            // Mole is going down - remove hair
                            if (mole.userData && mole.userData.facingGroup) {
                                const facingGroup = mole.userData.facingGroup;
                                for (let i = facingGroup.children.length - 1; i >= 0; i--) {
                                    const child = facingGroup.children[i];
                                    if (child.userData && child.userData.isHair) {
                                        facingGroup.remove(child);
                                    }
                                }
                            }
                        }
                    } catch (error) {
                        console.error("Error in animateMole hook:", error);
                    }
                }, 10);
            };
            console.log("Successfully hooked into animateMole function");
        } else {
            console.log("Could not find animateMole function to hook into");
        }
    } catch (error) {
        console.error("Error setting up animateMole hook:", error);
    }
    
    // Update or create version indicator
    try {
        // Remove all existing version indicators
        document.querySelectorAll('[data-version-indicator="true"]').forEach(el => {
            el.remove();
        });
        
        // Create new definitive indicator
        const indicator = document.createElement('div');
        indicator.setAttribute('data-version-indicator', 'true');
        indicator.style.position = 'fixed';
        indicator.style.bottom = '40px';
        indicator.style.right = '10px';
        indicator.style.backgroundColor = 'rgba(76, 175, 80, 0.7)';
        indicator.style.color = 'white';
        indicator.style.padding = '5px 10px';
        indicator.style.borderRadius = '5px';
        indicator.style.fontFamily = 'Arial, sans-serif';
        indicator.style.fontSize = '12px';
        indicator.style.zIndex = '1002';
        indicator.textContent = `Definitive Hair v${versionNumber}`;
        document.body.appendChild(indicator);
    } catch (error) {
        console.error("Error updating version indicator:", error);
    }
    
    // Force a render update
    try {
        if (typeof renderer !== 'undefined' && typeof scene !== 'undefined' && typeof camera !== 'undefined') {
            renderer.render(scene, camera);
            console.log("Forced render update");
        }
    } catch (error) {
        console.error("Error forcing render update:", error);
    }
    
    console.log("Definitive hair implementation complete");
    return "Definitive cartoonish hair added";
}

// Execute the function
definitiveMoleHair();
