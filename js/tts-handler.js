export class TTSHandler {
    voiceSettings;

    constructor() {
        // Load saved settings
    }

    async populateVoiceSelect(voiceSelect) {
        const voices = await new Promise(resolve => chrome.tts.getVoices(resolve));

        voices.forEach(voice => {
            if (voice.lang.startsWith('en')) { // Only English voices
                const option = document.createElement('option');
                option.value = voice.voiceName;
                option.textContent = voice.voiceName;
                if (voice.voiceName === this.voiceSettings.voice)
                    option.selected = true;
                voiceSelect.appendChild(option);
            }
        });
    }

    // Save settings
    async saveSettings(voice, speed, pitch) {
        const newSettings = {
            voice: voice,
            rate: parseFloat(speed),
            pitch: parseFloat(pitch)
        };

        await chrome.storage.local.set({ voiceSettings: newSettings });
    }

    // Load settings
    async loadSettings() {
        const settings = await chrome.storage.local.get('voiceSettings');
        if (settings) {
            this.voiceSettings = settings.voiceSettings || {
                rate: 1.0,
                pitch: 1.0
            };
        }
    }

    speak(text, button) {
        // Stop any current speech
        this.stop();

        chrome.tts.speak(text, {
            lang: 'en-US',
            voiceName: this.voiceSettings.voice,
            rate: this.voiceSettings.rate,
            pitch: this.voiceSettings.pitch,
            onEvent: (event) => {
                if (event.type === 'start') {
                    button.style.color = '#4CAF50'; // Green while speaking
                } else if (event.type === 'end' || event.type === 'error' || event.type === 'cancelled') {
                    button.style.color = '#2196F3'; // Blue when done
                }

                if (event.type === 'error') {
                    console.error('TTS Error:', event);
                }
            }
        });
    }

    stop() {
        chrome.tts.stop();
    }
}
