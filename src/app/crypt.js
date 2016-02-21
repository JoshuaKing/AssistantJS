var crypto = require('crypto');

var key = "123456";

exports.init = function(k) {
    key = k;
}

exports.decrypt = function(encrypted) {
    var decipher = crypto.createDecipher("aes256", key);
    decipher.update(encrypted, 'base64', 'utf8');
    return decipher.final('utf8');
}

exports.encrypt = function(plaintext) {
    var cipher = crypto.createCipher("aes256", key);
    cipher.update(plaintext);
    return cipher.final('base64');
}