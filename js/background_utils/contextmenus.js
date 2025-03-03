import { saveWord } from "./wordhandler.js";
import { checkWindowExistence } from "./windowhandler.js";

export function createContextMenus() {
	chrome.contextMenus.create({
		id: 'wordSaveMenu',
		title: 'WordSave',
		contexts: ['selection']
	});

	// Add submenu items
	chrome.contextMenus.create({
		id: 'lookupWord',
		parentId: 'wordSaveMenu',
		title: 'Look up',
		contexts: ['selection']
	});

	chrome.contextMenus.create({
		id: 'saveWord',
		parentId: 'wordSaveMenu',
		title: 'Add to dictionary',
		contexts: ['selection']
	});
}

export async function contextMenuLookupWord(selectedText, popoutWindowID, tab) {
	chrome.tabs.sendMessage(tab.id, {
		action: 'lookupWord',
		word: selectedText
	});
	
	// if there is no window, show the popup
	if (!await checkWindowExistence(popoutWindowID)) {
		chrome.action.openPopup();
		popoutWindowID = -1;

		chrome.runtime.sendMessage({
		action: 'contextMenuLookupWord',
		word: selectedText
		});
	}
	// if there is a popout window, focus it and send it the selected word
	else {
		chrome.windows.update(popoutWindowID, {focused: true});

		chrome.runtime.sendMessage({
		action: 'contextMenuLookupWordOnPopout',
		word: selectedText
		});
	}
}

export async function contextMenuSaveWord(selectedText, db, dbManager) {
	await saveWord(db, selectedText, dbManager).then(() => {
		console.log('Word saved:', selectedText);
	}).catch(error => {
		console.error('Error saving word:', error);
	});
}