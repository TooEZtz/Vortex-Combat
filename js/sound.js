// Sound utility for handling game sound effects and music
const SoundManager = {
    // Audio objects
    sounds: {
        buttonHover: new Audio('../assests/audio/button_hover.mp3'),
        buttonClick: new Audio('../assests/audio/button_click.mp3')
    },
    
    // Background music tracks
    music: {
        characterSelect: new Audio('../assests/audio/player_selection.mp3'),
        mapSelect: new Audio('../assests/audio/map_selection.mp3'),
        fight: null // Will be initialized with a random fight music
    },
    
    // Current background music playing
    currentMusic: null,
    
    // Flag to track if sounds are loaded
    soundsLoaded: false,
    musicLoaded: false,
    
    // Initialize sound settings
    init: function() {
        console.log('Initializing Sound Manager...');
        
        // Set volume for sound effects
        this.sounds.buttonHover.volume = 0.5; // 50% volume
        this.sounds.buttonClick.volume = 0.5; // 50% volume
        
        // Initialize fight music with a random track from available fight music
        const fightMusicTracks = [
            '../assests/audio/map_music_1.mp3',
            '../assests/audio/map_music_2.mp3',
            '../assests/audio/map_music_3.mp3',
            '../assests/audio/map_music_4.mp3'
        ];
        const randomTrackIndex = Math.floor(Math.random() * fightMusicTracks.length);
        this.music.fight = new Audio(fightMusicTracks[randomTrackIndex]);
        
        // Set up all music tracks
        Object.values(this.music).forEach(track => {
            if (track) {
                track.volume = 0.3; // 30% volume for background music
                track.loop = true; // Loop background music
                
                // Add event listeners to track loading
                track.addEventListener('canplaythrough', () => {
                    console.log(`Music loaded: ${track.src}`);
                    this.musicLoaded = true;
                });
                
                track.addEventListener('error', (e) => {
                    console.error(`Error loading music: ${track.src}`, e);
                });
            }
        });
        
        // Add event listeners for sound effects
        Object.values(this.sounds).forEach(sound => {
            sound.addEventListener('canplaythrough', () => {
                console.log(`Sound loaded: ${sound.src}`);
                this.soundsLoaded = true;
            });
            
            sound.addEventListener('error', (e) => {
                console.error(`Error loading sound: ${sound.src}`, e);
            });
        });
        
        // Preload sounds and music
        this.preloadAudio();
        
        console.log('Sound Manager initialized');
    },
    
    // Preload sounds and music
    preloadAudio: function() {
        console.log('Preloading audio...');
        
        // Preload sound effects
        Object.values(this.sounds).forEach(sound => {
            sound.load();
        });
        
        // Preload background music
        Object.values(this.music).forEach(track => {
            if (track) {
                track.load();
            }
        });
    },
    
    // Play background music
    playBackgroundMusic: function(type) {
        console.log(`Playing background music: ${type}`);
        
        // Stop current background music if any
        this.stopBackgroundMusic();
        
        // Get the requested background music
        const music = this.music[type];
        
        if (!music) {
            console.error(`Background music type not found: ${type}`);
            return;
        }
        
        try {
            // Reset to start
            music.currentTime = 0;
            
            // Create a promise to play the music
            const playPromise = music.play();
            
            // Set as current background music
            this.currentMusic = music;
            
            // Handle the promise
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    // Music played successfully
                    console.log(`Background music ${type} played successfully`);
                }).catch(error => {
                    console.error(`Error playing background music ${type}:`, error);
                    
                    // Try to play again after user interaction
                    document.addEventListener('click', function playAfterInteraction() {
                        music.play().catch(e => console.error('Still could not play music:', e));
                        document.removeEventListener('click', playAfterInteraction);
                    }, { once: true });
                });
            }
        } catch (e) {
            console.error(`Exception playing background music ${type}:`, e);
        }
    },
    
    // Stop background music
    stopBackgroundMusic: function() {
        if (this.currentMusic) {
            console.log('Stopping background music');
            this.currentMusic.pause();
            this.currentMusic.currentTime = 0;
            this.currentMusic = null;
        }
    },
    
    // Play button hover sound
    playHoverSound: function() {
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
        
        // Try to play and immediately pause sound effects to enable them
        Object.values(SoundManager.sounds).forEach(sound => {
            sound.play().then(() => {
                sound.pause();
                sound.currentTime = 0;
                console.log(`Sound enabled: ${sound.src}`);
            }).catch(e => {
                console.error(`Could not enable sound: ${sound.src}`, e);
            });
        });
        
        // Try to enable background music
        Object.values(SoundManager.music).forEach(track => {
            if (track) {
                track.play().then(() => {
                    track.pause();
                    track.currentTime = 0;
                    console.log(`Music enabled: ${track.src}`);
                }).catch(e => {
                    console.error(`Could not enable music: ${track.src}`, e);
                });
            }
        });
        
        // Remove this event listener after first click
        document.removeEventListener('click', initAudio);
        
        // Start playing appropriate background music based on current page
        // No music for splash.html
        const currentPath = window.location.pathname;
        if (currentPath.includes('playerselection.html')) {
            SoundManager.playBackgroundMusic('characterSelect');
        } else if (currentPath.includes('maps.html')) {
            SoundManager.playBackgroundMusic('mapSelect');
        } else if (currentPath.includes('fight.html')) {
            SoundManager.playBackgroundMusic('fight');
        }
    }, { once: true });
});