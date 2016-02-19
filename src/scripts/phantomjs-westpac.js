// Simple Javascript example

var page = require('webpage').create();
console.log('Loading a web page');
console.log(args);
var url = 'http://phantomjs.org/';
page.open(url, function (status) {
    //Page is loaded!
    console.log(status);
    phantom.exit();
});