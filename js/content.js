// Create a singleton popup manager
const PopupManager = {
    popup: null,
    currentTarget: null,
    offset: { x: 10, y: 10 },
    
    // Initialize the popup once
    init() {
        if (!this.popup) {
            this.popup = document.createElement('div');
            this.popup.id = 'myExtensionPopup';
            this.popup.style.cssText = `
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
            document.body.appendChild(this.popup);
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

    showList(e, ul) {
        while (this.popup.firstChild) {
            this.popup.removeChild(this.popup.firstChild);
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
    }
};

PopupManager.init();

let mouseDown = false;
document.addEventListener('mousedown', () => {
	mouseDown = true
	const selection = window.getSelection();
	selection.empty();
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
                // get saved word from DB, display if it exists
                const response = await chrome.runtime.sendMessage({ 
                    action: 'getRecord',
                    params: { word : selectedText }
                });

                if (response.record) {
                    const data = JSON.parse(response.record.APIdata);
                    const ul = document.createElement('ul');

                    data.meanings[0].definitions.forEach(definition => {
                        const li = document.createElement('li');
                        li.textContent = definition.definition;
                        ul.appendChild(li);
                    });

                    PopupManager.showList(event, ul); //data.meanings[0].definitions[0].definition
                }
                else 
                {
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