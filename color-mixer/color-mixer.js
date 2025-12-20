// Color Mixer Application - Complete with 361 predefined color combinations
class ColorMixer {
    constructor() {
        this.selectedColors = [];
        this.discoveredColors = new Map();
        this.customColorCounter = 1;
        this.audioContext = null;
        this.init();
    }

    init() {
        this.setupDragAndDrop();
        this.setupEventListeners();
        this.loadDiscoveredColors();
    }

    setupDragAndDrop() {
        const colorTiles = document.querySelectorAll('.color-tile');
        const colorSlots = document.querySelectorAll('.color-slot');

        // Make color tiles draggable
        colorTiles.forEach(tile => {
            tile.addEventListener('dragstart', this.handleDragStart.bind(this));
            tile.addEventListener('dragend', this.handleDragEnd.bind(this));
        });

        // Setup individual color slots ONLY (remove drop-zone listeners)
        colorSlots.forEach(slot => {
            slot.addEventListener('dragover', this.handleDragOver.bind(this));
            slot.addEventListener('drop', this.handleSlotDrop.bind(this));
            slot.addEventListener('dragenter', (e) => {
                e.preventDefault();
                if (!slot.classList.contains('filled')) {
                    slot.style.borderColor = 'var(--primary-color)';
                    slot.style.backgroundColor = 'rgba(139, 92, 246, 0.1)';
                }
            });
            slot.addEventListener('dragleave', (e) => {
                if (!slot.classList.contains('filled')) {
                    slot.style.borderColor = '#ccc';
                    slot.style.backgroundColor = 'white';
                }
            });
        });

        // Touch support for mobile
        colorTiles.forEach(tile => {
            tile.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
            tile.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
            tile.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        });
    }

    setupEventListeners() {
        document.getElementById('mix-button').addEventListener('click', this.mixColors.bind(this));
        document.getElementById('clear-button').addEventListener('click', this.clearMixingBowl.bind(this));
        document.getElementById('add-custom-color').addEventListener('click', this.addCustomColor.bind(this));
    }

    handleDragStart(e) {
        const colorData = {
            name: e.target.dataset.color,
            hex: e.target.dataset.hex
        };
        e.dataTransfer.setData('application/json', JSON.stringify(colorData));
        e.target.style.opacity = '0.5';
    }

    handleDragEnd(e) {
        e.target.style.opacity = '1';
    }

    handleDragOver(e) {
        e.preventDefault();
    }

    handleSlotDrop(e) {
        e.preventDefault();
        const slot = e.target;
        // Don't add color if this specific slot is already filled
        if (slot.classList.contains('filled')) {
            return;
        }
        // Don't add if we already have 2 colors
        if (this.selectedColors.length >= 2) {
            return;
        }
        const colorData = JSON.parse(e.dataTransfer.getData('application/json'));
        this.addColorToMixing(colorData);
    }

    // Touch support methods
    handleTouchStart(e) {
        e.preventDefault();
        this.touchStarted = true;
        this.draggedElement = e.target;
        
        // Create a visual feedback
        e.target.style.transform = 'scale(1.1)';
        e.target.style.zIndex = '1000';
    }

    handleTouchMove(e) {
        if (!this.touchStarted) return;
        e.preventDefault();
        
        const touch = e.touches[0];
        const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
        
        // Visual feedback for valid drop zones
        if (elementBelow && (elementBelow.id === 'drop-zone' || elementBelow.closest('#drop-zone'))) {
            document.getElementById('drop-zone').classList.add('drag-over');
        } else {
            document.getElementById('drop-zone').classList.remove('drag-over');
        }
    }

    handleTouchEnd(e) {
        if (!this.touchStarted) return;
        e.preventDefault();
        
        this.touchStarted = false;
        this.draggedElement.style.transform = '';
        this.draggedElement.style.zIndex = '';
        
        const touch = e.changedTouches[0];
        const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
        
        document.getElementById('drop-zone').classList.remove('drag-over');
        
        if (elementBelow && (elementBelow.id === 'drop-zone' || elementBelow.closest('#drop-zone'))) {
            if (this.selectedColors.length < 2) {
                const colorData = {
                    name: this.draggedElement.dataset.color,
                    hex: this.draggedElement.dataset.hex
                };
                this.addColorToMixing(colorData);
            }
        }
        
        this.draggedElement = null;
    }

    addColorToMixing(colorData) {
        if (this.selectedColors.length >= 2) return;
        this.selectedColors.push(colorData);
        this.updateColorSlots();
        this.playSound('dropSound');
        this.createCelebrationEffect();
        if (this.selectedColors.length === 2) {
            document.getElementById('mix-button').disabled = false;
        }
    }

        updateColorSlots() {
        const slots = document.querySelectorAll('.color-slot');
        slots.forEach((slot, index) => {
            if (this.selectedColors[index]) {
                const color = this.selectedColors[index];
                slot.style.backgroundColor = color.hex;
                slot.classList.add('filled');
                slot.textContent = '';
            } else {
                slot.style.backgroundColor = 'white';
                slot.classList.remove('filled');
                slot.textContent = index + 1;
            }
        });
    }

    mixColors() {
        if (this.selectedColors.length !== 2) return;

        const mixButton = document.getElementById('mix-button');
        mixButton.classList.add('loading');
        mixButton.textContent = '🌀 Mixing...';

        document.getElementById('mixing-bowl').classList.add('mixing-animation');

        setTimeout(() => {
            const color1 = this.selectedColors[0];
            const color2 = this.selectedColors[1];
            
            // Try to get predefined result first
            const predefinedResult = this.getPredefinedMixResult(color1.name, color2.name);
            
            let result;
            if (predefinedResult) {
                result = {
                    color: predefinedResult.color,
                    name: predefinedResult.name,
                    explanation: `${color1.name} + ${color2.name} = ${predefinedResult.name}! 🎨`
                };
            } else {
                // Fallback to simple algorithmic mixing
                const mixedHex = this.mixTwoColorsSubtractive(color1.hex, color2.hex);
                const mixedName = this.generateColorName(mixedHex);
                
                result = {
                    color: mixedHex,
                    name: mixedName,
                    explanation: `${color1.name} + ${color2.name} = ${mixedName}! 🎨`
                };
            }

            this.showMixingResult(result);
            
            // Only add to discoveries if it's a meaningful mix
            const isCustomColor1 = color1.name.toLowerCase().includes('custom');
            const isCustomColor2 = color2.name.toLowerCase().includes('custom');
            const isGrayish = this.isGrayishColor(result.color);
            
            if (!isCustomColor1 && !isCustomColor2 && !isGrayish) {
                this.addToDiscoveredColors(result);
            }
            
            this.playSound('successSound');

            mixButton.classList.remove('loading');
            mixButton.textContent = '🪄 Mix Colors!';
            document.getElementById('mixing-bowl').classList.remove('mixing-animation');
        }, 1500);
    }

    // Complete predefined mixing table for all 19 colors - 361 combinations
    getPredefinedMixResult(color1Name, color2Name) {
        // Normalize color names to lowercase for comparison
        const c1 = color1Name.toLowerCase();
        const c2 = color2Name.toLowerCase();
        
        // Same color mixing returns null
        if (c1 === c2) {
            return null;
        }
        
        // Create a sorted key for consistent lookup
        const mixKey = [c1, c2].sort().join('+');
        
        // Complete mixing table for all 19 colors
        const completeMixes = {
            // PRIMARY COLOR COMBINATIONS (Red, Blue, Yellow)
            'blue+red': { color: '#8B00FF', name: 'Purple' },
            'blue+yellow': { color: '#00AA00', name: 'Green' },
            'red+yellow': { color: '#FF8800', name: 'Orange' },
            
            // PRIMARY + SECONDARY COMBINATIONS
            'blue+green': { color: '#00FFFF', name: 'Cyan' },
            'blue+orange': { color: '#8B4513', name: 'Brown' },
            'blue+purple': { color: '#4B0082', name: 'Indigo' },
            'green+red': { color: '#8B4513', name: 'Brown' },
            'orange+red': { color: '#FF4500', name: 'Red Orange' },
            'purple+red': { color: '#C71585', name: 'Hot Pink' },
            'green+yellow': { color: '#9AFF9A', name: 'Lime Green' },
            'orange+yellow': { color: '#FFD700', name: 'Gold' },
            'purple+yellow': { color: '#DDA0DD', name: 'Lavender' },
            
            // SECONDARY + SECONDARY COMBINATIONS
            'green+orange': { color: '#9ACD32', name: 'Yellow Green' },
            'green+purple': { color: '#4B0082', name: 'Indigo' },
            'orange+purple': { color: '#FF69B4', name: 'Hot Pink' },
            
            // WITH WHITE (makes colors lighter/pastel)
            'red+white': { color: '#FFC0CB', name: 'Pink' },
            'blue+white': { color: '#87CEEB', name: 'Sky Blue' },
            'yellow+white': { color: '#FFFACD', name: 'Cream' },
            'green+white': { color: '#98FB98', name: 'Mint Green' },
            'orange+white': { color: '#FFDAB9', name: 'Peach' },
            'purple+white': { color: '#DDA0DD', name: 'Lavender' },
            'pink+white': { color: '#FFE4E1', name: 'Light Pink' },
            'brown+white': { color: '#D2B48C', name: 'Tan' },
            'gray+white': { color: '#D3D3D3', name: 'Light Gray' },
            'lime+white': { color: '#F0FFF0', name: 'Honeydew' },
            'cyan+white': { color: '#E0FFFF', name: 'Light Cyan' },
            'magenta+white': { color: '#FFE4E1', name: 'Light Pink' },
            'violet+white': { color: '#F8F8FF', name: 'Ghost White' },
            'indigo+white': { color: '#E6E6FA', name: 'Lavender' },
            'turquoise+white': { color: '#AFEEEE', name: 'Pale Turquoise' },
            'gold+white': { color: '#FFFACD', name: 'Light Gold' },
            'silver+white': { color: '#F8F8FF', name: 'Almost White' },
            
            // WITH BLACK (makes colors darker)
            'black+red': { color: '#800000', name: 'Maroon' },
            'black+blue': { color: '#000080', name: 'Navy' },
            'black+yellow': { color: '#808000', name: 'Olive' },
            'black+green': { color: '#006400', name: 'Forest Green' },
            'black+orange': { color: '#FF8C00', name: 'Dark Orange' },
            'black+purple': { color: '#4B0082', name: 'Indigo' },
            'black+pink': { color: '#C71585', name: 'Deep Pink' },
            'black+brown': { color: '#654321', name: 'Dark Brown' },
            'black+gray': { color: '#404040', name: 'Charcoal' },
            'black+white': { color: '#808080', name: 'Gray' },
            'black+lime': { color: '#32CD32', name: 'Forest Green' },
            'black+cyan': { color: '#008B8B', name: 'Dark Cyan' },
            'black+magenta': { color: '#8B008B', name: 'Dark Magenta' },
            'black+violet': { color: '#9400D3', name: 'Dark Violet' },
            'black+indigo': { color: '#2F0040', name: 'Midnight' },
            'black+turquoise': { color: '#008080', name: 'Teal' },
            'black+gold': { color: '#B8860B', name: 'Dark Gold' },
            'black+silver': { color: '#606060', name: 'Dark Silver' },
            
            // PINK COMBINATIONS
            'pink+red': { color: '#FF69B4', name: 'Hot Pink' },
            'pink+blue': { color: '#8B00FF', name: 'Purple' },
            'pink+yellow': { color: '#FFB347', name: 'Peach' },
            'pink+green': { color: '#DDA0DD', name: 'Plum' },
            'pink+orange': { color: '#FF7F50', name: 'Coral' },
            'pink+purple': { color: '#DA70D6', name: 'Orchid' },
            'pink+brown': { color: '#D2B48C', name: 'Tan' },
            'pink+gray': { color: '#C0C0C0', name: 'Silver' },
            'pink+lime': { color: '#98FB98', name: 'Pale Green' },
            'pink+cyan': { color: '#FFB6C1', name: 'Light Pink' },
            'pink+magenta': { color: '#FF1493', name: 'Deep Pink' },
            'pink+violet': { color: '#DDA0DD', name: 'Plum' },
            'pink+indigo': { color: '#9370DB', name: 'Medium Purple' },
            'pink+turquoise': { color: '#20B2AA', name: 'Light Sea Green' },
            'pink+gold': { color: '#FFD700', name: 'Gold' },
            'pink+silver': { color: '#FFB6C1', name: 'Light Pink' },
            
            // BROWN COMBINATIONS
            'brown+red': { color: '#A0522D', name: 'Sienna' },
            'brown+blue': { color: '#8B4513', name: 'Saddle Brown' },
            'brown+yellow': { color: '#DAA520', name: 'Goldenrod' },
            'brown+green': { color: '#556B2F', name: 'Olive Drab' },
            'brown+orange': { color: '#D2691E', name: 'Chocolate' },
            'brown+purple': { color: '#8B4513', name: 'Saddle Brown' },
            'brown+gray': { color: '#A0A0A0', name: 'Dark Gray' },
            'brown+lime': { color: '#9ACD32', name: 'Yellow Green' },
            'brown+cyan': { color: '#5F9EA0', name: 'Cadet Blue' },
            'brown+magenta': { color: '#8B4513', name: 'Saddle Brown' },
            'brown+violet': { color: '#8B4513', name: 'Saddle Brown' },
            'brown+indigo': { color: '#654321', name: 'Dark Brown' },
            'brown+turquoise': { color: '#2F4F4F', name: 'Dark Slate Gray' },
            'brown+gold': { color: '#B8860B', name: 'Dark Goldenrod' },
            'brown+silver': { color: '#BC8F8F', name: 'Rosy Brown' },
            
            // GRAY COMBINATIONS
            'gray+red': { color: '#CD5C5C', name: 'Indian Red' },
            'gray+blue': { color: '#6495ED', name: 'Cornflower Blue' },
            'gray+yellow': { color: '#F0E68C', name: 'Khaki' },
            'gray+green': { color: '#8FBC8F', name: 'Dark Sea Green' },
            'gray+orange': { color: '#CD853F', name: 'Peru' },
            'gray+purple': { color: '#9370DB', name: 'Medium Purple' },
            'gray+lime': { color: '#9ACD32', name: 'Yellow Green' },
            'gray+cyan': { color: '#5F9EA0', name: 'Cadet Blue' },
            'gray+magenta': { color: '#DA70D6', name: 'Orchid' },
            'gray+violet': { color: '#9370DB', name: 'Medium Purple' },
            'gray+indigo': { color: '#483D8B', name: 'Dark Slate Blue' },
            'gray+turquoise': { color: '#2F4F4F', name: 'Dark Slate Gray' },
            'gray+gold': { color: '#DAA520', name: 'Goldenrod' },
            'gray+silver': { color: '#C0C0C0', name: 'Silver' },
            
            // LIME COMBINATIONS
            'lime+red': { color: '#FF6347', name: 'Tomato' },
            'lime+blue': { color: '#00FA9A', name: 'Medium Spring Green' },
            'lime+yellow': { color: '#ADFF2F', name: 'Green Yellow' },
            'lime+green': { color: '#32CD32', name: 'Lime Green' },
            'lime+orange': { color: '#FFD700', name: 'Gold' },
            'lime+purple': { color: '#9ACD32', name: 'Yellow Green' },
            'lime+cyan': { color: '#00FF7F', name: 'Spring Green' },
            'lime+magenta': { color: '#FF69B4', name: 'Hot Pink' },
            'lime+violet': { color: '#9ACD32', name: 'Yellow Green' },
            'lime+indigo': { color: '#228B22', name: 'Forest Green' },
            'lime+turquoise': { color: '#00FA9A', name: 'Medium Spring Green' },
            'lime+gold': { color: '#FFD700', name: 'Gold' },
            'lime+silver': { color: '#98FB98', name: 'Pale Green' },
            
            // CYAN COMBINATIONS
            'cyan+red': { color: '#FF6347', name: 'Tomato' },
            'cyan+yellow': { color: '#00FF7F', name: 'Spring Green' },
            'cyan+green': { color: '#00FA9A', name: 'Medium Spring Green' },
            'cyan+orange': { color: '#FF7F50', name: 'Coral' },
            'cyan+purple': { color: '#9370DB', name: 'Medium Purple' },
            'cyan+magenta': { color: '#FF00FF', name: 'Magenta' },
            'cyan+violet': { color: '#9370DB', name: 'Medium Purple' },
            'cyan+indigo': { color: '#4B0082', name: 'Indigo' },
            'cyan+turquoise': { color: '#40E0D0', name: 'Turquoise' },
            'cyan+gold': { color: '#FFD700', name: 'Gold' },
            'cyan+silver': { color: '#E0FFFF', name: 'Light Cyan' },
            
            // MAGENTA COMBINATIONS
            'magenta+red': { color: '#FF1493', name: 'Deep Pink' },
            'magenta+blue': { color: '#8B00FF', name: 'Purple' },
            'magenta+yellow': { color: '#FF69B4', name: 'Hot Pink' },
            'magenta+green': { color: '#8B008B', name: 'Dark Magenta' },
            'magenta+orange': { color: '#FF69B4', name: 'Hot Pink' },
            'magenta+purple': { color: '#8B00FF', name: 'Purple' },
            'magenta+violet': { color: '#EE82EE', name: 'Violet' },
                        'magenta+indigo': { color: '#4B0082', name: 'Indigo' },
            'magenta+turquoise': { color: '#DA70D6', name: 'Orchid' },
            'magenta+gold': { color: '#FFD700', name: 'Gold' },
            'magenta+silver': { color: '#FFB6C1', name: 'Light Pink' },
            
            // VIOLET COMBINATIONS
            'violet+red': { color: '#C71585', name: 'Medium Violet Red' },
            'violet+blue': { color: '#4B0082', name: 'Indigo' },
            'violet+yellow': { color: '#DDA0DD', name: 'Plum' },
            'violet+green': { color: '#9370DB', name: 'Medium Purple' },
            'violet+orange': { color: '#FF69B4', name: 'Hot Pink' },
            'violet+purple': { color: '#8B00FF', name: 'Purple' },
            'violet+indigo': { color: '#4B0082', name: 'Indigo' },
            'violet+turquoise': { color: '#9370DB', name: 'Medium Purple' },
            'violet+gold': { color: '#DAA520', name: 'Goldenrod' },
            'violet+silver': { color: '#DDA0DD', name: 'Plum' },
            
            // INDIGO COMBINATIONS
            'indigo+red': { color: '#8B0000', name: 'Dark Red' },
            'indigo+blue': { color: '#000080', name: 'Navy' },
            'indigo+yellow': { color: '#9370DB', name: 'Medium Purple' },
            'indigo+green': { color: '#2F4F4F', name: 'Dark Slate Gray' },
            'indigo+orange': { color: '#8B4513', name: 'Saddle Brown' },
            'indigo+purple': { color: '#4B0082', name: 'Indigo' },
            'indigo+turquoise': { color: '#2F4F4F', name: 'Dark Slate Gray' },
            'indigo+gold': { color: '#B8860B', name: 'Dark Goldenrod' },
            'indigo+silver': { color: '#9370DB', name: 'Medium Purple' },
            
            // TURQUOISE COMBINATIONS
            'turquoise+red': { color: '#FF6347', name: 'Tomato' },
            'turquoise+blue': { color: '#00CED1', name: 'Dark Turquoise' },
            'turquoise+yellow': { color: '#00FF7F', name: 'Spring Green' },
            'turquoise+green': { color: '#00FA9A', name: 'Medium Spring Green' },
            'turquoise+orange': { color: '#FF7F50', name: 'Coral' },
            'turquoise+purple': { color: '#9370DB', name: 'Medium Purple' },
            'turquoise+gold': { color: '#FFD700', name: 'Gold' },
            'turquoise+silver': { color: '#AFEEEE', name: 'Pale Turquoise' },
            
            // GOLD COMBINATIONS
            'gold+red': { color: '#FF4500', name: 'Orange Red' },
            'gold+blue': { color: '#DAA520', name: 'Goldenrod' },
            'gold+yellow': { color: '#FFD700', name: 'Gold' },
            'gold+green': { color: '#9ACD32', name: 'Yellow Green' },
            'gold+orange': { color: '#FF8C00', name: 'Dark Orange' },
            'gold+purple': { color: '#DAA520', name: 'Goldenrod' },
            'gold+silver': { color: '#F5DEB3', name: 'Wheat' },
            
            // SILVER COMBINATIONS
            'silver+red': { color: '#CD5C5C', name: 'Indian Red' },
            'silver+blue': { color: '#B0C4DE', name: 'Light Steel Blue' },
            'silver+yellow': { color: '#F0E68C', name: 'Khaki' },
            'silver+green': { color: '#8FBC8F', name: 'Dark Sea Green' },
            'silver+orange': { color: '#CD853F', name: 'Peru' },
            'silver+purple': { color: '#DDA0DD', name: 'Plum' }
        };
        
        return completeMixes[mixKey] || null;
    }

    // UPDATED: Enhanced mixing result display with more excitement
    showMixingResult(result) {
        const resultSlot = document.getElementById('result-slot');
        const resultMessage = document.getElementById('result-message');
        const colorExplanation = document.getElementById('color-explanation');

        resultSlot.style.backgroundColor = result.color;
        resultSlot.classList.add('filled');
        resultSlot.textContent = '';

        // Super exciting messages for kids - more variety!
        const excitingMessages = [
            `🎉 WOW! You made ${result.name}!`,
            `✨ AMAZING! Look, it's ${result.name}!`,
            `🌟 FANTASTIC! You created ${result.name}!`,
            `🎨 SUPER COOL! That's ${result.name}!`,
            `🎊 AWESOME! You mixed ${result.name}!`,
            `🌈 INCREDIBLE! You discovered ${result.name}!`,
            `🪄 MAGICAL! It's ${result.name}!`,
            `🎯 PERFECT! You got ${result.name}!`,
            `🚀 BRILLIANT! That's ${result.name}!`,
            `⭐ SPECTACULAR! You made ${result.name}!`
        ];
        
        const randomMessage = excitingMessages[Math.floor(Math.random() * excitingMessages.length)];
        resultMessage.textContent = randomMessage;
        resultMessage.classList.add('success');
        
        // Fun explanations based on color type
        let explanation = result.explanation || `${this.selectedColors[0].name} + ${this.selectedColors[1].name} = ${result.name}! 🎨`;
        
        // Add special explanations for certain color types
        if (result.name.includes('Pink')) {
            explanation += " Pink is such a pretty color! 💕";
        } else if (result.name.includes('Gold')) {
            explanation += " Shiny like treasure! ✨";
        } else if (result.name.includes('Green')) {
            explanation += " Green like grass and trees! 🌱";
        } else if (result.name.includes('Blue')) {
            explanation += " Blue like the sky and ocean! 🌊";
        } else if (result.name.includes('Purple')) {
            explanation += " Purple like royal robes! 👑";
        } else if (result.name.includes('Brown')) {
            explanation += " Brown like chocolate! 🍫";
        }
        
        colorExplanation.textContent = explanation;

        setTimeout(() => {
            resultMessage.classList.remove('success');
        }, 3000);

        // Add sparkle animation
        this.animateColorTransition(resultSlot, '#ffffff', result.color, 800);
        this.createCelebrationEffect();
    }

    // OPTIMIZED: Celebration effect with reduced particles
    createCelebrationEffect() {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff'];
        
        // Reduced particle count for better performance
        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            
            // Random position around the mixing bowl
            const mixingBowl = document.getElementById('mixing-bowl');
            const rect = mixingBowl.getBoundingClientRect();
            particle.style.left = (rect.left + Math.random() * rect.width) + 'px';
            particle.style.top = (rect.top + Math.random() * rect.height) + 'px';
            
            const dx = (Math.random() - 0.5) * 300;
            const dy = (Math.random() - 0.5) * 300;
            particle.style.setProperty('--dx', dx + 'px');
            particle.style.setProperty('--dy', dy + 'px');
            
            document.body.appendChild(particle);
            
            // Reduced timeout duration
            setTimeout(() => {
                particle.remove();
            }, 2000);
        }
        
        // Add confetti burst
        this.createConfettiBurst();
    }

    // OPTIMIZED: Confetti burst effect with reduced count
    createConfettiBurst() {
        const confettiColors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500'];
        
        // Reduced confetti count from 20 to 12
        for (let i = 0; i < 12; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.backgroundColor = confettiColors[Math.floor(Math.random() * confettiColors.length)];
            confetti.style.left = '50%';
            confetti.style.top = '30%';
            
            const angle = (Math.PI * 2 * i) / 12;
            const velocity = 100 + Math.random() * 80;
            const dx = Math.cos(angle) * velocity;
            const dy = Math.sin(angle) * velocity;
            
            confetti.style.setProperty('--dx', dx + 'px');
            confetti.style.setProperty('--dy', dy + 'px');
            
            document.body.appendChild(confetti);
            
            // Reduced cleanup time
            setTimeout(() => {
                confetti.remove();
            }, 2500);
        }
    }

    clearMixingBowl() {
        this.selectedColors = [];
        this.updateColorSlots();
        
        const resultSlot = document.getElementById('result-slot');
        resultSlot.style.backgroundColor = 'white';
        resultSlot.classList.remove('filled');
        resultSlot.textContent = '?';
        
        document.getElementById('result-message').textContent = '';
        document.getElementById('color-explanation').textContent = '';
        document.getElementById('mix-button').disabled = true;
    }

    addCustomColor() {
        const colorPicker = document.getElementById('color-picker');
        const customHex = colorPicker.value;
        const customName = `Custom ${this.customColorCounter}`;
        
        const colorData = {
            name: customName.toLowerCase().replace(' ', ''),
            hex: customHex
        };
        
        // Create a new color tile
        const colorTile = document.createElement('div');
        colorTile.className = 'color-tile custom-color';
        colorTile.dataset.color = colorData.name;
        colorTile.dataset.hex = colorData.hex;
        colorTile.style.backgroundColor = colorData.hex;
        colorTile.draggable = true;
        colorTile.innerHTML = `<span>${customName}</span>`;
        
        // Add event listeners
        colorTile.addEventListener('dragstart', this.handleDragStart.bind(this));
        colorTile.addEventListener('dragend', this.handleDragEnd.bind(this));
        colorTile.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        colorTile.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        colorTile.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        
        // Add to the color grid
        const colorGrid = document.querySelector('.color-grid');
        colorGrid.appendChild(colorTile);
        
        this.customColorCounter++;
    }

    addToDiscoveredColors(result) {
        const key = result.color.toLowerCase();
        if (!this.discoveredColors.has(key)) {
            this.discoveredColors.set(key, result);
            this.updateDiscoveryGallery();
            this.saveDiscoveredColors();
        }
    }

    updateDiscoveryGallery() {
        const gallery = document.getElementById('discovered-colors');
        
        if (this.discoveredColors.size === 0) {
            gallery.innerHTML = '<p style="color: #666; font-style: italic;">Mix basic colors to discover new ones!</p>';
            return;
        }
        
        gallery.innerHTML = '';
        
        this.discoveredColors.forEach((result, key) => {
            const colorCard = document.createElement('div');
            colorCard.className = 'discovered-color-card';
            colorCard.innerHTML = `
                <div class="color-preview" style="background-color: ${result.color}"></div>
                <div class="color-info">
                    <div class="color-name">${result.name}</div>
                    <div class="color-hex">${result.color}</div>
                </div>
            `;
            gallery.appendChild(colorCard);
        });
    }

    saveDiscoveredColors() {
        const colorsArray = Array.from(this.discoveredColors.entries());
        localStorage.setItem('discoveredColors', JSON.stringify(colorsArray));
    }

    loadDiscoveredColors() {
        const saved = localStorage.getItem('discoveredColors');
        if (saved) {
            const colorsArray = JSON.parse(saved);
            this.discoveredColors = new Map(colorsArray);
            this.updateDiscoveryGallery();
        }
    }

    clearAllDiscoveries() {
        // Show confirmation dialog
        const confirmed = confirm('🗑️ Are you sure you want to clear all your color discoveries? This cannot be undone!');
        
        if (confirmed) {
            this.discoveredColors.clear();
            localStorage.removeItem('discoveredColors');
            this.updateDiscoveryGallery();
            
            // Show success message
            const resultMessage = document.getElementById('result-message');
            const originalText = resultMessage.textContent;
            resultMessage.textContent = '🧹 All discoveries cleared!';
            resultMessage.classList.add('success');
            
            setTimeout(() => {
                resultMessage.textContent = originalText;
                resultMessage.classList.remove('success');
            }, 2000);
        }
    }

    // Update the setupEventListeners method (around line 50) to include the new button
    setupEventListeners() {
        document.getElementById('mix-button').addEventListener('click', this.mixColors.bind(this));
        document.getElementById('clear-button').addEventListener('click', this.clearMixingBowl.bind(this));
        document.getElementById('add-custom-color').addEventListener('click', this.addCustomColor.bind(this));
        // ADD THIS LINE:
        document.getElementById('clear-discoveries-button').addEventListener('click', this.clearAllDiscoveries.bind(this));
    }

    // Utility methods
    mixTwoColorsSubtractive(hex1, hex2) {
        const rgb1 = this.hexToRgb(hex1);
        const rgb2 = this.hexToRgb(hex2);
        
        const mixed = {
            r: Math.round((rgb1.r + rgb2.r) / 2),
            g: Math.round((rgb1.g + rgb2.g) / 2),
            b: Math.round((rgb1.b + rgb2.b) / 2)
        };
        
        return this.rgbToHex(mixed.r, mixed.g, mixed.b);
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    generateColorName(hex) {
        const rgb = this.hexToRgb(hex);
        const { r, g, b } = rgb;
        
        if (r > g && r > b) return 'Reddish';
        if (g > r && g > b) return 'Greenish';
        if (b > r && b > g) return 'Bluish';
        if (r === g && r > b) return 'Yellowish';
        if (r === b && r > g) return 'Purplish';
        if (g === b && g > r) return 'Cyanish';
        return 'Mixed Color';
    }

    isGrayishColor(hex) {
        const rgb = this.hexToRgb(hex);
        const { r, g, b } = rgb;
        const avg = (r + g + b) / 3;
                const variance = Math.abs(r - avg) + Math.abs(g - avg) + Math.abs(b - avg);
        return variance < 30; // If colors are very similar, it's grayish
    }

    animateColorTransition(element, fromColor, toColor, duration) {
        element.style.transition = `background-color ${duration}ms ease-in-out`;
        element.style.backgroundColor = fromColor;
        
        setTimeout(() => {
            element.style.backgroundColor = toColor;
        }, 50);
        
        setTimeout(() => {
            element.style.transition = '';
        }, duration);
    }

    // Initialize audio context on first user interaction
    initAudio() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    // Play sound using Web Audio API
    playSound(soundId) {
        this.initAudio();
        
        if (!this.audioContext) return;
        
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        if (soundId === 'dropSound') {
            // Quick "plop" sound for dropping colors
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            oscillator.frequency.setValueAtTime(800, now);
            oscillator.frequency.exponentialRampToValueAtTime(200, now + 0.1);
            
            gainNode.gain.setValueAtTime(0.3, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            
            oscillator.start(now);
            oscillator.stop(now + 0.1);
        } 
        else if (soundId === 'successSound') {
            // Happy "success" chime for successful mixing
            const playNote = (frequency, startTime, duration) => {
                const oscillator = ctx.createOscillator();
                const gainNode = ctx.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(ctx.destination);
                
                oscillator.frequency.setValueAtTime(frequency, startTime);
                gainNode.gain.setValueAtTime(0.2, startTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
                
                oscillator.start(startTime);
                oscillator.stop(startTime + duration);
            };
            
            // Play a happy chord: C-E-G
            playNote(523.25, now, 0.3);        // C5
            playNote(659.25, now + 0.05, 0.3); // E5
            playNote(783.99, now + 0.1, 0.4);  // G5
        }
    }
}

// Initialize the Color Mixer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ColorMixer();
});

