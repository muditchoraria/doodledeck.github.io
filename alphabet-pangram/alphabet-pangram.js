// ===== PANGRAM DATA =====
const pangrams = [
    {
        id: 'fox',
        title: 'The Classic Fox',
        text: 'The quick brown fox jumps over the lazy dog',
        icon: '🦊',
        theme: 'theme-fox',
        difficulty: 3,
        colors: ['#2d6a4f', '#52b788', '#ff6b35']
    },
    {
        id: 'wizard',
        title: "Wizard's Quest",
        text: 'The five boxing wizards jump quickly',
        icon: '🧙',
        theme: 'theme-wizard',
        difficulty: 2,
        colors: ['#7209b7', '#9d4edd', '#c77dff']
    },
    {
        id: 'frog',
        title: 'Crazy Frog',
        text: 'Crazy Fredrick bought many very exquisite opal jewels',
        icon: '🐸',
        theme: 'theme-frog',
        difficulty: 3,
        colors: ['#118ab2', '#06d6a0', '#4cc9f0']
    },
    {
        id: 'pack',
        title: 'Pack Journey',
        text: 'Pack my box with five dozen liquor jugs',
        icon: '🎒',
        theme: 'theme-pack',
        difficulty: 2,
        colors: ['#d62828', '#f77f00', '#fcbf49']
    },
    {
        id: 'sphinx',
        title: 'Sphinx Riddle',
        text: 'Sphinx of black quartz, judge my vow',
        icon: '🗿',
        theme: 'theme-sphinx',
        difficulty: 2,
        colors: ['#e85d04', '#faa307', '#ffd60a']
    },
    {
        id: 'waltz',
        title: 'Waltz Dream',
        text: 'The jay, pig, fox, zebra and my wolves quack',
        icon: '💃',
        theme: 'theme-waltz',
        difficulty: 2,
        colors: ['#ff6b9d', '#ff85a2', '#ffa5c0']
    },
    {
        id: 'jackdaws',
        title: 'Jackdaws Love',
        text: 'Jackdaws love my big sphinx of quartz',
        icon: '🐦',
        theme: 'theme-jackdaws',
        difficulty: 2,
        colors: ['#4361ee', '#4895ef', '#4cc9f0']
    }
];

// ===== GAME STATE =====
let currentPangram = null;
let foundLetters = new Set();
let letterElements = [];
let isWritingMode = false;

// ===== AUDIO =====
const letterSound = document.getElementById('letterSound');
const completeSound = document.getElementById('completeSound');
const celebrationSound = document.getElementById('celebrationSound');

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    initializeRoulette();
    setupEventListeners();
});

// ===== ROULETTE FUNCTIONS =====
function initializeRoulette() {
    const rouletteWheel = document.getElementById('rouletteWheel');
    rouletteWheel.innerHTML = '';

    pangrams.forEach((pangram, index) => {
        const card = createPangramCard(pangram, index);
        rouletteWheel.appendChild(card);
    });
}

function createPangramCard(pangram, index) {
    const card = document.createElement('div');
    card.className = 'pangram-card';
    card.dataset.pangramId = pangram.id;
    card.style.animationDelay = `${index * 0.1}s`;
    card.style.setProperty('--card-color-1', pangram.colors[0]);
    card.style.setProperty('--card-color-2', pangram.colors[1]);

    const stars = '⭐'.repeat(pangram.difficulty);

    card.innerHTML = `
        <span class="card-icon">${pangram.icon}</span>
        <h3 class="card-title">${pangram.title}</h3>
        <p class="card-preview">${pangram.text.substring(0, 30)}...</p>
        <div class="card-difficulty">${stars}</div>
    `;

    card.addEventListener('click', () => selectPangram(pangram));

    return card;
}

function selectPangram(pangram) {
    currentPangram = pangram;
    startGame();
}

function showRouletteForRandom() {
    // Hide start screen
    document.getElementById('startScreen').classList.add('hidden');
    const rouletteWheel = document.getElementById('rouletteWheel');
    rouletteWheel.classList.remove('hidden');
    
    // Create carousel container
    const carouselContainer = document.createElement('div');
    carouselContainer.className = 'carousel-container';
    carouselContainer.id = 'carouselContainer';
    
    const carouselTrack = document.createElement('div');
    carouselTrack.className = 'carousel-track';
    carouselTrack.id = 'carouselTrack';
    
    // Duplicate pangrams multiple times for continuous scroll effect
    const multiplier = 5;
    for (let i = 0; i < multiplier; i++) {
        pangrams.forEach((pangram, index) => {
            const card = createPangramCard(pangram, index);
            card.style.animationDelay = '0s'; // Remove stagger for carousel
            // Ensure the dataset is set correctly
            card.dataset.pangramId = pangram.id;
            carouselTrack.appendChild(card);
        });
    }
    
    carouselContainer.appendChild(carouselTrack);
    rouletteWheel.innerHTML = '';
    rouletteWheel.appendChild(carouselContainer);
    
    // Start spinning animation
    let scrollPosition = 0;
    const exactCardHeight = 226; // card height (210px) + gap (16px)
    const spinSpeed = 20; // pixels per frame
    let animationFrame;
    let spinning = true;
    
    function spin() {
        if (!spinning) return;
        
        scrollPosition += spinSpeed;
        
        // Reset position for infinite scroll
        const totalHeight = exactCardHeight * pangrams.length;
        if (scrollPosition >= totalHeight) {
            scrollPosition = scrollPosition % totalHeight;
        }
        
        carouselTrack.style.transform = `translateY(-${scrollPosition}px)`;
        animationFrame = requestAnimationFrame(spin);
    }
    
    // Start spinning
    spin();
    
    // After 2 seconds, slow down and select
    setTimeout(() => {
        spinning = false;
        cancelAnimationFrame(animationFrame);
        
        // Pick a random card index from the middle set of duplicates
        const randomIndex = Math.floor(Math.random() * pangrams.length);
        
        // Calculate exact position to center selected card
        // Container height is 500px, so center is at 250px
        // Each card is ~210px tall + 16px gap = 226px per card
        const exactCardHeight = 226;
        
        // Position the selected card exactly in the center
        // We use the middle set of cards (multiplier 2) for smooth positioning
        const cardIndexInTrack = randomIndex + (pangrams.length * 2);
        const targetPosition = (cardIndexInTrack * exactCardHeight) - 250 + (exactCardHeight / 2);
        
        carouselTrack.classList.add('slowing');
        carouselTrack.style.transform = `translateY(-${targetPosition}px)`;
        
        // Store which pangram we want to show (from the random index)
        const targetPangram = pangrams[randomIndex];
        
        // After slow-down animation completes, wait a bit to show selection, then start game
        setTimeout(() => {
            // Get all cards
            const allCards = carouselTrack.querySelectorAll('.pangram-card');
            
            // Find which card is VISUALLY in the center by checking their positions
            const containerCenter = 250; // Container is 500px tall, center is at 250px
            let actualCenterCard = null;
            let minDistance = Infinity;
            
            allCards.forEach((card, idx) => {
                const rect = card.getBoundingClientRect();
                const carouselRect = carouselContainer.getBoundingClientRect();
                const cardCenter = rect.top - carouselRect.top + (rect.height / 2);
                const distance = Math.abs(cardCenter - containerCenter);
                
                if (distance < minDistance) {
                    minDistance = distance;
                    actualCenterCard = card;
                }
            });
            
            // Use the ACTUAL centered card
            if (actualCenterCard) {
                // Highlight the ACTUAL centered card
                actualCenterCard.style.transform = 'scale(1.05)';
                actualCenterCard.style.boxShadow = '0 20px 60px rgba(139, 92, 246, 0.6)';
                actualCenterCard.style.border = '4px solid #8b5cf6';
                
                // Get pangram from the ACTUAL centered card
                const actualPangramId = actualCenterCard.dataset.pangramId;
                const actualPangram = pangrams.find(p => p.id === actualPangramId);
                
                // Use the ACTUAL pangram that's visually centered
                setTimeout(() => {
                    if (actualPangram) {
                        selectPangram(actualPangram);
                    }
                }, 1500);
            }
        }, 2500);
    }, 2000);
}

function showRouletteForManual() {
    // Hide start screen, show roulette for manual selection
    document.getElementById('startScreen').classList.add('hidden');
    const rouletteWheel = document.getElementById('rouletteWheel');
    rouletteWheel.classList.remove('hidden');
    rouletteWheel.classList.add('show-all');
}

// ===== GAME FUNCTIONS =====
function startGame() {
    if (!currentPangram) return;

    // Reset state
    foundLetters.clear();
    letterElements = [];

    // Switch screens
    document.getElementById('rouletteScreen').classList.add('hidden');
    document.getElementById('gameScreen').classList.remove('hidden');
    document.getElementById('celebrationScreen').classList.add('hidden');

    // Apply theme
    document.body.className = currentPangram.theme;

    // Set theme badge
    document.getElementById('themeBadge').textContent = `${currentPangram.icon} ${currentPangram.title}`;

    // Display pangram
    displayPangram();

    // Create alphabet progress
    createAlphabetProgress();

    // Create keyboard
    createKeyboard();
    
    // Update mode display
    updateModeDisplay();
}

function displayPangram() {
    const pangramDisplay = document.getElementById('pangramDisplay');
    pangramDisplay.innerHTML = '';

    const text = currentPangram.text;
    letterElements = [];

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const span = document.createElement('span');
        
        if (char === ' ') {
            span.className = 'letter space';
            span.innerHTML = '&nbsp;';
        } else if (/[a-zA-Z]/.test(char)) {
            span.className = 'letter';
            span.textContent = char;
            span.dataset.letter = char.toUpperCase();
            letterElements.push(span);
        } else {
            span.className = 'letter punctuation';
            span.textContent = char;
        }

        pangramDisplay.appendChild(span);
    }
}

function createAlphabetProgress() {
    const progressContainer = document.getElementById('alphabetProgress');
    progressContainer.innerHTML = '';

    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    
    for (const letter of alphabet) {
        const letterDiv = document.createElement('div');
        letterDiv.className = 'progress-letter';
        letterDiv.textContent = letter;
        letterDiv.dataset.letter = letter;
        progressContainer.appendChild(letterDiv);
    }
}

function createKeyboard() {
    const keyboardContainer = document.getElementById('keyboard');
    keyboardContainer.innerHTML = '';

    const rows = [
        'QWERTYUIOP',
        'ASDFGHJKL',
        'ZXCVBNM'
    ];

    rows.forEach(row => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'keyboard-row';

        for (const letter of row) {
            const button = document.createElement('button');
            button.className = 'key-button';
            button.textContent = letter;
            button.dataset.letter = letter;
            button.addEventListener('click', () => handleLetterInput(letter));
            rowDiv.appendChild(button);
        }

        keyboardContainer.appendChild(rowDiv);
    });
}

function handleLetterInput(letter) {
    letter = letter.toUpperCase();

    // Check if letter exists in pangram
    const matchingLetters = letterElements.filter(el => el.dataset.letter === letter);
    
    if (matchingLetters.length === 0) {
        // Letter not in pangram - shake effect
        shakeKeyboard();
        return;
    }

    // Mark letter as found
    if (!foundLetters.has(letter)) {
        foundLetters.add(letter);
        
        // Play sound
        playSound(letterSound);

        // Animate all matching letters
        matchingLetters.forEach(el => {
            el.classList.add('glowing');
        });

        // Update progress
        updateProgress(letter);

        // Animate key
        animateKey(letter);

        // Check if game is complete
        checkCompletion();
    } else {
        // Already found - just animate
        matchingLetters.forEach(el => {
            el.classList.remove('glowing');
            setTimeout(() => el.classList.add('glowing'), 10);
        });
        animateKey(letter);
    }
}

function updateProgress(letter) {
    const progressLetter = document.querySelector(`.progress-letter[data-letter="${letter}"]`);
    if (progressLetter) {
        progressLetter.classList.add('found');
        playSound(completeSound);
    }
}

function animateKey(letter) {
    const keyButton = document.querySelector(`.key-button[data-letter="${letter}"]`);
    if (keyButton) {
        keyButton.classList.add('pressed');
        setTimeout(() => keyButton.classList.remove('pressed'), 300);
    }
}

function shakeKeyboard() {
    const keyboard = document.getElementById('keyboard');
    keyboard.style.animation = 'shake 0.3s ease';
    setTimeout(() => {
        keyboard.style.animation = '';
    }, 300);
}

function checkCompletion() {
    // Check if all 26 letters have been found
    if (foundLetters.size === 26) {
        setTimeout(() => {
            showCelebration();
        }, 500);
    }
}

function showCelebration() {
    playSound(celebrationSound);
    
    const celebrationScreen = document.getElementById('celebrationScreen');
    celebrationScreen.classList.remove('hidden');

    // Create confetti
    createConfetti();
}

function createConfetti() {
    const container = document.getElementById('confettiContainer');
    container.innerHTML = '';

    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#ffd93d', '#95e1d3', '#f38181', '#a8e6cf'];
    
    for (let i = 0; i < 100; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = `${Math.random() * 100}%`;
        confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = `${Math.random() * 3}s`;
        confetti.style.animationDuration = `${2 + Math.random() * 3}s`;
        container.appendChild(confetti);
    }
}

function resetGame() {
    foundLetters.clear();
    letterElements.forEach(el => el.classList.remove('glowing'));
    
    // Reset progress
    document.querySelectorAll('.progress-letter').forEach(el => {
        el.classList.remove('found');
    });
}

function goBackToRoulette() {
    document.getElementById('gameScreen').classList.add('hidden');
    document.getElementById('celebrationScreen').classList.add('hidden');
    document.getElementById('rouletteScreen').classList.remove('hidden');
    
    // Reset to start screen
    document.getElementById('startScreen').classList.remove('hidden');
    document.getElementById('rouletteWheel').classList.add('hidden');
    
    currentPangram = null;
    foundLetters.clear();
    isWritingMode = false;
}

// ===== MODE SWITCHING =====
function toggleMode(mode) {
    isWritingMode = (mode === 'writing');
    
    // Update button states
    document.getElementById('typingMode').classList.toggle('active', !isWritingMode);
    document.getElementById('writingMode').classList.toggle('active', isWritingMode);
    
    // Update display
    updateModeDisplay();
}

function updateModeDisplay() {
    const keyboard = document.getElementById('keyboard');
    const pangramDisplay = document.getElementById('pangramDisplay');
    
    if (isWritingMode) {
        // Hide keyboard in writing mode
        keyboard.style.display = 'none';
        
        // Add writing instructions
        let instructionsDiv = document.getElementById('writingInstructions');
        if (!instructionsDiv) {
            instructionsDiv = document.createElement('div');
            instructionsDiv.id = 'writingInstructions';
            instructionsDiv.className = 'writing-instructions';
            instructionsDiv.innerHTML = `
                <h3>✍️ Writing Mode</h3>
                <p><span class="instruction-emoji">📝</span> Write the letters on paper as you practice!</p>
                <p><span class="instruction-emoji">⌨️</span> Type each letter after you write it to light it up</p>
                <p><span class="instruction-emoji">🌟</span> Try to write neatly and take your time</p>
            `;
            pangramDisplay.parentNode.insertBefore(instructionsDiv, pangramDisplay.nextSibling);
        }
        instructionsDiv.style.display = 'block';
    } else {
        // Show keyboard in typing mode
        keyboard.style.display = 'block';
        
        // Hide writing instructions
        const instructionsDiv = document.getElementById('writingInstructions');
        if (instructionsDiv) {
            instructionsDiv.style.display = 'none';
        }
    }
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    // Choice buttons
    document.getElementById('randomButton').addEventListener('click', showRouletteForRandom);
    document.getElementById('chooseButton').addEventListener('click', showRouletteForManual);

    // Back button
    document.getElementById('backButton').addEventListener('click', goBackToRoulette);

    // Reset button
    document.getElementById('resetButton').addEventListener('click', resetGame);
    
    // Mode toggle buttons
    document.getElementById('typingMode').addEventListener('click', () => toggleMode('typing'));
    document.getElementById('writingMode').addEventListener('click', () => toggleMode('writing'));

    // Celebration buttons
    document.getElementById('tryAgainButton').addEventListener('click', () => {
        document.getElementById('celebrationScreen').classList.add('hidden');
        resetGame();
    });

    document.getElementById('newPangramButton').addEventListener('click', () => {
        goBackToRoulette();
    });

    // Physical keyboard support
    document.addEventListener('keydown', (e) => {
        if (currentPangram && !document.getElementById('gameScreen').classList.contains('hidden')) {
            const key = e.key.toUpperCase();
            if (/^[A-Z]$/.test(key)) {
                handleLetterInput(key);
            }
        }
    });
}

// ===== UTILITY FUNCTIONS =====
function playSound(audioElement) {
    if (audioElement) {
        audioElement.currentTime = 0;
        audioElement.play().catch(e => console.log('Audio play failed:', e));
    }
}

// Add shake animation to CSS dynamically if not present
if (!document.styleSheets[0].cssRules.toString().includes('shake')) {
    const styleSheet = document.styleSheets[0];
    styleSheet.insertRule(`
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-10px); }
            75% { transform: translateX(10px); }
        }
    `, styleSheet.cssRules.length);
}

