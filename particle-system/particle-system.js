// ===== CONFIGURATION =====
const PARTICLE_COUNT = 8000; // Optimized for 60+ FPS
const MORPH_SPEED = 0.04; // Slower, smoother transitions for kids
const AUTO_SHAPE_DURATION = 8000; // 8 seconds per shape - more time to enjoy each one

// ===== GLOBAL VARIABLES =====
let scene, camera, renderer;
let particles, geometry;
let currentPositions, targetPositions;
let handCursor, handCursorRing;

// Hand Tracking (MediaPipe)
let handDetected = false;
let handX = 0, handY = 0, handZ = 0;
let handRotationX = 0, handRotationY = 0, handRotationZ = 0;
let handSpread = 0; // 0 = closed fist, 1 = open hand
let targetRotationX = 0, targetRotationY = 0, targetRotationZ = 0;

// Shape Management
const SHAPES = ['heart', 'flower', 'saturn', 'fireworks', 'sphere'];
let currentShapeIndex = 0;
let lastShapeChange = 0;
let autoMode = true;

// Performance
let clock = new THREE.Clock();

// ===== INITIALIZATION =====
function init() {
    const container = document.getElementById('canvas-container');
    
    // Scene
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050505, 0.0015);
    
    // Camera
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 2000);
    camera.position.z = 120;
    
    // Renderer - Enable for high performance
    renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: true,
        powerPreference: "high-performance"
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap at 2x for performance
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);
    
    // Create Particles
    createParticles();
    
    // Create Hand Cursor Indicator
    createHandCursor();
    
    // Event Listeners
    window.addEventListener('resize', onWindowResize, false);
    setupControls();
    
    // Start
    initMediaPipe();
    animate();
}

// ===== PARTICLE SYSTEM =====
function createParticles() {
    geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    currentPositions = new Float32Array(PARTICLE_COUNT * 3);
    targetPositions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    
    const color = new THREE.Color();
    
    // Initialize particles in a cloud
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        const x = (Math.random() - 0.5) * 150;
        const y = (Math.random() - 0.5) * 150;
        const z = (Math.random() - 0.5) * 150;
        
        positions[i3] = currentPositions[i3] = x;
        positions[i3 + 1] = currentPositions[i3 + 1] = y;
        positions[i3 + 2] = currentPositions[i3 + 2] = z;
        
        // Rainbow colors
        color.setHSL(i / PARTICLE_COUNT, 0.8, 0.6);
        colors[i3] = color.r;
        colors[i3 + 1] = color.g;
        colors[i3 + 2] = color.b;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({
        size: 1.2,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 0.9,
        sizeAttenuation: true
    });
    
    particles = new THREE.Points(geometry, material);
    scene.add(particles);
    
    // Set initial shape
    calculateTargetShape(SHAPES[0]);
}

// ===== SHAPE GENERATORS =====
function calculateTargetShape(type) {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        let x, y, z;
        
        if (type === 'sphere') {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            const r = 45 + Math.random() * 8;
            x = r * Math.sin(phi) * Math.cos(theta);
            y = r * Math.sin(phi) * Math.sin(theta);
            z = r * Math.cos(phi);
            
        } else if (type === 'heart') {
            const t = Math.random() * Math.PI * 2;
            const scale = 2.5;
            x = 16 * Math.pow(Math.sin(t), 3) * scale;
            y = (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * scale;
            z = (Math.random() - 0.5) * 25;
            
        } else if (type === 'flower') {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            const petals = 6;
            const r = 45 * Math.abs(Math.sin(petals * theta)) * Math.sin(phi) + 15;
            x = r * Math.sin(phi) * Math.cos(theta);
            y = r * Math.sin(phi) * Math.sin(theta);
            z = r * Math.cos(phi);
            
        } else if (type === 'saturn') {
            const rnd = Math.random();
            if (rnd < 0.35) {
                // Planet core
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos((Math.random() * 2) - 1);
                const r = 22;
                x = r * Math.sin(phi) * Math.cos(theta);
                y = r * Math.sin(phi) * Math.sin(theta);
                z = r * Math.cos(phi);
            } else {
                // Rings
                const angle = Math.random() * Math.PI * 2;
                const r = 40 + Math.random() * 30;
                x = r * Math.cos(angle);
                z = r * Math.sin(angle);
                y = (Math.random() - 0.5) * 3;
            }
            
        } else if (type === 'fireworks') {
            // Multiple explosion centers
            const numBursts = 5;
            const burstIndex = Math.floor(Math.random() * numBursts);
            
            // Position burst centers in a sphere
            const burstTheta = (burstIndex / numBursts) * Math.PI * 2;
            const burstPhi = Math.acos((burstIndex / numBursts) * 2 - 1);
            const centerDist = 40;
            
            const centerX = centerDist * Math.sin(burstPhi) * Math.cos(burstTheta);
            const centerY = centerDist * Math.sin(burstPhi) * Math.sin(burstTheta);
            const centerZ = centerDist * Math.cos(burstPhi);
            
            // Particles explode outward from burst center
            const explosionTheta = Math.random() * Math.PI * 2;
            const explosionPhi = Math.acos((Math.random() * 2) - 1);
            const explosionR = Math.random() * 25;
            
            x = centerX + explosionR * Math.sin(explosionPhi) * Math.cos(explosionTheta);
            y = centerY + explosionR * Math.sin(explosionPhi) * Math.sin(explosionTheta);
            z = centerZ + explosionR * Math.cos(explosionPhi);
        }
        
        targetPositions[i3] = x;
        targetPositions[i3 + 1] = y;
        targetPositions[i3 + 2] = z;
    }
}

// ===== HAND CURSOR INDICATOR =====
function createHandCursor() {
    // Outer ring
    const ringGeometry = new THREE.RingGeometry(3, 3.8, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7
    });
    handCursorRing = new THREE.Mesh(ringGeometry, ringMaterial);
    handCursorRing.visible = false;
    scene.add(handCursorRing);
    
    // Inner dot
    const dotGeometry = new THREE.CircleGeometry(0.8, 16);
    const dotMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.9
    });
    handCursor = new THREE.Mesh(dotGeometry, dotMaterial);
    handCursor.visible = false;
    scene.add(handCursor);
}

// ===== MEDIAPIPE HAND TRACKING =====
function initMediaPipe() {
    const videoElement = document.getElementById('video');
    const statusText = document.getElementById('status');
    
    const hands = new Hands({
        locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
    });
    
    hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 0, // 0 = fastest, 1 = balanced
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });
    
    hands.onResults(onHandResults);
    
    const camera = new Camera(videoElement, {
        onFrame: async () => {
            await hands.send({ image: videoElement });
        },
        width: 640,
        height: 480
    });
    
    camera.start()
        .then(() => {
            statusText.innerHTML = "✋ Show your hand to camera!";
            statusText.style.color = "#00ffff";
            videoElement.style.display = "block";
        })
        .catch(err => {
            console.error(err);
            statusText.innerHTML = "❌ Camera access denied - check permissions";
            statusText.style.color = "#ff0055";
        });
}

function onHandResults(results) {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        handDetected = true;
        const landmarks = results.multiHandLandmarks[0];
        
        // Key landmarks
        const wrist = landmarks[0];
        const indexTip = landmarks[8];
        const thumbTip = landmarks[4];
        const middleTip = landmarks[12];
        const pinkyTip = landmarks[20];
        const middleBase = landmarks[9];
        
        // === POSITION (normalized to screen coords) ===
        handX = (indexTip.x - 0.5) * 200;
        handY = -(indexTip.y - 0.5) * 200;
        handZ = indexTip.z * 100;
        
        // === ROTATION (Iron Man style!) ===
        // Calculate hand plane normal using cross product
        
        // Vector from wrist to middle finger base
        const v1x = middleBase.x - wrist.x;
        const v1y = middleBase.y - wrist.y;
        const v1z = middleBase.z - wrist.z;
        
        // Vector from index to pinky
        const v2x = pinkyTip.x - indexTip.x;
        const v2y = pinkyTip.y - indexTip.y;
        const v2z = pinkyTip.z - indexTip.z;
        
        // Cross product = normal to hand plane
        const nx = v1y * v2z - v1z * v2y;
        const ny = v1z * v2x - v1x * v2z;
        const nz = v1x * v2y - v1y * v2x;
        
        // Convert to Euler angles
        handRotationX = Math.atan2(ny, nz);
        handRotationY = Math.atan2(nx, Math.sqrt(ny*ny + nz*nz));
        handRotationZ = Math.atan2(v1y, v1x);
        
        // === HAND SPREAD (open vs closed) ===
        const distances = [
            Math.hypot(indexTip.x - wrist.x, indexTip.y - wrist.y),
            Math.hypot(middleTip.x - wrist.x, middleTip.y - wrist.y),
            Math.hypot(pinkyTip.x - wrist.x, pinkyTip.y - wrist.y)
        ];
        const avgDist = distances.reduce((a, b) => a + b) / distances.length;
        handSpread = Math.min(avgDist * 4, 1); // Normalize to 0-1
        
    } else {
        handDetected = false;
    }
}

// ===== ANIMATION LOOP (HIGH FPS OPTIMIZED) =====
function animate() {
    requestAnimationFrame(animate);
    
    const time = Date.now();
    const positionsAttr = geometry.attributes.position;
    const colorsAttr = geometry.attributes.color;
    
    // Auto-shape cycling
    if (autoMode && time - lastShapeChange > AUTO_SHAPE_DURATION) {
        currentShapeIndex = (currentShapeIndex + 1) % SHAPES.length;
        calculateTargetShape(SHAPES[currentShapeIndex]);
        lastShapeChange = time;
    }
    
    // Update hand cursor and status
    const statusEl = document.getElementById('status');
    if (handDetected) {
        handCursor.position.set(handX, handY, 0);
        handCursorRing.position.set(handX, handY, 0);
        
        handCursor.visible = true;
        handCursorRing.visible = true;
        
        // Pulse effect
        const scale = 1 + Math.sin(time * 0.008) * 0.15;
        handCursorRing.scale.set(scale, scale, 1);
        
        // Rotation indicator - only show when hand is rotating a lot (higher threshold for kids)
        const rotSpeed = Math.abs(handRotationX) + Math.abs(handRotationY) + Math.abs(handRotationZ);
        const isRotating = rotSpeed > 0.5;
        
        // Color & status based on hand state
        let statusText = "";
        if (handSpread > 0.6) {
            handCursorRing.material.color.setHex(0x00ff88); // Bright green = open
            statusText = "✋ OPEN HAND - Expanding!";
            statusEl.style.color = "#00ff88";
        } else {
            handCursorRing.material.color.setHex(0x00ffff); // Cyan = closed
            statusText = "✊ CLOSED HAND - Contracting!";
            statusEl.style.color = "#00ffff";
        }
        
        // Add rotation indicator
        if (isRotating) {
            statusText += " 🔄 ROTATING!";
        }
        
        statusEl.innerHTML = statusText;
        
    } else {
        handCursor.visible = false;
        handCursorRing.visible = false;
        statusEl.innerHTML = "👀 Searching for hand...";
        statusEl.style.color = "#666";
    }
    
    // === IRON MAN ROTATION (Hand rotation controls particle system) ===
    if (handDetected) {
        // Kid-friendly sensitivity - gentle and smooth
        targetRotationX = handRotationX * 2;  
        targetRotationY = -handRotationY * 2;
        targetRotationZ = handRotationZ * 1;
        
        // Slow, smooth response - easier for kids to control
        particles.rotation.x += (targetRotationX - particles.rotation.x) * 0.08;
        particles.rotation.y += (targetRotationY - particles.rotation.y) * 0.08;
        particles.rotation.z += (targetRotationZ - particles.rotation.z) * 0.08;
    } else {
        // Gentle auto-rotation when idle
        particles.rotation.y += 0.002;
        particles.rotation.z += 0.001;
    }
    
    // === PARTICLE MORPHING & EXPANSION ===
    // Gentler expansion for kids - less dramatic, easier to see the effect
    const expansionFactor = handDetected ? (handSpread > 0.6 ? 1.15 : 0.85) : 1.0;
    
    // Optimized loop - batch processing
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        
        // Calculate expanded target position (clamped to prevent escape)
        const targetX = Math.max(-200, Math.min(200, targetPositions[i3] * expansionFactor));
        const targetY = Math.max(-200, Math.min(200, targetPositions[i3 + 1] * expansionFactor));
        const targetZ = Math.max(-200, Math.min(200, targetPositions[i3 + 2] * expansionFactor));
        
        // Lerp to expanded target shape (smooth transition)
        currentPositions[i3] += (targetX - currentPositions[i3]) * MORPH_SPEED;
        currentPositions[i3 + 1] += (targetY - currentPositions[i3 + 1]) * MORPH_SPEED;
        currentPositions[i3 + 2] += (targetZ - currentPositions[i3 + 2]) * MORPH_SPEED;
        
        // Safety bounds check - if particle escapes, reset it
        const dist = Math.sqrt(
            currentPositions[i3] * currentPositions[i3] + 
            currentPositions[i3 + 1] * currentPositions[i3 + 1] + 
            currentPositions[i3 + 2] * currentPositions[i3 + 2]
        );
        if (dist > 250) {
            currentPositions[i3] = targetPositions[i3];
            currentPositions[i3 + 1] = targetPositions[i3 + 1];
            currentPositions[i3 + 2] = targetPositions[i3 + 2];
        }
        
        // Update position
        positionsAttr.setXYZ(i, currentPositions[i3], currentPositions[i3 + 1], currentPositions[i3 + 2]);
        
        // Dynamic colors (only update every other frame for performance boost)
        if (i % 2 === 0 || handDetected) {
            const color = new THREE.Color();
            let hue = (time * 0.0001 + i / PARTICLE_COUNT) % 1;
            if (handDetected && handSpread > 0.6) hue = (hue + 0.4) % 1;
            color.setHSL(hue, 0.85, 0.65);
            colorsAttr.setXYZ(i, color.r, color.g, color.b);
        }
    }
    
    positionsAttr.needsUpdate = true;
    colorsAttr.needsUpdate = true;
    
    renderer.render(scene, camera);
}

// ===== UI CONTROLS =====
function setupControls() {
    // Shape buttons
    document.querySelectorAll('.shape-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.shape-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const shape = btn.dataset.shape;
            currentShapeIndex = SHAPES.indexOf(shape);
            calculateTargetShape(shape);
            lastShapeChange = Date.now();
        });
    });
    
    // Mode buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const mode = btn.dataset.mode;
            autoMode = (mode === 'auto');
            lastShapeChange = Date.now();
        });
    });
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Start!
init();
