let moment = require('moment');

// Converts Facebook fuzzy timestamp to epoch time
export class FuzzyTimestamp {

	constructor(clock) {
		if (!clock) {
			clock = {
				currentTimestamp: () => {
					return new Date().valueOf();
				},
				currentDayStart: () => {
					return moment().startOf('day').valueOf();
				}
			}
		}
		this.clock = clock;
	}

	convert(text) {

		if (!text) {
			return 0;
		}

		let difference = null;

		// Obtain the difference
		if (text === 'Just now') {
			difference = 0;

		} else {

			// Convenience function to extract the difference value
			let getTextDifference = (singularSuffix, pluralSuffix, multiplier) => {

				// Return value if already have the value
				if (difference !== null) {
					return difference;
				}

				// Determine if contains suffix
				if ((text.endsWith(' ' + singularSuffix)) || (text.endsWith(' ' + pluralSuffix))) {
					// Obtain the value
					let rawValue = text.split(' ')[0];
					return rawValue * multiplier;
				}

				// As here, not value for unit (suffix)
				return null;
			}

			// Obtain the difference based on unit
			difference = getTextDifference('sec', 'secs', 1);
			difference = getTextDifference('min', 'mins', 60);
			difference = getTextDifference('minute ago', '', 60);
			difference = getTextDifference('', 'minutes ago', 60);
			difference = getTextDifference('hr', 'hrs', 60 * 60);
			difference = getTextDifference('hour ago', '', 60 * 60);
			difference = getTextDifference('', 'hours ago', 60 * 60);
		}
		if (difference !== null) {
			return this.clock.currentTimestamp() - (difference * 1000);
		}

		// Determine if yesterday
		if (text.startsWith('Yesterday')) {
			let yesterdayTimes = (text.split(' at ')[1]).split(':');
			let yesterdayHour = Number(yesterdayTimes[0]);

			// Determine if am/pm
			let yesterdayMin = yesterdayTimes[1];
			if (yesterdayMin.endsWith('m')) {
				let timeAmPm = yesterdayMin.substring(yesterdayMin.length - 2, yesterdayMin.length);
				yesterdayMin = Number(yesterdayMin.substring(0, yesterdayMin.length - 2));
				if (timeAmPm === 'pm') {
					// Increment hour for pm time
					yesterdayHour = yesterdayHour + 12;
				}
			}

			// Calculate the timestamp
			let yesterdayHourDifference = ((24 - (yesterdayHour + 1)) * 60 * 60);
			let yesterdayMinDifference = ((60 - yesterdayMin) * 60);
			let yesterdayDifference = yesterdayHourDifference + yesterdayMinDifference;
			return this.clock.currentDayStart() - (yesterdayDifference * 1000);
		}

		// Determine if exact time
		let timestamp = moment(text, 'D MMM at H:m');
		if (timestamp && (timestamp.isValid())) {
			return timestamp.valueOf();
		} else {
			timestamp = moment(text, 'MMM D at H:ma');
			if (timestamp && (timestamp.isValid())) {
				return timestamp.valueOf();
			}
		}

		// Unknown time, so return epoch
		return 0;
	}
}