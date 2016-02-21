var process = require('process');
var JsonFormatter = require('format-json');
var fs = require("fs-extra");
var prompt = require('prompt-sync').prompt;
var Crypt = require(process.cwd() + '/src/app/crypt.js');
var childProcess = require('child_process');
var phantomjs = require('phantomjs-prebuilt');

var config = require(process.cwd() + "/config/configuration.json");
var key = require(process.cwd() + "/config/aes.json").key;

console.log("AssistantJS");

Crypt.init(key);

function loadModules() {
    var dir = process.cwd() + "/src/modules/";
    var modules = fs.readdirSync(process.cwd() + "/src/modules/");
    for (i = 0; i < modules.length; i++) {
        module = modules[i];
        if (module.indexOf(".ignore") != -1) continue;
        var child = childProcess.execFile(phantomjs.path, [dir + module, process.cwd(), Crypt.decrypt(config.modules.westpac.username), Crypt.decrypt(config.modules.westpac.password)], {cwd: process.cwd()});
        child.stdout.on('data', function(data) {
            console.log(data);
        });
        child.stderr.on('data', function(data) {
            console.log(data);
        });
        console.log("Loaded " + module.replace(/\..{2,4}$/, ""));
    };
}

/*childProcess.execFile(phantomjs.path, [process.cwd() + "/src/scripts/phantomjs-westpac.js", "test"], function(err, stdin, stdout) {
    console.log("Child Phantom Finished");
    console.log(stdout);
});*/

console.log("Old Name: " + config.modules.westpac.password);
console.log("New Name?");
//config.modules.westpac.password = Crypt.encrypt(prompt());


loadModules();


//fs.writeFile(process.cwd() + "/config/configuration.json", JsonFormatter.plain(config));