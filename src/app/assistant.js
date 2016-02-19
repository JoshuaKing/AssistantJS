var crypto = require('crypto');
var process = require('process');
var config = require(process.cwd() + "/config/configuration.json");
var key = require(process.cwd() + "/config/aes.json").key;

console.log("AssistantJS");

var decipher = crypto.createDecipher("aes256", key);
decipher.update(config.name, 'base64', 'utf8');
console.log(decipher.final('utf8'));

