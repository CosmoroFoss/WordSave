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

            } catch (error) {
                throw("failed to fetch word");
            }
        }
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

    return true;
}

export async function lookupWordAPI(label) {
    await rateLimiter.checkRateLimit();

    const response = await fetchDataWithTimeout(`https://api.dictionaryapi.dev/api/v2/entries/en/${label}`, 3000);
    //await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${label}`);
    const jsonObject = await response.json();

    return jsonObject[0];
}

async function fetchDataWithTimeout(url, timeoutMs) {
    const fetchPromise = fetch(url);
  
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
            reject(new Error(`Request timed out after ${timeoutMs}ms`));
        }, timeoutMs);
    });
  
    const response = await Promise.race([fetchPromise, timeoutPromise]);
  
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
  
    //const data = await response.json();
    return response;
}
 