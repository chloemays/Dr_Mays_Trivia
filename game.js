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
        "In the neon-lit kingdom of Trivia, darkness stirs...",
        "A great shadow known as the Shadow of Ignorance has begun to consume the land.",
        "Ancient knowledge fades. The light of wisdom grows dim.",
        "But a prophecy speaks of a chosen hero who will rise...",
        "One who can channel the power of Doctor Mays to vanquish the darkness.",
        "That hero is YOU."
    ],
    progression: [
        // Act 1 - The Neon Gateway (10%)
        "You stand before the Neon Gateway, humming with synthwave energy.",
        "The path ahead is paved with grid lines of pure light.",
        "Your first steps echo through the digital void.",

        // Act 2 - The Forest of Whispers (20%)
        "Trees of fiber optic cables sway in a virtual breeze.",
        "Cyber-owls hoot binary code from the branches.",
        "The shadows lengthen, but your knowledge lights the way.",

        // Act 3 - The Forgotten Library (30%)
        "You enter the Forgotten Library, its halls echoing with lost knowledge.",
        "The tomes whisper secrets waiting to be rediscovered.",
        "Your wisdom grows stronger with each truth you speak.",

        // Act 4 - The Echoing Caverns (40%)
        "You descend into the Echoing Caverns, crystals pulsing with forgotten power.",
        "Ancient riddles carved into the walls test your resolve.",
        "The shadows retreat as your knowledge illuminates the path.",

        // Act 5 - The Crystal Bridge (50%)
        "A bridge of pure light forms before you, spanning an impossible chasm.",
        "Each step resonates with the truths you've spoken.",
        "Doctor Mays' spirit walks beside you, guiding your path.",

        // Act 6 - The Tower of Riddles (60%)
        "A spiraling tower pierces the violet sky.",
        "Stairs construct themselves from your correct answers.",
        "The higher you climb, the clearer the truth becomes.",

        // Act 7 - The Shadow Citadel (70%)
        "The Shadow Citadel looms above, crackling with dark energy.",
        "The gates recognize your wisdom and slowly creak open.",
        "The Shadow of Ignorance knows its end approaches.",

        // Act 8 - The Inner Sanctum (80%)
        "You breach the inner sanctum, where logic twists and turns.",
        "Illusions dance around you, but facts cut through them like a sword.",
        "You are close now. The core of knowledge beats loudly.",

        // Act 9 - The Final Truth (90%)
        "You confront the Shadow of Ignorance in its final form.",
        "It throws chaos and confusion, but your mind remains clear.",
        "Victory is within reach. One final truth remains."
    ],
    victory: [
        "The Shadow of Ignorance shatters into a thousand fading wisps!",
        "Light returns to the kingdom of Trivia!",
        "Doctor Mays' knowledge lives on through you, champion!"
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
            if (window.audioManager) await window.audioManager.init();
            this.showScreen('title-screen');
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
    },

    /**
     * Show character selection screen
     */
    showCharacterSelect() {
        this.renderCharacterGrid();
        this.showScreen('character-select');
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

        // Map 9 key milestones (10% to 90%)
        const milestones = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];

        milestones.forEach((percent, index) => {
            const questionIndex = Math.floor(total * percent) - 1;

            // Ensure valid index and we have a story for this act
            if (questionIndex >= 0 && questionIndex < total - 1 && index < progressionStories.length) {
                // If there's already a story there (collision due to small question count), append or move?
                // For simplicity, just overwrite - later acts take precedence if they collide closely
                // But better to just find the nearest empty slot?
                // Actually, let's just place them at exact calculated spots.

                // Pick a random line from the 3 available for this act
                // So Act index 'i' (0-8) corresponds to story indices i*3 to i*3+2.
                const storyBaseIndex = index * 3;
                const randomOffset = Math.floor(Math.random() * 3);
                const finalStoryIndex = Math.min(storyBaseIndex + randomOffset, progressionStories.length - 1);

                gameState.storyBetweenQuestions[questionIndex] = progressionStories[finalStoryIndex];
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

        // Make background fully black for dramatic effect
        storyScreen.style.background = '#000';
        storyText.style.opacity = '0';
        continueBtn.style.display = 'none';

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
        if (categoryDisplay) {
            categoryDisplay.textContent = `${question.categoryIcon} ${question.category}`;
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
                    this.showStoryProgression({ storyProgression: storySegment });
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
    showStoryProgression(question) {
        const progressionImage = document.getElementById('progression-image');
        const progressionText = document.getElementById('progression-text');

        if (question.progressionImage) {
            progressionImage.src = question.progressionImage;
            progressionImage.classList.remove('hidden');
        } else {
            progressionImage.classList.add('hidden');
        }

        progressionText.textContent = question.storyProgression;
        this.showScreen('story-progression');
    },

    /**
     * Continue after viewing story progression
     */
    continueAfterStory() {
        this.advanceQuestion();
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
        this.showScreen('victory-screen');
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
