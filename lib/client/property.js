var P = module.exports = ko.mapping.fromJS;
P.array = ko.mapping.fromJS;
P.get = function (v) {
    return v();
};