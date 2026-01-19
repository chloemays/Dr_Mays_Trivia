/**
 * Audio Manager using Howler.js or Vanilla Audio
 * Handles background music loop, playlist management, and UI controls.
 */

class AudioManager {
    constructor() {
        this.tracks = [];
        this.currentTrackIndex = 0;
        this.isPlaying = false;
        this.volume = 0.5;
        this.loopMode = 'all'; // 'all', 'one', 'none'
        this.audioElement = new Audio();
        this.audioElement.volume = this.volume;
        this.isSeeking = false;

        // Bind events
        this.audioElement.addEventListener('ended', () => this.handleTrackEnd());
        this.audioElement.addEventListener('timeupdate', () => this.updateProgress());
        this.audioElement.addEventListener('loadedmetadata', () => {
            if (this.ui.progressBar) this.ui.progressBar.max = this.audioElement.duration;
        });

        // UI Elements
        this.ui = {
            playPauseBtn: null,
            prevBtn: null,
            nextBtn: null,
            loopBtn: null,
            volumeSlider: null,
            trackInfo: null
        };
    }

    async init() {
        try {
            const response = await fetch('assets/config/audio_manifest.json');
            const data = await response.json();
            this.tracks = data.tracks;

            this.setupUI();

            if (this.tracks.length > 0) {
                this.loadTrack(0, false); // Load first track but don't play yet
            }

            console.log('Audio Manager Initialized with ' + this.tracks.length + ' tracks');
        } catch (error) {
            console.error('Failed to load audio manifest:', error);
        }
    }

    setupUI() {
        this.ui.playPauseBtn = document.getElementById('audio-play-pause');
        this.ui.prevBtn = document.getElementById('audio-prev');
        this.ui.nextBtn = document.getElementById('audio-next');
        this.ui.loopBtn = document.getElementById('audio-loop');
        this.ui.volumeSlider = document.getElementById('audio-volume');
        this.ui.trackInfo = document.getElementById('audio-track-info');

        this.ui.toggleBtn = document.getElementById('audio-toggle-btn');
        this.ui.footer = document.getElementById('audio-player-footer');
        this.ui.progressBar = document.getElementById('audio-progress');

        if (!this.ui.playPauseBtn) return; // UI not in DOM yet

        this.ui.playPauseBtn.onclick = () => this.togglePlay();
        this.ui.prevBtn.onclick = () => this.prevTrack();
        this.ui.nextBtn.onclick = () => this.nextTrack();
        this.ui.loopBtn.onclick = () => this.toggleLoop();
        this.ui.volumeSlider.oninput = (e) => this.setVolume(e.target.value);

        if (this.ui.progressBar) {
            this.ui.progressBar.addEventListener('input', (e) => {
                this.isSeeking = true;
                this.seek(e.target.value);
            });
            this.ui.progressBar.addEventListener('change', () => {
                this.isSeeking = false;
            });
        }

        if (this.ui.toggleBtn && this.ui.footer) {
            this.ui.toggleBtn.onclick = () => this.toggleUI();
        }

        this.updateUI();
    }

    bindAudioEvents() {
        if (!this.audioElement) return;
        this.audioElement.addEventListener('ended', () => this.handleTrackEnd());
        this.audioElement.addEventListener('timeupdate', () => this.updateProgress());
        this.audioElement.addEventListener('loadedmetadata', () => {
            if (this.ui.progressBar) this.ui.progressBar.max = this.audioElement.duration;
            this.updateUI(); // Update UI after metadata is loaded (e.g., duration for progress bar)
        });
    }

    toggleUI() {
        if (!this.ui.footer) return;
        this.ui.footer.classList.toggle('expanded');
    }

    loadTrack(index, autoPlay = true) {
        if (index < 0 || index >= this.tracks.length) return;

        // Cleanup old audio element
        if (this.audioElement) {
            this.audioElement.pause();
            this.audioElement.src = ""; // Clear src to release resources
            this.audioElement.load(); // Explicitly load empty src
            this.audioElement = null; // Dereference old element
        }

        this.currentTrackIndex = index;
        const track = this.tracks[index];

        // Create new instance
        this.audioElement = new Audio(track.src);
        this.audioElement.volume = this.volume;
        this.bindAudioEvents(); // Re-bind events to new element

        if (this.ui.trackInfo) {
            this.ui.trackInfo.textContent = track.title;
        }

        if (autoPlay) {
            const playPromise = this.audioElement.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    this.isPlaying = true;
                    this.updateUI();
                }).catch(error => {
                });
            }
        }
    }

    play() {
        if (!this.audioElement) return; // Ensure an audio element exists
        // User interaction check not strictly needed if triggered by UI, 
        // but browser might block auto-play on load.
        this.audioElement.play().then(() => {
            this.isPlaying = true;
            this.updateUI();
        }).catch(e => console.log("Audio play blocked (user gesture needed):", e));
    }

    pause() {
        if (!this.audioElement) return; // Ensure an audio element exists
        this.audioElement.pause();
        this.isPlaying = false;
        this.updateUI();
    }

    togglePlay() {
        if (this.isPlaying) this.pause();
        else this.play();
    }

    prevTrack() {
        let newIndex = this.currentTrackIndex - 1;
        if (newIndex < 0) newIndex = this.tracks.length - 1;
        this.loadTrack(newIndex);
    }

    nextTrack() {
        let newIndex = this.currentTrackIndex + 1;
        if (newIndex >= this.tracks.length) newIndex = 0;
        this.loadTrack(newIndex);
    }

    handleTrackEnd() {
        if (this.loopMode === 'one') {
            if (this.audioElement) {
                this.audioElement.currentTime = 0; // Reset to start
                this.audioElement.play();
            }
        } else if (this.loopMode === 'all') {
            this.nextTrack();
        } else {
            this.isPlaying = false;
            this.updateUI();
        }
    }

    toggleLoop() {
        // Cycle: all -> one -> off
        if (this.loopMode === 'all') this.loopMode = 'one';
        else if (this.loopMode === 'one') this.loopMode = 'none';
        else this.loopMode = 'all';

        this.updateUI();
    }

    setVolume(value) {
        this.volume = parseFloat(value);
        if (this.audioElement) this.audioElement.volume = this.volume;
    }

    // Fade out and pause (for conflicting media)
    fadeOutPause() {
        if (!this.isPlaying || !this.audioElement) return;

        const fadeInterval = setInterval(() => {
            if (this.audioElement.volume > 0.05) {
                this.audioElement.volume -= 0.05;
            } else {
                clearInterval(fadeInterval);
                this.pause();
                this.audioElement.volume = this.volume; // Reset to target level for next play
            }
        }, 100);
    }

    // Fade in and resume
    fadeInResume() {
        if (this.isPlaying || !this.audioElement) return;

        this.audioElement.volume = 0;
        this.play();

        const fadeInterval = setInterval(() => {
            if (this.audioElement.volume < this.volume) {
                this.audioElement.volume = Math.min(this.volume, this.audioElement.volume + 0.05);
            } else {
                clearInterval(fadeInterval);
            }
        }, 100);
    }

    updateUI() {
        if (!this.ui.playPauseBtn) return;

        // Update Play/Pause Icon
        this.ui.playPauseBtn.innerHTML = this.isPlaying ? '⏸' : '▶';
        this.ui.playPauseBtn.setAttribute('aria-label', this.isPlaying ? 'Pause Music' : 'Play Music');

        // Update Loop Icon
        const loopIcons = {
            'all': '🔁',
            'one': '🔂',
            'none': '➡️'
        };
        this.ui.loopBtn.innerHTML = loopIcons[this.loopMode];
        this.ui.loopBtn.title = `Loop: ${this.loopMode}`;

        // Update styling for loop to ensure it's white (handled in CSS mostly, but simple chars help)
    }

    updateProgress() {
        if (!this.ui.progressBar || !this.audioElement) return;
        if (this.isSeeking) return;

        this.ui.progressBar.value = this.audioElement.currentTime;
        this.updateProgressBarVisual();
    }

    updateProgressBarVisual() {
        if (!this.ui.progressBar) return;
        const percent = (this.ui.progressBar.value / this.ui.progressBar.max) * 100 || 0;
        this.ui.progressBar.style.background = `linear-gradient(to right, var(--cyan-glow) 0%, var(--cyan-glow) ${percent}%, rgba(84, 19, 136, 0.5) ${percent}%, rgba(84, 19, 136, 0.5) 100%)`;
    }

    seek(time) {
        if (!this.audioElement) return; // Ensure an audio element exists
        const seekTime = parseFloat(time);
        if (isFinite(seekTime)) {
            this.audioElement.currentTime = seekTime;
            this.updateProgressBarVisual();
        }
    }

    playSound(soundName) {
        // Placeholder for SFX
        // console.log(`Playing sound: ${soundName}`);
        // If we have an SFX manager or files, implementation goes here.
        // For now, this prevents the crash.
    }
}

// Export instance
window.audioManager = new AudioManager();
