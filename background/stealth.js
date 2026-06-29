
var userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15"
];

function getRandomUserAgent() {
    return userAgents[Math.floor(Math.random() * userAgents.length)];
}

chrome.webRequest.onBeforeSendHeaders.addListener(
    function(details) {
        var isSearchRequest = details.url.indexOf('duckduckgo.com') > -1 || details.url.indexOf('google.com') > -1;
        
        if (isSearchRequest) {
            var ua = getRandomUserAgent();
            var hasUA = false;
            var hasReferer = false;
            
            for (var i = 0; i < details.requestHeaders.length; ++i) {
                if (details.requestHeaders[i].name.toLowerCase() === 'user-agent') {
                    details.requestHeaders[i].value = ua;
                    hasUA = true;
                }
                if (details.requestHeaders[i].name.toLowerCase() === 'referer') {
                    details.requestHeaders[i].value = details.url.split('?')[0];
                    hasReferer = true;
                }
            }
            
            if (!hasUA) {
                details.requestHeaders.push({name: 'User-Agent', value: ua});
            }
            if (!hasReferer) {
                details.requestHeaders.push({name: 'Referer', value: details.url.split('?')[0]});
            }

            // Add modern Client Hints
            details.requestHeaders.push({name: 'sec-ch-ua', value: '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"'});
            details.requestHeaders.push({name: 'sec-ch-ua-mobile', value: ua.indexOf('Mobile') > -1 ? '?1' : '?0'});
            details.requestHeaders.push({name: 'sec-ch-ua-platform', value: ua.indexOf('Windows') > -1 ? '"Windows"' : (ua.indexOf('Macintosh') > -1 ? '"macOS"' : '"Linux"')});
            
            // Other headers to look more like a browser
            details.requestHeaders.push({name: 'Accept-Language', value: 'en-US,en;q=0.9'});
            details.requestHeaders.push({name: 'Upgrade-Insecure-Requests', value: '1'});
        }
        return {requestHeaders: details.requestHeaders};
    },
    {urls: ["*://*.google.com/*", "*://*.duckduckgo.com/*", "*://*.google.co.il/*"]},
    ["blocking", "requestHeaders"]
);
