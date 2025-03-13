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
    
    // Flags to track initialization and interaction
    initialized: false,
    waitingForInteraction: false,
    
    // Initialize sound settings
    init: function() {
        if (this.initialized) {
            console.log('SoundManager already initialized');
            return;
        }
        
        console.log('Initializing Sound Manager...');
        
        // Set volume for sound effects
        this.sounds.buttonHover.volume = 0.5;
        this.sounds.buttonClick.volume = 0.5;
        
        // Initialize fight music with a random track from available fight music
        const fightMusicTracks = [
            '../assests/audio/map_music_1.mp3',
            '../assests/audio/map_music_2.mp3',
            '../assests/audio/map_music_3.mp3'
        ];
        const randomTrackIndex = Math.floor(Math.random() * fightMusicTracks.length);
        this.music.fight = new Audio(fightMusicTracks[randomTrackIndex]);
        
        // Set up all music tracks
        Object.values(this.music).forEach(track => {
            if (track) {
                track.volume = 0.8;
                track.loop = true;
                
                track.addEventListener('canplaythrough', () => {
                    console.log(`Music loaded: ${track.src}`);
                });
                
                track.addEventListener('error', (e) => {
                    console.warn(`Warning: Could not load music: ${track.src}`);
                });
            }
        });
        
        // Add event listeners for sound effects
        Object.values(this.sounds).forEach(sound => {
            sound.addEventListener('canplaythrough', () => {
                console.log(`Sound loaded: ${sound.src}`);
            });
            
            sound.addEventListener('error', (e) => {
                console.warn(`Warning: Could not load sound: ${sound.src}`);
            });
        });
        
        // Preload sounds and music
        this.preloadAudio();
        
        // Mark as initialized
        this.initialized = true;
        
        // Make SoundManager globally available
        window.SoundManager = this;
        
        // Set up one-time click handler for first interaction
        if (!this.waitingForInteraction) {
            this.waitingForInteraction = true;
            const initAudio = () => {
                if (!this.waitingForInteraction) return;
                
                console.log('First user interaction, enabling audio...');
                
                // Play appropriate background music based on current page
                const currentPath = window.location.pathname;
                if (currentPath.includes('playerselection.html')) {
                    this.playBackgroundMusic('characterSelect');
                } else if (currentPath.includes('maps.html')) {
                    this.playBackgroundMusic('mapSelect');
                } else if (currentPath.includes('fight.html')) {
                    this.playBackgroundMusic('fight');
                }
                
                this.waitingForInteraction = false;
                document.removeEventListener('click', initAudio);
                document.removeEventListener('keydown', initAudio);
            };
            
            document.addEventListener('click', initAudio);
            document.addEventListener('keydown', initAudio);
        }
        
        console.log('Sound Manager initialized');
    },
    
    // Play background music
    playBackgroundMusic: function(type) {
        if (!this.initialized) {
            this.init();
        }
        
        // If we're already playing this type of music, don't restart it
        if (this.currentMusic && this.currentMusic === this.music[type]) {
            console.log(`Background music ${type} is already playing`);
            return;
        }
        
        console.log(`Playing background music: ${type}`);
        
        // Get the requested background music
        const music = this.music[type];
        
        if (!music) {
            console.warn(`Background music type not found: ${type}`);
            return;
        }
        
        try {
            // If there's current music playing and it's different, fade it out
            if (this.currentMusic && this.currentMusic !== music) {
                // Mute the old music instead of stopping it
                this.currentMusic.volume = 0;
            }
            
            music.currentTime = 0;
            music.volume = 0.8; // Ensure volume is set correctly
            const playPromise = music.play();
            this.currentMusic = music;
            
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    console.log(`Background music ${type} played successfully`);
                }).catch(error => {
                    console.warn(`Could not autoplay music ${type}, waiting for user interaction`);
                    
                    // Set up one-time click handler if needed
                    if (!this.waitingForInteraction) {
                        this.waitingForInteraction = true;
                        const playOnInteraction = () => {
                            if (this.waitingForInteraction) {
                                this.playBackgroundMusic(type);
                                this.waitingForInteraction = false;
                            }
                        };
                        document.addEventListener('click', playOnInteraction, { once: true });
                    }
                });
            }
        } catch (e) {
            console.warn(`Could not play music ${type}:`, e);
        }
    },
    
    // Stop background music
    stopBackgroundMusic: function() {
        if (this.currentMusic) {
            console.log('Stopping background music');
            this.currentMusic.pause();
            this.currentMusic.currentTime = 0;
            this.currentMusic.volume = 0.8; // Reset volume for next time
            this.currentMusic = null;
        }
    },
    
    // Play button hover sound
    playHoverSound: function() {
        if (!this.initialized) {
            this.init();
        }
        
        try {
            const sound = this.sounds.buttonHover;
            sound.currentTime = 0;
            sound.play().catch(e => {});
        } catch (e) {}
    },
    
    // Play button click sound
    playClickSound: function() {
        if (!this.initialized) {
            this.init();
        }
        
        try {
            const sound = this.sounds.buttonClick;
            sound.currentTime = 0;
            sound.play().catch(e => {});
        } catch (e) {}
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
    }
};

// Initialize sound manager when the script loads
document.addEventListener('DOMContentLoaded', () => {
    SoundManager.init();
});