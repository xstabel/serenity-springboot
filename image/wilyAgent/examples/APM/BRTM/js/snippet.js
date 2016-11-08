<script type="text/javascript">try {
    if (navigator && navigator.userAgent) {
        // APM BRTM uses the URL in the current browser window as the URL from which the BRTM
        // instrumentation source code is downloaded. If this is of concern, then change
        // "BRTMInstrumentationLocation" to an absolute URL of your choice, reaching your application server.
        // For example: "http://localhost:5080/myPath/"
        var BRTMInstrumentationLocation = window.location.protocol + "//" + window.location.host +
                                          window.location.pathname;

        var userAgt = navigator.userAgent;
        var isSupported = false;
        var getMajorVersion = function (regExp) {
            var matchArr = userAgt.match(regExp);
            if (matchArr && matchArr.length > 1) {
                var majVer = matchArr[1].split(".");
                if (majVer && majVer.length > 0) { return parseInt(majVer[0]); }
            }
            return 0;
        };
        if (/opera|opr/i.test(userAgt)) {
            isSupported = false;
        } else if (/msie|trident/i.test(userAgt)) {
            if (getMajorVersion(/(?:msie |rv:)(\d+(\.\d+)?)/i) >=
                10) {isSupported = true; }
        } else if (/chrome|crios|crmo/i.test(userAgt)) {
            if (getMajorVersion(/(?:chrome|crios|crmo)\/(\d+(\.\d+)?)/i) >=
                30) { isSupported = true; }
        } else if (/firefox|iceweasel/i.test(userAgt)) {
            if (getMajorVersion(/(?:firefox|iceweasel)[ \/](\d+(\.\d+)?)/i) >=
                30) { isSupported = true; }
        } else if (/safari/i.test(userAgt)) {
            if (getMajorVersion(/version\/(\d+(\.\d+)?)/i) >= 7) { isSupported = true; }
        } else { isSupported = false }
        (function (goAhead) {
            if (!goAhead) {
                var httpRequest = null;
                if (window.XMLHttpRequest) { // Mozilla, Safari, IE7+ ...
                    httpRequest = new XMLHttpRequest();
                } else if (window.ActiveXObject) { // IE 6 and older
                    httpRequest = new ActiveXObject("Microsoft.XMLHTTP");
                }
                if (httpRequest) {
                    var postURL = window.location.protocol + "//" + window.location.host +
                                  window.location.pathname + "?WilyCmd=cmdMetrics";
                    httpRequest.open('POST', postURL, true);
                    httpRequest.setRequestHeader('Content-Type',
                                                 'application/x-www-form-urlencoded');
                    var postData = "UB=true"; // Unsupported Browser
                    httpRequest.send(postData);
                }
                return;
            }
            window.addEventListener("beforeunload", function () {
                if (window.Storage) {
                    // Note: removeItem API is idempotent
                    sessionStorage.removeItem(window.location.pathname);
                }
            });
            // Page hide event is used in browsers that do not support the window event
            // onbeforeunload event (e.g. Mobile Safari and Google Chrome)
            window.addEventListener("pagehide", function () {
                if (window.Storage) {
                    // Note: removeItem API is idempotent
                    sessionStorage.removeItem(window.location.pathname);
                }
            });
            if (window.Storage) {
                // Prevent multiple JS snippet insertions
                var isInstrumented = sessionStorage.getItem(window.location.pathname);
                if (isInstrumented && isInstrumented === "true") {
                    return;
                }
            }
            var cmdPrefix = "?WilyCmd=";
            var type = "text/javascript";
            var insertSnippet = function (isAsync, cmd) {
                var brtmSnippet = document.createElement('script');
                brtmSnippet.type = type;
                brtmSnippet.async = isAsync;
                brtmSnippet.src = BRTMInstrumentationLocation + cmdPrefix + cmd;
                var snip = document.getElementsByTagName('script')[0];
                snip.parentNode.insertBefore(brtmSnippet, snip);
            };
            insertSnippet(true, "cmdJS");
            if (window.Storage) {
                sessionStorage.setItem(window.location.pathname, "true");
            }
        })(isSupported);
    }
} catch (e) {}
</script>