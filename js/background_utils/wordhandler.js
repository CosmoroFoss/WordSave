import { APIRateLimiter } from './apiratelimiter.js';

const rateLimiter = new APIRateLimiter(30);

export async function getSelectedText() {
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
  }

export async function saveWord(db, label, dbManager) {
    if (!label) return;

    try {
        // Get the current tab to send messages to content script
        //const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
        
        // Notify content script that save is starting
        //await chrome.tabs.sendMessage(tab.id, {
        //    action: 'wordSaveStarted'
        //});

        const record = await dbManager.getRecord(label);

        if (record === null || record === undefined) {
            const jsonObject = await lookupWordAPI(label);

            if (jsonObject) {
                const word = label;
                const data = JSON.stringify(jsonObject);
                const lang = 'en';
                const apiurl = 'dictionaryapi.dev'

                try {
                    // Add record
                    await dbManager.addRecord(db, word, data, lang, apiurl);
                    
                    // Notify content script that save is complete
                    //await chrome.tabs.sendMessage(tab.id, {
                    //    action: 'wordSaveCompleted'
                    //});

                } catch (error) {
                    console.error('Error:', error);
                }
            }
        }
    } catch (err) {
        /*console.error('Error saving word:', err);
        
        // Error notification
        chrome.notifications.create({
            type: 'basic',
            iconUrl: chrome.runtime.getURL('../assets/images/wordsave_book_logo128.png'),
            title: 'Error',
            message: 'Failed to save word',
            priority: 2
        });*/
    }
}

export async function saveWordToDB(db, label, dbManager) {
    const record = await dbManager.getRecord(label);

    if (record === null || record === undefined) {
        const jsonObject = await lookupWordAPI(label);

        if (jsonObject) {
            const word = label;
            const data = JSON.stringify(jsonObject);
            const lang = 'en';
            const apiurl = 'dictionaryapi.dev'

            // Add record
            await dbManager.addRecord(db, word, data, lang, apiurl);
        }
    }
}

export async function lookupWordAPI(label) {
    await rateLimiter.checkRateLimit();
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${label}`);
    const jsonObject = await response.json();

    return jsonObject[0];
}