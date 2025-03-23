// Import Three.js (Make sure you include Three.js in your HTML)
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.min.js';

// Add this at the beginning of your script to check Three.js version
console.log("Three.js version:", THREE.REVISION);

// Scene setup
const scene = new THREE.Scene();
scene.background = null; // Make background transparent instead of blue sky
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ 
    antialias: true, 
    alpha: true,
    premultipliedAlpha: false // Ensure proper alpha blending
}); 
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.sortObjects = true;
renderer.setClearColor(0x000000, 0); // Set to fully transparent
renderer.setClearAlpha(0); // Explicitly set alpha to 0
document.getElementById('canvas-container').appendChild(renderer.domElement);

// Configure canvas for better touch events
const canvas = renderer.domElement;
canvas.style.touchAction = 'none'; // Disable browser touch actions
canvas.addEventListener('touchstart', function(e) {
    e.preventDefault(); // Prevent default touch behavior
}, { passive: false });

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
scoreElement.style.color = '#00008B'; // Dark blue
scoreElement.style.fontSize = '24px';
scoreElement.style.fontWeight = 'bold';
scoreElement.style.textShadow = '1px 1px 2px rgba(255, 255, 255, 0.7)'; // Add white shadow for better visibility
scoreElement.style.zIndex = '5'; // Higher z-index to appear in front of clouds and canvas
document.body.appendChild(scoreElement);

const timerElement = document.createElement('div');
timerElement.style.position = 'absolute';
timerElement.style.top = '20px';
timerElement.style.right = '20px';
timerElement.style.color = '#00008B'; // Dark blue
timerElement.style.fontSize = '24px';
timerElement.style.fontWeight = 'bold';
timerElement.style.textShadow = '1px 1px 2px rgba(255, 255, 255, 0.7)'; // Add white shadow for better visibility
timerElement.style.zIndex = '5'; // Higher z-index to appear in front of clouds and canvas
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
instructionsElement.style.zIndex = '5'; // Higher z-index to appear in front of clouds
instructionsElement.innerHTML = 'Hit the mole when you see a word with the short "a" sound!<br>Click anywhere to start';
document.body.appendChild(instructionsElement);

// Adjust the camera position
camera.position.set(0, 10, 12); // Move the camera up
camera.lookAt(0, 0, 0);

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
        side: THREE.DoubleSide,
        transparent: true, // Enable transparency
        opacity: 0, // Fully transparent
        depthWrite: false // Prevent z-fighting with other objects
    });
    
    const terrain = new THREE.Mesh(geometry, material);
    terrain.rotation.x = Math.PI / 2;
    terrain.position.y = -0.1;
    
    return terrain;
}

// Function to create clouds
function createCloud() {
    const group = new THREE.Group();
    
    // Create simple white spheres - smaller size (0.8 instead of 1)
    const sphereGeometry = new THREE.SphereGeometry(0.8, 16, 16);
    const material = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
    
    // Main sphere
    const mainSphere = new THREE.Mesh(sphereGeometry, material);
    // Scale down the main sphere slightly
    mainSphere.scale.set(0.9, 0.9, 0.9);
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
        // Make additional spheres smaller (0.6, 0.4, 0.6 instead of 0.7, 0.5, 0.7)
        sphere.scale.set(0.6, 0.4, 0.6);
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
        color: 0x404040,  // Dark gray
        transparent: true, // Enable transparency
        opacity: 0, // Fully transparent
        depthWrite: false // Prevent z-fighting with moles
    });

    // Adjust the Z values to move holes more toward the bottom edge of the screen
    // Increasing Z values moves the holes further down/away from the camera
    const holes = [
        { x: -1.5, z: -1.5, rotation: Math.PI * 0.25 + 0.175, description: "back Left" },     // Moved up by decreasing Z
        { x: 2.2, z: -1.5, rotation: -Math.PI * 0.25 - 0.175, description: "back Right" },     // Moved up by decreasing Z
        { x: -2.3, z: 1.5, rotation: Math.PI * 0.75 + 0.175, description: "front Left" },       // Moved toward center by decreasing Z
        { x: 2.2, z: 2.0, rotation: -Math.PI * 0.75 - 0.175, description: "front Right" }        // Moved back to original position
    ];

    // Store hole positions for reference when positioning the decorative overlay
    window.holePositions = [];

    holes.forEach(pos => {
        console.log(`Creating hole at ${pos.description}`);

        // Create hole
        const hole = new THREE.Mesh(holeGeometry, holeMaterial);
        hole.rotation.x = -Math.PI / 2;
        hole.position.set(pos.x * 1.5, 0.01, pos.z * 1.5);
        scene.add(hole);
        
        // Store hole position for overlay alignment
        window.holePositions.push({
            x: pos.x * 1.5,
            y: 0.01,
            z: pos.z * 1.5,
            description: pos.description
        });

        // Create mole
        const mole = createMole();
        mole.position.set(pos.x * 1.5, -1.8, pos.z * 1.5); // Match the "down" position in animateMole
        mole.visible = false; // Initialize moles as invisible since they're down
        
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
        mole.userData.holePosition = { x: pos.x * 1.5, y: 0.01, z: pos.z * 1.5 }; // Store hole reference
        scene.add(mole);
        moles.push(mole);
    });
    
    // Position the decorative overlay
    setTimeout(positionDecorativeOverlay, 500);
}

// Function to position the decorative overlay based on hole positions
function positionDecorativeOverlay() {
    if (!window.holePositions || window.holePositions.length === 0) {
        console.log('No hole positions available');
        return;
    }
    
    // Get screen coordinates of holes
    const holeScreenPositions = window.holePositions.map(pos => {
        const vector = new THREE.Vector3(pos.x, pos.y, pos.z);
        vector.project(camera);
        
        return {
            x: (vector.x * 0.5 + 0.5) * window.innerWidth,
            y: -(vector.y * 0.5 - 0.5) * window.innerHeight,
            description: pos.description
        };
    });
    
    console.log('Hole screen positions:', holeScreenPositions);
    
    // Position the markers in the overlay to match hole positions
    const markers = document.querySelectorAll('.hole-marker');
    
    // Different hole sizes
    const standardHoleSize = 300; // Standard size for most holes
    const largeHoleSize =380;    // Larger size for bottom right hole
    
    holeScreenPositions.forEach((pos, index) => {
        if (markers[index]) {
            // Convert to percentages for responsive positioning
            // Apply offset to center the larger holes under the grass holes
            let posX = pos.x;
            let posY = pos.y;
            let holeSize;
            
            // Special handling for bottom right hole (index 3)
            if (index === 3) {
                posX += 15; // Shift right to move toward the bottom right corner
                posY = pos.y + 25; // Shift down to better cover the blue sky
                holeSize = largeHoleSize;
            } else {
                posY = pos.y;
                holeSize = standardHoleSize;
            }
            
            // Calculate offsets based on the specific hole size
            const offsetX = holeSize / 2;
            const offsetY = holeSize / 2;
            
            const percentX = ((posX - offsetX) / window.innerWidth) * 100;
            const percentY = ((posY - offsetY) / window.innerHeight) * 100;
            
            markers[index].style.left = percentX + '%';
            markers[index].style.top = percentY + '%';
            
            // Add subtle color variations to each dirt hole for realism
            // Create slightly different brown shades for each hole
            const brownBase = [155, 118, 83]; // Lighter brown color - #9b7653 in RGB
            const randomOffset = [
                Math.floor(Math.random() * 10) - 5,
                Math.floor(Math.random() * 8) - 4,
                Math.floor(Math.random() * 6) - 3
            ];
            
            const randomBrown = [
                Math.max(140, Math.min(170, brownBase[0] + randomOffset[0])),
                Math.max(100, Math.min(130, brownBase[1] + randomOffset[1])),
                Math.max(70, Math.min(100, brownBase[2] + randomOffset[2]))
            ];
            
            markers[index].style.backgroundColor = `rgb(${randomBrown[0]}, ${randomBrown[1]}, ${randomBrown[2]})`;
        }
    });
}

// Call positionDecorativeOverlay on load to ensure dirt holes are visible
window.addEventListener('load', function() {
    setTimeout(positionDecorativeOverlay, 500);
});

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

// Modified click and touch handler - completely revamped touch handling
window.addEventListener('click', function(event) {
    handleInteraction(event, 'click');
});

// Replace all touch event handlers with a clean implementation
window.removeEventListener('touchstart', handleInteraction);
window.removeEventListener('touchend', preventDefaultTouch);
window.removeEventListener('touchmove', preventDefaultTouch);

// Clean event attachment with explicit type
window.addEventListener('touchstart', function(event) {
    event.preventDefault();
    handleInteraction(event, 'touch');
}, { passive: false });

// Clean up function that's no longer needed
// function preventDefaultTouch(event) {
//     event.preventDefault();
//     event.stopPropagation();
// }

// Global touch tracking to prevent phantom clicks
const touchState = {
    lastTouchTime: 0,
    touchLock: false,
    processingTouch: false,
    activeMoleIds: new Set(), // Track which moles are currently being interacted with
    clearTouchState: function() {
        this.touchLock = false;
        this.processingTouch = false;
        this.activeMoleIds.clear();
        console.log('Touch state cleared');
    }
};

// Completely revised interaction handler with explicit type handling
function handleInteraction(event, eventType) {
    const now = Date.now();
    
    console.log(`${eventType} event detected at time ${now}`);
    
    // If we're in the middle of processing a touch, ignore additional events
    if (touchState.processingTouch) {
        console.log('Ignoring event during active touch processing');
        return;
    }
    
    // Set a hard lock to prevent multiple touch events from stacking
    if (eventType === 'touch') {
        // Prevent rapid touches - enforce a minimum interval between touch events
        if (now - touchState.lastTouchTime < 500) {
            console.log('Touch too soon after previous touch, ignoring');
            return;
        }
        
        touchState.lastTouchTime = now;
        touchState.processingTouch = true;
        
        // Schedule touch state cleanup
        setTimeout(() => {
            touchState.processingTouch = false;
        }, 300); // Allow touch processing for 300ms
    }
    
    // Game start handling
    if (!gameActive) {
        startGame();
        instructionsElement.style.display = 'none';
        
        // Clear any lingering touch state
        touchState.clearTouchState();
        return;
    }
    
    // Get the coordinates (handling both mouse and touch)
    let clientX, clientY;
    
    if (eventType === 'touch') {
        // Get the first touch point
        const touch = event.touches[0];
        clientX = touch.clientX;
        clientY = touch.clientY;
        console.log('Touch coordinates:', clientX, clientY);
    } else {
        // Regular mouse event
        clientX = event.clientX;
        clientY = event.clientY;
    }
    
    // Convert to normalized device coordinates (-1 to +1)
    const mouse = new THREE.Vector2(
        (clientX / window.innerWidth) * 2 - 1,
        -(clientY / window.innerHeight) * 2 + 1
    );
    
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    
    // Find the active (visible, up, not moving) moles
    const activeMoles = moles.filter(mole => 
        mole.visible && 
        mole.userData.isUp && 
        !mole.userData.isMoving && 
        !touchState.activeMoleIds.has(mole.userData.moleId)
    );
    
    if (activeMoles.length === 0) {
        console.log('No active moles to interact with');
        return;
    }
    
    console.log(`Found ${activeMoles.length} active moles`);
    
    // Create a collection of all meshes in the active moles for raycasting
    const moleObjects = [];
    activeMoles.forEach(mole => {
        // Use a unique ID for each mole to track interactions
        if (!mole.userData.moleId) {
            mole.userData.moleId = `mole-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        }
        
        mole.traverse(object => {
            if (object.isMesh) {
                object.userData.parentMole = mole;
                moleObjects.push(object);
            }
        });
    });
    
    // Find intersections with mole objects
    let hitMole = null;
    const intersects = raycaster.intersectObjects(moleObjects, false);
    
    if (intersects.length > 0) {
        hitMole = intersects[0].object.userData.parentMole;
        console.log('Direct hit on mole:', hitMole.userData.moleId);
    } else if (eventType === 'touch') {
        // For touch events, use proximity detection as a fallback
        hitMole = findClosestMoleByProximity(activeMoles, clientX, clientY);
        
        if (hitMole) {
            console.log('Proximity hit on mole:', hitMole.userData.moleId);
        }
    }
    
    // If we hit a mole, process the hit
    if (hitMole) {
        // Add to the set of active mole IDs to prevent double-hits
        touchState.activeMoleIds.add(hitMole.userData.moleId);
        
        // Mark as moving to prevent further interaction
        hitMole.userData.isMoving = true;
        
        // Process score based on whether it's a short "a" word
        if (isShortAWord) {
            score += 10;
            createSuccessIndicator(hitMole.position.clone().add(new THREE.Vector3(0, 1, 0)));
        } else {
            score = Math.max(0, score - 5);
        }
        
        updateUI();
        
        // Schedule the mole to hide with a slight delay
        const moleId = hitMole.userData.moleId;
        console.log(`Scheduling mole ${moleId} to hide`);
        
        setTimeout(() => {
            // Make sure this mole still exists and is still up
            const moleStillExists = moles.some(m => 
                m.userData.moleId === moleId && 
                m.userData.isUp && 
                !m.userData.isHiding
            );
            
            if (moleStillExists) {
                console.log(`Hiding mole ${moleId} after hit`);
                const targetMole = moles.find(m => m.userData.moleId === moleId);
                if (targetMole) {
                    // Mark this mole as being processed for hiding
                    targetMole.userData.isHiding = true;
                    animateMole(targetMole, false);
                }
            }
        }, 100);
    }
}

// Helper function to find the closest mole by proximity (for touch events)
function findClosestMoleByProximity(activeMoles, clientX, clientY) {
    let closestMole = null;
    let closestDistance = Infinity;
    const proximityThreshold = 200; // Larger threshold for iPad
    
    activeMoles.forEach(mole => {
        // Convert mole's 3D position to screen coordinates
        const molePos = new THREE.Vector3(
            mole.position.x,
            mole.position.y,
            mole.position.z
        );
        molePos.project(camera);
        
        // Calculate screen position
        const moleScreenX = (molePos.x + 1) * window.innerWidth / 2;
        const moleScreenY = (-molePos.y + 1) * window.innerHeight / 2;
        
        // Calculate distance to touch point
        const distance = Math.sqrt(
            Math.pow(moleScreenX - clientX, 2) + 
            Math.pow(moleScreenY - clientY, 2)
        );
        
        console.log(`Mole at (${moleScreenX},${moleScreenY}) distance: ${distance}`);
        
        if (distance < proximityThreshold && distance < closestDistance) {
            closestDistance = distance;
            closestMole = mole;
        }
    });
    
    return closestMole;
}

// Completely revised animateMole function to properly handle mole state
function animateMole(mole, goingUp) {
    // Skip if already in the target state or already moving
    if ((goingUp && mole.userData.isUp) || 
        (!goingUp && !mole.userData.isUp) || 
        mole.userData.isMoving) {
        console.log(`Skipping animation for mole - already in target state or moving`);
        return;
    }
    
    // Ensure we have a unique ID for this mole
    if (!mole.userData.moleId) {
        mole.userData.moleId = `mole-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    }
    
    console.log(`${goingUp ? 'Raising' : 'Lowering'} mole ${mole.userData.moleId}`);
    
    // Lock the mole during animation
    mole.userData.isMoving = true;
    
    // Reset hiding flag when starting animation
    mole.userData.isHiding = false;
    
    // Animation parameters
    const targetY = goingUp ? 0.7 : -1.8;
    const startY = mole.position.y;
    const duration = 200; // milliseconds
    const startTime = Date.now();
    
    // Prepare mole for animation
    if (goingUp) {
        // Make visible immediately when raising
        mole.visible = true;
        // Assign a word for the mole to display
        assignNewWord(mole);
    } else {
        // Clear text when hiding the mole
        updateMoleText(mole, '');
        // Remove from active moles set to allow new interactions
        if (mole.userData.moleId) {
            touchState.activeMoleIds.delete(mole.userData.moleId);
        }
    }
    
    // Animation function
    function update() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth motion
        const ease = progress < 0.5 
            ? 2 * progress * progress 
            : -1 + (4 - 2 * progress) * progress;
            
        // Update position
        mole.position.y = startY + (targetY - startY) * ease;
        
        if (progress < 1) {
            // Continue animation
            requestAnimationFrame(update);
        } else {
            // Animation complete
            mole.userData.isMoving = false;
            mole.userData.isUp = goingUp;
            
            if (!goingUp) {
                // Hide completely when down
                mole.visible = false;
                
                // Reset all interaction flags
                mole.userData.isHiding = false;
                touchState.activeMoleIds.delete(mole.userData.moleId);
                
                console.log(`Mole ${mole.userData.moleId} is now hidden and reset`);
            } else {
                console.log(`Mole ${mole.userData.moleId} is now up and ready`);
            }
        }
    }
    
    // Start animation
    update();
}

// Completely revised gameLoop function to prevent multiple moles
function gameLoop() {
    if (!gameActive) return;
    
    // Count how many moles are currently up or moving
    const activeMoleCount = moles.filter(mole => 
        mole.userData.isUp || mole.userData.isMoving
    ).length;
    
    console.log(`Game loop: ${activeMoleCount} active moles`);
    
    // Only pop up a new mole if there are none active (stricter limit)
    if (activeMoleCount === 0) {
        // Get moles that are available (down and not moving)
        const availableMoles = moles.filter(mole => 
            !mole.userData.isUp && !mole.userData.isMoving
        );
        
        if (availableMoles.length > 0) {
            // Pick a random mole
            const randomMole = availableMoles[Math.floor(Math.random() * availableMoles.length)];
            
            // Reset all state for the mole
            randomMole.userData.isHiding = false;
            
            // Generate a new unique ID for this appearance
            randomMole.userData.moleId = `mole-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
            
            // Pop up the mole
            console.log(`Popping up mole ${randomMole.userData.moleId}`);
            animateMole(randomMole, true);
            
            // Set a timer to automatically hide the mole if not clicked
            setTimeout(() => {
                // Check if the mole is still up and hasn't been hit
                if (randomMole.userData.isUp && 
                    !randomMole.userData.isMoving && 
                    !randomMole.userData.isHiding) {
                    
                    console.log(`Auto-hiding mole ${randomMole.userData.moleId} after timeout`);
                    randomMole.userData.isHiding = true;
                    animateMole(randomMole, false);
                }
            }, 1800); // Give a bit more time than before
        }
    }
    
    // Always clear touch state at each game loop iteration
    touchState.clearTouchState();
    
    // Schedule next iteration with a random delay
    // More variability than before (1.5-3 seconds)
    const nextDelay = 1500 + Math.random() * 1500;
    setTimeout(gameLoop, nextDelay);
}

// Completely revised startGame function
function startGame() {
    score = 0;
    timeRemaining = 30;
    gameActive = true;
    
    // Reset global touch state
    touchState.clearTouchState();
    touchState.lastTouchTime = 0;
    
    console.log('=== STARTING NEW GAME ===');
    
    // Complete reset of all moles
    moles.forEach((mole, index) => {
        // Reset state
        mole.visible = false;
        mole.position.y = -1.8;
        mole.userData.isUp = false;
        mole.userData.isMoving = false;
        mole.userData.isHiding = false;
        
        // Generate a new unique ID
        mole.userData.moleId = `mole-init-${index}-${Date.now()}`;
        
        // Clear any text
        if (mole.userData.textContext) {
            updateMoleText(mole, '');
        }
        
        console.log(`Reset mole ${index} with ID ${mole.userData.moleId}`);
    });
    
    // Update the UI
    updateUI();
    
    // Delay game start slightly
    setTimeout(() => {
        gameLoop();
    }, 800);
    
    // Set up game timer
    const gameTimer = setInterval(() => {
        timeRemaining--;
        updateUI();
        
        if (timeRemaining <= 0) {
            // End the game
            gameActive = false;
            clearInterval(gameTimer);
            
            // Hide all moles
            moles.forEach(mole => {
                if (mole.userData.isUp && !mole.userData.isMoving) {
                    mole.userData.isHiding = true;
                    animateMole(mole, false);
                }
            });
            
            // Final cleanup
            setTimeout(() => {
                moles.forEach(mole => {
                    mole.visible = false;
                    mole.userData.isUp = false;
                    mole.userData.isMoving = false;
                    mole.userData.isHiding = false;
                });
                
                // Reset touch state completely
                touchState.clearTouchState();
                touchState.lastTouchTime = 0;
                
                console.log('=== GAME OVER ===');
                
                // Show game over message
                instructionsElement.innerHTML = `Game Over! Final Score: ${score}<br>Click or touch anywhere to play again`;
                instructionsElement.style.display = 'block';
            }, 500);
        }
    }, 1000);
}

function updateUI() {
    scoreElement.textContent = `Score: ${score}`;
    timerElement.textContent = `Time: ${timeRemaining}s`;
    
    // Ensure styling is maintained
    scoreElement.style.color = '#00008B'; // Dark blue
    scoreElement.style.fontWeight = 'bold';
    scoreElement.style.textShadow = '1px 1px 2px rgba(255, 255, 255, 0.7)';
    scoreElement.style.zIndex = '5'; // Maintain higher z-index
    
    timerElement.style.color = '#00008B'; // Dark blue
    timerElement.style.fontWeight = 'bold';
    timerElement.style.textShadow = '1px 1px 2px rgba(255, 255, 255, 0.7)';
    timerElement.style.zIndex = '5'; // Maintain higher z-index
}

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
        "%c Version: yellow" + versionNumber + " | Loaded: " + versionTimestamp + " %c",
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
    versionIndicator.style.zIndex = '5'; // Higher z-index to appear in front of clouds
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

// Handle window resize to reposition overlay markers
window.addEventListener('resize', function() {
    positionDecorativeOverlay();
});
