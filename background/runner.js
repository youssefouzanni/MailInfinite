var log = new Log('background');

mailInfinite.runner = {
    current: {
        running: false,
        complete: false,
        stopped: false,
        tab: null,
        currentQuery: 0,
        allQueries: [],
        emailsFound: [],
        removeDuplicates: true,
        delay: 5000
    }
};

chrome.storage.local.get('delay', function (items) {
    if ((items.delay !== undefined) && (items.delay !== null)) {
        mailInfinite.runner.current.delay = items.delay * 1000;
    }
})

chrome.runtime.onMessage.addListener(
    function (request, sender) {
        log.i('runtime.onMessage', request.eventName, sender);
        if (request.eventName === 'runner:update') {
            request.eventData.emails.forEach(function (email) {
                if (mailInfinite.runner.current.emailsFound.indexOf(email) === -1) {
                    mailInfinite.runner.current.emailsFound.push(email);
                }
            });

            var popup = chrome.extension.getViews({
                type: 'popup'
            })[0];
            popup && popup.updateNumberOfEmailsFound(mailInfinite.runner.current.emailsFound.length);
        } else if (request.eventName === 'runner:jumpToNextRunner') {
            // Will jump to the next runner as the current page results doesn't have pagination
        } else if (request.eventName === 'runner:robotDetected') {
            log.e('Robot detected! Increasing delay for next query.');
            // Increase delay significantly (e.g., 20-40 seconds extra) to cool down
            mailInfinite.runner.current.extraDelay = 20000 + (Math.random() * 20000);
        } else if (request.eventName === 'runner:finish') {
            // Improved randomization: between 0.8x and 2.0x the base delay
            var multiplier = 0.8 + (Math.random() * 1.2);
            var delay = multiplier * mailInfinite.runner.current.delay;
            
            // Add extra jitter for longer delays
            if (mailInfinite.runner.current.delay > 10000) {
                delay += (Math.random() - 0.2) * 5000;
            }

            // Apply extra delay if robot was detected
            if (mailInfinite.runner.current.extraDelay) {
                delay += mailInfinite.runner.current.extraDelay;
                mailInfinite.runner.current.extraDelay = 0; // Reset after use
            }

            log.w('runtime.onMessage finish query:', mailInfinite.runner.current.currentQuery);

            var currentQuery = mailInfinite.runner.current.currentQuery;
            var allQueries = mailInfinite.runner.current.allQueries;

            if (currentQuery + 1 >= allQueries.length) {
                _onRunnerFinish();
                return;
            }

            mailInfinite.runner.current.currentQuery++;

            setTimeout(_nextRunner, delay);
        } else if (request.eventName === 'runner:stop') {
            mailInfinite.stop();
        } else if (request.eventName === 'download') {
            mailInfinite.download();
        }
    }
)

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    // log.w('onUpdated', tabId, changeInfo, tab);

    if (!mailInfinite.runner.current.running) return;
    if (tabId != mailInfinite.runner.current.tab.id) return;
    // if(changeInfo.status != 'complete') return;

    if (tab.status === 'complete') {
        var current = mailInfinite.runner.current;
        chrome.tabs.sendMessage(tabId, {
            eventName: 'run',
            eventData: {
                removeDuplicates: current.removeDuplicates,
                delay: current.currentQueryDelay,
                foundEmails: current.emailsFound.length,
                queryNumber: current.currentQuery + 1,
                totalQueries: current.allQueries.length,
                queryString: current.allQueries[current.currentQuery],
                queryObject: current.queries[current.currentQuery]
            }
        });

        var popup = chrome.extension.getViews({
            type: 'popup'
        })[0];
        if (popup) {
            popup.updateTotalNumberOfQueries(mailInfinite.runner.current.allQueries.length);
            popup.updateCurrentQueryNumber(mailInfinite.runner.current.currentQuery + 1);
            popup.updateCurrentQueryString(mailInfinite.runner.current.allQueries[mailInfinite.runner.current.currentQuery]);
            popup.updateButtons();
        }
    }
})

function _nextRunner() {
    var currentQuery = mailInfinite.runner.current.currentQuery;
    var allQueries = mailInfinite.runner.current.allQueries;
    log.i('_nextRunner()', currentQuery, allQueries.length);

    if (mailInfinite.runner.current.stopped) {
        return;
    }

    chrome.storage.local.get('cse', function (items) {

        var url = items.cse;
        if (!url) {
            return
        }

        url += '&q=' + encodeURIComponent(allQueries[currentQuery]) + '&ia=web';

        log.i('_nextRunner()', url);

        chrome.tabs.update(mailInfinite.runner.current.tab.id, {
            url: url
        });
    });
}

function _onRunnerStopped() {
    log.i('_onRunnerStopped()');
    mailInfinite.runner.current.stopped = true;
    mailInfinite.runner.current.running = false;
    mailInfinite.runner.current.complete = false;
    var popup = chrome.extension.getViews({
        type: 'popup'
    })[0];
    if (popup) {
        popup.updateButtons();
    }
    chrome.tabs.sendMessage(mailInfinite.runner.current.tab.id, {
        eventName: 'stopped'
    });
    mailInfinite.runner.current.tab = null;
}

function _onRunnerFinish() {
    log.i('_onRunnerFinish()');
    mailInfinite.runner.current.running = false;
    mailInfinite.runner.current.complete = true;
    var popup = chrome.extension.getViews({
        type: 'popup'
    })[0];
    if (popup) {
        popup.hideCurrentQueryString();
        popup.showCompleteStatus();
        popup.updateButtons();
    }
    mailInfinite.runner.current.tab = null;
};

mailInfinite.run = function (queries) {
    log.i('run', queries);

    mailInfinite.runner.current.running = true;
    mailInfinite.runner.current.complete = false;
    mailInfinite.runner.current.stopped = false;
    mailInfinite.runner.current.currentQuery = 0;
    mailInfinite.runner.current.allQueries = queries.str;
    mailInfinite.runner.current.queries = queries.obj;
    mailInfinite.runner.current.emailsFound = [];

    var popup = chrome.extension.getViews({
        type: 'popup'
    })[0];

    log.i('run', !!popup);

    if (popup) {
        popup.updateNumberOfEmailsFound(0);
        popup.updateTotalNumberOfQueries(queries.length);
        popup.updateCurrentQueryNumber(1);
        popup.updateCurrentQueryString(queries[0]);
        popup.showCurrentQueryString();
        popup.hideCompleteStatus();
        popup.updateButtons();
    }

    chrome.tabs.query({
        active: true
    }, function (tabs) {
        mailInfinite.runner.current.tab = tabs[0];
        _nextRunner();
    });
};

mailInfinite.stop = function () {
    _onRunnerStopped();
};

mailInfinite.download = function () {
    var date = new Date;
    var dateString = (date.getDate()) + '-' + (date.getMonth() + 1) + '-' + (date.getFullYear());
    var timeString = date.getHours() + '-' + date.getMinutes();
    var emails = mailInfinite.runner.current.emailsFound
    emails = mailInfinite.paid ? emails : emails.slice(0, 10)
    chrome.downloads.download({
        url: 'data:text/plain;base64,' + btoa(emails.join("\r\n")),
        filename: 'mailinfinite_' + dateString + '_' + timeString + '.txt',
        saveAs: true
    });
};

