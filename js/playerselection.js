// Player selection state
let selectedCharacters = {
    player1Character: null,
    player2Character: null
};

// Grid navigation state
let currentPosition = {
    player1: 0,
    player2: 0
};

// Available characters
const characters = [
    { id: 'curse-or', name: 'CURSE-OR' },
    { id: 'reign', name: 'REIGN' }
];

// Function to update VS text visibility
function updateVsVisibility() {
    const player1Visible = document.getElementById('player1Preview').classList.contains('visible');
    const player2Visible = document.getElementById('player2Preview').classList.contains('visible');
    
    // Get the VS text element
    const vsText = document.querySelector('.vs-text');
    if (vsText) {
        // Show VS text only when both players have visible previews
        if (player1Visible && player2Visible) {
            vsText.style.opacity = '1';
        } else {
            vsText.style.opacity = '0.3';
        }
    }
}

// Character preview functions
function showCharacterPreview(imagePath, playerSide) {
    // If a character is already selected for this player, don't change the preview
    const playerNumber = playerSide === 'player1' ? 1 : 2;
    const characterKey = `player${playerNumber}Character`;
    
    // If a character is already selected for this player, don't change the preview on hover
    if (selectedCharacters[characterKey]) {
        console.log(`Character already selected for ${playerSide}, not changing preview on hover`);
        return;
    }
    
    const previewId = playerSide === 'player1' ? 'player1Preview' : 'player2Preview';
    const previewElement = document.getElementById(previewId);
    const previewImage = previewElement.querySelector('.preview-image');
    
    // Set the image
    previewImage.style.backgroundImage = `url(${imagePath})`;
    previewImage.style.backgroundSize = 'contain';
    previewImage.style.backgroundPosition = 'center bottom';
    previewImage.style.backgroundRepeat = 'no-repeat';
    
    // Show the preview
    previewElement.classList.add('visible');
    
    // Update VS visibility
    updateVsVisibility();
    
    // Log for debugging
    console.log(`Showing ${playerSide} preview with image: ${imagePath}`);
}

function hideCharacterPreview(playerSide) {
    // Get the player number from the playerSide
    const player = playerSide === 'player1' ? 1 : 2;
    const characterKey = `player${player}Character`;
    
    // If a character is selected for this player, don't hide the preview
    if (selectedCharacters[characterKey]) {
        console.log(`Not hiding preview for ${playerSide} because character is selected: ${selectedCharacters[characterKey]}`);
        
        // Instead, make sure the preview is visible and showing the correct character
        forceCharacterPreview(player, selectedCharacters[characterKey]);
        return;
    }
    
    // If no character is selected, hide the preview
    const previewId = playerSide === 'player1' ? 'player1Preview' : 'player2Preview';
    const previewElement = document.getElementById(previewId);
    
    console.log(`Hiding preview for ${playerSide} - no character selected`);
    previewElement.classList.remove('visible');
    previewElement.classList.remove('selected-character');
    
    // Update VS visibility
    updateVsVisibility();
}

function updateCharacterName(player, character) {
    const previewId = player === 1 ? 'player1Preview' : 'player2Preview';
    const previewElement = document.getElementById(previewId);
    const previewName = previewElement.querySelector('.preview-name');
    
    if (character) {
        // Show the correct character name based on the selected character
        if (character === 'curse-or') {
            previewName.textContent = 'CURSE-OR';
        } else if (character === 'reign') {
            previewName.textContent = 'REIGN';
        }
    } else {
        previewName.textContent = `Player ${player}`;
    }
}

function selectCharacter(player, character) {
    const clickedCard = event.currentTarget;
    const playerKey = `player${player}Character`;
    const previewId = player === 1 ? 'player1Preview' : 'player2Preview';
    const previewElement = document.getElementById(previewId);
    
    // Check if the character is available
    if (!characters.some(c => c.id === character)) {
        console.log(`Character ${character} is not available`);
        showMessage("This character is not available!");
        return;
    }
    
    // If clicking an already selected card, unselect it
    if (clickedCard.classList.contains(`selected-by-player${player}`)) {
        // Unselect the character
        clickedCard.classList.remove('selected', `selected-by-player${player}`);
        selectedCharacters[playerKey] = null;
        
        // Hide fight button since we no longer have both players selected
        const startFight = document.getElementById('startFight');
        if (startFight) {
            startFight.style.display = 'none';
        }

        showMessage(`Player ${player} unselected their character`);
        
        // Update character name in preview
        updateCharacterName(player, null);
        
        // Hide character preview
        previewElement.classList.remove('visible');
        previewElement.classList.remove('selected-character');
        
        return;
    }

    // Handle new selection
    try {
        const playerSide = document.getElementById(`player${player}Side`);
        
        // Clear previous selection for this player if any
        playerSide.querySelectorAll('.character-card').forEach(card => {
            if (card.classList.contains(`selected-by-player${player}`)) {
                card.classList.remove('selected', `selected-by-player${player}`);
            }
        });

        // Add new selection
        clickedCard.classList.add('selected', `selected-by-player${player}`);
        selectedCharacters[playerKey] = character;
        
        // Force the character preview to be visible
        forceCharacterPreview(player, character);

        // Check if both players have selected
        if (selectedCharacters.player1Character && selectedCharacters.player2Character) {
            enableFightButton();
            showMessage("Both players selected! Ready to fight!");
        } else {
            showMessage(`Player ${player} selected ${character === 'curse-or' ? 'CURSE-OR' : 'REIGN'}`);
        }

    } catch (error) {
        console.error('Error in selectCharacter:', error);
        showMessage("An error occurred. Please try again.");
    }
}

function enableFightButton() {
    const startFight = document.getElementById('startFight');
    if (startFight) {
        startFight.style.display = 'block';
        startFight.style.opacity = '1';
    }
}

function showMessage(message) {
    const messageElement = document.getElementById('selectionMessage');
    if (messageElement) {
        messageElement.textContent = message;
        messageElement.style.opacity = '1';
        
        setTimeout(() => {
            messageElement.style.opacity = '0';
        }, 2000);
    }
}

// Function to navigate to map selection screen
function goToMapSelection() {
    if (selectedCharacters.player1Character && selectedCharacters.player2Character) {
        console.log("Starting fight with:", selectedCharacters);
        
        // Store selected characters in session storage
        sessionStorage.setItem('player1Character', selectedCharacters.player1Character);
        sessionStorage.setItem('player2Character', selectedCharacters.player2Character);
        
        console.log('Player selections stored in session storage:',
            sessionStorage.getItem('player1Character'),
            sessionStorage.getItem('player2Character'));
        
        // Maintain fullscreen state during transition
        const wasFullscreen = document.fullscreenElement || sessionStorage.getItem('gameInFullscreen');
        
        // Navigate to maps screen
        window.location.href = 'maps.html';
    }
}

// Function to force a character preview to be visible (used after selection)
function forceCharacterPreview(player, character) {
    const previewId = player === 1 ? 'player1Preview' : 'player2Preview';
    const previewElement = document.getElementById(previewId);
    
    if (!previewElement) {
        console.error(`Preview element not found for Player ${player}`);
        return;
    }
    
    const previewImageElement = previewElement.querySelector('.preview-image');
    if (!previewImageElement) {
        console.error(`Preview image element not found for Player ${player}`);
        return;
    }
    
    // Determine the correct image path based on the character
    let imagePath;
    if (character === 'curse-or') {
        imagePath = player === 1 
            ? '../assests/players/character_1/Right_idle.gif' 
            : '../assests/players/character_1/Left_idle.gif';
    } else if (character === 'reign') {
        imagePath = player === 1 
            ? '../assests/players/character_2/2_Right_idle.gif' 
            : '../assests/players/character_2/2_Left_idle.gif';
    } else {
        console.error(`Unknown character: ${character}`);
        return;
    }
    
    // Set the image properties
    previewImageElement.style.backgroundImage = `url(${imagePath})`;
    previewImageElement.style.backgroundSize = 'contain';
    previewImageElement.style.backgroundPosition = 'center bottom';
    previewImageElement.style.backgroundRepeat = 'no-repeat';
    
    // Make sure the preview is visible
    previewElement.classList.add('visible');
    previewElement.classList.add('selected-character');
    
    // Update the character name
    updateCharacterName(player, character);
    
    // Update VS visibility
    updateVsVisibility();
    
    console.log(`Forced preview for Player ${player}, character: ${character}, image: ${imagePath}`);
}

// Game menu system
function createGameMenu() {
    const menuOverlay = document.createElement('div');
    menuOverlay.id = 'gameMenuOverlay';
    menuOverlay.className = 'menu-overlay';
    
    // Set the background image and effects
    menuOverlay.style.cssText = `
        background-image: 
            linear-gradient(
                rgba(0, 0, 0, 0.6), 
                rgba(0, 0, 0, 0.6)
            ),
            radial-gradient(
                circle at center,
                transparent 0%,
                rgba(0, 0, 0, 0.9) 100%
            ),
            url('../assests/maps/bgMain.gif');
        background-size: 200% 200%;
        background-position: center;
        width: 100%;
        height: 100vh;
        position: fixed;
        top: 0;
        left: 0;
    `;

    // Create particle container
    const particleContainer = document.createElement('div');
    particleContainer.id = 'particleContainer';
    menuOverlay.appendChild(particleContainer);

    // Create menu container
    const menuContainer = document.createElement('div');
    menuContainer.className = 'menu-container';

    // Create title
    const title = document.createElement('h1');
    title.className = 'game-title';
    title.textContent = 'VORTEX COMBAT';
    title.innerHTML = 'VORTEX <span class="shift-text">COMBAT</span>';
    menuContainer.appendChild(title);

    // Menu options
    const menuOptions = [
        { text: 'LOCAL PvP', action: startLocalPvP },
        { text: 'ONLINE PvP', action: null, disabled: true, comingSoon: true },
        { text: 'AUDIO SETTINGS', action: showAudioSettings },
        { text: 'CREDITS', action: showCredits },
        { text: 'ABOUT', action: showAbout }
    ];

    menuOptions.forEach(option => {
        const button = document.createElement('button');
        button.className = 'menu-button';
        if (option.disabled) {
            button.classList.add('disabled');
        }

        // Create button content container for complex layout
        const buttonContent = document.createElement('div');
        buttonContent.className = 'button-content';

        // Add main text
        const textSpan = document.createElement('span');
        textSpan.textContent = option.text;
        buttonContent.appendChild(textSpan);

        // Add coming soon label if applicable
        if (option.comingSoon) {
            const comingSoon = document.createElement('span');
            comingSoon.className = 'coming-soon';
            comingSoon.textContent = 'Coming Soon';
            buttonContent.appendChild(comingSoon);
        }

        button.appendChild(buttonContent);

        if (!option.disabled) {
            button.addEventListener('click', () => {
                playMenuSound();
                option.action();
            });
        }

        menuContainer.appendChild(button);
    });

    menuOverlay.appendChild(menuContainer);
    document.body.appendChild(menuOverlay);

    // Start particle animation
    createParticles();
}

function createParticles() {
    const container = document.getElementById('particleContainer');
    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
        createParticle(container);
    }
}

function createParticle(container) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    
    // Randomize particle properties
    const size = Math.random() * 3 + 1;
    const posX = Math.random() * 100;
    const delay = Math.random() * 5;
    const duration = Math.random() * 3 + 2;
    
    particle.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        left: ${posX}%;
        animation-delay: ${delay}s;
        animation-duration: ${duration}s;
    `;
    
    container.appendChild(particle);
    
    // Remove particle after animation and create a new one
    particle.addEventListener('animationend', () => {
        particle.remove();
        createParticle(container);
    });
}

function playMenuSound() {
    const menuSound = new Audio('../assests/audio/menu/menu_select.mp3');
    menuSound.volume = 0.5;
    menuSound.play().catch(e => console.warn('Menu sound play failed:', e));
}

function startLocalPvP() {
    console.log('Starting Local PvP...');
    
    // Play selection sound
    const selectSound = new Audio('../assests/audio/menu/menu_select.mp3');
    selectSound.volume = 0.5;
    selectSound.play().catch(e => console.warn('Sound play failed:', e));

    // Fade out menu overlay
    const menuOverlay = document.getElementById('gameMenuOverlay');
    if (menuOverlay) {
        menuOverlay.classList.add('fade-out');
        
        setTimeout(() => {
            // Remove menu overlay
            menuOverlay.remove();
            
            // Show character selection screen
            const charSelect = document.getElementById('charSelect');
            if (charSelect) {
                charSelect.style.display = 'flex';
                // Initialize character selection
                initializeCharacterSelection();
            } else {
                console.error('Character selection screen not found');
            }
        }, 500);
    }
}

function showAudioSettings() {
    const settingsOverlay = document.createElement('div');
    settingsOverlay.className = 'settings-overlay';
    
    const settingsContainer = document.createElement('div');
    settingsContainer.className = 'settings-container';
    
    const title = document.createElement('h2');
    title.textContent = 'Audio Settings';
    settingsContainer.appendChild(title);
    
    // Audio settings
    const audioSettings = [
        { name: 'Master Volume', id: 'masterVolume' },
        { name: 'Music Volume', id: 'musicVolume' },
        { name: 'SFX Volume', id: 'sfxVolume' },
        { name: 'Voice Volume', id: 'voiceVolume' }
    ];
    
    audioSettings.forEach(setting => {
        const settingDiv = document.createElement('div');
        settingDiv.className = 'setting-item';
        
        const label = document.createElement('label');
        label.textContent = setting.name;
        
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = '0';
        slider.max = '100';
        slider.value = '100';
        slider.className = 'volume-slider';
        slider.id = setting.id;
        
        const valueDisplay = document.createElement('span');
        valueDisplay.textContent = '100%';
        
        slider.addEventListener('input', (e) => {
            valueDisplay.textContent = `${e.target.value}%`;
            // Here you would also update the actual volume
        });
        
        settingDiv.appendChild(label);
        settingDiv.appendChild(slider);
        settingDiv.appendChild(valueDisplay);
        settingsContainer.appendChild(settingDiv);
    });
    
    // Back button
    const backButton = document.createElement('button');
    backButton.className = 'back-button';
    backButton.textContent = 'Back';
    backButton.onclick = () => {
        settingsOverlay.classList.add('fade-out');
        setTimeout(() => settingsOverlay.remove(), 500);
    };
    
    settingsContainer.appendChild(backButton);
    settingsOverlay.appendChild(settingsContainer);
    document.body.appendChild(settingsOverlay);
}

function showCredits() {
    const creditsOverlay = document.createElement('div');
    creditsOverlay.className = 'credits-overlay';
    
    const creditsContent = document.createElement('div');
    creditsContent.className = 'credits-content';
    
    // Credits content
    const credits = `
        <h2>VORTEX COMBAT</h2>
        <div class="credits-section">
            <h3>Game Development</h3>
            <p>Shalin Bhattarai</p>
            <p>Ashim Upadhaya</p>
        </div>
        
        <div class="credits-section">
            <h3>Art & Animation</h3>
            <p>Character Design Team</p>
            <p>Background Artists</p>
            <p>UI/UX Designers</p>
        </div>
        
        <div class="credits-section">
            <h3>Sound Design</h3>
            <p>Music Composition</p>
            <p>Sound Effects</p>
            <p>Voice Acting</p>
        </div>
        
        <div class="credits-section">
            <h3>Special Thanks</h3>
            <p>Our Amazing Testers</p>
            <p>The Fighting Game Community</p>
            <p>And You, The Player!</p>
        </div>
    `;
    
    creditsContent.innerHTML = credits;
    
    // Back button
    const backButton = document.createElement('button');
    backButton.className = 'back-button';
    backButton.textContent = 'Back';
    backButton.onclick = () => {
        creditsOverlay.classList.add('fade-out');
        setTimeout(() => creditsOverlay.remove(), 500);
    };
    
    creditsContent.appendChild(backButton);
    creditsOverlay.appendChild(creditsContent);
    document.body.appendChild(creditsOverlay);
    
    // Start the credits scroll animation
    setTimeout(() => {
        creditsContent.style.transform = `translateY(-${creditsContent.scrollHeight}px)`;
    }, 1000);
}

function showAbout() {
    const aboutOverlay = document.createElement('div');
    aboutOverlay.className = 'about-overlay';
    
    const aboutContainer = document.createElement('div');
    aboutContainer.className = 'about-container';
    
    const aboutContent = `
        <h2>About VORTEX COMBAT</h2>
        <div class="about-section">
            <p class="game-description">
                VORTEX COMBAT is an intense fighting game that combines traditional martial arts with supernatural shadow abilities. 
                In this unique combat experience, fighters can manipulate shadows to deceive and outmaneuver their opponents, 
                creating a dynamic and strategic battlefield.
            </p>
            
            <div class="feature-list">
                <h3>Key Features:</h3>
                <ul>
                    <li>Unique shadow manipulation mechanics</li>
                    <li>Dynamic combat system</li>
                    <li>Multiple fighting styles</li>
                    <li>Stunning visual effects</li>
                    <li>Strategic depth in every match</li>
                </ul>
            </div>
            
            <div class="creators-section">
                <h3>Created By:</h3>
                <p class="creator">Shalin Bhattarai</p>
                <p class="creator">Ashim Upadhaya</p>
            </div>
            
            <p class="version">Version 1.0</p>
        </div>
    `;
    
    aboutContainer.innerHTML = aboutContent;
    
    // Back button
    const backButton = document.createElement('button');
    backButton.className = 'back-button';
    backButton.textContent = 'Back';
    backButton.onclick = () => {
        aboutOverlay.classList.add('fade-out');
        setTimeout(() => aboutOverlay.remove(), 500);
    };
    
    aboutContainer.appendChild(backButton);
    aboutOverlay.appendChild(aboutContainer);
    document.body.appendChild(aboutOverlay);
}

// Modify the back button functionality in player selection
document.querySelector('.back-button')?.addEventListener('click', () => {
    // Play click sound
    const clickSound = new Audio('../assests/audio/menu/menu_select.mp3');
    clickSound.volume = 0.5;
    clickSound.play().catch(e => console.warn('Sound play failed:', e));

    // Hide character selection
    const charSelect = document.getElementById('charSelect');
    if (charSelect) {
        charSelect.style.display = 'none';
    }

    // Show menu overlay
    createGameMenu();
});

function createSplashScreen() {
    const splashOverlay = document.createElement('div');
    splashOverlay.className = 'splash-overlay';
    
    // Set the background image without rotation, keeping darkening and vignette
    splashOverlay.style.cssText = `
        background-image: 
            linear-gradient(
                rgba(0, 0, 0, 0.6), 
                rgba(0, 0, 0, 0.6)
            ),
            radial-gradient(
                circle at center,
                transparent 0%,
                rgba(0, 0, 0, 0.9) 100%
            ),
            url('../assests/maps/bgMain.gif');
        background-size: 200% 200%;
        background-position: center;
        width: 100%;
        height: 100vh;
        position: fixed;
        top: 0;
        left: 0;
    `;
    
    const logoContainer = document.createElement('div');
    logoContainer.className = 'logo-container';
    
    const title = document.createElement('h1');
    title.className = 'splash-title';
    title.innerHTML = 'VORTEX <span class="shift-text">COMBAT</span>';
    // Add text shadow for better readability
    title.style.textShadow = '0 0 20px rgba(0, 0, 0, 0.8)';
    
    const pressEnter = document.createElement('div');
    pressEnter.className = 'press-enter';
    pressEnter.textContent = 'PRESS ENTER TO START';
    // Add text shadow for better readability
    pressEnter.style.textShadow = '0 0 10px rgba(0, 0, 0, 0.8)';
    
    logoContainer.appendChild(title);
    logoContainer.appendChild(pressEnter);
    splashOverlay.appendChild(logoContainer);
    
    const particleContainer = document.createElement('div');
    particleContainer.id = 'splashParticleContainer';
    splashOverlay.appendChild(particleContainer);
    
    document.body.appendChild(splashOverlay);
    createSplashParticles();
}

function createSplashParticles() {
    const container = document.getElementById('splashParticleContainer');
    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'splash-particle';
        
        // Random particle properties
        const size = Math.random() * 4 + 2;
        const startPositionX = Math.random() * 100;
        const duration = Math.random() * 3 + 2;
        const delay = Math.random() * 2;

        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${startPositionX}%`;
        particle.style.animationDuration = `${duration}s`;
        particle.style.animationDelay = `${delay}s`;

        container.appendChild(particle);
    }
}

function initializeCharacterSelection() {
    console.log('Initializing character selection...');
    
    // Set up fight button
    const startFight = document.getElementById('startFight');
    if (startFight) {
        startFight.style.display = 'none';
        
        startFight.addEventListener('click', function() {
            // Play click sound
            if (window.SoundManager) {
                SoundManager.playClickSound();
            }
        });
        
        // Add hover sound to fight button
        startFight.addEventListener('mouseenter', function() {
            if (window.SoundManager) {
                SoundManager.playHoverSound();
            }
        });
    }

    // Clear any previous selections
    document.querySelectorAll('.character-card').forEach(card => {
        card.classList.remove('selected', 'selected-by-player1', 'selected-by-player2');
    });
    
    // Reset selected characters
    selectedCharacters = {
        player1Character: null,
        player2Character: null
    };
    
    // Hide all previews initially
    document.getElementById('player1Preview')?.classList.remove('visible', 'selected-character');
    document.getElementById('player2Preview')?.classList.remove('visible', 'selected-character');
    
    // Initialize VS text opacity
    const vsText = document.querySelector('.vs-text');
    if (vsText) {
        vsText.style.opacity = '0.3';
    }

    showMessage("Select your fighters!");
    
    // Debug log
    console.log('Character selection initialized');
    
    // Add event listeners to ensure character previews are properly displayed
    document.querySelectorAll('.character-card.selectable').forEach(card => {
        card.addEventListener('click', function(event) {
            // This is a backup to ensure the preview is displayed after clicking
            setTimeout(function() {
                // Check if a character was selected for player 1
                if (selectedCharacters.player1Character) {
                    forceCharacterPreview(1, selectedCharacters.player1Character);
                }
                
                // Check if a character was selected for player 2
                if (selectedCharacters.player2Character) {
                    forceCharacterPreview(2, selectedCharacters.player2Character);
                }
            }, 100);
        });
    });

    // Initialize keyboard navigation
    setupKeyboardNavigation();
    updateSelectionDisplay();
}

function setupKeyboardNavigation() {
    document.addEventListener('keydown', (event) => {
        // Player 1 controls (WASD + Space)
        if (!selectedCharacters.player1Character) {
            switch(event.key.toLowerCase()) {
                case 'a':
                    navigateGrid('player1', -1);
                    break;
                case 'd':
                    navigateGrid('player1', 1);
                    break;
                case ' ':
                    selectCurrentCharacter('player1');
                    break;
            }
        }
        
        // Player 2 controls (Arrow keys + Enter)
        if (!selectedCharacters.player2Character) {
            switch(event.key) {
                case 'ArrowLeft':
                    navigateGrid('player2', -1);
                    break;
                case 'ArrowRight':
                    navigateGrid('player2', 1);
                    break;
                case 'Enter':
                    selectCurrentCharacter('player2');
                    break;
            }
        }
    });
}

function navigateGrid(player, direction) {
    const newPosition = currentPosition[player] + direction;
    if (newPosition >= 0 && newPosition < characters.length) {
        currentPosition[player] = newPosition;
        updateSelectionHighlight(player);
    }
}

function updateSelectionHighlight(player) {
    // Remove previous highlights
    document.querySelectorAll('.character-option').forEach(option => {
        option.classList.remove(`${player}-selected`);
    });
    
    // Add highlight to current position
    const options = document.querySelectorAll('.character-option');
    options[currentPosition[player]]?.classList.add(`${player}-selected`);
}

function selectCurrentCharacter(player) {
    const selectedCharacter = characters[currentPosition[player]];
    if (selectedCharacter) {
        selectedCharacters[`${player}Character`] = selectedCharacter.id;
        updateSelectionDisplay();
        checkIfBothPlayersSelected();
    }
}

function updateSelectionDisplay() {
    // Update Player 1 selection display
    const player1Display = document.querySelector('.player1-selection .selected-character');
    if (player1Display) {
        player1Display.textContent = selectedCharacters.player1Character 
            ? characters.find(c => c.id === selectedCharacters.player1Character).name 
            : 'Not Selected';
    }
    
    // Update Player 2 selection display
    const player2Display = document.querySelector('.player2-selection .selected-character');
    if (player2Display) {
        player2Display.textContent = selectedCharacters.player2Character 
            ? characters.find(c => c.id === selectedCharacters.player2Character).name 
            : 'Not Selected';
    }
}

function checkIfBothPlayersSelected() {
    if (selectedCharacters.player1Character && selectedCharacters.player2Character) {
        // Store selections in session storage
        sessionStorage.setItem('player1Character', selectedCharacters.player1Character);
        sessionStorage.setItem('player2Character', selectedCharacters.player2Character);
        
        // Redirect to fight screen after a short delay
        setTimeout(() => {
            window.location.href = 'fight.html';
        }, 1000);
    }
}

// Add fullscreen maintenance for document
document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement) {
        sessionStorage.setItem('gameInFullscreen', 'true');
    }
});

// Function to handle splash screen transition
function handleSplashTransition() {
    const splashOverlay = document.querySelector('.splash-overlay');
    if (splashOverlay) {
        // Try to play music on transition
        SoundManager.playBackgroundMusic('characterSelect');
        
        // Add fade out animation
        splashOverlay.classList.add('fade-out');

        // Remove splash overlay and show menu after animation
        setTimeout(() => {
            splashOverlay.remove();
            createGameMenu();
        }, 1000);
    }
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Add click listener for music
    document.body.addEventListener('click', () => {
        SoundManager.playBackgroundMusic('characterSelect');
    }, { once: true });

    // Add keydown listener for music
    document.body.addEventListener('keydown', () => {
        SoundManager.playBackgroundMusic('characterSelect');
    }, { once: true });

    // Ensure we're in fullscreen mode if we were before
    if (sessionStorage.getItem('gameInFullscreen') && !document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.warn('Auto-fullscreen failed:', err);
        });
    }

    // Hide character selection initially
    const charSelect = document.getElementById('charSelect');
    if (charSelect) {
        charSelect.style.display = 'none';
    }

    // Check if we should skip the splash screen
    const skipSplash = sessionStorage.getItem('skipSplash') === 'true';
    // Clear the skip flag after checking it
    sessionStorage.removeItem('skipSplash');
    
    // Check if we're coming from index.html
    const comingFromIndex = document.referrer.endsWith('index.html');
    
    if (comingFromIndex && !skipSplash) {
        // Start with splash screen
        createSplashScreen();
    } else {
        // Skip splash and show menu directly
        createGameMenu();
    }

    // Add Enter key event listener
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            const splashOverlay = document.querySelector('.splash-overlay');
            if (splashOverlay) {
                handleSplashTransition();
            }
        }
    });
});