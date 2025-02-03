// options.js
document.addEventListener('DOMContentLoaded', async function() {
	const result = await chrome.storage.local.get('lastSelectedOptionsPageTab');

	if (result.lastSelectedOptionsPageTab) {
        // Remove active class from all tabs and pages
        const pages = document.querySelectorAll('.page');
        pages.forEach(page => page.classList.remove('active'));
        
        // Add active class to selected tab and its corresponding page
        const selectedTab = document.getElementById(result.lastSelectedOptionsPageTab);
        selectedTab.classList.add('active');
        document.getElementById(`${selectedTab.dataset.page}-page`).classList.add('active');
    }

	// Handle navigation
	const navItems = document.querySelectorAll('.nav-item');

	navItems.forEach(navItem => {
		navItem.addEventListener('click', () => {
		  const navItemId = navItem.id;
		  chrome.storage.local.set({ 'lastSelectedOptionsPageTab': navItemId }, function() {});
	  });
	});
	
	navItems.forEach(item => {
	  item.addEventListener('click', function() {
		// Update active nav item
		navItems.forEach(nav => nav.classList.remove('active'));
		this.classList.add('active');
		
		// Show corresponding page
		const pages = document.querySelectorAll('.page');
		pages.forEach(page => page.classList.remove('active'));
		document.getElementById(`${this.dataset.page}-page`).classList.add('active');
	  });
	});
  });