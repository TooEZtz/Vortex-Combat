// Character selection state
let selectedCharacters = {
    player1Character: null,
    player2Character: null
};

// List of available characters (not coming soon)
const availableCharacters = ['scorpion', 'subzero', 'johnny', 'sonya'];

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
    
    // Show the preview
    previewElement.classList.add('visible');
    
    // Update VS visibility
    updateVsVisibility();
}

function hideCharacterPreview(playerSide) {
    // Only hide the preview if no character is selected for this player
    const characterKey = playerSide === 'player1' ? 'player1Character' : 'player2Character';
    if (selectedCharacters[characterKey]) {
        return; // Don't hide if a character is selected
    }
    
    const previewId = playerSide === 'player1' ? 'player1Preview' : 'player2Preview';
    const previewElement = document.getElementById(previewId);
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
        const characterName = character.charAt(0).toUpperCase() + character.slice(1);
        previewName.textContent = characterName;
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
        
        // Show character preview for the selected character
        // Use the correct animation file based on player side
        const previewImage = player === 1 
            ? '../assests/players/character_1/Right_idle.gif' 
            : '../assests/players/character_1/Left_idle.gif';
            
        showCharacterPreview(previewImage, `player${player}`);
        
        // Mark this preview as a selected character
        previewElement.classList.add('selected-character');
        
        // Update character name in preview
        updateCharacterName(player, character);

        // Check if both players have selected
        if (selectedCharacters.player1Character && selectedCharacters.player2Character) {
            enableFightButton();
            showMessage("Both players selected! Ready to fight!");
        } else {
            showMessage(`Player ${player} selected ${character.charAt(0).toUpperCase() + character.slice(1)}`);
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

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded, initializing...');
    
    // Set up fight button
    const startFight = document.getElementById('startFight');
    if (startFight) {
        startFight.style.display = 'none';
        
        startFight.addEventListener('click', function() {
            if (selectedCharacters.player1Character && selectedCharacters.player2Character) {
                console.log("Starting fight with:", selectedCharacters);
                
                // Store selected characters in session storage
                sessionStorage.setItem('player1Character', selectedCharacters.player1Character);
                sessionStorage.setItem('player2Character', selectedCharacters.player2Character);
                
                console.log('Player selections stored in session storage:',
                    sessionStorage.getItem('player1Character'),
                    sessionStorage.getItem('player2Character'));
                
                // Navigate to map selection screen
                window.location.href = 'maps.html';
            }
        });
    }

    // Clear any previous selections
    document.querySelectorAll('.character-card').forEach(card => {
        card.classList.remove('selected', 'selected-by-player1', 'selected-by-player2');
    });
    
    // Hide all previews initially
    document.getElementById('player1Preview').classList.remove('visible');
    document.getElementById('player2Preview').classList.remove('visible');
    
    // Initialize VS text opacity
    const vsText = document.querySelector('.vs-text');
    if (vsText) {
        vsText.style.opacity = '0.3';
    }

    showMessage("Select your fighters!");
});