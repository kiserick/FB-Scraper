export class Eventable {

	constructor() {
		this.eventListeners = [];
	}

	on(event, callback) {
		this.eventListeners.push({
			event: event,
			callback: callback
		});
	}

	broadcast(event, arg) {
		this.eventListeners.filter((listener) => event === listener.event).forEach((listener) => listener.callback(this, arg));
	}

	removeListener(event, callback) {
		this.eventListeners = this.eventListeners.filter((existing) => (existing.callback !== callback || existing.event !== event));
	}
}