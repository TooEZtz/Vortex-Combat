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
    
    // Set up the background
    const backgroundContainer = document.getElementById('background-container');
    
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
        isDucking: false,
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
        isDucking: false,
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
            duck: false,
            punch: false,
            kick: false
        },
        player2: {
            left: false,
            right: false,
            jump: false,
            duck: false,
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
    }
    
    // Set up player elements
    gameState.player1.element = document.getElementById('player1');
    gameState.player2.element = document.getElementById('player2');
    gameState.player1.healthBar = document.querySelector('#player1 .health-bar');
    gameState.player2.healthBar = document.querySelector('#player2 .health-bar');
    
    // Set character data
    gameState.player1.character = player1Character;
    gameState.player2.character = player2Character;
    
    // Set initial positions
    gameState.player1.position = gameState.arena.width * 0.3;
    gameState.player2.position = gameState.arena.width * 0.7;
    
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
            gameState.keys.player1.duck = true; 
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
            gameState.keys.player2.duck = true; 
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
        case 's': gameState.keys.player1.duck = false; break;
        case 'f': gameState.keys.player1.punch = false; break;
        case 'g': gameState.keys.player1.kick = false; break;
    }
    
    // Player 2 controls
    switch(e.key) {
        case 'ArrowUp': gameState.keys.player2.jump = false; break;
        case 'ArrowLeft': gameState.keys.player2.left = false; break;
        case 'ArrowRight': gameState.keys.player2.right = false; break;
        case 'ArrowDown': gameState.keys.player2.duck = false; break;
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
    if (gameState.keys.player1.duck) {
        duckPlayer(gameState.player1);
    } else if (gameState.player1.isDucking) {
        standPlayer(gameState.player1);
    }
    if (gameState.keys.player1.punch && !gameState.player1.isAttacking) {
        attackPlayer(gameState.player1, 'punch');
    }
    if (gameState.keys.player1.kick && !gameState.player1.isAttacking) {
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
    if (gameState.keys.player2.duck) {
        duckPlayer(gameState.player2);
    } else if (gameState.player2.isDucking) {
        standPlayer(gameState.player2);
    }
    if (gameState.keys.player2.punch && !gameState.player2.isAttacking) {
        attackPlayer(gameState.player2, 'punch');
    }
    if (gameState.keys.player2.kick && !gameState.player2.isAttacking) {
        attackPlayer(gameState.player2, 'kick');
    }
}

function movePlayer(player, direction) {
    // Update player position
    player.position += direction * 5;
    
    // Keep player within boundaries
    if (player.position < gameState.arena.boundaries.left) {
        player.position = gameState.arena.boundaries.left;
    }
    if (player.position > gameState.arena.boundaries.right) {
        player.position = gameState.arena.boundaries.right;
    }
    
    // Update player direction
    player.direction = direction;
}

function jumpPlayer(player) {
    player.isJumping = true;
    
    // Add jump animation class
    if (player.element) {
        player.element.classList.add('jumping');
    }
    
    // Reset jump after animation
    setTimeout(() => {
        player.isJumping = false;
        if (player.element) {
            player.element.classList.remove('jumping');
        }
    }, 500);
}

function duckPlayer(player) {
    player.isDucking = true;
    
    // Add duck animation class
    if (player.element) {
        player.element.classList.add('ducking');
    }
}

function standPlayer(player) {
    player.isDucking = false;
    
    // Remove duck animation class
    if (player.element) {
        player.element.classList.remove('ducking');
    }
}

function attackPlayer(player, attackType) {
    player.isAttacking = true;
    player.attackType = attackType;
    
    // Add attack animation class
    if (player.element) {
        player.element.classList.add(attackType);
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
    
    // Check if players are close enough for a hit
    if (distance < 150) {
        // Check if defender is jumping (can't be hit while jumping)
        if (!defender.isJumping) {
            // Check if defender is ducking (can only be hit by kicks when ducking)
            if (!defender.isDucking || attacker.attackType === 'kick') {
                // Hit landed!
                applyDamage(defender, attacker.attackType === 'punch' ? 10 : 15);
                
                // Show hit effect
                showHitEffect(defender);
            }
        }
    }
}

function applyDamage(player, amount) {
    // Reduce player health
    player.health -= amount;
    if (player.health < 0) player.health = 0;
    
    // Update health bar
    if (player.healthBar) {
        player.healthBar.style.width = player.health + '%';
    }
    
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
    }
    if (gameState.player2.element) {
        gameState.player2.element.style.left = gameState.player2.position + 'px';
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
    // This function would handle any additional rendering
    // Most of our rendering is done with CSS classes and styles
}

function endGame() {
    cancelAnimationFrame(gameState.animationFrame);
    
    // Show winner
    const fightText = document.getElementById('fightText');
    if (fightText) {
        fightText.style.display = 'block';
        fightText.textContent = gameState.winner === gameState.player1 ? 'PLAYER 1 WINS!' : 'PLAYER 2 WINS!';
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
    
    // Create a canvas to generate the map background
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    
    // Map colors based on the map ID
    const mapColors = {
        'temple': '#3a2f23',
        'palace': '#4a1522',
        'pit': '#1a1a1a',
        'bridge': '#162436'
    };
    
    // Map names for the watermark
    const mapNames = {
        'temple': 'TEMPLE',
        'palace': 'PALACE',
        'pit': 'THE PIT',
        'bridge': 'DEAD POOL'
    };
    
    // Create gradient background
    const color = mapColors[mapId] || '#000000';
    const gradient = ctx.createLinearGradient(0, 0, 1200, 800);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, '#000000');
    
    // Fill background
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1200, 800);
    
    // Add map name watermark
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.font = 'bold 120px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(mapNames[mapId] || 'ARENA', 600, 400);
    
    // Set the background image
    const img = canvas.toDataURL('image/png');
    container.style.backgroundImage = `url(${img})`;
    
    // Try to load actual map image if available
    const actualMapImage = new Image();
    actualMapImage.src = `../assets/images/maps/${mapId}.png`;
    actualMapImage.onload = function() {
        container.style.backgroundImage = `url(${actualMapImage.src})`;
    };
}

function setupFighters(player1Id, player2Id) {
    const player1Element = document.getElementById('player1');
    const player2Element = document.getElementById('player2');
    
    if (player1Element) {
        const player1Name = document.querySelector('#player1 .fighter-name');
        const player1Image = document.querySelector('#player1 .fighter-image');
        
        // Set player 1 name and image
        player1Name.textContent = formatCharacterName(player1Id);
        player1Image.style.backgroundImage = `url(../assets/images/characters/${player1Id}.png)`;
    }
    
    if (player2Element) {
        const player2Name = document.querySelector('#player2 .fighter-name');
        const player2Image = document.querySelector('#player2 .fighter-image');
        
        // Set player 2 name and image
        player2Name.textContent = formatCharacterName(player2Id);
        player2Image.style.backgroundImage = `url(../assets/images/characters/${player2Id}.png)`;
    }
}

function formatCharacterName(id) {
    // Convert character ID to a proper name
    const names = {
        'scorpion': 'SCORPION',
        'subzero': 'SUB-ZERO',
        'raiden': 'RAIDEN',
        'liukang': 'LIU KANG',
        'kitana': 'KITANA',
        'johnnycage': 'JOHNNY CAGE'
    };
    
    return names[id] || id.toUpperCase();
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
    
    // Check if players are close enough for a hit (special moves have longer range)
    if (distance < 300) {
        // Apply damage to opponent
        applyDamage(opponent, move.damage);
        
        // Show hit effect
        showHitEffect(opponent);
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