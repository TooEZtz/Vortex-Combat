// Character selection state
let selectedCharacters = {
    player1Character: null,
    player2Character: null
};

// List of available characters (not coming soon)
const availableCharacters = ['scorpion', 'subzero', 'johnny', 'sonya'];

// Function to handle back button click with sound
function goToMainMenu() {
    console.log('Going to main menu...');
    
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
                        console.log('Navigating to main menu...');
                        window.location.href = '../index.html';
                    }, 300);
                }).catch(error => {
                    console.error('Error playing navigation sound:', error);
                    // Navigate anyway if sound fails
                    window.location.href = '../index.html';
                });
            } else {
                // Fallback if play() doesn't return a promise
                setTimeout(function() {
                    window.location.href = '../index.html';
                }, 300);
            }
        });
        
        // If there's an error loading the sound, navigate anyway
        clickSound.addEventListener('error', function() {
            console.error('Error loading navigation sound');
            window.location.href = '../index.html';
        });
        
        // Start loading the sound
        clickSound.load();
    } else {
        // If SoundManager is not available, just navigate
        window.location.href = '../index.html';
    }
}

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
    // Only hide the preview if no character is selected for this player
    const characterKey = playerSide === 'player1' ? 'player1Character' : 'player2Character';
    
    // Check if a character is already selected for this player
    if (selectedCharacters[characterKey]) {
        console.log(`Not hiding preview for ${playerSide} because character is selected: ${selectedCharacters[characterKey]}`);
        return; // Don't hide if a character is selected
    }
    
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
        if (character === 'scorpion' || character === 'johnny') {
            previewName.textContent = 'CURSE-OR';
        } else if (character === 'subzero' || character === 'sonya') {
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
    
    // Check if the character is available (not coming soon)
    if (!availableCharacters.includes(character)) {
        console.log(`Character ${character} is not available yet`);
        showMessage("This character is not available yet!");
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
            // Get the correct character name based on the selected character
            let characterName;
            if (character === 'scorpion' || character === 'johnny') {
                characterName = 'CURSE-OR';
            } else if (character === 'subzero' || character === 'sonya') {
                characterName = 'REIGN';
            }
            showMessage(`Player ${player} selected ${characterName}`);
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
                            console.log('Navigating to map selection...');
                            window.location.href = 'maps.html';
                        }, 300);
                    }).catch(error => {
                        console.error('Error playing navigation sound:', error);
                        // Navigate anyway if sound fails
                        window.location.href = 'maps.html';
                    });
                } else {
                    // Fallback if play() doesn't return a promise
                    setTimeout(function() {
                        window.location.href = 'maps.html';
                    }, 300);
                }
            });
            
            // If there's an error loading the sound, navigate anyway
            clickSound.addEventListener('error', function() {
                console.error('Error loading navigation sound');
                window.location.href = 'maps.html';
            });
            
            // Start loading the sound
            clickSound.load();
        } else {
            // If SoundManager is not available, just navigate
            window.location.href = 'maps.html';
        }
    }
}

// Function to force a character preview to be visible (used after selection)
function forceCharacterPreview(player, character) {
    const previewId = player === 1 ? 'player1Preview' : 'player2Preview';
    const previewElement = document.getElementById(previewId);
    
    // Make sure the preview element exists
    if (!previewElement) {
        console.error(`Preview element not found for Player ${player}`);
        return;
    }
    
    // Get the preview image element
    const previewImageElement = previewElement.querySelector('.preview-image');
    if (!previewImageElement) {
        console.error(`Preview image element not found for Player ${player}`);
        return;
    }
    
    // Determine the correct image path based on the character
    let imagePath;
    if (character === 'scorpion' || character === 'johnny') {
        // CURSE-OR characters use character_1 folder
        imagePath = player === 1 
            ? '../assests/players/character_1/Right_idle.gif' 
            : '../assests/players/character_1/Left_idle.gif';
    } else if (character === 'subzero' || character === 'sonya') {
        // REIGN characters use character_2 folder
        imagePath = player === 1 
            ? '../assests/players/character_2/Right_idle.gif' 
            : '../assests/players/character_2/Left_idle.gif';
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

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded, initializing...');
    
    // Set up fight button
    const startFight = document.getElementById('startFight');
    if (startFight) {
        startFight.style.display = 'none';
        
        // We're now handling the click in the HTML onclick attribute
        // This event listener is kept for backward compatibility
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
    document.getElementById('player1Preview').classList.remove('visible', 'selected-character');
    document.getElementById('player2Preview').classList.remove('visible', 'selected-character');
    
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
});