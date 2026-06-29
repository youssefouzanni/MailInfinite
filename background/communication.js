var listeners = {};

function _addListener(eventName, callback) {
    listeners[eventName] = callback;
};

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if(listeners.hasOwnProperty(request.eventName)) {
        listeners[request.eventName](request.eventData, sender, sendResponse);
        return true;
    };
});

_addListener("account:saved", function (data, sender, respond) {
    mailInfinite.account.saved(function(saved) {
        respond(saved);
    });
});

_addListener("account:check", function (data, sender, respond) {
    mailInfinite.api.registration.status(data.username, data.password, function (status) {
        respond({paid: status == mailInfinite.api.registration.PAID});
    });
})

_addListener("account:save", function (data, sender, respond) {
    mailInfinite.account.save(data.username, data.password, function () {
        respond();
    });
});

_addListener("api:footprints", function (data, sender, respond) {
    mailInfinite.api.footprints.get(function (footprints) {
        respond(footprints);
    });
});