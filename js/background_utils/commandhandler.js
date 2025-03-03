import { saveWord, getSelectedText } from "./wordhandler";

export async function saveSelected(db, dbManager) {
	// Attempting to save selected text
	const selectedText = await getSelectedText();

	if (selectedText) {
		await saveWord(db, selectedText, dbManager);
	} else {
		chrome.notifications.create({
		type: 'basic',
		iconUrl: chrome.runtime.getURL('../assets/images/wordsave_book_logo128.png'),
		title: 'No Text Selected',
		message: 'Please select some text to save'
		});
	}
}