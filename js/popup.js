import { switchToTab } from './helper.js';
import { lookupUpdateUI } from './popup_utils/lookup.js';
import { TTSHandler } from './tts-handler.js';

document.addEventListener('DOMContentLoaded', () => {
  const ttsHandler = new TTSHandler();
  ttsHandler.loadSettings();

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'contextMenuSaveWord') {
      const word = message.word;
      // Handle the word in your popup UI
      // Update your popup UI accordingly
    }
    
    if (message.action === 'contextMenuLookupWord') {
      const word = message.word;
      // Handle the word in your popup UI
      const wordInput = document.getElementById('wordInput');
      wordInput.value = word;
      // Update your popup UI accordingly

      const wordData = message.wordData; // Assuming response contains the word data
      
      lookupUpdateUI(wordData, word);
    }

    if (message.action === 'contextMenuSaveWord') {
      const word = message.word;
      // Handle the word in your popup UI
      const wordInput = document.getElementById('wordInput');
      wordInput.value = word;
      // Update your popup UI accordingly

      const wordData = message.wordData; // Assuming response contains the word data
      
      lookupUpdateUI(wordData, word);

      chrome.runtime.sendMessage({ 
        action: "saveWordToDB", 
        params: { word: word }
      });
    }

    return true;
  });

  //document.getElementById('helpButton').addEventListener('click', function() {
  //  switchToTab('/html/welcome.html');
  //});

  document.getElementById('optionsButton').addEventListener('click', function() {
    chrome.runtime.openOptionsPage();
  });

  const searchButton = document.getElementById('searchButton');
  const saveButton = document.getElementById('saveButton');
  const showListButton = document.getElementById('showListButton');

  searchButton.addEventListener('click', async () => {
    const wordInput = document.getElementById('wordInput');
    const word = wordInput.value;

    chrome.runtime.sendMessage({ 
      action: "lookupWord", 
      params: { word: word }
    }, (response) => {
      if (response /*&& response.success*/) {
        lookupUpdateUI(response, word, ttsHandler);
      }
    });
  });

  saveButton.addEventListener('click', async () => {
    const wordInput = document.getElementById('wordInput');
    const word = wordInput.value;

    if (word) {
      chrome.runtime.sendMessage({ 
        action: "saveWordToDB", 
        params: { word: word }
      }, (response) => {
        if (response) {
          const alert = document.getElementById('successAlert');
          alert.classList.remove('hidden');
          
          // Hide alert after 2 seconds
          setTimeout(() => {
            alert.classList.add('hidden');
          }, 2000);
        } else {
          const alert = document.getElementById('errorAlert');
          alert.classList.remove('hidden');
          
          // Hide alert after 2 seconds
          setTimeout(() => {
            alert.classList.add('hidden');
          }, 2000);
        }

      });
    }
  });

  showListButton.addEventListener('click', () => {
    switchToTab('/html/list.html');
  });

  //document.getElementById("popout").addEventListener("click", async () => {
  //  const word = document.getElementById('wordInput').value;

    // Send a message to the background script to create the window
    //chrome.runtime.sendMessage({ action: "createWindow" });
    
    /*
    chrome.runtime.sendMessage({ action: "createWindow" }, (response) => {
      if (response && response.success) {
        console.log('Popout window created successfully');
        window.close(); // Close the popup after creating the window
      } else {
        console.error('Failed to create popout window:', response.error);
      }
    });
    */

    /*chrome.windows.getCurrent((popupWindow) => {
      const { left, top, width } = popupWindow;
  
      // Calculate the top-right corner coordinates
      const topRightX = left + width;
      const topRightY = top;
  
      // Send a message to the background script to create the window
      chrome.runtime.sendMessage({ 
        action: "createWindow", 
        position: { x: topRightX, y: topRightY },
        searchedWord: word
      });

      window.close();*/
      /*, (response) => {
        if (response && response.success) {
          console.log('Popout window created successfully');
          window.close(); // Close the popup after creating the window
        } else {
          console.error('Failed to create popout window:', response.error);
        }
      });*/
    //});
  //});

});