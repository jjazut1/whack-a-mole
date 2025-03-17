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

// Create a distinctive version indicator with timestamp
(function createVersionIndicator() {
    // Remove any existing version indicators
    document.querySelectorAll('[data-version-indicator="true"]').forEach(el => {
        el.remove();
    });
    
    // Create a unique version identifier
    const versionNumber = "1.0.9";
    const timestamp = new Date().toISOString();
    const uniqueId = Math.random().toString(36).substring(2, 8);
    
    // Create the indicator element
    const indicator = document.createElement('div');
    indicator.setAttribute('data-version-indicator', 'true');
    indicator.style.position = 'fixed';
    indicator.style.bottom = '10px';
    indicator.style.right = '10px';
    indicator.style.backgroundColor = 'purple';
    indicator.style.color = 'white';
    indicator.style.padding = '8px 12px';
    indicator.style.borderRadius = '5px';
    indicator.style.fontFamily = 'monospace';
    indicator.style.fontSize = '14px';
    indicator.style.zIndex = '10000';
    indicator.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
    indicator.style.userSelect = 'none';
    
    // Set the content
    indicator.textContent = `v${versionNumber}-${uniqueId}`;
    
    // Add hover effect to show more details
    indicator.title = `Loaded: ${timestamp}`;
    indicator.addEventListener('click', function() {
        alert(`Version: ${versionNumber}\nLoaded: ${timestamp}\nID: ${uniqueId}\nCache Status: Fresh Load`);
    });
    
    // Add to document
    document.body.appendChild(indicator);
    
    // Also add a more prominent indicator at the top
    const topIndicator = document.createElement('div');
    topIndicator.setAttribute('data-version-indicator', 'true');
    topIndicator.style.position = 'fixed';
    topIndicator.style.top = '10px';
    topIndicator.style.left = '50%';
    topIndicator.style.transform = 'translateX(-50%)';
    topIndicator.style.backgroundColor = 'blue';
    topIndicator.style.color = 'white';
    topIndicator.style.padding = '10px 20px';
    topIndicator.style.borderRadius = '5px';
    topIndicator.style.fontFamily = 'Arial, sans-serif';
    topIndicator.style.fontSize = '16px';
    topIndicator.style.fontWeight = 'bold';
    topIndicator.style.zIndex = '10001';
    topIndicator.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
    
    // Set the content with unique ID to ensure cache is cleared
    topIndicator.textContent = `Fresh Version ${versionNumber}-${uniqueId.substring(0, 4)}`;
    
    // Add to document
    document.body.appendChild(topIndicator);
    
    // Log to console
    console.log(
        `%c Version ${versionNumber}-${uniqueId} loaded at ${timestamp} %c`,
        "background: #9C27B0; color: white; font-size: 14px; padding: 5px; border-radius: 3px;",
        ""
    );
    
    // Store in window object for verification
    window.versionInfo = {
        version: versionNumber,
        timestamp: timestamp,
        id: uniqueId,
        status: "Fresh Load"
    };
    
    return `Version indicator ${versionNumber}-${uniqueId} created`;
})();

// Add a function to check version from console
window.checkVersion = function() {
    if (window.versionInfo) {
        console.log(
            `%c Current Version: ${window.versionInfo.version}-${window.versionInfo.id} %c`,
            "background: #4CAF50; color: white; font-size: 14px; padding: 5px; border-radius: 3px;",
            ""
        );
        return window.versionInfo;
    } else {
        console.log(
            `%c No version info available %c`,
            "background: #F44336; color: white; font-size: 14px; padding: 5px; border-radius: 3px;",
            ""
        );
        return "No version info available";
    }
};

// Complete overhaul of hair positioning using local coordinates
function fixHairPositioningCompletely() {
    // Remove any existing hair first
    moles.forEach(mole => {
        for (let i = mole.children.length - 1; i >= 0; i--) {
            const child = mole.children[i];
            if (child.userData && child.userData.isHair) {
                mole.remove(child);
            }
        }
    });
    
    // Get mole orientation to determine "up" direction
    function getMoleUpDirection(mole) {
        // Default up vector (for debugging)
        return new THREE.Vector3(0, 1, 0);
    }
    
    // Hair styles with correct positioning relative to mole orientation
    const hairStyles = [
        // Spiky hair
        function(mole) {
            const hairGroup = new THREE.Group();
            hairGroup.userData.isHair = true;
            
            const spikeCount = 5 + Math.floor(Math.random() * 3);
            const hairColor = new THREE.Color(0x3D2314); // Brown
            
            // Create a container positioned at the center of the mole
            hairGroup.position.set(0, 0, 0);
            
            for (let i = 0; i < spikeCount; i++) {
                const spike = new THREE.Mesh(
                    new THREE.ConeGeometry(0.08, 0.3, 8),
                    new THREE.MeshLambertMaterial({ color: hairColor })
                );
                
                const angle = (i / spikeCount) * Math.PI * 2;
                
                // Position spikes in a circle on top of the head
                spike.position.set(
                    Math.sin(angle) * 0.2,
                    0.5, // Directly on top
                    Math.cos(angle) * 0.2
                );
                
                // Orient spikes outward
                spike.lookAt(new THREE.Vector3(
                    Math.sin(angle) * 2,
                    1.5,
                    Math.cos(angle) * 2
                ));
                
                hairGroup.add(spike);
            }
            
            mole.add(hairGroup);
            console.log("Added spiky hair with absolute positioning");
        },
        
        // Mohawk
        function(mole) {
            const hairGroup = new THREE.Group();
            hairGroup.userData.isHair = true;
            
            // Bright colors for mohawk
            const hairColor = new THREE.Color(
                [0xFF00FF, 0x00FF00, 0xFF0000, 0x00FFFF][Math.floor(Math.random() * 4)]
            );
            
            // Create a container positioned at the center of the mole
            hairGroup.position.set(0, 0, 0);
            
            const mohawkCount = 5;
            for (let i = 0; i < mohawkCount; i++) {
                const spike = new THREE.Mesh(
                    new THREE.ConeGeometry(0.07, 0.35, 8),
                    new THREE.MeshLambertMaterial({ color: hairColor })
                );
                
                // Position in a line on top
                spike.position.set(
                    0,
                    0.5, // Directly on top
                    -0.2 + (i / (mohawkCount - 1)) * 0.4
                );
                
                // Point upward
                spike.rotation.x = 0;
                
                hairGroup.add(spike);
            }
            
            mole.add(hairGroup);
            console.log("Added mohawk with absolute positioning");
        },
        
        // Curly hair
        function(mole) {
            const hairGroup = new THREE.Group();
            hairGroup.userData.isHair = true;
            
            const curlCount = 6;
            const hairColor = new THREE.Color(0x3D2314); // Brown
            
            // Create a container positioned at the center of the mole
            hairGroup.position.set(0, 0, 0);
            
            for (let i = 0; i < curlCount; i++) {
                const curl = new THREE.Mesh(
                    new THREE.TorusGeometry(0.08, 0.03, 8, 8, Math.PI),
                    new THREE.MeshLambertMaterial({ color: hairColor })
                );
                
                const angle = (i / curlCount) * Math.PI * 2;
                
                // Position curls in a circle on top
                curl.position.set(
                    Math.sin(angle) * 0.2,
                    0.5, // Directly on top
                    Math.cos(angle) * 0.2
                );
                
                // Random orientation
                curl.rotation.set(
                    Math.random() * Math.PI,
                    Math.random() * Math.PI,
                    Math.random() * Math.PI
                );
                
                hairGroup.add(curl);
            }
            
            mole.add(hairGroup);
            console.log("Added curly hair with absolute positioning");
        }
    ];
    
    // Apply hair to each mole with debugging
    moles.forEach((mole, index) => {
        console.log(`Mole ${index} position:`, mole.position);
        console.log(`Mole ${index} rotation:`, mole.rotation);
        
        // Choose a random hair style
        const randomStyle = hairStyles[Math.floor(Math.random() * hairStyles.length)];
        
        // Apply the hair style
        randomStyle(mole);
    });
    
    console.log("Complete hair positioning overhaul applied");
}

// Add a function to manually position hair on top
function addManualHair() {
    moles.forEach((mole, index) => {
        // Remove any existing hair
        for (let i = mole.children.length - 1; i >= 0; i--) {
            const child = mole.children[i];
            if (child.userData && child.userData.isHair) {
                mole.remove(child);
            }
        }
        
        // Create a simple hair tuft directly on top
        const hairMaterial = new THREE.MeshLambertMaterial({ 
            color: [0x3D2314, 0xFF00FF, 0x00FF00, 0xFF0000][Math.floor(Math.random() * 4)]
        });
        
        // Create 3-5 spikes in a tight group on top
        const spikeCount = 3 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < spikeCount; i++) {
            const spike = new THREE.Mesh(
                new THREE.ConeGeometry(0.06, 0.25, 8),
                hairMaterial
            );
            
            // Position directly on top with slight variation
            spike.position.set(
                (Math.random() - 0.5) * 0.1,
                0.5, // Top of sphere
                (Math.random() - 0.5) * 0.1
            );
            
            // Point upward with slight variation
            spike.rotation.x = (Math.random() - 0.5) * 0.3;
            spike.rotation.z = (Math.random() - 0.5) * 0.3;
            
            spike.userData.isHair = true;
            mole.add(spike);
        }
        
        console.log(`Added manual hair to mole ${index}`);
    });
}

// Call the manual hair function for most reliable positioning
addManualHair();

// Update the version indicator
if (window.gameVersionInfo) {
    window.gameVersionInfo.version = "1.0.5";
    window.gameVersionInfo.timestamp = new Date().toISOString();
    window.gameVersionInfo.cacheStatus = "Fresh Load - Manual Hair Fix";
}

// Update the version display if it exists
document.querySelectorAll('[style*="position: absolute"][style*="bottom: 10px"][style*="right: 10px"]').forEach(el => {
    el.textContent = 'v1.0.5';
});

console.log("%c Manual Hair Positioning Applied! %c", 
    "background: #4CAF50; color: white; font-size: 14px; padding: 3px; border-radius: 3px;",
    "");

// Debug function to add very visible hair to moles
function addDebugHair() {
    console.log("Starting debug hair function");
    console.log("Number of moles:", moles ? moles.length : "moles array not found");
    
    // If moles array doesn't exist or is empty, try to find moles in the scene
    if (!moles || moles.length === 0) {
        console.log("Moles array not found or empty, searching scene...");
        moles = [];
        scene.traverse(function(object) {
            if (object.isMesh && object.geometry && 
                object.geometry.type === 'SphereGeometry') {
                console.log("Found potential mole:", object);
                moles.push(object);
            }
        });
        console.log("Found", moles.length, "potential moles in scene");
    }
    
    // Process each mole
    moles.forEach((mole, index) => {
        console.log(`Processing mole ${index}:`, mole);
        
        // Create extremely visible hair
        const hairMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xFF0000, // Bright red
            emissive: 0xFF0000,
            emissiveIntensity: 1
        });
        
        // Create a single large cone on top
        const hair = new THREE.Mesh(
            new THREE.ConeGeometry(0.2, 0.5, 8),
            hairMaterial
        );
        
        // Position directly on top of mole
        hair.position.set(0, 0.8, 0);
        
        // Add to mole
        hair.name = "debugHair";
        mole.add(hair);
        
        console.log(`Added debug hair to mole ${index}`);
    });
    
    console.log("Debug hair added to all moles");
    
    // Force a render update
    if (renderer) {
        renderer.render(scene, camera);
        console.log("Forced render update");
    }
}

// Alternative approach: add hair directly to scene
function addSceneHair() {
    console.log("Adding hair directly to scene");
    
    // Find all mole positions
    const molePositions = [];
    scene.traverse(function(object) {
        if (object.isMesh && object.geometry && 
            object.geometry.type === 'SphereGeometry') {
            // Get world position
            const position = new THREE.Vector3();
            object.getWorldPosition(position);
            molePositions.push({
                position: position,
                mole: object
            });
            console.log("Found mole at position:", position);
        }
    });
    
    // Add hair at each mole position
    molePositions.forEach((data, index) => {
        const hairMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xFF00FF, // Bright magenta
            emissive: 0xFF00FF,
            emissiveIntensity: 1
        });
        
        // Create a group of cones
        const hairGroup = new THREE.Group();
        hairGroup.name = "sceneHair" + index;
        
        // Add 3 cones in a mohawk
        for (let i = 0; i < 3; i++) {
            const hair = new THREE.Mesh(
                new THREE.ConeGeometry(0.1, 0.4, 8),
                hairMaterial
            );
            
            // Position in a row
            hair.position.set(0, 0, -0.2 + i * 0.2);
            hair.rotation.x = -Math.PI / 2; // Point up
            
            hairGroup.add(hair);
        }
        
        // Position above the mole
        const pos = data.position.clone();
        pos.y += 0.8; // Move up
        hairGroup.position.copy(pos);
        
        // Add to scene
        scene.add(hairGroup);
        console.log(`Added scene hair at position:`, pos);
    });
    
    console.log("Scene hair added");
    
    // Force a render update
    if (renderer) {
        renderer.render(scene, camera);
    }
}

// Try both approaches
console.log("Attempting hair fixes with multiple approaches");
addDebugHair();
addSceneHair();

// Update the version indicator
console.log("%c Debug Hair Fix Applied! %c", 
    "background: #FF0000; color: white; font-size: 14px; padding: 3px; border-radius: 3px;",
    "");

// Add a visible message on screen
const debugMessage = document.createElement('div');
debugMessage.style.position = 'absolute';
debugMessage.style.top = '50px';
debugMessage.style.left = '50%';
debugMessage.style.transform = 'translateX(-50%)';
debugMessage.style.background = 'rgba(255,0,0,0.7)';
debugMessage.style.color = 'white';
debugMessage.style.padding = '10px';
debugMessage.style.borderRadius = '5px';
debugMessage.style.fontFamily = 'Arial, sans-serif';
debugMessage.style.fontSize = '16px';
debugMessage.style.zIndex = '1000';
debugMessage.textContent = 'Debug Hair v1.0.6 Applied';
document.body.appendChild(debugMessage);

// Final hair fix with correct positioning
function finalHairFix() {
    console.log("Applying final hair fix");
    
    // Clear any existing debug hair
    scene.traverse(function(object) {
        if (object.name && (object.name.includes("debugHair") || object.name.includes("sceneHair"))) {
            if (object.parent) {
                object.parent.remove(object);
            } else {
                scene.remove(object);
            }
        }
    });
    
    // Find all moles
    const moleObjects = [];
    scene.traverse(function(object) {
        if (object.isMesh && object.geometry && 
            object.geometry.type === 'SphereGeometry') {
            moleObjects.push(object);
        }
    });
    
    console.log(`Found ${moleObjects.length} moles for hair application`);
    
    // Add hair to each mole
    moleObjects.forEach((mole, index) => {
        // Create a hair group
        const hairGroup = new THREE.Group();
        hairGroup.name = "finalHair" + index;
        
        // Random hair style and color
        const hairStyle = Math.floor(Math.random() * 3); // 0, 1, or 2
        const hairColors = [
            0xFF0000, // Red
            0x00FF00, // Green
            0x0000FF, // Blue
            0xFF00FF, // Magenta
            0xFFFF00  // Yellow
        ];
        const hairColor = hairColors[Math.floor(Math.random() * hairColors.length)];
        
        // Create hair based on style
        if (hairStyle === 0) {
            // Mohawk - 3 spikes in a row
            for (let i = 0; i < 3; i++) {
                const spike = new THREE.Mesh(
                    new THREE.ConeGeometry(0.1, 0.3, 8),
                    new THREE.MeshBasicMaterial({ color: hairColor })
                );
                
                spike.position.set(0, 0, -0.2 + i * 0.2);
                spike.rotation.x = Math.PI / 2; // Point up
                
                hairGroup.add(spike);
            }
        } else if (hairStyle === 1) {
            // Single large spike
            const spike = new THREE.Mesh(
                new THREE.ConeGeometry(0.15, 0.4, 8),
                new THREE.MeshBasicMaterial({ color: hairColor })
            );
            
            spike.position.set(0, 0, 0);
            spike.rotation.x = Math.PI / 2; // Point up
            
            hairGroup.add(spike);
        } else {
            // Multiple small spikes
            for (let i = 0; i < 5; i++) {
                const spike = new THREE.Mesh(
                    new THREE.ConeGeometry(0.08, 0.25, 8),
                    new THREE.MeshBasicMaterial({ color: hairColor })
                );
                
                const angle = (i / 5) * Math.PI;
                spike.position.set(Math.sin(angle) * 0.15, 0, Math.cos(angle) * 0.15);
                spike.rotation.x = Math.PI / 2; // Point up
                spike.rotation.z = angle;
                
                hairGroup.add(spike);
            }
        }
        
        // Position the hair group on top of the mole
        hairGroup.position.set(0, 0.5, 0);
        
        // Add the hair group to the mole
        mole.add(hairGroup);
        
        console.log(`Added final hair style ${hairStyle} to mole ${index}`);
    });
    
    console.log("Final hair fix applied");
    
    // Update the debug message
    const debugMessages = document.querySelectorAll('[style*="background: rgba(255,0,0,0.7)"]');
    if (debugMessages.length > 0) {
        debugMessages[0].textContent = 'Final Hair v1.0.7 Applied';
        debugMessages[0].style.background = 'rgba(0,255,0,0.7)'; // Change to green
    }
}

// Call the final fix
finalHairFix();

// Force a render update
if (typeof renderer !== 'undefined') {
    renderer.render(scene, camera);
}

console.log("%c Final Hair Fix Applied! %c", 
    "background: #00FF00; color: black; font-size: 14px; padding: 3px; border-radius: 3px;",
    "");

// Simplified hair fix without using traverse
function simpleHairFix() {
    console.log("Applying simple hair fix");
    
    // Direct approach to add hair to moles
    if (typeof moles !== 'undefined' && moles.length > 0) {
        console.log(`Found ${moles.length} moles in moles array`);
        
        // Add hair to each mole
        moles.forEach((mole, index) => {
            try {
                // Create a simple hair spike
                const hairMaterial = new THREE.MeshBasicMaterial({ 
                    color: 0xFF0000 // Bright red
                });
                
                const hair = new THREE.Mesh(
                    new THREE.ConeGeometry(0.15, 0.4, 8),
                    hairMaterial
                );
                
                // Position directly on top
                hair.position.set(0, 0.8, 0);
                hair.rotation.x = Math.PI / 2; // Point up
                
                // Add to mole
                mole.add(hair);
                
                console.log(`Added hair to mole ${index}`);
            } catch (error) {
                console.error(`Error adding hair to mole ${index}:`, error);
            }
        });
    } else {
        console.log("Moles array not found or empty");
    }
    
    // Update the debug message
    try {
        const debugMessages = document.querySelectorAll('[style*="background: rgba(255,0,0,0.7)"]');
        if (debugMessages.length > 0) {
            debugMessages[0].textContent = 'Simple Hair v1.0.8 Applied';
        }
    } catch (e) {
        console.error("Error updating debug message:", e);
    }
    
    console.log("Simple hair fix applied");
}

// Alternative approach using direct DOM manipulation
function addHairViaDOM() {
    console.log("Adding hair indicator via DOM");
    
    // Create a hair indicator that follows moles
    const hairIndicator = document.createElement('div');
    hairIndicator.style.position = 'absolute';
    hairIndicator.style.width = '20px';
    hairIndicator.style.height = '20px';
    hairIndicator.style.backgroundColor = 'red';
    hairIndicator.style.borderRadius = '50% 50% 0 0';
    hairIndicator.style.zIndex = '1000';
    hairIndicator.style.pointerEvents = 'none'; // Don't interfere with clicks
    document.body.appendChild(hairIndicator);
    
    // Update position to follow moles
    let lastMolePosition = { x: 0, y: 0 };
    
    // Function to update hair position
    function updateHairPosition() {
        // Find visible moles
        const visibleMoles = [];
        if (typeof moles !== 'undefined') {
            moles.forEach(mole => {
                if (mole.position.y > -0.5) { // Mole is up
                    // Convert 3D position to screen position
                    const vector = new THREE.Vector3();
                    vector.setFromMatrixPosition(mole.matrixWorld);
                    vector.project(camera);
                    
                    const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
                    const y = (-(vector.y * 0.5) + 0.5) * window.innerHeight;
                    
                    visibleMoles.push({ x, y });
                }
            });
        }
        
        // Update indicator position if moles are visible
        if (visibleMoles.length > 0) {
            // Use the first visible mole
            lastMolePosition = visibleMoles[0];
            hairIndicator.style.display = 'block';
        } else {
            hairIndicator.style.display = 'none';
        }
        
        // Position the indicator above the mole
        hairIndicator.style.left = `${lastMolePosition.x - 10}px`; // Center horizontally
        hairIndicator.style.top = `${lastMolePosition.y - 30}px`; // Position above
        
        // Continue updating
        requestAnimationFrame(updateHairPosition);
    }
    
    // Start updating
    updateHairPosition();
    
    console.log("Hair indicator added via DOM");
}

// Try both approaches
try {
    simpleHairFix();
} catch (e) {
    console.error("Error in simpleHairFix:", e);
}

try {
    addHairViaDOM();
} catch (e) {
    console.error("Error in addHairViaDOM:", e);
}

// Add a simple console message that doesn't depend on any Three.js functionality
console.log("%c Hair Fix Attempt v1.0.8 %c", 
    "background: #FF0000; color: white; font-size: 14px; padding: 3px; border-radius: 3px;",
    "");

// Add a visible message on screen that doesn't depend on any Three.js functionality
const simpleMessage = document.createElement('div');
simpleMessage.style.position = 'absolute';
simpleMessage.style.top = '100px';
simpleMessage.style.left = '50%';
simpleMessage.style.transform = 'translateX(-50%)';
simpleMessage.style.background = 'rgba(0,0,255,0.7)';
simpleMessage.style.color = 'white';
simpleMessage.style.padding = '10px';
simpleMessage.style.borderRadius = '5px';
simpleMessage.style.fontFamily = 'Arial, sans-serif';
simpleMessage.style.fontSize = '16px';
simpleMessage.style.zIndex = '1001';
simpleMessage.textContent = 'Hair Fix v1.0.8 - Check Console';
document.body.appendChild(simpleMessage);
