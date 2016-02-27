var system = require('system');
var fs = require('fs');
var cwd = system.args[1];
var config = JSON.parse(system.args[2]);
var moduleConfig = JSON.parse(system.args[3]);
var page = require('webpage').create();
var accountConfig = require(cwd + "/config/westpacph.json");

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

console.log("PhantomJS");

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
        div = $(div);
        var balanceHuman = div.find(".balance dd.CurrentBalance").clone().children().remove().end().text();
        var account = div.find(".account-info h2").text();
        var type = div.parent().attr("data-analytics-productgroupname");
        var id = div.find(".account-info p").clone().children().remove().end().text().replace(/[ ]+/g, "-");
        var hashcode = 0;
        for (i = 0; i < id.length; i++) {
            c = id.charCodeAt(i);
            hashcode = c + (hashcode << 6) + (hashcode << 16) - hashcode;
        }
        hashcode = Math.abs(hashcode % 53);

        var balance = Number(balanceHuman.replace(/[$, ]/g, ""));

        accounts.push({
            name: account.trim(),
            balanceHuman: balanceHuman.trim(),
            balance: balance,
            type: type.toLowerCase().trim(),
            id: id.trim(),
            hashcode: hashcode
        });
    });
    return accounts;
}

page.open('https://online.westpac.com.au/esis/Login/SrvPage', function() {
    page.onLoadFinished = function() {
        if (page.url == "https://banking.westpac.com.au/secure/banking/overview/dashboard") {
            console.log("Logged In Successfully");
            var accounts = page.evaluate(getAccounts);
            accounts.forEach(function(acc) {
                console.log(JSON.stringify(acc));
            });

            var networth = 0;
            for (account in accounts) {
                acc = accounts[account]
                if (accountConfig.networth.indexOf(acc.hashcode) >= 0) {
                    networth += acc.balance;
                }
            }

            var dir = cwd + "/log/westpacph/";
            var networthStr = Date.now() + " " + new Date().toISOString() + " " + networth;
            if (fs.makeTree(dir)) fs.write(dir + "networth.log", networthStr, "w+");
            console.log("Networth: " + networth);
        } else {
            console.log("Login failed: " + page.url);
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
    }, moduleConfig.encrypted.username, moduleConfig.encrypted.password);
    idleTimeout = setTimeout(exitPhantom, 3000);
});
