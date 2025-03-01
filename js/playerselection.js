// Update the placeholder image generation function
function createPlaceholderImages() {
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    
    const characters = [
        'SCORPION', 'SUB-ZERO', 'REPTILE', 'RAIDEN',
        'JOHNNY CAGE', 'SONYA', 'JAX', 'KUNG LAO'
    ];
    
    characters.forEach((charName, i) => {
        // Create a dark, neutral background
        ctx.fillStyle = '#1a1a1a';  // Dark gray background
        ctx.fillRect(0, 0, 300, 400);
        
        // Add subtle character silhouette
        ctx.fillStyle = '#262626';  // Slightly lighter gray for silhouette
        ctx.fillRect(50, 100, 200, 300);
        
        // Add character name
        ctx.fillStyle = '#ffffff';  // White text
        ctx.font = 'bold 30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(charName, 150, 350);
        
        // Save the placeholder
        const img = canvas.toDataURL('image/png');
        const imgElements = document.querySelectorAll(`img[src="../assets/images/placeholder${i + 1}.png"]`);
        imgElements.forEach(imgEl => imgEl.src = img);
    });
}

let selectedCharacters = {
    player1: null,
    player2: null,
    currentPlayer: 1
};

function selectCharacter(player, character) {
    const clickedCard = event.currentTarget;
    
    // If clicking an already selected card, unselect it
    if (clickedCard.classList.contains(`selected-by-player${player}`)) {
        // Unselect the character
        clickedCard.classList.remove('selected', `selected-by-player${player}`);
        selectedCharacters[`player${player}`] = null;
        
        // Hide fight button since we no longer have both players selected
        const startFight = document.getElementById('startFight');
        if (startFight) {
            startFight.style.display = 'none';
            startFight.style.opacity = '0';
        }

        showMessage(`Player ${player} unselected their character`);
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
        selectedCharacters[`player${player}`] = character;

        // Check if both players have selected
        if (selectedCharacters.player1 && selectedCharacters.player2) {
            enableFightButton();
            showMessage("Both players selected! Ready to fight!");
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
        startFight.style.opacity = '0';
        
        startFight.addEventListener('click', function() {
            if (selectedCharacters.player1 && selectedCharacters.player2) {
                console.log("Starting fight with:", selectedCharacters);
                // Add transition to next screen here
            }
        });
    }

    showMessage("Select your fighters!");
});