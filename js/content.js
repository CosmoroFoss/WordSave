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
            this.popup.style.cssText = `
                all: initial;
                font-family: monospace, sans-serif;
                position: fixed;
                display: none;
                background: white;
                border: 1px solid #ccc;
                padding: 10px;
                border-radius: 4px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                z-index: 10000;
                pointer-events: none;
            `;

            this.shadow.appendChild(this.popup);

            const style = document.createElement('style');
            style.textContent = `
                #myExtensionPopup {
                    all: initial; /* Reset inherited styles */
                    font-family: monospace, sans-serif;
                }
                #myExtensionPopup ul {
                    all: initial;
                    font-family: inherit;
                    font-size: 0.9em;
                    list-style-type: none;
                    padding-left: 0;
                    margin: 0;
                }
                #myExtensionPopup li {
                    all: initial;
                    font-family: inherit;
                    padding: 2px 0;
                    margin-bottom: 2px;
                }
            `;
            document.head.appendChild(style);
            //document.body.appendChild(this.popup);
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
            <div class="loading-spinner" style="
                display: inline-block;
                width: 20px;
                height: 20px;
                border: 3px solid #f3f3f3;
                border-top: 3px solid #3498db;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            ">
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
            <span style="margin-left: 10px">Saving word...</span>
        `;
        this.show(e, loadingHtml);
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
                    li.textContent = data.meanings[0].definitions[i].definition;
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
    } else if (request.action === 'wordSaveCompleted') {
        PopupManager.isLoading = false;
        PopupManager.wordBeingSaved = null;
        PopupManager.updateForCurrentWord();
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

        const range = getCaretPosition(x, y);

        if (range && range.startContainer && range.startContainer.nodeType === Node.TEXT_NODE && range.startContainer.textContent && range.startContainer.textContent.trim().length > 0) {
            const textNode = range.startContainer;
            const text = textNode.textContent;
            const cursorPosition = range.startOffset;

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
            
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(wordRange);

            const selectedText = selection.toString();

            if (selectedText.trim().length > 0) {
                // Store current word and event
                PopupManager.currentWord = selectedText;
                PopupManager.currentEvent = event;
                
                // If this word is currently being saved, show the loading spinner
                if (PopupManager.isLoading && selectedText === PopupManager.wordBeingSaved) {
                    PopupManager.showLoading(event);
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

                    for(let i=0; i<4 && i < data.meanings[0].definitions.length; i++) {
                        const li = document.createElement('li');
                        li.textContent = data.meanings[0].definitions[i].definition;
                        ul.appendChild(li);
                    }

                    /*
                    data.meanings[0].definitions.forEach(definition => {
                        
                    });*/

                    PopupManager.showList(event, ul, selectedText, transcription);
                }
                else {
                    PopupManager.show(event, 'Word not saved in WordSafe');
                }
            }
            else 
                PopupManager.hide();
        }
        else {
            PopupManager.hide();
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