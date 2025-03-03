import { switchToTab } from '/js/helper.js';
import { welcome } from './background_utils/postinstall.js';
import { createContextMenus } from './background_utils/contextmenus.js';
import { db, DBManager } from './background_utils/dbmanager.js';
import { contextMenuLookupWord, contextMenuSaveWord } from './background_utils/contextmenus.js';
import { checkWindowExistence } from './background_utils/windowhandler.js';
import { saveSelected } from './background_utils/commandhandler.js';

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
  welcome();
  createContextMenus();
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const { action, params } = request;

  if (request.action === 'getRecord') {
    dbManager.getRecord(params.word)
      .then(record => sendResponse({record}))
      .catch(error => sendResponse({error: error.message}));
    return true;
  }

  if (request.action === 'getRecords') {
    dbManager.getAllRecords()
        .then(records => sendResponse({records}))
        .catch(error => sendResponse({error: error.message}));
    return true; // Important! Keeps the message channel open for async response
  }

  if (action === 'addRecordDirectly') {  
    try {
      const record = params.record;

      const word = record.word;
      const data = JSON.stringify(record.APIdata);
      const lang = 'en';
      const apiurl = 'dictionaryapi.dev'

      // Add record
      dbManager.addRecord(db, word, data, lang, apiurl)
        .then(record => sendResponse({record}))
        .catch(error => sendResponse({error: error.message}));
        return true;

    } catch (error) {
      console.error('Error:', error);
    }
  }
  
  if (action === 'deleteRecord') {
    dbManager.deleteRecord(params.word)
        .then(record => sendResponse({record}))
        .catch(error => sendResponse({error: error.message}));
    return true;
  }

  if (request.action === 'getSettings') {
    chrome.storage.local.get('controlSettings')
        .then(settings => sendResponse(settings))
        .catch(error => sendResponse({ error: error.message }));
    return true;
  }

  // Add other message handlers as needed
});

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  const { action, params } = message;

  if (message.action == "lookupWord") {
    sendResponse({ success: true, wordData: "hello" });
  } else
  if (message.action === "createWindow") {
    var windowExists = await checkWindowExistence(popoutWindowID);

    // Get screen dimensions
    chrome.windows.getCurrent((currentWindow) => {
      const { x, y } = message.position;
      const word = message.searchedWord;

      const screenWidth = currentWindow.width;
      const screenHeight = currentWindow.height;

      // Define popout window dimensions
      const popoutWidth = 400;
      const popoutHeight = 300;

      // Calculate top-right position
      const left = screenWidth - popoutWidth; // Right edge of the screen
      const top = 0; // Top edge of the screen

      // If no ID exists, create new window and save ID
      if(!windowExists) {
      
        // Create the window
        chrome.windows.create({
          url: "html/popout_window.html",
          type: "popup",
          width: popoutWidth,
          height: popoutHeight,
          left: Math.round(x - popoutWidth),
          top: Math.round(y)
        }, (window) => {
          if (window) {
            popoutWindowID = window.id;
            document.getElementById('wordInput').value = word;
            sendResponse({ success: true });
          } else {
            sendResponse({ success: false, error: "Failed to create window" });
          }
        });
      }
      // If ID exists, focus the window
      else {
        chrome.windows.update(popoutWindowID, {focused: true});
      }

    });

    return true; // Keep the message channel open for async response
  }
});

/* context menus */

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  // report to user if the word is already saved, is being saved,
  // got saved successfully or failed to save
  const selectedText = info.selectionText.trim();
  
  if (selectedText) {
    if (info.menuItemId === 'lookupWord') {
      contextMenuLookupWord(selectedText);
    }
    else if (info.menuItemId === 'saveWord') {
      contextMenuSaveWord(selectedText, db, dbManager);
    }
  }
});

/* commands */

chrome.commands.onCommand.addListener(async (command) => {
  if (command === "save-selected") {  // Changed from "save-word" to "save-selected"
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

// *************************************************************************** //

/*
replaced with popup

chrome.action.onClicked.addListener((tab) => {
  // Extension clicked in tab
  switchToTab('/html/list.html');
});*/

/*
async function getSelectedText() {
    try {
      const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
      
      if (!tab || !tab.id || tab.url.startsWith('chrome://')) {
        console.error('Cannot access this page');
        return null;
      }
  
      const [{result}] = await chrome.scripting.executeScript({
        target: {tabId: tab.id},
        func: () => window.getSelection().toString().trim()
      });
      
      return result;

    } catch (error) {
      console.error('Error getting selected text:', error);
      return null;
    }
  }*/

/*
export async function getPhonetic(record) {
  try {
    return record.APIdata.phonetic;

  } catch (error) {
    console.error('Error fetching phonetic:', error);
    return null;
  }
}

export async function getMeaning(record) {
  try {
    return record.APIdata.meanings[0].definitions[0].definition;

  } catch (error) {
      console.error('Error fetching meaning:', error);
      return null;
  }
}

  
async function saveWord(db, label) {
    if (!label) return;

    try {
        // Get the current tab to send messages to content script
        const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
        
        // Notify content script that save is starting
        await chrome.tabs.sendMessage(tab.id, {
            action: 'wordSaveStarted'
        });

        const record = await dbManager.getRecord(label);

        if (record === null || record === undefined) {
            await rateLimiter.checkRateLimit();
            const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${label}`);
            const jsonObject = await response.json();

            if (jsonObject && jsonObject[0]) {
                const word = label;
                const data = JSON.stringify(jsonObject[0]);
                const lang = 'en';
                const apiurl = 'dictionaryapi.dev'

                try {
                    // Add record
                    await dbManager.addRecord(db, word, data, lang, apiurl);
                    
                    // Notify content script that save is complete
                    await chrome.tabs.sendMessage(tab.id, {
                        action: 'wordSaveCompleted'
                    });

                } catch (error) {
                    console.error('Error:', error);
                }
            }
        }
    } catch (err) {
        console.error('Error saving word:', err);
        
        // Error notification
        chrome.notifications.create({
            type: 'basic',
            iconUrl: chrome.runtime.getURL('../assets/images/wordsave_book_logo128.png'),
            title: 'Error',
            message: 'Failed to save word',
            priority: 2
        });
    }
}
*/