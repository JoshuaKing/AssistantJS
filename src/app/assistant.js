var crypto = require('crypto');
var process = require('process');
var prompt = require('prompt-sync').prompt;
var fs = require("fs-extra");
var childProcess = require('child_process');
var phantomjs = require('phantomjs');

var config = require(process.cwd() + "/config/configuration.json");
var key = require(process.cwd() + "/config/aes.json").key;

console.log("AssistantJS");

function decrypt(encrypted) {
    var decipher = crypto.createDecipher("aes256", key);
    decipher.update(encrypted, 'base64', 'utf8');
    return decipher.final('utf8');
}

function encrypt(plaintext) {
    var cipher = crypto.createCipher("aes256", key);
    cipher.update(plaintext);
    return cipher.final('base64');
}

childProcess.execFile(phantomjs.path, [process.cwd() + "/src/scripts/phantomjs-westpac.js", "test"]);

console.log("Old Name: " + decrypt(config.name));
console.log("New Name?");
config.name = encrypt(prompt());

console.log(JSON.stringify(config));
fs.writeFile(process.cwd() + "/config/configuration.json", JSON.stringify(config));

