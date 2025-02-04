import { switchToTab } from '/js/helper.js';

class APIRateLimiter {
  constructor(requestsPerMinute) {
      this.requestsPerMinute = requestsPerMinute;
      this.requests = [];
  }

  async checkRateLimit() {
      const now = Date.now();
      // Remove requests older than 1 minute
      this.requests = this.requests.filter(time => now - time < 60000);
      
      if (this.requests.length >= this.requestsPerMinute) {
          const oldestRequest = this.requests[0];
          const waitTime = 60000 - (now - oldestRequest);
          if (waitTime > 0) {
              await new Promise(resolve => setTimeout(resolve, waitTime));
          }
      }
      
      this.requests.push(now);
  }
}

const rateLimiter = new APIRateLimiter(30);
let db;

class DBManager {
  constructor() {
      this.db = null;
      this.DB_NAME = 'WordSaveDB';
      this.DB_VERSION = 1;
      this.STORE_NAME = 'wordRecords';
  }

  // Open database connection
  async init() {
      return new Promise((resolve, reject) => {
          const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

          request.onerror = () => reject(request.error);

          request.onsuccess = (event) => {
            db = event.target.result;
            resolve(request.result);
          }

          // Create object store when database is first created
          request.onupgradeneeded = (event) => {
              const db = event.target.result;

              if (!db.objectStoreNames.contains(this.STORE_NAME)) {
                const objectStore = db.createObjectStore(this.STORE_NAME, { keyPath: 'id', autoIncrement: true });

                // too hard
                objectStore.createIndex("uniqueWordIndex", "word", { unique: true });
              }
          };
      });
  }

  async addRecord(db, word, data, lang, apiurl) {
    if (!db) return;

      const record = {
      timestamp: new Date().toISOString(),
      word : word,
      APIdata: data, // Serialize complex object to string
      lang: lang,
      APIurl: apiurl
      };
      
      let isResolved = false;
      const transaction = db.transaction([this.STORE_NAME], 'readwrite');
      if (transaction.active) {

      }

      transaction.oncomplete = (event) => {
        if (!isResolved) {
          isResolved = true;
        }
      };

      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.add(record);
      
      request.onerror = () => {
        if (!isResolved) {
          isResolved = true;
          reject(request.error);
        }
      };
  }

  // Delete a record
  async deleteRecord(word) {
      return new Promise((resolve, reject) => {
          const transaction = db.transaction([this.STORE_NAME], 'readwrite');
          const store = transaction.objectStore(this.STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const record = request.result.find(r => 
        r.word === word
      );

      store.delete(record.id);
      switchToTab('/html/list.html');
    };
    request.onerror = () => reject(request.error);
      });
  }

  async getRecord(word) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([this.STORE_NAME], 'readonly');
    const store = transaction.objectStore(this.STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const record = request.result.find(r => 
        r.word === word
      );
      resolve(record || null);
    };
    request.onerror = () => reject(request.error);
  });
}

  // Get all records
  async getAllRecords() {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.STORE_NAME], 'readonly');
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {

          const records = request.result.map(record => {
            try {
              return {
                ...record,
                APIdata: JSON.parse(record.APIdata)
              };
            } catch (error) {
              console.error('Parsing error:', error);
              return record; // Return unchanged if parsing fails
            }
          });
          
          resolve(records);
        };

        request.onerror = () => reject(request.error);
      });
  }
}

let dbManager;

// Initialize once when extension starts
async function init() {
    dbManager = new DBManager();
    await dbManager.init();
}
init();

chrome.action.onClicked.addListener((tab) => {
  // Extension clicked in tab
  switchToTab('/html/list.html');
});

chrome.runtime.onInstalled.addListener(function(details) {
  if (details.reason === "install") {
    switchToTab('/html/welcome.html');
  }
});

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
  }

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
          const id = dbManager.addRecord(db, word, data, lang, apiurl);

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

let adding = false;
  
chrome.commands.onCommand.addListener(async (command) => {
  // Command received
  
  if (command === "save-selected" && adding === false) {  // Changed from "save-word" to "save-selected"
    adding = true;

      try {
        // Attempting to save selected text
        const selectedText = await getSelectedText();
        
        if (selectedText) {
          await saveWord(db, selectedText);
        } else {
          chrome.notifications.create({
            type: 'basic',
            iconUrl: chrome.runtime.getURL('../assets/images/wordsave_book_logo128.png'),
            title: 'No Text Selected',
            message: 'Please select some text to save'
          });
        }
      }
      finally {
        adding = false;
      }

  }
  else if (command === "show-list") {
    switchToTab('/html/list.html');
  }
  else if (command === "show-options") {
    switchToTab('/html/options.html');
  }
});