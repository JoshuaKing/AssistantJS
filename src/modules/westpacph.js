var system = require('system');
var cwd = system.args[1];
var user = system.args[2];
var pass = system.args[3];
var page = require('webpage').create();


page.onConsoleMessage = function(msg) {
    console.log('CONSOLE: ' + msg);
};

page.onResourceRequested = function(requestData, networkRequest) {
    if (requestData.url.indexOf(".js") != -1) {
        //console.log("Requested " + requestData.url);
        clearTimeout(idleTimeout);
        idleTimeout = setTimeout(exitPhantom, 2000);
    }
};

page.onResourceReceived = function(response) {
    if (response.stage != "end") return;
};

console.log("PhantomJS ");

function exitPhantom() {
    console.log("Finished at " + page.url);
    page.render(cwd + "/ph.png");
    phantom.exit();
}

page.open('https://online.westpac.com.au/esis/Login/SrvPage', function(status) {
    page.onLoadFinished = function(status) {
        if (page.url == "https://banking.westpac.com.au/secure/banking/overview/dashboard") {
            console.log("Logged In Successfully");
            var accounts = page.evaluate(function() {
                var accounts = [];
                $(".account-info").each(function(i, div) {
                    var balance = $(div).next().find("dd.CurrentBalance").contents().eq(0).text();
                    var account = $(div).find("h2").text();
                    accounts.push({name: account.trim(), balance: balance});
                });
                return accounts;
            });
            accounts.forEach(function(acc) {
                console.log("account: " + acc.name + "=" + acc.balance);
            })
        } else {
            console.log("Load Finished: " + page.url + "\nCONTENT: " + page.content);
        }
    };
    page.evaluate(function(user, pass) {
        console.log("Site: " + window.location.href);
        jQuery.ajaxSetup({async: false});
        $("#username_temp").val(user);
        for (i = 0; i < pass.length; i++) {
            var p = pass.charAt(i).toUpperCase();
            $("#keypad_0_kp" + p).click();
        }
        $("#btn-submit").click();
    }, user, pass);
    idleTimeout = setTimeout(exitPhantom, 3000);
});
