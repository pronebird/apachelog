//
// Apache logs parser and viewer tool
//

var LOG_FILE = 'apache.log';
var LOG_ENCODING = 'utf-8'
var SHORTURL_LENGTH = 80;

var fs = require('fs');
var _ = require('underscore');
var color = require('ansi-color').set;

var opt = require('node-getopt').create([
	['f', 'file=[FILE]', 'file path (default: ' + LOG_FILE + ')'],
	['e', 'encoding=[ENCODING]', 'file encoding (default: ' + LOG_ENCODING + ')'],
	['s', 'short', 'shorten long URLs'],
	['h', 'help', 'display this help']
]).bindHelp().parseSystem();

function print_strip() {
	var s = '';
	_.times(100, function () { s += '-'; });
	console.log(s);
}

function print_head() {
	console.log(color('VISITS|   URL ', 'bold'));
	print_strip();
}

function pad_string(str, num) {
	var s = '';
	_.times(num, function () { s += ' '; });
	return (str + s).substr(0, num);
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

	var sorted_date_keys = _.sortBy(_.keys(referrers), function (k) {
		return -(+new Date(k));
	});

	print_strip();

	_.each(sorted_date_keys, function (key) {
		var date = key;
		var counted_urls = _.countBy(referrers[key], function (k) { return k; });
		var sorted_url_keys = _.sortBy(_.keys(counted_urls), function (k) {
			return -counted_urls[k];
		});

		console.log(color(date, 'black+bold'));
		print_strip();
		print_head();

		_.each(sorted_url_keys, function (k) {
			var url = k;
			if(opt.options.short && url.length > SHORTURL_LENGTH)
				url = url.substr(0, SHORTURL_LENGTH) + '...';

			console.log('%s |   %s', color(pad_string(counted_urls[k], 5), 'black+bold'), color(url, 'blue'));
		});

		print_strip();
	});
});
