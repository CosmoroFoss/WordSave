document.addEventListener('DOMContentLoaded', async () => {
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
});