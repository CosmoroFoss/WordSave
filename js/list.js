import { toggleWordCell } from '/js/helper.js';
import { switchToTab } from '/js/helper.js';

document.getElementById('openSettings').addEventListener('click', () => {
    switchToTab('/html/options.html');
});

document.addEventListener('DOMContentLoaded', async () => {
    const tableContainer = document.getElementById('tableContainer');
    const ttsHandler = new TTSHandler();
    await ttsHandler.loadSettings();

    // Settings management functions
    async function getSettings() {
        const result = await chrome.storage.local.get(['currentPage', 'rowsPerPage']);
        return {
            currentPage: result.currentPage || 1,
            rowsPerPage: result.rowsPerPage || 10  // default value
        };
    }

    async function saveSettings(settings) {
        await chrome.storage.local.set({
            currentPage: settings.currentPage,
            rowsPerPage: settings.rowsPerPage
        });
    }

    async function displayWords() {
        try {
            // Get current settings
            const settings = await getSettings();
            const { currentPage, rowsPerPage } = settings;

            const records = await getRecords();
                        
            // Calculate pagination values
            const startIndex = (currentPage - 1) * rowsPerPage;
            const endIndex = startIndex + rowsPerPage;
            const wordsToDisplay = records.sort((a, b) => 
                new Date(b.timestamp) - new Date(a.timestamp)).slice(startIndex, endIndex);

            // Create table
            const table = document.createElement('table');
            //table.className = 'word-table';
            table.className = 'word-table table-fixed w-full divide-y divide-gray-200';

            // Create table header
            const thead = document.createElement('thead');
            thead.className = 'bg-gray-50';
            const headerRow = document.createElement('tr');
            ['Word', 'Transcription', 'Meaning', 'Actions'].forEach(headerText => {
                const th = document.createElement('th');
                th.textContent = headerText;

                if (headerText == 'Meaning')
                    th.className = 'px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-6/12';
                else if (headerText == 'Actions')
                    th.className = 'px-6 py-3 text-left text-xs font-medium uppercase tracking-wider action-header w-2/12';
                else
                    th.className = 'px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-2/12';

                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);
            table.appendChild(thead);

            // Create table body
            const tbody = document.createElement('tbody');

            if (records.length === 0) {
                const emptyRow = document.createElement('tr');
                const emptyCell = document.createElement('td');
                emptyCell.colSpan = 3;
                emptyCell.className = 'empty-state';
                emptyCell.textContent = 'No words saved yet';
                emptyRow.appendChild(emptyCell);
                tbody.appendChild(emptyRow);
            } else {

                const groupedWords = Object.groupBy(wordsToDisplay, item => 
                    new Date(item.timestamp).toLocaleDateString()
                );

                // if it's a new Day, create a subcolumn
                for (let day in groupedWords) {
                    const row = document.createElement('tr');
                    row.className = 'date-row'; 

                    const dayCell = document.createElement('td');
                    dayCell.colSpan = "4";
                    dayCell.className = 'word-cell';

                    const formatedDay = new Date(day).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                    });
                    dayCell.textContent = formatedDay;
                    row.appendChild(dayCell);

                    tbody.appendChild(row);
                    
                    for (const [index, wordData] of groupedWords[day].entries()) {
                        await displayWord(tbody, wordData);
                    }
                }
            }

            table.appendChild(tbody);

            // Clear container and add new table
            tableContainer.innerHTML = '';
            tableContainer.appendChild(table);

            // Add pagination controls with current settings
            if (records.length > 0) {
                const paginationControls = createPaginationControls(
                    records.length,
                    rowsPerPage,
                    currentPage
                );
                tableContainer.appendChild(paginationControls);
            }

        } catch (err) {
            console.error('Error loading words:', err);
        }
    }

    async function displayWord(tbody, record) {
        try {
                const row = document.createElement('tr');
                row.className = 'word-row';

                // expand / collapse a word definition click handler
                row.addEventListener('click', async (e) => toggleWordCell(e, row));

                // Word cell
                const wordCell = document.createElement('td');
                wordCell.className = 'word-cell box-border px-6 w-2/12 min-w-0 truncate';

                let p = document.createElement('p');
                p.textContent = record.word.toLowerCase();
                wordCell.appendChild(p);

                row.appendChild(wordCell);

                // Phonetic cell
                const phoneticCell = document.createElement('td');
                phoneticCell.className = 'phonetic box-border loading px-6 w-2/12 min-w-0 truncate';

                p = document.createElement('p');
                p.textContent = record.APIdata.phonetic; //await getPhonetic(record);
                phoneticCell.appendChild(p);

                phoneticCell.style.marginLeft = '10px';
                phoneticCell.style.color = '#666';
                phoneticCell.style.fontSize = '0.9em';

                row.appendChild(phoneticCell);

                // Meaning cell
                const meaningCell = document.createElement('td');
                meaningCell.className = 'phonetic box-border px-6 w-6/12 min-w-0 truncate';

                p = document.createElement('p');
                p.textContent = record.APIdata.meanings[0].definitions[0].definition;
                meaningCell.appendChild(p);
                meaningCell.classList.add('meaning');

                row.appendChild(meaningCell);

                // Actions cell
                const actionsCell = document.createElement('td');
                actionsCell.className = 'actions-cell box-border px-6 w-2/12 min-w-0 truncate';

                const speakBtn = document.createElement('button');
                speakBtn.innerHTML = '<span class="material-icons">volume_up</span>';
                speakBtn.className = 'speak-btn';
                speakBtn.title = 'Speak word';
                
                speakBtn.addEventListener('click', async () => {
                    const settings = await chrome.storage.local.get('voiceSettings');
                    const voiceSettings = settings.voiceSettings || {
                        voice: 'UK English Female',
                        rate: 1.0,
                        pitch: 1.0
                    };

                    ttsHandler.speak(record.word, speakBtn);
                });  

                // Edit button
                const editBtn = document.createElement('button');
                editBtn.innerHTML = '<span class="material-icons">edit</span>';
                editBtn.className = 'edit-btn';
                editBtn.title = 'Edit word';
                
                editBtn.addEventListener('click', async () => {
                    const dialog = document.getElementById('edit-popup');
                    const saveBtn = document.getElementById('save-btn');
                    const cancelBtn = document.getElementById('cancel-btn');

                    dialog.showModal();

                    saveBtn.addEventListener('click', () => {
                        
                    });

                    cancelBtn.addEventListener('click', () => {
                        dialog.close();
                    });
                });

                // Delete button
                const deleteBtn = document.createElement('button');
                deleteBtn.innerHTML = '<span class="material-icons">delete</span>';
                deleteBtn.className = 'delete-btn';
                deleteBtn.title = 'Delete word';
                
                deleteBtn.addEventListener('click', async () => {
                    if (confirm(`Delete "${record.word}"?`)) {
                        try {
                            ttsHandler.stop();

                            const expandableRow = row.nextElementSibling;
                            expandableRow.remove();
                            row.remove();

                            await deleteRecord(record.word);
                        }
                        catch {
                            console.log('Failed to delete word')
                        }
                    }
                });

                actionsCell.appendChild(speakBtn);
                actionsCell.appendChild(deleteBtn);
                row.appendChild(actionsCell);

                const subrow = document.createElement('tr');
                subrow.className = 'expandable-content';

                const subcell = document.createElement('td');
                subcell.className = 'remove-padding';
                subcell.colSpan = 4;

                const wrapper = document.createElement('div');
                wrapper.className = 'content-wrapper';

                const table = document.createElement('table');
                table.className = 'min-w-full';

                for (const meaning of record.APIdata.meanings) {
                    let subrow2 = document.createElement('tr');
                    subrow2.style.borderBottom = "1px solid black";

                    // Word cell
                    const wordCell2 = document.createElement('td');
                    wordCell2.className = 'word-cell box-border px-6 w-2/12 min-w-0';
                    subrow2.appendChild(wordCell2);

                    // Phonetic cell
                    const phoneticCell2 = document.createElement('td');
                    phoneticCell2.className = 'phonetic box-border loading px-6 w-2/12 min-w-0';
                    
                    p = document.createElement('p');
                    p.textContent = meaning.partOfSpeech;
                    phoneticCell2.appendChild(p);

                    phoneticCell2.style.marginLeft = '10px';
                    phoneticCell2.style.color = '#666';
                    phoneticCell2.style.fontSize = '0.9em';
                    phoneticCell2.style.verticalAlign = 'top';

                    subrow2.appendChild(phoneticCell2);

                    // Meaning cell
                    const meaningCell2 = document.createElement('td');
                    meaningCell2.className = 'meaning box-border px-6 w-6/12 min-w-0 align-top';

                    // Actions cell
                    const actionsCell2 = document.createElement('td');
                    actionsCell2.className = 'actions-cell box-border px-6 w-2/12 min-w-0';
                    actionsCell2.style.verticalAlign = 'top';

                    // Loop through definitions
                    meaning.definitions.forEach((def, index) => {

                        let p = document.createElement('p');

                        p.textContent = def.definition;
                        meaningCell2.appendChild(p);

                        let br = document.createElement('br');
                        meaningCell2.appendChild(br);

                        if (def.example) {
                            p = document.createElement('p');

                            p.textContent = 'example: ' + def.example;
                            meaningCell2.appendChild(p);

                            br = document.createElement('br');
                            meaningCell2.appendChild(br);
                            br = document.createElement('br');
                            meaningCell2.appendChild(br);
                        }
                    });

                    if (meaning.synonyms && meaning.synonyms.length > 0) {
                        let p = document.createElement('strong');
                        p.textContent = 'Synonyms';
    
                        let ul = document.createElement('ul');
    
                        meaning.synonyms.forEach(word => {
                            const li = document.createElement('li');
                            li.textContent = word;
                            //li.style.marginBottom = '10px';
                            ul.appendChild(li);
                        });
    
                        actionsCell2.appendChild(p);
                        actionsCell2.appendChild(ul);
                    }

                    if (meaning.antonyms && meaning.antonyms.length > 0) {
                        let p = document.createElement('strong');
                        p.textContent = 'Antonyms';

                        let ul = document.createElement('ul');

                        meaning.antonyms.forEach(word => {
                            const li = document.createElement('li');
                            li.textContent = word;
                            ul.appendChild(li);
                        });

                        actionsCell2.appendChild(p);
                        actionsCell2.appendChild(ul);
                    }

                    subrow2.appendChild(meaningCell2);
                    subrow2.appendChild(actionsCell2);

                    table.appendChild(subrow2);
                }

                wrapper.appendChild(table);
                subcell.appendChild(wrapper);
                subrow.appendChild(subcell);

                tbody.appendChild(row);
                tbody.appendChild(subrow);
            }
        catch (err) {
            console.error('Error loading word:', err);
        }
    }

    function createPaginationControls(totalWords, rowsPerPage, currentPage) {
        const totalPages = Math.ceil(totalWords / rowsPerPage);
        
        const paginationContainer = document.createElement('div');
        paginationContainer.className = 'pagination';
        paginationContainer.style.marginTop = '20px';
        paginationContainer.style.textAlign = 'center';

        const buttonContainer = document.createElement('div');
    
        // Add page info
        const pageInfo = document.createElement('span');
        pageInfo.textContent = `Page ${currentPage} of ${totalPages}    `;
        paginationContainer.appendChild(pageInfo);
    
        // Previous button
        const prevButton = document.createElement('button');
        prevButton.innerHTML = '<span class="material-icons">skip_previous</span>';
        prevButton.title = 'Previous';
        prevButton.className = 'previous-button'
        prevButton.disabled = currentPage === 1;
        prevButton.addEventListener('click', async (e) => {
            if (currentPage > 1) {
                await saveSettings({
                    currentPage: currentPage - 1,
                    rowsPerPage: rowsPerPage
                });
                await displayWords();
            }
        });
    
        // Next button
        const nextButton = document.createElement('button');
        nextButton.innerHTML = '<span class="material-icons">skip_next</span>';
        nextButton.title = 'Next';
        nextButton.disabled = currentPage === totalPages;
        nextButton.addEventListener('click', async (e) => {
            if (currentPage < totalPages) {
                await saveSettings({
                    currentPage: currentPage + 1,
                    rowsPerPage: rowsPerPage
                });
                await displayWords();
            }
        });

        // Add page size control
        const pageSizeContainer = document.createElement('div');
        pageSizeContainer.style.marginTop = '10px';

        const pageSizeLabel = document.createElement('label');
        pageSizeLabel.textContent = 'Words per page: ';
        pageSizeLabel.style.marginRight = '5px';

        const pageSizeSelect = document.createElement('select');
        [10, 20, 50, 100, 200].forEach(size => {
            const option = document.createElement('option');
            option.value = size;
            option.textContent = size;
            option.selected = size === rowsPerPage;
            pageSizeSelect.className ='select';
            pageSizeSelect.appendChild(option);
        });

        pageSizeSelect.addEventListener('change', async () => {
            const newRowsPerPage = parseInt(pageSizeSelect.value);
            const newTotalPages = Math.ceil(totalWords / newRowsPerPage);
            
            // Adjust current page if it exceeds new total pages
            const newCurrentPage = Math.min(currentPage, newTotalPages);
            
            await saveSettings({
                currentPage: newCurrentPage,
                rowsPerPage: newRowsPerPage
            });
            await displayWords();
        });

        pageSizeContainer.appendChild(pageSizeLabel);
        pageSizeContainer.appendChild(pageSizeSelect);
    
        buttonContainer.appendChild(prevButton);
        buttonContainer.appendChild(nextButton);
        paginationContainer.appendChild(buttonContainer);
        paginationContainer.appendChild(pageSizeContainer);
    
        return paginationContainer;
    }

    await displayWords();
});

async function getRecords() {
    try {
        const response = await chrome.runtime.sendMessage({
            action: 'getRecords'
        });
        if (response.error) {
            throw new Error(response.error);
        }
        return response.records;
    } catch (error) {
        console.error('Error fetching records:', error);
        return null;
    }
}

async function deleteRecord(word) {
    try {
        const response = await chrome.runtime.sendMessage({
            action: 'deleteRecord',
            params: { word }
        });
        if (response.error) throw new Error(response.error);
        return response.record;
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}
