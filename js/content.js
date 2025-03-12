// content.js
function injectTailwind(shadowRoot) {
    // Get your compiled Tailwind CSS
    fetch(chrome.runtime.getURL('./css/tailwind.css'))
      .then(response => response.text())
      .then(css => {
        //const style = document.createElement('style');
        //style.textContent = `
        //    :host, :host div, :host span, :host p, :host ul, :host li {
        //        all: initial; /* Resets only for these elements */
        //    }
        //`;

        const style = document.createElement('style');
        style.textContent = `

            #myExtensionPopup ul {
                font-family: inherit;
                font-size: 0.9em;
                list-style-type: none;
                padding-left: 0;
                margin: 0;
            }
            #myExtensionPopup li {
                font-family: inherit;
                padding: 2px 0;
            }    
            #myExtensionPopup li.wordListItem {
                margin-bottom: 2px;
            }
        `;

        style.textContent = css + style.textContent;
        shadowRoot.appendChild(style);
      });
  }

// Create a singleton popup manager
const PopupManager = {
    shadow: null,
    popup: null,
    currentTarget: null,
    offset: { x: 10, y: 10 },
    
    // Initialize the popup once
    init() {
        if (!this.shadow) {
            const container = document.createElement('div');
            document.body.appendChild(container);
            this.shadow = container.attachShadow({ mode: 'open' });

            //this.popup = document.createElement('div');
            this.popup = document.createElement('div');
            this.popup.id = 'myExtensionPopup';
            //this.popup.className = 'text-black';
            this.popup.style.cssText = `
                font-family: monospace, sans-serif;
                position: fixed;
                display: none;
                color: black;
                background: white;
                border: 1px solid #ccc;
                padding: 10px;
                border-radius: 4px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                z-index: 10000;
                pointer-events: none;
                max-width: 800px;
                max-height: 320px;
                overflow: hidden;
            `;

            this.shadow.appendChild(this.popup);

            injectTailwind(this.shadow);
        }
    },

    // Update popup position
    updatePosition(e) {
        const x = e.clientX + this.offset.x;
        const y = e.clientY + this.offset.y;

        // Prevent popup from going off-screen
        const popupRect = this.popup.getBoundingClientRect();
        const maxX = window.innerWidth - popupRect.width;
        const maxY = window.innerHeight - popupRect.height;

        this.popup.style.left = `${Math.min(x, maxX)}px`;
        this.popup.style.top = `${Math.min(y, maxY)}px`;
    },

    // Show popup with specific content
    show(e, content) {
        this.popup.innerHTML = content;
        this.popup.style.display = 'block';
        this.updatePosition(e);
    },

    showList(e, ul, word, transcription) {
        while (this.popup.firstChild) {
            this.popup.removeChild(this.popup.firstChild);
        }

        const wordElement = document.createElement('div');
        wordElement.textContent = word;
        wordElement.style.cssText = `
            font-size: 1em;
            font-weight: bold;
            margin-bottom: 4px;
            display: block;
        `;
        this.popup.appendChild(wordElement);
        
        if (transcription) {
            const transcriptionElement = document.createElement('div');
            transcriptionElement.textContent = transcription;
            transcriptionElement.style.cssText = `
                font-size: 0.7em;
                font-weight: lighter;
                font-style: italic;
                color: #666;
                margin-bottom: 4px;
                display: block;
            `;
            this.popup.appendChild(transcriptionElement);
        }

        this.popup.appendChild(ul);
        this.popup.style.display = 'block';
        this.updatePosition(e);
    },

    // Hide popup
    hide() {
        this.popup.style.display = 'none';
    },

    // Cleanup
    destroy() {
        if (this.popup) {
            this.popup.remove();
            this.popup = null;
        }
    },

    showLoading: function(e) {
        this.isLoading = true;
        this.wordBeingSaved = this.currentWord;
        const loadingHtml = `
            <div
            class="inline-block h-4 w-4 animate-spin rounded-full border-4 border-solid border-current border-e-transparent align-[-0.125em] text-surface motion-reduce:animate-[spin_1.5s_linear_infinite] dark:text-white"
            role="status">
            <span
                class="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]"
                >Loading...</span
            >
            </div>
        `;
        this.show(e, loadingHtml);
    },

    showFailed: async function(e) {
        const loadingHtml = `
            <span>Error</span>
        `;
        this.show(e, loadingHtml);

        setTimeout(() => {
            PopupManager.hide();
        }, 1000);
    },

    currentWord: null,
    currentEvent: null,

    updateForCurrentWord: async function() {
        if (this.currentWord && this.currentEvent) {
            const response = await chrome.runtime.sendMessage({ 
                action: 'getRecord',
                params: { word: this.currentWord }
            });

            if (response.record) {
                const data = JSON.parse(response.record.APIdata);
                const transcription = data.phonetic;
                const ul = document.createElement('ul');

                for(let i=0; i<4 && i < data.meanings[0].definitions.length; i++) {
                    const li = document.createElement('li');
                    li.textContent = '(' + data.meanings[0].partOfSpeech + ') ' + data.meanings[0].definitions[i].definition;
                    ul.appendChild(li);
                }

                /*data.meanings[0].definitions.forEach(definition => {
                    
                });*/

                this.showList(this.currentEvent, ul, this.currentWord, transcription);
            }
        }
    },

    isLoading: false,
    wordBeingSaved: null
};

PopupManager.init();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'wordSaveStarted') {
        if (PopupManager.currentWord && PopupManager.currentEvent) {
            PopupManager.showLoading(PopupManager.currentEvent);
        }
    } else if (request.action === 'wordSaveFailed') {
        PopupManager.isLoading = false;
        PopupManager.wordBeingSaved = null;
        PopupManager.showFailed(PopupManager.currentEvent);
        //await new Promise(resolve => setTimeout(resolve, waitTime));
    } else if (request.action === 'wordSaveCompleted') {
        PopupManager.isLoading = false;
        PopupManager.wordBeingSaved = null;
        PopupManager.updateForCurrentWord();
    } else if (request.action == 'getSelectedText') {
        //const selection = window.getSelection();
    }
});

// Add this near the top of the file, after PopupManager initialization
window.lastMouseEvent = null;
document.addEventListener('mousemove', (e) => {
    window.lastMouseEvent = e;
});

let mouseDown = false;
document.addEventListener('mousedown', () => {
	mouseDown = true
	//const selection = window.getSelection();
	//selection.empty();
});
document.addEventListener('mouseup', () => mouseDown = false);

document.addEventListener('mousemove', async (event) => {
	const settings = await chrome.storage.local.get('controlSettings');
	const cursorTracking = settings.hasOwnProperty('controlSettings') ? settings.controlSettings : true;

	if (!mouseDown && cursorTracking == true) {
		const x = event.clientX;
		const y = event.clientY;

        const elementUnderCursor = document.elementFromPoint(x, y);
        if (elementUnderCursor) {
            let currentElement = elementUnderCursor;
            while (currentElement) {
                const style = window.getComputedStyle(currentElement);
                if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
                    return null; // Element is not visible
                }
                currentElement = currentElement.parentElement;
            }

            const range = getCaretPosition(x, y);

            if (range && range.startContainer && range.startContainer.nodeType === Node.TEXT_NODE && range.startContainer.textContent && range.startContainer.textContent.trim().length > 0) {
                const textNode = range.startContainer;
                const text = textNode.textContent;
                const cursorPosition = range.startOffset;

                const textRange = document.createRange();
                textRange.selectNodeContents(textNode);

                const rect = textRange.getBoundingClientRect();
                const selection = window.getSelection();

                if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
                    // Pattern for non-word characters (anything not a letter or apostrophe)
                    const nonWordPattern = /[^0-9a-zA-Z']/;
                    const nonLetterPattern = /[^0-9a-zA-Z]/;
            
                    // BEFORE cursor: Split text before cursor and find last non-word char
                    const textBefore = text.substring(0, cursorPosition);
            
                    const beforeMatch = [...textBefore].reverse().join("").search(nonLetterPattern);
                    const start = beforeMatch === -1 ? 0 : textBefore.length - beforeMatch;
            
                    // AFTER cursor: Find next non-word char after cursor
                    const textAfter = text.substring(cursorPosition);
                    const afterMatch = textAfter.search(nonWordPattern);
                    const end = afterMatch === -1 ? 
                        text.length : // if no match, go to end of text
                        cursorPosition + afterMatch; // if match found, that's our endpoint
            
                    // Create and apply the selection
                    const wordRange = document.createRange();
                    wordRange.setStart(textNode, start);
                    wordRange.setEnd(textNode, end);
                    
                    selection.removeAllRanges();
                    selection.addRange(wordRange);

                    const selectedText = selection.toString();

                    if (selectedText.trim().length > 0) {
                        // Store current word and event
                        PopupManager.currentWord = selectedText;
                        PopupManager.currentEvent = event;
                        
                        // If this word is currently being saved, show the loading spinner
                        if (PopupManager.isLoading && selectedText === PopupManager.wordBeingSaved) {
                            //PopupManager.showLoading(event);
                            PopupManager.updatePosition(event);
                            return;
                        }
                        
                        // get saved word from DB, display if it exists
                        const response = await chrome.runtime.sendMessage({ 
                            action: 'getRecord',
                            params: { word : selectedText }
                        });

                        if (response.record) {
                            const data = JSON.parse(response.record.APIdata);
                            const transcription = data.phonetic;
                            const ul = document.createElement('ul');

                            for(let i=0; i<4 && i < data.meanings.length; i++) {
                                var li = document.createElement('li');
                                li.textContent = '(' + data.meanings[i].partOfSpeech + ')';
                                ul.appendChild(li);

                                for(let j=0;j<3 && j < data.meanings[i].definitions.length; j++) {
                                    li = document.createElement('li');
                                    li.className = 'wordListItem';

                                    li.textContent = data.meanings[i].definitions[j].definition;
                                    ul.appendChild(li);
                                }
                            }

                            /*
                            data.meanings[0].definitions.forEach(definition => {
                                
                            });*/

                            PopupManager.showList(event, ul, selectedText, transcription);
                        }
                        else {
                            //PopupManager.show(event, 'Word not saved in WordSafe');
                            PopupManager.hide();
                        }
                    }
                    else 
                        PopupManager.hide();
                }
                else {
                    selection.removeAllRanges();
                    PopupManager.hide();
                }
            }
            else {
                PopupManager.hide();
            }
        }
	}
});

function hasReadableText(element) {
    // Common text-containing elements
    const textElements = [
        'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
        'SPAN', /*'DIV',*/ 'A', 'LABEL', 'LI', 'TD', 'TH'
    ];
    
    return textElements.includes(element.tagName) && 
           element.textContent.trim().length > 0 && 
           getComputedStyle(element).display !== 'none';
}

function getRangeFromElement(element) {
    const range = document.createRange();
    range.selectNodeContents(element);
    return range;
}

function getCaretPosition(x, y) {
    if (document.caretRangeFromPoint) {
        return document.caretRangeFromPoint(x, y);
    } else if (document.caretPositionFromPoint) {
        const pos = document.caretPositionFromPoint(x, y);
        const range = document.createRange();
        range.setStart(pos.offsetNode, pos.offset);
        return range;
    }
    return null;
}