import { switchToTab } from '/js/helper.js';

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('helpButton').addEventListener('click', function() {
      switchToTab('/html/welcome.html');
    });

    document.getElementById('optionsButton').addEventListener('click', function() {
      chrome.runtime.openOptionsPage();
    });

    const saveButton = document.getElementById('saveButton');
    const showListButton = document.getElementById('showListButton');
  
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
  });