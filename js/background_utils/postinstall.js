import { switchToTab } from '/js/helper.js';

export function welcome() {
	if (details.reason === "install") {
		switchToTab('/html/welcome.html');
	}
}