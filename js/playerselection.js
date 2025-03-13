// Immediately hide character select to prevent flash
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're coming from the map page
    const comingFromMap = sessionStorage.getItem('comingFromMap') === 'true';
    
    // Only hide character select if not coming from map page
    if (!comingFromMap) {
        console.log('Initial check - hiding character select to prevent flash');
        const charSelect = document.getElementById('charSelect');
        if (charSelect) {
            charSelect.style.cssText = 'display: none !important; visibility: hidden !important; opacity: 0 !important;';
        }
    } else {
        console.log('Initial check - coming from map page, not hiding character select');
    }
}, { once: true });

// Handle interaction overlay transition
document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('interaction-overlay');
    const charSelect = document.getElementById('charSelect');
    
    // Check if we're coming from the map page
    const comingFromMap = sessionStorage.getItem('comingFromMap') === 'true';
    
    // Immediately hide the character select screen and ensure it stays hidden
    // but only if not coming from map page
    if (charSelect && !comingFromMap) {
        console.log('Interaction handler - hiding character select (not coming from map)');
        charSelect.style.display = 'none';
        charSelect.style.visibility = 'hidden'; // Add extra protection against flashing
    } else if (charSelect && comingFromMap) {
        console.log('Interaction handler - keeping character select visible (coming from map)');
    }

    // Function to handle transition
    function handleTransition() {
        if (!overlay || overlay.classList.contains('transitioning')) {
            return;
        }
        
        // Add transitioning class to start animation
        overlay.classList.add('transitioning');
        
        // After transition animation completes
        setTimeout(() => {
            if (overlay) {
                overlay.style.display = 'none';
            }
            
            // Store in session storage that we've seen the intro
            sessionStorage.setItem('introSeen', 'true');
            
            // Show splash screen next
            createSplashScreen();
            
        }, 1500); // Match this with the CSS animation duration
    }

    // Only show interaction overlay if coming directly from index.html
    const comingFromIndex = document.referrer.endsWith('index.html');
    const introSeen = sessionStorage.getItem('introSeen') === 'true';
    
    if (overlay) {
        if (comingFromIndex && !introSeen && !comingFromMap) {
            // Coming from index.html and haven't seen intro - show the overlay
            console.log('Showing interactive overlay - coming from index.html');
            
            // Event listeners for interaction
            document.addEventListener('keydown', handleTransition);
            overlay.addEventListener('click', handleTransition);
            overlay.addEventListener('touchstart', handleTransition);
            } else {
            // Skip the overlay and determine next screen
            console.log('Skipping interactive overlay');
            overlay.style.display = 'none';
            
            // Determine which screen to show next
            determineStartScreen();
        }
    } else {
        // No overlay found, determine next screen
        determineStartScreen();
    }
});

// Function to determine which screen to show based on where user is coming from
function determineStartScreen() {
    // Check if we're coming from the fight page
    const comingFromFight = sessionStorage.getItem('comingFromFight') === 'true';
    
    // Check if we're coming from the map page
    const comingFromMap = sessionStorage.getItem('comingFromMap') === 'true';
    
    // Check if we've seen the intro
    const introSeen = sessionStorage.getItem('introSeen') === 'true';
    
    // Check if we should skip the splash screen
    const skipSplash = sessionStorage.getItem('skipSplash') === 'true';
    
    console.log('Screen determination flags:', {
        comingFromMap,
        comingFromFight,
        introSeen,
        skipSplash
    });
    
    // Clear the flags after checking them
    sessionStorage.removeItem('skipSplash');
    
    if (comingFromMap) {
        // Coming from map page - show character selection directly
        console.log('Coming from map page - showing character selection directly');
        // Clear the flag after using it
        sessionStorage.removeItem('comingFromMap');
        
        // Ensure any existing overlays are removed
        const existingOverlays = document.querySelectorAll('.menu-overlay, .splash-overlay, .interaction-overlay');
        existingOverlays.forEach(overlay => {
            console.log('Removing existing overlay:', overlay.className);
            overlay.remove();
        });
        
        // Show character selection with a slight delay to ensure DOM is ready
        setTimeout(() => {
            showCharacterSelection();
        }, 50);
    } else if (comingFromFight) {
        // Coming from fight page - show menu directly
        console.log('Coming from fight page - showing menu directly');
        createGameMenu();
        
        // Clear the flag
        sessionStorage.removeItem('comingFromFight');
    } else if (introSeen && !skipSplash) {
        // We've seen the intro but not explicitly skipping splash - show splash
        console.log('Intro seen but not skipping splash - showing splash screen');
        createSplashScreen();
    } else {
        // Default case - show menu
        console.log('Showing game menu directly');
        createGameMenu();
    }
}

// Function to show character selection screen directly
function showCharacterSelection() {
    console.log('Showing character selection screen directly');
    
    // Get the character selection screen
    const charSelect = document.getElementById('charSelect');
    if (charSelect) {
        console.log('Found charSelect element, making it visible');
        
        // Reset any forced styles with !important flags
        charSelect.style.cssText = 'display: flex !important; visibility: visible !important; opacity: 1 !important;';
        
        // Hide the interaction overlay if it exists
        const overlay = document.getElementById('interaction-overlay');
        if (overlay) {
            console.log('Hiding interaction overlay');
            overlay.style.display = 'none';
        }
        
        // Initialize character selection
        console.log('Initializing character selection');
        initializeCharacterSelection();
        
        // Make sure the back button is visible
        const backButton = document.querySelector('.back-button');
        if (backButton) {
            console.log('Making back button visible');
            backButton.style.display = 'block';
        } else {
            console.warn('Back button not found');
        }
        
        // Ensure the fight button is initially hidden
        const startFight = document.getElementById('startFight');
        if (startFight) {
            console.log('Hiding fight button initially');
            startFight.style.display = 'none';
        } else {
            console.warn('Start fight button not found');
        }
        
        // Play background music if SoundManager is available
        if (window.SoundManager) {
            console.log('Playing background music');
            SoundManager.playBackgroundMusic('characterSelect');
        }
        
        // Force a reflow to ensure the display changes take effect
        void charSelect.offsetWidth;
        
        // Double-check visibility after a short delay
        setTimeout(() => {
            if (charSelect.style.display !== 'flex' || 
                charSelect.style.visibility !== 'visible' || 
                charSelect.style.opacity !== '1') {
                console.log('Forcing visibility again after delay');
                charSelect.style.cssText = 'display: flex !important; visibility: visible !important; opacity: 1 !important;';
            }
        }, 100);
    } else {
        console.error('Character selection screen (charSelect) not found!');
        // Debug what elements are available
        console.log('Available elements:', document.body.innerHTML);
    }
}

// Handle the interaction overlay (legacy code, kept for compatibility)
document.addEventListener('DOMContentLoaded', function() {
    const interactionOverlay = document.getElementById('interaction-overlay');
    
    // Skip if no overlay or we're not showing it
    if (!interactionOverlay || interactionOverlay.style.display === 'none') {
        return;
    }
    
    // Handle the interaction
    const handleInteraction = function(event) {
        // Initialize audio context and play background music
        if (window.SoundManager && typeof window.SoundManager.initialize === 'function') {
            window.SoundManager.initialize();
            // Play background music after initialization
            if (typeof window.SoundManager.playBackgroundMusic === 'function') {
                window.SoundManager.playBackgroundMusic('playerselection');
            }
        }
        
        // Add fade out animation
        interactionOverlay.classList.add('fade-out');
        
        // Remove the overlay after animation
        setTimeout(() => {
            interactionOverlay.remove();
            // Remove the event listeners
            document.removeEventListener('keydown', handleInteraction);
            document.removeEventListener('click', handleInteraction);
            document.removeEventListener('touchstart', handleInteraction);
        }, 1000);
    };
    
    // Add event listeners for multiple types of interaction
    document.addEventListener('keydown', handleInteraction);
    document.addEventListener('click', handleInteraction);
    document.addEventListener('touchstart', handleInteraction);
});

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
        { text: 'AUDIO SETTINGS', action: () => {
            if (window.SoundManager) {
                SoundManager.playClickSound();
            }
            setTimeout(() => {
                showAudioSettings();
            }, 100);
        }},
        { text: 'CREDITS', action: showCredits },
        { text: 'ABOUT', action: showAbout },
        { text: 'FEEDBACK', action: () => {
            // Open the Google Form in a new tab
            window.open('https://docs.google.com/forms/d/e/1FAIpQLSe78hv1swHFqCRGz6XvNqbnyzDfu61RzZSuB7nJMYHjwnKVkw/viewform?usp=dialog', '_blank');
        }}
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
                if (option.text !== 'AUDIO SETTINGS') {
                    playMenuSound();
                }
                option.action();
            });

            // Add hover sound
            button.addEventListener('mouseenter', () => {
                if (window.SoundManager) {
                    SoundManager.playHoverSound();
                }
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
    if (window.SoundManager) {
        SoundManager.playClickSound();
    } else {
        const selectSound = new Audio('../assests/audio/menu/menu_select.mp3');
        selectSound.volume = 0.5;
        selectSound.play().catch(e => console.warn('Sound play failed:', e));
    }

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
                console.log('Showing character selection from menu');
                
                // Reset any forced styles with !important flags
                charSelect.style.cssText = 'display: flex !important; visibility: visible !important; opacity: 1 !important;';
                
                // Initialize character selection
                initializeCharacterSelection();
                
                // Make sure the back button is visible
                const backButton = document.querySelector('.back-button');
                if (backButton) {
                    console.log('Making back button visible');
                    backButton.style.display = 'block';
                } else {
                    console.warn('Back button not found');
                }
                
                // Ensure the fight button is initially hidden
                const startFight = document.getElementById('startFight');
                if (startFight) {
                    console.log('Hiding fight button initially');
                    startFight.style.display = 'none';
                } else {
                    console.warn('Start fight button not found');
                }
                
                // Force a reflow to ensure the display changes take effect
                void charSelect.offsetWidth;
                
                console.log('Character selection screen displayed');
            } else {
                console.error('Character selection screen not found');
            }
        }, 500);
    }
}

// Function to update all audio volumes
function updateAudioVolumes() {
    if (!window.SoundManager) {
        console.error('SoundManager not found');
        return;
    }

    const bgmVolume = (sessionStorage.getItem('bgmVolume') || 80) / 100;
    const sfxVolume = (sessionStorage.getItem('sfxVolume') || 50) / 100;

    console.log('Updating volumes - BGM:', bgmVolume, 'SFX:', sfxVolume);

    // Update background music volume
    Object.values(SoundManager.music).forEach(track => {
        if (track) {
            track.volume = bgmVolume;
            console.log('Set track volume:', track.src, track.volume);
        }
    });
    if (SoundManager.currentMusic) {
        SoundManager.currentMusic.volume = bgmVolume;
        console.log('Set current music volume:', SoundManager.currentMusic.volume);
    }

    // Update sound effects volume
    Object.values(SoundManager.sounds).forEach(sound => {
        if (sound) {
            sound.volume = sfxVolume;
            console.log('Set sound volume:', sound.src, sound.volume);
        }
    });
}

function showAudioSettings() {
    console.log('Opening audio settings...');
    
    // Create settings overlay
    const settingsOverlay = document.createElement('div');
    settingsOverlay.className = 'settings-overlay';
    settingsOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100vh;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;
    
    const settingsContainer = document.createElement('div');
    settingsContainer.className = 'settings-container';
    settingsContainer.style.cssText = `
        background: rgba(20, 20, 20, 0.95);
        padding: 2rem;
        border-radius: 10px;
        min-width: 300px;
        border: 2px solid #ff0000;
    `;
    
    const title = document.createElement('h2');
    title.textContent = 'AUDIO SETTINGS';
    title.style.cssText = `
        text-align: center;
        font-size: 2em;
        margin-bottom: 1.5em;
        color: #ff0000;
        font-family: 'Press Start 2P', cursive;
    `;
    settingsContainer.appendChild(title);
    
    // Audio settings
    const audioSettings = [
        { name: 'Background Music', id: 'bgmVolume', defaultValue: 80 },
        { name: 'Sound Effects', id: 'sfxVolume', defaultValue: 50 }
    ];
    
    audioSettings.forEach(setting => {
        const settingDiv = document.createElement('div');
        settingDiv.className = 'setting-item';
        settingDiv.style.cssText = `
            margin-bottom: 1.5rem;
        `;
        
        const label = document.createElement('label');
        label.textContent = setting.name;
        label.style.cssText = `
            color: #ff0000;
            display: block;
            margin-bottom: 0.5rem;
            font-family: 'Press Start 2P', cursive;
            font-size: 0.8em;
        `;
        
        const savedValue = parseInt(sessionStorage.getItem(setting.id)) || setting.defaultValue;
        
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = '0';
        slider.max = '100';
        slider.value = savedValue;
        slider.className = 'volume-slider';
        slider.id = setting.id;
        slider.style.cssText = `
            width: 100%;
            height: 4px;
            -webkit-appearance: none;
            background: linear-gradient(to right, #ff0000 ${savedValue}%, #333 ${savedValue}%);
            outline: none;
            opacity: 0.7;
            transition: opacity .2s;
            border-radius: 2px;
            cursor: pointer;
        `;
        
        slider.addEventListener('input', (e) => {
            const value = e.target.value;
            slider.style.background = `linear-gradient(to right, #ff0000 ${value}%, #333 ${value}%)`;
            
            // Store the value in session storage
            sessionStorage.setItem(setting.id, value);
            
            // Update the volume in SoundManager
            if (window.SoundManager) {
                const volume = value / 100;
                if (setting.id === 'bgmVolume') {
                    // Update all music tracks
                    Object.values(SoundManager.music).forEach(track => {
                        if (track) {
                            track.volume = volume;
                        }
                    });
                    if (SoundManager.currentMusic) {
                        SoundManager.currentMusic.volume = volume;
                    }
                } else if (setting.id === 'sfxVolume') {
                    // Update all sound effects
                    Object.values(SoundManager.sounds).forEach(sound => {
                        if (sound) {
                            sound.volume = volume;
                        }
                    });
                    // Play a test sound
                    SoundManager.playHoverSound();
                }
            }
        });
        
        settingDiv.appendChild(label);
        settingDiv.appendChild(slider);
        settingsContainer.appendChild(settingDiv);
    });
    
    // Back button
    const backButton = document.createElement('button');
    backButton.className = 'back-button';
    backButton.textContent = 'BACK';
    backButton.style.cssText = `
        background: #ff0000;
        color: white;
        border: none;
        padding: 10px;
        width: 100%;
        border-radius: 5px;
        cursor: pointer;
        font-size: 1em;
        font-family: 'Press Start 2P', cursive;
        margin-top: 1rem;
    `;
    
    backButton.addEventListener('mouseover', () => {
        backButton.style.background = '#ff3333';
        if (window.SoundManager) {
            SoundManager.playHoverSound();
        }
    });
    
    backButton.addEventListener('mouseout', () => {
        backButton.style.background = '#ff0000';
    });
    
    backButton.addEventListener('click', () => {
        if (window.SoundManager) {
            SoundManager.playClickSound();
        }
        settingsOverlay.remove();
    });
    
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
            <h3>Asset Credits</h3>
            <p>We want to express our heartfelt gratitude to the talented creators who made their artwork, music, and sound effects freely available for use in projects like ours.</p>
            <p>Vortex Combat utilizes these assets to bring the game to life, but we do not claim ownership over any of them.</p>
        </div>
        
        <div class="credits-section">
            <h3>Special Thanks</h3>
            <p>To the generous artists, musicians, and designers who shared their work</p>
            <p>Your contributions made this game possible</p>
            <p>The Fighting Game Community</p>
            <p>And You, The Player!</p>
        </div>
        
        <div class="credits-section">
            <h3>Development Time</h3>
            <p>This game was created in 2 weeks</p>
            <p>Built with pure JavaScript, HTML, and CSS</p>
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

// Initialize back button functionality
function initializeBackButton() {
    console.log('Initializing back button...');
    
    // Find the back button
    const backButton = document.querySelector('.back-button');
    
    if (backButton) {
        console.log('Back button found, adding event listener');
        
        // Remove any existing event listeners
        backButton.replaceWith(backButton.cloneNode(true));
        
        // Get the fresh reference
        const newBackButton = document.querySelector('.back-button');
        
        // Add click event listener
        newBackButton.addEventListener('click', () => {
            console.log('Back button clicked');
            
            // Play click sound
            if (window.SoundManager) {
                SoundManager.playClickSound();
            }
            
            // Hide character selection
            const charSelect = document.getElementById('charSelect');
            if (charSelect) {
                charSelect.style.display = 'none';
            }
            
            // Show menu overlay
            createGameMenu();
        });
    } else {
        console.warn('Back button not found during initialization');
    }
}

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

// Call this function during character selection initialization
function initializeCharacterSelection() {
    console.log('Initializing character selection...');
    
    // Initialize back button
    initializeBackButton();
    
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
        if (window.SoundManager) {
            SoundManager.playBackgroundMusic('characterSelect');
        }
        
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
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM content loaded - initializing page');
    
    // Check if we're coming from the map page
    const comingFromMap = sessionStorage.getItem('comingFromMap') === 'true';
    
    // Only hide character select if not coming from map page
    if (!comingFromMap) {
        console.log('Not coming from map page - hiding character select initially');
        const charSelect = document.getElementById('charSelect');
        if (charSelect) {
            charSelect.style.cssText = 'display: none !important; visibility: hidden !important; opacity: 0 !important;';
        }
    } else {
        console.log('Coming from map page - keeping character select visible');
    }

    // Initialize character selection
    initializeCharacterSelection();
    
    // Initialize SoundManager if it exists
    if (window.SoundManager && !SoundManager.soundsLoaded) {
        console.log('Initializing SoundManager...');
        SoundManager.init();
    }

    // Update audio volumes from session storage
    updateAudioVolumes();

    // Add click listener for music
    document.body.addEventListener('click', () => {
        if (window.SoundManager) {
            SoundManager.playBackgroundMusic('characterSelect');
            // Update volumes after starting music
            updateAudioVolumes();
        }
    }, { once: true });

    // Add keydown listener for music
    document.body.addEventListener('keydown', () => {
        if (window.SoundManager) {
            SoundManager.playBackgroundMusic('characterSelect');
            // Update volumes after starting music
            updateAudioVolumes();
        }
    }, { once: true });

    // Add Enter key event listener for splash screen
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            const splashOverlay = document.querySelector('.splash-overlay');
            if (splashOverlay) {
                handleSplashTransition();
            }
        }
    });
});