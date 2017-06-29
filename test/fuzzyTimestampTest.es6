import {FuzzyTimestamp} from '../src/fuzzyTimestamp.es6'

let chai = require('chai');
let moment = require('moment');

chai.should();

describe("Timestamp", () => {

	let doTest = (timestampText, secondsAgo, dateTime, fixedTimestamp) => {

		let expectedTime = null;
		// Convert the timestamp (by using fixed current time)
		let currentTimestamp = moment('2016-01-19 12:00').valueOf();
		let timestamp = new FuzzyTimestamp({
			currentTimestamp: function() {
				return currentTimestamp;
			},
			currentDayStart: function() {
				return moment('2016-01-19 00:00').valueOf();
			}
		});
		let convertedTime = timestamp.convert(timestampText);

		// Calculate the expected timestamp
		if (secondsAgo != null) {

			expectedTime = currentTimestamp - (secondsAgo * 1000);

		} else if (dateTime) {

			let expectedMomentTime = moment(dateTime, 'YYYY-MM-DD HH:mm');
			expectedTime = expectedMomentTime.valueOf();

		} else {

			expectedTime = fixedTimestamp;

		}

		// Ensure correct value
		convertedTime.should.equal(expectedTime);
	};

	let fromMinutes = (min) => (min * 60);
	let fromHours = (hrs) => (fromMinutes(hrs * 60));

	// Test times
	it('Just now', () => doTest('Just now', 0));
	it('1 sec', () => doTest('1 sec', 1));
	it('30 secs', () => doTest('30 secs', 30));
	it('1 min', () => doTest('1 min', fromMinutes(1)));
	it('1 minute ago', () => doTest('1 minute ago', fromMinutes(1)));
	it('25 mins', () => doTest('25 mins', fromMinutes(25)));
	it('53 minutes ago', () => doTest('53 minutes ago', fromMinutes(53)));
	it('1 hr', () => doTest('1 hr', fromHours(1)));
	it('1 hour ago', () => doTest('1 hour ago', fromHours(1)));
	it('4 hrs', () => doTest('4 hrs', fromHours(4)));
	it('5 hours ago', () => doTest('5 hours ago', fromHours(5)));
	it('11 hours ago', () => doTest('11 hours ago', fromHours(11)));
	it('Yesterday at 3:35am', () => doTest('Yesterday at 3:35am', null, '2016-01-18 03:35'));
	it('Yesterday at 3:35pm', () => doTest('Yesterday at 3:35pm', null, '2016-01-18 15:35'));
	it('Yesterday at 18:19', () => doTest('Yesterday at 18:19', null, '2016-01-18 18:19'));
	it('4 January at 03:32', () => doTest('4 January at 03:32', null, '2017-01-04 03:32'));
	it('January 17 at 5:50pm', () => doTest('January 17 at 5:50pm', null, '2017-01-17 17:50'));
	it('17 January at 22:25', () => doTest('17 January at 22:25', null, '2017-01-17 22:25'));

	// Exception scenarios
	it('null', () => doTest(null, null, null, 0));
	it('Public', () => doTest('Public', null, null, 0));
	it('(blank string)', () => doTest('', null, null, 0));
	it('unknown timestamp', () => doTest('unknown timestamp', null, null, 0));

});