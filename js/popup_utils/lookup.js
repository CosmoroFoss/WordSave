export function lookupUpdateUI(response, word, ttsHandler) {
	const wordData = response;//.wordData; // Assuming response contains the word data
	const wordDefinition = document.getElementById('wordDefinition');

	if (wordDefinition && wordData) {
	//wordDefinition.textContent = wordData; // Insert the word data into the input field

	wordDefinition.innerHTML = "";

	const defContainer = document.createElement('div');
	defContainer.className = 'flex flex-col text-black';

	const wordDiv = document.createElement('div');
	wordDiv.className = 'flex items-center gap-x-1';

	const wordElement = document.createElement('h2');
	wordElement.className = 'font-bold';
	wordElement.textContent = word;

	const speakBtn = document.createElement('button');
	speakBtn.innerHTML = '<span class="material-icons !text-sm">volume_up</span>';
	speakBtn.className = 'speak-btn inline-flex items-center';
	speakBtn.title = 'Speak word';
	
	speakBtn.addEventListener('click', async () => {
		const settings = await chrome.storage.local.get('voiceSettings');
		const voiceSettings = settings.voiceSettings || {
			voice: 'UK English Female',
			rate: 1.0,
			pitch: 1.0
		};

		ttsHandler.speak(word, speakBtn);
	});  

	wordDiv.appendChild(wordElement);
	wordDiv.appendChild(speakBtn);

	const phoneticElement = document.createElement('h3');
	phoneticElement.className = 'italic';
	phoneticElement.textContent = wordData.phonetic;

	defContainer.appendChild(wordDiv);
	defContainer.appendChild(phoneticElement);

	const defScrollContainer = document.createElement('div');
	defScrollContainer.className = 'overflow-auto max-h-80';

	for(let i=0;i<wordData.meanings.length;i++) {
		const partOfSpeech = document.createElement('h3');
		partOfSpeech.textContent = '(' + wordData.meanings[i].partOfSpeech + ')';
		const defList = document.createElement('ul');
		defList.className = 'ml-3';
		const defEntry = document.createElement('li');

		defScrollContainer.appendChild(partOfSpeech);
		defScrollContainer.appendChild(defList);

		for(let j=0;j<wordData.meanings[i].definitions.length;j++) {
		defEntry.textContent = wordData.meanings[i].definitions[j].definition;
		defList.appendChild(defEntry);
		}

		if (wordData.meanings.length > 1) 
		if (i != wordData.meanings.length - 1){
			const divider = document.createElement('div');
			divider.className = 'divider divider-neutral';

			defList.appendChild(divider);
		}
	}

	defContainer.appendChild(defScrollContainer);
	wordDefinition.appendChild(defContainer);

	/*
	<div class="flex flex-col text-black">
	<h2 class="font-bold">dabble</h2>
	<h3 class="italic">dabble</h3>

	<h3 class="">(noun)</h3>
	<ul class="ml-3">
		<li>to wet by splashing : splatter</li>
		<li>to paddle or play in or as if in water</li>
		<li>to reach with the bill to the bottom of shallow water to obtain food</li>
	</ul>

	<div class="divider divider-neutral"></div>
	*/
	}
}