import { saveWord, getSelectedText } from "./wordhandler.js";

export function saveSelected(db, dbManager) {
	// Attempting to save selected text

	chrome.tabs.query({active: true, currentWindow: true}, async(tabs) => {
		const tabId = tabs[0].id;

		const [{result}] = await chrome.scripting.executeScript({
			target: {tabId: tabId},
			func: () => window.getSelection().toString().trim()
		});

		try{
			await chrome.tabs.sendMessage(tabId, {
				action: 'wordSaveStarted'
			});
	
			await saveWord(db, result, dbManager);
		}
		catch {
			await chrome.tabs.sendMessage(tabId, {
				action: 'wordSaveFailed' // not implemented
			});
		}
		finally {
			await chrome.tabs.sendMessage(tabId, {
				action: 'wordSaveCompleted'
			});
		}


		/*chrome.tabs.sendMessage(tabId, {
			action: 'getSelectedText'
		}).then(async (result) => {
			if (result)
				await saveWord(db, result, dbManager);
			// ... use awaitedResult
		  });*/
	});

	//const selectedText = await getSelectedText();

	//if (selectedText) {
	//	await saveWord(db, selectedText, dbManager);
	//} else {
	/*
		chrome.notifications.create({
		type: 'basic',
		iconUrl: chrome.runtime.getURL('../assets/images/wordsave_book_logo128.png'),
		title: 'No Text Selected',
		message: 'Please select some text to save'
		});*/
	//}
}