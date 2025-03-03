export async function checkWindowExistence(windowID) {
	try {
		await chrome.windows.get(windowID);
		// Window exists
		return true;
	} catch {
		// Window doesn't exist
		windowID = -1;
		// popoutWindowID = -1;
		return false;
	}
  }