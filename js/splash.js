document.addEventListener('DOMContentLoaded', function() {
    // Create and append the interaction overlay
    const interactionOverlay = document.createElement('div');
    interactionOverlay.id = 'interaction-overlay';
    
    // Create the content container
    const contentContainer = document.createElement('div');
    contentContainer.className = 'content-container';
    
    // Create the main text
    const mainText = document.createElement('div');
    mainText.className = 'main-text';
    mainText.textContent = 'ENTER THE ARENA';
    
    // Create the instruction text
    const instructionText = document.createElement('div');
    instructionText.className = 'instruction-text';
    instructionText.textContent = 'Press Any Key to Begin';
    
    // Create the pulsing circle effect
    const pulsingCircle = document.createElement('div');
    pulsingCircle.className = 'pulsing-circle';
    
    // Assemble the overlay
    contentContainer.appendChild(mainText);
    contentContainer.appendChild(instructionText);
    contentContainer.appendChild(pulsingCircle);
    interactionOverlay.appendChild(contentContainer);
    document.body.appendChild(interactionOverlay);
    
    // Add the styles
    const styles = `
        #interaction-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        }
        
        .content-container {
            text-align: center;
            color: #fff;
            position: relative;
        }
        
        .main-text {
            font-size: 4em;
            font-weight: bold;
            text-shadow: 0 0 10px #ff0000, 0 0 20px #ff0000;
            margin-bottom: 20px;
            opacity: 0;
            transform: translateY(-20px);
            animation: fadeInDown 1s ease forwards;
        }
        
        .instruction-text {
            font-size: 1.5em;
            color: #aaa;
            animation: pulse 2s infinite;
        }
        
        .pulsing-circle {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 300px;
            height: 300px;
            border: 2px solid #ff0000;
            border-radius: 50%;
            opacity: 0;
            animation: pulseCircle 2s infinite;
            z-index: -1;
        }
        
        @keyframes fadeInDown {
            0% {
                opacity: 0;
                transform: translateY(-20px);
            }
            100% {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        @keyframes pulse {
            0%, 100% {
                opacity: 0.5;
            }
            50% {
                opacity: 1;
            }
        }
        
        @keyframes pulseCircle {
            0% {
                transform: translate(-50%, -50%) scale(0.95);
                opacity: 0.6;
            }
            50% {
                transform: translate(-50%, -50%) scale(1);
                opacity: 0.3;
            }
            100% {
                transform: translate(-50%, -50%) scale(0.95);
                opacity: 0.6;
            }
        }
    `;
    
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
    
    // Handle the interaction
    const handleInteraction = function(event) {
        // Initialize audio context
        if (window.SoundManager && typeof window.SoundManager.initialize === 'function') {
            window.SoundManager.initialize();
        }
        
        // Add fade out animation
        interactionOverlay.style.animation = 'fadeOut 1s forwards';
        
        // Add the fade out keyframes
        const fadeOutKeyframes = `
            @keyframes fadeOut {
                from {
                    opacity: 1;
                }
                to {
                    opacity: 0;
                    visibility: hidden;
                }
            }
        `;
        styleSheet.textContent += fadeOutKeyframes;
        
        // Remove the overlay after animation
        setTimeout(() => {
            document.body.removeChild(interactionOverlay);
            // Remove the event listeners
            document.removeEventListener('keydown', handleInteraction);
            document.removeEventListener('click', handleInteraction);
            document.removeEventListener('touchstart', handleInteraction);
            
            // Add the regular splash screen behavior
            document.addEventListener('keydown', function(event) {
                if (event.key === 'Enter') {
                    window.location.href = 'playerselection.html';
                }
            });
        }, 1000);
    };
    
    // Add event listeners for multiple types of interaction
    document.addEventListener('keydown', handleInteraction);
    document.addEventListener('click', handleInteraction);
    document.addEventListener('touchstart', handleInteraction);
}); 