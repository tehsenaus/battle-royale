var coop = require('coop'), P = require('./property');
module.exports = require('../common/player')(P).derived({
    initialize: function (data) {
        this.super(data);
    }
});