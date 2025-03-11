import { checkWindowExistence } from "./windowhandler.js";
import { lookupWord } from "./messagehandler.js";

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

export async function contextMenuLookupWord(selectedText, popoutWindowID, tab, db, dbManager) {
	/*chrome.tabs.sendMessage(tab.id, {
		action: 'lookupWord',
		word: selectedText
	})*/
	
	/*chrome.runtime.sendMessage({
		action: 'lookupWord',
		word: selectedText
	}).then(response => console.log(response));*/

	const record = await lookupWord(dbManager, null, selectedText);

	//lookupWord(dbManager, null, selectedText).then(async (record) => {
		// if there is no window, show the popup
		if (!await checkWindowExistence(popoutWindowID)) {
			await chrome.action.openPopup();
			popoutWindowID = -1;

			chrome.runtime.sendMessage({
			action: 'contextMenuLookupWord',
			word: selectedText ,
			wordData: record
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
	//});
}

export async function contextMenuSaveWord(selectedText, db, dbManager) {
	const record = await lookupWord(dbManager, null, selectedText);

	//lookupWord(dbManager, null, selectedText).then(async (record) => {
	// if there is no window, show the popup
	//if (!await checkWindowExistence(popoutWindowID)) {
		await chrome.action.openPopup();
		//popoutWindowID = -1;

		chrome.runtime.sendMessage({
		action: 'contextMenuSaveWord',
		word: selectedText ,
		wordData: record
		});
	}
	
	/*await saveWord(db, selectedText, dbManager).then(() => {

	}).catch(error => {

	});*/