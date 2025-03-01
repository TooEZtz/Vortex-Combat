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
        // This could happen if someone navigates directly to the fight screen
        if (!player1Character) {
            sessionStorage.setItem('player1Character', 'scorpion');
        }
        
        if (!player2Character) {
            sessionStorage.setItem('player2Character', 'subzero');
        }
    }
    
    // Get the final character selections (either from session storage or defaults)
    const finalPlayer1 = sessionStorage.getItem('player1Character') || 'scorpion';
    const finalPlayer2 = sessionStorage.getItem('player2Character') || 'subzero';
    
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
    
    // Set up fighters
    setupFighters(finalPlayer1, finalPlayer2);
    
    // Set up game timer
    setupGameTimer();
    
    // Set up fight animation
    animateFightText();
    
    // Initialize the game engine
    initGameEngine(finalPlayer1, finalPlayer2);
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
        healthBar: null
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
        healthBar: null
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
    // Player 1 controls (WASD + F,G)
    switch(e.key.toLowerCase()) {
        case 'w': 
            gameState.keys.player1.jump = true; 
            recordSpecialMoveKey(gameState.player1, 'up');
            break;
        case 'a': 
            gameState.keys.player1.left = true; 
            recordSpecialMoveKey(gameState.player1, 'left');
            break;
        case 'd': 
            gameState.keys.player1.right = true; 
            recordSpecialMoveKey(gameState.player1, 'right');
            break;
        case 's': 
            gameState.keys.player1.guard = true; 
            recordSpecialMoveKey(gameState.player1, 'down');
            break;
        case 'f': 
            gameState.keys.player1.punch = true; 
            recordSpecialMoveKey(gameState.player1, 'punch');
            break;
        case 'g': 
            gameState.keys.player1.kick = true; 
            recordSpecialMoveKey(gameState.player1, 'kick');
            break;
    }
    
    // Player 2 controls (Arrow keys + K,L)
    switch(e.key) {
        case 'ArrowUp': 
            gameState.keys.player2.jump = true; 
            recordSpecialMoveKey(gameState.player2, 'up');
            break;
        case 'ArrowLeft': 
            gameState.keys.player2.left = true; 
            recordSpecialMoveKey(gameState.player2, 'left');
            break;
        case 'ArrowRight': 
            gameState.keys.player2.right = true; 
            recordSpecialMoveKey(gameState.player2, 'right');
            break;
        case 'ArrowDown': 
            gameState.keys.player2.guard = true; 
            recordSpecialMoveKey(gameState.player2, 'down');
            break;
        case 'k': 
            gameState.keys.player2.punch = true; 
            recordSpecialMoveKey(gameState.player2, 'punch');
            break;
        case 'l': 
            gameState.keys.player2.kick = true; 
            recordSpecialMoveKey(gameState.player2, 'kick');
            break;
    }
}

function handleKeyUp(e) {
    // Player 1 controls
    switch(e.key.toLowerCase()) {
        case 'w': gameState.keys.player1.jump = false; break;
        case 'a': gameState.keys.player1.left = false; break;
        case 'd': gameState.keys.player1.right = false; break;
        case 's': gameState.keys.player1.guard = false; break;
        case 'f': gameState.keys.player1.punch = false; break;
        case 'g': gameState.keys.player1.kick = false; break;
    }
    
    // Player 2 controls
    switch(e.key) {
        case 'ArrowUp': gameState.keys.player2.jump = false; break;
        case 'ArrowLeft': gameState.keys.player2.left = false; break;
        case 'ArrowRight': gameState.keys.player2.right = false; break;
        case 'ArrowDown': gameState.keys.player2.guard = false; break;
        case 'k': gameState.keys.player2.punch = false; break;
        case 'l': gameState.keys.player2.kick = false; break;
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
    }
    if (gameState.keys.player1.right) {
        movePlayer(gameState.player1, 1);
    }
    if (gameState.keys.player1.jump && !gameState.player1.isJumping) {
        jumpPlayer(gameState.player1);
    }
    if (gameState.keys.player1.guard) {
        guardPlayer(gameState.player1);
    } else if (gameState.player1.isGuarding) {
        stopGuardPlayer(gameState.player1);
    }
    if (gameState.keys.player1.punch && !gameState.player1.isAttacking && !gameState.player1.isGuarding) {
        attackPlayer(gameState.player1, 'punch');
    }
    if (gameState.keys.player1.kick && !gameState.player1.isAttacking && !gameState.player1.isGuarding) {
        attackPlayer(gameState.player1, 'kick');
    }
    
    // Process Player 2 input
    if (gameState.keys.player2.left) {
        movePlayer(gameState.player2, -1);
    }
    if (gameState.keys.player2.right) {
        movePlayer(gameState.player2, 1);
    }
    if (gameState.keys.player2.jump && !gameState.player2.isJumping) {
        jumpPlayer(gameState.player2);
    }
    if (gameState.keys.player2.guard) {
        guardPlayer(gameState.player2);
    } else if (gameState.player2.isGuarding) {
        stopGuardPlayer(gameState.player2);
    }
    if (gameState.keys.player2.punch && !gameState.player2.isAttacking && !gameState.player2.isGuarding) {
        attackPlayer(gameState.player2, 'punch');
    }
    if (gameState.keys.player2.kick && !gameState.player2.isAttacking && !gameState.player2.isGuarding) {
        attackPlayer(gameState.player2, 'kick');
    }
}

function movePlayer(player, direction) {
    // Update player position
    const oldPosition = player.position;
    player.position += direction * 5;
    
    // Keep player within boundaries
    if (player.position < gameState.arena.boundaries.left) {
        player.position = gameState.arena.boundaries.left;
    }
    if (player.position > gameState.arena.boundaries.right) {
        player.position = gameState.arena.boundaries.right;
    }
    
    // Log position change
    console.log(`Player moved: ${oldPosition} -> ${player.position}, direction: ${direction}`);
    
    // Update player direction
    player.direction = direction;
    
    // Apply position immediately
    if (player.element) {
        player.element.style.left = player.position + 'px';
    }
}

function jumpPlayer(player) {
    player.isJumping = true;
    
    // Add jump animation class
    if (player.element) {
        player.element.classList.add('jumping');
        
        // Force a reflow to restart the animation if it's already applied
        void player.element.offsetWidth;
    }
    
    // Reset jump after animation
    setTimeout(() => {
        player.isJumping = false;
        if (player.element) {
            player.element.classList.remove('jumping');
        }
    }, 500);
}

function guardPlayer(player) {
    player.isGuarding = true;
    
    // Add guard animation class
    if (player.element) {
        player.element.classList.add('guarding');
        
        // Force a reflow to restart the animation if it's already applied
        void player.element.offsetWidth;
    }
}

function stopGuardPlayer(player) {
    player.isGuarding = false;
    
    // Remove guard animation class
    if (player.element) {
        player.element.classList.remove('guarding');
    }
}

function attackPlayer(player, attackType) {
    player.isAttacking = true;
    player.attackType = attackType;
    
    // Add attack animation class
    if (player.element) {
        player.element.classList.add(attackType);
        
        // Force a reflow to restart the animation if it's already applied
        void player.element.offsetWidth;
    }
    
    // Check for hit
    checkHit(player);
    
    // Reset attack after animation
    setTimeout(() => {
        player.isAttacking = false;
        player.attackType = null;
        if (player.element) {
            player.element.classList.remove(attackType);
        }
    }, 300);
}

function checkHit(attacker) {
    // Determine the defender
    const defender = attacker === gameState.player1 ? gameState.player2 : gameState.player1;
    
    // Calculate distance between players
    const distance = Math.abs(attacker.position - defender.position);
    
    // Check if players are close enough for a hit (increased range from 150 to 250)
    if (distance < 250) {
        // Check if defender is jumping (can't be hit while jumping)
        if (!defender.isJumping) {
            // Check if defender is guarding
            if (!defender.isGuarding) {
                // Hit landed!
                applyDamage(defender, attacker.attackType === 'punch' ? 10 : 15);
                
                // Show hit effect
                showHitEffect(defender);
            } else {
                // Defender is guarding - show blocked effect
                showBlockedEffect(defender);
            }
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

function applyDamage(player, amount) {
    // Reduce player health
    player.health -= amount;
    if (player.health < 0) player.health = 0;
    
    // Update health bar
    updateHealthBar(player);
    
    // Check for knockout
    if (player.health <= 0) {
        gameState.gameOver = true;
        gameState.winner = player === gameState.player1 ? gameState.player2 : gameState.player1;
    }
}

function showHitEffect(player) {
    // Add hit animation class
    if (player.element) {
        player.element.classList.add('hit');
        
        // Remove hit animation class after a short delay
        setTimeout(() => {
            player.element.classList.remove('hit');
        }, 200);
    }
    
    // Play hit sound
    playSound('hit');
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
    // Update debug overlay
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

function setupFighters(player1Id, player2Id) {
    const player1Element = document.getElementById('player1');
    const player2Element = document.getElementById('player2');
    
    if (player1Element) {
        const player1Name = document.querySelector('#player1 .fighter-name');
        const player1Image = document.querySelector('#player1 .fighter-image');
        
        // Set player 1 name
        player1Name.textContent = formatCharacterName(player1Id);
        
        // Add character name to the box
        player1Image.textContent = formatCharacterName(player1Id).charAt(0);
        
        // Set initial position
        player1Element.style.left = '200px';
    }
    
    if (player2Element) {
        const player2Name = document.querySelector('#player2 .fighter-name');
        const player2Image = document.querySelector('#player2 .fighter-image');
        
        // Set player 2 name
        player2Name.textContent = formatCharacterName(player2Id);
        
        // Add character name to the box
        player2Image.textContent = formatCharacterName(player2Id).charAt(0);
        
        // Set initial position
        player2Element.style.left = '800px';
    }
    
    // Log that fighters are set up
    console.log('Fighters set up with positions:', 
                player1Element.style.left, 
                player2Element.style.left);
}

function formatCharacterName(id) {
    // Return the correct character name based on the character ID
    switch(id) {
        case 'scorpion':
        case 'johnny':
            return 'CURSE-OR';
        case 'subzero':
        case 'sonya':
            return 'REIGN';
        default:
            // Fallback to original names if needed
            const names = {
                'raiden': 'RAIDEN',
                'liukang': 'LIU KANG',
                'kitana': 'KITANA',
                'johnnycage': 'JOHNNY CAGE'
            };
            return names[id] || id.toUpperCase();
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
        'scorpion': [
            { name: 'Spear', sequence: 'down,down,punch', damage: 25, animation: 'spear' },
            { name: 'Fire Breath', sequence: 'down,right,punch', damage: 20, animation: 'firebreath' }
        ],
        'subzero': [
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
    
    // Add to player element
    if (player.element) {
        player.element.appendChild(specialMoveElement);
        
        // Remove after animation
        setTimeout(() => {
            specialMoveElement.remove();
        }, 1500);
    }
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