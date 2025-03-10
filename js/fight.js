document.addEventListener('DOMContentLoaded', function() {
    // Get selected map and players from session storage
    const selectedMap = sessionStorage.getItem('selectedMap');
    const player1Character = sessionStorage.getItem('player1Character');
    const player2Character = sessionStorage.getItem('player2Character');
    
    console.log('Fight started with map:', selectedMap);
    console.log('Player 1 from session storage:', player1Character);
    console.log('Player 2 from session storage:', player2Character);
    
    // Check if player selections exist
    if (!player1Character || !player2Character) {
        console.warn('Player selections not found in session storage. Using default characters.');
        
        // If player selections don't exist, we'll use default characters
        if (!player1Character) {
            sessionStorage.setItem('player1Character', 'curse-or');
        }
        
        if (!player2Character) {
            sessionStorage.setItem('player2Character', 'reign');
        }
    }
    
    // Get the final character selections (either from session storage or defaults)
    const finalPlayer1 = sessionStorage.getItem('player1Character') || 'curse-or';
    const finalPlayer2 = sessionStorage.getItem('player2Character') || 'reign';
    
    console.log('Final Player 1:', finalPlayer1);
    console.log('Final Player 2:', finalPlayer2);
    
    // Add debug overlay
    createDebugOverlay();
    
    // Set up the background - create the background container element
    const fightArena = document.getElementById('fightArena');
    const backgroundContainer = document.createElement('div');
    backgroundContainer.id = 'background-container';
    backgroundContainer.className = 'background-container';
    
    // Insert the background container as the first child of the fight arena
    if (fightArena && fightArena.firstChild) {
        fightArena.insertBefore(backgroundContainer, fightArena.firstChild);
    } else if (fightArena) {
        fightArena.appendChild(backgroundContainer);
    }
    
    // Create map images based on the selected map
    setupMapBackground(selectedMap, backgroundContainer);
    
    // Set up fighters with the correct character selections
    setupFighters(finalPlayer1, finalPlayer2);
  
    // Set up game timer
    setupGameTimer();
    
    // Set up fight animation
    animateFightText();
    
    // Initialize the game engine
    initGameEngine(finalPlayer1, finalPlayer2);
    
    // Add a small delay and check if images are loaded correctly
    setTimeout(function() {
        ensureImagesLoaded(finalPlayer1, finalPlayer2);
    }, 500);

    addTeleportAnimationStyle();

    // Create blood overlays
    const leftBloodOverlay = document.createElement('div');
    leftBloodOverlay.id = 'left-blood-overlay';
    leftBloodOverlay.className = 'blood-overlay';
    leftBloodOverlay.style.opacity = '0'; // Set initial opacity to 0
    document.body.appendChild(leftBloodOverlay);

    const rightBloodOverlay = document.createElement('div');
    rightBloodOverlay.id = 'right-blood-overlay';
    rightBloodOverlay.className = 'blood-overlay';
    rightBloodOverlay.style.opacity = '0'; // Set initial opacity to 0
    document.body.appendChild(rightBloodOverlay);

    // Create center blood overlay
    const centerBloodOverlay = document.createElement('div');
    centerBloodOverlay.id = 'center-blood-overlay';
    document.body.appendChild(centerBloodOverlay);
});

// Game state
let gameState = {
    player1: {
        health: 100,
        stamina: 100, // Add stamina property
        lastStaminaRegen: 0, // Track last stamina regeneration time
        lastDamageTaken: 0, // Track last damage taken time
        position: 200,
        isJumping: false,
        isGuarding: false,
        isAttacking: false,
        attackType: null,
        direction: 1, // 1 = right, -1 = left
        character: null,
        element: null,
        healthBar: null,
        staminaBar: null, // Add stamina bar reference
        dashCooldown: false,
        lastDashTime: 0,
        lastHitSoundIndex: null,
        movementSound: null,
        chargingSound: null,
        mainStaminaBar: null // Add main stamina bar reference
    },
    player2: {
        health: 100,
        stamina: 100, // Add stamina property
        lastStaminaRegen: 0, // Track last stamina regeneration time
        lastDamageTaken: 0, // Track last damage taken time
        position: 800,
        isJumping: false,
        isGuarding: false,
        isAttacking: false,
        attackType: null,
        direction: -1, // 1 = right, -1 = left
        character: null,
        element: null,
        healthBar: null,
        staminaBar: null, // Add stamina bar reference
        dashCooldown: false,
        lastDashTime: 0,
        lastHitSoundIndex: null,
        movementSound: null,
        chargingSound: null,
        mainStaminaBar: null // Add main stamina bar reference
    },
    arena: {
        width: 1000,
        boundaries: {
            left: 100,
            right: 900
        }
    },
    keys: {
        player1: {
            left: false,
            right: false,
            jump: false,
            guard: false,
            punch: false,
            kick: false
        },
        player2: {
            left: false,
            right: false,
            jump: false,
            guard: false,
            punch: false,
            kick: false
        }
    },
    gameOver: false,
    winner: null,
    roundTime: 60,
    animationFrame: null
};

// Basic fighter styles
const FIGHTER_STYLES = `
    .fighter-image {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 100%;
        transform-origin: center bottom;
        will-change: transform;
        z-index: 1;
    }

    .fighter-container {
        position: relative;
        width: 100%;
        height: 100%;
        z-index: 1;
    }

    @keyframes hitShake {
        0% { transform: translate(0, 0) rotate(0deg); }
        25% { transform: translate(-5px, -2px) rotate(-3deg); }
        50% { transform: translate(5px, 2px) rotate(3deg); }
        75% { transform: translate(-3px, -1px) rotate(-2deg); }
        100% { transform: translate(0, 0) rotate(0deg); }
    }

    @keyframes hitOutlineEffect {
        0% { 
            opacity: 0.7;
            transform: scale(1);
            filter: brightness(2) drop-shadow(0 0 10px #ff3366);
        }
        50% {
            opacity: 0.5;
            transform: scale(1.05);
            filter: brightness(2.5) drop-shadow(0 0 15px #ff3366);
        }
        100% { 
            opacity: 0;
            transform: scale(1.1);
            filter: brightness(3) drop-shadow(0 0 20px #ff3366);
        }
    }

    .hit-outline {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        animation: hitOutlineEffect 0.3s ease-out forwards;
        z-index: 100;
        background-size: contain !important;
        background-position: bottom !important;
        background-repeat: no-repeat !important;
    }

    .screen-shake {
        animation: hitShake 0.3s ease-in-out;
    }

    .stamina-bar {
        position: absolute;
        width: 100%;
        height: 5px;
        background-color: #34495e;
        bottom: -15px;  /* Changed from -8px to -15px to position below health bar */
        left: 0;
        border-radius: 2px;
        overflow: hidden;
    }

    .stamina-bar-fill {
        width: 100%;
        height: 100%;
        background-color: #3498db;
        transition: width 0.2s ease-out;
    }

    .stamina-bar.low .stamina-bar-fill {
        background-color: #e74c3c;
        animation: staminaPulse 1s infinite;
    }

    @keyframes staminaPulse {
        0% { opacity: 1; }
        50% { opacity: 0.6; }
        100% { opacity: 1; }
    }

    .stamina-warning {
        position: absolute;
        top: -25px;
        left: 50%;
        transform: translateX(-50%);
        color: #e74c3c;
        font-size: 14px;
        font-weight: bold;
        text-shadow: 0 0 5px #000;
        opacity: 0;
        transition: opacity 0.3s ease;
    }

    .stamina-warning.show {
        opacity: 1;
    }
`;

// Add the styles to the document
document.head.insertAdjacentHTML('beforeend', `<style>${FIGHTER_STYLES}</style>`);

function initGameEngine(player1Character, player2Character) {
    // Set up game arena
    const fightArena = document.getElementById('fightArena');
    if (fightArena) {
        gameState.arena.width = fightArena.offsetWidth;
        gameState.arena.boundaries.left = gameState.arena.width * 0.1;
        gameState.arena.boundaries.right = gameState.arena.width * 0.9;
        console.log('Arena width:', gameState.arena.width);
        console.log('Arena boundaries:', gameState.arena.boundaries);
    }
    
    // Set up player elements
    gameState.player1.element = document.getElementById('player1');
    gameState.player2.element = document.getElementById('player2');
    gameState.player1.healthBar = document.querySelector('#player1-health .health-bar');
    gameState.player2.healthBar = document.querySelector('#player2-health .health-bar');
    
    // Set up main stamina bars
    gameState.player1.mainStaminaBar = document.querySelector('#player1-health .main-stamina-bar');
    gameState.player2.mainStaminaBar = document.querySelector('#player2-health .main-stamina-bar');
    
    // Set character data
    gameState.player1.character = player1Character;
    gameState.player2.character = player2Character;
    
    // Set initial positions
    gameState.player1.position = gameState.arena.width * 0.3;
    gameState.player2.position = gameState.arena.width * 0.7;
    
    // Apply initial positions to DOM
    if (gameState.player1.element) {
        gameState.player1.element.style.left = gameState.player1.position + 'px';
    }
    if (gameState.player2.element) {
        gameState.player2.element.style.left = gameState.player2.position + 'px';
    }
    
    console.log('Initial positions set:', 
                gameState.player1.position, 
                gameState.player2.position);
    
    // Set up keyboard controls
    setupControls();
    
    // Start game loop
    gameLoop();
    
    // Show "FIGHT!" text and start the game
    setTimeout(() => {
        const fightText = document.getElementById('fightText');
        if (fightText) {
            fightText.style.transform = 'scale(2)';
            fightText.style.opacity = '0';
            
            setTimeout(() => {
                fightText.style.display = 'none';
            }, 500);
        }
    }, 2000);
    
    // Add stamina bars
    if (gameState.player1.element) {
        const player1StaminaBar = createStaminaBar(gameState.player1);
        gameState.player1.element.appendChild(player1StaminaBar);
        gameState.player1.staminaBar = player1StaminaBar;
    }
    
    if (gameState.player2.element) {
        const player2StaminaBar = createStaminaBar(gameState.player2);
        gameState.player2.element.appendChild(player2StaminaBar);
        gameState.player2.staminaBar = player2StaminaBar;
    }
}

function setupControls() {
    // Remove any existing event listeners
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('keyup', handleKeyUp);
    
    // Add keyboard event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    // Touch controls for mobile (optional)
    setupTouchControls();
    
    console.log('Controls initialized');
}

function handleKeyDown(e) {
    const currentTime = Date.now();
    const ATTACK_DELAY = 50; // 50ms delay between attacks
    
    // Player 1 controls (WASD + F,G)
    switch(e.key.toLowerCase()) {
        case 'w':
            if (!gameState.keys.player1.jump) {  // Only trigger if not already jumping
                gameState.keys.player1.jump = true;
            }
            break;
        case 'a':
            gameState.keys.player1.left = true;
            // Check for dash (Shift + A)
            if (e.shiftKey) {
                performDash(gameState.player1, -1);
            }
            break;
        case 'd':
            gameState.keys.player1.right = true;
            // Check for dash (Shift + D)
            if (e.shiftKey) {
                performDash(gameState.player1, 1);
            }
            break;
        case 's':
            gameState.keys.player1.guard = true;
            guardPlayer(gameState.player1);  // Start guarding immediately
            break;
        case 'f':
            // Check if enough time has passed since last attack and player is not jumping or dodging
            if (!gameState.keys.player1.punch && !gameState.player1.isAttacking && 
                !gameState.player1.isJumping && !gameState.player1.isDodging) {
                gameState.keys.player1.punch = true;
                attackPlayer(gameState.player1, 'punch');
            }
            break;
        case 'g':
            // Check if enough time has passed since last attack and player is not jumping or dodging
            if (!gameState.keys.player1.kick && !gameState.player1.isAttacking && 
                !gameState.player1.isJumping && !gameState.player1.isDodging) {
                gameState.keys.player1.kick = true;
                attackPlayer(gameState.player1, 'kick');
            }
            break;
    }

    // Player 2 controls (Arrow keys + K,L)
    switch(e.key) {
        case 'ArrowUp':
            if (!gameState.keys.player2.jump) {  // Only trigger if not already jumping
                gameState.keys.player2.jump = true;
            }
            break;
        case 'ArrowLeft':
            gameState.keys.player2.left = true;
            // Check for dash (Shift + Left Arrow)
            if (e.shiftKey) {
                performDash(gameState.player2, -1);
            }
            break;
        case 'ArrowRight':
            gameState.keys.player2.right = true;
            // Check for dash (Shift + Right Arrow)
            if (e.shiftKey) {
                performDash(gameState.player2, 1);
            }
            break;
        case 'ArrowDown':
            gameState.keys.player2.guard = true;
            guardPlayer(gameState.player2);  // Start guarding immediately
            break;
        case 'k':
            // Check if enough time has passed since last attack and player is not jumping or dodging
            if (!gameState.keys.player2.punch && !gameState.player2.isAttacking && 
                !gameState.player2.isJumping && !gameState.player2.isDodging) {
                gameState.keys.player2.punch = true;
                attackPlayer(gameState.player2, 'punch');
            }
            break;
        case 'l':
            // Check if enough time has passed since last attack and player is not jumping or dodging
            if (!gameState.keys.player2.kick && !gameState.player2.isAttacking && 
                !gameState.player2.isJumping && !gameState.player2.isDodging) {
                gameState.keys.player2.kick = true;
                attackPlayer(gameState.player2, 'kick');
            }
            break;
    }
}

function handleKeyUp(e) {
    // Player 1 controls
    switch(e.key.toLowerCase()) {
        case 'w': 
            gameState.keys.player1.jump = false; 
            break;
        case 'a': 
            gameState.keys.player1.left = false; 
            // Stop movement sound
            if (gameState.player1.movementSound) {
                gameState.player1.movementSound.pause();
                gameState.player1.movementSound = null;
            }
            // Reset player 1 image when left key is released
            resetPlayerIdleImage(gameState.player1);
            break;
        case 'd': 
            gameState.keys.player1.right = false; 
            // Stop movement sound
            if (gameState.player1.movementSound) {
                gameState.player1.movementSound.pause();
                gameState.player1.movementSound = null;
            }
            // Reset player 1 image when right key is released
            resetPlayerIdleImage(gameState.player1);
            break;
        case 's': 
            gameState.keys.player1.guard = false; 
            stopGuardPlayer(gameState.player1);
            break;
        case 'f': 
            gameState.keys.player1.punch = false; 
            break;
        case 'g': 
            gameState.keys.player1.kick = false; 
            break;
    }

    // Player 2 controls
    switch(e.key) {
        case 'ArrowUp': 
            gameState.keys.player2.jump = false; 
            break;
        case 'ArrowLeft': 
            gameState.keys.player2.left = false; 
            // Stop movement sound
            if (gameState.player2.movementSound) {
                gameState.player2.movementSound.pause();
                gameState.player2.movementSound = null;
            }
            // Reset player 2 image when left key is released
            resetPlayerIdleImage(gameState.player2);
            break;
        case 'ArrowRight': 
            gameState.keys.player2.right = false; 
            // Stop movement sound
            if (gameState.player2.movementSound) {
                gameState.player2.movementSound.pause();
                gameState.player2.movementSound = null;
            }
            // Reset player 2 image when right key is released
            resetPlayerIdleImage(gameState.player2);
            break;
        case 'ArrowDown': 
            gameState.keys.player2.guard = false; 
            stopGuardPlayer(gameState.player2);
            break;
        case 'k': 
            gameState.keys.player2.punch = false; 
            break;
        case 'l': 
            gameState.keys.player2.kick = false; 
            break;
    }
}

function setupTouchControls() {
    // Add touch controls for mobile devices
    // This would be implemented with on-screen buttons
}

function gameLoop() {
    // Process player input
    processInput();
    
    // Update game state
    updateGameState();
    
    // Regenerate stamina for both players
    regenerateStamina(gameState.player1);
    regenerateStamina(gameState.player2);
    
    // Render the game
    renderGame();
    
    // Check for game over
    if (!gameState.gameOver) {
        gameState.animationFrame = requestAnimationFrame(gameLoop);
    } else {
        endGame();
    }
}

function processInput() {
    // Process Player 1 input
    if (gameState.keys.player1.left) {
        movePlayer(gameState.player1, -1);
    } else if (gameState.keys.player1.right) {
        movePlayer(gameState.player1, 1);
    } else if (!gameState.player1.isJumping && !gameState.player1.isAttacking && !gameState.player1.isGuarding) {
        // Reset to idle image if no movement keys are pressed and not in another state
        resetPlayerIdleImage(gameState.player1);
    }
    
    if (gameState.keys.player1.jump && !gameState.player1.isJumping) {
        jumpPlayer(gameState.player1);
    }
    if (gameState.keys.player1.guard) {
        guardPlayer(gameState.player1);
    } else if (gameState.player1.isGuarding) {
        stopGuardPlayer(gameState.player1);
    }

    // Process Player 2 input
    if (gameState.keys.player2.left) {
        movePlayer(gameState.player2, -1);
    } else if (gameState.keys.player2.right) {
        movePlayer(gameState.player2, 1);
    } else if (!gameState.player2.isJumping && !gameState.player2.isAttacking && !gameState.player2.isGuarding) {
        // Reset to idle image if no movement keys are pressed and not in another state
        resetPlayerIdleImage(gameState.player2);
    }
    
    if (gameState.keys.player2.jump && !gameState.player2.isJumping) {
        jumpPlayer(gameState.player2);
    }
    if (gameState.keys.player2.guard) {
        guardPlayer(gameState.player2);
    } else if (gameState.player2.isGuarding) {
        stopGuardPlayer(gameState.player2);
    }
}

function movePlayer(player, direction) {
    // Don't allow movement while attacking or guarding
    if (player.isAttacking || player.isGuarding || (player === gameState.player1 ? gameState.keys.player1.guard : gameState.keys.player2.guard)) {
        return;
    }
    
    // Update player position
    const oldPosition = player.position;
    const moveAmount = direction * 5;
    const newPosition = player.position + moveAmount;
    
    // Get character hitbox width
    const characterWidth = 150; // New standardized width for both characters
    
    // Calculate boundaries with hitbox consideration
    const leftBoundary = gameState.arena.boundaries.left;
    const rightBoundary = gameState.arena.boundaries.right - characterWidth;
    
    // Keep player within boundaries
    if (newPosition < leftBoundary) {
        player.position = leftBoundary;
    } else if (newPosition > rightBoundary) {
        player.position = rightBoundary;
    } else {
        player.position = newPosition;
    }
    
    // Check for collision with other player
    const otherPlayer = player === gameState.player1 ? gameState.player2 : gameState.player1;
    const minDistance = 25; // Minimum distance between players
    
    // Calculate distance between players
    const distance = Math.abs(player.position - otherPlayer.position);
    
    // If players are too close, instantly teleport to maintain minimum distance
    if (distance < minDistance) {
        // Determine which side the player is approaching from
        const isApproachingFromLeft = player.position < otherPlayer.position;
        
        // Calculate the teleport position (26px distance)
        if (isApproachingFromLeft) {
            // Player is approaching from left, teleport to right side of opponent
            player.position = otherPlayer.position - 26;
        } else {
            // Player is approaching from right, teleport to left side of opponent
            player.position = otherPlayer.position + 26;
        }
        
        // Ensure the new position is within boundaries
        if (player.position < leftBoundary) {
            player.position = leftBoundary;
        } else if (player.position > rightBoundary) {
            player.position = rightBoundary;
        }
    }
    
    // Update player direction
    player.direction = direction;
    
    // Apply position immediately
    if (player.element) {
        player.element.style.left = player.position + 'px';
        // Maintain Y-axis position for Reign
        if ((player === gameState.player1 && gameState.player1.character === 'reign') || 
            (player === gameState.player2 && gameState.player2.character === 'reign')) {
            player.element.style.bottom = '50px'; // Keep Reign at the same height
        }
    }
    
    // Handle movement sound
    if (!player.movementSound) {
        const characterId = player === gameState.player1 ? gameState.player1.character : gameState.player2.character;
        const soundPath = '../assests/audio/movementSFX/movement.mp3';

        // Create and play the movement sound
        player.movementSound = new Audio(soundPath);
        player.movementSound.volume = 0.6;
        player.movementSound.loop = false;
        
        // Set playback speed based on character
        if (characterId === 'reign') {
            player.movementSound.playbackRate = 1.5; // Faster speed for Reign
        } else {
            player.movementSound.playbackRate = 1.0; // Normal speed for Curse-or
        }
        
        // Add ended event listener to clean up the sound object
        player.movementSound.addEventListener('ended', () => {
            player.movementSound = null;
        });
        
        player.movementSound.play().catch(e => console.warn('Movement sound play failed:', e));
    }
    
    // Update player image for movement
    updatePlayerMovementImage(player, direction);
    
    console.log(`Player moved: ${oldPosition} -> ${player.position}, direction: ${direction}`);
}

function jumpPlayer(player) {
    // Don't allow jumping while guarding
    if (player.isGuarding || (player === gameState.player1 ? gameState.keys.player1.guard : gameState.keys.player2.guard)) {
        return;
    }
    
    player.isJumping = true;
    
    // Play character-specific jump sound with increased volume and more pitch variance
    const characterId = player === gameState.player1 ? gameState.player1.character : gameState.player2.character;
    const jumpSound = new Audio(characterId === 'curse-or' ? 
        '../assests/audio/movementSFX/jump.mp3' : 
        '../assests/audio/movementSFX/jump2.mp3');
    jumpSound.volume = 0.8; // Increased from 0.5 to 0.8
    jumpSound.playbackRate = 0.8 + (Math.random() * 0.6); // Wider range: 0.8 to 1.4
    jumpSound.play().catch(e => console.warn('Jump sound play failed:', e));
    
    // Add jump animation class
    if (player.element) {
        const playerImage = player.element.querySelector('.fighter-image');
        
        // Store current transform before jumping to preserve orientation
        if (playerImage) {
            playerImage.dataset.originalTransform = playerImage.style.transform;
        }
        
        player.element.classList.add('jumping');
        
        // Force a reflow to restart the animation if it's already applied
        void player.element.offsetWidth;
    }
    
    // Reset jump after animation
    setTimeout(() => {
        player.isJumping = false;
        if (player.element) {
            player.element.classList.remove('jumping');
            
            // Restore original transform after jump
            const playerImage = player.element.querySelector('.fighter-image');
            if (playerImage && playerImage.dataset.originalTransform) {
                playerImage.style.transform = playerImage.dataset.originalTransform;
                delete playerImage.dataset.originalTransform;
            }
            
            // Check for collision after landing
            const otherPlayer = player === gameState.player1 ? gameState.player2 : gameState.player1;
            const minDistance = 25; // Minimum distance between players
            
            // Calculate distance between players
            const distance = Math.abs(player.position - otherPlayer.position);
            
            // If players are too close after landing, push them apart
            if (distance < minDistance) {
                if (player.position < otherPlayer.position) {
                    // Player 1 is on the left, push them left
                    player.position = otherPlayer.position - minDistance;
                } else {
                    // Player 1 is on the right, push them right
                    player.position = otherPlayer.position + minDistance;
                }
                
                // Update position immediately
                player.element.style.left = player.position + 'px';
            }
        }
    }, 500);
}

function guardPlayer(player) {
    const isPlayer1 = player === gameState.player1;
    
    // Don't allow guarding while jumping
    if (player.isJumping) {
        return;
    }
    
    // Check if player has enough stamina to start guarding (minimum 20%)
    if (!player.isGuarding && player.stamina < 20) {
        showStaminaWarning(player);
        return;
    }
    
    // Consume stamina while guarding (5% per second)
    if (player.isGuarding) {
        if (!consumeStamina(player, 0.25)) { // 0.25% per frame ≈ 5% per second at 20fps
            stopGuardPlayer(player);
            showStaminaWarning(player);
            return;
        }
    }
    
    // Set guard state immediately
    player.isGuarding = true;
    
    // Play shield sound only if not already playing
    if (!player.chargingSound) {
        player.chargingSound = new Audio('../assests/audio/movementSFX/shield.mp3');
        player.chargingSound.volume = 0.6;
        player.chargingSound.loop = false;
        player.chargingSound.play().catch(e => console.warn('Shield sound play failed:', e));
    }
    
    // Get the player image element
    const playerImage = player.element?.querySelector('.fighter-image');
    if (!playerImage) return;
    
    // Get the character ID
    const characterId = isPlayer1 ? gameState.player1.character : gameState.player2.character;
    
    // Set the correct block animation based on character
    let blockPath;
    if (characterId === 'curse-or') {
        blockPath = '../assests/players/character_1/Right_Block-ezgif.com-gif-maker.gif';
    } else if (characterId === 'reign') {
        blockPath = '../assests/players/character_2/2_Right_block.gif';
    }
    
    // Apply the block animation
    if (blockPath) {
        playerImage.style.backgroundImage = `url(${blockPath})`;
        
        // Preserve the correct orientation and scaling
        const player1IsOnRight = gameState.player1.position > gameState.player2.position;
        
        if (player === gameState.player1) {
            if (characterId === 'reign') {
                playerImage.style.transform = player1IsOnRight ? 'scaleX(-1) scale(0.85)' : 'scaleX(1) scale(0.85)';
            } else {
                playerImage.style.transform = player1IsOnRight ? 'scaleX(-1)' : 'scaleX(1)';
            }
        } else {
            if (characterId === 'reign') {
                playerImage.style.transform = player1IsOnRight ? 'scaleX(1) scale(0.85)' : 'scaleX(-1) scale(0.85)';
            } else {
                playerImage.style.transform = player1IsOnRight ? 'scaleX(1)' : 'scaleX(-1)';
            }
        }
    }
}

// Add function to show stamina warning
function showStaminaWarning(player) {
    if (!player.staminaBar) return;
    
    const warning = player.staminaBar.querySelector('.stamina-warning');
    if (warning) {
        warning.classList.add('show');
        setTimeout(() => {
            warning.classList.remove('show');
        }, 1000);
    }
}

function stopGuardPlayer(player) {
    const isPlayer1 = player === gameState.player1;
    
    // Clear guard state immediately
    player.isGuarding = false;
    
    // Stop and clean up shield sound
    if (player.chargingSound) {
        player.chargingSound.pause();
        player.chargingSound = null;
    }
    
    // Reset to idle animation
    resetPlayerIdleImage(player);
    
    console.log('Guard deactivated:', isPlayer1 ? 'Player 1' : 'Player 2', {
        isGuarding: player.isGuarding,
        guardKey: isPlayer1 ? gameState.keys.player1.guard : gameState.keys.player2.guard
    });
}

// Update attack player function to remove combo logic
function attackPlayer(player, attackType) {
    const isPlayer1 = player === gameState.player1;
    
    // Don't allow attacks during other actions
    if (player.isAttacking || player.isJumping || player.isDodging || 
        player.isGuarding || 
        (isPlayer1 ? gameState.keys.player1.guard : gameState.keys.player2.guard)) {
        return;
    }
    
    player.isAttacking = true;
    player.attackType = attackType;

    const playerImage = player.element?.querySelector('.fighter-image');
    if (!playerImage) return;
    
    // Get the character ID and set attack animation
    const characterId = isPlayer1 ? gameState.player1.character : gameState.player2.character;
    let attackPath = getAttackAnimationPath(characterId, attackType);
    
    if (attackPath) {
        playerImage.style.backgroundImage = `url(${attackPath})`;

        // Play attack sound based on character and attack type
        if (characterId === 'curse-or' && attackType === 'punch') {
            // Curse-or punch sounds with layered effects
            const punchSound1 = new Audio('../assests/audio/FightSFX/Punch/punch_short_whoosh_16.wav');
            const punchSound2 = new Audio('../assests/audio/FightSFX/Punch/punch_short_whoosh_30.wav');
            punchSound1.volume = 0.45;
            punchSound2.volume = 0.25;
            punchSound1.playbackRate = 1.0 + (Math.random() * 0.4); // 1.0 to 1.4
            punchSound2.playbackRate = 1.2 + (Math.random() * 0.3); // 1.2 to 1.5
            punchSound1.play().catch(e => console.warn('Sound play failed:', e));
            setTimeout(() => {
                punchSound2.play().catch(e => console.warn('Sound play failed:', e));
            }, 10);
        } else if (characterId === 'curse-or' && attackType === 'kick') {
            // Curse-or kick sound with layered effects
            const kickSound = new Audio('../assests/audio/FightSFX/Kick/kick_short_whoosh_12.wav');
            kickSound.volume = 0.5;
            kickSound.playbackRate = 0.9 + (Math.random() * 0.4); // 0.9 to 1.3
            kickSound.play().catch(e => console.warn('Sound play failed:', e));
        } else if (characterId === 'reign' && attackType === 'punch') {
            // Reign punch sounds with layered effects
            const punchSound1 = new Audio('../assests/audio/FightSFX/Punch/punch_short_whoosh_16.wav');
            const punchSound2 = new Audio('../assests/audio/FightSFX/Punch/punch_short_whoosh_30.wav');
            punchSound1.volume = 0.45;
            punchSound2.volume = 0.25;
            punchSound1.playbackRate = 1.0 + (Math.random() * 0.4); // 1.0 to 1.4
            punchSound2.playbackRate = 1.2 + (Math.random() * 0.3); // 1.2 to 1.5
            punchSound1.play().catch(e => console.warn('Sound play failed:', e));
            setTimeout(() => {
                punchSound2.play().catch(e => console.warn('Sound play failed:', e));
            }, 10);
        } else if (characterId === 'reign' && attackType === 'kick') {
            // Reign kick sound with layered effects
            const kickSound = new Audio('../assests/audio/FightSFX/Kick/kick_short_whoosh_23.wav');
            kickSound.volume = 0.5;
            kickSound.playbackRate = 0.9 + (Math.random() * 0.4); // 0.9 to 1.3
            kickSound.play().catch(e => console.warn('Sound play failed:', e));
        }
        
        // Determine the defender
        const defender = isPlayer1 ? gameState.player2 : gameState.player1;
        const distance = Math.abs(player.position - defender.position);
        
        // Check for hit
        if (distance < 50) {
            if (defender.isGuarding) {
                showBlockedEffect(defender);
            } else {
                // Apply damage based on attack type
                const damage = attackType === 'punch' ? 5 : 7; // 5 for punch, 7 for kick
                applyDamage(defender, damage);
                showHitEffect(defender);
                showAttackText(player, attackType);
            }
        }
        
        // Reset to idle after attack
        setTimeout(() => {
            resetPlayerIdleImage(player);
            player.isAttacking = false;
            player.attackType = null;
        }, 250);
    }
}

// Helper function to get attack animation path
function getAttackAnimationPath(characterId, attackType) {
    if (characterId === 'curse-or') {
        return attackType === 'punch' 
            ? '../assests/players/character_1/Right_Punch_1-ezgif.com-gif-maker.gif'
            : '../assests/players/character_1/Right_Kick1-ezgif.com-gif-maker.gif';
    } else if (characterId === 'reign') {
        return attackType === 'punch'
            ? '../assests/players/character_2/2_Rightpunch_1.gif'
            : '../assests/players/character_2/2_Right_kick_1.gif';
    }
    return null;
}

function showBlockedEffect(player) {
    // Add blocked animation class
    if (player.element) {
        player.element.classList.add('blocked');
        
        // Remove blocked animation class after a short delay
        setTimeout(() => {
            player.element.classList.remove('blocked');
        }, 200);
    }
    
    // Heal player when successfully blocking
    healPlayer(player, 3);
    
    // Play random block sound with increased volume
    const blockSounds = [
        '../assests/audio/FightSFX/Block/block1.wav',
        '../assests/audio/FightSFX/Block/block2.wav',
        '../assests/audio/FightSFX/Block/block3.wav'
    ];
    
    // Select a random sound
    const randomIndex = Math.floor(Math.random() * blockSounds.length);
    const blockSound = new Audio(blockSounds[randomIndex]);
    blockSound.volume = 0.9; // Increased from 0.7 to 0.9
    blockSound.playbackRate = 0.9 + (Math.random() * 0.4); // Random pitch between 0.9 and 1.3
    blockSound.play().catch(e => console.warn('Block sound play failed:', e));
}

function showDodgedEffect(player) {
    // Add dodged animation class
    if (player.element) {
        player.element.classList.add('dodged');
        
        // Remove dodged animation class after a short delay
        setTimeout(() => {
            player.element.classList.remove('dodged');
        }, 200);
    }
    
    // Play dodge sound
    playSound('dodge');
}

// Modify the applyDamage function to remove blood overlay
function applyDamage(player, amount) {
    // Store previous health for comparison
    const previousHealth = player.health;
    
    // Update last damage taken time
    player.lastDamageTaken = Date.now();
    
    // Reduce player health
    player.health -= amount;
    if (player.health < 0) player.health = 0;
    
    // Update health bar
    updateHealthBar(player);
    
    // Show hit effect
    showHitEffect(player);
    
    // Add screen shake for significant damage
    if (amount >= 10) {
        const fightArena = document.getElementById('fightArena');
        if (fightArena) {
            fightArena.classList.add('screen-shake');
            setTimeout(() => fightArena.classList.remove('screen-shake'), 300);
        }
    }
    
    // Check for knockout
    if (player.health <= 0) {
        gameState.gameOver = true;
        gameState.winner = player === gameState.player1 ? gameState.player2 : gameState.player1;
    }
}

function showHitEffect(player) {
    if (!player.element) return;
    
    const playerImage = player.element.querySelector('.fighter-image');
    if (!playerImage) return;
    
    // Store the current transform to preserve orientation
    const currentTransform = playerImage.style.transform;
    
    // Add hit class for animation
    player.element.classList.add('hit');

    // Play hit sound effect with variance
    const hitSounds = [
        '../assests/audio/FightSFX/Damage/body_hit_large_32.wav',
        '../assests/audio/FightSFX/Damage/body_hit_large_44.wav',
        '../assests/audio/FightSFX/Damage/body_hit_large_76.wav',
        '../assests/audio/FightSFX/Damage/body_hit_small_11.wav',
        '../assests/audio/FightSFX/Damage/body_hit_small_20.wav',
        '../assests/audio/FightSFX/Damage/body_hit_small_23.wav',
        '../assests/audio/FightSFX/Damage/body_hit_small_79.wav'
    ];

    // Get the last played sound index from the player's state or initialize it
    if (!player.lastHitSoundIndex) player.lastHitSoundIndex = -1;

    // Filter out the last played sound to avoid repetition
    const availableSounds = hitSounds.filter((_, index) => index !== player.lastHitSoundIndex);
    
    // Select a random sound from the available ones
    const randomIndex = Math.floor(Math.random() * availableSounds.length);
    const selectedSound = availableSounds[randomIndex];
    
    // Update the last played sound index
    player.lastHitSoundIndex = hitSounds.indexOf(selectedSound);

    // Create and play the hit sound with slight pitch variation
    const hitSound = new Audio(selectedSound);
    hitSound.volume = 0.6;
    hitSound.playbackRate = 0.9 + (Math.random() * 0.2); // Random pitch between 0.9 and 1.1
    hitSound.play().catch(e => console.warn('Sound play failed:', e));
    
    // Get the character ID
    const characterId = player === gameState.player1 ? gameState.player1.character : gameState.player2.character;
    
    // Set the correct hit animation based on character
    let hitPath;
    if (characterId === 'curse-or') {
        hitPath = '../assests/players/character_1/Right_got_hit-ezgif.com-gif-maker.gif';
    } else {
        hitPath = '../assests/players/character_2/2_Right_got_hit.gif';
    }
    
    // Apply the hit animation immediately
    if (hitPath) {
        playerImage.style.backgroundImage = `url(${hitPath})`;
        playerImage.style.transform = currentTransform;
        
        // Add screen shake effect to the entire fight arena
        const fightArena = document.getElementById('fightArena');
        if (fightArena) {
            fightArena.classList.add('screen-shake');
            setTimeout(() => {
                fightArena.classList.remove('screen-shake');
            }, 300);
        }

        // Create container for hit outline
        const hitOutlineContainer = document.createElement('div');
        hitOutlineContainer.style.position = 'absolute';
        hitOutlineContainer.style.width = '100%';
        hitOutlineContainer.style.height = '100%';
        hitOutlineContainer.style.bottom = '0';
        hitOutlineContainer.style.left = '0';
        hitOutlineContainer.style.pointerEvents = 'none';

        // Create glowing outline effect
        const hitOutline = document.createElement('div');
        hitOutline.className = 'hit-outline';
        
        // Set specific styles based on character
        if (characterId === 'curse-or') {
            hitOutline.style.width = '150px';
            hitOutline.style.height = '260px';
            hitOutline.style.backgroundImage = `url(${hitPath})`;
            hitOutline.style.transform = currentTransform;
            hitOutlineContainer.style.bottom = '40px';
            hitOutline.style.top = '-60px';  // Add top offset for Curse-Or
        } else {
            hitOutline.style.width = '100px';
            hitOutline.style.height = '150px';
            hitOutline.style.backgroundImage = `url(${hitPath})`;
            hitOutline.style.transform = `${currentTransform} scale(0.85)`;
        }

        // Add outline to container
        hitOutlineContainer.appendChild(hitOutline);
        player.element.appendChild(hitOutlineContainer);

        // Remove outline after animation
        setTimeout(() => {
            hitOutlineContainer.remove();
        }, 300);

        // Add pushback effect
        const pushbackAmount = 15;
        const currentPosition = player.position;
        const newPosition = player === gameState.player1 ? 
            currentPosition - pushbackAmount : 
            currentPosition + pushbackAmount;
            
        // Update position with pushback
        player.position = newPosition;
        player.element.style.left = newPosition + 'px';
    }
    
    // Remove hit class and reset to idle after animation
    setTimeout(() => {
        player.element.classList.remove('hit');
        resetPlayerIdleImage(player);
    }, 800);
}

// Add new function for attack text effects
function showAttackText(player, attackType) {
    if (!player.element) return;
    
    // Create attack text element
    const attackText = document.createElement('div');
    attackText.className = 'attack-text';
    
    // Set text based on attack type
    if (attackType === 'punch') {
        attackText.textContent = 'PHAU!';
    } else if (attackType === 'kick') {
        attackText.textContent = 'WOOSH!';
    }
    
    // Add text to player element
    player.element.appendChild(attackText);
    
    // Remove text after animation
    setTimeout(() => {
        attackText.remove();
    }, 500);
}

function playSound(soundType) {
    // Play sound effect
    const sound = new Audio(`../assets/sounds/${soundType}.mp3`);
    sound.volume = 0.5;
    sound.play().catch(e => console.warn('Sound play failed:', e));
}

function updateGameState() {
    // Update player positions
    if (gameState.player1.element) {
        gameState.player1.element.style.left = gameState.player1.position + 'px';
        console.log('Player 1 position:', gameState.player1.position);
    }
    if (gameState.player2.element) {
        gameState.player2.element.style.left = gameState.player2.position + 'px';
        console.log('Player 2 position:', gameState.player2.position);
    }
    
    // Update player directions (flip sprites)
    if (gameState.player1.position > gameState.player2.position) {
        // Player 1 is to the right of Player 2
        gameState.player1.element.classList.add('facing-left');
        gameState.player2.element.classList.remove('facing-left');
    } else {
        // Player 1 is to the left of Player 2
        gameState.player1.element.classList.remove('facing-left');
        gameState.player2.element.classList.add('facing-left');
    }
}

function renderGame() {
    // Update player positions
    if (gameState.player1.element && gameState.player2.element) {
        // Update positions
        gameState.player1.element.style.left = gameState.player1.position + 'px';
        gameState.player2.element.style.left = gameState.player2.position + 'px';

        // Update orientations only if not in any animation
        const player1Image = gameState.player1.element.querySelector('.fighter-image');
        const player2Image = gameState.player2.element.querySelector('.fighter-image');
        
        if (player1Image && !player1Image.classList.contains('jumping') && 
            !player1Image.classList.contains('punch') && 
            !player1Image.classList.contains('kick') && 
            !player1Image.classList.contains('hit')) {
            
            const player1IsOnRight = gameState.player1.position > gameState.player2.position;
            if (gameState.player1.character === 'reign') {
                player1Image.style.transform = player1IsOnRight ? 'scaleX(-1) scale(0.85)' : 'scaleX(1) scale(0.85)';
            } else {
                player1Image.style.transform = player1IsOnRight ? 'scaleX(-1)' : 'scaleX(1)';
            }
        }
        
        if (player2Image && !player2Image.classList.contains('jumping') && 
            !player2Image.classList.contains('punch') && 
            !player2Image.classList.contains('kick') && 
            !player2Image.classList.contains('hit')) {
            
            const player2IsOnRight = gameState.player2.position > gameState.player1.position;
            if (gameState.player2.character === 'reign') {
                player2Image.style.transform = player2IsOnRight ? 'scaleX(-1) scale(0.85)' : 'scaleX(1) scale(0.85)';
            } else {
                player2Image.style.transform = player2IsOnRight ? 'scaleX(-1)' : 'scaleX(1)';
            }
        }
    }
    
    // Update debug overlay if it exists
    updateDebugOverlay();
}

function endGame() {
    cancelAnimationFrame(gameState.animationFrame);
    
    // Show winner
    const fightText = document.getElementById('fightText');
    if (fightText) {
        fightText.style.display = 'block';
        
        // Get the winner's character ID
        const winnerId = gameState.winner === gameState.player1 ? gameState.player1.character : gameState.player2.character;
        
        // Format the winner message based on the character
        const winnerName = formatCharacterName(winnerId);
        fightText.textContent = `${winnerName} WINS!`;
        
        fightText.style.transform = 'scale(1)';
        fightText.style.opacity = '1';
    }
    
    // Play victory sound
    playSound('victory');
    
    // Show replay button
    const replayButton = document.createElement('button');
    replayButton.textContent = 'PLAY AGAIN';
    replayButton.id = 'replayButton';
    replayButton.onclick = () => window.location.reload();
    
    const controls = document.getElementById('controls');
    if (controls) {
        controls.appendChild(replayButton);
    }
}

function setupMapBackground(mapId, container) {
    if (!container) return;
    
    // Map IDs to the actual GIF filenames
    const mapFiles = {
        'temple': 'Celestial_Palace.gif',
        'palace': 'Haunted.gif',
        'pit': 'TheChinaTown.gif',
        'bridge': 'Giaia.gif'
    };
    
    // Get the correct filename for the selected map
    const mapFile = mapFiles[mapId] || 'Celestial_Palace.gif';
    
    // Set the background image directly from the assests folder
    container.style.backgroundImage = `url(../assests/maps/${mapFile})`;
    container.style.backgroundSize = 'cover';
    container.style.backgroundPosition = 'center';
    container.style.backgroundRepeat = 'no-repeat';
    
    // Map names for the watermark
    const mapNames = {
        'temple': 'TEMPLE',
        'palace': 'PALACE',
        'pit': 'THE PIT',
        'bridge': 'DEAD POOL'
    };
    
    console.log(`Loading map background: ${mapId} (${mapFile})`);
}

function setupFighters(player1Character, player2Character) {
    console.log('Setting up fighters:', player1Character, player2Character);
    
    // Get player elements
    const player1 = document.getElementById('player1');
    const player2 = document.getElementById('player2');
    const player1Image = player1?.querySelector('.fighter-image');
    const player2Image = player2?.querySelector('.fighter-image');
    
    // Set character IDs as data attributes
    if (player1) player1.setAttribute('data-character', player1Character);
    if (player2) player2.setAttribute('data-character', player2Character);
    
    // Common size settings for both characters
    const characterSettings = {
        'curse-or': {
            hitboxWidth: '150px',
            hitboxHeight: '150px',
            imageWidth: '150px',
            imageHeight: '260px',  // Reduced from 280px to 260px
            scale: 1,
            bottomOffset: '40px'   // Increased from 20px to 40px to position lower
        },
        'reign': {
            hitboxWidth: '150px',
            hitboxHeight: '150px',
            imageWidth: '100px',
            imageHeight: '150px',
            scale: 0.5
        }
    };

    // Add style to remove all debug elements
    const style = document.createElement('style');
    style.textContent = `
        .fighter-image {
            border: none !important;
            outline: none !important;
            box-shadow: none !important;
        }
        .fighter-debug, .debug-info {
            display: none !important;
        }
        #debugOverlay {
            display: none !important;
        }
    `;
    document.head.appendChild(style);
    
    // Set up player 1's image
    if (player1Image) {
        const p1Settings = characterSettings[player1Character];
        if (player1Character === 'curse-or') {
            player1Image.style.backgroundImage = 'url("../assests/players/character_1/Right_idle.gif")';
            player1Image.style.width = p1Settings.imageWidth;
            player1Image.style.height = p1Settings.imageHeight;
            player1Image.style.backgroundSize = `${p1Settings.imageWidth} ${p1Settings.imageHeight}`;
            player1Image.style.bottom = p1Settings.bottomOffset || '0';  // Apply bottom offset for Curse-Or
        } else if (player1Character === 'reign') {
            player1Image.style.backgroundImage = 'url("../assests/players/character_2/2_Right_idle.gif")';
            player1Image.style.width = p1Settings.imageWidth;
            player1Image.style.height = p1Settings.imageHeight;
            player1Image.style.backgroundSize = `${p1Settings.imageWidth} ${p1Settings.imageHeight}`;
        }
        player1Image.style.backgroundPosition = 'center bottom';
        player1Image.style.backgroundRepeat = 'no-repeat';
        
        // Set hitbox size using the new hitbox dimensions
        if (player1) {
            player1.style.width = p1Settings.hitboxWidth;
            player1.style.height = p1Settings.hitboxHeight;
            
            player1.style.boxSizing = 'border-box';
            player1.style.display = 'flex';
            player1.style.justifyContent = 'center';
            player1.style.alignItems = 'flex-end';
        }
        
        // Apply initial transform with correct scale
        if (player1Character === 'reign') {
            player1Image.style.transform = `scaleX(1) scale(${p1Settings.scale})`;
        } else {
            player1Image.style.transform = 'scaleX(1)';
        }
    }
    
    // Set up player 2's image with similar changes...
    if (player2Image) {
        const p2Settings = characterSettings[player2Character];
        if (player2Character === 'curse-or') {
            player2Image.style.backgroundImage = 'url("../assests/players/character_1/Right_idle.gif")';
            player2Image.style.width = p2Settings.imageWidth;
            player2Image.style.height = p2Settings.imageHeight;
            player2Image.style.backgroundSize = `${p2Settings.imageWidth} ${p2Settings.imageHeight}`;
            player2Image.style.bottom = p2Settings.bottomOffset || '0';  // Apply bottom offset for Curse-Or
        } else if (player2Character === 'reign') {
            player2Image.style.backgroundImage = 'url("../assests/players/character_2/2_Right_idle.gif")';
            player2Image.style.width = p2Settings.imageWidth;
            player2Image.style.height = p2Settings.imageHeight;
            player2Image.style.backgroundSize = `${p2Settings.imageWidth} ${p2Settings.imageHeight}`;
        }
        player2Image.style.backgroundPosition = 'center bottom';
        player2Image.style.backgroundRepeat = 'no-repeat';
        
        // Set hitbox size using the new hitbox dimensions
        if (player2) {
            player2.style.width = p2Settings.hitboxWidth;
            player2.style.height = p2Settings.hitboxHeight;
          
            player2.style.boxSizing = 'border-box';
            player2.style.display = 'flex';
            player2.style.justifyContent = 'center';
            player2.style.alignItems = 'flex-end';
        }
        
        // Apply initial transform with correct scale
        if (player2Character === 'reign') {
            player2Image.style.transform = `scaleX(-1) scale(${p2Settings.scale})`;
        } else {
            player2Image.style.transform = 'scaleX(-1)';
        }
    }
    
    // Set player names
    const player1Name = player1?.querySelector('.fighter-name');
    const player2Name = player2?.querySelector('.fighter-name');
    
    if (player1Name) player1Name.textContent = formatCharacterName(player1Character);
    if (player2Name) player2Name.textContent = formatCharacterName(player2Character);
    
    // Remove debug logging
    console.log('Fighters initialized');
}

function formatCharacterName(id) {
    // Return the correct character name based on the character ID
    switch(id) {
        case 'curse-or':
            return 'CURSE-OR';
        case 'reign':
            return 'REIGN';
        default:
            return id.toUpperCase();
    }
}

function setupGameTimer() {
    let timeLeft = 60;
    const timerElement = document.querySelector('.timer');
    
    if (!timerElement) return;
  
  const gameTimer = setInterval(() => {
      timeLeft--;
      timerElement.textContent = timeLeft;
      
      if (timeLeft <= 0) {
          clearInterval(gameTimer);
            // Handle time over - show time's up message
            document.getElementById('fightText').textContent = "TIME'S UP!";
      }
  }, 1000);
}

function animateFightText() {
    const fightText = document.getElementById('fightText');
    
    if (!fightText) return;
    
    // Initial animation
    fightText.style.transform = 'scale(0)';
    fightText.style.opacity = '0';
    
    setTimeout(() => {
        fightText.style.transition = 'all 0.5s ease';
        fightText.style.transform = 'scale(1)';
        fightText.style.opacity = '1';
    }, 500);
}

function recordSpecialMoveKey(player, key) {
    const isPlayer1 = player === gameState.player1;
    const specialMoveState = isPlayer1 ? gameState.specialMoves.player1 : gameState.specialMoves.player2;
    
    const currentTime = Date.now();
    
    // Check if this is a new sequence (more than 1 second since last key)
    if (currentTime - specialMoveState.lastKeyTime > 1000) {
        specialMoveState.sequence = [];
    }
    
    // Add key to sequence
    specialMoveState.sequence.push(key);
    
    // Keep only the last 5 keys
    if (specialMoveState.sequence.length > 5) {
        specialMoveState.sequence.shift();
    }
    
    // Update last key time
    specialMoveState.lastKeyTime = currentTime;
    
    // Check for special moves
    checkSpecialMoves(player);
}

function checkSpecialMoves(player) {
    if (player.isAttacking || gameState.specialMoves.player1.cooldown || gameState.specialMoves.player2.cooldown) {
        return;
    }
    
    const isPlayer1 = player === gameState.player1;
    const specialMoveState = isPlayer1 ? gameState.specialMoves.player1 : gameState.specialMoves.player2;
    const sequence = specialMoveState.sequence.join(',');
    
    // Define special moves based on character
    const specialMoves = getSpecialMovesForCharacter(player.character);
    
    // Check if sequence matches any special move
    for (const move of specialMoves) {
        if (sequence.endsWith(move.sequence)) {
            // Execute special move
            executeSpecialMove(player, move);
            
            // Clear sequence after executing special move
            specialMoveState.sequence = [];
            
            // Set cooldown
            const cooldownObj = isPlayer1 ? gameState.specialMoves.player1 : gameState.specialMoves.player2;
            cooldownObj.cooldown = true;
            setTimeout(() => {
                cooldownObj.cooldown = false;
            }, 2000); // 2 second cooldown
            
            break;
        }
    }
}

function getSpecialMovesForCharacter(character) {
    // Define special moves for each character
    const specialMovesByCharacter = {
        'curse-or': [
            { name: 'Spear', sequence: 'down,down,punch', damage: 25, animation: 'spear' },
            { name: 'Fire Breath', sequence: 'down,right,punch', damage: 20, animation: 'firebreath' }
        ],
        'reign': [
            { name: 'Ice Ball', sequence: 'down,right,punch', damage: 15, animation: 'iceball' },
            { name: 'Slide', sequence: 'down,left,kick', damage: 20, animation: 'slide' }
        ],
        'default': [
            { name: 'Super Punch', sequence: 'right,right,punch', damage: 20, animation: 'superpunch' },
            { name: 'Super Kick', sequence: 'left,left,kick', damage: 25, animation: 'superkick' }
        ]
    };
    
    // Return character-specific moves or default moves
    return specialMovesByCharacter[character] || specialMovesByCharacter.default;
}

function executeSpecialMove(player, move) {
    console.log(`${player === gameState.player1 ? 'Player 1' : 'Player 2'} executed ${move.name}!`);
    
    // Add special move animation class
    if (player.element) {
        player.element.classList.add(move.animation);
        
        // Show special move name
        showSpecialMoveName(player, move.name);
        
        // Play special move sound
        playSound('special');
        
        // Remove animation class after animation completes
        setTimeout(() => {
            player.element.classList.remove(move.animation);
        }, 1000);
    }
    
    // Determine the opponent
    const opponent = player === gameState.player1 ? gameState.player2 : gameState.player1;
    
    // Calculate distance between players
    const distance = Math.abs(player.position - opponent.position);
    
    // Check if players are close enough for a hit (special moves have longer range - increased from 300 to 400)
    if (distance < 400) {
        // Check if opponent is guarding
        if (!opponent.isGuarding) {
            // Apply damage to opponent
            applyDamage(opponent, move.damage);
            
            // Show hit effect
            showHitEffect(opponent);
        } else {
            // Opponent is guarding - show blocked effect
            showBlockedEffect(opponent);
        }
    }
}

function showSpecialMoveName(player, moveName) {
    // Create element to show special move name
    const specialMoveElement = document.createElement('div');
    specialMoveElement.className = 'special-move-name';
    specialMoveElement.textContent = moveName;
    player.element.appendChild(specialMoveElement);
    
    // Remove combo animation class and text after animation
    setTimeout(() => {
        specialMoveElement.remove();
    }, 1500);
}

function createDebugOverlay() {
    // Create debug overlay
    const debugOverlay = document.createElement('div');
    debugOverlay.id = 'debugOverlay';
    debugOverlay.style.position = 'fixed';
    debugOverlay.style.top = '10px';
    debugOverlay.style.right = '10px';
    debugOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    debugOverlay.style.color = '#fff';
    debugOverlay.style.padding = '10px';
    debugOverlay.style.borderRadius = '5px';
    debugOverlay.style.zIndex = '1000';
    debugOverlay.style.fontSize = '12px';
    debugOverlay.style.maxWidth = '300px';
    
    document.body.appendChild(debugOverlay);
}

function updateDebugOverlay() {
    const debugOverlay = document.getElementById('debugOverlay');
    if (!debugOverlay) return;
    
    // Format game state for display
    const p1 = gameState.player1;
    const p2 = gameState.player2;
    
    const debugInfo = `
        <h3>Debug Info</h3>
        <p><strong>Player 1:</strong> ${p1.character}</p>
        <p>Position: ${Math.round(p1.position)}</p>
        <p>Health: ${p1.health}</p>
        <p>State: ${getPlayerStateText(p1)}</p>
        <hr>
        <p><strong>Player 2:</strong> ${p2.character}</p>
        <p>Position: ${Math.round(p2.position)}</p>
        <p>Health: ${p2.health}</p>
        <p>State: ${getPlayerStateText(p2)}</p>
        <hr>
        <p>Arena width: ${gameState.arena.width}</p>
        <p>Left boundary: ${gameState.arena.boundaries.left}</p>
        <p>Right boundary: ${gameState.arena.boundaries.right}</p>
        <hr>
        <p>Keys: ${getActiveKeysText()}</p>
    `;
    
    debugOverlay.innerHTML = debugInfo;
}

function getPlayerStateText(player) {
    let state = [];
    if (player.isJumping) state.push('Jumping');
    if (player.isGuarding) state.push('Guarding');
    if (player.isAttacking) state.push(player.attackType);
    
    return state.length > 0 ? state.join(', ') : 'Standing';
}

function getActiveKeysText() {
    const p1Keys = Object.entries(gameState.keys.player1)
        .filter(([_, value]) => value)
        .map(([key]) => key);
    
    const p2Keys = Object.entries(gameState.keys.player2)
        .filter(([_, value]) => value)
        .map(([key]) => key);
    
    return `P1: ${p1Keys.join(',')} | P2: ${p2Keys.join(',')}`;
}

function updateHealthBar(player) {
    // Update health bar with percentage
    if (player.healthBar) {
        const percentage = player.health;
        player.healthBar.style.width = percentage + '%';
        
        // Update color based on health percentage and add low health effect
        if (percentage <= 20) {
            player.healthBar.classList.add('low');
        } else {
            player.healthBar.classList.remove('low');
        }
        
        // Add damage flash effect
        player.healthBar.classList.add('damage');
        setTimeout(() => {
            player.healthBar.classList.remove('damage');
        }, 300);
        
        // Update health text with more dramatic formatting
        player.healthBar.textContent = `${Math.round(percentage)}%`;

        // Calculate opacity based on missing health (100% - current health%)
        const opacity = (100 - percentage) / 100; // When health is 100%, opacity will be 0
        
        // Update blood overlay opacity based on player health
        if (player === gameState.player1) {
            const leftOverlay = document.getElementById('left-blood-overlay');
            if (leftOverlay) {
                leftOverlay.style.opacity = opacity.toString();
            }
        } else {
            const rightOverlay = document.getElementById('right-blood-overlay');
            if (rightOverlay) {
                rightOverlay.style.opacity = opacity.toString();
            }
        }

        // Update center blood overlay based on average health
        const centerOverlay = document.getElementById('center-blood-overlay');
        if (centerOverlay) {
            const averageHealth = (gameState.player1.health + gameState.player2.health) / 2;
            const centerOpacity = (100 - averageHealth) / 100;
            centerOverlay.style.opacity = centerOpacity.toString();
        }
    }
}

// Function to ensure images are loaded correctly
function ensureImagesLoaded(player1Id, player2Id) {
    console.log('Checking if images are loaded correctly...');
    
    const player1Element = document.getElementById('player1');
    const player2Element = document.getElementById('player2');
    const player1Image = document.querySelector('#player1 .fighter-image');
    const player2Image = document.querySelector('#player2 .fighter-image');
    
    // Check if player 1 image is loaded
    if (!player1Image.style.backgroundImage || player1Image.style.backgroundImage === 'none') {
        console.warn('Player 1 image not loaded, fixing...');
        let player1ImagePath;
        
        if (player1Id === 'curse-or') {
            player1ImagePath = '../assests/players/character_1/Right_idle.gif';
        } else if (player1Id === 'reign') {
            player1ImagePath = '../assests/players/character_2/2_Right_idle.gif';
        } else {
            player1ImagePath = '../assests/players/character_1/Right_idle.gif';
        }
        
        player1Image.style.backgroundImage = `url(${player1ImagePath})`;
        player1Image.style.backgroundSize = 'contain';
        player1Image.style.backgroundPosition = 'center bottom';
        player1Image.style.backgroundRepeat = 'no-repeat';
        player1Image.style.backgroundColor = 'transparent';
    }
    
    // Check if player 2 image is loaded
    if (!player2Image.style.backgroundImage || player2Image.style.backgroundImage === 'none') {
        console.warn('Player 2 image not loaded, fixing...');
        let player2ImagePath;
        
        if (player2Id === 'curse-or') {
            player2ImagePath = '../assests/players/character_1/Right_idle.gif';
        } else if (player2Id === 'reign') {
            player2ImagePath = '../assests/players/character_2/2_Right_idle.gif';
        } else {
            player2ImagePath = '../assests/players/character_2/2_Right_idle.gif';
        }
        
        player2Image.style.backgroundImage = `url(${player2ImagePath})`;
        player2Image.style.backgroundSize = 'contain';
        player2Image.style.backgroundPosition = 'center bottom';
        player2Image.style.backgroundRepeat = 'no-repeat';
        player2Image.style.backgroundColor = 'transparent';
    }
    
    // Remove any facing classes that might interfere
    if (player1Element) {
        player1Element.classList.remove('facing-left', 'facing-right');
        
        // Set initial orientation - Player 1 starts on left, facing right
        player1Image.style.transform = 'scaleX(1)';
    }
    
    if (player2Element) {
        player2Element.classList.remove('facing-left', 'facing-right');
        
        // Set initial orientation - Player 2 starts on right, facing left
        if (player2Id === 'reign' && player2Image) {
            player2Image.style.transform = 'scaleX(-1) scale(0.85)';
        } else if (player2Image) {
            player2Image.style.transform = 'scaleX(-1)';
        }
    }
    
    console.log('Image check complete.');
}

// Add these new functions after the movePlayer function
function updatePlayerMovementImage(player, direction) {
    if (!player.element) return;
    
    const playerImage = player.element.querySelector('.fighter-image');
    if (!playerImage) return;
    
    const characterId = player === gameState.player1 ? gameState.player1.character : gameState.player2.character;
    
    // Debug log to check character ID
    console.log(`updatePlayerMovementImage - Player: ${player === gameState.player1 ? 'Player 1' : 'Player 2'}, Character ID: ${characterId}, Direction: ${direction}`);
    
    let imagePath;
    
    // If direction is 0 or not provided, reset to idle image
    if (!direction) {
        resetPlayerIdleImage(player);
        return;
    }
    
    // Determine if players have crossed each other
    const player1IsOnRight = gameState.player1.position > gameState.player2.position;
    
    // For Player 1
    if (player === gameState.player1) {
        // Determine the correct image path based on character and direction
        if (characterId === 'curse-or') {
            // Curse-or
            if ((direction === 1 && !player1IsOnRight) || (direction === -1 && player1IsOnRight)) {
                // Moving forward (towards opponent)
                imagePath = '../assests/players/character_1/Right_Move_Forward.png';
            } else {
                // Moving backward (away from opponent)
                imagePath = '../assests/players/character_1/Right_Move_Backward.png';
            }
        } else {
            // Reign
            if ((direction === 1 && !player1IsOnRight) || (direction === -1 && player1IsOnRight)) {
                // Moving forward (towards opponent)
                imagePath = '../assests/players/character_2/2_Right_move_foward.png';
            } else {
                // Moving backward (away from opponent)
                imagePath = '../assests/players/character_2/2_Right_move_backwards.png';
            }
        }
    } 
    // For Player 2
    else {
        // Determine the correct image path based on character and direction
        if (characterId === 'curse-or') {
            // Curse-or
            if ((direction === 1 && player1IsOnRight) || (direction === -1 && !player1IsOnRight)) {
                // Moving forward (towards opponent)
                imagePath = '../assests/players/character_1/Right_Move_Forward.png';
            } else {
                // Moving backward (away from opponent)
                imagePath = '../assests/players/character_1/Right_Move_Backward.png';
            }
        } else {
            // Reign
            if ((direction === 1 && player1IsOnRight) || (direction === -1 && !player1IsOnRight)) {
                // Moving forward (towards opponent)
                imagePath = '../assests/players/character_2/2_Right_move_foward.png';
            } else {
                // Moving backward (away from opponent)
                imagePath = '../assests/players/character_2/2_Right_move_backwards.png';
            }
        }
    }
    
    // Only update if we have a valid image path
    if (imagePath) {
        console.log(`Updating ${player === gameState.player1 ? 'Player 1' : 'Player 2'} movement image: ${imagePath}`);
        playerImage.style.backgroundImage = `url(${imagePath})`;
        
        // Preserve the correct orientation for Reign
        if (characterId !== 'curse-or') {
            // For Reign, we need to maintain the scale(0.85) transform
            if (player === gameState.player1) {
                playerImage.style.transform = 'scaleX(-1) scale(0.85)';
            } else {
                playerImage.style.transform = 'scaleX(1) scale(0.85)';
            }
        }
    } else {
        console.warn(`No valid image path found for ${player === gameState.player1 ? 'Player 1' : 'Player 2'} with character ID: ${characterId}`);
    }
}

function resetPlayerIdleImage(player) {
    if (!player.element) return;
    
    const playerImage = player.element.querySelector('.fighter-image');
    if (!playerImage) return;
    
    // Don't reset image or orientation during jumps
    if (player.isJumping || playerImage.classList.contains('jumping')) {
        return;
    }
    
    const characterId = player === gameState.player1 ? gameState.player1.character : gameState.player2.character;
    
    // Debug log to check character ID
    console.log(`resetPlayerIdleImage - Player: ${player === gameState.player1 ? 'Player 1' : 'Player 2'}, Character ID: ${characterId}`);
    
    let idlePath;
    
    // Determine the correct idle image path based on character
    if (characterId === 'curse-or') {
        // Curse-or
        idlePath = '../assests/players/character_1/Right_idle.gif';
    } else {
        // Reign
        idlePath = '../assests/players/character_2/2_Right_idle.gif';
    }
    
    // Only update if we have a valid image path and player is not in another state
    if (idlePath && !player.isJumping && !player.isAttacking && !player.isGuarding) {
        console.log(`Resetting ${player === gameState.player1 ? 'Player 1' : 'Player 2'} to idle image: ${idlePath}`);
        playerImage.style.backgroundImage = `url(${idlePath})`;
        
        // Preserve the correct orientation for Reign
        if (characterId !== 'curse-or') {
            // Determine if players have crossed each other
            const player1IsOnRight = gameState.player1.position > gameState.player2.position;
            
            // For Reign, we need to maintain the scale(0.85) transform
            if (player === gameState.player1) {
                if (player1IsOnRight) {
                    playerImage.style.transform = 'scaleX(-1) scale(0.85)';
                } else {
                    playerImage.style.transform = 'scaleX(1) scale(0.85)';
                }
            } else {
                if (player1IsOnRight) {
                    playerImage.style.transform = 'scaleX(1) scale(0.85)';
                } else {
                    playerImage.style.transform = 'scaleX(-1) scale(0.85)';
                }
            }
        } else {
            // For Curse-or, just handle the scaleX
            const player1IsOnRight = gameState.player1.position > gameState.player2.position;
            if (player === gameState.player1) {
                playerImage.style.transform = player1IsOnRight ? 'scaleX(-1)' : 'scaleX(1)';
            } else {
                playerImage.style.transform = player1IsOnRight ? 'scaleX(1)' : 'scaleX(-1)';
            }
        }
    }
}

// Add new function for combo effect
function showComboEffect(player, comboName) {
    if (!player.element) return;
    
    // Add combo animation class
    player.element.classList.add('combo-hit');
    
    // Create combo name text
    const comboText = document.createElement('div');
    comboText.className = 'combo-text';
    comboText.textContent = comboName;
    player.element.appendChild(comboText);
    
    // Create combo hit count
    const hitCount = document.createElement('div');
    hitCount.className = 'combo-count';
    hitCount.textContent = 'COMBO x3!';
    player.element.appendChild(hitCount);
    
    // Remove effects after animation
    setTimeout(() => {
        player.element.classList.remove('combo-hit');
        comboText.remove();
        hitCount.remove();
    }, 1500);
    
    // Play combo sound
    playSound('combo');
}

// Add this CSS to handle the multi-stage combo animation
function addComboAnimationStyle() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes comboHitEffect {
            0% { transform: scale(1); filter: brightness(1); }
            25% { transform: scale(1.1); filter: brightness(1.5); }
            50% { transform: scale(1.2); filter: brightness(2); }
            75% { transform: scale(1.1); filter: brightness(1.5); }
            100% { transform: scale(1); filter: brightness(1); }
        }

        .combo-hit {
            animation: comboHitEffect 0.5s ease;
        }

        .combo-text {
            position: absolute;
            top: -70px;
            left: 50%;
            transform: translateX(-50%);
            color: #ff3366;
            font-size: 28px;
            font-weight: bold;
            text-shadow: 
                0 0 10px #ff3366,
                0 0 20px #ff3366,
                0 0 30px #ff3366;
            animation: comboTextEffect 1.5s ease-out forwards;
            pointer-events: none;
            z-index: 1000;
        }

        .combo-count {
            position: absolute;
            top: -40px;
            left: 50%;
            transform: translateX(-50%);
            color: #ffcc00;
            font-size: 24px;
            font-weight: bold;
            text-shadow: 
                0 0 10px #ffcc00,
                0 0 20px #ffcc00,
                0 0 30px #ff9900;
            animation: comboCountEffect 1.5s ease-out forwards;
            pointer-events: none;
            z-index: 1000;
        }

        @keyframes comboTextEffect {
            0% { 
                transform: translateX(-50%) translateY(0) scale(1);
                opacity: 0;
            }
            20% {
                transform: translateX(-50%) translateY(-20px) scale(1.2);
                opacity: 1;
            }
            80% {
                transform: translateX(-50%) translateY(-40px) scale(1.2);
                opacity: 1;
            }
            100% { 
                transform: translateX(-50%) translateY(-60px) scale(1);
                opacity: 0;
            }
        }

        @keyframes comboCountEffect {
            0% { 
                transform: translateX(-50%) translateY(0) scale(1);
                opacity: 0;
            }
            20% {
                transform: translateX(-50%) translateY(-10px) scale(1.2);
                opacity: 1;
            }
            80% {
                transform: translateX(-50%) translateY(-20px) scale(1.2);
                opacity: 1;
            }
            100% { 
                transform: translateX(-50%) translateY(-30px) scale(1);
                opacity: 0;
            }
        }

        .combo-animation {
            animation: comboFlash 0.5s ease-in-out;
        }

        @keyframes comboFlash {
            0% { filter: brightness(1) contrast(1); }
            50% { filter: brightness(1.5) contrast(1.2); }
            100% { filter: brightness(1) contrast(1); }
        }
    `;
    document.head.appendChild(style);
}

function updatePlayerPositions() {
    if (gameState.player1.element) {
        gameState.player1.element.style.left = gameState.player1.position + 'px';
    }
    if (gameState.player2.element) {
        gameState.player2.element.style.left = gameState.player2.position + 'px';
    }
    
    // Update player directions (flip sprites)
    if (gameState.player1.element && gameState.player2.element) {
        const player1Image = gameState.player1.element.querySelector('.fighter-image');
        const player2Image = gameState.player2.element.querySelector('.fighter-image');
        
        // Only update orientation if not jumping
        if (player1Image && !player1Image.classList.contains('jumping')) {
            const player1IsOnRight = gameState.player1.position > gameState.player2.position;
            if (gameState.player1.character === 'reign') {
                player1Image.style.transform = player1IsOnRight ? 'scaleX(-1) scale(0.85)' : 'scaleX(1) scale(0.85)';
            } else {
                player1Image.style.transform = player1IsOnRight ? 'scaleX(-1)' : 'scaleX(1)';
            }
        }
        
        if (player2Image && !player2Image.classList.contains('jumping')) {
            const player2IsOnRight = gameState.player2.position > gameState.player1.position;
            if (gameState.player2.character === 'reign') {
                player2Image.style.transform = player2IsOnRight ? 'scaleX(-1) scale(0.85)' : 'scaleX(1) scale(0.85)';
            } else {
                player2Image.style.transform = player2IsOnRight ? 'scaleX(-1)' : 'scaleX(1)';
            }
        }
    }
}

// Add new function for pass-through effect
function addPassThroughEffect(player) {
    if (!player.element) return;
    
    // Add pass-through animation class
    player.element.classList.add('pass-through');
    
    // Remove pass-through animation class after animation
    setTimeout(() => {
        player.element.classList.remove('pass-through');
    }, 500);
}

// Update the animation styles
function addTeleportAnimationStyle() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes dashCloneEffect {
            0% { 
                opacity: 0.7;
                transform: scale(1);
                filter: brightness(1.2) drop-shadow(0 0 10px #2ecc71);
            }
            50% {
                opacity: 0.5;
                transform: scale(1.05);
                filter: brightness(1.5) drop-shadow(0 0 15px #2ecc71);
            }
            100% { 
                opacity: 0;
                transform: scale(1.1);
                filter: brightness(1.8) drop-shadow(0 0 20px #2ecc71);
            }
        }
        
        .dash-clone {
            position: absolute;
            animation: dashCloneEffect 2s ease-out forwards;
            filter: brightness(1.2) drop-shadow(0 0 10px #2ecc71);
        }

        .dash-clone.hit {
            animation: cloneHitEffect 0.5s ease-out forwards !important;
        }

        @keyframes cloneHitEffect {
            0% { 
                opacity: 0.7;
                transform: scale(1);
                filter: brightness(2) drop-shadow(0 0 20px #2ecc71);
            }
            50% {
                opacity: 0.5;
                transform: scale(1.2);
                filter: brightness(2.5) drop-shadow(0 0 30px #2ecc71);
            }
            100% { 
                opacity: 0.3;
                transform: scale(1.3);
                filter: brightness(3) drop-shadow(0 0 40px #2ecc71);
            }
        }

        .heal-effect {
            position: absolute;
            color: #2ecc71;
            font-size: 24px;
            font-weight: bold;
            pointer-events: none;
            text-shadow: 
                0 0 5px #2ecc71,
                0 0 10px #2ecc71,
                0 0 20px #2ecc71,
                0 0 40px #27ae60;
            z-index: 1000;
            animation: healFloat2 1s ease-out forwards;
        }

        .heal-plus {
            position: absolute;
            color: #2ecc71;
            font-size: 32px;
            font-weight: bold;
            pointer-events: none;
            text-shadow: 
                0 0 5px #2ecc71,
                0 0 10px #2ecc71,
                0 0 20px #2ecc71,
                0 0 40px #27ae60;
            z-index: 1000;
        }

        .heal-plus-1 {
            animation: healFloat1 1s ease-out forwards;
        }

        .heal-plus-2 {
            animation: healFloat2 1.2s ease-out forwards;
        }

        .heal-plus-3 {
            animation: healFloat3 1.4s ease-out forwards;
        }

        @keyframes healFloat1 {
            0% {
                opacity: 1;
                transform: translate(0, 0) rotate(0deg) scale(1);
            }
            50% {
                opacity: 0.8;
                transform: translate(-10px, -20px) rotate(-15deg) scale(1.2);
            }
            100% {
                opacity: 0;
                transform: translate(-20px, -40px) rotate(-30deg) scale(1.4);
            }
        }

        @keyframes healFloat2 {
            0% {
                opacity: 1;
                transform: translate(0, 0) rotate(0deg) scale(1);
            }
            50% {
                opacity: 0.8;
                transform: translate(0px, -25px) rotate(0deg) scale(1.2);
            }
            100% {
                opacity: 0;
                transform: translate(0px, -50px) rotate(0deg) scale(1.4);
            }
        }

        @keyframes healFloat3 {
            0% {
                opacity: 1;
                transform: translate(0, 0) rotate(0deg) scale(1);
            }
            50% {
                opacity: 0.8;
                opacity: 0.3;
            }
            100% {
                opacity: 0;
            }
        }

        .dash-cooldown {
            position: absolute;
            top: -20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 12px;
            pointer-events: none;
        }

        .laugh-text {
            position: absolute;
            top: -80px;
            left: 50%;
            transform: translateX(-50%);
            color: #ff3366;
            font-size: 32px;
            font-weight: bold;
            text-shadow: 
                0 0 10px #ff3366,
                0 0 20px #ff3366,
                0 0 30px #ff3366;
            animation: laughTextEffect 2s ease-out forwards;
            pointer-events: none;
            z-index: 1000;
            white-space: nowrap;
        }

        @keyframes laughTextEffect {
            0% { 
                opacity: 0;
                transform: translateX(-50%) translateY(0) scale(1);
            }
            10% {
                opacity: 1;
                transform: translateX(-50%) translateY(-20px) scale(1.2);
            }
            80% {
                opacity: 1;
                transform: translateX(-50%) translateY(-40px) scale(1.2);
            }
            100% { 
                opacity: 0;
                transform: translateX(-50%) translateY(-60px) scale(1);
            }
        }

        .heal-sparkle {
            position: absolute;
            width: 4px;
            height: 4px;
            background: #2ecc71;
            border-radius: 50%;
            pointer-events: none;
            z-index: 999;
        }

        .heal-ring {
            position: absolute;
            border: 2px solid #2ecc71;
            border-radius: 50%;
            pointer-events: none;
            z-index: 998;
            animation: healRingExpand 1s ease-out forwards;
        }

        .heal-glow {
            position: absolute;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle, rgba(46, 204, 113, 0.4) 0%, rgba(46, 204, 113, 0) 70%);
            pointer-events: none;
            z-index: 997;
            animation: healGlowPulse 1s ease-out forwards;
        }

        .heal-particles {
            position: absolute;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 996;
        }

        @keyframes healRingExpand {
            0% {
                width: 40px;
                height: 40px;
                opacity: 1;
                transform: translate(-50%, -50%) scale(1);
            }
            100% {
                width: 200px;
                height: 200px;
                opacity: 0;
                transform: translate(-50%, -50%) scale(2);
            }
        }

        @keyframes healGlowPulse {
            0% {
                opacity: 0.8;
                transform: scale(1);
            }
            50% {
                opacity: 0.4;
                transform: scale(1.8);
            }
            100% {
                opacity: 0;
                transform: scale(2.2);
            }
        }

        .heal-amount {
            position: absolute;
            top: -100px;
            left: 50%;
            transform: translateX(-50%);
            color: #2ecc71;
            font-size: 36px;
            font-weight: bold;
            text-shadow: 
                0 0 10px #2ecc71,
                0 0 20px #2ecc71,
                0 0 30px #27ae60;
            animation: healAmountFloat 2s ease-out forwards;
            pointer-events: none;
            z-index: 1001;
        }

        @keyframes healAmountFloat {
            0% {
                opacity: 0;
                transform: translateX(-50%) translateY(0) scale(1);
            }
            20% {
                opacity: 1;
                transform: translateX(-50%) translateY(-20px) scale(1.2);
            }
            50% {
                opacity: 1;
                transform: translateX(-50%) translateY(-40px) scale(1.2);
            }
            100% {
                opacity: 0;
                transform: translateX(var(--final-x)) translateY(-80px) rotate(var(--final-angle)) scale(1);
            }
        }

        .healing-bar {
            position: relative;
            overflow: hidden;
        }

        .healing-bar::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, 
                rgba(46, 204, 113, 0) 0%,
                rgba(46, 204, 113, 0.8) 50%,
                rgba(46, 204, 113, 0) 100%);
            animation: healingBarShine 1s ease-in-out;
        }

        @keyframes healingBarShine {
            0% {
                transform: translateX(-100%);
            }
            100% {
                transform: translateX(100%);
            }
        }
    `;
    document.head.appendChild(style);
}

// Enhance healPlayer function with new visual effects
function healPlayer(player, amount) {
    // Store previous health for comparison
    const previousHealth = player.health;
    
    // Calculate new health (don't exceed 100)
    const newHealth = Math.min(player.health + amount, 100);
    const actualHealAmount = newHealth - player.health;
    player.health = newHealth;
    
    // Update health bar
    updateHealthBar(player);
    
    // Add healing class to blood overlay
    const overlay = player === gameState.player1 ? 
        document.getElementById('left-blood-overlay') : 
        document.getElementById('right-blood-overlay');
    
    if (overlay) {
        overlay.classList.add('healing');
        setTimeout(() => {
            overlay.classList.remove('healing');
        }, 1000);
    }
    
    // Show heal effects
    if (player.element && actualHealAmount > 0) {
        // Add healing amount display with random angle
        const healAmount = document.createElement('div');
        healAmount.className = 'heal-amount';
        healAmount.textContent = `+${actualHealAmount} HP`;
        
        // Calculate random final position
        const randomAngle = -30 + Math.random() * 60; // Random angle between -30 and 30 degrees
        const randomX = -100 + Math.random() * 200; // Random X offset between -100 and 100 pixels
        
        // Set custom properties for the animation
        healAmount.style.setProperty('--final-angle', `${randomAngle}deg`);
        healAmount.style.setProperty('--final-x', `${randomX}px`);
        
        player.element.appendChild(healAmount);

        // Remove heal amount after animation
        setTimeout(() => {
            healAmount.remove();
        }, 2000);

        // Add healing effect to health bar
        const healthBar = player.healthBar;
        if (healthBar) {
            healthBar.classList.add('healing');
            setTimeout(() => {
                healthBar.classList.remove('healing');
            }, 1000);
        }
        
        // Show heal amount
        const healText = document.createElement('div');
        healText.className = 'heal-effect';
        healText.textContent = `+${actualHealAmount}`;
        healText.style.left = '50%';
        healText.style.top = '50%';
        player.element.appendChild(healText);
        
        // Create floating + symbols
        for (let i = 1; i <= 3; i++) {
            const plusSymbol = document.createElement('div');
            plusSymbol.className = `heal-plus heal-plus-${i}`;
            plusSymbol.textContent = '+';
            plusSymbol.style.left = '50%';
            plusSymbol.style.top = '40%';
            player.element.appendChild(plusSymbol);
            
            // Remove plus symbols after animation
            setTimeout(() => {
                plusSymbol.remove();
            }, 1400);
        }
        
        // Remove heal text after animation
        setTimeout(() => {
            healText.remove();
        }, 1000);
        
        // Reset player state and image after healing
        setTimeout(() => {
            resetPlayerIdleImage(player);
            player.isAttacking = false;
            player.attackType = null;
        }, 1000);

        // Add healing glow effect
        const healGlow = document.createElement('div');
        healGlow.className = 'heal-glow';
        player.element.appendChild(healGlow);

        // Add expanding rings
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const ring = document.createElement('div');
                ring.className = 'heal-ring';
                ring.style.left = '50%';
                ring.style.top = '50%';
                player.element.appendChild(ring);

                setTimeout(() => ring.remove(), 1000);
            }, i * 200);
        }

        // Add sparkle particles
        const particlesContainer = document.createElement('div');
        particlesContainer.className = 'heal-particles';
        player.element.appendChild(particlesContainer);

        // Create multiple sparkles
        for (let i = 0; i < 20; i++) {
            const sparkle = document.createElement('div');
            sparkle.className = 'heal-sparkle';
            
            // Random position around the character
            const angle = (Math.random() * Math.PI * 2);
            const distance = Math.random() * 50;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;
            
            sparkle.style.left = '50%';
            sparkle.style.top = '50%';
            sparkle.style.setProperty('--tx', `${tx}px`);
            sparkle.style.setProperty('--ty', `${ty}px`);
            sparkle.style.animation = `healSparkle ${0.5 + Math.random() * 0.5}s ease-out forwards`;
            
            particlesContainer.appendChild(sparkle);
        }

        // Add healing effect to health bar
        if (player.healthBar) {
            player.healthBar.classList.add('healing-bar');
            setTimeout(() => {
                player.healthBar.classList.remove('healing-bar');
            }, 1000);
        }

        // Clean up additional effects
        setTimeout(() => {
            healGlow.remove();
            particlesContainer.remove();
        }, 1000);
    }
}

// Create dash clone effect with hit detection
function createDashClone(player) {
    if (!player.element) return;

    // Create clone element
    const clone = player.element.cloneNode(true);
    clone.classList.add('dash-clone');
    clone.style.left = player.position + 'px';
    
    // Store reference to original player and character
    const isPlayer1 = player === gameState.player1;
    const characterId = isPlayer1 ? gameState.player1.character : gameState.player2.character;
    clone.dataset.originalPlayer = isPlayer1 ? 'player1' : 'player2';
    clone.dataset.character = characterId;
    clone.dataset.hit = 'false';
    
    // Add clone to arena
    const arena = document.getElementById('fightArena');
    if (arena) {
        arena.appendChild(clone);

        // Add hit detection for both Curse-or and Reign
        if (characterId === 'curse-or' || characterId === 'reign') {
            const opponent = isPlayer1 ? gameState.player2 : gameState.player1;
            let cloneHit = false;

            // Check for hits every 50ms for better responsiveness
            const hitCheckInterval = setInterval(() => {
                if (!clone || !clone.parentElement || cloneHit) {
                    clearInterval(hitCheckInterval);
                    return;
                }

                if (opponent.isAttacking) {
                    // Calculate distance between opponent and clone
                    const distance = Math.abs(opponent.position - parseFloat(clone.style.left));
                    
                    if (distance < 150) { // Increased hit detection range
                        cloneHit = true;
                        clone.dataset.hit = 'true';
                        clone.classList.add('hit');

                        // Heal the player by 30 points when clone is hit
                        healPlayer(player, 30);

                        // Play character-specific laugh with echo effect
                        const laughSound1 = new Audio(characterId === 'curse-or' ? 
                            '../assests/audio/movementSFX/Curse-or laugh.mp3' : 
                            '../assests/audio/movementSFX/Reign_laugh.mp3');
                        const laughSound2 = new Audio(characterId === 'curse-or' ? 
                            '../assests/audio/movementSFX/Curse-or laugh.mp3' : 
                            '../assests/audio/movementSFX/Reign_laugh.mp3');
                        
                        laughSound1.volume = 0.8;
                        laughSound2.volume = 0.6;
                        laughSound2.playbackRate = 0.9;
                        
                        laughSound1.play().catch(e => console.warn('Laugh sound play failed:', e));
                        setTimeout(() => {
                            laughSound2.play().catch(e => console.warn('Laugh sound play failed:', e));
                        }, 200);

                        // Create multiple laugh text effects for a more dramatic display
                        const laughTexts = ['HAHAHAH!', 'GOT YOU!', 'TOO SLOW!'];
                        laughTexts.forEach((text, index) => {
                            setTimeout(() => {
                                const laughText = document.createElement('div');
                                laughText.className = 'laugh-text';
                                laughText.textContent = text;
                                laughText.style.top = `-${80 + index * 40}px`; // Stack texts vertically
                                player.element.appendChild(laughText);

                                // Remove laugh text after animation
                                setTimeout(() => {
                                    laughText.remove();
                                }, 2000);
                            }, index * 300); // Stagger the appearance
                        });

                        // Add dramatic flash effect to the arena
                        const flash = document.createElement('div');
                        flash.className = 'clone-hit-flash';
                        arena.appendChild(flash);
                        setTimeout(() => flash.remove(), 500);

                        // Add screen shake effect
                        arena.classList.add('screen-shake');
                        setTimeout(() => arena.classList.remove('screen-shake'), 500);

                        // Remove clone after enhanced hit animation
                        setTimeout(() => {
                            clone.remove();
                        }, 1000);

                        clearInterval(hitCheckInterval);
                    }
                }
            }, 50);

            // Clear interval after 2 seconds if no hit
            setTimeout(() => {
                if (!cloneHit && clone && clone.parentElement) {
                    clearInterval(hitCheckInterval);
                    clone.remove();
                }
            }, 2000);
        } else {
            // For other characters, just remove after animation
            setTimeout(() => {
                if (clone && clone.parentElement) {
                    clone.remove();
                }
            }, 2000);
        }
    }
}

// Add dash function with faster movement
function performDash(player, direction) {
    const currentTime = Date.now();
    const cooldownDuration = 10000; // 10 seconds cooldown

    // Check if dash is on cooldown
    if (player.dashCooldown) {
        const remainingCooldown = Math.ceil((player.lastDashTime + cooldownDuration - currentTime) / 1000);
        showDashCooldown(player, remainingCooldown);
        return;
    }

    // Check if player has enough stamina to dash (30%)
    if (!consumeStamina(player, 30)) {
        showStaminaWarning(player);
        return;
    }

    // Play shadow step sound
    const dashSound = new Audio('../assests/audio/movementSFX/Shadow_step.mp3');
    dashSound.volume = 0.6;
    dashSound.play().catch(e => console.warn('Dash sound play failed:', e));

    // Create clone effect at current position
    createDashClone(player);

    // Calculate dash distance (increased from 20px to 30px for faster movement)
    const dashDistance = direction * 30;
    const newPosition = player.position + dashDistance;

    // Get boundaries
    const leftBoundary = gameState.arena.boundaries.left;
    const rightBoundary = gameState.arena.boundaries.right - 150; // character width

    // Apply dash with boundary check
    if (newPosition < leftBoundary) {
        player.position = leftBoundary;
    } else if (newPosition > rightBoundary) {
        player.position = rightBoundary;
    } else {
        player.position = newPosition;
    }

    // Update position visually with immediate effect
    if (player.element) {
        player.element.style.transition = 'left 0.1s ease'; // Add quick transition
        player.element.style.left = player.position + 'px';
        
        // Remove transition after dash
        setTimeout(() => {
            player.element.style.transition = '';
        }, 100);
    }

    // Set cooldown
    player.dashCooldown = true;
    player.lastDashTime = currentTime;

    // Reset cooldown after 10 seconds
    setTimeout(() => {
        player.dashCooldown = false;
    }, cooldownDuration);
}

// Show dash cooldown indicator
function showDashCooldown(player, seconds) {
    if (!player.element) return;

    // Remove existing cooldown indicator if any
    const existingCooldown = player.element.querySelector('.dash-cooldown');
    if (existingCooldown) {
        existingCooldown.remove();
    }

    // Create cooldown indicator
    const cooldownIndicator = document.createElement('div');
    cooldownIndicator.className = 'dash-cooldown';
    cooldownIndicator.textContent = `Dash: ${seconds}s`;
    player.element.appendChild(cooldownIndicator);

    // Remove after 1 second
    setTimeout(() => {
        cooldownIndicator.remove();
    }, 1000);
}

// Add after initGameEngine function
function createStaminaBar(player) {
    const staminaBar = document.createElement('div');
    staminaBar.className = 'stamina-bar';
    
    const staminaFill = document.createElement('div');
    staminaFill.className = 'stamina-bar-fill';
    staminaBar.appendChild(staminaFill);
    
    const staminaWarning = document.createElement('div');
    staminaWarning.className = 'stamina-warning';
    staminaWarning.textContent = 'Low Stamina!';
    staminaBar.appendChild(staminaWarning);
    
    return staminaBar;
}

function updateStaminaBar(player) {
    // Update both stamina bars
    if (player.staminaBar) {
        const staminaFill = player.staminaBar.querySelector('.stamina-bar-fill');
        const staminaWarning = player.staminaBar.querySelector('.stamina-warning');
        
        if (staminaFill) {
            const percentage = player.stamina;
            staminaFill.style.width = percentage + '%';
            
            // Update color and warning based on stamina level
            if (percentage <= 20) {
                player.staminaBar.classList.add('low');
                staminaWarning.classList.add('show');
            } else {
                player.staminaBar.classList.remove('low');
                staminaWarning.classList.remove('show');
            }
        }
    }
    
    // Update main stamina bar
    if (player.mainStaminaBar) {
        const percentage = player.stamina;
        player.mainStaminaBar.style.width = percentage + '%';
        
        // Update color based on stamina level
        if (percentage <= 20) {
            player.mainStaminaBar.classList.add('low');
        } else {
            player.mainStaminaBar.classList.remove('low');
        }
    }
}

// Add stamina regeneration function
function regenerateStamina(player) {
    const currentTime = Date.now();
    const timeSinceLastDamage = currentTime - player.lastDamageTaken;
    const timeSinceLastRegen = currentTime - player.lastStaminaRegen;
    
    // Only regenerate if it's been 2 seconds since last damage and 100ms since last regen
    if (timeSinceLastDamage >= 2000 && timeSinceLastRegen >= 100) {
        player.stamina = Math.min(100, player.stamina + 1); // Regenerate 1% every 100ms
        player.lastStaminaRegen = currentTime;
        updateStaminaBar(player);
    }
}

// Add stamina consumption function
function consumeStamina(player, amount) {
    if (player.stamina < amount) return false;
    
    player.stamina = Math.max(0, player.stamina - amount);
    updateStaminaBar(player);
    return true;
}
