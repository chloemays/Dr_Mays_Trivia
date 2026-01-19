/**
 * visualEffects.js
 * Handles visual flair like floating background emojis for specific game screens.
 */

const VisualEffects = {
    intervalId: null,
    activeSet: [],

    // Emoji sets for different contexts
    emojiSets: {
        music: ['🎵', '🎶', '🎹', '🎸', '🎷', '🥁', '🎼', '📻', '🎤', '🎲', '❓'], // Title Screen
        party: ['🎂', '🎁', '🎈', '🎉', '🥳', '🕯️', '🍰', '🧁', '👑', '✨'], // Birthday Splash
        hero: ['⚔️', '🛡️', '🧙', '🧝', '🧛', '🧟', '🧚', '🐉', '🔮', '📜']   // Character Select
    },

    /**
     * Start floating emojis for a specific context
     * @param {string} type - 'music', 'party', or 'hero'
     */
    startFloatingEmojis(type) {
        // Stop any existing effects first
        this.stopFloatingEmojis();

        const set = this.emojiSets[type] || this.emojiSets.music;
        this.activeSet = set;

        // Create initial batch
        for (let i = 0; i < 15; i++) {
            this.createEmoji(set);
        }

        // Start interval to create more
        this.intervalId = setInterval(() => {
            this.createEmoji(set);
        }, 800); // New emoji every 800ms
    },

    /**
     * Stop all floating emoji effects
     */
    stopFloatingEmojis() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        // Remove all existing emoji elements
        const emojis = document.querySelectorAll('.bg-emoji');
        emojis.forEach(el => el.remove());
    },

    /**
     * Create a single floating emoji element
     * @param {Array} set - Array of emojis to choose from
     */
    createEmoji(set) {
        const emojiChar = set[Math.floor(Math.random() * set.length)];
        const emoji = document.createElement('div');

        emoji.classList.add('bg-emoji');
        emoji.textContent = emojiChar;

        // Random positioning and sizing
        const startLeft = Math.random() * 100; // 0-100% width
        const size = Math.random() * 2 + 1; // 1rem to 3rem
        const duration = Math.random() * 10 + 10; // 10-20s float time
        const delay = Math.random() * 5; // 0-5s delay

        emoji.style.left = `${startLeft}vw`;
        emoji.style.fontSize = `${size}rem`;
        emoji.style.animationDuration = `${duration}s`;
        emoji.style.animationDelay = `-${delay}s`; // Negative delay to start mid-animation

        document.body.appendChild(emoji);

        // Remove after animation completes to prevent DOM clutter
        setTimeout(() => {
            emoji.remove();
        }, duration * 1000);
    }
};

// Expose to global scope
window.VisualEffects = VisualEffects;
