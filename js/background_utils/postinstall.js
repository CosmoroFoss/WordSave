import { switchToTab } from '../helper.js';

export function welcome(details) {
	if (details.reason === "install") {
		switchToTab('/html/welcome.html');
	}
}