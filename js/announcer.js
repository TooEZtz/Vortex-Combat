class Announcer {
    constructor() {
        this.audioElements = {
            init: document.getElementById('announcerInit'),
            leftCurseor: document.getElementById('leftCurseor'),
            leftReign: document.getElementById('leftReign'),
            rightCurseor: document.getElementById('rightCurseor'),
            rightReign: document.getElementById('rightReign'),
            fightBegin: new Audio('../assests/audio/announcer/Let_the_battle_begin.mp3'),
            introCheer: document.getElementById('introCheer')
        };

        // Set volume for all audio elements
        Object.values(this.audioElements).forEach(audio => {
            if (audio === this.audioElements.introCheer) {
                audio.volume = 0.3; // 30% volume for intro cheer
            } else {
                audio.volume = 0.7;
            }
        });

        this.currentAudio = null;
        this.isPlaying = false;
        this.introPhase = 0;
        this.boundHandleKeyPress = this.handleKeyPress.bind(this);
        this.setupEventListeners();
        this.setupVSScreen();
    }

    setupEventListeners() {
        document.addEventListener('keydown', this.boundHandleKeyPress);
    }

    removeEventListeners() {
        document.removeEventListener('keydown', this.boundHandleKeyPress);
    }

    setupVSScreen() {
        // Create VS screen if it doesn't exist
        if (!document.getElementById('vsScreen')) {
            const vsScreen = document.createElement('div');
            vsScreen.id = 'vsScreen';
            vsScreen.innerHTML = `
                <div class="vs-text">VS</div>
                <div class="vs-flash"></div>
                <div class="vs-particles"></div>
            `;
            document.body.appendChild(vsScreen);

            // Add VS screen styles
            const style = document.createElement('style');
            style.textContent = `
                #vsScreen {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    display: none;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                }

                .vs-text {
                    font-size: 150px;
                    font-weight: bold;
                    color: #fff;
                    text-shadow: 0 0 20px #fff,
                                0 0 30px #ff0000,
                                0 0 40px #ff0000;
                    opacity: 0;
                    transform: scale(3);
                }

                .vs-flash {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%);
                    opacity: 0;
                    pointer-events: none;
                }

                .vs-particles {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                }

                @keyframes vsTextEntrance {
                    0% { transform: scale(3); opacity: 0; }
                    50% { transform: scale(1.2); opacity: 1; }
                    60% { transform: scale(0.9); opacity: 1; }
                    100% { transform: scale(1); opacity: 1; }
                }

                @keyframes vsFlash {
                    0% { opacity: 0; }
                    50% { opacity: 1; }
                    100% { opacity: 0; }
                }

                @keyframes particleBurst {
                    0% { transform: scale(0); opacity: 1; }
                    100% { transform: scale(2); opacity: 0; }
                }

                .particle {
                    position: absolute;
                    width: 10px;
                    height: 10px;
                    background: #fff;
                    border-radius: 50%;
                }
            `;
            document.head.appendChild(style);
        }
    }

    async handlePlayerDefeat(defeatedPlayer) {
        // Prevent multiple triggers
        if (!window.gameState.roundStarted || window.gameState.roundPaused) {
            return;
        }

        // Pause the round immediately
        window.gameState.roundStarted = false;
        window.gameState.roundPaused = true;

        // Stop background music
        const mapMusic = document.getElementById('mapMusic');
        if (mapMusic) {
            mapMusic.pause();
            mapMusic.currentTime = 0;
        }

        // Show winner announcement
        const roundAnnouncement = document.getElementById('roundAnnouncement');
        roundAnnouncement.style.fontSize = '72px';
        roundAnnouncement.style.textShadow = '0 0 20px #fff, 0 0 30px #ff0000, 0 0 40px #ff0000';
        roundAnnouncement.textContent = `PLAYER ${defeatedPlayer === 1 ? '2' : '1'} WINS!`;
        roundAnnouncement.classList.add('active');

        // Wait for 2 seconds to show the winner
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Show game over options
        const gameOverOverlay = document.createElement('div');
        gameOverOverlay.id = 'gameOverOverlay';
        gameOverOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;
        
        const buttons = document.createElement('div');
        buttons.style.cssText = `
            display: flex;
            gap: 20px;
            margin-top: 20px;
        `;
        
        const playAgainBtn = document.createElement('button');
        playAgainBtn.textContent = 'PLAY AGAIN';
        playAgainBtn.onclick = () => location.reload();
        
        const changeFightersBtn = document.createElement('button');
        changeFightersBtn.textContent = 'CHANGE FIGHTERS';
        changeFightersBtn.onclick = () => location.href = 'playerselection.html';
        
        const backBtn = document.createElement('button');
        backBtn.textContent = 'BACK TO MENU';
        backBtn.onclick = () => location.href = 'index.html';
        
        [playAgainBtn, changeFightersBtn, backBtn].forEach(btn => {
            btn.style.cssText = `
                padding: 10px 20px;
                font-size: 24px;
                background: #ff0000;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                transition: transform 0.2s;
                &:hover {
                    transform: scale(1.1);
                }
            `;
            buttons.appendChild(btn);
        });
        
        gameOverOverlay.appendChild(buttons);
        document.body.appendChild(gameOverOverlay);
    }

    async handleKeyPress(event) {
        // Prevent any key inputs if the round has started
        if (window.gameState && window.gameState.roundStarted) {
            return;
        }

        // Handle key press during intro phases
        if (this.introPhase <= 1) {
            // Original intro sequence handling
            if (event.code === 'Space' && this.isPlaying) {
                if (this.currentAudio) {
                    // Complete the current audio immediately
                    this.currentAudio.currentTime = this.currentAudio.duration;
                    
                    // Wait for the current audio to finish
                    await new Promise(resolve => {
                        this.currentAudio.onended = () => {
                            this.isPlaying = false;
                            this.currentAudio = null;
                            resolve();
                        };
                    });

                    // Proceed based on current phase
                    if (this.introPhase === 0) {
                        // Move to player 2's intro after player 1's intro completes
                        await this.introducePlayer2();
                    } else if (this.introPhase === 1) {
                        // Move to round start after player 2's intro completes
                        document.getElementById('roundAnnouncement').classList.remove('active');
                        await this.announceRoundStart();
                    }
                }
                return;
            }

            // Only process non-spacebar keys when no audio is playing and in intro phases
            if (!this.isPlaying) {
                switch (this.introPhase) {
                    case 0:
                        document.getElementById('pressKeyOverlay').style.display = 'none';
                        await this.startIntroSequence();
                        break;
                    case 1:
                        await this.announceRoundStart();
                        break;
                }
            }
        } else if (this.introPhase === 2) {
            // Hide the overlay
            const pressKeyOverlay = document.getElementById('pressKeyOverlay');
            if (pressKeyOverlay) {
                pressKeyOverlay.style.display = 'none';
            }
            
            // Remove event listeners to prevent multiple triggers
            this.removeEventListeners();
            
            // Start the next round announcement sequence
            await this.announceNextRound();
        }
    }

    async playAudio(audioElement) {
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.currentAudio = audioElement;

        audioElement.muted = false;
        try {
            await audioElement.play();
            return new Promise(resolve => {
                audioElement.onended = () => {
                    this.isPlaying = false;
                    audioElement.muted = true;
                    this.currentAudio = null;
                    resolve();
                };
            });
        } catch (error) {
            console.error('Audio playback failed:', error);
            this.isPlaying = false;
            audioElement.muted = true;
            this.currentAudio = null;
        }
    }

    async startIntroSequence() {
        // Add dramatic entrance styles if not already present
        if (!document.getElementById('introAnimationStyles')) {
            const style = document.createElement('style');
            style.id = 'introAnimationStyles';
            style.textContent = `
                @keyframes slideFromLeft {
                    0% { transform: translateX(-100%) scale(0.85); opacity: 0; }
                    70% { transform: translateX(-35%) scale(0.85); opacity: 1; }
                    85% { transform: translateX(-40%) scale(0.85); }
                    100% { transform: translateX(-35%) scale(0.85); }
                }

                @keyframes slideFromRight {
                    0% { transform: translateX(100%) scaleX(-1) scale(0.85); opacity: 0; }
                    70% { transform: translateX(35%) scaleX(-1) scale(0.85); opacity: 1; }
                    85% { transform: translateX(40%) scaleX(-1) scale(0.85); }
                    100% { transform: translateX(35%) scaleX(-1) scale(0.85); }
                }

                @keyframes pulseGlow {
                    0% { filter: drop-shadow(0 0 0px rgba(255,255,255,0.8)); }
                    50% { filter: drop-shadow(0 0 15px rgba(255,255,255,0.8)); }
                    100% { filter: drop-shadow(0 0 0px rgba(255,255,255,0.8)); }
                }

                @keyframes blinkText {
                    0% { opacity: 1; }
                    50% { opacity: 0.3; }
                    100% { opacity: 1; }
                }

                @keyframes vsEntrance {
                    0% { transform: scale(3); opacity: 0; }
                    50% { transform: scale(1.2); opacity: 1; }
                    75% { transform: scale(0.9); }
                    100% { transform: scale(1); }
                }

                .fighter-image {
                    filter: drop-shadow(0 0 10px rgba(0,0,0,0.5));
                }

                .character-name {
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
                    font-size: 48px !important;
                    font-weight: bold;
                    letter-spacing: 2px;
                }

                #vsText {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    font-size: 72px;
                    color: #fff;
                    text-shadow: 0 0 20px rgba(255,255,255,0.8);
                    opacity: 0;
                    z-index: 1000;
                }

                .intro-active .fighter-image {
                    animation: pulseGlow 2s infinite;
                }
            `;
            document.head.appendChild(style);
        }

        // Play announcer init sound
        await this.playAudio(this.audioElements.init);

        // Start playing the intro cheer
        if (this.audioElements.introCheer) {
            this.audioElements.introCheer.currentTime = 0;
            this.audioElements.introCheer.loop = false;
            await this.audioElements.introCheer.play().catch(error => {
                console.error('Error playing intro cheer:', error);
            });
        }

        // Show player 1 intro
        const player1Character = sessionStorage.getItem('player1Character') || 'curse-or';
        const player1Intro = document.getElementById('player1Intro');
        const player1Image = player1Intro.querySelector('.fighter-image');
        const player1Name = player1Intro.querySelector('.character-name');

        // Set up player 1 intro visuals
        const isPlayer1CurseOr = player1Character === 'curse-or';
        const player1PreviewPath = isPlayer1CurseOr ? 
            '../assests/players/character_1/preview.gif' :
            '../assests/players/character_2/2_Right_Preview.gif';
        
        player1Image.style.backgroundImage = `url('${player1PreviewPath}')`;
        player1Image.style.position = 'absolute';
        player1Image.style.bottom = '0';
        player1Image.style.left = '0';
        player1Image.style.right = 'auto';
        
        // Original orientation for Player 1, with slide-in animation
        if (!isPlayer1CurseOr) {
            player1Image.style.animation = 'slideFromLeft 1s ease-out forwards';
        } else {
            player1Image.style.animation = 'slideFromLeft 1s ease-out forwards';
            player1Image.style.transform = 'scale(1)'; // No scaling for Curse-or
        }

        player1Name.textContent = player1Character.toUpperCase();
        player1Intro.classList.add('intro-active');

        // Play player 1 announcement
        await this.playAudio(isPlayer1CurseOr ? this.audioElements.leftCurseor : this.audioElements.leftReign);

        // Automatically proceed to player 2's intro
        await this.introducePlayer2();
    }

    async introducePlayer2() {
        document.getElementById('roundAnnouncement').classList.remove('active');

        // Play announcer init sound
        await this.playAudio(this.audioElements.init);

        // Start playing the intro cheer
        if (this.audioElements.introCheer) {
            this.audioElements.introCheer.currentTime = 0;
            this.audioElements.introCheer.loop = false;
            await this.audioElements.introCheer.play().catch(error => {
                console.error('Error playing intro cheer:', error);
            });
        }

        // Show player 2 intro
        const player2Character = sessionStorage.getItem('player2Character') || 'reign';
        const player2Intro = document.getElementById('player2Intro');
        const player2Image = player2Intro.querySelector('.fighter-image');
        const player2Name = player2Intro.querySelector('.character-name');

        // Set up player 2 intro visuals
        const isPlayer2CurseOr = player2Character === 'curse-or';
        const player2PreviewPath = isPlayer2CurseOr ? 
            '../assests/players/character_1/preview.gif' :
            '../assests/players/character_2/2_Left_Preview.gif';
        
        player2Image.style.backgroundImage = `url('${player2PreviewPath}')`;
        player2Image.style.position = 'absolute';
        player2Image.style.bottom = '0';
        player2Image.style.right = '0';
        player2Image.style.left = 'auto';
        
        // Flipped orientation for Player 2 with slide-in animation
        if (!isPlayer2CurseOr) {
            player2Image.style.animation = 'slideFromRight 1s ease-out forwards';
        } else {
            player2Image.style.animation = 'slideFromRight 1s ease-out forwards';
        }

        player2Name.textContent = player2Character.toUpperCase();
        player2Intro.classList.add('intro-active');

        this.introPhase = 1;  // Set phase before playing audio

        // Play player 2 announcement
        await this.playAudio(isPlayer2CurseOr ? this.audioElements.rightCurseor : this.audioElements.rightReign);

        // Only show continue prompt if we haven't skipped to VS screen
        if (this.introPhase === 1) {
            const roundAnnouncement = document.getElementById('roundAnnouncement');
            roundAnnouncement.textContent = 'PRESS SPACE BAR TO CONTINUE';
            roundAnnouncement.style.cssText = `
                font-size: 24px;
                color: #fff;
                position: fixed;
                bottom: 20%;
                left: 50%;
                transform: translateX(-50%);
                z-index: 1000;
                text-align: center;
                font-family: 'Press Start 2P', cursive;
                animation: blinkText 1s infinite;
                text-shadow: 0 0 10px rgba(255,255,255,0.8);
            `;
            roundAnnouncement.classList.add('active');
        }
    }

    async announceRoundStart() {
        // Remove event listeners before playing announcement
        this.removeEventListeners();

        // Hide the round announcement first
        const roundAnnouncement = document.getElementById('roundAnnouncement');
        if (roundAnnouncement) {
            roundAnnouncement.style.opacity = '0';
            roundAnnouncement.classList.remove('active');
            await new Promise(resolve => setTimeout(resolve, 500)); // Wait for fade out
            roundAnnouncement.style.display = 'none';
        }

        // Show VS screen
        const vsScreen = document.getElementById('vsScreen');
        const vsText = vsScreen.querySelector('.vs-text');
        const vsFlash = vsScreen.querySelector('.vs-flash');

        // Show VS screen
        vsScreen.style.display = 'flex';
        
        // Trigger animations
        vsText.style.animation = 'vsTextEntrance 1s ease-out forwards';
        vsFlash.style.animation = 'vsFlash 0.5s ease-out forwards';
        
        // Create particle effect
        this.createParticles();

        // Wait for VS animation
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Play "Let the battle begin"
        await this.playAudio(this.audioElements.fightBegin);

        // Start background music and timer after "Let the battle begin"
        const mapMusic = document.getElementById('mapMusic');
        if (mapMusic) {
            await mapMusic.play().catch(error => {
                console.error('Error playing map music:', error);
            });
            
            // Start the timer and enable controls only after music starts
            if (window.gameState) {
                window.gameState.roundStarted = true;
                window.gameState.roundPaused = false;
            }
        }

        // Fade out everything
        const elements = [
            document.getElementById('player1Intro'),
            document.getElementById('player2Intro'),
            vsScreen
        ];

        // Create fade-out animation
        elements.forEach(el => {
            if (el) {
                el.style.transition = 'opacity 0.5s ease-out';
                el.style.opacity = '0';
            }
        });

        // Wait for fade out
        await new Promise(resolve => setTimeout(resolve, 500));

        // Remove elements
        elements.forEach(el => {
            if (el) {
                if (el.id === 'vsScreen') {
                    el.style.display = 'none';
                } else {
                    el.classList.remove('intro-active');
                    el.style.display = 'none';
                }
            }
        });

        // Start the fight
        document.getElementById('fightScreen').classList.remove('intro-phase');
        this.introPhase = 3;
    }

    createParticles() {
        const vsScreen = document.getElementById('vsScreen');
        const particlesContainer = vsScreen.querySelector('.vs-particles');
        
        // Clear existing particles
        particlesContainer.innerHTML = '';

        // Create new particles
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            // Random position around VS text
            const angle = (Math.random() * Math.PI * 2);
            const distance = 100 + Math.random() * 100;
            const x = Math.cos(angle) * distance + vsScreen.clientWidth / 2;
            const y = Math.sin(angle) * distance + vsScreen.clientHeight / 2;
            
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            particle.style.animation = `particleBurst ${0.5 + Math.random() * 0.5}s ease-out forwards`;
            
            particlesContainer.appendChild(particle);
        }
    }

    async announceRound() {
        // Fade out VS screen and other elements
        const elements = [
            document.getElementById('roundAnnouncement'),
            document.getElementById('player1Intro'),
            document.getElementById('player2Intro'),
            document.getElementById('vsScreen')
        ];

        // Create fade-out animation
        elements.forEach(el => {
            if (el) {
                el.style.transition = 'opacity 0.5s ease-out';
                el.style.opacity = '0';
            }
        });

        // Wait for fade out
        await new Promise(resolve => setTimeout(resolve, 500));

        // Remove elements
        elements.forEach(el => {
            if (el) {
                if (el.id === 'vsScreen') {
                    el.style.display = 'none';
                } else {
                    el.classList.remove('intro-active');
                    el.style.display = 'none';
                }
            }
        });

        // Start the fight immediately
        document.getElementById('fightScreen').classList.remove('intro-phase');
        this.introPhase = 3;

        // Start the timer and enable controls
        if (window.gameState) {
            window.gameState.roundStarted = true;
            window.gameState.roundPaused = false;
        }
    }

    async announceNextRound() {
        // Disable all key listeners temporarily
        this.removeEventListeners();

        // Show Round announcement
        const roundAnnouncement = document.getElementById('roundAnnouncement');
        roundAnnouncement.style.fontSize = '72px';
        roundAnnouncement.style.textShadow = '0 0 20px #fff, 0 0 30px #ff0000, 0 0 40px #ff0000';
        roundAnnouncement.textContent = `ROUND ${this.currentRound}`;
        roundAnnouncement.style.opacity = '1'; // Ensure it's visible
        roundAnnouncement.classList.add('active');

        // Play the appropriate round announcement
        let roundAudio;
        if (this.currentRound === 2) {
            roundAudio = this.audioElements.round2;
        } else if (this.currentRound === 3) {
            roundAudio = this.audioElements.finalRound;
        }

        if (roundAudio) {
            await this.playAudio(roundAudio);
            // Wait longer for the round announcement to be visible
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        // Hide round announcement
        roundAnnouncement.classList.remove('active');
        roundAnnouncement.style.opacity = '0';

        // Show VS screen
        const vsScreen = document.getElementById('vsScreen');
        const vsText = vsScreen.querySelector('.vs-text');
        const vsFlash = vsScreen.querySelector('.vs-flash');

        // Show VS screen
        vsScreen.style.display = 'flex';
        vsScreen.style.opacity = '1';
        
        // Trigger animations
        vsText.style.animation = 'vsTextEntrance 1s ease-out forwards';
        vsFlash.style.animation = 'vsFlash 0.5s ease-out forwards';
        
        // Create particle effect
        this.createParticles();

        // Wait for VS animation
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Play "Let the battle begin"
        await this.playAudio(this.audioElements.fightBegin);

        // Reset game state
        if (window.gameState) {
            // Reset positions and stats
            window.gameState.player1.health = 100;
            window.gameState.player2.health = 100;
            window.gameState.player1.stamina = 100;
            window.gameState.player2.stamina = 100;
            
            // Reset positions
            window.gameState.player1.position = window.gameState.arena.width * 0.3;
            window.gameState.player2.position = window.gameState.arena.width * 0.7;
            
            // Update UI elements
            const healthBars = document.querySelectorAll('.health-bar');
            healthBars.forEach(bar => {
                bar.style.width = '100%';
                bar.textContent = '100%';
            });
            
            // Update stamina bars
            const staminaBars = document.querySelectorAll('.main-stamina-bar');
            staminaBars.forEach(bar => {
                bar.style.width = '100%';
            });

            // Reset timer to 60
            const timerElement = document.querySelector('.timer');
            if (timerElement) {
                timerElement.textContent = '60';
                timerElement.style.color = '#fff'; // Reset timer color
            }

            // Update player positions in the DOM
            if (window.gameState.player1.element) {
                window.gameState.player1.element.style.left = window.gameState.player1.position + 'px';
            }
            if (window.gameState.player2.element) {
                window.gameState.player2.element.style.left = window.gameState.player2.position + 'px';
            }

            // Reset player states
            window.gameState.player1.isJumping = false;
            window.gameState.player1.isGuarding = false;
            window.gameState.player1.isAttacking = false;
            window.gameState.player2.isJumping = false;
            window.gameState.player2.isGuarding = false;
            window.gameState.player2.isAttacking = false;

            // Start background music
            const mapMusic = document.getElementById('mapMusic');
            if (mapMusic) {
                await mapMusic.play().catch(error => {
                    console.error('Error playing map music:', error);
                });
            }

            // Start the new round
            window.gameState.roundStarted = true;
            window.gameState.roundPaused = false;
        }

        // Fade out VS screen
        vsScreen.style.transition = 'opacity 0.5s ease-out';
        vsScreen.style.opacity = '0';
        await new Promise(resolve => setTimeout(resolve, 500));
        vsScreen.style.display = 'none';
        
        // Remove intro phase class to show the fight screen
        document.getElementById('fightScreen').classList.remove('intro-phase');
        
        // Set phase to active fight
        this.introPhase = 3;
    }

    async startNextRound() {
        // Sync with game state's current round
        if (window.gameState) {
            this.currentRound = window.gameState.currentRound;
        } else {
            this.currentRound++;
        }
        
        this.introPhase = 2;
        document.getElementById('fightScreen').classList.add('intro-phase');

        // Reset game state
        if (window.gameState) {
            // Reset health and stamina
            window.gameState.player1.health = 100;
            window.gameState.player2.health = 100;
            window.gameState.player1.stamina = 100;
            window.gameState.player2.stamina = 100;

            // Reset positions
            window.gameState.player1.position = window.gameState.arena.width * 0.3;
            window.gameState.player2.position = window.gameState.arena.width * 0.7;

            // Update UI elements
            const healthBars = document.querySelectorAll('.health-bar');
            healthBars.forEach(bar => {
                bar.style.width = '100%';
                bar.textContent = '100%';
            });

            const staminaBars = document.querySelectorAll('.main-stamina-bar');
            staminaBars.forEach(bar => {
                bar.style.width = '100%';
            });

            // Reset timer to 60
            const timerElement = document.querySelector('.timer');
            if (timerElement) {
                timerElement.textContent = '60';
                timerElement.style.color = '#fff'; // Reset timer color in case it was red from overtime
            }

            // Update player positions in the DOM
            if (window.gameState.player1.element) {
                window.gameState.player1.element.style.left = window.gameState.player1.position + 'px';
            }
            if (window.gameState.player2.element) {
                window.gameState.player2.element.style.left = window.gameState.player2.position + 'px';
            }

            // Reset player states
            window.gameState.player1.isJumping = false;
            window.gameState.player1.isGuarding = false;
            window.gameState.player1.isAttacking = false;
            window.gameState.player2.isJumping = false;
            window.gameState.player2.isGuarding = false;
            window.gameState.player2.isAttacking = false;

            window.gameState.roundStarted = false;
            window.gameState.roundPaused = true;
        }

        // Show press any key overlay
        const pressKeyOverlay = document.getElementById('pressKeyOverlay');
        if (pressKeyOverlay) {
            pressKeyOverlay.style.display = 'flex';
            const pressKeyText = pressKeyOverlay.querySelector('.press-key-text');
            if (pressKeyText) {
                pressKeyText.textContent = 'PRESS ANY KEY TO START NEXT ROUND';
            }
        }

        // Update round info in the header
        const roundInfo = document.querySelector('.round-info');
        if (roundInfo) {
            roundInfo.textContent = `ROUND ${this.currentRound}`;
        }

        // Re-add event listener for key press
        this.setupEventListeners();
    }

    // Add skipToFight method
    async skipToFight() {
        // Remove any existing event listeners
        this.removeEventListeners();
        
        // Hide any existing overlays
        const overlays = [
            document.getElementById('pressKeyOverlay'),
            document.getElementById('roundAnnouncement'),
            document.getElementById('vsScreen')
        ];
        
        overlays.forEach(overlay => {
            if (overlay) {
                overlay.style.display = 'none';
            }
        });

        // Play "Let the battle begin"
        await this.playAudio(this.audioElements.fightBegin);

        // Start background music
        const mapMusic = document.getElementById('mapMusic');
        if (mapMusic) {
            mapMusic.play().catch(error => {
                console.error('Error playing map music:', error);
            });
        }

        // Start the game
        if (window.gameState) {
            window.gameState.roundStarted = true;
            window.gameState.roundPaused = false;
        }

        // Set phase to active fight
        this.introPhase = 3;
    }
}

// Initialize the announcer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.announcer = new Announcer();
}); 