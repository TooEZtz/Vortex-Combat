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

    addComboAnimationStyle();
    addTeleportAnimationStyle();
});

// Game state
let gameState = {
    player1: {
        health: 100,
        position: 200,
        isJumping: false,
        isGuarding: false,
        isAttacking: false,
        attackType: null,
        direction: 1, // 1 = right, -1 = left
        character: null,
        element: null,
        healthBar: null,
        dashCooldown: false,
        lastDashTime: 0
    },
    player2: {
        health: 100,
        position: 800,
        isJumping: false,
        isGuarding: false,
        isAttacking: false,
        attackType: null,
        direction: -1, // 1 = right, -1 = left
        character: null,
        element: null,
        healthBar: null,
        dashCooldown: false,
        lastDashTime: 0
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
    animationFrame: null,
    specialMoves: {
        player1: {
            sequence: [],
            lastKeyTime: 0,
            cooldown: false
        },
        player2: {
            sequence: [],
            lastKeyTime: 0,
            cooldown: false
        }
    }
};

// Add these variables at the top of the file, after gameState declaration
let lastPunchTime = {
    player1: 0,
    player2: 0
};

let lastPunchType = {
    player1: 1,
    player2: 1
};

// Add last attack time tracking
let lastAttackTime = {
    player1: 0,
    player2: 0
};

// Add combo tracking with more detailed state
let comboState = {
    player1: {
        sequence: [],
        lastAttackTime: 0,
        isComboActive: false,
        isInComboRecovery: false
    },
    player2: {
        sequence: [],
        lastAttackTime: 0,
        isComboActive: false,
        isInComboRecovery: false
    }
};

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
}

function setupControls() {
    // Keyboard event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    // Touch controls for mobile (optional)
    setupTouchControls();
}

function handleKeyDown(e) {
    const currentTime = Date.now();
    const ATTACK_DELAY = 50; // 50ms delay between attacks
    
    // Player 1 controls (WASD + F,G)
    switch(e.key.toLowerCase()) {
        case 'w':
            if (!gameState.keys.player1.jump) {  // Only trigger if not already jumping
                gameState.keys.player1.jump = true;
                recordSpecialMoveKey(gameState.player1, 'up');
            }
            break;
        case 'a':
            gameState.keys.player1.left = true;
            recordSpecialMoveKey(gameState.player1, 'left');
            // Check for dash (Shift + A)
            if (e.shiftKey) {
                performDash(gameState.player1, -1);
            }
            break;
        case 'd':
            gameState.keys.player1.right = true;
            recordSpecialMoveKey(gameState.player1, 'right');
            // Check for dash (Shift + D)
            if (e.shiftKey) {
                performDash(gameState.player1, 1);
            }
            break;
        case 's':
            gameState.keys.player1.guard = true;
            guardPlayer(gameState.player1);  // Start guarding immediately
            recordSpecialMoveKey(gameState.player1, 'down');
            break;
        case 'f':
            // Check if enough time has passed since last attack and player is not jumping or dodging
            if (!gameState.keys.player1.punch && !gameState.player1.isAttacking && 
                !gameState.player1.isJumping && !gameState.player1.isDodging &&
                currentTime - lastAttackTime.player1 >= ATTACK_DELAY) {
                gameState.keys.player1.punch = true;
                lastAttackTime.player1 = currentTime;
                attackPlayer(gameState.player1, 'punch');
            }
            break;
        case 'g':
            // Check if enough time has passed since last attack and player is not jumping or dodging
            if (!gameState.keys.player1.kick && !gameState.player1.isAttacking && 
                !gameState.player1.isJumping && !gameState.player1.isDodging &&
                currentTime - lastAttackTime.player1 >= ATTACK_DELAY) {
                gameState.keys.player1.kick = true;
                lastAttackTime.player1 = currentTime;
                attackPlayer(gameState.player1, 'kick');
            }
            break;
    }

    // Player 2 controls (Arrow keys + K,L)
    switch(e.key) {
        case 'ArrowUp':
            if (!gameState.keys.player2.jump) {  // Only trigger if not already jumping
                gameState.keys.player2.jump = true;
                recordSpecialMoveKey(gameState.player2, 'up');
            }
            break;
        case 'ArrowLeft':
            gameState.keys.player2.left = true;
            recordSpecialMoveKey(gameState.player2, 'left');
            // Check for dash (Shift + Left Arrow)
            if (e.shiftKey) {
                performDash(gameState.player2, -1);
            }
            break;
        case 'ArrowRight':
            gameState.keys.player2.right = true;
            recordSpecialMoveKey(gameState.player2, 'right');
            // Check for dash (Shift + Right Arrow)
            if (e.shiftKey) {
                performDash(gameState.player2, 1);
            }
            break;
        case 'ArrowDown':
            gameState.keys.player2.guard = true;
            guardPlayer(gameState.player2);  // Start guarding immediately
            recordSpecialMoveKey(gameState.player2, 'down');
            break;
        case 'k':
            // Check if enough time has passed since last attack and player is not jumping or dodging
            if (!gameState.keys.player2.punch && !gameState.player2.isAttacking && 
                !gameState.player2.isJumping && !gameState.player2.isDodging &&
                currentTime - lastAttackTime.player2 >= ATTACK_DELAY) {
                gameState.keys.player2.punch = true;
                lastAttackTime.player2 = currentTime;
                attackPlayer(gameState.player2, 'punch');
            }
            break;
        case 'l':
            // Check if enough time has passed since last attack and player is not jumping or dodging
            if (!gameState.keys.player2.kick && !gameState.player2.isAttacking && 
                !gameState.player2.isJumping && !gameState.player2.isDodging &&
                currentTime - lastAttackTime.player2 >= ATTACK_DELAY) {
                gameState.keys.player2.kick = true;
                lastAttackTime.player2 = currentTime;
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
            // Reset player 1 image when left key is released
            resetPlayerIdleImage(gameState.player1);
            break;
        case 'd': 
            gameState.keys.player1.right = false; 
            // Reset player 1 image when right key is released
            resetPlayerIdleImage(gameState.player1);
            break;
        case 's': 
            gameState.keys.player1.guard = false; 
            stopGuardPlayer(gameState.player1);  // Stop guarding immediately
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
            // Reset player 2 image when left key is released
            resetPlayerIdleImage(gameState.player2);
            break;
        case 'ArrowRight': 
            gameState.keys.player2.right = false; 
            // Reset player 2 image when right key is released
            resetPlayerIdleImage(gameState.player2);
            break;
        case 'ArrowDown': 
            gameState.keys.player2.guard = false; 
            stopGuardPlayer(gameState.player2);  // Stop guarding immediately
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
    
    // Check for special moves
    checkSpecialMoves(gameState.player1);
    checkSpecialMoves(gameState.player2);
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
    
    // Set guard state immediately
    player.isGuarding = true;
    
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
    
    console.log('Guard activated:', isPlayer1 ? 'Player 1' : 'Player 2', {
        isGuarding: player.isGuarding,
        guardKey: isPlayer1 ? gameState.keys.player1.guard : gameState.keys.player2.guard,
        isJumping: player.isJumping
    });
}

function stopGuardPlayer(player) {
    const isPlayer1 = player === gameState.player1;
    
    // Clear guard state immediately
    player.isGuarding = false;
    
    // Reset to idle animation
    resetPlayerIdleImage(player);
    
    console.log('Guard deactivated:', isPlayer1 ? 'Player 1' : 'Player 2', {
        isGuarding: player.isGuarding,
        guardKey: isPlayer1 ? gameState.keys.player1.guard : gameState.keys.player2.guard
    });
}

function attackPlayer(player, attackType) {
    const isPlayer1 = player === gameState.player1;
    
    // Don't start a new attack if already attacking
    if (player.isAttacking) {
        return;
    }
    
    // Don't allow attacks while jumping or dodging
    if (player.isJumping || player.isDodging) {
        return;
    }
    
    // Don't allow attacks while guarding
    if (player.isGuarding || (isPlayer1 ? gameState.keys.player1.guard : gameState.keys.player2.guard)) {
        return;
    }
    
    // Don't allow attacks during combo recovery
    const playerComboState = isPlayer1 ? comboState.player1 : comboState.player2;
    if (playerComboState.isInComboRecovery) {
        return;
    }
    
    player.isAttacking = true;
    player.attackType = attackType;
    
    const playerImage = player.element?.querySelector('.fighter-image');
    if (!playerImage) return;
    
    // Get the character ID
    const characterId = isPlayer1 ? gameState.player1.character : gameState.player2.character;
    
    // Preserve the correct orientation
    const player1IsOnRight = gameState.player1.position > gameState.player2.position;
    
    // Update combo sequence
    const currentTime = Date.now();
    const comboTimeout = 1500; // 1.5 seconds for combo execution
    
    // Clear old combos if too much time has passed
    if (currentTime - playerComboState.lastAttackTime > comboTimeout) {
        playerComboState.sequence = [];
        playerComboState.isComboActive = false;
        playerComboState.isInComboRecovery = false;
        console.log('Combo sequence reset due to timeout');
    }
    
    let attackPath;
    if (characterId === 'curse-or') {
        if (attackType === 'punch') {
            attackPath = '../assests/players/character_1/Right_Punch_1-ezgif.com-gif-maker.gif';
        } else if (attackType === 'kick') {
            attackPath = '../assests/players/character_1/Right_Kick1-ezgif.com-gif-maker.gif';
        }
    } else if (characterId === 'reign') {
        if (attackType === 'punch') {
            attackPath = '../assests/players/character_2/2_Rightpunch_1.gif';
        } else if (attackType === 'kick') {
            attackPath = '../assests/players/character_2/2_Right_kick_1.gif';
        }
    }
    
    // Update the image with animation
    if (attackPath) {
        playerImage.style.backgroundImage = `url(${attackPath})`;
        
        // Set orientation
        if (isPlayer1) {
            playerImage.style.transform = player1IsOnRight ? 'scaleX(-1) scale(0.85)' : 'scaleX(1) scale(0.85)';
        } else {
            playerImage.style.transform = player1IsOnRight ? 'scaleX(1) scale(0.85)' : 'scaleX(-1) scale(0.85)';
        }
        
        // Determine the defender
        const defender = isPlayer1 ? gameState.player2 : gameState.player1;
        
        // Calculate distance between players
        const distance = Math.abs(player.position - defender.position);
        
        // Check if players are close enough for a hit
        if (distance < 50) {
            // Check guard state first
            const defenderGuardKey = isPlayer1 ? gameState.keys.player2.guard : gameState.keys.player1.guard;
            if (defender.isGuarding === true || defenderGuardKey === true) {
                console.log('Attack blocked by guard!');
                showBlockedEffect(defender);
                return;
            }
            
            // If not guarding, apply damage and track successful hit
            console.log('Attack landed!');
            applyDamage(defender, 10); // Regular attacks do 10 damage
            showHitEffect(defender);
            showAttackText(player, attackType); // Show attack text only on successful hit
            
            // Track successful hit for combo
            playerComboState.sequence.push(attackType);
            playerComboState.lastAttackTime = currentTime;
            
            // Keep only last 3 successful hits
            if (playerComboState.sequence.length > 3) {
                playerComboState.sequence.shift();
            }
            
            // Check for combo sequence
            const sequence = playerComboState.sequence;
            const isComboSequence = sequence.length === 3 && 
                                  sequence[0] === 'punch' && 
                                  sequence[1] === 'punch' && 
                                  sequence[2] === 'kick';
            
            if (isComboSequence) {
                console.log('Combo sequence completed!');
                // Use combo animation
                if (characterId === 'curse-or') {
                    attackPath = '../assests/players/character_1/Right_Combo-ezgif.com-gif-maker.gif';
                    
                    // Add multi-stage combo effects
                    const defenderElement = defender.element;
                    if (defenderElement) {
                        // Stage 1: Uppercut
                        defenderElement.style.animation = 'uppercutEffect 0.5s ease';
                        applyDamage(defender, 10); // First hit damage
                        
                        // Stage 2: Ground Smash (after uppercut)
                        setTimeout(() => {
                            defenderElement.style.animation = 'groundSmashEffect 0.3s ease';
                            applyDamage(defender, 10); // Second hit damage
                        }, 500);
                        
                        // Stage 3: Multiple Kicks with Displacement
                        setTimeout(() => {
                            defenderElement.style.animation = 'kickDisplaceEffect 1s ease';
                            applyDamage(defender, 10); // Third hit damage
                        }, 800);
                        
                        // Reset animation after all stages
                        setTimeout(() => {
                            defenderElement.style.animation = '';
                        }, 1800);
                    }
                } else if (characterId === 'reign') {
                    attackPath = '../assests/players/character_2/2_Right_combo.gif';
                }
                
                // Update image with combo animation
                playerImage.style.backgroundImage = `url(${attackPath})`;
                playerImage.classList.add('combo-animation');
                
                // Show combo effect
                showComboEffect(defender);
                
                // Set combo recovery state
                playerComboState.isInComboRecovery = true;
                
                // Reset to idle image after combo animation
                setTimeout(() => {
                    resetPlayerIdleImage(player);
                    player.isAttacking = false;
                    player.attackType = null;
                    playerComboState.isComboActive = false;
                    playerComboState.sequence = [];
                    playerImage.classList.remove('combo-animation');
                    // Add recovery time after combo
                    setTimeout(() => {
                        playerComboState.isInComboRecovery = false;
                        console.log('Combo recovery complete');
                    }, 1000);
                }, 2000);
            } else {
                // Reset to idle image after regular attack animation
                setTimeout(() => {
                    resetPlayerIdleImage(player);
                    player.isAttacking = false;
                    player.attackType = null;
                }, 250); // 250ms for regular attack animation
            }
        } else {
            // Attack missed, reset combo sequence
            playerComboState.sequence = [];
            playerComboState.isComboActive = false;
            
            // Reset to idle image after animation
            setTimeout(() => {
                resetPlayerIdleImage(player);
                player.isAttacking = false;
                player.attackType = null;
            }, 250); // 250ms for regular attack animation
        }
    }
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
    
    // Play block sound
    playSound('hit');
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

function applyDamage(player, amount) {
    // Reduce player health
    player.health -= amount;
    if (player.health < 0) player.health = 0;
    
    // Update health bar
    updateHealthBar(player);
    
    // Show hit effect
    showHitEffect(player);
    
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
        
        // Preserve the correct orientation
        playerImage.style.transform = currentTransform;
        
        // Add pushback effect (reduced from 30 to 15)
        const pushbackAmount = 15; // Reduced knockback distance
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
    }, 800); // Keep the full animation duration
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
            imageHeight: '300px',
            scale: 1
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
        player.healthBar.style.width = player.health + '%';
        player.healthBar.textContent = Math.round(player.health) + '%';
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
                if (player1IsOnRight) {
                    playerImage.style.transform = 'scaleX(-1) scale(0.85)';
                } else {
                    playerImage.style.transform = 'scaleX(1) scale(0.85)';
                }
            } else {
                if (player1IsOnRight) {
                    playerImage.style.transform = 'scaleX(-1) scale(0.85)';
                } else {
                    playerImage.style.transform = 'scaleX(1) scale(0.85)';
                }
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
    } else if (!idlePath) {
        console.warn(`No valid idle image path found for ${player === gameState.player1 ? 'Player 1' : 'Player 2'} with character ID: ${characterId}`);
    }
}

// Add new function for combo effect
function showComboEffect(player) {
    // Add combo animation class
    if (player.element) {
        player.element.classList.add('combo-hit');
        
        // Create combo text effect
        const comboText = document.createElement('div');
        comboText.className = 'combo-text';
        comboText.textContent = '3x COMBO!';
        player.element.appendChild(comboText);
        
        // Remove combo animation class and text after animation
        setTimeout(() => {
            player.element.classList.remove('combo-hit');
            comboText.remove();
        }, 500);
    }
    
    // Play combo sound
    playSound('combo');
}

// Add this CSS to handle the multi-stage combo animation
function addComboAnimationStyle() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slowCombo {
            0% { background-position: 0% 0%; }
            100% { background-position: -100% 0%; }
        }
        
        .combo-animation {
            animation: slowCombo 2s steps(15) forwards;
        }

        @keyframes uppercutEffect {
            0% { transform: translateY(0); }
            50% { transform: translateY(-100px); }
            100% { transform: translateY(0); }
        }

        @keyframes groundSmashEffect {
            0% { transform: translateY(0); }
            50% { transform: translateY(20px); }
            100% { transform: translateY(0); }
        }

        @keyframes kickDisplaceEffect {
            0% { transform: translateX(0); }
            100% { transform: translateX(100px); }
        }

        .combo-hit {
            animation: comboHitEffect 0.5s ease;
        }

        @keyframes comboHitEffect {
            0% { transform: scale(1); }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); }
        }

        .combo-text {
            position: absolute;
            top: -50px;
            left: 50%;
            transform: translateX(-50%);
            color: #ff0;
            font-size: 24px;
            font-weight: bold;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
            animation: comboTextEffect 1s ease-out forwards;
            pointer-events: none;
        }

        @keyframes comboTextEffect {
            0% { 
                transform: translateX(-50%) translateY(0);
                opacity: 1;
            }
            100% { 
                transform: translateX(-50%) translateY(-50px);
                opacity: 0;
            }
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
        @keyframes passThroughEffect {
            0% { 
                opacity: 1;
                transform: scale(1);
            }
            25% { 
                opacity: 0.5;
                transform: scale(0.8);
            }
            50% { 
                opacity: 0.2;
                transform: scale(0.6);
            }
            75% { 
                opacity: 0.5;
                transform: scale(0.8);
            }
            100% { 
                opacity: 1;
                transform: scale(1);
            }
        }
        
        .pass-through {
            animation: passThroughEffect 0.5s ease;
        }

        @keyframes dashCloneEffect {
            0% { 
                opacity: 0.7;
                transform: scale(1);
            }
            100% { 
                opacity: 0;
                transform: scale(1.1);
            }
        }
        
        .dash-clone {
            position: absolute;
            pointer-events: none;
            animation: dashCloneEffect 1s ease-out forwards;
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
    `;
    document.head.appendChild(style);
}

// Add dash function
function performDash(player, direction) {
    const currentTime = Date.now();
    const cooldownDuration = 10000; // 10 seconds cooldown

    // Check if dash is on cooldown
    if (player.dashCooldown) {
        const remainingCooldown = Math.ceil((player.lastDashTime + cooldownDuration - currentTime) / 1000);
        showDashCooldown(player, remainingCooldown);
        return;
    }

    // Create clone effect at current position
    createDashClone(player);

    // Calculate dash distance (20px in movement direction)
    const dashDistance = direction * 20;
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

    // Update position visually
    if (player.element) {
        player.element.style.left = player.position + 'px';
    }

    // Set cooldown
    player.dashCooldown = true;
    player.lastDashTime = currentTime;

    // Reset cooldown after 10 seconds
    setTimeout(() => {
        player.dashCooldown = false;
    }, cooldownDuration);
}

// Create dash clone effect
function createDashClone(player) {
    if (!player.element) return;

    // Create clone element
    const clone = player.element.cloneNode(true);
    clone.classList.add('dash-clone');
    clone.style.left = player.position + 'px';
    
    // Add clone to arena
    const arena = document.getElementById('fightArena');
    if (arena) {
        arena.appendChild(clone);
        
        // Remove clone after animation
        setTimeout(() => {
            clone.remove();
        }, 1000);
    }
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
