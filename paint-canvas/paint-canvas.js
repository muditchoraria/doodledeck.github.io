// Paint Canvas Application
class PaintCanvas {
    constructor() {
        this.canvas = document.getElementById('paint-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.currentColor = '#FF0000';
        this.currentTool = 'brush';
        this.currentStamp = '⭐';
        this.brushSize = 10;
        this.isDrawing = false;
        this.lastX = 0;
        this.lastY = 0;
        this.history = [];
        this.historyStep = -1;
        
        // Press-and-hold for sizing
        this.pressStartTime = 0;
        this.pressStartX = 0;
        this.pressStartY = 0;
        this.pressTimer = null;
        this.currentPressSize = 0;
        this.maxPressSize = 200; // Maximum size when holding
        
        this.init();
    }

    init() {
        this.setupCanvas();
        this.setupColorPalette();
        this.setupTools();
        this.setupStamps();
        this.setupSizeControl();
        this.setupActionButtons();
        this.setupDrawing();
        this.saveState();
    }

    setupCanvas() {
        // Fill canvas with white background
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    setupColorPalette() {
        const colorOptions = document.querySelectorAll('.color-option');
        const currentColorDisplay = document.getElementById('current-color');

        colorOptions.forEach(option => {
            option.addEventListener('click', () => {
                // Remove selected class from all
                colorOptions.forEach(opt => opt.classList.remove('selected'));
                
                // Add selected class to clicked
                option.classList.add('selected');
                
                // Update current color
                this.currentColor = option.dataset.color;
                currentColorDisplay.style.background = this.currentColor;
                
                this.playSound('select');
            });
        });

        // Set first color as selected
        colorOptions[0].classList.add('selected');
    }

    setupTools() {
        const toolButtons = document.querySelectorAll('.tool-btn');
        const stampsSection = document.getElementById('stamps-section');
        const colorPaletteSection = document.getElementById('color-palette-section');
        const sizeControl = document.getElementById('size-control');

        toolButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove active class from all
                toolButtons.forEach(btn => btn.classList.remove('active'));
                
                // Add active class to clicked
                button.classList.add('active');
                
                // Update current tool
                this.currentTool = button.dataset.tool;
                
                // Show/hide sections based on tool
                if (this.currentTool === 'stamp') {
                    stampsSection.style.display = 'block';
                    colorPaletteSection.style.display = 'none';
                    sizeControl.style.display = 'none';
                } else if (this.currentTool === 'splash') {
                    stampsSection.style.display = 'none';
                    colorPaletteSection.style.display = 'block';
                    sizeControl.style.display = 'none'; // Uses press-and-hold
                } else if (this.currentTool === 'eraser') {
                    stampsSection.style.display = 'none';
                    colorPaletteSection.style.display = 'none';
                    sizeControl.style.display = 'flex';
                } else {
                    stampsSection.style.display = 'none';
                    colorPaletteSection.style.display = 'block';
                    sizeControl.style.display = 'flex';
                }
                
                this.playSound('select');
            });
        });
    }

    setupStamps() {
        const stampButtons = document.querySelectorAll('.stamp-btn');

        stampButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove selected class from all
                stampButtons.forEach(btn => btn.classList.remove('selected'));
                
                // Add selected class to clicked
                button.classList.add('selected');
                
                // Update current stamp
                this.currentStamp = button.dataset.stamp;
                
                this.playSound('select');
            });
        });

        // Set first stamp as selected
        stampButtons[0].classList.add('selected');
    }

    setupSizeControl() {
        const sizeSlider = document.getElementById('brush-size');
        const sizeValue = document.getElementById('size-value');

        sizeSlider.addEventListener('input', () => {
            this.brushSize = parseInt(sizeSlider.value);
            sizeValue.textContent = this.brushSize;
        });
    }

    setupActionButtons() {
        document.getElementById('clear-btn').addEventListener('click', () => this.clearCanvas());
        document.getElementById('undo-btn').addEventListener('click', () => this.undo());
        document.getElementById('save-btn').addEventListener('click', () => this.saveImage());
    }

    setupDrawing() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseout', () => this.stopDrawing());

        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const mouseEvent = new MouseEvent('mouseup', {});
            this.canvas.dispatchEvent(mouseEvent);
        });
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }

    startDrawing(e) {
        const pos = this.getMousePos(e);
        this.isDrawing = true;
        this.lastX = pos.x;
        this.lastY = pos.y;

        // For stamp and splash tools, start press-and-hold sizing
        if (this.currentTool === 'stamp' || this.currentTool === 'splash') {
            this.pressStartTime = Date.now();
            this.pressStartX = pos.x;
            this.pressStartY = pos.y;
            this.currentPressSize = this.brushSize;
            this.isDrawing = false; // Don't drag these tools
            
            // Animate size growing while holding
            this.animatePressSize();
        }
    }

    draw(e) {
        if (!this.isDrawing) return;

        const pos = this.getMousePos(e);

        this.ctx.lineJoin = 'round';
        this.ctx.lineCap = 'round';

        if (this.currentTool === 'brush') {
            this.drawBrush(pos.x, pos.y);
        } else if (this.currentTool === 'roller') {
            this.drawRoller(pos.x, pos.y);
        } else if (this.currentTool === 'eraser') {
            this.drawEraser(pos.x, pos.y);
        }

        this.lastX = pos.x;
        this.lastY = pos.y;
    }

    stopDrawing() {
        if (this.isDrawing) {
            this.isDrawing = false;
            this.saveState();
        }
        
        // Handle stamp/splash release
        if (this.pressStartTime > 0) {
            if (this.currentTool === 'stamp') {
                this.placeStamp(this.pressStartX, this.pressStartY, this.currentPressSize);
            } else if (this.currentTool === 'splash') {
                this.drawSplash(this.pressStartX, this.pressStartY, this.currentPressSize);
            }
            
            // Clear press animation
            if (this.pressTimer) {
                cancelAnimationFrame(this.pressTimer);
                this.pressTimer = null;
            }
            
            this.pressStartTime = 0;
            this.currentPressSize = 0;
            this.saveState();
        }
    }

    drawBrush(x, y) {
        this.ctx.strokeStyle = this.currentColor;
        this.ctx.lineWidth = this.brushSize;

        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
    }

    drawRoller(x, y) {
        // Roller with texture effect
        const rollerWidth = this.brushSize * 3;
        const distance = Math.sqrt((x - this.lastX) ** 2 + (y - this.lastY) ** 2);
        const angle = Math.atan2(y - this.lastY, x - this.lastX);
        
        // Draw multiple stripes along the path for roller texture
        const stripes = Math.max(3, Math.floor(distance / 5));
        for (let i = 0; i < stripes; i++) {
            const t = i / stripes;
            const px = this.lastX + (x - this.lastX) * t;
            const py = this.lastY + (y - this.lastY) * t;
            
            // Draw a stripe perpendicular to the movement direction
            const stripeLength = rollerWidth;
            const offsetX = Math.cos(angle + Math.PI / 2) * stripeLength / 2;
            const offsetY = Math.sin(angle + Math.PI / 2) * stripeLength / 2;
            
            this.ctx.strokeStyle = this.currentColor;
            this.ctx.lineWidth = 2;
            this.ctx.globalAlpha = 0.15 + Math.random() * 0.1; // Varied opacity for texture
            
            this.ctx.beginPath();
            this.ctx.moveTo(px - offsetX, py - offsetY);
            this.ctx.lineTo(px + offsetX, py + offsetY);
            this.ctx.stroke();
        }
        
        this.ctx.globalAlpha = 1.0; // Reset
    }

    drawEraser(x, y) {
        // Eraser clears to white
        this.ctx.globalCompositeOperation = 'destination-out';
        this.ctx.lineWidth = this.brushSize;
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
        
        // Reset composite operation
        this.ctx.globalCompositeOperation = 'source-over';
    }

    drawSplash(x, y, customSize = null) {
        const baseSize = customSize || this.brushSize;
        const particleCount = 20 + Math.random() * 30 + (baseSize / 2); // More particles for bigger splashes

        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * baseSize * 3;
            const size = Math.random() * baseSize * 0.6;

            const px = x + Math.cos(angle) * distance;
            const py = y + Math.sin(angle) * distance;

            this.ctx.fillStyle = this.currentColor;
            this.ctx.globalAlpha = 0.3 + Math.random() * 0.5;
            
            this.ctx.beginPath();
            this.ctx.arc(px, py, size, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.globalAlpha = 1.0; // Reset
        this.playSound('splash');
    }

    placeStamp(x, y, customSize = null) {
        const size = (customSize || this.brushSize) * 3; // Stamps are larger
        
        // Draw emoji stamp
        this.ctx.font = `${size}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(this.currentStamp, x, y);
        
        this.playSound('stamp');
    }

    // Animate the size growing while pressing
    animatePressSize() {
        if (this.pressStartTime === 0) return;
        
        const elapsed = Date.now() - this.pressStartTime;
        const duration = 2000; // 2 seconds to reach max size
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease out curve for smooth growth
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        this.currentPressSize = this.brushSize + (this.maxPressSize - this.brushSize) * easeProgress;
        
        // Draw preview on canvas
        this.drawPressPreview();
        
        // Continue animation
        if (progress < 1) {
            this.pressTimer = requestAnimationFrame(() => this.animatePressSize());
        }
    }

    // Show visual preview of press size
    drawPressPreview() {
        // Save current canvas state
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(this.canvas, 0, 0);
        
        // Clear and redraw with preview
        this.ctx.drawImage(tempCanvas, 0, 0);
        
        // Draw preview circle/shape
        this.ctx.save();
        this.ctx.globalAlpha = 0.3;
        this.ctx.strokeStyle = this.currentColor;
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([5, 5]);
        
        if (this.currentTool === 'stamp') {
            // Preview stamp size
            this.ctx.font = `${this.currentPressSize * 3}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillStyle = this.currentColor;
            this.ctx.fillText(this.currentStamp, this.pressStartX, this.pressStartY);
        } else if (this.currentTool === 'splash') {
            // Preview splash radius
            this.ctx.beginPath();
            this.ctx.arc(this.pressStartX, this.pressStartY, this.currentPressSize * 3, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }

    clearCanvas() {
        if (confirm('Are you sure you want to clear the canvas?')) {
            this.ctx.fillStyle = 'white';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.saveState();
            this.playSound('clear');
        }
    }

    saveState() {
        // Remove any states after current step
        this.history = this.history.slice(0, this.historyStep + 1);
        
        // Save current state
        this.history.push(this.canvas.toDataURL());
        this.historyStep++;
        
        // Limit history to 20 steps
        if (this.history.length > 20) {
            this.history.shift();
            this.historyStep--;
        }
    }

    undo() {
        if (this.historyStep > 0) {
            this.historyStep--;
            const img = new Image();
            img.src = this.history[this.historyStep];
            img.onload = () => {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.drawImage(img, 0, 0);
            };
            this.playSound('undo');
        }
    }

    saveImage() {
        const link = document.createElement('a');
        link.download = `doodle-deck-${Date.now()}.png`;
        link.href = this.canvas.toDataURL();
        link.click();
        this.playSound('save');
    }

    // Sound effects using Web Audio API
    playSound(type) {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const now = audioContext.currentTime;

        const playTone = (frequency, startTime, duration, volume = 0.1) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(frequency, startTime);
            gainNode.gain.setValueAtTime(volume, startTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
            
            oscillator.start(startTime);
            oscillator.stop(startTime + duration);
        };

        switch(type) {
            case 'select':
                playTone(600, now, 0.1);
                break;
            case 'stamp':
                playTone(800, now, 0.15);
                playTone(1000, now + 0.05, 0.1);
                break;
            case 'splash':
                playTone(400, now, 0.2);
                playTone(600, now + 0.05, 0.15);
                playTone(800, now + 0.1, 0.1);
                break;
            case 'clear':
                playTone(300, now, 0.3);
                break;
            case 'undo':
                playTone(500, now, 0.1);
                break;
            case 'save':
                playTone(523.25, now, 0.2);
                playTone(659.25, now + 0.1, 0.2);
                playTone(783.99, now + 0.2, 0.3);
                break;
        }
    }
}

// Initialize the Paint Canvas when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new PaintCanvas();
});

