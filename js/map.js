let selectedMap = null;
let mapImages = {}; // Store map images for hover effect

// Function to handle back button click with sound
function goToPlayerSelection() {
    console.log('Going back to player selection...');
    
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
                        console.log('Navigating to player selection...');
                        window.location.href = 'playerselection.html';
                    }, 300);
                }).catch(error => {
                    console.error('Error playing navigation sound:', error);
                    // Navigate anyway if sound fails
                    window.location.href = 'playerselection.html';
                });
            } else {
                // Fallback if play() doesn't return a promise
                setTimeout(function() {
                    window.location.href = 'playerselection.html';
                }, 300);
            }
        });
        
        // If there's an error loading the sound, navigate anyway
        clickSound.addEventListener('error', function() {
            console.error('Error loading navigation sound');
            window.location.href = 'playerselection.html';
        });
        
        // Start loading the sound
        clickSound.load();
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