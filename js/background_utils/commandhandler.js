import { saveWord, getSelectedText } from "./wordhandler.js";

export async function saveSelected(db, dbManager) {
	// Attempting to save selected text

	chrome.tabs.query({active: true, currentWindow: true}, async(tabs) => {
		const tabId = tabs[0].id;

		const [{result}] = await chrome.scripting.executeScript({
			target: {tabId: tabId},
			func: () => window.getSelection().toString().trim()
		});

		try {
			chrome.tabs.sendMessage(tabId, {
				action: 'wordSaveStarted'
			});
	
			await saveWord(db, result, dbManager);
		}
		catch {
			chrome.tabs.sendMessage(tabId, {
				action: 'wordSaveFailed'
			});
		}
		finally {
			chrome.tabs.sendMessage(tabId, {
				action: 'wordSaveCompleted'
			});
		}
	});
}