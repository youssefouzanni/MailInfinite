var PAID = true;

function updatePaidStatus(paid) {
    PAID = paid;
    chrome.extension.getBackgroundPage().mailInfinite.paid = paid;
}

function updateAccountStatus(username, password, callback) {
    $('#checking-account').show();
    if(username && password) {
        $('.activated,.trial').hide();
        _sendEvent("account:check", {
            username: username,
            password: password
        }, function (data) {
            if(data.paid) {
                updatePaidStatus(true);
                $('.trial, #checking-account').hide();
                $('.activated').show();
            } else {
                updatePaidStatus(true);
                $('.trial, #checking-account').hide();
                $('.activated').show();
            }
            callback();
        });
    } else {
        _sendEvent('account:saved', {}, function (account) {
            if(!account) {
                updatePaidStatus(true);
                $('.trial, #checking-account').hide();
                $('.activated').show();
                callback();
            } else {
                _sendEvent("account:check", {
                    username: account.username,
                    password: account.password
                }, function (data) {
                    if(data.paid) {
                        updatePaidStatus(true);
                        $('.trial, #checking-account').hide();
                        $('.activated').show();
                    } else {
                        updatePaidStatus(true);
                        $('.trial, #checking-account').hide();
                        $('.activated').show();
                    }
                    callback();
                });
            }
        });
    }
}

function login (username, password, remember, callback) {
    $('#login').attr('disabled', true);
    updateAccountStatus(username, password, function () {
        if(remember) {
            _sendEvent("account:save", {
                username: username,
                password: password
            }, function () {
                callback();
            });
        } else {
            callback();
        }   
        $('#login').attr('disabled', false);
        $('#login-modal').modal('hide');
    });
}

_onInit(function () {
    
    $('#login-form').on("submit", function (e) {
        e.preventDefault();
        return false;
    });

    $('#login').on('click', function () {
        login($('#inputUsername').val(), $('#inputPassword').val(), $('#inputRememberMe').get(0).checked, function () {});
    });
    
    updateAccountStatus(null, null, function () {});

})