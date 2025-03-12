import { switchToTab } from './helper.js';
import { welcome } from './background_utils/postinstall.js';
import { createContextMenus } from './background_utils/contextmenus.js';
import { db, DBManager } from './background_utils/dbmanager.js';
import { contextMenuLookupWord, contextMenuSaveWord } from './background_utils/contextmenus.js';
import { createWindow, getRecord, getRecords, addRecordDirectly, deleteRecord, getSettings, lookupWord } from './background_utils/messagehandler.js';
import { saveSelected } from './background_utils/commandhandler.js';
import { saveWordToDB } from './background_utils/wordhandler.js';

var popoutWindowID = -1;
let dbManager;

// Initialize once when extension starts
async function init() {
    dbManager = new DBManager();
    await dbManager.init();
}
init();

/* runtime */
chrome.runtime.onInstalled.addListener(function(details) {
  welcome(details);
  createContextMenus();
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const { action, params } = request;

  if (request.action === 'getRecord') {
    getRecord(dbManager, sendResponse, params)
    .then(response => sendResponse(response));
  }

  if (request.action === 'getRecords') {
    getRecords(dbManager)
    .then(response => sendResponse(response));
  }
  
  if (action === 'addRecordDirectly') {  
    addRecordDirectly(dbManager, sendResponse, params, db)
    .then(response => sendResponse(response));
  }
  
  if (action === 'deleteRecord') {
    deleteRecord(dbManager, sendResponse, params)
    .then(response => sendResponse(response));
  }

  if (action === 'getSettings') {
    getSettings(sendResponse)
    .then(response => sendResponse(response));
  }

  if (action == "lookupWord") {
    lookupWord(dbManager, sendResponse, params.word)
    .then(response => sendResponse(response))
  }

  if (action == "saveWordToDB") {
    saveWordToDB(db, params.word, dbManager)
  }
  
  if (action === "createWindow") {
    createWindow(request, popoutWindowID, sendResponse);
  }

  return true;
});

/* context menus */
chrome.contextMenus.onClicked.addListener((info, tab) => {
  const selectedText = info.selectionText.trim();
  
  if (selectedText) {
    if (info.menuItemId === 'lookupWord') {
      contextMenuLookupWord(selectedText, popoutWindowID, tab, db, dbManager);
    }
    else if (info.menuItemId === 'saveWord') {
      contextMenuSaveWord(selectedText, db, dbManager);
    }
  }
});

/* commands */
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "save-selected") {
    saveSelected(db, dbManager);
  }
  else if (command === "show-list") {
    switchToTab('/html/list.html');
  }
  else if (command === "show-options") {
    switchToTab('/html/options.html');
  }
});

/*
chrome.windows.onFocusChanged.addListener((windowId) => {
	if (windowId === chrome.windows.WINDOW_ID_NONE) {
	  // No window is focused
	  return;
	}
  
	// Get the undocked window by ID (you need to store this ID when creating the window)
	chrome.windows.get(windowId, (window) => {
	  if (window.type === "popup") {
		// Focus the undocked window
		chrome.windows.update(windowId, { focused: true });
	  }
	});
});*/