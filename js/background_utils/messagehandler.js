import { checkWindowExistence } from "./windowhandler.js";
import { lookupWordAPI } from "./wordhandler.js";

export async function getRecord(dbManager, sendResponse, params) {
	const record = await dbManager.getRecord(params.word);
	return { record };
}

export async function getRecords(dbManager) {
    try {
        const records = await dbManager.getAllRecords();
        return { records: records };
    } catch (error) {
        return { error: error.message };
    }
}

export async function addRecordDirectly(dbManager, sendResponse, params, db) {
	const record = params.record;

	const word = record.word;
	const data = JSON.stringify(record.APIdata);
	const lang = 'en';
	const apiurl = 'dictionaryapi.dev'

	// Add record
	const r = await dbManager.addRecord(db, word, data, lang, apiurl);

	return { r };
}

export async function deleteRecord(dbManager, sendResponse, params) {
	const record = await dbManager.deleteRecord(params.word)
	return { record };
}

export function getSettings(sendResponse) {
    return chrome.storage.local.get('controlSettings');
}

export async function lookupWord(dbManager, sendResponse, word) {
  return dbManager.getRecord(word).then(async (record) => {
    if (record === null || record === undefined) {
      record = await lookupWordAPI(word);
    }
    else
      record = JSON.parse(record.APIdata)

    return record;
  });
}

export async function createWindow(request, popoutWindowID, sendResponse) {
	var windowExists = await checkWindowExistence(popoutWindowID);

    // Get screen dimensions
    chrome.windows.getCurrent((currentWindow) => {
      const { x, y } = request.position;
      const word = request.searchedWord;

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
            window.tabs[0].document.getElementById('wordInput').value = word;
          }
        });
      }
      // If ID exists, focus the window
      else {
        chrome.windows.update(popoutWindowID, {focused: true});
      }

    });
}