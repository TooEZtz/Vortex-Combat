let selectedMap = null;
let mapImages = {}; // Store map images for hover effect

// Maintain fullscreen state
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're coming from the fight page
    const comingFromFight = sessionStorage.getItem('comingFromFight') === 'true';
    
    // Check if we're coming from player selection (and not from fight)
    const comingFromPlayerSelection = !comingFromFight && document.referrer.endsWith('playerselection.html');
    
    // Initialize SoundManager if needed
    if (window.SoundManager && !SoundManager.soundsLoaded) {
        SoundManager.init();
    }

    // Play background music immediately if coming from fight
    if (comingFromFight) {
        if (window.SoundManager) {
            SoundManager.playBackgroundMusic('mapSelect');
        }
    } else if (comingFromPlayerSelection) {
        createControlsOverlay();
    } else {
        // Normal initialization from other pages
        if (window.SoundManager) {
            SoundManager.playBackgroundMusic('mapSelect');
        }
    }
});

document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement) {
        sessionStorage.setItem('gameInFullscreen', 'true');
    }
});

// Function to handle back button click with sound
function goToPlayerSelection() {
    console.log('Going back to player selection...');
    
    // Set a flag to indicate we're coming from the map page
    sessionStorage.setItem('comingFromMap', 'true');
    
    // Also set a flag to skip the splash screen
    sessionStorage.setItem('skipSplash', 'true');
    
    // Play click sound and navigate after it completes
    if (window.SoundManager) {
        // Play the sound
        SoundManager.playClickSound();
        
        // Wait for the sound to play a bit before navigating
        setTimeout(function() {
            console.log('Navigating to player selection...');
            window.location.href = 'playerselection.html';
        }, 300);
    } else {
        // If SoundManager is not available, just navigate
        window.location.href = 'playerselection.html';
    }
}

// Function to navigate to fight screen with sound
function goToFight() {
    console.log('Going to fight screen...');
    
    // Store selected map in session storage
    if (selectedMap) {
        sessionStorage.setItem('selectedMap', selectedMap);
        console.log('Selected map stored in session storage:', selectedMap);
    }
    
    // Play click sound and navigate after it completes
    if (window.SoundManager) {
        // Create a new audio element specifically for this navigation
        const clickSound = new Audio('../assests/audio/button_click.mp3');
        clickSound.volume = 0.5;
        
        // When the sound can play, play it and set up navigation
        clickSound.addEventListener('canplaythrough', function() {
            console.log('Navigation sound loaded, playing...');
            
            // Play the sound
            const playPromise = clickSound.play();
            
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    console.log('Navigation sound played, waiting before redirect...');
                    
                    // Wait for the sound to play a bit before navigating
                    setTimeout(function() {
                        console.log('Navigating to fight screen...');
                        window.location.href = 'fight.html';
                    }, 300);
                }).catch(error => {
                    console.error('Error playing navigation sound:', error);
                    // Navigate anyway if sound fails
                    window.location.href = 'fight.html';
                });
            } else {
                // Fallback if play() doesn't return a promise
                setTimeout(function() {
                    window.location.href = 'fight.html';
                }, 300);
            }
        });
        
        // If there's an error loading the sound, navigate anyway
        clickSound.addEventListener('error', function() {
            console.error('Error loading navigation sound');
            window.location.href = 'fight.html';
        });
        
        // Start loading the sound
        clickSound.load();
    } else {
        // If SoundManager is not available, just navigate
        window.location.href = 'fight.html';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Check if player selections exist in session storage
    const player1Character = sessionStorage.getItem('player1Character');
    const player2Character = sessionStorage.getItem('player2Character');
    
    console.log('Map selection loaded with player selections:', player1Character, player2Character);
    
    // If player selections don't exist, redirect to player selection screen
    if (!player1Character || !player2Character) {
        console.warn('Player selections not found. Redirecting to player selection screen.');
        
        // Show an alert to inform the user
        alert('Please select your fighters first!');
        
        // Redirect to player selection screen
        window.location.href = 'playerselection.html';
        return;
    }
    
    // Make sure the back button is always visible
    const backButton = document.getElementById('backButton');
    if (backButton) {
        backButton.style.display = 'block';
    }
    
    // Ensure the fight button is initially hidden
    const startFight = document.getElementById('startFight');
    if (startFight) {
        startFight.style.display = 'none';
    }
    
    setupMapImages();
    setupMapSelection();
    setupMapHoverEffects();
});

function setupMapImages() {
    // Define the map images
    const maps = [
        { id: 'temple', file: 'Celestial_Palace.gif' },
        { id: 'palace', file: 'Haunted.gif' },
        { id: 'pit', file: 'TheChinaTown.gif' },
        { id: 'bridge', file: 'Giaia.gif' }
    ];
    
    // Store the image paths for hover effects
    maps.forEach(map => {
        mapImages[map.id] = `../assests/maps/${map.file}`;
    });
}

function setupMapHoverEffects() {
    const backgroundContainer = document.querySelector('.background-container');
    const mapCards = document.querySelectorAll('.map-card');
    
    // Set default background
    if (backgroundContainer) {
        backgroundContainer.style.backgroundImage = 'none';
    }
    
    mapCards.forEach(card => {
        const mapId = card.dataset.map;
        
        // Mouse enter - show map background
        card.addEventListener('mouseenter', function() {
            console.log('Hovering over map:', mapId);
            
            // Play hover sound
            if (window.SoundManager) {
                SoundManager.playHoverSound();
            }
            
            if (backgroundContainer && mapImages[mapId]) {
                backgroundContainer.style.backgroundImage = `url(${mapImages[mapId]})`;
                backgroundContainer.style.opacity = '0.7';
                
                // Add a dramatic effect
                document.body.classList.add('map-hover');
                
                // Highlight this card
                mapCards.forEach(c => {
                    if (c !== card) {
                        c.style.opacity = '0.7';
                    }
                });
            }
        });
        
        // Mouse leave - hide map background if no map is selected
        card.addEventListener('mouseleave', function() {
            console.log('Mouse left map:', mapId);
            
            // Reset other cards
            mapCards.forEach(c => {
                c.style.opacity = '1';
            });
            
            // Remove dramatic effect
            document.body.classList.remove('map-hover');
            
            if (backgroundContainer && !selectedMap) {
                // Fade out background when not hovering over any map
                backgroundContainer.style.opacity = '0';
            } else if (backgroundContainer && selectedMap) {
                // Show selected map background
                backgroundContainer.style.backgroundImage = `url(${mapImages[selectedMap]})`;
                backgroundContainer.style.opacity = '0.7';
            }
        });
    });
}

function setupMapSelection() {
    const mapCards = document.querySelectorAll('.map-card');
    const startFight = document.getElementById('startFight');
    const backButton = document.getElementById('backButton');
    const backgroundContainer = document.querySelector('.background-container');
    
    console.log('Map cards found:', mapCards.length);
    console.log('Start fight button found:', !!startFight);
    console.log('Back button found:', !!backButton);
    
    // Ensure the back button is always visible
    if (backButton) {
        backButton.style.display = 'block';
    }
    
    // Ensure the fight button is initially hidden
    if (startFight) {
        startFight.style.display = 'none';
    } else {
        console.error('Start fight button not found!');
    }
    
    mapCards.forEach(card => {
        console.log('Setting up click handler for map:', card.dataset.map);
        
        card.addEventListener('click', function() {
            const mapId = this.dataset.map;
            console.log('Map card clicked:', mapId);
            
            // Play click sound
            if (window.SoundManager) {
                SoundManager.playClickSound();
            }
            
            // Check if this card is already selected
            if (this.classList.contains('selected')) {
                console.log('Deselecting map:', mapId);
                
                // Deselect the card
                this.classList.remove('selected');
                selectedMap = null;
                
                // Hide fight button
                if (startFight) {
                    startFight.style.display = 'none';
                    console.log('Fight button hidden');
                }
                
                // Clear background
                if (backgroundContainer) {
                    backgroundContainer.style.opacity = '0';
                    document.body.classList.remove('map-hover');
                }
                
                // Reset all cards opacity
                mapCards.forEach(c => {
                    c.style.opacity = '1';
                });
            } else {
                console.log('Selecting map:', mapId);
                
                // Remove previous selection
                mapCards.forEach(c => c.classList.remove('selected'));
                
                // Add new selection
                this.classList.add('selected');
                selectedMap = mapId;
                
                // Show fight button
                if (startFight) {
                    startFight.style.display = 'block';
                    console.log('Fight button shown');
                }
                
                // Set background to selected map
                if (backgroundContainer && mapImages[mapId]) {
                    backgroundContainer.style.backgroundImage = `url(${mapImages[mapId]})`;
                    backgroundContainer.style.opacity = '0.7';
                    document.body.classList.add('map-hover');
                    
                    // Highlight selected card
                    mapCards.forEach(c => {
                        if (c !== this) {
                            c.style.opacity = '0.7';
                        }
                    });
                }
            }
        });
    });
    
    if (startFight) {
        // We're now handling the click in the HTML onclick attribute
        // This event listener is kept for backward compatibility
        startFight.addEventListener('click', function() {
            console.log('Fight button clicked, selected map:', selectedMap);
            
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
}

// Function to create and show the controls overlay
function createControlsOverlay() {
    const overlayContainer = document.createElement('div');
    overlayContainer.className = 'controls-overlay';
    overlayContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100vh;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        color: white;
        font-family: 'Arial', sans-serif;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
        text-align: center;
        padding: 2rem;
        background: rgba(51, 51, 51, 0.8);
        border-radius: 10px;
        max-width: 800px;
        margin: 20px;
    `;

    const title = document.createElement('h2');
    title.textContent = 'GAME CONTROLS';
    title.style.cssText = `
        font-size: 2.5em;
        margin-bottom: 1.5em;
        color: #ff0000;
        text-shadow: 0 0 10px rgba(255, 0, 0, 0.5);
    `;

    const controlsContainer = document.createElement('div');
    controlsContainer.style.cssText = `
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
        margin-bottom: 2em;
    `;

    // Player 1 Controls
    const player1Controls = document.createElement('div');
    player1Controls.innerHTML = `
        <h3 style="color: #4a9eff; font-size: 1.5em; margin-bottom: 1em;">PLAYER 1</h3>
        <div style="text-align: left; font-size: 1.2em; line-height: 1.8;">
            <p>🎮 W - Jump</p>
            <p>🎮 A - Move Left</p>
            <p>🎮 D - Move Right</p>
            <p>🛡️ S - Guard</p>
            <p>👊 F - Punch</p>
            <p>🦶 G - Kick</p>
            <p>⚡ Left Shift + A/D - Shadow Shift</p>
        </div>
    `;

    // Player 2 Controls
    const player2Controls = document.createElement('div');
    player2Controls.innerHTML = `
        <h3 style="color: #ff4a4a; font-size: 1.5em; margin-bottom: 1em;">PLAYER 2</h3>
        <div style="text-align: left; font-size: 1.2em; line-height: 1.8;">
            <p>🎮 ↑ - Jump</p>
            <p>🎮 ← - Move Left</p>
            <p>🎮 → - Move Right</p>
            <p>🛡️ ↓ - Guard</p>
            <p>👊 K - Punch</p>
            <p>🦶 L - Kick</p>
            <p>⚡ Right Shift + ←/→ - Shadow Shift</p>
        </div>
    `;

    const continueText = document.createElement('p');
    continueText.textContent = 'Press ENTER or Click anywhere to continue';
    continueText.style.cssText = `
        font-size: 1.2em;
        color: #ffff00;
        margin-top: 2em;
        animation: pulse 1.5s infinite;
    `;

    // Add animation style
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
    `;
    document.head.appendChild(style);

    // Add all elements to the overlay
    controlsContainer.appendChild(player1Controls);
    controlsContainer.appendChild(player2Controls);
    content.appendChild(title);
    content.appendChild(controlsContainer);
    content.appendChild(continueText);
    overlayContainer.appendChild(content);
    document.body.appendChild(overlayContainer);

    // Add event listeners to close overlay
    document.addEventListener('keydown', function closeOnEnter(e) {
        if (e.key === 'Enter') {
            if (window.SoundManager) {
                SoundManager.playClickSound();
            }
            // Add fade out animation
            overlayContainer.style.opacity = '0';
            overlayContainer.style.transition = 'opacity 0.5s';
            
            // Remove overlay after fade out
            setTimeout(() => {
                overlayContainer.remove();
                document.removeEventListener('keydown', closeOnEnter);
            }, 500);
        }
    });

    overlayContainer.addEventListener('click', function() {
        if (window.SoundManager) {
            SoundManager.playClickSound();
        }
        // Add fade out animation
        overlayContainer.style.opacity = '0';
        overlayContainer.style.transition = 'opacity 0.5s';
        
        // Remove overlay after fade out
        setTimeout(() => {
            overlayContainer.remove();
        }, 500);
    });
}