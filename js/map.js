let selectedMap = null;
let mapImages = {}; // Store map images for hover effect

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
    const backgroundContainer = document.querySelector('.background-container');
    
    console.log('Map cards found:', mapCards.length);
    console.log('Start fight button found:', !!startFight);
    
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
        startFight.addEventListener('click', function() {
            console.log('Fight button clicked, selected map:', selectedMap);
            
            if (selectedMap) {
                // Store selected map in session storage
                sessionStorage.setItem('selectedMap', selectedMap);
                console.log('Selected map stored in session storage');
                
                // Navigate to fight screen
                window.location.href = '../components/fight.html';
            }
        });
    }
}