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
    act1: [
        "You enter the Forgotten Library, its halls echoing with lost knowledge.",
        "The tomes whisper secrets waiting to be rediscovered.",
        "Your wisdom grows stronger with each truth you speak."
    ],
    act2: [
        "The Echoing Caverns stretch before you, crystals pulsing with forgotten power.",
        "Ancient riddles carved into the walls test your resolve.",
        "The shadows retreat as your knowledge illuminates the path."
    ],
    act3: [
        "The Shadow Citadel looms above, crackling with dark energy.",
        "This is the final confrontation. The fate of Trivia hangs in the balance.",
        "Only your wisdom can dispel the Shadow of Ignorance forever."
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
            this.showScreen('title-screen');
            console.log('Doctor Mays\' Birthday Quest initialized!');
        } catch (error) {
            console.error('Failed to initialize game:', error);
            this.showError('Failed to load game configuration. Please refresh the page.');
        }
    },

    /**
     * Load game configuration from JSON file
     */
    async loadConfig() {
        const response = await fetch('gameConfig.json');
        if (!response.ok) {
            throw new Error('Failed to load gameConfig.json');
        }
        gameState.config = await response.json();
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

        // Offer options: 5, 10, 15, 20, 25, 30 or max available
        const options = [5, 10, 15, 20, 25, 30].filter(n => n <= totalAvailable);
        if (totalAvailable > 0 && !options.includes(totalAvailable)) {
            options.push(totalAvailable);
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
     */
    assignStorySegments() {
        gameState.storyBetweenQuestions = [];
        const total = gameState.totalQuestions;

        // Distribute story segments throughout the game
        const act1Point = Math.floor(total * 0.25);
        const act2Point = Math.floor(total * 0.50);
        const act3Point = Math.floor(total * 0.75);

        // Assign story at key points
        if (act1Point > 0) {
            gameState.storyBetweenQuestions[act1Point - 1] = storySegments.act1[0];
        }
        if (act2Point > 0) {
            gameState.storyBetweenQuestions[act2Point - 1] = storySegments.act2[0];
        }
        if (act3Point > 0) {
            gameState.storyBetweenQuestions[act3Point - 1] = storySegments.act3[0];
        }
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

        if (!question.media) return;

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
        }

        // Show video if present
        if (question.media.video) {
            questionVideo.src = question.media.video;
            questionVideo.classList.remove('hidden');
            mediaContainer.classList.remove('hidden');
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
            // Wrong answer - penalty
            gameState.currentQuestionAttempts++;
            gameState.wrongAttempts++;

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
                gameState.isAnswering = false;
            }, 1500);
        }
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
