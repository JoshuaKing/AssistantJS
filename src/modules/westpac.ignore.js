var process = require('process');
var Browser = require('zombie');
var Crypt = require(process.cwd() + '/src/app/crypt.js');

function load(configuration, moduleconf) {
    config = configuration;
    console.log("Thanks " + Crypt.decrypt(config.name));

    //browser = new Browser({userAgent: config.zombie.userAgent.mobile, debug: true, waitFor: 10000})
    Browser.localhost('example.com', 3000);
    browser = new Browser({userAgent: config.zombie.userAgent.desktop, debug: true, waitFor: 10000});
    browser.site = "https://online.westpac.com.au";
    /*browser.visit("/esis/Login/SrvPage?app=mobile").then(function() {
        console.log(browser.location.href);
        browser.fill("uName", Crypt.decrypt(moduleconf.username));
        browser.focus("pwd");
        var p = Crypt.decrypt(moduleconf.password);
        browser.keyPress("pwd", p.substr(0, 6)).then(function() {
            console.log(p + " = " + browser.document.getElementById("password").value);
            return browser.click("#signin").then(function() {
                setTimeout(function() {
                    console.log(browser.html());
                    console.log(browser.location.href);
                }, 1500);
            });
        });
    });*/
    browser.visit("/esis/Login/SrvPage").then(function() {
        console.log(browser.html());
        console.log(browser.location.href);
        browser.fill("username_temp", Crypt.decrypt(moduleconf.username));
        var pass = Crypt.decrypt(moduleconf.password);
        for (i = 0; i < pass.length; i++) {
            var p = pass.charAt(i).toUpperCase();
            console.log("p " + p);
            browser.query("keypad_0_kp" + p).click();
        }
    });
}

module.exports = {load: load};