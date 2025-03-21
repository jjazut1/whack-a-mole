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

// Adjust the camera position
camera.position.set(0, 10, 12); // Move the camera up
camera.lookAt(0, 0, 0);

// Create a global variable to store the grass texture
let grassTexture;

// Function to load grass texture (uses your existing textureLoader)
function loadGrassTexture() {
    // Use the existing textureLoader instead of creating a new one
    window.textureLoader.load(
        'path/to/grass.png', // Replace with your actual path
        (texture) => {
            // Store the loaded texture in the global variable
            grassTexture = texture;
            console.log('Grass texture loaded successfully:', texture);
            
            // Now that texture is loaded, call the enhance function
            enhanceGrass();
        },
        undefined,
        (error) => {
            console.error('Error loading grass texture:', error);
        }
    );
}

// Function to enhance grass appearance using existing variables
function improveGrassAppearance() {
    console.log("Starting grass improvement...");
    
    try {
        // Try to use the existing textureLoader
        const grassImageUrl = 'path/to/grass.png'; // Replace with your actual path
        
        // Use a different approach without declaring new variables
        const existingTextureLoader = textureLoader || new THREE.TextureLoader();
        
        existingTextureLoader.load(
            grassImageUrl,
            function(loadedTexture) {
                console.log('Grass texture loaded successfully');
                applyGrassTexture(loadedTexture);
            },
            undefined,
            function(error) {
                console.error('Error loading grass texture:', error);
            }
        );
    } catch (e) {
        console.error("Error initializing grass improvement:", e);
    }
    
    // Create a version indicator
    const versionEl = document.createElement('div');
    versionEl.style.position = 'absolute';
    versionEl.style.bottom = '10px';
    versionEl.style.right = '10px';
    versionEl.style.background = 'rgba(0,0,0,0.5)';
    versionEl.style.color = 'white';
    versionEl.style.padding = '5px';
    versionEl.style.borderRadius = '3px';
    versionEl.style.fontSize = '12px';
    versionEl.style.fontFamily = 'monospace';
    versionEl.textContent = 'Grass v2.0.1';
    document.body.appendChild(versionEl);
}

// Function to apply the loaded texture
function applyGrassTexture(loadedTexture) {
    try {
        // Remove existing grass if present
        scene.children.forEach(child => {
            if (child.userData && child.userData.isGrass) {
                scene.remove(child);
            }
        });
        
        // Create improved grass instances
        const bladeGeometry = new THREE.PlaneGeometry(0.05, 0.3);
        const grassMaterial = new THREE.MeshLambertMaterial({
            map: loadedTexture,
            transparent: true,
            side: THREE.DoubleSide
        });
        
        // Color variations
        const grassColors = [
            new THREE.Color(0x4CAF50), // Medium green
            new THREE.Color(0x8BC34A), // Light green
            new THREE.Color(0x33691E)  // Dark green
        ];
        
        // Number of blades
        const numBlades = 3000;
        
        // Create blade groups for better organization
        const grassGroup = new THREE.Group();
        grassGroup.userData.isGrass = true;
        
        for (let i = 0; i < numBlades; i++) {
            const blade = new THREE.Mesh(bladeGeometry, grassMaterial.clone());
            
            // Random position
            const x = (Math.random() - 0.5) * 30;
            const z = (Math.random() - 0.5) * 30;
            
            // Calculate height based on terrain equation
            const A = 0.1; // Amplitude
            const B = 0.4; // Frequency
            const terrainHeight = A * Math.sin(B * x) + A * Math.cos(B * z);
            
            blade.position.set(x, terrainHeight + 0.01, z);
            
            // Random rotation
            blade.rotation.y = Math.random() * Math.PI;
            // Slight random tilt
            blade.rotation.x = Math.PI/2 - Math.random() * 0.2;
            
            // Random scale for variety
            const scale = 0.7 + Math.random() * 0.6;
            blade.scale.set(scale, scale + Math.random() * 0.5, scale);
            
            // Random color variation
            blade.material.color = grassColors[Math.floor(Math.random() * grassColors.length)];
            
            grassGroup.add(blade);
        }
        
        scene.add(grassGroup);
        
        // Force render update
        renderer.render(scene, camera);
        
        console.log("Enhanced grass added:", numBlades, "blades");
    } catch (e) {
        console.error("Error applying grass texture:", e);
    }
}

// Call the function to start the process
improveGrassAppearance();

// Function to create a terrain with a custom equation
function createCustomTerrain() {
    const geometry = new THREE.PlaneGeometry(30, 30, 100, 100); // More segments for smoother edges
    
    // Constants for the equation
    const A = 0.1; // Amplitude
    const B = 0.4; // Frequency

    // Modify vertices using the custom equation
    const positionAttribute = geometry.getAttribute('position');
    
    for (let i = 0; i < positionAttribute.count; i++) {
        const x = positionAttribute.getX(i);
        const y = positionAttribute.getY(i);
        
        // Apply the custom equation
        const z = A * Math.sin(B * x) + A * Math.cos(B * y);
        positionAttribute.setZ(i, z);
    }
    
    geometry.computeVertexNormals();
    
    const material = new THREE.MeshLambertMaterial({
        color: 0x90EE90, // Light green
        side: THREE.DoubleSide
    });
    
    const terrain = new THREE.Mesh(geometry, material);
    terrain.rotation.x = Math.PI / 2;
    terrain.position.y = -0.1;
    
    return terrain;
}

// Function to create clouds
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

// Setup scene function
function setupScene() {
    const lights = scene.children.filter(child => child instanceof THREE.Light);
    scene.children.length = 0;
    lights.forEach(light => scene.add(light));

    // Add custom terrain
    const terrain = createCustomTerrain();
    terrain.position.y = -0.5;
    scene.add(terrain);

    // Create and add clouds with lower y-position
    const cloudPositions = [
        { x: -5, y: 2, z: -5 }, // Lower y value
        { x: 0, y: 3, z: -4 },  // Lower y value
        { x: 5, y: 2, z: -5 }   // Lower y value
    ];

    cloudPositions.forEach(pos => {
        const cloud = createCloud();
        cloud.position.set(pos.x, pos.y, pos.z);
        cloud.scale.set(1, 1, 1); // Increase scale for visibility
        scene.add(cloud);
    });

    setupHolesAndMoles();
}

// Setup holes and moles
function setupHolesAndMoles() {
    const holeGeometry = new THREE.CircleGeometry(1.4, 32);
    const holeMaterial = new THREE.MeshLambertMaterial({ 
        color: 0x404040  // Dark gray
    });

    const holes = [
        { x: -1.5, z: -1.5, rotation: Math.PI * 0.25 + 0.175, description: "back Left" },
        { x: 2, z: -1.5, rotation: -Math.PI * 0.25 - 0.175, description: "Front Right" },
        { x: -2, z: 1.5, rotation: Math.PI * 0.75 + 0.175, description: "front Left" },
        { x: 2, z: 2, rotation: -Math.PI * 0.75 - 0.175, description: "Back Right" }
    ];

holes.forEach(pos => {
        console.log(`Creating hole at ${pos.description}`);

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

// Function to create curly hair
function createCurlyHairstyle() {
    const hairGroup = new THREE.Group();
    const hairMaterial = new THREE.MeshLambertMaterial({ color: 0x5A3A1B }); // Darker brown color

    // Create a curve for each strand
    for (let i = 0; i < 500; i++) { // Increase quantity
        const length = 0.3 + Math.random() * 0.2; // Random length
        const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3((Math.random() - 0.5) * 0.1, length / 3, (Math.random() - 0.5) * 0.1),
            new THREE.Vector3((Math.random() - 0.5) * 0.2, length / 2, (Math.random() - 0.5) * 0.2),
            new THREE.Vector3((Math.random() - 0.5) * 0.3, length, (Math.random() - 0.5) * 0.3)
        ]);

        const tubeGeometry = new THREE.TubeGeometry(curve, 20, 0.001, 8, false); // Smaller diameter
        const hairStrand = new THREE.Mesh(tubeGeometry, hairMaterial);

        // Adjust position to sit slightly above the mole's head
        hairStrand.position.set(
            (Math.random() - 0.5) * 0.8, // Random x position
            0.5,                        // Slightly higher y position
            (Math.random() - 0.5) * 0.4 // Random z position
        );

        hairGroup.add(hairStrand);
    }

    return hairGroup;
}

// Modify the createMole function to add the curly hair
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

    // Add hair to the facing group
    const hair = createCurlyHairstyle();
    facingGroup.add(hair);

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
    const targetY = goingUp ? 1.0 : -2.0; // Move below ground when not up
    const startY = mole.position.y;
    const duration = 200;
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

// Explicitly add terrain and clouds to scene
function addTerrainAndClouds() {
    // Add terrain
    const terrain = createCustomTerrain();
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
        "%c Version blue" + versionNumber + " | Loaded: " + versionTimestamp + " %c",
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

// Create super dense integrated grass terrain with consistent coloring
function createSuperDenseIntegratedGrassTerrain() {
    console.log("Creating super dense integrated grass terrain with consistent coloring...");
    
    try {
        // Add version indicator
        const versionNumber = "11.2.0";
        const versionTimestamp = new Date().toISOString();
        
        // Create a version indicator
        const existingIndicator = document.querySelector('[data-version-indicator]');
        if (existingIndicator) {
            existingIndicator.remove();
        }
        
        const indicator = document.createElement('div');
        indicator.setAttribute('data-version-indicator', 'true');
        indicator.style.position = 'absolute';
        indicator.style.bottom = '10px';
        indicator.style.right = '10px';
        indicator.style.background = 'rgba(255, 152, 0, 0.7)'; // Orange during generation
        indicator.style.color = 'white';
        indicator.style.padding = '5px';
        indicator.style.borderRadius = '3px';
        indicator.style.fontSize = '12px';
        indicator.style.fontFamily = 'monospace';
        indicator.style.zIndex = '1000';
        indicator.textContent = `Generating Super Dense Grass...`;
        document.body.appendChild(indicator);
        
        // Store version info globally for verification
        window.gameVersionInfo = {
            version: versionNumber,
            timestamp: versionTimestamp,
            feature: "Super Dense Grass with Consistent Green Coloring"
        };
        
        console.log(`Version ${versionNumber} - ${versionTimestamp}`);
        
        // Remove existing grass if any
        scene.children.forEach(child => {
            if (child.userData && (child.userData.isGrass || child.userData.isGrassChunk)) {
                scene.remove(child);
            }
        });
        
        // Function to get terrain height - maintain compatibility with original code
        function getTerrainHeight(x, z) {
            const A = 0.1; // Amplitude
            const B = 0.4; // Frequency
            return A * Math.sin(B * x) + A * Math.cos(B * z);
        }
        
        // Create grass geometries for variety
        function createGrassGeometries() {
            // Regular blade
            const regular = new THREE.BufferGeometry();
            const regularHeight = 0.25;
            const regularWidth = 0.04;
            const regularCurve = 0.1;
            
            const regularVertices = new Float32Array([
                -regularWidth/2, 0, 0,
                -regularWidth/3, regularHeight*0.33, regularCurve*0.3,
                -regularWidth/4, regularHeight*0.66, regularCurve*0.7,
                0, regularHeight, regularCurve,
                regularWidth/2, 0, 0,
                regularWidth/3, regularHeight*0.33, regularCurve*0.3,
                regularWidth/4, regularHeight*0.66, regularCurve*0.7
            ]);
            
            const indices = [0, 1, 4, 1, 5, 4, 1, 2, 5, 2, 6, 5, 2, 3, 6];
            
            const uvs = new Float32Array([
                0.0, 0.0, 0.0, 0.33, 0.0, 0.66, 0.5, 1.0,
                1.0, 0.0, 1.0, 0.33, 1.0, 0.66
            ]);
            
            regular.setAttribute('position', new THREE.BufferAttribute(regularVertices, 3));
            regular.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
            regular.setIndex(indices);
            regular.computeVertexNormals();
            
            // Tall blade
            const tall = new THREE.BufferGeometry();
            const tallHeight = 0.4;
            const tallWidth = 0.035;
            const tallCurve = 0.12;
            
            const tallVertices = new Float32Array([
                -tallWidth/2, 0, 0,
                -tallWidth/3, tallHeight*0.33, tallCurve*0.4,
                -tallWidth/4, tallHeight*0.66, tallCurve*0.8,
                0, tallHeight, tallCurve,
                tallWidth/2, 0, 0,
                tallWidth/3, tallHeight*0.33, tallCurve*0.4,
                tallWidth/4, tallHeight*0.66, tallCurve*0.8
            ]);
            
            tall.setAttribute('position', new THREE.BufferAttribute(tallVertices, 3));
            tall.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
            tall.setIndex(indices);
            tall.computeVertexNormals();
            
            // Short blade
            const short = new THREE.BufferGeometry();
            const shortHeight = 0.15;
            const shortWidth = 0.045;
            const shortCurve = 0.05;
            
            const shortVertices = new Float32Array([
                -shortWidth/2, 0, 0,
                -shortWidth/3, shortHeight*0.33, shortCurve*0.3,
                -shortWidth/4, shortHeight*0.66, shortCurve*0.5,
                0, shortHeight, shortCurve*0.7,
                shortWidth/2, 0, 0,
                shortWidth/3, shortHeight*0.33, shortCurve*0.3,
                shortWidth/4, shortHeight*0.66, shortCurve*0.5
            ]);
            
            short.setAttribute('position', new THREE.BufferAttribute(shortVertices, 3));
            short.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
            short.setIndex(indices);
            short.computeVertexNormals();
            
            // Thin blade
            const thin = new THREE.BufferGeometry();
            const thinHeight = 0.3;
            const thinWidth = 0.03;
            const thinCurve = 0.08;
            
            const thinVertices = new Float32Array([
                -thinWidth/2, 0, 0,
                -thinWidth/3, thinHeight*0.33, thinCurve*0.3,
                -thinWidth/4, thinHeight*0.66, thinCurve*0.6,
                0, thinHeight, thinCurve,
                thinWidth/2, 0, 0,
                thinWidth/3, thinHeight*0.33, thinCurve*0.3,
                thinWidth/4, thinHeight*0.66, thinCurve*0.6
            ]);
            
            thin.setAttribute('position', new THREE.BufferAttribute(thinVertices, 3));
            thin.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
            thin.setIndex(indices);
            thin.computeVertexNormals();
            
            return [regular, tall, short, thin];
        }
        
        // Create grass materials with CONSISTENT green colors
        // No white or extremely light colors
        const greenMaterials = [
            new THREE.MeshLambertMaterial({ 
                color: 0x4CAF50, // Medium green
                side: THREE.DoubleSide
            }),
            new THREE.MeshLambertMaterial({ 
                color: 0x66BB6A, // Light green
                side: THREE.DoubleSide
            }),
            new THREE.MeshLambertMaterial({ 
                color: 0x81C784, // Lighter green but still green
                side: THREE.DoubleSide
            }),
            new THREE.MeshLambertMaterial({ 
                color: 0x388E3C, // Darker green
                side: THREE.DoubleSide
            }),
            new THREE.MeshLambertMaterial({ 
                color: 0x2E7D32, // Forest green
                side: THREE.DoubleSide
            })
        ];
        
        // Create grass group
        const grassGroup = new THREE.Group();
        grassGroup.userData.isGrass = true;
        
        // Generate geometries
        const geometries = createGrassGeometries();
        
        // Get hole positions to avoid (from existing scene)
        const holePositions = [];
        scene.children.forEach(child => {
            if (child.geometry && 
                child.geometry.type === 'CircleGeometry') {
                
                holePositions.push({
                    x: child.position.x,
                    z: child.position.z,
                    radius: 1.5
                });
                
                console.log(`Found hole at: ${child.position.x}, ${child.position.z}`);
            }
        });
        
        // Fallback hole positions if none found
        if (holePositions.length === 0) {
            holePositions.push(
                { x: -2.25, z: -2.25, radius: 1.5 },
                { x: 3, z: -2.25, radius: 1.5 },
                { x: -3, z: 2.25, radius: 1.5 },
                { x: 3, z: 3, radius: 1.5 }
            );
            console.log("Using fallback hole positions");
        }
        
        // Function to check if position is in a hole
        function isInsideHole(posX, posZ) {
            for (let hole of holePositions) {
                const dx = posX - hole.x;
                const dz = posZ - hole.z;
                const distanceSquared = dx * dx + dz * dz;
                
                if (distanceSquared < (hole.radius * 1.1) * (hole.radius * 1.1)) {
                    return true;
                }
            }
            return false;
        }
        
        // Grass distribution parameters - 8x more dense than original (2x the previous)
        const terrainSize = 30;
        const clumpCount = 32000; // 2x the previous 16000
        
        // Use a smaller grid for even denser coverage
        const halfSize = terrainSize / 2;
        const gridSize = 0.18; // Smaller than previous for 2x density
        
        let clumpsCreated = 0;
        let bladesCreated = 0;
        
        // Process grass in smaller chunks for better performance
        const processChunkSize = 200; // Reduced further to maintain smoothness
        let xPos = -halfSize;
        let zPos = -halfSize;
        
        // Create multiple groups for better memory management
        const grassChunks = [];
        const GRASS_PER_CHUNK = 4000; // Blades per chunk - reduced for better performance
        let currentChunk = new THREE.Group();
        currentChunk.userData.isGrassChunk = true;
        grassChunks.push(currentChunk);
        
        // Create progress bar
        const progressContainer = document.createElement('div');
        progressContainer.style.position = 'absolute';
        progressContainer.style.bottom = '40px';
        progressContainer.style.left = '10px';
        progressContainer.style.right = '10px';
        progressContainer.style.height = '10px';
        progressContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';
        progressContainer.style.borderRadius = '5px';
        progressContainer.style.overflow = 'hidden';
        progressContainer.style.zIndex = '1000';
        
        const progressBar = document.createElement('div');
        progressBar.style.height = '100%';
        progressBar.style.width = '0%';
        progressBar.style.backgroundColor = '#4CAF50';
        progressBar.style.transition = 'width 0.2s';
        
        progressContainer.appendChild(progressBar);
        document.body.appendChild(progressContainer);
        
        // Check for and add required lighting if it doesn't exist
        let hasAmbientLight = false;
        let hasDirectionalLight = false;
        
        scene.children.forEach(child => {
            if (child instanceof THREE.AmbientLight) {
                hasAmbientLight = true;
            }
            if (child instanceof THREE.DirectionalLight) {
                hasDirectionalLight = true;
            }
        });
        
        if (!hasAmbientLight) {
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
            scene.add(ambientLight);
            console.log("Added ambient light for better grass visibility");
        }
        
        if (!hasDirectionalLight) {
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(5, 10, 5);
            scene.add(directionalLight);
            console.log("Added directional light for better grass visibility");
        }
        
        function processNextChunk() {
            const startTime = performance.now();
            let chunkClumps = 0;
            
            while (chunkClumps < processChunkSize && clumpsCreated < clumpCount) {
                while (zPos < halfSize && clumpsCreated < clumpCount) {
                    // Add randomness to positions
                    const posX = xPos + (Math.random() - 0.5) * (gridSize * 0.8);
                    const posZ = zPos + (Math.random() - 0.5) * (gridSize * 0.8);
                    
                    // Skip if in a hole
                    if (!isInsideHole(posX, posZ)) {
                        // Get terrain height
                        const posY = getTerrainHeight(posX, posZ);
                        
                        // Create a clump of 2-5 blades
                        const bladeCount = 2 + Math.floor(Math.random() * 4);
                        
                        for (let i = 0; i < bladeCount; i++) {
                            // Choose a random blade type
                            const geometryIndex = Math.floor(Math.random() * geometries.length);
                            const bladeGeometry = geometries[geometryIndex];
                            
                            // Choose random material - all proper greens, no whites
                            const material = greenMaterials[Math.floor(Math.random() * greenMaterials.length)];
                            
                            // Create blade
                            const blade = new THREE.Mesh(bladeGeometry, material);
                            
                            // Position within the clump
                            const offset = 0.02; // Smaller offset for denser appearance
                            const offsetX = (Math.random() - 0.5) * offset;
                            const offsetZ = (Math.random() - 0.5) * offset;
                            
                            blade.position.set(posX + offsetX, posY, posZ + offsetZ);
                            
                            // Random rotation
                            blade.rotation.y = Math.random() * Math.PI * 2;
                            
                            // Very slight tilt for more natural look
                            blade.rotation.x = (Math.random() - 0.5) * 0.1;
                            blade.rotation.z = (Math.random() - 0.5) * 0.1;
                            
                            // Slight random scaling - narrower range for consistency
                            const scale = 0.85 + Math.random() * 0.25;
                            blade.scale.set(scale, scale, scale);
                            
                            // Add to current chunk
                            currentChunk.add(blade);
                            bladesCreated++;
                            
                            // If current chunk is full, create a new one
                            if (bladesCreated % GRASS_PER_CHUNK === 0) {
                                // Add the completed chunk to the scene immediately to free memory
                                scene.add(currentChunk);
                                
                                currentChunk = new THREE.Group();
                                currentChunk.userData.isGrassChunk = true;
                                grassChunks.push(currentChunk);
                                console.log(`Created new grass chunk #${grassChunks.length}`);
                            }
                        }
                        
                        clumpsCreated++;
                        chunkClumps++;
                    }
                    
                    // Move to next grid position
                    zPos += gridSize;
                    
                    // Check if we've spent too much time
                    if (performance.now() - startTime > 16) {
                        break;
                    }
                }
                
                // Reset z and increment x at end of row
                if (zPos >= halfSize) {
                    zPos = -halfSize;
                    xPos += gridSize;
                }
                
                // Break if we've spent too much time
                if (performance.now() - startTime > 16) {
                    break;
                }
            }
            
            // Update progress
            const progress = Math.min(100, Math.floor((clumpsCreated / clumpCount) * 100));
            progressBar.style.width = `${progress}%`;
            
            console.log(`Grass generation: ${progress}% (${clumpsCreated}/${clumpCount} clumps, ${bladesCreated} blades)`);
            
            // Force render to show progress
            if (typeof renderer !== 'undefined') {
    renderer.render(scene, camera);
}
            
            // Continue or finish
            if (clumpsCreated < clumpCount && xPos < halfSize) {
                // Continue in next frame
                setTimeout(() => {
                    requestAnimationFrame(processNextChunk);
                }, 10); // Slightly longer delay to prevent browser stuttering
                
                // Update indicator text
                indicator.textContent = `Generating Super Dense Grass ${progress}%`;
            } else {
                // Finish and cleanup
                console.log(`Completed: ${clumpsCreated} grass clumps with ${bladesCreated} blades in ${grassChunks.length} chunks`);
                
                // Add any remaining chunks to scene
                if (currentChunk.children.length > 0) {
                    scene.add(currentChunk);
                }
                
                // Remove progress bar
                progressContainer.remove();
                
                // Final render update
                if (typeof renderer !== 'undefined') {
                    renderer.render(scene, camera);
                }
                
                // Update indicator with final info
                indicator.textContent = `Super Dense Grass v${versionNumber} - ${bladesCreated} blades`;
                indicator.style.background = 'rgba(76, 175, 80, 0.7)';
                
                // Set up a memory optimization cleanup timer
                setTimeout(() => {
                    console.log("Running performance optimization...");
                    // Disable rendering updates for grass chunks to improve performance
                    grassChunks.forEach(chunk => {
                        chunk.frustumCulled = false;
                        
                        // Make static to save CPU
                        chunk.matrixAutoUpdate = false;
                        chunk.updateMatrix();
                    });
                    
                    console.log("Grass performance optimization complete");
                }, 1000);
            }
        }
        
        // Start generating grass
        processNextChunk();
        
        console.log(`Starting super dense grass generation (target: ${clumpCount} clumps)`);
        
        return true;
    } catch (e) {
        console.error("Error creating super dense grass:", e);
        
        // Clean up on error
        const progressContainer = document.querySelector('div:has(> div[style*="backgroundColor: #4CAF50"])');
        if (progressContainer) {
            progressContainer.remove();
        }
        
        return false;
    }
}

// Call the function
createSuperDenseIntegratedGrassTerrain();

// Create consistently green grass with no white blades
function createConsistentGreenGrass() {
    console.log("Creating grass with no white blades...");
    
    try {
        // Add version indicator
        const versionNumber = "11.3.0";
        const versionTimestamp = new Date().toISOString();
        
        // Create a version indicator
        const existingIndicator = document.querySelector('[data-version-indicator]');
        if (existingIndicator) {
            existingIndicator.remove();
        }
        
        const indicator = document.createElement('div');
        indicator.setAttribute('data-version-indicator', 'true');
        indicator.style.position = 'absolute';
        indicator.style.bottom = '10px';
        indicator.style.right = '10px';
        indicator.style.background = 'rgba(255, 152, 0, 0.7)'; // Orange during generation
        indicator.style.color = 'white';
        indicator.style.padding = '5px';
        indicator.style.borderRadius = '3px';
        indicator.style.fontSize = '12px';
        indicator.style.fontFamily = 'monospace';
        indicator.style.zIndex = '1000';
        indicator.textContent = `Fixing White Grass Blades...`;
        document.body.appendChild(indicator);
        
        // Store version info globally for verification
        window.gameVersionInfo = {
            version: versionNumber,
            timestamp: versionTimestamp,
            feature: "Consistent Green Grass (No White Blades)"
        };
        
        console.log(`Version ${versionNumber} - ${versionTimestamp}`);
        
        // Remove existing grass if any
        scene.children.forEach(child => {
            if (child.userData && (child.userData.isGrass || child.userData.isGrassChunk)) {
                scene.remove(child);
            }
        });
        
        // Create fixed materials with GUARANTEED green colors
        // No white or extremely light colors at all
        const deepGreenMaterials = [
            new THREE.MeshLambertMaterial({ 
                color: 0x2E7D32, // Forest green
                side: THREE.DoubleSide
            }),
            new THREE.MeshLambertMaterial({ 
                color: 0x388E3C, // Dark green
                side: THREE.DoubleSide
            }),
            new THREE.MeshLambertMaterial({ 
                color: 0x43A047, // Medium-dark green
                side: THREE.DoubleSide
            }),
            new THREE.MeshLambertMaterial({ 
                color: 0x4CAF50, // Medium green
                side: THREE.DoubleSide
            }),
            new THREE.MeshLambertMaterial({ 
                color: 0x66BB6A, // Medium-light green
                side: THREE.DoubleSide
            })
        ];
        
        // Function to get terrain height - maintain compatibility with original code
        function getTerrainHeight(x, z) {
            const A = 0.1; // Amplitude
            const B = 0.4; // Frequency
            return A * Math.sin(B * x) + A * Math.cos(B * z);
        }
        
        // Create grass geometries for variety
        function createGrassGeometries() {
            // Regular blade
            const regular = new THREE.BufferGeometry();
            const regularHeight = 0.25;
            const regularWidth = 0.04;
            const regularCurve = 0.1;
            
            const regularVertices = new Float32Array([
                -regularWidth/2, 0, 0,
                -regularWidth/3, regularHeight*0.33, regularCurve*0.3,
                -regularWidth/4, regularHeight*0.66, regularCurve*0.7,
                0, regularHeight, regularCurve,
                regularWidth/2, 0, 0,
                regularWidth/3, regularHeight*0.33, regularCurve*0.3,
                regularWidth/4, regularHeight*0.66, regularCurve*0.7
            ]);
            
            const indices = [0, 1, 4, 1, 5, 4, 1, 2, 5, 2, 6, 5, 2, 3, 6];
            
            const uvs = new Float32Array([
                0.0, 0.0, 0.0, 0.33, 0.0, 0.66, 0.5, 1.0,
                1.0, 0.0, 1.0, 0.33, 1.0, 0.66
            ]);
            
            regular.setAttribute('position', new THREE.BufferAttribute(regularVertices, 3));
            regular.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
            regular.setIndex(indices);
            regular.computeVertexNormals();
            
            // Tall blade
            const tall = new THREE.BufferGeometry();
            const tallHeight = 0.4;
            const tallWidth = 0.035;
            const tallCurve = 0.12;
            
            const tallVertices = new Float32Array([
                -tallWidth/2, 0, 0,
                -tallWidth/3, tallHeight*0.33, tallCurve*0.4,
                -tallWidth/4, tallHeight*0.66, tallCurve*0.8,
                0, tallHeight, tallCurve,
                tallWidth/2, 0, 0,
                tallWidth/3, tallHeight*0.33, tallCurve*0.4,
                tallWidth/4, tallHeight*0.66, tallCurve*0.8
            ]);
            
            tall.setAttribute('position', new THREE.BufferAttribute(tallVertices, 3));
            tall.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
            tall.setIndex(indices);
            tall.computeVertexNormals();
            
            // Short blade
            const short = new THREE.BufferGeometry();
            const shortHeight = 0.15;
            const shortWidth = 0.045;
            const shortCurve = 0.05;
            
            const shortVertices = new Float32Array([
                -shortWidth/2, 0, 0,
                -shortWidth/3, shortHeight*0.33, shortCurve*0.3,
                -shortWidth/4, shortHeight*0.66, shortCurve*0.5,
                0, shortHeight, shortCurve*0.7,
                shortWidth/2, 0, 0,
                shortWidth/3, shortHeight*0.33, shortCurve*0.3,
                shortWidth/4, shortHeight*0.66, shortCurve*0.5
            ]);
            
            short.setAttribute('position', new THREE.BufferAttribute(shortVertices, 3));
            short.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
            short.setIndex(indices);
            short.computeVertexNormals();
            
            // Thin blade
            const thin = new THREE.BufferGeometry();
            const thinHeight = 0.3;
            const thinWidth = 0.03;
            const thinCurve = 0.08;
            
            const thinVertices = new Float32Array([
                -thinWidth/2, 0, 0,
                -thinWidth/3, thinHeight*0.33, thinCurve*0.3,
                -thinWidth/4, thinHeight*0.66, thinCurve*0.6,
                0, thinHeight, thinCurve,
                thinWidth/2, 0, 0,
                thinWidth/3, thinHeight*0.33, thinCurve*0.3,
                thinWidth/4, thinHeight*0.66, thinCurve*0.6
            ]);
            
            thin.setAttribute('position', new THREE.BufferAttribute(thinVertices, 3));
            thin.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
            thin.setIndex(indices);
            thin.computeVertexNormals();
            
            return [regular, tall, short, thin];
        }
        
        // Create fixed grass materials with specific configuration to eliminate white appearance
        function createFixedGrassMaterial(colorIndex) {
            const material = deepGreenMaterials[colorIndex % deepGreenMaterials.length].clone();
            
            // Ensure material properties are set to prevent white reflections
            material.shininess = 0;
            material.reflectivity = 0;
            material.metalness = 0;
            material.roughness = 1;
            material.emissive.set(0, 0, 0);
            material.specular = new THREE.Color(0x000000);
            material.flatShading = true;
            
            return material;
        }
        
        // Create grass group
        const grassGroup = new THREE.Group();
        grassGroup.userData.isGrass = true;
        
        // Generate geometries
        const geometries = createGrassGeometries();
        
        // Get hole positions to avoid (from existing scene)
        const holePositions = [];
        scene.children.forEach(child => {
            if (child.geometry && 
                child.geometry.type === 'CircleGeometry') {
                
                holePositions.push({
                    x: child.position.x,
                    z: child.position.z,
                    radius: 1.5
                });
                
                console.log(`Found hole at: ${child.position.x}, ${child.position.z}`);
            }
        });
        
        // Fallback hole positions if none found
        if (holePositions.length === 0) {
            holePositions.push(
                { x: -2.25, z: -2.25, radius: 1.5 },
                { x: 3, z: -2.25, radius: 1.5 },
                { x: -3, z: 2.25, radius: 1.5 },
                { x: 3, z: 3, radius: 1.5 }
            );
            console.log("Using fallback hole positions");
        }
        
        // Function to check if position is in a hole
        function isInsideHole(posX, posZ) {
            for (let hole of holePositions) {
                const dx = posX - hole.x;
                const dz = posZ - hole.z;
                const distanceSquared = dx * dx + dz * dz;
                
                if (distanceSquared < (hole.radius * 1.1) * (hole.radius * 1.1)) {
                    return true;
                }
            }
            return false;
        }
        
        // Grass distribution parameters - 8x more dense than original (2x the previous)
        const terrainSize = 30;
        const clumpCount = 32000;
        
        // Use a smaller grid for even denser coverage
        const halfSize = terrainSize / 2;
        const gridSize = 0.18;
        
        let clumpsCreated = 0;
        let bladesCreated = 0;
        
        // Process grass in smaller chunks for better performance
        const processChunkSize = 200;
        let xPos = -halfSize;
        let zPos = -halfSize;
        
        // Create multiple groups for better memory management
        const grassChunks = [];
        const GRASS_PER_CHUNK = 4000;
        let currentChunk = new THREE.Group();
        currentChunk.userData.isGrassChunk = true;
        grassChunks.push(currentChunk);
        
        // Create progress bar
        const progressContainer = document.createElement('div');
        progressContainer.style.position = 'absolute';
        progressContainer.style.bottom = '40px';
        progressContainer.style.left = '10px';
        progressContainer.style.right = '10px';
        progressContainer.style.height = '10px';
        progressContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';
        progressContainer.style.borderRadius = '5px';
        progressContainer.style.overflow = 'hidden';
        progressContainer.style.zIndex = '1000';
        
        const progressBar = document.createElement('div');
        progressBar.style.height = '100%';
        progressBar.style.width = '0%';
        progressBar.style.backgroundColor = '#4CAF50';
        progressBar.style.transition = 'width 0.2s';
        
        progressContainer.appendChild(progressBar);
        document.body.appendChild(progressContainer);
        
        // Check for and add required lighting if it doesn't exist
        let hasAmbientLight = false;
        let hasDirectionalLight = false;
        
        scene.children.forEach(child => {
            if (child instanceof THREE.AmbientLight) {
                hasAmbientLight = true;
            }
            if (child instanceof THREE.DirectionalLight) {
                hasDirectionalLight = true;
            }
        });
        
        if (!hasAmbientLight) {
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
            scene.add(ambientLight);
            console.log("Added ambient light for better grass visibility");
        }
        
        if (!hasDirectionalLight) {
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(5, 10, 5);
            scene.add(directionalLight);
            console.log("Added directional light for better grass visibility");
        }
        
        function processNextChunk() {
            const startTime = performance.now();
            let chunkClumps = 0;
            
            while (chunkClumps < processChunkSize && clumpsCreated < clumpCount) {
                while (zPos < halfSize && clumpsCreated < clumpCount) {
                    // Add randomness to positions
                    const posX = xPos + (Math.random() - 0.5) * (gridSize * 0.8);
                    const posZ = zPos + (Math.random() - 0.5) * (gridSize * 0.8);
                    
                    // Skip if in a hole
                    if (!isInsideHole(posX, posZ)) {
                        // Get terrain height
                        const posY = getTerrainHeight(posX, posZ);
                        
                        // Create a clump of 2-5 blades
                        const bladeCount = 2 + Math.floor(Math.random() * 4);
                        
                        for (let i = 0; i < bladeCount; i++) {
                            // Choose a random blade type
                            const geometryIndex = Math.floor(Math.random() * geometries.length);
                            const bladeGeometry = geometries[geometryIndex];
                            
                            // Choose a guaranteed green material - no whites
                            const materialIndex = Math.floor(Math.random() * deepGreenMaterials.length);
                            const material = createFixedGrassMaterial(materialIndex);
                            
                            // Create blade
                            const blade = new THREE.Mesh(bladeGeometry, material);
                            
                            // Position within the clump
                            const offset = 0.02;
                            const offsetX = (Math.random() - 0.5) * offset;
                            const offsetZ = (Math.random() - 0.5) * offset;
                            
                            blade.position.set(posX + offsetX, posY, posZ + offsetZ);
                            
                            // Random rotation
                            blade.rotation.y = Math.random() * Math.PI * 2;
                            
                            // Very slight tilt for more natural look
                            blade.rotation.x = (Math.random() - 0.5) * 0.1;
                            blade.rotation.z = (Math.random() - 0.5) * 0.1;
                            
                            // Slight random scaling - narrower range for consistency
                            const scale = 0.85 + Math.random() * 0.25;
                            blade.scale.set(scale, scale, scale);
                            
                            // Add to current chunk
                            currentChunk.add(blade);
                            bladesCreated++;
                            
                            // If current chunk is full, create a new one
                            if (bladesCreated % GRASS_PER_CHUNK === 0) {
                                // Add the completed chunk to the scene immediately to free memory
                                scene.add(currentChunk);
                                
                                currentChunk = new THREE.Group();
                                currentChunk.userData.isGrassChunk = true;
                                grassChunks.push(currentChunk);
                                console.log(`Created new grass chunk #${grassChunks.length}`);
                            }
                        }
                        
                        clumpsCreated++;
                        chunkClumps++;
                    }
                    
                    // Move to next grid position
                    zPos += gridSize;
                    
                    // Check if we've spent too much time
                    if (performance.now() - startTime > 16) {
                        break;
                    }
                }
                
                // Reset z and increment x at end of row
                if (zPos >= halfSize) {
                    zPos = -halfSize;
                    xPos += gridSize;
                }
                
                // Break if we've spent too much time
                if (performance.now() - startTime > 16) {
                    break;
                }
            }
            
            // Update progress
            const progress = Math.min(100, Math.floor((clumpsCreated / clumpCount) * 100));
            progressBar.style.width = `${progress}%`;
            
            console.log(`Grass generation: ${progress}% (${clumpsCreated}/${clumpCount} clumps, ${bladesCreated} blades)`);
            
            // Force render to show progress
            if (typeof renderer !== 'undefined') {
                renderer.render(scene, camera);
            }
            
            // Continue or finish
            if (clumpsCreated < clumpCount && xPos < halfSize) {
                // Continue in next frame
                setTimeout(() => {
                    requestAnimationFrame(processNextChunk);
                }, 10);
                
                // Update indicator text
                indicator.textContent = `Fixing Grass Colors ${progress}%`;
            } else {
                // Finish and cleanup
                console.log(`Completed: ${clumpsCreated} grass clumps with ${bladesCreated} blades in ${grassChunks.length} chunks`);
                
                // Add any remaining chunks to scene
                if (currentChunk.children.length > 0) {
                    scene.add(currentChunk);
                }
                
                // Remove progress bar
                progressContainer.remove();
                
                // Final render update
                if (typeof renderer !== 'undefined') {
                    renderer.render(scene, camera);
                }
                
                // Update indicator with final info
                indicator.textContent = `Consistent Green Grass v${versionNumber} - No White Blades`;
                indicator.style.background = 'rgba(76, 175, 80, 0.7)';
                
                // Set up a memory optimization cleanup timer
                setTimeout(() => {
                    console.log("Running performance optimization...");
                    
                    // Disable rendering updates for grass chunks to improve performance
                    grassChunks.forEach(chunk => {
                        chunk.frustumCulled = false;
                        
                        // Make static to save CPU
                        chunk.matrixAutoUpdate = false;
                        chunk.updateMatrix();
                    });
                    
                    console.log("Grass performance optimization complete");
                }, 1000);
            }
        }
        
        // Start generating grass
        processNextChunk();
        
        console.log(`Starting consistent green grass generation (target: ${clumpCount} clumps)`);
        
        return true;
    } catch (e) {
        console.error("Error creating consistent green grass:", e);
        
        // Clean up on error
        const progressContainer = document.querySelector('div:has(> div[style*="backgroundColor: #4CAF50"])');
        if (progressContainer) {
            progressContainer.remove();
        }
        
        return false;
    }
}

// Call the function
createConsistentGreenGrass();


function createDenseGrass() {
    console.log("Creating dense grass with no text...");

    try {
        // Remove any existing grass
        let grassRemoved = 0;
        scene.traverse(object => {
            if (object.userData && 
                (object.userData.isGrass || object.userData.isGrassChunk || object.userData.isGrassBlade)) {
                if (object.parent) {
                    object.parent.remove(object);
                    grassRemoved++;
                }
            }
        });

        console.log(`Removed ${grassRemoved} existing grass objects`);

        // Use existing texture generation logic
        const textures = createGrassTextures();

        const grassMaterial = new THREE.MeshBasicMaterial({
            map: textures[0],
            transparent: true,
            alphaTest: 0.1,
            side: THREE.DoubleSide
        });

        const grassMaterial2 = new THREE.MeshBasicMaterial({
            map: textures[1],
            transparent: true,
            alphaTest: 0.1,
            side: THREE.DoubleSide
        });

        // Function to get terrain height
        function getTerrainHeight(x, z) {
            const A = 0.1; // Amplitude
            const B = 0.4; // Frequency
            return A * Math.sin(B * x) + A * Math.cos(B * z);
        }

        // Get hole positions to avoid
        const holePositions = [];
        scene.children.forEach(child => {
            if (child.geometry && 
                child.geometry.type === 'CircleGeometry') {
                
                holePositions.push({
                    x: child.position.x,
                    z: child.position.z,
                    radius: 1.5
                });
                
                console.log(`Found hole at: ${child.position.x}, ${child.position.z}`);
            }
        });

        // Fallback hole positions if none found
        if (holePositions.length === 0) {
            holePositions.push(
                { x: -2.25, z: -2.25, radius: 1.5 },
                { x: 3, z: -2.25, radius: 1.5 },
                { x: -3, z: 2.25, radius: 1.5 },
                { x: 3, z: 3, radius: 1.5 }
            );
            console.log("Using fallback hole positions");
        }

        // Function to check if position is in a hole
        function isInsideHole(posX, posZ) {
            for (let hole of holePositions) {
                const dx = posX - hole.x;
                const dz = posZ - hole.z;
                const distanceSquared = dx * dx + dz * dz;
                
                if (distanceSquared < (hole.radius * 1.1) * (hole.radius * 1.1)) {
                    return true;
                }
            }
            return false;
        }

        // Create a master container for all grass
        const grassContainer = new THREE.Group();
        grassContainer.name = "Dense Grass";
        grassContainer.userData.isGrass = true;

        // Use instanced meshes for identical grass planes
        console.log("Creating instanced grass for performance...");

        // Create base geometries for the grass planes
        const planeGeometry = new THREE.PlaneGeometry(0.5, 0.5);

        // Set up instance counts based on density needs
        const terrainSize = 30;
        const halfSize = terrainSize / 2;
        const gridSize = 0.67; // 1.5 times denser than before
        const maxInstances = 7500; // 1.5 times the previous 5000

        // Count potential positions first
        let potentialPositions = 0;
        for (let x = -halfSize; x < halfSize; x += gridSize) {
            for (let z = -halfSize; z < halfSize; z += gridSize) {
                if (!isInsideHole(x, z)) {
                    potentialPositions++;
                }
            }
        }

        // Cap the count
        const instanceCount = Math.min(potentialPositions, maxInstances);
        console.log(`Creating ${instanceCount} grass instances`);

        // Create instanced mesh for vertical planes
        const instancedMeshV = new THREE.InstancedMesh(
            planeGeometry, 
            grassMaterial, 
            instanceCount
        );
        instancedMeshV.name = "Instanced Grass Vertical";
        instancedMeshV.userData.isGrassChunk = true;
        instancedMeshV.frustumCulled = false;

        // Create instanced mesh for horizontal planes
        const instancedMeshH = new THREE.InstancedMesh(
            planeGeometry, 
            grassMaterial2, 
            instanceCount
        );
        instancedMeshH.name = "Instanced Grass Horizontal";
        instancedMeshH.userData.isGrassChunk = true;
        instancedMeshH.frustumCulled = false;

        // Set up transformation matrices for instances
        const dummy = new THREE.Object3D();
        let instanceIndex = 0;

        // Place grass instances systematically with randomization
        for (let x = -halfSize; x < halfSize; x += gridSize) {
            for (let z = -halfSize; z < halfSize; z += gridSize) {
                // Skip if in hole or reached max instances
                if (isInsideHole(x, z) || instanceIndex >= instanceCount) {
                    continue;
                }

                // Add randomization to position
                const offsetX = (Math.random() - 0.5) * gridSize * 0.8;
                const offsetZ = (Math.random() - 0.5) * gridSize * 0.8;
                const posX = x + offsetX;
                const posZ = z + offsetZ;

                // Get height at position
                const posY = getTerrainHeight(posX, posZ);

                // Set position and scale (randomized)
                const scale = 1.0 + Math.random() * 0.5;

                // Set vertical plane
                dummy.position.set(posX, posY + 0.25 * scale, posZ);
                dummy.rotation.y = Math.random() * Math.PI;
                dummy.scale.set(scale, scale, scale);
                dummy.updateMatrix();
                instancedMeshV.setMatrixAt(instanceIndex, dummy.matrix);

                // Set horizontal plane (crossed with vertical)
                dummy.rotation.y += Math.PI / 2; // Rotate 90 degrees
                dummy.updateMatrix();
                instancedMeshH.setMatrixAt(instanceIndex, dummy.matrix);

                instanceIndex++;
            }
        }

        // Update the instance matrices
        instancedMeshV.instanceMatrix.needsUpdate = true;
        instancedMeshH.instanceMatrix.needsUpdate = true;

        // Add to container
        grassContainer.add(instancedMeshV);
        grassContainer.add(instancedMeshH);

        // Add the container to the scene
        scene.add(grassContainer);

        // Make grass static for maximum performance
        grassContainer.matrixAutoUpdate = false;
        grassContainer.updateMatrix();

        // Apply additional performance optimizations
        // Disable frustum culling to prevent popping
        grassContainer.frustumCulled = false;
        grassContainer.traverse(child => {
            if (child.isMesh) {
                child.frustumCulled = false;
                
                // Use MeshBasicMaterial instead of Lambert/Phong for no lighting calculations
                if (child.material && !(child.material instanceof THREE.MeshBasicMaterial)) {
                    const color = child.material.color ? child.material.color.clone() : new THREE.Color(0x4CAF50);
                    child.material = new THREE.MeshBasicMaterial({
                        color: color,
                        map: child.material.map,
                        transparent: true,
                        alphaTest: 0.1,
                        side: THREE.DoubleSide
                    });
                }
                
                // Disable shadow casting/receiving
                child.castShadow = false;
                child.receiveShadow = false;
            }
        });

        // Force a render update
        if (typeof renderer !== 'undefined') {
            renderer.render(scene, camera);
        }

        console.log("Dense grass generation complete");
        return grassContainer;
        
    } catch (e) {
        console.error("Error creating dense grass:", e);
        return null;
    }
}

// Call the function
createDenseGrass();

function hideTextElements() {
    const textElements = [scoreElement, timerElement, instructionsElement];
    textElements.forEach(element => {
        if (element) {
            element.style.display = 'none';
        }
    });
}

// Call this function before taking the screenshot
hideTextElements();

// Function to remove the progress bar and version indicator
function removeUIElements() {
    // Remove progress bar if it exists
    const progressBar = document.querySelector('div[style*="backgroundColor: #4CAF50"]');
    if (progressBar && progressBar.parentElement) {
        progressBar.parentElement.remove();
    }

    // Remove version indicator if it exists
    const versionIndicator = document.querySelector('[data-version-indicator]');
    if (versionIndicator) {
        versionIndicator.remove();
    }
}

// Call this function to remove the elements
removeUIElements();

function removeVersionIndicator() {
    // Find the version indicator by its text content
    const versionIndicators = Array.from(document.querySelectorAll('div')).filter(div => 
        div.textContent.includes('Grass v1.0.1')
    );

    // Remove each found version indicator
    versionIndicators.forEach(indicator => indicator.remove());
}

// Call this function to remove the version indicator
removeVersionIndicator();
