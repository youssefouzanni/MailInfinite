mailInfinite.api = {};

mailInfinite.api.registration = {
    PAID: "paid",
    TRIAL: "paid"
};

mailInfinite.api.registration.status = function (username, password, callback) {
    callback(mailInfinite.api.registration.PAID);
};

mailInfinite.api.footprints = {};

function _parseFootprints(str) {
    return str.split(/[\n]+/g).slice(0, -1).map(function (s) {
        var s = s.split(/\*/g);
        return {
            name: s[0],
            value: s[1]
        };
    });
}

mailInfinite.api.footprints.get = function (callback) {
    $.ajax({
        url: mailInfinite.config.api.footprints.url,
        method: mailInfinite.config.api.footprints.method,
        cache: false,
        success: function (data) {
            callback(_parseFootprints(data));
        }
    });
};