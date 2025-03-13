import { switchToTab } from '/js/helper.js';

document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('back-btn').addEventListener('click', async () => {
        switchToTab('/html/list.html');
    });

    const ttsHandler = new TTSHandler();
    await ttsHandler.loadSettings();

    // Initialize controls
    const voiceSelect = document.getElementById('voiceSelect');
    const speedControl = document.getElementById('speedControl');
    const pitchControl = document.getElementById('pitchControl');
    const speedValue = document.getElementById('speedValue');
    const pitchValue = document.getElementById('pitchValue');

    // Set initial values
    speedControl.value = ttsHandler.voiceSettings.rate;
    pitchControl.value = ttsHandler.voiceSettings.pitch;
    speedValue.textContent = ttsHandler.voiceSettings.rate;
    pitchValue.textContent = ttsHandler.voiceSettings.pitch;

    await ttsHandler.populateVoiceSelect(voiceSelect);

    // Add event listeners
    speedControl.addEventListener('input', () => {
        speedValue.textContent = speedControl.value;
    });

    pitchControl.addEventListener('input', () => {
        pitchValue.textContent = pitchControl.value;
    });

    // Save settings
    document.getElementById('saveSettings').addEventListener('click', async () => {
        await ttsHandler.saveSettings(voiceSelect.value, speedControl.value, pitchControl.value);
    });

    const cursorTrackingCheckbox = document.getElementById('cursorTrackingToggle');
    cursorTrackingCheckbox.classList.add('no-transition');

    var settings = await chrome.storage.local.get('controlSettings');
    const controlSettings = settings.hasOwnProperty('controlSettings') ? settings.controlSettings : false;

    cursorTrackingCheckbox.checked = controlSettings;

    // Force a reflow to ensure the no-transition class takes effect
    cursorTrackingCheckbox.offsetHeight;

    // Remove the no-transition class after a brief delay
    setTimeout(() => {
        cursorTrackingCheckbox.classList.remove('no-transition');
    }, 0);

    document.getElementById('cursorTrackingToggle').addEventListener('change', async () => {
        if (cursorTrackingCheckbox.checked) {
            await chrome.storage.local.set({ controlSettings: true });
          } else {
            await chrome.storage.local.set({ controlSettings: false });
          }
          // Cursor Tracker Settings saved
    });

    async function displayCurrentShortcuts() {
        const commands = await chrome.commands.getAll();
        commands.forEach(command => {
            if (command.name === "save-selected") {
                const element = document.getElementById('saveShortcut');
                if (element) {
                    element.textContent = command.shortcut || 'Not set';
                }
            }
            if (command.name === "show-list") {
                const element = document.getElementById('listShortcut');
                if (element) {
                    element.textContent = command.shortcut || 'Not set';
                }
            }
            if (command.name === "show-options") {
                const element = document.getElementById('optionsShortcut');
                if (element) {
                    element.textContent = command.shortcut || 'Not set';
                }
            }
        });

        // Export functionality
        document.getElementById('exportData').addEventListener('click', async () => {
            try {
                // Get all data from storage
                const records = await getRecords();
                
                // Create a blob with the data
                const blob = new Blob([JSON.stringify(records, null, 2)], {
                    type: 'application/json'
                });
                
                // Create download link
                const url = URL.createObjectURL(blob);
                const now = new Date();
                const timestamp = now.toISOString().split('T')[0]; // YYYY-MM-DD format
                
                const a = document.createElement('a');
                a.href = url;
                a.download = `vocabulary-backup-${timestamp}.json`;

                // Trigger download
                document.body.appendChild(a);
                a.click();
                
                // Cleanup
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                //showNotification('Data exported successfully!', 'success');
            } catch (error) {
                console.error('Export failed:', error);
                showNotification('Failed to export data', 'error');
            }
        });

        // Import functionality
        document.getElementById('importFile').addEventListener('change', async (event) => {
            try {
                const file = event.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                
                reader.onload = async (e) => {
                    try {
                        const importedData = JSON.parse(e.target.result);
                        
                        // Validate data structure
                        if (!Array.isArray(importedData)) {
                            throw new Error('Invalid data format');
                        }

                        // Confirm import
                        if (confirm(`Import ${importedData.length} words? This will merge with your existing words.`)) {
                            try {
                                for (const record of importedData) {
                                    await addRecordDirectly(record);
                                }
                            }
                            catch {
                                showNotification(`Failed to import words.`, 'failure');
                            }
                            finally {
                                showNotification(`Imported ${importedData.length} words successfully!`, 'success');
                            }
                        }
                    } catch (error) {
                        console.error('Import failed:', error);
                        showNotification('Failed to import data: Invalid file format', 'error');
                    }
                };

                reader.readAsText(file);
            } catch (error) {
                console.error('Import failed:', error);
                showNotification('Failed to import data', 'error');
            }
            
            // Reset file input
            event.target.value = '';
        });

        // Notification helper function
        function showNotification(message, type = 'info') {
            const notification = document.createElement('div');
            notification.className = `notification ${type}`;
            notification.textContent = message;
            
            document.body.appendChild(notification);
            
            // Remove notification after 3 seconds
            setTimeout(() => {
                notification.classList.add('fade-out');
                setTimeout(() => {
                    document.body.removeChild(notification);
                }, 300);
            }, 3000);
        }
    }

    // Open Chrome shortcuts page
    document.getElementById('openShortcuts').addEventListener('click', async () => {
        try {
            const tabs = await chrome.tabs.query({});

            const existingTab = tabs.find(tab => 
                tab.url.toLowerCase() === 'chrome://extensions/shortcuts'
              );

            if (existingTab) {
                await chrome.tabs.update(existingTab.id, { active: true });
                await chrome.windows.update(existingTab.windowId, { focused: true });
              } else {
                await chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
              }
        }
        catch (error) {
          console.error('Error switching tabs:', error);
        }
    });

    // Display current shortcuts when page loads
    displayCurrentShortcuts();
    });

    async function getRecords() {
        try {
            const response = await chrome.runtime.sendMessage({
                action: 'getRecords'
            });
            if (response.error) {
                throw new Error(response.error);
            }
            return response.records;
        } catch (error) {
            console.error('Error fetching records:', error);
            return null;
        }
    }

    async function addRecordDirectly(record) {
        try {
            const response = await chrome.runtime.sendMessage({
                action: 'addRecordDirectly',
                params: { record : record }
            });
            if (response.error) {
                throw new Error(response.error);
            }
            return response.records;
        } catch (error) {
            console.error('Error fetching records:', error);
            return null;
        }
    }