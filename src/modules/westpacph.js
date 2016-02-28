var system = require('system');
var fs = require('fs');
var cwd = system.args[1];
var config = JSON.parse(system.args[2]);
var moduleConfig = JSON.parse(system.args[3]);
var accountConfig = require(cwd + "/config/westpacph.json");
var webpage = require('webpage');
var page = webpage.create();
var logdir = cwd + accountConfig.log.dir;

page.onConsoleMessage = function(msg) {
    console.log('injectedjs: ' + msg);
};
page.settings.resourceTimeout = 3000;
page.onResourceTimeout = function(request) {
    console.log("Resource Timeout " + JSON.stringify(request));
};

function resetTimer(requestData, networkRequest) {
    if (requestData && !requestData.url.match(/.js$/)) return;
    if (typeof idleTimeout != 'undefined') clearTimeout(idleTimeout);
    idleTimeout = setTimeout(exitPhantom, 2500);
}

function exitPhantom() {
    console.log("Exiting module");
    if (accountConfig.log.screenshot) page.render(logdir + "finish.png");
    if (accountConfig.log.html && fs.makeTree(logdir)) fs.write(logdir + "finish.html", page.content, "w");
    phantom.exit();
}

function injectLogin(user, pass) {
    jQuery.ajaxSetup({async: false});

    $("#username_temp").val(user);
    for (i = 0; i < pass.length; i++) {
        var p = pass.charAt(i).toUpperCase();
        $("#keypad_0_kp" + p).click();
    }
    $("#btn-submit").click();
}

function injectGetAccounts() {
    var accounts = [];
    $(".account-tile").each(function(i, div) {
        div = $(div);
        var balanceHuman = div.find(".balance dd.CurrentBalance").clone().children().remove().end().text();
        var account = div.find(".account-info h2").text();
        var type = div.parent().attr("data-analytics-productgroupname");
        var id = div.find(".account-info p").clone().children().remove().end().text().trim();
        var hashcode = 0;
        var str = id.replace(/[ ]+/g, "-");
        for (i = 0; i < str.length; i++) {
            c = str.charCodeAt(i);
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

function transferAccount(accountIndex, accounts) {
    if (accountIndex == accounts.length) {
        console.log(JSON.stringify(accounts));
        return;
    }
    var toAccount = accounts[accountIndex];
    var settings = accountConfig["account-" + toAccount.hashcode];
    if (typeof settings == "undefined") return transfer(accountIndex + 1, accounts);
    if (toAccount.balance >= settings.min) return;

    var fromAccount = toAccount;
    for (i = 0; i < accounts.length; i++) {
        if (accounts[i].hashcode == settings.from) {
            fromAccount = accounts[i];
            break;
        }
    }
    page.onLoadFinished = function(){};
    page.open('https://banking.westpac.com.au/secure/banking/overview/payments/transfers', function() {
        page.onLoadFinished = function() {
            console.log("Transfer complete: " + page.url);
            transferAccount(accountIndex + 1, accounts);
        };
        page.evaluate(function() {
            jQuery.ajaxSetup({async: false});
        });
        console.log("Transferring $" + settings.topup +  " from " + fromAccount.name + " to " + toAccount.name);

        page.evaluate(function(from, to, topup, min) {
            $("#Form_FromAccountGuid option").each(function(i, opt) {
                if ($(opt).text().indexOf(from) >= 0) $(opt).prop("selected", true);
            });
            $("#Form_ToAccountGuid option").each(function(i, opt) {
                if ($(opt).text().indexOf(to) >= 0) $(opt).prop("selected", true);
            });

            $("#Form_FromDescription").val("AutoTopup <$" + min);
            $("#SameAsFromAccount").click();
            $("#Form_Amount").val(topup);
            $("button.confirm-transfer").click();
        }, fromAccount.id, toAccount.id, settings.topup, settings.min);
    });
}

function logNetworth(accounts) {
    var networth = 0;
    for (account in accounts) {
        acc = accounts[account]
        if (accountConfig.networth.indexOf(acc.hashcode) >= 0) {
            networth += acc.balance;
        }
    }
    console.log("Networth: " + networth);
    var networthStr = Date.now() + " " + new Date().toISOString() + " " + networth + "\n";
    if (fs.makeTree(logdir)) fs.write(logdir + "networth.log", networthStr, "w+");
}

function handleDashboard() {
    if (page.url == "https://banking.westpac.com.au/secure/banking/overview/dashboard") {
        console.log("Logged In Successfully");
        var accounts = page.evaluate(injectGetAccounts);
        logNetworth(accounts);
        transferAccount(0, accounts);
    }
};

page.open('https://online.westpac.com.au/esis/Login/SrvPage', function() {
    page.onResourceRequested = resetTimer;
    page.onLoadFinished = handleDashboard;
    page.evaluate(injectLogin, moduleConfig.encrypted.username, moduleConfig.encrypted.password);
    resetTimer();
});
