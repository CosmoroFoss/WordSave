export async function switchToTab(url) {
	try {
		const tabs = await chrome.tabs.query({});
		const existingTab = tabs.find(tab => 
		  tab.url.toLowerCase().startsWith('chrome-extension://') && 
		  tab.url.toLowerCase().endsWith(`${url}`)
		);
		
		if (existingTab) {
		  await chrome.tabs.update(existingTab.id, { active: true });
		  await chrome.windows.update(existingTab.windowId, { focused: true });
		  //await chrome.tabs.reload();
		} else {
		  await chrome.tabs.create({ url: `${url}` });
		}
	  } catch (error) {
		console.error('Error switching tabs:', error);
	  }
}

export function resetToDefaults() {
	// Get the manifest
	const manifest = chrome.runtime.getManifest();
	
	// Get the commands from the manifest
	const commands = manifest.commands;
	
	// For each command in the manifest
	Object.keys(commands).forEach(commandName => {
	  // Get the suggested key from the manifest
	  const suggestedKey = commands[commandName].suggested_key;
	  
	  // Reset the shortcut to default
	  chrome.commands.update({
		name: commandName,
		shortcut: suggestedKey.default
	  });
	});
  }

export function toggleWordCell(e, row) {
	if (e.target.matches('td')) {
		row.classList.toggle('active-word');

		const expandableRow = row.nextElementSibling;
		const contentWrapper = expandableRow.querySelector('.content-wrapper');
		  
		if (!contentWrapper.classList.contains('expanded')) {
			// Get natural height before expanding
			contentWrapper.style.height = 'auto';
			const targetHeight = contentWrapper.scrollHeight;
			contentWrapper.style.height = '0px';
			
			// Trigger reflow
			contentWrapper.offsetHeight;
			
			// Expand
			contentWrapper.classList.add('expanded');
			contentWrapper.style.height = targetHeight + 'px';
			
			// Remove specific height after animation completes
			contentWrapper.addEventListener('transitionend', function handler() {
				if (contentWrapper.classList.contains('expanded')) {
				contentWrapper.style.height = 'auto';
				}
				this.removeEventListener('transitionend', handler);
			});
		} else {
			// Set specific height before collapsing
			contentWrapper.style.height = contentWrapper.scrollHeight + 'px';
			
			// Trigger reflow
			contentWrapper.offsetHeight;
			
			// Collapse
			contentWrapper.style.height = '0px';
			contentWrapper.classList.remove('expanded');
		}
    }
}