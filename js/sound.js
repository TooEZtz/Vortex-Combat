// Sound utility for handling game sound effects
const SoundManager = {
    // Audio objects
    sounds: {
        buttonHover: new Audio('../assests/audio/button_hover.mp3'),
        buttonClick: new Audio('../assests/audio/button_click.mp3')
    },
    
    // Flag to track if sounds are loaded
    soundsLoaded: false,
    
    // Initialize sound settings
    init: function() {
        console.log('Initializing Sound Manager...');
        
        // Set volume for all sounds
        Object.values(this.sounds).forEach(sound => {
            sound.volume = 0.5; // 50% volume
            
            // Add event listeners to track loading
            sound.addEventListener('canplaythrough', () => {
                console.log(`Sound loaded: ${sound.src}`);
                this.soundsLoaded = true;
            });
            
            sound.addEventListener('error', (e) => {
                console.error(`Error loading sound: ${sound.src}`, e);
            });
        });
        
        // Preload sounds
        this.preloadSounds();
        
        console.log('Sound Manager initialized');
    },
    
    // Preload sounds
    preloadSounds: function() {
        console.log('Preloading sounds...');
        Object.values(this.sounds).forEach(sound => {
            // Force the browser to start loading the sound
            sound.load();
        });
    },
    
    // Play button hover sound
    playHoverSound: function() {
        console.log('Playing hover sound');
        try {
            const sound = this.sounds.buttonHover;
            sound.currentTime = 0; // Reset to start
            
            // Create a promise to play the sound
            const playPromise = sound.play();
            
            // Handle the promise
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    // Sound played successfully
                    console.log('Hover sound played successfully');
                }).catch(error => {
                    console.error('Error playing hover sound:', error);
                });
            }
        } catch (e) {
            console.error('Exception playing hover sound:', e);
        }
    },
    
    // Play button click sound
    playClickSound: function() {
        console.log('Playing click sound');
        try {
            const sound = this.sounds.buttonClick;
            sound.currentTime = 0; // Reset to start
            
            // Create a promise to play the sound
            const playPromise = sound.play();
            
            // Handle the promise
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    // Sound played successfully
                    console.log('Click sound played successfully');
                }).catch(error => {
                    console.error('Error playing click sound:', error);
                });
            }
        } catch (e) {
            console.error('Exception playing click sound:', e);
        }
    }
};

// Initialize sound manager when the script loads
document.addEventListener('DOMContentLoaded', function() {
    SoundManager.init();
    
    // Add a click handler to the document to enable audio on first interaction
    // This is needed for browsers that require user interaction before playing audio
    document.addEventListener('click', function initAudio() {
        console.log('First user interaction, enabling audio...');
        
        // Try to play and immediately pause both sounds to enable them
        Object.values(SoundManager.sounds).forEach(sound => {
            sound.play().then(() => {
                sound.pause();
                sound.currentTime = 0;
                console.log(`Sound enabled: ${sound.src}`);
            }).catch(e => {
                console.error(`Could not enable sound: ${sound.src}`, e);
            });
        });
        
        // Remove this event listener after first click
        document.removeEventListener('click', initAudio);
    }, { once: true });
}); 