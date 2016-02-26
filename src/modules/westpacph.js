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

function login(user, pass) {
    console.log("Site: " + window.location.href);
    jQuery.ajaxSetup({async: false});
    $("#username_temp").val(user);
    for (i = 0; i < pass.length; i++) {
        var p = pass.charAt(i).toUpperCase();
        $("#keypad_0_kp" + p).click();
    }
    $("#btn-submit").click();
}

function getAccounts() {
    var accounts = [];
    $(".account-tile").each(function(i, div) {
        var balance = $(div).find(".balance dd.CurrentBalance").contents().eq(0).text();
        var account = $(div).find(".account-info h2").text();
        var type = $(div).parent().attr("data-analytics-productgroupname");
        accounts.push({name: account.trim(), balance: balance.trim(), type: type.trim()});
    });
    return accounts;
}

page.open('https://online.westpac.com.au/esis/Login/SrvPage', function() {
    page.onLoadFinished = function() {
        if (page.url == "https://banking.westpac.com.au/secure/banking/overview/dashboard") {
            console.log("Logged In Successfully");
            var accounts = page.evaluate(getAccounts);
            accounts.forEach(function(acc) {
                console.log("account: " + acc.name + "=" + acc.balance + ", " + acc.type);
            })
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
