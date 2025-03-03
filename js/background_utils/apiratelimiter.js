export class APIRateLimiter {
	constructor(requestsPerMinute) {
		this.requestsPerMinute = requestsPerMinute;
		this.requests = [];
	}
  
	async checkRateLimit() {
		const now = Date.now();
		// Remove requests older than 1 minute
		this.requests = this.requests.filter(time => now - time < 60000);
		
		if (this.requests.length >= this.requestsPerMinute) {
			const oldestRequest = this.requests[0];
			const waitTime = 60000 - (now - oldestRequest);
			if (waitTime > 0) {
				await new Promise(resolve => setTimeout(resolve, waitTime));
			}
		}
		
		this.requests.push(now);
	}
  }
  