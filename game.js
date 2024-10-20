
        // Function to get URL parameters
        function getParameterByName(name) {
            const url = window.location.href;
            name = name.replace(/[[]]/g, '\\$&');
            const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
            const results = regex.exec(url);
            if (!results) return null;
            if (!results[2]) return '';
            return decodeURIComponent(results[2].replace(/\+/g, ' '));
        }

        // Get the 'wordlist' parameter from the URL
        const wordListParam = getParameterByName('wordlist');

        if (wordListParam) {
            // Dynamically load the specified word list
            const script = document.createElement('script');
            script.src = 'wordlists/' + wordListParam;
            document.head.appendChild(script);



            script.onerror = function() {
                console.error('Failed to load the word list.');
                alert('Failed to load the word list.');
            };
        } else {
            console.error('No word list specified in the URL.');
            alert('No word list specified.');
            // Optionally, redirect to a default word list or an error page
        }
    
    // OLD CODE BELOW  
		
		window.onload = function() {
			clearGame(); // Ensure any existing timers are cleared
			// Optionally, reset any game-related elements to their initial state if needed
			score = 0;
			scoreDisplay.innerText = 'Score: 0';
			timerDisplay.innerText = 'Time: 00:00';
		};


	  // References to HTML elements
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        const scoreDisplay = document.getElementById('score');
        const splashScreen = document.getElementById('splashScreen');
        const startButton1 = document.getElementById('startButton1');
		const startButton2 = document.getElementById('startButton2');
		const startButton3 = document.getElementById('startButton3');
		const startButton4 = document.getElementById('startButton4');
        const endingScreen = document.getElementById('endingScreen');
        const timerDisplay = document.getElementById('timer');
        const finalTimeDisplay = document.getElementById('finalTime');
		


		
        const death = new Audio('audio/bubble1.mp3');
		const fanfare = new Audio('audio/cheer1.mp3');
		const backgroundMusic = new Audio('audio/volcanosongnew5.mp3');	
		
		
		// const rescue1 = new Audio('audio/am1.mp3'); // First sound effect
		let rescueeffect = [
			new Audio('audio/am1.mp3'),
			new Audio('audio/am2.mp3'),
			new Audio('audio/am3.mp3')
		];
		rescueeffect.forEach(sound => {
		sound.volume = 0.2;
		});
		
        let currentSoundIndex = 0; 
		 
		
		fanfare.volume = 0.5; 
		death.volume = 0.3;

		backgroundMusic.loop = true;  
		backgroundMusic.volume = 0.6; 
		
		
		let musicButton = document.getElementById('musicButton');
		
		let isMuted = false; // To keep track of the current state

		// Add an event listener to the image/button
		musicButton.addEventListener('click', function() {

			if (isMuted) {
				// If currently muted, unmute and change image back
				backgroundMusic.volume = 0.6;

				musicButton.src = 'images/musicon.gif'; // Change back to original image
				musicButton.alt = "Volume On"; // Update alt text for accessibility
			} else {
				// If not muted, mute and change image
				backgroundMusic.volume = 0.0;

				musicButton.src = 'images/musicoff.gif'; // Change to muted image
				musicButton.alt = "Volume Off"; // Update alt text for accessibility
			}
			
			// Toggle the isMuted flag
			isMuted = !isMuted;
			
			canvas.focus();
		});
		

		
        // Words used in the game (English and Swedish pairs)

        
        let gameRunning = false; // Track if the game is running
		let fallingWords = []; // Array to store words falling on screen
        let score = 0; // Player's score
        let gameInterval; // Interval for spawning words
		let speed = 0;
        let speedLabel = 'None';
		
		
        let gamePaused = false; // Game paused state
		let pauseTime = null; // Time when the game was paused
        let animationInterval; // Interval for ending screen animation
        let startTime; // Game start time
        let timerInterval; // Interval for updating timer

        // Set canvas to fill the entire screen
        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
    
		function setSpeed(selectedSpeed, label) {
            speed = selectedSpeed;
            speedLabel = label;
            document.getElementById("currentSpeed").textContent = speedLabel;
			console.log("Speed set to:", speed, "Label:", speedLabel); // For debugging purposes
        }

		function playSound() {
			// Get the current sound effect from the array
			let currentSound = rescueeffect[currentSoundIndex];
			
			// Play the sound
			currentSound.currentTime = 0; // Reset to start
			currentSound.play();
			
			// Increment the index, and reset it to 0 if we reach the end of the array
			currentSoundIndex = (currentSoundIndex + 1) % rescueeffect.length;
		}
		
        function triggerConfetti() {
            var end = Date.now() + (15 * 1000);
    
            var colors = ['#bb0000', '#ffffff'];
    
            (function frame() {
                confetti({
                    particleCount: 2,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: colors
                });
                confetti({
                    particleCount: 2,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: colors
                });
    
                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            }());
        }
    
        // Call resizeCanvas when the window is resized
        window.addEventListener('resize', resizeCanvas);

        // Set initial size
        resizeCanvas();

        // Class to handle particle effects
        class Particle {
            constructor(x, y, color) {
                this.x = x;
                this.y = y;
                this.radius = Math.random() * 6 + 2; // Random particle size
                this.color = color;
                this.speedX = (Math.random() - 0.5) * 4; // Random horizontal speed
                this.speedY = (Math.random() - 0.5) * 4; // Random vertical speed
                this.alpha = 1; // Transparency level
            }

            update() {
                this.x += this.speedX; // Update position based on speed
                this.y += this.speedY;
                this.alpha -= 0.02; // Gradually fade out
            }

            draw() {
                ctx.save();
                ctx.globalAlpha = this.alpha; // Set transparency
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); // Draw circle
                ctx.fillStyle = this.color;
                ctx.fill();
                ctx.restore();
            }
        }

        let particles = []; // Array to store particle effects

        // Class to handle falling words
        class FallingWord {
            constructor(wordObj) {
                this.english = wordObj.english; // English word
                this.swedish = wordObj.swedish; // Swedish translation
                this.matchedLength = 0; // Number of letters matched by user
                this.isAscending = false; // Whether the word is ascending after being matched
				
				this.speed = Math.random() * 1 + speed; // Falling speed // Falling speed
				// this.speed = Math.random() * 1 + 0.3; // Falling speed
                this.y = -50; // Initial vertical position (above the canvas)

                // Calculate text width to position the word correctly
                ctx.font = '24px Courier';
                const englishWidth = ctx.measureText(this.english).width;
                ctx.font = '20px Courier';
                const swedishWidth = ctx.measureText(this.swedish).width;
                const textWidth = Math.max(englishWidth, swedishWidth);

                const minX = textWidth / 2 + 10;
                const maxX = canvas.width - textWidth / 2 - 10;

                this.x = Math.random() * (maxX - minX) + minX; // Random horizontal position
            }

            update() {
                if (!this.isAscending) {
                    this.y += this.speed; // Fall down if not ascending
                } else {
                    this.y -= this.speed * 2; // Move up if ascending
                }
            }

            draw() {
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                ctx.font = '18px Rethink Sans';
                ctx.shadowBlur = 0;
                ctx.fillStyle = '#FFFFFF';
                const swedishTextWidth = ctx.measureText(this.swedish).width;
                const swedishStartX = this.x - swedishTextWidth / 2;
                ctx.fillText(this.swedish, swedishStartX, this.y - 30); // Draw Swedish translation above the word

                ctx.font = '22px Rethink Sans';
                let beforeMatch = this.english.substring(0, this.matchedLength); // Matched part of the word
                let afterMatch = this.english.substring(this.matchedLength); // Unmatched part
                let totalTextWidth = ctx.measureText(this.english).width;
                let startX = this.x - totalTextWidth / 2;

                if (this.isAscending) {
					ctx.fillStyle = 'rgba(0, 255, 255, 1)'; // Set ascending word color to white
                    ctx.shadowColor = 'white';
                    ctx.shadowBlur = 10; // Add shadow to hint at word position

                } else {
                    ctx.fillStyle = 'rgba(59, 247, 75, 1)';
                }
                
                ctx.fillText(beforeMatch, startX, this.y); // Draw matched part
                let beforeMatchWidth = ctx.measureText(beforeMatch).width;

                let unmatchedColor = 'rgba(242, 189, 13, 1)'; // Default color for unmatched part
                if (score >= 40 && score <= 69) {
                    unmatchedColor = 'black'; // Make text invisible at certain score
                    ctx.shadowColor = 'rgba(255, 209, 110, 0.35)';
                    ctx.shadowBlur = 8; // Add shadow to hint at word position
                } else if (score >= 70) {
                    unmatchedColor = 'black'; // Completely invisible at higher score
                } else {
                    ctx.shadowBlur = 0;
                }

                ctx.fillStyle = unmatchedColor;
                ctx.fillText(afterMatch, startX + beforeMatchWidth, this.y); // Draw unmatched part
            }
        }

        // Function to spawn a new word
        function spawnWord() {
            if (!gamePaused) {
                let wordObj = words[Math.floor(Math.random() * words.length)]; // Select a random word
                let word = new FallingWord(wordObj); // Create a new FallingWord instance
                fallingWords.push(word); // Add to falling words array
            }
        }

        // Function to update the game state
        function update() {
            if (!gamePaused) {
                ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
                ctx.fillStyle = "rgba(255, 255, 255, 0.0)";
                ctx.fillRect(0, canvas.height - 50, canvas.width, 50); // Draw transparent lava area

                // Update and draw all falling words
                fallingWords.forEach((word) => {
                    word.update();
                    word.draw();
                });

                // Update and draw all particles
                particles.forEach((particle, index) => {
                    particle.update();
                    if (particle.alpha <= 0) {
                        particles.splice(index, 1); // Remove faded out particles
                    } else {
                        particle.draw();
                    }
                });

                // Filter out words that have expired
                fallingWords = fallingWords.filter((word) => {
                    if (word.isAscending && word.y < -50) {
                        return false; // Remove word if it ascends off-screen
                    }
                    if (!word.isAscending && word.y > canvas.height - 50) {
                        // Word hits the lava
                        if (score > 0) {
                            score -= 1; // Decrease score
                            scoreDisplay.innerText = 'Score: ' + score;
                        }
                        // Create particle effects for splash
                        for (let i = 0; i < 40; i++) {
                            particles.push(new Particle(word.x, canvas.height - 50, '#f2bd0d'));
                        }
                        
                        death.play();
                        return false; // Remove word after hitting lava
                    }
                    return true; // Keep word
                });
            }

            requestAnimationFrame(update); // Call update again on the next frame
        }

        // Function to update the timer display
        function updateTimer() {
            const currentTime = Date.now();
            const elapsedTime = currentTime - startTime;
            const minutes = Math.floor(elapsedTime / 60000).toString().padStart(2, '0');
            const seconds = Math.floor((elapsedTime % 60000) / 1000).toString().padStart(2, '0');
            timerDisplay.innerText = `Time: ${minutes}:${seconds}`;
        }

        // Function to start the game
        function startGame() {
			if (gameRunning) {
				clearGame(); // Clear any previous game instance before starting anew
			}
			
			splashScreen.style.display = 'none'; // Hide splash screen
			
			const message = document.getElementById('message');
            message.style.visibility = 'visible';
            message.style.opacity = '1';
            
            setTimeout(() => {
                message.style.opacity = '0';
            }, 3000); // Wait 2 seconds before starting to fade out
            
            setTimeout(() => {
                message.style.visibility = 'hidden';
            }, 5000); // Fully hide after fading out (2s + 2s)
			

			backgroundMusic.play();
			
			canvas.focus(); // Focus on the canvas to capture key input
			
			
			if (typeof words === 'undefined') {
				console.error('Word list is not loaded.');
				alert('Word list is not loaded.');
				return;
			}
			
			

		// Example of attaching this to beforeunload and visibilitychange events
		window.addEventListener('beforeunload', clearGame); // Clear game when the tab/window is closed

			// Example game logic using the 'words' array
			words.forEach((word) => {
				console.log(`English: ${word.english}, Swedish: ${word.swedish}`);
			});
			
            startTime = Date.now(); // Record the start time
            timerInterval = setInterval(updateTimer, 1000); // Update the timer every second
            gameInterval = setInterval(spawnWord, 3500); // Spawn a new word every 3 seconds
            update(); // Start the game loop
			gameRunning = true; // Set the game as running
        }

        // Function to show the ending screen and animate words flying towards camera
        function showEndingScreen() {
            endingScreen.style.display = 'flex';
            clearInterval(timerInterval); // Stop the timer
            let wordsToAnimate = [...words];
            let wordElements = [];

            fanfare.play();
            triggerConfetti();

            // Show the final time
			
            const elapsedTime = Date.now() - startTime;
            const minutes = Math.floor(elapsedTime / 60000).toString().padStart(2, '0');
            const seconds = Math.floor((elapsedTime % 60000) / 1000).toString().padStart(2, '0');
            finalTimeDisplay.innerText = `Final Time: ${minutes}:${seconds}`;
      
        }

        // Event listener for the start button
        startButton1.addEventListener('click', startGame);
		startButton2.addEventListener('click', startGame);
		startButton3.addEventListener('click', startGame);
		startButton4.addEventListener('click', startGame);



        // Event listener for key presses
        canvas.addEventListener('keydown', (e) => {
            let key = e.key;
            if (key.length !== 1) return; // Ignore non-character keys

            fallingWords.forEach((word) => {
                if (!word.isAscending) {
                    let expectedChar = word.english.charAt(word.matchedLength);
                    if (expectedChar.toLowerCase() === key.toLowerCase()) {
                        word.matchedLength += 1; // Update matched length

                        if (word.matchedLength === word.english.length) {
                            word.isAscending = true; // Make word ascend if fully matched
                            score += 1; // Increase score
                            scoreDisplay.innerText = 'Score: ' + score;
                            // Create particle effects for rescue
                            for (let i = 0; i < 5; i++) {
                                particles.push(new Particle(word.x, word.y, 'white'));
                            }
                              
							playSound();
							//rescue1.play();

                            // Check if player reached 100 points
                            if (score >= 100) {
                                clearInterval(gameInterval);
                                showEndingScreen();
                                gamePaused = true;
                            }
                        }
                    } else {
                        word.matchedLength = 0; // Reset matched length if incorrect
                    }
                }
            });
        });



		// Function to clear all game intervals and animations
		function clearGame() {
			if (gameInterval) {
				clearInterval(gameInterval); // Clear word spawn interval
				gameInterval = null;
			}
			if (timerInterval) {
				clearInterval(timerInterval); // Clear timer interval
				timerInterval = null;
			}
			if (animationInterval) {
				cancelAnimationFrame(animationInterval); // Cancel animation frame if applicable
				animationInterval = null;
			}
		}
