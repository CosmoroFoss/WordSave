document.addEventListener('DOMContentLoaded', () => {
	chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	  if (message.action === 'contextMenuSaveWord') {
		const word = message.word;
		// Handle the word in your popup UI
		console.log('Word to save from context menu:', word);
		// Update your popup UI accordingly
	  }
	  
	  if (message.action === 'contextMenuLookupWordOnPopout') {
		const word = message.word;
		// Handle the word in your popup UI
		const wordInput = document.getElementById('wordInput');
		wordInput.value = word;
		// Update your popup UI accordingly
	  }
	});

});