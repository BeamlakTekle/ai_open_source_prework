class GameClient {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.worldImage = new Image();
        this.worldWidth = 2048;
        this.worldHeight = 2048;
        
        // Game state
        this.myPlayerId = null;
        this.myPlayer = null;
        this.players = new Map(); // playerId -> player data
        this.avatars = new Map(); // avatarName -> avatar data
        this.avatarImages = new Map(); // avatarName -> loaded Image objects
        
        // Viewport
        this.viewportX = 0;
        this.viewportY = 0;
        
        // WebSocket
        this.ws = null;
        
        // Movement state
        this.keysPressed = new Set();
        this.isMoving = false;
        
        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.loadWorldMap();
        this.setupKeyboardControls();
        this.connectToServer();
    }
    
    setupCanvas() {
        // Set canvas size to fill the browser window
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.updateViewport();
            this.drawGame();
        });
    }
    
    loadWorldMap() {
        this.worldImage.onload = () => {
            this.drawWorldMap();
        };
        
        this.worldImage.onerror = () => {
            console.error('Failed to load world map image');
        };
        
        // Load the world map image
        this.worldImage.src = 'world.jpg';
    }
    
    drawWorldMap() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw the world map with viewport offset
        this.ctx.drawImage(
            this.worldImage,
            this.viewportX, this.viewportY, // Source position (viewport offset)
            this.canvas.width, this.canvas.height, // Source size (viewport size)
            0, 0, // Destination position (upper left of canvas)
            this.canvas.width, this.canvas.height // Destination size (canvas size)
        );
    }
    
    connectToServer() {
        try {
            this.updateConnectionStatus('Connecting...', 'connecting');
            this.ws = new WebSocket('wss://codepath-mmorg.onrender.com');
            
            this.ws.onopen = () => {
                console.log('Connected to game server');
                this.updateConnectionStatus('Connected', 'connected');
                this.joinGame();
            };
            
            this.ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    this.handleServerMessage(message);
                } catch (error) {
                    console.error('Failed to parse server message:', error);
                }
            };
            
            this.ws.onclose = () => {
                console.log('Disconnected from game server');
                this.updateConnectionStatus('Disconnected', 'disconnected');
                // Attempt to reconnect after 3 seconds
                setTimeout(() => {
                    console.log('Attempting to reconnect...');
                    this.updateConnectionStatus('Reconnecting...', 'connecting');
                    this.connectToServer();
                }, 3000);
            };
            
            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.updateConnectionStatus('Connection Error', 'disconnected');
            };
        } catch (error) {
            console.error('Failed to connect to server:', error);
        }
    }
    
    joinGame() {
        const joinMessage = {
            action: 'join_game',
            username: 'Beamlak',
            avatar: {
                name: 'default_avatar',
                frames: {
                    north: [
                        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
                        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
                        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
                    ],
                    south: [
                        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
                        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
                        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
                    ],
                    east: [
                        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
                        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
                        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
                    ]
                }
            }
        };
        
        this.ws.send(JSON.stringify(joinMessage));
    }
    
    handleServerMessage(message) {
        switch (message.action) {
            case 'join_game':
                if (message.success) {
                    this.handleJoinGameSuccess(message);
                } else {
                    console.error('Join game failed:', message.error);
                }
                break;
            case 'player_joined':
                this.handlePlayerJoined(message);
                break;
            case 'players_moved':
                this.handlePlayersMoved(message);
                break;
            case 'player_left':
                this.handlePlayerLeft(message);
                break;
            default:
                console.log('Unknown message type:', message.action);
        }
    }
    
    handleJoinGameSuccess(message) {
        console.log('Successfully joined game!');
        this.myPlayerId = message.playerId;
        
        // Store all players
        for (const [playerId, playerData] of Object.entries(message.players)) {
            this.players.set(playerId, playerData);
            if (playerId === this.myPlayerId) {
                this.myPlayer = playerData;
            }
        }
        
        // Store avatar data
        for (const [avatarName, avatarData] of Object.entries(message.avatars)) {
            this.avatars.set(avatarName, avatarData);
            this.loadAvatarImages(avatarName, avatarData);
        }
        
        // Update viewport to center on my player
        this.updateViewport();
        
        // Update UI and redraw the game
        this.updatePlayerCount();
        this.drawGame();
    }
    
    handlePlayerJoined(message) {
        this.players.set(message.player.id, message.player);
        this.avatars.set(message.avatar.name, message.avatar);
        this.loadAvatarImages(message.avatar.name, message.avatar);
        this.updatePlayerCount();
        this.drawGame();
    }
    
    handlePlayersMoved(message) {
        for (const [playerId, playerData] of Object.entries(message.players)) {
            this.players.set(playerId, playerData);
        }
        this.drawGame();
    }
    
    handlePlayerLeft(message) {
        this.players.delete(message.playerId);
        this.updatePlayerCount();
        this.drawGame();
    }
    
    loadAvatarImages(avatarName, avatarData) {
        const avatarImages = {
            north: [],
            south: [],
            east: []
        };
        
        // Load all frames for each direction
        Object.keys(avatarData.frames).forEach(direction => {
            avatarData.frames[direction].forEach((frameData, index) => {
                const img = new Image();
                img.onload = () => {
                    avatarImages[direction][index] = img;
                };
                img.src = frameData;
            });
        });
        
        this.avatarImages.set(avatarName, avatarImages);
    }
    
    updateViewport() {
        if (!this.myPlayer) return;
        
        // Center viewport on my player
        this.viewportX = this.myPlayer.x - this.canvas.width / 2;
        this.viewportY = this.myPlayer.y - this.canvas.height / 2;
        
        // Clamp viewport to world bounds
        this.viewportX = Math.max(0, Math.min(this.viewportX, this.worldWidth - this.canvas.width));
        this.viewportY = Math.max(0, Math.min(this.viewportY, this.worldHeight - this.canvas.height));
    }
    
    drawAvatars() {
        this.players.forEach(player => {
            this.drawAvatar(player);
        });
    }
    
    drawAvatar(player) {
        const avatarData = this.avatars.get(player.avatar);
        if (!avatarData) return;
        
        const avatarImages = this.avatarImages.get(player.avatar);
        if (!avatarImages) return;
        
        // Calculate screen position
        const screenX = player.x - this.viewportX;
        const screenY = player.y - this.viewportY;
        
        // Skip if avatar is outside viewport
        if (screenX < -50 || screenX > this.canvas.width + 50 || 
            screenY < -50 || screenY > this.canvas.height + 50) {
            return;
        }
        
        // Get the appropriate frame
        let direction = player.facing;
        let frameIndex = player.animationFrame || 0;
        
        // Handle west direction by flipping east frames
        let flipHorizontal = false;
        if (direction === 'west') {
            direction = 'east';
            flipHorizontal = true;
        }
        
        const frame = avatarImages[direction] && avatarImages[direction][frameIndex];
        if (!frame) return;
        
        // Draw avatar with shadow
        this.ctx.save();
        
        // Draw shadow
        this.ctx.globalAlpha = 0.3;
        this.ctx.fillStyle = 'black';
        this.ctx.beginPath();
        this.ctx.ellipse(screenX, screenY + 20, 20, 8, 0, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.globalAlpha = 1.0;
        
        // Draw avatar
        if (flipHorizontal) {
            this.ctx.scale(-1, 1);
            this.ctx.drawImage(frame, -screenX - 32, screenY - 32, 64, 64);
        } else {
            this.ctx.drawImage(frame, screenX - 32, screenY - 32, 64, 64);
        }
        
        this.ctx.restore();
        
        // Draw username label with better styling
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        
        const textX = screenX;
        const textY = screenY - 45;
        
        // Draw text background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(textX - 50, textY - 15, 100, 20);
        
        // Draw text outline
        this.ctx.strokeStyle = 'black';
        this.ctx.lineWidth = 3;
        this.ctx.strokeText(player.username, textX, textY);
        
        // Draw text fill
        this.ctx.fillStyle = 'white';
        this.ctx.lineWidth = 1;
        this.ctx.fillText(player.username, textX, textY);
    }
    
    drawGame() {
        this.drawWorldMap();
        this.drawAvatars();
    }
    
    setupKeyboardControls() {
        // Handle key down events
        document.addEventListener('keydown', (event) => {
            if (this.keysPressed.has(event.code)) return; // Prevent duplicate events
            
            this.keysPressed.add(event.code);
            this.handleKeyPress(event.code);
        });
        
        // Handle key up events
        document.addEventListener('keyup', (event) => {
            this.keysPressed.delete(event.code);
            this.handleKeyRelease();
        });
        
        // Prevent arrow keys from scrolling the page
        document.addEventListener('keydown', (event) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
                event.preventDefault();
            }
        });
    }
    
    handleKeyPress(keyCode) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
        
        const directionMap = {
            'ArrowUp': 'up',
            'ArrowDown': 'down',
            'ArrowLeft': 'left',
            'ArrowRight': 'right'
        };
        
        const direction = directionMap[keyCode];
        if (direction) {
            this.sendMoveCommand(direction);
        }
    }
    
    handleKeyRelease() {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
        
        // Check if any movement keys are still pressed
        const movementKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
        const anyMovementKeyPressed = movementKeys.some(key => this.keysPressed.has(key));
        
        if (!anyMovementKeyPressed && this.isMoving) {
            this.sendStopCommand();
        }
    }
    
    sendMoveCommand(direction) {
        const moveMessage = {
            action: 'move',
            direction: direction
        };
        
        this.ws.send(JSON.stringify(moveMessage));
        this.isMoving = true;
    }
    
    sendStopCommand() {
        const stopMessage = {
            action: 'stop'
        };
        
        this.ws.send(JSON.stringify(stopMessage));
        this.isMoving = false;
    }
    
    updateConnectionStatus(message, status) {
        const statusElement = document.getElementById('connectionStatus');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = status;
        }
    }
    
    updatePlayerCount() {
        const countElement = document.getElementById('playerCount');
        if (countElement) {
            countElement.textContent = `Players: ${this.players.size}`;
        }
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new GameClient();
});
