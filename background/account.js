mailInfinite.account = {
    STORAGE_KEY_USERNAME: "username",
    STORAGE_KEY_PASSWORD: "password"
};

mailInfinite.account.saved = function (callback) {
    chrome.storage.local.get([mailInfinite.account.STORAGE_KEY_USERNAME, mailInfinite.account.STORAGE_KEY_PASSWORD], function (items) {
        callback(
            (items[mailInfinite.account.STORAGE_KEY_USERNAME] && items[mailInfinite.account.STORAGE_KEY_PASSWORD]) ? {
                username: items[mailInfinite.account.STORAGE_KEY_USERNAME],
                password: items[mailInfinite.account.STORAGE_KEY_PASSWORD]
            } : null
        );
    });
};

mailInfinite.account.save = function (username, password, callback) {
    var s = {};
    s[mailInfinite.account.STORAGE_KEY_USERNAME] = username;
    s[mailInfinite.account.STORAGE_KEY_PASSWORD] = password;
    chrome.storage.local.set(s, function () {
        callback();
    });
};

mailInfinite.account.clear = function (callback) {
    chrome.storage.local.remove([mailInfinite.account.STORAGE_KEY_USERNAME, mailInfinite.account.STORAGE_KEY_PASSWORD], function () {
        callback();
    });
};