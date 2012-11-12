//
// Apache logs parser and viewer tool
//

var LOG_FILE = 'apache.log';
var LOG_ENCODING = 'utf8'
var SHORTURL_LENGTH = 80;

var fs = require('fs');
var _ = require('underscore');
var color = require('ansi-color').set;

var opt = require('node-getopt').create([
	['f', 'file=[FILE]', 'file path (default: ' + LOG_FILE + ')'],
	['e', 'encoding=[ENCODING]', 'file encoding (default: ' + LOG_ENCODING + ')'],
	['s', 'short', 'shorten long URLs'],
	['c', 'colorize', 'Colorize output'],
	['h', 'help', 'display this help']
]).bindHelp().parseSystem();

function printStripe() {
	var s = '';
	_.times(100, function () { s += '-'; });
	console.log(s);
}

function printHead() {
	console.log(color('VISITS|   Referrer ', 'bold'));
	printStripe();
}

function padString(str, num) {
	var s = '';
	_.times(num, function () { s += ' '; });
	return (str + s).substr(0, num);
}

if(!opt.options.colorize) {
	color = function (s) { return s; }
}

fs.readFile(opt.options.file || LOG_FILE, opt.options.encoding || LOG_ENCODING, function (err, data) {
	var referrers = {};

	if(err)
		return console.log(err.toString());

	data.trim().split("\n").forEach(function (str) {
		var matches = /^\S+ \S+ \S+ \[(.*?)\:[^\]]+\] "[A-Z]+[^"]*" \d+ \d+ "([^"]*)" "[^"]*"$/.exec(str);

		if(matches) {
			var date = matches[1];
			var referrer = matches[2];

			if(referrer !== '-') {
				if(!_.isArray(referrers[date]))
					referrers[date] = [];

				referrers[date].push(referrer);
			}

		} else
			console.log('Unable to match: %s', str);
	});

	var sortedDateKeys = _.sortBy(_.keys(referrers), function (k) {
		return -(+new Date(k));
	});

	printStripe();

	_.each(sortedDateKeys, function (key) {
		var date = key;
		var countedUrls = _.countBy(referrers[key], function (k) { return k; });
		var sortedUrlKeys = _.sortBy(_.keys(countedUrls), function (k) {
			return -countedUrls[k];
		});

		console.log(color(date, 'black+bold'));

		printStripe();
		printHead();

		_.each(sortedUrlKeys, function (k) {
			var url = k;
			if(opt.options.short && url.length > SHORTURL_LENGTH)
				url = url.substr(0, SHORTURL_LENGTH) + '...';

			console.log('%s |   %s', color(padString(countedUrls[k], 5), 'black+bold'), color(url, 'blue'));
		});

		printStripe();
	});
});
