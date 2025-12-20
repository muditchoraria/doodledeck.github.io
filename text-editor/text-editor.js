// Initialize default values
let currentColors = [];
let currentFontSize = 2; // Initial font size in em
const fonts = [
    "'Gloria Hallelujah', cursive",
    "'Comic Neue', cursive",
    "'Indie Flower', cursive",
    "'Fredoka One', cursive",
    "'Pacifico', cursive",
    "'Chewy', cursive",
    "'Bubblegum Sans', cursive"
];
let currentFontIndex = 0;
let trailColor = 'gold'; // Initial trail color

// Event listener for the DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
    setPalette('rainbow'); // Default palette

    const editor = document.getElementById('editor');
    const controls = document.getElementById('controls');

    // Delegate events for buttons using switch
    controls.addEventListener('click', (event) => {
        const button = event.target.closest('button');
        if (!button) return; // Ignore clicks outside of buttons

        const action = button.dataset.action;

        switch (action) {
            case 'increase-font':
                increaseFontSize();
                break;
            case 'decrease-font':
                decreaseFontSize();
                break;
            case 'toggle-font':
                toggleFont();
                break;
            case 'set-palette':
                const palette = button.dataset.palette;
                setPalette(palette);
                break;
            default:
                console.warn('Unknown action:', action);
        }
    });

    // Event listeners for editor input and keypress
    editor.addEventListener('input', handleInput);
    editor.addEventListener('keypress', playTypingSound);
    document.addEventListener('mousemove', createTrail);
});

// Remaining functions (handleInput, playTypingSound, setPalette, etc.) go here...

// OPTIMIZED: Function to handle input in the editor with proper caret position
function handleInput(event) {
    const editor = document.getElementById('editor');
    const selection = window.getSelection();
    
    // Save caret position before modifying
    let caretPos = 0;
    let node = selection.anchorNode;
    
    if (node && editor.contains(node)) {
        // Calculate position within the editor
        const range = selection.getRangeAt(0);
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(editor);
        preCaretRange.setEnd(range.endContainer, range.endOffset);
        caretPos = preCaretRange.toString().length;
    }
    
    const content = editor.innerText;
    
    // Only rebuild if content actually changed
    if (content === editor.dataset.lastContent) {
        return;
    }
    
    editor.dataset.lastContent = content;
    editor.innerHTML = '';
    
    // Create colored spans for each character
    for (let i = 0; i < content.length; i++) {
        const span = document.createElement('span');
        span.style.color = currentColors[i % currentColors.length];
        span.textContent = content[i];
        editor.appendChild(span);
    }
    
    // Restore caret position accurately
    if (caretPos > 0 && editor.childNodes.length > 0) {
        try {
            let currentPos = 0;
            let targetNode = null;
            let targetOffset = 0;
            
            for (let i = 0; i < editor.childNodes.length; i++) {
                const node = editor.childNodes[i];
                const nodeLength = node.textContent.length;
                
                if (currentPos + nodeLength >= caretPos) {
                    targetNode = node.firstChild || node;
                    targetOffset = caretPos - currentPos;
                    break;
                }
                currentPos += nodeLength;
            }
            
            if (targetNode) {
                const newRange = document.createRange();
                newRange.setStart(targetNode, Math.min(targetOffset, targetNode.length || 0));
                newRange.collapse(true);
                selection.removeAllRanges();
                selection.addRange(newRange);
            }
        } catch (e) {
            // Fallback: place caret at end
            console.warn('Caret position restoration failed:', e);
        }
    }
}

// Function to play typing sound
function playTypingSound(event) {
    const typingSound = document.getElementById('typingSound');
    typingSound.currentTime = 0; // Reset sound
    typingSound.play().catch(error => {
        console.error('Error playing typing sound:', error);
    });
}

// Function to set color palette
function setPalette(palette) {
    const paletteSound = document.getElementById('paletteSound');
    const editor = document.getElementById('editor');
    const topHeader = document.getElementById('top-header');

    // Remove all possible palette classes
    editor.classList.remove('rainbow', 'sunset', 'neon', 'jungle', 'galaxy');

    switch (palette) {
        case 'rainbow':
            currentColors = generateRainbowColors();
            editor.classList.add('rainbow');
            editor.style.backgroundColor = '#2c3e50';
            editor.style.color = '#ffffff';
            // Change the body background gradient for rainbow theme
            document.body.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            trailColor = '#00BFFF80';
            triggerBubbleEffect();
            break;
        case 'sunset':
            currentColors = generateSunsetColors();
            editor.classList.add('sunset');
            editor.style.backgroundColor = '#3d2817';
            editor.style.color = '#FFF5E1';
            // Sunset orange/pink background
            document.body.style.background = 'linear-gradient(135deg, #ff9966 0%, #ff5e62 100%)';
            trailColor = '#FF6347';
            triggerSunsetEffect();
            break;
        case 'neon':
            currentColors = generateNeonColors();
            editor.classList.add('neon');
            editor.style.backgroundColor = '#1a1a1a';
            editor.style.color = '#00FFFF';
            // Change to dark/black background for neon
            document.body.style.background = 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)';
            trailColor = '#FFFFFF';
            triggerStarEffect();
            break;
        case 'jungle':
            currentColors = generateJungleColors();
            editor.classList.add('jungle');
            editor.style.backgroundColor = '#1e3a1e';
            editor.style.color = '#F0FFF0';
            // Vibrant green jungle background
            document.body.style.background = 'linear-gradient(135deg, #134e13 0%, #238b45 50%, #41ab5d 100%)';
            trailColor = '#90EE90';
            triggerJungleEffect();
            break;
        case 'galaxy':
            currentColors = generateGalaxyColors();
            editor.classList.add('galaxy');
            editor.style.backgroundColor = '#0a0a2e';
            editor.style.color = '#E6E6FA';
            // Deep space purple/blue background
            document.body.style.background = 'linear-gradient(135deg, #141e30 0%, #243b55 100%)';
            trailColor = '#9370DB';
            triggerStarEffect();
            break;
        default:
            currentColors = generateRainbowColors();
            editor.classList.add('rainbow');
            editor.style.backgroundColor = '#34495e';
            editor.style.color = '#ffffff';
            document.body.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            trailColor = '#DAA520';
    }

    paletteSound.currentTime = 0;
    paletteSound.play().catch(error => {
        console.error('Error playing palette sound:', error);
    });

    handleInput();
}

// Function to increase font size
function increaseFontSize() {
    currentFontSize += 0.5;
    const editor = document.getElementById('editor');
    editor.style.fontSize = `${currentFontSize}em`;
}

// Function to decrease font size
function decreaseFontSize() {
    currentFontSize = Math.max(0.5, currentFontSize - 0.5);
    const editor = document.getElementById('editor');
    editor.style.fontSize = `${currentFontSize}em`;
}

// Function to toggle font family
function toggleFont() {
    currentFontIndex = (currentFontIndex + 1) % fonts.length;
    const editor = document.getElementById('editor');
    editor.style.fontFamily = fonts[currentFontIndex];
}

// Function to generate rainbow colors
function generateRainbowColors() {
    return [
        '#FF0000', '#FF4500', '#FF8C00', '#FFD700', '#ADFF2F',
        '#00FF00', '#00CED1', '#1E90FF', '#0000FF', '#8A2BE2',
        '#9400D3', '#FF1493', '#DC143C', '#B22222', '#FF6347',
        '#FFA500', '#32CD32', '#00FFFF', '#4169E1', '#8B00FF'
    ];
}

// Function to generate neon colors
function generateNeonColors() {
    return [
        '#FF6EC7', '#FFD700', '#7FFF00', '#00FF7F', '#00FFFF',
        '#1E90FF', '#FF1493', '#FF4500', '#FF6347', '#32CD32',
        '#FF6EC7', '#FFD700', '#7FFF00', '#00FF7F', '#00FFFF',
        '#1E90FF', '#FF1493', '#FF4500', '#FF6347'
    ];
}

// Function to generate jungle colors (greens, browns, earthy tones)
function generateJungleColors() {
    return [
        '#228B22', '#32CD32', '#90EE90', '#98FB98', '#00FF00',
        '#ADFF2F', '#7FFF00', '#7CFC00', '#00FA9A', '#00FF7F',
        '#3CB371', '#2E8B57', '#8FBC8F', '#66CDAA', '#20B2AA',
        '#556B2F', '#6B8E23', '#808000', '#9ACD32', '#BDB76B'
    ];
}

// Function to generate sunset colors (oranges, pinks, purples, golds)
function generateSunsetColors() {
    return [
        '#FF6347', '#FF7F50', '#FF8C00', '#FFA500', '#FFB347',
        '#FFD700', '#FFDB58', '#FF69B4', '#FF1493', '#DB7093',
        '#C71585', '#DA70D6', '#EE82EE', '#DDA0DD', '#BA55D3',
        '#9370DB', '#8B008B', '#FF4500', '#FF6B6B', '#FFB6C1'
    ];
}

// Function to generate galaxy colors (purples, blues, starry)
function generateGalaxyColors() {
    return [
        '#9370DB', '#8B7EC8', '#7B68EE', '#6A5ACD', '#6959CD',
        '#836FFF', '#7A67EE', '#6C7B8B', '#483D8B', '#191970',
        '#8470FF', '#7B68EE', '#9370DB', '#BA55D3', '#9932CC',
        '#8B008B', '#9400D3', '#9966CC', '#8A2BE2', '#A020F0'
    ];
}

// Function to create mouse trail effect
function createTrail(event) {
    const trail = document.createElement('div');
    trail.className = 'trail';
    trail.style.backgroundColor = trailColor;
    document.body.appendChild(trail);
    trail.style.left = `${event.clientX}px`;
    trail.style.top = `${event.clientY}px`;

    // Remove trail after 500ms
    setTimeout(() => {
        trail.remove();
    }, 500);
}

// OPTIMIZED: Trigger bubble effect with rainbow colors (reduced count)
function triggerBubbleEffect() {
    const rainbowColors = [
        '#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', 
        '#4B0082', '#9400D3', '#FF1493', '#00CED1', '#FF6347'
    ];
    
    // Reduced from 25 to 15 for better performance
    for (let i = 0; i < 15; i++) {
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        const randomColor = rainbowColors[Math.floor(Math.random() * rainbowColors.length)];
        bubble.style.backgroundColor = randomColor;
        bubble.style.opacity = Math.random() * 0.5 + 0.5;
        bubble.style.width = `${Math.random() * 50 + 30}px`;
        bubble.style.height = bubble.style.width;
        bubble.style.left = `${Math.random() * window.innerWidth}px`;
        bubble.style.bottom = '0px';
        bubble.style.willChange = 'transform, opacity';
        document.body.appendChild(bubble);

        // Reduced duration from 5000ms to 4000ms
        setTimeout(() => {
            bubble.remove();
        }, 4000);
    }
}

// OPTIMIZED: Trigger leaf effect (reduced count)
function triggerLeafEffect() {
    // Reduced from 30 to 20 for better performance
    for (let i = 0; i < 20; i++) {
        const leaf = document.createElement('div');
        leaf.className = 'leaf';
        leaf.style.width = `${Math.random() * 15 + 10}px`;
        leaf.style.height = leaf.style.width;
        leaf.style.left = `${Math.random() * window.innerWidth}px`;
        leaf.style.top = `-${Math.random() * 50}px`;
        leaf.style.willChange = 'transform, opacity';
        document.body.appendChild(leaf);

        // Reduced duration from 6000ms to 5000ms
        setTimeout(() => {
            leaf.remove();
        }, 5000);
    }
}

// OPTIMIZED: Trigger star effect (reduced count)
function triggerStarEffect() {
    // Reduced from 25 to 18 for better performance
    for (let i = 0; i < 18; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = `${Math.random() * window.innerWidth}px`;
        star.style.top = `-${Math.random() * 50}px`;
        star.style.willChange = 'transform, opacity';
        document.body.appendChild(star);

        // Reduced duration from 4000ms to 3500ms
        setTimeout(() => {
            star.remove();
        }, 3500);
    }
}

// Function to trigger jungle effect with animals (spread out across time)
function triggerJungleEffect() {
    const animals = ['🦁', '🐯', '🐵', '🦜', '🦋', '🐍', '🦎', '🐸', '🦗', '🐢'];
    
    for (let i = 0; i < 15; i++) {
        // Delay each animal spawn to spread them out
        setTimeout(() => {
            const animal = document.createElement('div');
            animal.className = 'jungle-animal';
            animal.textContent = animals[Math.floor(Math.random() * animals.length)];
            animal.style.fontSize = `${Math.random() * 40 + 25}px`;
            animal.style.left = `${Math.random() * window.innerWidth}px`;
            animal.style.top = `-${Math.random() * 100}px`;
            document.body.appendChild(animal);

            // Remove animal after 10000ms
            setTimeout(() => {
                animal.remove();
            }, 10000);
        }, i * 300); // Spawn each animal 300ms apart
    }
}

// OPTIMIZED: Trigger sunset effect with warm glowing particles
function triggerSunsetEffect() {
    const colors = ['#FF6347', '#FF8C00', '#FFD700', '#FF69B4', '#FFA500'];
    
    // Reduced from 30 to 20 for better performance
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'sunset-particle';
        particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        particle.style.width = `${Math.random() * 20 + 10}px`;
        particle.style.height = particle.style.width;
        particle.style.left = `${Math.random() * window.innerWidth}px`;
        particle.style.top = `-${Math.random() * 50}px`;
        particle.style.boxShadow = `0 0 20px ${colors[Math.floor(Math.random() * colors.length)]}`;
        particle.style.willChange = 'transform, opacity';
        document.body.appendChild(particle);

        // Reduced duration from 7000ms to 6000ms
        setTimeout(() => {
            particle.remove();
        }, 6000);
    }
}
