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

    modules.forEach(function(module) {
        if (module.indexOf(".ignore") != -1) return;

        var name = module.replace(/\..{2,4}$/, "");
        var configJson = JSON.stringify(config);
        var configModule = config.modules[name];
        for (enc in configModule.encrypted) {
            configModule.encrypted[enc] = Crypt.decrypt(configModule.encrypted[enc]);
        }
        configModule = JSON.stringify(configModule);


        var child = childProcess.execFile(phantomjs.path, [dir + module, process.cwd(), configJson, configModule], {cwd: process.cwd()});
        child.stdout.on('data', function(data) {
            console.log(name + ": " + data);
        });
        child.stderr.on('data', function(data) {
            console.log(name + ": err: " + data);
        });
        console.log("Loaded " + name);
    });;
}

console.log("Old Name: " + config.modules.westpacph.name);
console.log("New Name?");
//config.modules.westpac.password = Crypt.encrypt(prompt());


loadModules();


//fs.writeFile(process.cwd() + "/config/configuration.json", JsonFormatter.plain(config));