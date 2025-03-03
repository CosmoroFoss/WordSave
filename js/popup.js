import { switchToTab } from '/js/helper.js';

document.addEventListener('DOMContentLoaded', () => {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'contextMenuSaveWord') {
      const word = message.word;
      // Handle the word in your popup UI
      console.log('Word to save from context menu:', word);
      // Update your popup UI accordingly
    }
    
    if (message.action === 'contextMenuLookupWord') {
      const word = message.word;
      // Handle the word in your popup UI
      const wordInput = document.getElementById('wordInput');
      wordInput.value = word;
      // Update your popup UI accordingly
    }
  });

  //document.getElementById('helpButton').addEventListener('click', function() {
  //  switchToTab('/html/welcome.html');
  //});

  document.getElementById('optionsButton').addEventListener('click', function() {
    chrome.runtime.openOptionsPage();
  });

  const saveButton = document.getElementById('saveButton');
  const showListButton = document.getElementById('showListButton');

  searchButton.addEventListener('click', async () => {
    const wordInput = document.getElementById('wordInput');
    const word = wordInput.value;

    chrome.runtime.sendMessage({ 
      action: "lookupWord", 
      word: { word }
    }, (response) => {
      if (response && response.success) {
        const wordData = response.wordData; // Assuming response contains the word data
        const wordDefinition = document.getElementById('wordDefinition');

        if (wordDefinition && wordData) {
          wordDefinition.textContent = wordData; // Insert the word data into the input field
        }
      } else {
        console.error('Failed to create popout window:', response.error);
      }
    });
  });

  saveButton.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    
    const [{result}] = await chrome.scripting.executeScript({
      target: {tabId: tab.id},
      function: () => window.getSelection().toString().trim()
    });

    if (result) {
      try {
        const storage = await chrome.storage.local.get('words');
        const words = storage.words || [];
        words.push(result);
        await chrome.storage.local.set({ words: words });
        // Word saved
      } catch (err) {
        console.error('Error saving word:', err);
      }
    }
  });

  showListButton.addEventListener('click', () => {
    switchToTab('/html/list.html');
  });

  document.getElementById("popout").addEventListener("click", async () => {
    const word = document.getElementById('wordInput').value;

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

    chrome.windows.getCurrent((popupWindow) => {
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

      window.close();
      /*, (response) => {
        if (response && response.success) {
          console.log('Popout window created successfully');
          window.close(); // Close the popup after creating the window
        } else {
          console.error('Failed to create popout window:', response.error);
        }
      });*/
    });
  });

});