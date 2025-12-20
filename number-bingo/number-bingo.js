// ===== GAME STATE =====
let currentRange = { min: 1, max: 20 };
let completedNumbers = new Set();
let allNumbers = [];
let isAutoMode = false;
let autoTimer = null;
let autoTimeLeft = 3;
let currentNumber = null;
let isNumberDisplaying = false;
let isPaused = false;

// ===== NUMBER TO WORD CONVERSION =====
const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

function numberToWords(num) {
    if (num === 0) return 'zero';
    if (num < 10) return ones[num];
    if (num < 20) return teens[num - 10];
    if (num < 100) {
        const ten = Math.floor(num / 10);
        const one = num % 10;
        return tens[ten] + (one ? ' ' + ones[one] : '');
    }
    if (num < 1000) {
        const hundred = Math.floor(num / 100);
        const remainder = num % 100;
        return ones[hundred] + ' hundred' + (remainder ? ' ' + numberToWords(remainder) : '');
    }
    return num.toString();
}

// ===== AUDIO =====
const numberSound = document.getElementById('numberSound');
const celebrationSound = document.getElementById('celebrationSound');
const completeSound = document.getElementById('completeSound');

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    setupRangeSelection();
    setupEventListeners();
});

// ===== RANGE SELECTION =====
function setupRangeSelection() {
    const rangeCards = document.querySelectorAll('.range-card');
    rangeCards.forEach(card => {
        card.addEventListener('click', () => {
            const min = parseInt(card.dataset.min);
            const max = parseInt(card.dataset.max);
            selectPresetRange(min, max);
        });
    });
}

function selectPresetRange(min, max) {
    if (validateRange(min, max)) {
        startGame(min, max);
    }
}

function selectCustomRange() {
    const min = parseInt(document.getElementById('minNumber').value);
    const max = parseInt(document.getElementById('maxNumber').value);
    
    if (!validateRange(min, max)) {
        showError('Please enter a valid range (1-999, max 100 numbers)');
        return;
    }
    
    startGame(min, max);
}

function validateRange(min, max) {
    if (isNaN(min) || isNaN(max)) return false;
    if (min >= max) return false;
    if (max - min + 1 > 100) return false;
    if (min < 1 || max > 999) return false;
    return true;
}

function showError(message) {
    const errorMsg = document.getElementById('errorMessage');
    errorMsg.textContent = message;
    errorMsg.classList.remove('hidden');
    setTimeout(() => {
        errorMsg.classList.add('hidden');
    }, 3000);
}

// ===== GAME START =====
function startGame(min, max) {
    currentRange = { min, max };
    completedNumbers.clear();
    allNumbers = [];
    
    // Generate array of all numbers in range
    for (let i = min; i <= max; i++) {
        allNumbers.push(i);
    }
    
    // Switch screens
    document.getElementById('rangeScreen').classList.add('hidden');
    document.getElementById('gameScreen').classList.remove('hidden');
    document.getElementById('celebrationScreen').classList.add('hidden');
    
    // Initialize game components
    createGrid(min, max);
    createCarousel(min, max);
    updateProgress();
}

// ===== GRID CREATION =====
function createGrid(min, max) {
    const grid = document.getElementById('housieGrid');
    grid.innerHTML = '';
    
    const count = max - min + 1;
    const cols = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);
    
    grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    
    for (let i = min; i <= max; i++) {
        const cell = document.createElement('div');
        cell.className = 'number-cell';
        cell.textContent = i;
        cell.dataset.number = i;
        grid.appendChild(cell);
    }
}

// ===== CAROUSEL CREATION =====
function createCarousel(min, max) {
    const track = document.getElementById('carouselTrack');
    track.innerHTML = '';
    
    // Duplicate numbers multiple times for infinite scroll
    const multiplier = 10;
    for (let i = 0; i < multiplier; i++) {
        for (let num = min; num <= max; num++) {
            const numberDiv = document.createElement('div');
            numberDiv.className = 'carousel-number';
            numberDiv.textContent = num;
            numberDiv.dataset.number = num;
            track.appendChild(numberDiv);
        }
    }
}

// ===== CAROUSEL SPINNING =====
function spinCarousel() {
    if (isNumberDisplaying) return;
    
    // Get uncompleted numbers
    const availableNumbers = allNumbers.filter(n => !completedNumbers.has(n));
    
    if (availableNumbers.length === 0) {
        // All numbers complete!
        showCompletionCelebration();
        return;
    }
    
    // Select random uncompleted number
    const selectedNumber = availableNumbers[Math.floor(Math.random() * availableNumbers.length)];
    
    const carouselContainer = document.getElementById('carouselContainer');
    const carouselTrack = document.getElementById('carouselTrack');
    
    // Reset track position
    carouselTrack.style.transition = 'none';
    carouselTrack.style.transform = 'translateY(0)';
    
    // Start spinning animation
    let scrollPosition = 0;
    const numberHeight = 100.5; // height + gap
    const spinSpeed = 40; // Increased from 25 to 40 for faster spin
    let animationFrame;
    let spinning = true;
    
    function spin() {
        if (!spinning) return;
        scrollPosition += spinSpeed;
        carouselTrack.style.transform = `translateY(-${scrollPosition}px)`;
        animationFrame = requestAnimationFrame(spin);
    }
    
    spin();
    
    // After 1.5 seconds, slow down and select (reduced from 2s for faster spin)
    setTimeout(() => {
        spinning = false;
        cancelAnimationFrame(animationFrame);
        
        // Calculate position to center selected number
        const numbersInRange = currentRange.max - currentRange.min + 1;
        const selectedIndex = selectedNumber - currentRange.min;
        
        // Position in middle set of duplicates (multiplier 5)
        const targetIndex = selectedIndex + (numbersInRange * 5);
        const targetPosition = (targetIndex * numberHeight) - 200;
        
        carouselTrack.classList.add('slowing');
        carouselTrack.style.transform = `translateY(-${targetPosition}px)`;
        
        // After slow-down, use visual detection to find actual centered number
        setTimeout(() => {
            carouselTrack.classList.remove('slowing');
            
            // Get all number elements
            const allNumbers = carouselTrack.querySelectorAll('.carousel-number');
            
            // Find which UNCOMPLETED number is VISUALLY in the center
            const containerCenter = 250; // Container is 500px tall, center is at 250px
            let actualCenterNumber = null;
            let minDistance = Infinity;
            
            allNumbers.forEach((numEl) => {
                const num = parseInt(numEl.dataset.number);
                
                // SKIP completed numbers - only consider uncompleted ones
                if (completedNumbers.has(num)) {
                    return;
                }
                
                const rect = numEl.getBoundingClientRect();
                const carouselRect = carouselContainer.getBoundingClientRect();
                const numCenter = rect.top - carouselRect.top + (rect.height / 2);
                const distance = Math.abs(numCenter - containerCenter);
                
                if (distance < minDistance) {
                    minDistance = distance;
                    actualCenterNumber = numEl;
                }
            });
            
            // Use the ACTUAL visually centered UNCOMPLETED number
            if (actualCenterNumber) {
                const actualNumber = parseInt(actualCenterNumber.dataset.number);
                
                // Highlight the actual centered number
                actualCenterNumber.style.transform = 'scale(1.1)';
                actualCenterNumber.style.background = 'rgba(255, 215, 0, 0.3)';
                
                // Wait a moment to show selection, then start game
                setTimeout(() => {
                    selectNumber(actualNumber);
                }, 500);
            }
        }, 2500);
    }, 1500);
}

// ===== NUMBER SELECTION =====
function selectNumber(num) {
    if (completedNumbers.has(num)) return;
    
    currentNumber = num;
    isNumberDisplaying = true;
    
    // Highlight current cell
    const cells = document.querySelectorAll('.number-cell');
    cells.forEach(cell => {
        if (parseInt(cell.dataset.number) === num) {
            cell.classList.add('current');
        }
    });
    
    // Display number
    displayNumber(num);
}

// ===== NUMBER DISPLAY =====
function displayNumber(num) {
    const numberDisplay = document.getElementById('numberDisplay');
    const numberValue = document.getElementById('numberValue');
    const numberWord = document.getElementById('numberWord');
    
    numberValue.textContent = num;
    numberWord.textContent = numberToWords(num).toUpperCase();
    
    numberDisplay.classList.remove('hidden');
    
    // Speak number
    setTimeout(() => {
        speakNumber(num);
    }, 500);
    
    // Show fireworks
    setTimeout(() => {
        showFireworks();
    }, 800);
}

// ===== AUDIO PRONUNCIATION =====
function speakNumber(num) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(num.toString());
        utterance.rate = 0.9;
        utterance.pitch = 1.2;
        utterance.lang = 'en-US';
        window.speechSynthesis.speak(utterance);
    }
}

// ===== FIREWORKS =====
function showFireworks() {
    const container = document.getElementById('fireworksContainer');
    container.innerHTML = '';
    
    const colors = [
        getComputedStyle(document.documentElement).getPropertyValue('--firework-color-1'),
        getComputedStyle(document.documentElement).getPropertyValue('--firework-color-2'),
        getComputedStyle(document.documentElement).getPropertyValue('--firework-color-3')
    ];
    
    for (let i = 0; i < 3; i++) {
        setTimeout(() => {
            createFirework(container, colors);
        }, i * 300);
    }
    
    playSound(completeSound);
}

function createFirework(container, colors) {
    const centerX = container.offsetWidth / 2;
    const centerY = container.offsetHeight / 3;
    
    for (let i = 0; i < 30; i++) {
        const firework = document.createElement('div');
        firework.className = 'firework';
        
        const angle = (Math.PI * 2 * i) / 30;
        const velocity = 50 + Math.random() * 50;
        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity;
        
        firework.style.left = centerX + 'px';
        firework.style.top = centerY + 'px';
        firework.style.setProperty('--tx', tx + 'px');
        firework.style.setProperty('--ty', ty + 'px');
        firework.style.background = colors[Math.floor(Math.random() * colors.length)];
        
        container.appendChild(firework);
        
        setTimeout(() => {
            firework.remove();
        }, 1000);
    }
}

// ===== CONFIRM NUMBER =====
function confirmNumber() {
    if (currentNumber === null) return;
    
    // Mark as complete
    completedNumbers.add(currentNumber);
    
    // Update cell
    const cells = document.querySelectorAll('.number-cell');
    cells.forEach(cell => {
        const cellNum = parseInt(cell.dataset.number);
        if (cellNum === currentNumber) {
            cell.classList.remove('current');
            cell.classList.add('completed');
        }
    });
    
    // Hide number display
    document.getElementById('numberDisplay').classList.add('hidden');
    document.getElementById('fireworksContainer').innerHTML = '';
    
    // Update progress
    updateProgress();
    
    // Mini celebration
    playSound(completeSound);
    
    // Reset state
    currentNumber = null;
    isNumberDisplaying = false;
    
    // Check if all complete
    if (completedNumbers.size === allNumbers.length) {
        setTimeout(() => {
            showCompletionCelebration();
        }, 500);
    } else if (isAutoMode && !isPaused) {
        // Continue auto mode
        startAutoTimer();
    }
}

// ===== PROGRESS TRACKING =====
function updateProgress() {
    const total = allNumbers.length;
    const completed = completedNumbers.size;
    const percentage = (completed / total) * 100;
    
    document.querySelector('.progress-text').textContent = `${completed}/${total}`;
    document.getElementById('progressBarFill').style.width = percentage + '%';
}

// ===== AUTO MODE =====
function startAutoMode() {
    isAutoMode = true;
    isPaused = false;
    
    document.getElementById('manualMode').classList.remove('active');
    document.getElementById('autoMode').classList.add('active');
    document.getElementById('spinButton').classList.add('hidden');
    document.getElementById('autoTimer').classList.remove('hidden');
    
    if (!isNumberDisplaying) {
        startAutoTimer();
    }
}

function startAutoTimer() {
    autoTimeLeft = 3; // Changed from 5 to 3 seconds
    updateTimerDisplay();
    
    autoTimer = setInterval(() => {
        if (isPaused) return;
        
        autoTimeLeft--;
        updateTimerDisplay();
        
        if (autoTimeLeft <= 0) {
            clearInterval(autoTimer);
            spinCarousel();
        }
    }, 1000);
}

function updateTimerDisplay() {
    document.getElementById('timerText').textContent = autoTimeLeft;
    const circumference = 2 * Math.PI * 45;
    const progress = (autoTimeLeft / 3) * circumference; // Changed from 5 to 3
    document.getElementById('timerProgress').style.strokeDashoffset = circumference - progress;
}

function togglePause() {
    isPaused = !isPaused;
    const pauseButton = document.getElementById('pauseButton');
    pauseButton.textContent = isPaused ? '▶️' : '⏸️';
}

function startManualMode() {
    isAutoMode = false;
    isPaused = false;
    
    if (autoTimer) {
        clearInterval(autoTimer);
        autoTimer = null;
    }
    
    document.getElementById('autoMode').classList.remove('active');
    document.getElementById('manualMode').classList.add('active');
    document.getElementById('autoTimer').classList.add('hidden');
    document.getElementById('spinButton').classList.remove('hidden');
}

// ===== THEME SWITCHING =====
function switchTheme(themeName) {
    document.body.className = `theme-${themeName}`;
    document.getElementById('themeDropdown').classList.add('hidden');
}

function toggleThemeDropdown() {
    const dropdown = document.getElementById('themeDropdown');
    dropdown.classList.toggle('hidden');
}

// ===== CELEBRATIONS =====
function showCompletionCelebration() {
    // Stop auto mode
    if (autoTimer) {
        clearInterval(autoTimer);
    }
    
    playSound(celebrationSound);
    
    const message = document.getElementById('celebrationMessage');
    const total = allNumbers.length;
    message.textContent = `You learned all ${total} numbers!`;
    
    document.getElementById('celebrationScreen').classList.remove('hidden');
    
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

function tryAgain() {
    completedNumbers.clear();
    currentNumber = null;
    isNumberDisplaying = false;
    
    document.getElementById('celebrationScreen').classList.add('hidden');
    document.getElementById('gameScreen').classList.remove('hidden');
    
    createGrid(currentRange.min, currentRange.max);
    createCarousel(currentRange.min, currentRange.max);
    updateProgress();
    
    if (isAutoMode) {
        startAutoTimer();
    }
}

function goBackToRange() {
    // Stop auto mode
    if (autoTimer) {
        clearInterval(autoTimer);
    }
    
    isAutoMode = false;
    isPaused = false;
    completedNumbers.clear();
    currentNumber = null;
    isNumberDisplaying = false;
    
    document.getElementById('gameScreen').classList.add('hidden');
    document.getElementById('celebrationScreen').classList.add('hidden');
    document.getElementById('rangeScreen').classList.remove('hidden');
    
    // Reset to manual mode
    startManualMode();
}

// ===== UTILITY FUNCTIONS =====
function playSound(audioElement) {
    if (audioElement) {
        audioElement.currentTime = 0;
        audioElement.play().catch(e => console.log('Audio play failed:', e));
    }
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    // Custom range button
    document.getElementById('startCustomButton').addEventListener('click', selectCustomRange);
    
    // Back button
    document.getElementById('backButton').addEventListener('click', goBackToRange);
    
    // Theme switcher
    document.getElementById('themeSwitcher').addEventListener('click', toggleThemeDropdown);
    
    // Theme options
    document.querySelectorAll('.theme-option').forEach(option => {
        option.addEventListener('click', () => {
            switchTheme(option.dataset.theme);
        });
    });
    
    // Mode toggle
    document.getElementById('manualMode').addEventListener('click', startManualMode);
    document.getElementById('autoMode').addEventListener('click', startAutoMode);
    
    // Spin button
    document.getElementById('spinButton').addEventListener('click', spinCarousel);
    
    // Pause button
    document.getElementById('pauseButton').addEventListener('click', togglePause);
    
    // Confirm button
    document.getElementById('confirmButton').addEventListener('click', confirmNumber);
    
    // Celebration buttons
    document.getElementById('tryAgainButton').addEventListener('click', tryAgain);
    document.getElementById('newRangeButton').addEventListener('click', goBackToRange);
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('themeDropdown');
        const switcher = document.getElementById('themeSwitcher');
        if (!dropdown.contains(e.target) && !switcher.contains(e.target)) {
            dropdown.classList.add('hidden');
        }
    });
    
    // Enter key on custom range inputs
    document.getElementById('maxNumber').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            selectCustomRange();
        }
    });
}

