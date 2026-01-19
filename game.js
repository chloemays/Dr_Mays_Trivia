/**
 * Doctor Mays' Birthday Quest
 * A D&D-inspired trivia game with synthwave 80s aesthetics
 */

// =====================================================
// Game State
// =====================================================

const gameState = {
    currentScreen: 'title-screen',
    config: null,
    selectedCharacter: null,
    totalQuestions: 0,
    currentQuestionIndex: 0,
    correctAnswers: 0,
    firstTryCorrect: 0, // Track first-try correct answers
    wrongAttempts: 0, // Track total wrong attempts
    currentQuestionAttempts: 0, // Wrong attempts on current question
    consecutiveWrong: 0, // Track consecutive wrong answers for penalties
    currentAct: 1,
    questions: [],
    storyIntroIndex: 0,
    isAnswering: false,
    storyBetweenQuestions: [] // Story segments to show between questions
};

// =====================================================
// Story Content
// =====================================================

const storySegments = {
    intro: [
        "The Kingdom of Trivia was once a beacon of neon light and boundless knowledge...",
        "But the Shadow of Ignorance has drained the color from our world.",
        "It began as a whisper—forgotten facts, blurred memories, gray skies.",
        "Now, the Synthwave sun is dying. The data streams are corrupted.",
        "Doctor Mays, our greatest guardian, left behind a legacy...",
        "A power that only a true scholar can wield to reignite the grid.",
        "That scholar... is YOU."
    ],
    progression: [
        // Act 1 - The Neon Gateway
        "The Gateway flickers with unstable energy. The path ahead is dangerous, paved with corrupted code. You take your first step away from safety, leaving the known world behind. The destination is unknown, but the mission is clear: Restore the Light.",

        // Act 2 - The Forest of Whispers
        "You enter the Forest of Whispers, where truth is strangled by confusion. The chrome trees reflect distorted versions of reality, and cyber-owls screech misinformation from the branches. The path twists illogically, trying to lead you astray.",

        // Act 3 - The Forgotten Library
        "The air grows cold and stale. You stand in the Forgotten Library, a graveyard of lost history. Dust covers the holographic scrolls, and the silence here is heavy with the weight of things unsaid. To proceed, you must awaken the sleeping data.",

        // Act 4 - The Echoing Caverns
        "Beneath the surface, the Echoing Caverns pulse with a threatening rhythm. Sharp obsidian rocks tear at your resolve. The Shadow deepens here, feeding on doubt. Your footsteps echo loudly—are you walking into a trap?",

        // Act 5 - The Crystal Bridge
        "A chasm of infinite darkness blocks your way. The only path forward is a bridge of pure light, fragile and translucent. It requires a leap of faith. One misstep, one false fact, and you fall into the void forever.",

        // Act 6 - The Tower of Riddles
        "The Tower pierces the violet sky, a monument to complexity. The stairs defy gravity, shifting and rotating. This is a test of perspective. You must climb above the noise to see the truth clearly.",

        // Act 7 - The Shadow Citadel
        "You have reached the heart of the enemy's territory. The Shadow Citadel looms, a jagged fortress of malice cracking with red lightning. Use your knowledge as a shield. The Shadow knows you are here, and it is afraid.",

        // Act 8 - The Inner Sanctum
        "Inside the Sanctum, logic itself breaks down. It is a realm of abstract chaos. Geometric shapes attack your mind, trying to overwrite your logic with nonsense. But you persist. The Core of Knowledge is close. You can hear its hum.",

        // Act 9 - The Final Truth
        "This is it. The confrontation. You stand before the Shadow of Ignorance itself—a swirling vortex of lies. It screams chaos, but you speak Truth. Your answers are weapons now. Strike true, champion!"
    ],
    victory: [
        "A blinding flash of pure white light pierces the Shadow!",
        "The darkness shatters! Color floods back into the grid!",
        "The Synthwave sun rises once more, brighter than ever before.",
        "Doctor Mays' legacy is secured. The Kingdom is saved!",
        "You are the Master of Trivia. You are the Light."
    ]
};

// =====================================================
// Game Controller
// =====================================================

const game = {
    /**
     * Initialize the game by loading configuration
     */
    async init() {
        try {
            await this.loadConfig();
            if (window.audioManager) {
                await window.audioManager.init();
                this.audioManager = window.audioManager;
            }
            this.showScreen('title-screen');
            if (window.VisualEffects) window.VisualEffects.startFloatingEmojis('music');
            console.log('Doctor Mays\' Birthday Quest initialized!');
        } catch (error) {
            console.error('Failed to initialize game:', error);
            this.showError('Failed to load game configuration. Please refresh the page.');
        }
    },

    penalties: [
        "Drink another player's drink!",
        "The next player chooses your answer!",
        "Speak with a robot voice until next turn!",
        "Do 5 jumping jacks!",
        "Compliment the person correctly answering next!",
        "You cannot speak for the next question!",
        "You must sing your answer next time!",
        "Give a high-five to the person on your left!",
        "Confess an embarrassing 80s trend you liked!",
        "Do a dramatic reading of the next question!",
        "Act like a T-Rex for the next 30 seconds!",
        "Do your best evil laugh!",
        "Whatever you say next must rhyme!"
    ],

    /**
     * Load game configuration from JSON file
     */
    async loadConfig() {
        try {
            // Load manifest
            const manifestResponse = await fetch('assets/config/manifest.json');
            if (!manifestResponse.ok) throw new Error('Failed to load manifest.json');
            const manifest = await manifestResponse.json();

            // Load all parts in parallel
            const [metadata, characters, ...categories] = await Promise.all([
                fetch(manifest.metadata).then(r => r.json()),
                fetch(manifest.characters).then(r => r.json()),
                ...manifest.categories.map(url => fetch(url).then(r => r.json()))
            ]);

            // Assemble config
            gameState.config = {
                ...metadata,
                characters: characters,
                categories: categories
            };

        } catch (error) {
            console.error('Config loading failed:', error);
            throw new Error('Failed to load game configuration');
        }
    },

    /**
     * Show a specific game screen
     * @param {string} screenId - The ID of the screen to show
     */
    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.game-screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // Show target screen
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
            gameState.currentScreen = screenId;
        }
    },

    /**
     * Start the game from title screen
     */
    startGame() {
        this.showScreen('birthday-splash');
        if (window.VisualEffects) window.VisualEffects.startFloatingEmojis('party');
    },

    /**
     * Show character selection screen
     */
    showCharacterSelect() {
        this.renderCharacterGrid();
        this.showScreen('character-select');
        if (window.VisualEffects) window.VisualEffects.startFloatingEmojis('hero');
    },

    /**
     * Render the character selection grid
     */
    renderCharacterGrid() {
        const grid = document.getElementById('character-grid');
        const characters = gameState.config.characters;

        grid.innerHTML = characters.map(char => `
            <div class="character-card" data-character-id="${char.id}" onclick="game.selectCharacter('${char.id}')">
                <img class="character-portrait" src="${char.imagePath}" alt="${char.name}" 
                     onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%23541388%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2255%22 text-anchor=%22middle%22 fill=%22%23e0e0e0%22 font-size=%2240%22>?</text></svg>'">
                <h3 class="character-name">${char.name}</h3>
                <span class="character-class">${char.class}</span>
                <p class="character-bio">${char.bio}</p>
            </div>
        `).join('');
    },

    /**
     * Select a character
     * @param {string} characterId - The ID of the selected character
     */
    selectCharacter(characterId) {
        // Update state
        gameState.selectedCharacter = gameState.config.characters.find(c => c.id === characterId);

        // Update UI
        document.querySelectorAll('.character-card').forEach(card => {
            card.classList.remove('selected');
            if (card.dataset.characterId === characterId) {
                card.classList.add('selected');
            }
        });

        // Move to question count selection after brief delay
        setTimeout(() => {
            this.showQuestionCountSelect();
        }, 500);
    },

    /**
     * Show question count selection screen
     */
    showQuestionCountSelect() {
        this.renderQuestionCountOptions();
        this.showScreen('question-count-select');
    },

    /**
     * Render question count options
     */
    renderQuestionCountOptions() {
        const container = document.getElementById('question-count-options');
        const totalAvailable = this.getTotalAvailableQuestions();

        // Offer options: 10, 20, 30, 40 (max 40)
        const options = [10, 20, 30, 40].filter(n => n <= totalAvailable);
        if (totalAvailable > 0 && totalAvailable < 40 && !options.includes(totalAvailable)) {
            options.push(totalAvailable);
            options.sort((a, b) => a - b);
        }

        container.innerHTML = options.map(count => `
            <button class="count-btn" onclick="game.selectQuestionCount(${count})">${count}</button>
        `).join('');
    },

    /**
     * Get total number of available questions (enabled and complete)
     * @returns {number}
     */
    getTotalAvailableQuestions() {
        let count = 0;
        gameState.config.categories.forEach(category => {
            category.questions.forEach(q => {
                if (q.enabled && q.status === 'complete') {
                    count++;
                }
            });
        });
        return count;
    },

    /**
     * Select question count and prepare questions
     * @param {number} count - Number of questions to use
     */
    selectQuestionCount(count) {
        gameState.totalQuestions = count;
        gameState.questions = this.sampleQuestions(count);
        gameState.currentQuestionIndex = 0;
        gameState.correctAnswers = 0;
        gameState.firstTryCorrect = 0;
        gameState.wrongAttempts = 0;
        gameState.currentQuestionAttempts = 0;

        // Assign story segments between questions
        this.assignStorySegments();

        if (window.VisualEffects) window.VisualEffects.stopFloatingEmojis();

        this.startDramaticIntro();
    },

    /**
     * Assign story segments to appear between questions
     * Story appears based on progress percentage to match the 9 acts
     */
    assignStorySegments() {
        gameState.storyBetweenQuestions = [];
        const total = gameState.totalQuestions;
        const progressionStories = storySegments.progression;

        // Image Mapping for Acts 1-9
        const actImages = [
            "assets/story/The Neon Gateway.png",      // Act 1
            "assets/story/The Forest of Whispers.png", // Act 2
            "assets/story/The Forgotten Library.png", // Act 3
            "assets/story/The Echoing Caverns.png",   // Act 4
            "assets/story/The Crystal Bridge.png",    // Act 5
            "assets/story/The Tower of Riddles.png",  // Act 6
            "assets/story/The Shadow Citadel.png",    // Act 7
            "assets/story/The Inner Sanctum.png",     // Act 8
            "assets/story/The Final Truth.png"        // Act 9
        ];

        // Map 9 key milestones (10% to 90%)
        const milestones = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];

        milestones.forEach((percent, index) => {
            const questionIndex = Math.floor(total * percent) - 1;

            // Ensure valid index and we have a story for this act
            if (questionIndex >= 0 && questionIndex < total - 1 && index < progressionStories.length) {

                // One story segment per act now
                const finalStoryIndex = index;

                // Store text AND image
                gameState.storyBetweenQuestions[questionIndex] = {
                    text: progressionStories[finalStoryIndex],
                    image: actImages[index] || "" // Fallback string if missing
                };
            }
        });
    },

    /**
     * Sample questions from all categories with balanced distribution
     * @param {number} count - Number of questions to sample
     * @returns {Array} - Array of sampled questions
     */
    sampleQuestions(count) {
        const categories = gameState.config.categories;
        const allQuestions = [];

        // Collect all enabled, complete questions
        categories.forEach(category => {
            category.questions.forEach(q => {
                if (q.enabled && q.status === 'complete') {
                    allQuestions.push({
                        ...q,
                        category: category.name,
                        categoryIcon: category.icon
                    });
                }
            });
        });

        // Shuffle and take the requested count
        const shuffled = this.shuffleArray([...allQuestions]);
        return shuffled.slice(0, count);
    },

    /**
     * Shuffle an array using Fisher-Yates algorithm
     * @param {Array} array - Array to shuffle
     * @returns {Array} - Shuffled array
     */
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    },

    /**
     * Start the dramatic intro sequence with fade-in paragraphs
     */
    startDramaticIntro() {
        gameState.storyIntroIndex = 0;

        // Create dramatic intro screen
        const storyScreen = document.getElementById('story-intro');
        const storyText = document.getElementById('story-text');
        const continueBtn = storyScreen.querySelector('.btn-neon');
        const introImage = document.getElementById('intro-image');

        // Make background fully black for dramatic effect
        storyScreen.style.background = '#000';
        storyText.style.opacity = '0';
        continueBtn.style.display = 'none';

        // Show intro image
        if (introImage) {
            introImage.classList.remove('hidden');
        }

        this.showScreen('story-intro');

        // Start the dramatic fade-in sequence
        this.playDramaticIntro();
    },

    /**
     * Play dramatic intro with paragraphs fading in one by one
     */
    playDramaticIntro() {
        const storyText = document.getElementById('story-text');
        const storyScreen = document.getElementById('story-intro');
        const continueBtn = storyScreen.querySelector('.btn-neon');
        const intro = storySegments.intro;

        if (gameState.storyIntroIndex < intro.length) {
            // Fade out current text
            storyText.style.transition = 'opacity 0.5s ease';
            storyText.style.opacity = '0';

            setTimeout(() => {
                // Update text
                storyText.textContent = intro[gameState.storyIntroIndex];

                // Fade in new text
                storyText.style.opacity = '1';
                gameState.storyIntroIndex++;

                // Continue to next paragraph after delay
                setTimeout(() => {
                    this.playDramaticIntro();
                }, 3000); // 3 seconds per paragraph
            }, 500);
        } else {
            // Intro complete - show continue button and restore gradient
            setTimeout(() => {
                storyScreen.style.background = '';
                continueBtn.style.display = '';
                continueBtn.style.opacity = '0';
                continueBtn.style.transition = 'opacity 0.5s ease';

                setTimeout(() => {
                    continueBtn.style.opacity = '1';
                }, 100);
            }, 500);
        }
    },

    /**
     * Skip intro or continue after dramatic intro
     */
    advanceStory() {
        const storyScreen = document.getElementById('story-intro');
        storyScreen.style.background = '';
        this.startQuestions();
    },

    /**
     * Start the question sequence
     */
    startQuestions() {
        this.updateProgressBar();
        this.updateScoreDisplay();
        this.showScreen('question-screen');
        this.displayCurrentQuestion();
    },

    /**
     * Update the progress bar
     */
    updateProgressBar() {
        const progressBar = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');
        const progressCharacter = document.getElementById('progress-character');

        const progress = (gameState.currentQuestionIndex / gameState.totalQuestions) * 100;
        progressBar.style.width = `${progress}%`;
        progressText.textContent = `${gameState.currentQuestionIndex}/${gameState.totalQuestions} Questions`;

        if (gameState.selectedCharacter) {
            progressCharacter.src = gameState.selectedCharacter.imagePath;
            progressCharacter.alt = gameState.selectedCharacter.name;
        }
    },

    /**
     * Update the score display
     */
    updateScoreDisplay() {
        const scoreDisplay = document.getElementById('score-display');
        if (scoreDisplay) {
            scoreDisplay.textContent = `First Try: ${gameState.firstTryCorrect}`;
            scoreDisplay.title = `Wrong attempts: ${gameState.wrongAttempts}`;
        }
    },

    /**
     * Display the current question
     */
    displayCurrentQuestion() {
        const question = gameState.questions[gameState.currentQuestionIndex];

        if (!question) {
            this.showVictory();
            return;
        }

        // Reset state for new question
        gameState.isAnswering = false;
        gameState.currentQuestionAttempts = 0;

        // Question text
        document.getElementById('question-text').textContent = question.text;

        // Show category
        const categoryDisplay = document.getElementById('question-category');
        // Category Mascots Mapping
        const categoryMascotMap = {
            "Math": "synth_sage",
            "Science": "synth_sage",
            "Cats": "whiskers_mcfluff",
            "Geography": "whiskers_mcfluff",
            "Musicals": "melody_rose",
            "80s Music": "melody_rose",
            "Baseball": "blaze_ryder",
            "Movies": "blaze_ryder",
            "Psychiatry": "harmony_valor",
            "Cooking": "harmony_valor"
        };

        if (categoryDisplay) {
            const mascotId = categoryMascotMap[question.category];
            let mascotHtml = '';

            if (mascotId) {
                // Find character config
                const charConfig = gameState.config.characters.find(c => c.id === mascotId);
                if (charConfig) {
                    mascotHtml = `<img src="${charConfig.imagePath}" class="category-mascot" alt="${charConfig.name}">`;
                }
            }

            categoryDisplay.innerHTML = `${mascotHtml} ${question.categoryIcon} ${question.category}`;
        }

        // Handle media
        this.displayQuestionMedia(question);

        // Render answers
        this.renderAnswers(question);

        // Hide feedback
        const feedbackContainer = document.getElementById('feedback-container');
        feedbackContainer.classList.add('hidden');
        feedbackContainer.classList.remove('correct', 'wrong');
    },

    /**
     * Display question media if present
     * @param {Object} question - The question object
     */
    displayQuestionMedia(question) {
        const mediaContainer = document.getElementById('media-container');
        const questionImage = document.getElementById('question-image');
        const questionAudio = document.getElementById('question-audio');
        const questionVideo = document.getElementById('question-video');

        // Hide all media elements
        mediaContainer.classList.add('hidden');
        questionImage.classList.add('hidden');
        questionAudio.classList.add('hidden');
        questionVideo.classList.add('hidden');

        // Determine audio state
        let shouldDuck = false;

        if (question.media) {
            // Show image if present
            if (question.media.image) {
                questionImage.src = question.media.image;
                questionImage.classList.remove('hidden');
                mediaContainer.classList.remove('hidden');
            }

            // Show audio if present
            if (question.media.audio) {
                questionAudio.src = question.media.audio;
                questionAudio.classList.remove('hidden');
                mediaContainer.classList.remove('hidden');
                questionAudio.onended = () => { if (window.audioManager) window.audioManager.fadeInResume(); };
                shouldDuck = true;
            }

            // Show video if present
            if (question.media.video) {
                questionVideo.src = question.media.video;
                questionVideo.classList.remove('hidden');
                mediaContainer.classList.remove('hidden');
                questionVideo.onended = () => { if (window.audioManager) window.audioManager.fadeInResume(); };
                shouldDuck = true;
            }
        }

        // Handle Background Audio Logic (Always run this)
        if (window.audioManager) {
            if (shouldDuck) {
                window.audioManager.fadeOutPause();
            } else {
                window.audioManager.fadeInResume();
            }
        }
    },

    /**
     * Render answer buttons
     * @param {Object} question - The question object
     */
    renderAnswers(question) {
        const grid = document.getElementById('answers-grid');

        grid.innerHTML = question.answers.map((answer, index) => `
            <button class="answer-btn" data-index="${index}" onclick="game.submitAnswer(${index})">
                ${answer}
            </button>
        `).join('');
    },

    /**
     * Submit an answer
     * @param {number} answerIndex - Index of the selected answer
     */
    submitAnswer(answerIndex) {
        if (gameState.isAnswering) return;
        gameState.isAnswering = true;

        const question = gameState.questions[gameState.currentQuestionIndex];
        const isCorrect = answerIndex === question.correctIndex;
        const isFirstTry = gameState.currentQuestionAttempts === 0;

        // Style the selected button
        const buttons = document.querySelectorAll('.answer-btn');
        buttons.forEach((btn, index) => {
            if (index === answerIndex) {
                btn.classList.add(isCorrect ? 'correct' : 'wrong');
            }
            btn.disabled = true;
        });

        // Show feedback
        const feedbackContainer = document.getElementById('feedback-container');
        const feedbackText = document.getElementById('feedback-text');

        feedbackContainer.classList.remove('hidden', 'correct', 'wrong');
        feedbackContainer.classList.add(isCorrect ? 'correct' : 'wrong');
        feedbackText.classList.remove('correct', 'wrong');
        feedbackText.classList.add(isCorrect ? 'correct' : 'wrong');

        if (isCorrect) {
            gameState.correctAnswers++;
            gameState.consecutiveWrong = 0; // Reset streak

            // Track first-try bonus
            if (isFirstTry) {
                gameState.firstTryCorrect++;
                feedbackText.textContent = 'Perfect! First try bonus! The light grows stronger...';
            } else {
                feedbackText.textContent = 'Correct! The light grows stronger...';
            }

            this.updateScoreDisplay();

            // Check for story segment or advance
            setTimeout(() => {
                const storySegment = gameState.storyBetweenQuestions[gameState.currentQuestionIndex];
                if (storySegment) {
                    if (typeof storySegment === 'string') {
                        this.showStoryProgression({ storyProgression: storySegment });
                    } else {
                        // It's an object with text and image
                        this.showStoryProgression({
                            storyProgression: storySegment.text,
                            progressionImage: storySegment.image
                        });
                    }
                } else if (question.storyProgression) {
                    this.showStoryProgression(question);
                } else {
                    this.advanceQuestion();
                }
            }, 1500);
        } else {
            // Wrong answer - check penalty
            gameState.currentQuestionAttempts++;
            gameState.wrongAttempts++;
            gameState.consecutiveWrong++;

            const penaltyMessage = gameState.currentQuestionAttempts === 1
                ? 'The shadows grow stronger... Try again! (-1 penalty)'
                : `The shadows deepen... Attempt ${gameState.currentQuestionAttempts + 1}`;

            feedbackText.textContent = penaltyMessage;
            this.updateScoreDisplay();

            // Re-enable buttons for retry
            setTimeout(() => {
                buttons.forEach(btn => {
                    btn.classList.remove('wrong');
                    btn.disabled = false;
                });
                feedbackContainer.classList.add('hidden');

                // Check if penalty should trigger (every 2 consecutive wrong)
                if (gameState.consecutiveWrong > 0 && gameState.consecutiveWrong % 2 === 0) {
                    this.showPenalty();
                } else {
                    gameState.isAnswering = false;
                }
            }, 1500);
        }
    },

    showPenalty() {
        const modal = document.getElementById('penalty-modal');
        const text = document.getElementById('penalty-text');

        // Pick random penalty
        const penalty = this.penalties[Math.floor(Math.random() * this.penalties.length)];
        text.textContent = penalty;

        modal.classList.remove('hidden');

        // Optional: Play alert sound if audio manager exists?
        // if (window.audioManager) window.audioManager.playEffect('alert'); 
    },

    closePenalty() {
        const modal = document.getElementById('penalty-modal');
        modal.classList.add('hidden');
        gameState.isAnswering = false; // Allow answering again
    },

    /**
     * Show story progression after correct answer
     * @param {Object} question - The question with story progression
     */
    showStoryProgression(data) {
        const modal = document.getElementById('story-progression');
        const modalText = document.getElementById('progression-text');
        const modalImage = document.getElementById('progression-image');

        // Show text
        modalText.textContent = data.storyProgression;

        // Show image if available
        if (data.progressionImage) {
            modalImage.src = data.progressionImage;
            modalImage.classList.remove('hidden');

            // Dynamic Background: Match the story image
            // Store background for later application (after user clicks Continue)
            gameState.pendingBackground = `url('${data.progressionImage}')`;

            // Keep background dark/clean for text readability during story
            document.body.style.backgroundImage = 'none';
            document.body.style.backgroundColor = 'var(--deep-space)'; // Use theme color

            // Dynamic Music: Switch track based on Act index
            // We need to know which Act this is. 
            // We can infer it from the image filename or by passing the index.
            // Simplified approach: Cycle through tracks based on currentQuestionIndex
            const trackIndex = Math.floor(gameState.currentQuestionIndex / (gameState.totalQuestions / 10)) % 8;
            if (this.audioManager && this.audioManager.currentTrackIndex !== trackIndex) {
                this.audioManager.loadTrack(trackIndex);
            }

        } else {
            modalImage.classList.add('hidden');
        }

        // Use standard screen switching to ensure other screens are hidden
        this.showScreen('story-progression');

        // Play sound effect
        if (this.audioManager) {
            this.audioManager.playSound('correct');
        }
    },

    /**
     * Continue after viewing story progression
     */
    continueAfterStory() {
        // Apply the new background image now that we are moving to the question
        if (gameState.pendingBackground) {
            document.body.style.backgroundImage = gameState.pendingBackground;
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundPosition = 'center top';
            document.body.style.backgroundRepeat = 'no-repeat';
            document.body.style.backgroundAttachment = 'fixed';
            document.body.style.transition = 'background-image 1s ease-in-out';
            gameState.pendingBackground = null; // Clear it
        }

        if (gameState.isReplay) {
            this.nextReplaySlide();
        } else {
            this.advanceQuestion();
        }
    },

    /**
     * Advance to the next question
     */
    advanceQuestion() {
        gameState.currentQuestionIndex++;
        this.updateProgressBar();

        if (gameState.currentQuestionIndex >= gameState.totalQuestions) {
            this.showVictory();
        } else {
            this.showScreen('question-screen');
            this.displayCurrentQuestion();
        }
    },

    /**
     * Show the victory screen
     */
    showVictory() {
        const victoryScore = document.getElementById('victory-score');
        const percentage = Math.round((gameState.firstTryCorrect / gameState.totalQuestions) * 100);

        let rating = '';
        if (percentage >= 90) rating = 'LEGENDARY CHAMPION';
        else if (percentage >= 75) rating = 'Master of Trivia';
        else if (percentage >= 50) rating = 'Worthy Adventurer';
        else rating = 'Brave Challenger';

        victoryScore.innerHTML = `
            <div class="final-stats">
                <div class="stat-row">
                    <span class="stat-label">First Try Correct:</span>
                    <span class="stat-value">${gameState.firstTryCorrect}/${gameState.totalQuestions}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Accuracy:</span>
                    <span class="stat-value">${percentage}%</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Wrong Attempts:</span>
                    <span class="stat-value penalty">${gameState.wrongAttempts}</span>
                </div>
                <div class="rating">${rating}</div>
            </div>
        `;

        this.updateProgressBar(); // Show 100%

        // Victory Visuals
        document.body.style.backgroundImage = 'none';
        document.body.style.backgroundColor = 'black';

        this.showScreen('victory-screen');
        this.createConfetti();
    },

    createConfetti() {
        const colors = ['#f72585', '#4361ee', '#39ff14', '#ffd700'];
        const confettiCount = 100;

        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.style.position = 'fixed';
            confetti.style.width = '10px';
            confetti.style.height = '10px';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.top = '-10px';
            confetti.style.animation = `fall ${Math.random() * 3 + 2}s linear infinite`;
            confetti.style.opacity = Math.random();
            confetti.style.transform = `rotate(${Math.random() * 360}deg)`;

            document.body.appendChild(confetti);

            // Cleanup
            setTimeout(() => confetti.remove(), 5000);
        }
    },

    /**
     * Start Story Replay Mode
     */
    startStoryReplay() {
        gameState.isReplay = true;
        gameState.replayIndex = 0;
        gameState.replayPlaylist = [];

        // 1. Intro
        gameState.replayPlaylist.push({
            storyProgression: storySegments.intro.join(' '),
            progressionImage: "assets/story/intro.png"
        });

        // 2. Acts 1-9
        // Re-create the mapping used in assignStorySegments
        const actImages = [
            "assets/story/The Neon Gateway.png",
            "assets/story/The Forest of Whispers.png",
            "assets/story/The Forgotten Library.png",
            "assets/story/The Echoing Caverns.png",
            "assets/story/The Crystal Bridge.png",
            "assets/story/The Tower of Riddles.png",
            "assets/story/The Shadow Citadel.png",
            "assets/story/The Inner Sanctum.png",
            "assets/story/The Final Truth.png"
        ];

        // We need 1 story segment per act. In game it picks random. Here we pick first.
        // storySegments.progression has 3 lines per act * 9 acts = 27 lines.
        // We want the text for each act.
        // Actually, let's just use the first line of each Act block for simplicity
        // or join the 3 lines? The game picks ONE line.
        // Let's pick the first line of each Act group (index 0, 3, 6...)

        for (let i = 0; i < 9; i++) {
            const textIndex = i * 3;
            // Join the 3 lines for full context? Or just the first?
            // User wanted "Replay Story", maybe full text is better?
            // But game only shows one line.
            // Let's show the first line to be safe/consistent.
            // Or join them. Let's join them for a "Full Story" feel.
            const actText = storySegments.progression.slice(textIndex, textIndex + 1).join(' ');

            gameState.replayPlaylist.push({
                storyProgression: actText,
                progressionImage: actImages[i]
            });
        }

        // 3. Victory
        gameState.replayPlaylist.push({
            storyProgression: storySegments.victory.join(' '),
            progressionImage: "assets/story/Victory Screen.png"
        });

        // Start
        this.showStoryProgression(gameState.replayPlaylist[0]);
    },

    /**
     * Advance Replay
     */
    nextReplaySlide() {
        gameState.replayIndex++;
        if (gameState.replayIndex < gameState.replayPlaylist.length) {
            this.showStoryProgression(gameState.replayPlaylist[gameState.replayIndex]);
        } else {
            // End of replay
            gameState.isReplay = false;
            this.showVictory();
        }
    },

    /**
     * Restart the game
     */
    restartGame() {
        // Reset state
        gameState.selectedCharacter = null;
        gameState.totalQuestions = 0;
        gameState.currentQuestionIndex = 0;
        gameState.correctAnswers = 0;
        gameState.firstTryCorrect = 0;
        gameState.wrongAttempts = 0;
        gameState.currentQuestionAttempts = 0;
        gameState.questions = [];
        gameState.storyIntroIndex = 0;
        gameState.isAnswering = false;
        gameState.storyBetweenQuestions = [];

        this.showScreen('title-screen');
    },

    /**
     * Show an error message
     * @param {string} message - Error message to display
     */
    showError(message) {
        const container = document.getElementById('game-container');
        container.innerHTML = `
            <div class="screen-content" style="min-height: 100vh; display: flex; align-items: center; justify-content: center;">
                <div style="text-align: center; color: var(--laser-red);">
                    <h2>Oops!</h2>
                    <p>${message}</p>
                    <button class="btn-neon btn-secondary-neon" onclick="location.reload()">Reload</button>
                </div>
            </div>
        `;
    }
};

// =====================================================
// Initialize on DOM Ready
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
    game.init();
});
