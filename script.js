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

// Version 1.1.1 - Cartoonish Mole Face Improvement
(function createCartoonishMoleFace() {
    // Create a unique version identifier
    const versionNumber = "1.1.1";
    const uniqueId = Math.random().toString(36).substring(2, 6);
    
    // Log to console
    console.log(
        `%c Cartoonish Mole Face v${versionNumber}-${uniqueId} %c`,
        "background: #FF9800; color: white; font-size: 14px; padding: 5px; border-radius: 3px;",
        ""
    );
    
    // Remove any existing face elements
    document.querySelectorAll('[data-mole-face="true"]').forEach(el => {
        el.remove();
    });
    
    // Create container for face elements
    const faceContainer = document.createElement('div');
    faceContainer.style.position = 'absolute';
    faceContainer.style.top = '0';
    faceContainer.style.left = '0';
    faceContainer.style.width = '100%';
    faceContainer.style.height = '100%';
    faceContainer.style.pointerEvents = 'none';
    faceContainer.style.zIndex = '1000';
    document.body.appendChild(faceContainer);
    
    // Function to create a cartoonish face element
    function createFaceElement(index) {
        // Create face group
        const faceGroup = document.createElement('div');
        faceGroup.setAttribute('data-mole-face', 'true');
        faceGroup.setAttribute('data-mole-index', index);
        faceGroup.style.position = 'absolute';
        faceGroup.style.width = '80px';
        faceGroup.style.height = '80px';
        faceGroup.style.display = 'none'; // Hidden by default
        
        // Create eyes container
        const eyesContainer = document.createElement('div');
        eyesContainer.style.position = 'relative';
        eyesContainer.style.width = '100%';
        eyesContainer.style.height = '30px';
        eyesContainer.style.marginTop = '10px';
        faceGroup.appendChild(eyesContainer);
        
        // Create left eye
        const leftEye = document.createElement('div');
        leftEye.style.position = 'absolute';
        leftEye.style.left = '15px';
        leftEye.style.top = '5px';
        leftEye.style.width = '15px';
        leftEye.style.height = '20px';
        leftEye.style.backgroundColor = 'black';
        leftEye.style.borderRadius = '50%';
        eyesContainer.appendChild(leftEye);
        
        // Create right eye
        const rightEye = document.createElement('div');
        rightEye.style.position = 'absolute';
        rightEye.style.right = '15px';
        rightEye.style.top = '5px';
        rightEye.style.width = '15px';
        rightEye.style.height = '20px';
        rightEye.style.backgroundColor = 'black';
        rightEye.style.borderRadius = '50%';
        eyesContainer.appendChild(rightEye);
        
        // Add eye shine to make eyes more expressive
        [leftEye, rightEye].forEach(eye => {
            const shine = document.createElement('div');
            shine.style.position = 'absolute';
            shine.style.top = '3px';
            shine.style.right = '3px';
            shine.style.width = '5px';
            shine.style.height = '5px';
            shine.style.backgroundColor = 'white';
            shine.style.borderRadius = '50%';
            eye.appendChild(shine);
        });
        
        // Create mouth
        const mouth = document.createElement('div');
        mouth.style.position = 'relative';
        mouth.style.width = '40px';
        mouth.style.height = '20px';
        mouth.style.margin = '10px auto 0';
        mouth.style.borderBottom = '4px solid black';
        mouth.style.borderRadius = '0 0 20px 20px';
        faceGroup.appendChild(mouth);
        
        // Randomly add a cute expression
        const expression = Math.floor(Math.random() * 4);
        if (expression === 0) {
            // Smile
            mouth.style.borderBottom = '4px solid black';
            mouth.style.borderRadius = '0 0 20px 20px';
        } else if (expression === 1) {
            // Surprised
            mouth.style.width = '20px';
            mouth.style.height = '20px';
            mouth.style.borderRadius = '50%';
            mouth.style.backgroundColor = 'black';
            mouth.style.border = 'none';
        } else if (expression === 2) {
            // Grin
            mouth.style.height = '10px';
            mouth.style.borderBottom = '4px solid black';
            mouth.style.borderLeft = '4px solid black';
            mouth.style.borderRight = '4px solid black';
            mouth.style.borderRadius = '0 0 20px 20px';
        } else {
            // Smirk
            mouth.style.width = '30px';
            mouth.style.height = '15px';
            mouth.style.marginLeft = '25px';
            mouth.style.borderBottom = '4px solid black';
            mouth.style.borderRadius = '0 0 15px 5px';
        }
        
        // Add to container
        faceContainer.appendChild(faceGroup);
        return faceGroup;
    }
    
    // Create face elements for each potential mole
    const faceElements = [];
    for (let i = 0; i < 4; i++) {
        faceElements.push(createFaceElement(i));
    }
    
    // Function to update face positions
    function updateFacePositions() {
        // Find the canvas
        const canvas = document.querySelector('canvas');
        if (canvas) {
            const canvasRect = canvas.getBoundingClientRect();
            
            // Predefined mole positions (approximate)
            const molePositions = [
                { x: canvasRect.width * 0.3, y: canvasRect.height * 0.4 },
                { x: canvasRect.width * 0.7, y: canvasRect.height * 0.4 },
                { x: canvasRect.width * 0.3, y: canvasRect.height * 0.7 },
                { x: canvasRect.width * 0.7, y: canvasRect.height * 0.7 }
            ];
            
            // Find visible moles
            const visibleMoles = [];
            document.querySelectorAll('canvas').forEach(canvas => {
                // Check if there are moles visible
                // This is a simple heuristic - we assume moles are visible if they're in the game
                if (canvas.width > 0 && canvas.height > 0) {
                    visibleMoles.push(true);
                }
            });
            
            // Update face positions if moles are visible
            if (visibleMoles.length > 0) {
                faceElements.forEach((face, index) => {
                    if (index < molePositions.length) {
                        const pos = molePositions[index];
                        
                        // Position face over mole
                        face.style.left = `${canvasRect.left + pos.x - 40}px`;
                        face.style.top = `${canvasRect.top + pos.y - 40}px`;
                        
                        // Show face
                        face.style.display = 'block';
                        
                        // Randomly blink eyes
                        if (Math.random() < 0.01) { // 1% chance per frame
                            const eyes = face.querySelectorAll('div > div:nth-child(1) > div');
                            eyes.forEach(eye => {
                                eye.style.height = '2px';
                                eye.style.top = '15px';
                                
                                // Reset after 200ms
                                setTimeout(() => {
                                    eye.style.height = '20px';
                                    eye.style.top = '5px';
                                }, 200);
                            });
                        }
                    }
                });
            }
        }
        
        // Continue updating
        requestAnimationFrame(updateFacePositions);
    }
    
    // Start updating face positions
    updateFacePositions();
    
    // Add a small indicator
    const indicator = document.createElement('div');
    indicator.style.position = 'fixed';
    indicator.style.bottom = '80px';
    indicator.style.right = '10px';
    indicator.style.backgroundColor = 'rgba(255,152,0,0.7)';
    indicator.style.color = 'white';
    indicator.style.padding = '5px 10px';
    indicator.style.borderRadius = '5px';
    indicator.style.fontFamily = 'Arial, sans-serif';
    indicator.style.fontSize = '12px';
    indicator.style.zIndex = '1002';
    indicator.textContent = `Cartoon Face v${versionNumber}`;
    document.body.appendChild(indicator);
    
    return "Cartoonish mole face applied";
})();

