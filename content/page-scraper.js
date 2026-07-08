(function () {
    var EMAIL_REGEXP = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+/gi;

    function extractEmails() {
        var text = document.body.innerText;
        var emails = text.match(EMAIL_REGEXP) || [];
        // Remove duplicates and filter out potential false positives if necessary
        return Array.from(new Set(emails.map(function(e) { return e.toLowerCase(); })));
    }

    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        if (request.eventName === 'page-scraper:extract') {
            var emails = extractEmails();
            sendResponse({ emails: emails });
        }
    });
})();
