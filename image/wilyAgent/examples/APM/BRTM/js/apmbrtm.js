try {
    /**
     * This object is responsible for BRTM Browser Logging
     */
    var BRTMLogger = {
        // All BRTM Browser logs precede with [APM BRTM]:
        logPrefix : " [APM BRTM]: ",
        // Currently, the log levels cannot be configured from the Agent. It is merely a placeholder
        // to think about in the next release. So, the browser code is currently logging them under
        // different levels, which is not very useful at this point.
        logLevelPrefix : {
            DEBUG : " [DEBUG] ",
            ERROR : " [ERROR] ",
            INFO : " [INFO] ",
            WARN : " [WARN] "
        },
        /**
         * This function logs the given msg to the browser console as a DEBUG msg
         * @param msg - message that is to be logged
         */
        debug : function (msg) {
            if (BRTMLogger.isOk()) {
                window.console.log(BRTMUtils.timeUtils.getCurrTime() + BRTMLogger.logPrefix +
                                   BRTMLogger.logLevelPrefix.DEBUG + msg);
            }
        },
        /**
         * This function logs the given msg to the browser console as a ERROR msg
         * @param msg - message that is to be logged
         */
        error : function (msg) {
            if (BRTMLogger.isOk()) {
                window.console.log(BRTMUtils.timeUtils.getCurrTime() + BRTMLogger.logPrefix +
                                   BRTMLogger.logLevelPrefix.ERROR + msg);
            }
        },
        /**
         * This function logs the given msg to the browser console as a INFO msg
         * @param msg - message that is to be logged
         */
        info : function (msg) {
            if (BRTMLogger.isOk()) {
                window.console.log(BRTMUtils.timeUtils.getCurrTime() + BRTMLogger.logPrefix +
                                   BRTMLogger.logLevelPrefix.INFO + msg);
            }
        },
        /**
         * This functions makes sure that there is a console to log and the logging is enabled
         * @returns {boolean}
         */
        isOk : function () {
            if (!window[BRTMUtils.configUtils.configNames.BRTM_BROWSERLOGGINGENABLED]
                    || !window.console || typeof window.console != "object") {
                return false
            }
            return true;
        },
        /**
         * This function logs the given msg to the browser console as a WARN msg
         * @param msg
         */
        warn : function (msg) {
            if (BRTMLogger.isOk()) {
                window.console.log(BRTMUtils.timeUtils.getCurrTime() + BRTMLogger.logPrefix +
                                   BRTMLogger.logLevelPrefix.WARN + msg);
            }
        }
    };
    /**
     * This object provides utility functions
     */
    var BRTMUtils = {
        BRTMTimer : null,
        /**
         * Initializes each Utility
         */
        init : function () {
            BRTMUtils.BRTMTimer = BRTMUtils.timeUtils.getTimerObj();
            BRTMUtils.configUtils.init();
            if (BRTMUtils.configUtils.isPageExcluded) {
                BRTMLogger.info("Skipping all instrumentation because page is configured to be EXCLUDED.");
                return;
            }
            BRTMUtils.browserUtils.init();
            BRTMUtils.cookieUtils.init();
            BRTMUtils.funcUtils.init();
            BRTMUtils.metricUtils.init();
        },
        /**
         * Browser Utility
         * Responsible for browser related tasks: Geo-Location, User Agent Parsing
         */
        browserUtils : {
            CorBrowsGUID : null,
            geoCookie : null,
            platform : -1,
            platformVer : -1,
            TTFlag : 0,
            unknownPlatform : "Unsupported",
            unknownPlatformVer : "X",
            init : function () {
                if (navigator && navigator.userAgent) {
                    var browserInfo = this.getBrowserInfo(navigator.userAgent);
                    BRTMGlobals.p = browserInfo.name;
                    BRTMGlobals.pv = browserInfo.version;
                } else {
                    BRTMLogger.warn("browserUtils.init : navigator object is not found");
                    BRTMGlobals.p = this.unknownPlatform;
                    BRTMGlobals.pv = this.unknownPlatformVer;
                }
                // Obtain Geo-Location upon page load and store the location inside a cookie
                // For the remainder of the session, use the same geo-location co-ordinates
                if (window[BRTMUtils.configUtils.configNames.BRTM_GEOENABLED]) {
                    this.getGeoLocation();
                }
            },
            /**
             * Obtains the Browser Name and Browser Major Version given the User Agent string
             * @param userAgt - User Agent String from the browser
             * @returns {{name: string, version: string}}
             */
            getBrowserInfo : function (userAgt) {
                var browserName = this.unknownPlatform;
                var majorVersion = this.unknownPlatformVer;
                if (!userAgt) {
                    BRTMLogger.warn("getBrowserInfo : User Agent is not found.");
                    return { name : browserName, version : majorVersion };
                }
                // A private function to obtain the browser's Major Version #
                // Note: regExp must be without the 'g' flag
                function getMajorVersion (regExp) {
                    var matchArr = userAgt.match(regExp);
                    if (matchArr && matchArr.length > 1) {
                        var majVer = matchArr[1].split(".");
                        if (majVer && majVer.length > 0) { return majVer[0]; }
                    }
                    return this.unknownPlatformVer;
                }

                if (/opera|opr/i.test(userAgt)) {
                    // Do nothing
                } else if (/msie|trident/i.test(userAgt)) {
                    browserName = BRTMGlobals.platformNames.IE;
                    majorVersion = getMajorVersion(/(?:msie |rv:)(\d+(\.\d+)?)/i);
                } else if (/chrome|crios|crmo/i.test(userAgt)) {
                    browserName = BRTMGlobals.platformNames.CHROME;
                    majorVersion = getMajorVersion(/(?:chrome|crios|crmo)\/(\d+(\.\d+)?)/i);
                } else if (/firefox|iceweasel/i.test(userAgt)) {
                    browserName = BRTMGlobals.platformNames.FIREFOX;
                    majorVersion = getMajorVersion(/(?:firefox|iceweasel)[ \/](\d+(\.\d+)?)/i);
                } else if (/safari/i.test(userAgt)) {
                    browserName = BRTMGlobals.platformNames.SAFARI;
                    majorVersion = getMajorVersion(/version\/(\d+(\.\d+)?)/i);
                }
                return { name : browserName, version : majorVersion };
            },
            /**
             * Obtain Latitude and Longitude with HTML5 Geo-Location API
             * Note: The Latitude and Longitude will be returned by the Callbacks
             */
            getGeoLocation : function () {
                if (!navigator || !navigator.geolocation) {
                    BRTMLogger.warn("getGeoLocation : Geolocation is not supported in this browser.");
                    BRTMUtils.cookieUtils.updateCookie(BRTMUtils.cookieUtils.cookies.GEO,
                                                       {"lat" : -255,
                                                           "long" : -255
                                                       });
                    return;
                }
                // Don't compute Geo-location if Lat and Long is already present in GEO Cookie
                var geoCookie = BRTMUtils.cookieUtils.getCookieObject(BRTMUtils.cookieUtils.cookies.GEO);
                if (geoCookie) {
                    return;
                }
                var timeout = window[BRTMUtils.configUtils.configNames.BRTM_GEOTIMEOUT];
                var maxAge = window[BRTMUtils.configUtils.configNames.BRTM_GEOMAXIMUMAGE];
                var accuracy = window[BRTMUtils.configUtils.configNames.BRTM_GEOHIGHACCURACYENABLED];
                var options = {
                    timeout : timeout,
                    maximumAge : maxAge,
                    enableHighAccuracy : accuracy
                };
                navigator.geolocation.getCurrentPosition(this.geoLocationFound,
                                                         this.geoLocationNotFound, options);
                // In some browsers, the error callback is never called upon cancellation of the 
                // location popup (e.g. clicking the X button) and in some browsers, the timeout
                // option is non-functional. So, do it ourselves. 
                // After timeout and some grace time period, set the geo location session cookie to 
                // the same values as those of an error condition
                setTimeout(function () {
                    if (!BRTMUtils.cookieUtils.getCookieObject(BRTMUtils.cookieUtils.cookies.GEO)) {
                        BRTMLogger.warn("getGeoLocation: never received a response for Geolocation. Setting co-ordinates to -255,-255.");
                        BRTMUtils.cookieUtils.updateCookie(BRTMUtils.cookieUtils.cookies.GEO,
                                                           {"lat" : -255,
                                                               "long" : -255
                                                           });
                    }
                }, parseInt(timeout) + 5000);
            },
            /**
             * Success Callback for getGeoLocation
             * @param position - HTML5 position object
             */
            geoLocationFound : function (position) {
                BRTMUtils.cookieUtils.updateCookie(BRTMUtils.cookieUtils.cookies.GEO,
                                                   {"lat" : position.coords.latitude,
                                                       "long" : position.coords.longitude
                                                   });
            },
            /**
             * Error Callback for getGeoLocation
             * @param error - error code from the HTML5 geolocation API
             */
            geoLocationNotFound : function (error) {
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        BRTMLogger.warn("geoLocationNotFound : Browser indicates that user denied the request for Geolocation.");
                        break;
                    case error.POSITION_UNAVAILABLE:
                        BRTMLogger.warn("geoLocationNotFound : Browser's Geolocation information is unavailable.");
                        break;
                    case error.TIMEOUT:
                        BRTMLogger.warn("geoLocationNotFound : Browser's request to obtain Geolocation timed out.");
                        break;
                    default:
                        BRTMLogger.warn("geoLocationNotFound : An unknown error occurred while browser attempted Geolocation.");
                        break;
                }
                BRTMUtils.cookieUtils.updateCookie(BRTMUtils.cookieUtils.cookies.GEO,
                                                   {"lat" : -255,
                                                       "long" : -255
                                                   });
            }
        },
        /**
         * Config Utility
         * Responsible for Agent <---> Browser Configuration
         */
        configUtils : {
            /**
             * Known configuration parameter MACROS
             */
            configNames : {
                // Toggles AJAX metrics
                BRTM_AJAXMETRICSENABLED : "BRTM_AJAXMETRICSENABLED",
                // Threshold to control AJAX metrics
                // Note: AJAX calls for which the Total Resource Load Time < threshold,
                //       AJAX metrics are ignored
                BRTM_AJAXMETRICSTHRESHOLD : "BRTM_AJAXMETRICSTHRESHOLD",
                // Toggles Browser Logging
                BRTM_BROWSERLOGGINGENABLED : "BRTM_BROWSERLOGGINGENABLED",
                // Toggles BRTM
                BRTM_ENABLED : "BRTM_ENABLED",
                // List of URL paths for which the BRTM monitoring is to be ignored
                // Exact Match only, No regex matching
                BRTM_EXCLUDELIST : "BRTM_EXCLUDELIST",
                // Toggles Geo-Location
                BRTM_GEOENABLED : "BRTM_GEOENABLED",
                // Toggles Geo-Location High Accuracy Mode
                BRTM_GEOHIGHACCURACYENABLED : "BRTM_GEOHIGHACCURACYENABLED",
                // Specifies the interval for which the previous Geo-Location values are to be used
                BRTM_GEOMAXIMUMAGE : "BRTM_GEOMAXIMUMAGE",
                // Specifies the interval to wait for the current Geo-Location calculation
                BRTM_GEOTIMEOUT : "BRTM_GEOTIMEOUT",
                // List of URL paths for which the BRTM monitoring is to be used
                // Exact Match only, No regex matching
                BRTM_INCLUDELIST : "BRTM_INCLUDELIST",
                // Toggles JS function metrics
                BRTM_JSFUNCTIONMETRICSENABLED : "BRTM_JSFUNCTIONMETRICSENABLED",
                // Note: JS function calls for which the Average Execution Time < threshold,
                //       JS function metrics are ignored
                BRTM_JSFUNCTIONMETRICSTHRESHOLD : "BRTM_JSFUNCTIONMETRICSTHRESHOLD",
                // Specifies the frequency of BRTM metric dispatch from the browser
                BRTM_METRICFREQUENCY : "BRTM_METRICFREQUENCY",
                // Toggles page load metrics
                BRTM_PAGELOADMETRICSENABLED : "BRTM_PAGELOADMETRICSENABLED",
                // Threshold to control page load metrics
                // Note: Pages for which the Average Page Load Complete Time < threshold,
                //       page load metrics are ignored
                BRTM_PAGELOADMETRICSTHRESHOLD : "BRTM_PAGELOADMETRICSTHRESHOLD",
                // Toggles metrics based on URL context
                BRTM_URLMETRICOFF : "BRTM_URLMETRICOFF",
                // URL to which the metrics are to be dispatched
                BRTM_WILYURL : "BRTM_WILYURL",
                // Adjust TT StartTime when this property is enabled
                BRTM_TTSTARTTIMEADJUSTMENTENABLED : "BRTM_TTSTARTTIMEADJUSTMENTENABLED"
            },
            /**
             * Default values for the known configuration parameters
             */
            defaults : {
                BRTM_AJAXMETRICSENABLED : true,
                BRTM_AJAXMETRICSTHRESHOLD : 10,
                BRTM_BROWSERLOGGINGENABLED : false,
                BRTM_ENABLED : true,
                BRTM_EXCLUDELIST : [],
                BRTM_GEOENABLED : false,
                BRTM_GEOHIGHACCURACYENABLED : false,
                BRTM_GEOMAXIMUMAGE : 10000,
                BRTM_GEOTIMEOUT : 5000,
                BRTM_INCLUDELIST : [],
                BRTM_JSFUNCTIONMETRICSENABLED : false,
                BRTM_JSFUNCTIONMETRICSTHRESHOLD : 10,
                BRTM_METRICFREQUENCY : 0,
                BRTM_PAGELOADMETRICSENABLED : true,
                BRTM_PAGELOADMETRICSTHRESHOLD : 10,
                BRTM_URLMETRICOFF : false,
                BRTM_WILYURL : window.location.protocol + "//" + window.location.host +
                               window.location.pathname + "?WilyCmd=cmdMetrics",
                BRTM_TTSTARTTIMEADJUSTMENTENABLED: true
            },
            init : function () {
                // Initialize window configs
                for (var configName in BRTMUtils.configUtils.configNames) {
                    window[configName] = BRTMUtils.configUtils.getConfig(configName);
                }
                BRTMUtils.configUtils.isPageExcluded = BRTMUtils.configUtils.isExcluded(BRTMGlobals.currentFullURL);
            },
            isPageExcluded : false,
            /**
             * Obtains the current configuration given a valid configuration parameter
             * @param configParam - String from the configUtils.configNames
             * @returns {*} - configuration value if found; else, null
             */
            getConfig : function (configParam) {
                if (!configParam || typeof configParam != 'string' ||
                    !this.configNames[configParam]) {
                    BRTMLogger.warn("getConfig : Could not obtain configuration for invalid parameter [ " +
                                    configParam + " ]");
                    return null;
                }
                if (window[configParam] != null && window[configParam] != undefined) {
                    return window[configParam];
                }
                return BRTMUtils.configUtils.defaults[configParam];
            },
            /**
             * Get the full url of a given url including protocol, host, port, pathname and query parameters
             * @param url - url string that can be a relative path or a full url
             * @returns full url including protocol, host, port, pathname and query parameters
             */
            getFullURL : function (url) {
                if (!url || typeof url !== 'string') {
                    BRTMLogger.warn("getFullURL : Not a valid URL. Skipping parse...");
                    return;
                }
                // Note: there is no need to remove the element as the element is removed
                // outside the scope of this method as it has no parent
                var parser = document.createElement('a');
                // Let the browser do the work
                parser.href = url;
                return parser.href;
            },
            /**
             * Determines if the given full URL is to be ignored for BRTM by comparing to the
             * ExcludeURLList and IncludeURLList
             * @param url - url path with no trailing slashes
             * @returns boolean : true if the given URL is to be excluded; false otherwise
             */
            isExcluded: function (url) {
                if (!url || typeof url !== 'string') {
                    BRTMLogger.warn("isExcluded: Not a valid URL. Skipping exclusion check...");
                    return false;
                }
                var includeUrlList = window[BRTMUtils.configUtils.configNames.BRTM_INCLUDELIST];
                var excludeUrlList = window[BRTMUtils.configUtils.configNames.BRTM_EXCLUDELIST];
                // after init, includeUrlList and excludeUrlList will not be null so no need to check
                if ((excludeUrlList.length > 0 && BRTMUtils.configUtils.isUrlInRegexList(url, excludeUrlList)) ||
                    (includeUrlList.length > 0 && !BRTMUtils.configUtils.isUrlInRegexList(url, includeUrlList))) {
                    return true;
                }
                return false;
            },
            /**
             * Determines if an url matches a pattern in the regex list
             * @param url - to be tested
             * @param list - regex list
             * @returns {boolean}
             */
            isUrlInRegexList: function (url, list) {
                for (var i = 0; i < list.length; i++) {
                    if ((new RegExp(list[i])).test(url)) {
                        return true;
                    }
                }
                return false;
            }
        },
        /**
         * Cookie Utility
         * Responsible for managing BRTM cookies
         */
        cookieUtils : {
            /**
             * Cookies used between browser and the Agent
             */
            cookies : {
                // Response Cookie to Agent
                // Stores business txn information as sent by the agent
                BTRESP : "x-apm-brtm-response-bt",
                // Request Cookie to Agent
                // Stores an unique identifier for an instrumented AJAX call
                BTRESPID : "x-apm-brtm-response-bt-id",
                // Response Cookie from Agent
                // Stores business txn information for the current page as sent by the agent
                BTPAGERESP : "x-apm-brtm-response-bt-page",
                // Request Cookie to Agent
                // Stores Latitude and Longitude from HTML5 Geo-Location API
                GEO : "x-apm-brtm-geo",
                // Request Cookie to Agent
                // Stores page load times
                // Note: Inherited from old BRTM
                GLOBAL : "WMRUMC",
                // Request Cookie to Agent
                // Stores Browser Name
                PLATFORM : "x-apm-brtm-bt-p",
                // Request cookie to agent
                // Stores browser major version
                PLATFORMVER : "x-apm-brtm-bt-pv",
                // Request cookie to agent
                // Stores BRTM self-instrumented flag
                // Used to prevent the agent from inserting BRTM JS snippet more than once
                SNIPPET : "x-apm-brtm-snippet",
                // Request cookie to agent
                // Stores URL information of the current page
                URL : "x-apm-brtm-bt-url"
            },
            /**
             * Keys inside BTRESP, BTPAGERESP as defined above
             */
            cookieKeys : {
                // Introscope txn trace start time
                apmStartTimeChar : "startTime",
                // Business segment
                bsChar : "bs",
                // Business txn
                btChar : "bt",
                // Business txn component
                btcChar : "btc",
                // Txn Trace Correlation ID
                CorBrowsGUIDChar : "CorBrowsGUID",
                // Geo-location
                geoChar : "g",
                // Browser name
                platformChar : "p",
                // Browser major version
                platformVerChar : "pv",
                // Txn trace flag
                ttChar : "c"
            },
            document : document,
            init : function () { /* EMPTY */ },
            /**
             * Delete a cookie given its name
             * Note: The path and domain must match that of the cookie at the time it was created
             * @param name - name of the cookie to be deleted
             * @param path - path of the cookie at the time it was created
             * @param domain - domain of the cookie at the time it was created
             */
            deleteCookie : function (name, path, domain) {
                if (!name) {
                    BRTMLogger.warn("deleteCookie : Cannot delete cookie by name " + name);
                    return;
                }
                this.document.cookie = name + "=" + "; expires=Thu, 01-Jan-1970 00:00:01 GMT" +
                                       ((domain ) ? "; domain=" + domain : "" ) +
                                       ((path ) ? "; path=" + path : "");
            },
            /**
             * Obtain cookie given a name
             * @param name - name of cookie to get
             * @returns {string}
             */
            getCookie : function (name) {
                var cName = "";
                if (!name) {
                    BRTMLogger.warn("getCookie : Cannot obtain cookie - " + name);
                    return cName;
                }
                var pCookies = document.cookie.split('; ');
                for (var bb = 0; bb < pCookies.length; bb++) {
                    var NmeVal = pCookies[bb].split('=');
                    if (NmeVal[0] == name) {
                        cName = NmeVal[1];
                    }
                }
                return decodeURIComponent(cName);
            },
            /**
             * Obtain the cookie object, given a name
             * @param cookie  - name of the cookie object
             * @returns {*}
             */
            getCookieObject : function (cookie) {
                if (cookie) {
                    return JSON.parse(this.getRawCookie(cookie));
                }
                return JSON.parse(this.getRawCookie(this.cookies.GLOBAL));
            },
            /**
             * Given a name, obtain the corresponding cookie value
             * @param name - name of the cookie
             * @returns {*}
             */
            getRawCookie : function (name) {
                if (!name) {
                    BRTMLogger.warn("getRawCookie : Cannot obtain cookie " + name);
                    return null;
                }
                if (this.document.cookie.length > 0) {
                    var cs = this.document.cookie.indexOf(name + "=");
                    if (cs !== -1) {
                        cs = cs + name.length + 1;
                        var ce = this.document.cookie.indexOf(";", cs);
                        if (ce === -1) {
                            ce = this.document.cookie.length;
                        }
                        return decodeURIComponent(this.document.cookie.substring(cs,
                                                                                 ce));
                    } else {
                        return null;
                    }
                } else {
                    return null;
                }
            },
            /**
             * Tokenize a given cookie value into a JS map
             * @param str - value of a cookie as a String
             * @param delimiter - token to split the cookie value by
             * @returns {{}}
             */
            tokenizeCookieIntoMap : function (str, delimiter) {
                var map = {};
                if (!str || !delimiter) {
                    BRTMLogger.warn("tokenizeCookieIntoMap : Cannot parse " + str + " by " +
                                    delimiter);
                    return map;
                }
                str = decodeURIComponent(str).replace(/["]/g, "");
                var lines = str.split(delimiter);
                for (var i = 0; i < lines.length; i++) {
                    var pieces = lines[i].split("=");
                    if (pieces.length === 2) {
                        map[pieces[0]] = pieces[1];
                    }
                }
                return map;
            },
            /**
             * Set a cookie into document.cookie
             * @param name - name of the cookie to be created
             * @param value - value of the cookie to be stored
             * @param expiry - the number of seconds this cookie is to
             *                 be active from the time of creation
             * @param path - path for the cookie (e.g. /)
             * @param domain - domain for the cookie
             */
            setRawCookie : function (name, value, expiry, path, domain) {
                if (!name) {
                    BRTMLogger.warn("setRawCookie : Cannot set cookie with name " + name);
                    return;
                }
                var et = new Date(BRTMUtils.timeUtils.getCurrTimeInMillisSinceEpoch() +
                                  (expiry * 1000));
                this.document.cookie = name + "=" + encodeURIComponent(value) +
                                       ((expiry) ? "; expires=" + et.toUTCString() : "" ) +
                                       ((domain ) ? "; domain=" + domain : "" ) +
                                       ((path ) ? "; path=" + path : "");
            },
            /**
             * Sets 3 request cookies
             * # 1 : x-apm-brtm-bt-p --> Browser name
             * # 2 : x-apm-brtm-bt-pv --> Browser major version
             * # 3 : x-apm-brtm-bt-url --> Current page URL information
             */
            setBRTMGlobalDataCookie : function () {
                BRTMUtils.cookieUtils.setRawCookie(BRTMUtils.cookieUtils.cookies.PLATFORM,
                                                   BRTMGlobals[BRTMUtils.cookieUtils.cookieKeys.platformChar],
                                                   null, BRTMGlobals.forwardSlashChar, null);
                BRTMUtils.cookieUtils.setRawCookie(BRTMUtils.cookieUtils.cookies.PLATFORMVER,
                                                   BRTMGlobals[BRTMUtils.cookieUtils.cookieKeys.platformVerChar],
                                                   null, BRTMGlobals.forwardSlashChar, null);
                BRTMUtils.cookieUtils.setRawCookie(BRTMUtils.cookieUtils.cookies.URL,
                                                   BRTMGlobals.forwardSlashChar, null,
                                                   BRTMGlobals.forwardSlashChar, null);
            },
            /**
             * Sets a x-apm-brtm-snippet cookie with the given value
             * to indicate that this webpage has already been instrumented
             * @param value - string ('false' - Cookie is to be deleted; 'true' - create the cookie)
             */
            setSelfInstrumentedCookie : function (value) {
                if (value == null || value == undefined || typeof value != 'string') {
                    BRTMLogger.warn("setSelfInstrumentedCookie : " + value + " must be a string.");
                    return;
                }
                if (value === "false") {
                    BRTMLogger.info("Removing self-instrumented flag...");
                    if (window.Storage) {
                        sessionStorage.removeItem(window.location.pathname);
                    }
                    return;
                }
                BRTMLogger.info("Setting self-instrumented flag to " + value);
                if (window.Storage) {
                    sessionStorage.setItem(window.location.pathname, "true");
                }
            },
            /**
             * Update an existing cookie in document.cookie
             * Note: the cookie value must be a JS object
             * @param cookieName - name of the cookie that is to be updated
             * @param value - value to update with
             */
            updateCookie : function (cookieName, value) {
                if (!cookieName) {
                    BRTMLogger.warn("updateCookie : cannot update cookie with name " + cookieName);
                    return;
                }
                var cookieObject = JSON.parse(this.getRawCookie(cookieName));
                var newCookieObject = {};
                for (var i in cookieObject) {
                    newCookieObject[i] = cookieObject[i];
                }
                for (var j in value) {
                    if (value[j] != null) {
                        newCookieObject[j] = value[j];
                    } else {
                        delete newCookieObject[j];
                    }
                }
                this.setRawCookie(cookieName,
                                  JSON.stringify(newCookieObject), null,
                                  "/", null);
            },
            /**
             * Update a given object holding AJAX data with AJAX data from the cookie
             * @param cookieData - cookie data containing tokens from cookieUtils.cookieKeys
             * @param objToUpdate - a JS object containing AJAX related data
             */
            updateObjWithCookieDataAjax : function (cookieData, objToUpdate) {
                if (!cookieData || !objToUpdate || typeof cookieData !== 'object'
                    || typeof objToUpdate !== 'object') {
                    BRTMLogger.warn("updateObjWithCookieDataAjax : cannot update object with data from cookie");
                    return;
                }
                var key;
                var decodedCookieVal;
                for (var item in BRTMUtils.cookieUtils.cookieKeys) {
                    key = BRTMUtils.cookieUtils.cookieKeys[item];
                    if (cookieData[key]) {
                        decodedCookieVal = decodeURIComponent(cookieData[key]);
                        switch (key) {
                            case BRTMUtils.cookieUtils.cookieKeys.CorBrowsGUIDChar :
                                objToUpdate[key] = decodedCookieVal;
                                break;
                            case BRTMUtils.cookieUtils.cookieKeys.bsChar :
                                objToUpdate[key] =
                                (decodedCookieVal === BRTMGlobals.UNDEFINED ) ?
                                    BRTMGlobals[key] : decodedCookieVal;
                                break;
                            case BRTMUtils.cookieUtils.cookieKeys.btChar :
                                objToUpdate[key] =
                                (decodedCookieVal === BRTMGlobals.UNDEFINED ) ?
                                    BRTMGlobals[key] : decodedCookieVal;
                                break;
                            case BRTMUtils.cookieUtils.cookieKeys.btcChar :
                                objToUpdate[key] =
                                (decodedCookieVal === BRTMGlobals.UNDEFINED ) ?
                                    BRTMGlobals[key] : decodedCookieVal;
                                break;
                            default :
                                objToUpdate[key] = decodedCookieVal;
                                break;
                        }
                    }
                }
            },
            /**
             * Update a given object holding page data with page data from the cookie
             * @param cookieData - cookie data containing tokens from cookieUtils.cookiekeys
             */
            updateObjWithCookieDataPage : function (cookieData) {
                if (!cookieData || typeof cookieData !== 'object') {
                    BRTMLogger.warn("updateObjWithCookieDataPage : cannot update object with data from cookie");
                    return;
                }
                var key;
                for (var item in BRTMUtils.cookieUtils.cookieKeys) {
                    key = BRTMUtils.cookieUtils.cookieKeys[item];
                    if (cookieData[key]) {
                        BRTMGlobals[key] = decodeURIComponent(cookieData[key]);
                    }
                }
            }
        },
        /**
         * Function Utility
         * Responsible for JS Function instrumentation
         */
        funcUtils : {
            init : function () {
                try {
                    // Add the XHR functions to be instrumented
                    this.addFuncToGlobalsInstrumentMap("XHR_Open",
                                                       {name : "XMLHttpRequest.prototype.open"});
                    this.addFuncToGlobalsInstrumentMap("XHR_Send",
                                                       {name : "XMLHttpRequest.prototype.send"});
                    // EXTENSION POINT to add JS functions in the window scope to be instrumented
                    if (BRTMExtension) {
                        BRTMExtension.extAddJSFuncToInstrument();
                    }
                    // Instrument the JS functions that were added above
                    this.instrumentAllFunc();
                } catch (e) {
                    BRTMLogger.error("funcUtils.init : " + e.message);
                }
            },
            /**
             * Adds a JS Function with the given key into BRTMGlobals.functionsToInstrument
             * @param key - an unique string
             * @param obj (e.g. {name : "XMLHttpRequest.prototype.open"}
             * Note: Add 'prototype' keyword for all JS member functions
             */
            addFuncToGlobalsInstrumentMap : function (key, obj) {
                if (!key || typeof key !== 'string' || !obj || typeof obj !== 'object') {
                    BRTMLogger.warn("addFuncToGlobalsInstrumentMap: could not add JS Function because key or value is not of the correct type");
                    return;
                }
                // Check for mandatory fields inside the given function object
                if (!obj.name || typeof obj.name !== 'string') {
                    BRTMLogger.warn("addFuncToGlobalsInstrumentMap: value does not contain the mandatory field 'name'");
                    return;
                }
                // Add Function
                // NOTE: this will not work in IE8 and below
                Object.defineProperty(BRTMGlobals.functionsToInstrument, key, {
                    value : obj,
                    writable : true,
                    enumerable : true,
                    configurable : true
                });
            },
            /**
             * Trace function that succeeds the monitored application source
             * @returns {*}
             */
            endTrace : function () {
                return BRTMUtils.timeUtils.getCurrTimeInMillis();
            },
            /**
             * Instruments a given JS Function by redefining it with BRTM logic.
             * @param funcInString - name of the function to instrument as a string
             * @param key - the unique string that was used to add this function with
             *              addFuncToGlobalsInstrumentMap
             * @param maxRetryCount - Try to leave this alone as the retry logic depends on it
             * @returns function
             */
            instrumentFunc : function (funcInString, key, maxRetryCount) {
                if (!BRTMGlobals.functionsToInstrument) {
                    BRTMLogger.info("Nothing to instrument.");
                    return null;
                }
                if (!funcInString || typeof funcInString !== 'string' || !key) {
                    BRTMLogger.warn("instrumentFunc: Function name was not specified. Skipping instrumentation...");
                    return null;
                }
                try {
                    eval("var origObjFromWindow = (window." + funcInString + ") ? window." +
                         funcInString + " : null;");
                } catch (e) {
                    // Instrumentation could fail if the JS Function to instrument
                    // has not come into the window's scope yet. As an example, consider function
                    // A() in another file that would be downloaded from a CDN at a later time than
                    // our BRTM JS code. So, we retry the instrumentation for N number of times.
                    if (maxRetryCount == null || maxRetryCount == undefined) {
                        maxRetryCount = 5;
                    }
                    if (maxRetryCount < 0) {
                        BRTMLogger.warn("instrumentFunc: JS Function [" + funcInString +
                                        "] could not be instrumented.");
                    } else {
                        BRTMLogger.info("Retrying instrumentation for JS Function [" +
                                        funcInString + "]...");
                        setTimeout(function () {
                            BRTMUtils.funcUtils.instrumentFunc(funcInString, key,
                                                               maxRetryCount - 1);
                        }, 5000);
                    }
                    // Don't continue
                    return null;
                }
                // Needless to say, if the original function is not in scope, there is nothing to do
                // So, Skip the instrumentation
                if (!origObjFromWindow) {
                    BRTMLogger.warn(funcInString +
                                    "instrumentFunc: could not be found in the browser window scope. Skipping instrumentation...");
                    return null;
                }
                // If the function is already instrumented, don't bother to instrument it
                if (origObjFromWindow._isBRTMInstrumented) {
                    BRTMLogger.info(funcInString +
                                    " already instrumented. Skipping instrumentation...");
                    return null;
                }
                this.saveOrigObj(key, origObjFromWindow);
                // If the function was not saved in the original function map, then don't
                // proceed with instrumentation
                if (!BRTMGlobals.origFuncMap || !BRTMGlobals.origFuncMap[key]) {
                    BRTMLogger.warn("instrumentFunc: JS Function [" + funcInString +
                                    "] could not be saved. Skipping instrumentation...");
                    return null;
                }
                var origFunc = origObjFromWindow;
                // Track any errors during instrumentation
                var isError = false;
                BRTMLogger.info("Instrumenting " + funcInString);
                var redefinedFunc = null;
                switch (funcInString) {
                    case "XMLHttpRequest.prototype.send":
                        // Generate a new XMLHttpRequest.prototype.send function
                        redefinedFunc = function () {
                            var ajaxFullURL = this._fullURL;
                            var isAsync = this._async;
                            var isFuncEnabled = false;
                            var isAjaxInstrumented = this._isAjaxInstrumented;
                            var funcMetricData = {};
                            // Wrap the BRTM instrumentation in a try, catch...
                            try {
                                isFuncEnabled = window[BRTMUtils.configUtils.configNames.BRTM_JSFUNCTIONMETRICSENABLED];
                            } catch (e) {
                                isError = true;
                                BRTMLogger.error("instrumentFunc (Checkpoint # 1): " + e.message);
                            }
                            // If the XHR is used for synchronous purposes, then don't bother
                            // to trace the callbacks.
                            if (!isError && isAsync && isAjaxInstrumented) {
                                var ajaxMetricData = {};
                                // This uniqueID serves as the identifier between instances of
                                // the same resource being loaded many times within an interval
                                // via Ajax.
                                var uniqueID = '_' + Math.random().toString(36).substr(2, 9);
                                // Redefine XHR onload
                                var origOnload = this.onload;
                                if (origOnload) {
                                    // Assign a new function to onload
                                    this.onload = function () {
                                        // Wrap the BRTM instrumentation in a try, catch...
                                        try {
                                            if (!isError) {
                                                ajaxMetricData[BRTMGlobals.timestampNames.CALLBACK_START_TIME] = BRTMUtils.funcUtils.startTrace();
                                            }
                                        } catch (e) {
                                            isError = true;
                                            BRTMLogger.error("instrumentFunc (Checkpoint # 2): " +
                                                             e.message);
                                        }

                                        ///////////// Start of ORIGINAL ONLOAD ////////////
                                        origOnload.apply(this, arguments);
                                        ///////////// End of ORIGINAL ONLOAD /////////////

                                        // Wrap the BRTM instrumentation in a try, catch...
                                        try {
                                            if (!isError) {
                                                ajaxMetricData[BRTMGlobals.timestampNames.CALLBACK_END_TIME] = BRTMUtils.funcUtils.endTrace();
                                                ajaxMetricData["URL"] = ajaxFullURL;
                                                // Add BT information from the response Cookie
                                                var responseCookie = BRTMUtils.cookieUtils.getRawCookie(BRTMUtils.cookieUtils.cookies.BTRESP +
                                                                                                        "-" +
                                                                                                        uniqueID);
                                                if (responseCookie) {
                                                    var cookieData = BRTMUtils.cookieUtils.tokenizeCookieIntoMap(responseCookie,
                                                                                                                 ",");
                                                    BRTMUtils.cookieUtils.updateObjWithCookieDataAjax(cookieData,
                                                                                                      ajaxMetricData);

                                                }
                                                // No longer need the x-apm-brtm-response-bt-_uniqueID
                                                // cookie. So, delete it.
                                                BRTMUtils.cookieUtils.deleteCookie(BRTMUtils.cookieUtils.cookies.BTRESP +
                                                                                   "-" +
                                                                                   uniqueID, "/",
                                                                                   null);

                                                BRTMUtils.metricUtils.addDataPoint(BRTMGlobals.metricTypeToAccumulatorMap[BRTMGlobals.metricType.AJAX],
                                                                                   uniqueID,
                                                                                   ajaxMetricData);
                                                BRTMUtils.metricUtils.harvestMetrics(BRTMGlobals.metricType.AJAX,
                                                                                     uniqueID);
                                            }
                                        } catch (e) {
                                            isError = true;
                                            BRTMLogger.error("instrumentFunc (Checkpoint # 3): " +
                                                             e.message);
                                        }
                                    };
                                }
                                var origOsrc = this.onreadystatechange;
                                // Assign a new function to onreadystatechange
                                this.onreadystatechange = function () {
                                    var startTime;
                                    // Wrap the BRTM instrumentation in a try, catch...
                                    try {
                                        if (!isError) {
                                            startTime = parseInt(BRTMUtils.timeUtils.getCurrTimeInMillis());
                                            if (this.readyState === this.LOADING) {
                                                // time it on first invocation, not all
                                                if (!ajaxMetricData[BRTMGlobals.timestampNames.FIRST_BYTE]) {
                                                    ajaxMetricData[BRTMGlobals.timestampNames.FIRST_BYTE] = startTime;
                                                }
                                            }
                                            if (this.readyState === this.DONE) {
                                                ajaxMetricData[BRTMGlobals.timestampNames.LAST_BYTE] = startTime;
                                            }
                                        }
                                    } catch (e) {
                                        isError = true;
                                        BRTMLogger.error("instrumentFunc (Checkpoint # 4): " +
                                                         e.message);
                                    }
                                    if (origOsrc) {
                                        // Wrap the BRTM instrumentation in a try, catch...
                                        try {
                                            if (!isError && this.readyState === this.DONE) {
                                                ajaxMetricData[BRTMGlobals.timestampNames.CALLBACK_START_TIME] = BRTMUtils.funcUtils.startTrace();
                                            }
                                        } catch (e) {
                                            isError = true;
                                            BRTMLogger.error("instrumentFunc (Checkpoint # 5): " +
                                                             e.message);
                                        }

                                        ///////////// Start of ORIGINAL ONREADYSTATECHANGE ////////////
                                        origOsrc.apply(this, arguments);
                                        ///////////// End of ORIGINAL ONREADYSTATECHANGE /////////////

                                        // Wrap the BRTM instrumentation in a try, catch...
                                        try {
                                            if (!isError && this.readyState === this.DONE) {
                                                ajaxMetricData[BRTMGlobals.timestampNames.CALLBACK_END_TIME] = BRTMUtils.funcUtils.endTrace();
                                                // Add BT information from the response Cookie
                                                var responseCookie = BRTMUtils.cookieUtils.getRawCookie(BRTMUtils.cookieUtils.cookies.BTRESP +
                                                                                                        "-" +
                                                                                                        uniqueID);
                                                if (responseCookie) {
                                                    var cookieData = BRTMUtils.cookieUtils.tokenizeCookieIntoMap(responseCookie,
                                                                                                                 ",");
                                                    BRTMUtils.cookieUtils.updateObjWithCookieDataAjax(cookieData,
                                                                                                      ajaxMetricData);
                                                }
                                                // No longer need the x-apm-brtm-response-bt-_uniqueID
                                                // cookie. So, delete it.
                                                BRTMUtils.cookieUtils.deleteCookie(BRTMUtils.cookieUtils.cookies.BTRESP +
                                                                                   "-" +
                                                                                   uniqueID, "/",
                                                                                   null);
                                                ajaxMetricData["URL"] = ajaxFullURL;
                                                BRTMUtils.metricUtils.addDataPoint(BRTMGlobals.metricTypeToAccumulatorMap[BRTMGlobals.metricType.AJAX],
                                                                                   uniqueID,
                                                                                   ajaxMetricData);
                                                BRTMUtils.metricUtils.harvestMetrics(BRTMGlobals.metricType.AJAX,
                                                                                     uniqueID);
                                            }
                                        } catch (e) {
                                            isError = true;
                                            BRTMLogger.error("instrumentFunc (Checkpoint # 6): " +
                                                             e.message);
                                        }
                                    }
                                };
                            }
                            // Wrap the BRTM instrumentation in a try, catch...
                            try {
                                if (!isError && isFuncEnabled) {
                                    funcMetricData[BRTMGlobals.timestampNames.START_TIME] = BRTMUtils.funcUtils.startTrace();
                                }
                                if (!isError && isAsync && isAjaxInstrumented) {
                                    BRTMUtils.cookieUtils.setRawCookie(BRTMUtils.cookieUtils.cookies.BTRESPID,
                                                                       uniqueID, 2, "/", null);
                                }
                            } catch (e) {
                                isError = true;
                                BRTMLogger.error("instrumentFunc (Checkpoint # 7) : " + e.message);
                            }

                            //////////////// Start of ORIGINAL JS Function ////////////////
                            var funcRet = origFunc.apply(this, arguments);
                            //////////////// End of ORIGINAL JS Function ////////////////

                            // Wrap the rest of the BRTM instrumentation in a try, catch...
                            try {
                                if (!isError && isFuncEnabled) {
                                    funcMetricData[BRTMGlobals.timestampNames.END_TIME] = BRTMUtils.funcUtils.endTrace();
                                    BRTMUtils.metricUtils.addDataPoint(BRTMGlobals.metricTypeToAccumulatorMap[BRTMGlobals.metricType.FUNCTION],
                                                                       key, funcMetricData);
                                    BRTMUtils.metricUtils.harvestMetrics(BRTMGlobals.metricType.FUNCTION);
                                }
                                // If XHR is used for synchronous purposes, don't bother to record
                                // Ajax data point
                                if (!isError && isAsync && isAjaxInstrumented) {
                                    var ajaxData = {};
                                    ajaxData[BRTMGlobals.timestampNames.END_TIME] = BRTMUtils.timeUtils.getCurrTimeInMillis();
                                    BRTMUtils.metricUtils.addDataPoint(BRTMGlobals.ajaxSendDataMap,
                                                                       uniqueID, ajaxData);
                                }
                            } catch (e) {
                                isError = true;
                                BRTMLogger.error("instrumentFunc (Checkpoint # 8): " + e.message);
                            }
                            return funcRet;
                        };
                        break;
                    default:
                        // Generate a new function
                        redefinedFunc = function () {
                            var isFuncEnabled = false;
                            var funcMetricData = {};
                            // Wrap the BRTM instrumentation in a try, catch...
                            try {
                                if (!isError) {
                                    isFuncEnabled = window[BRTMUtils.configUtils.configNames.BRTM_JSFUNCTIONMETRICSENABLED];
                                    if (!isFuncEnabled) {
                                        BRTMLogger.info("JS Function Metrics are DISABLED.");
                                    }
                                    // If the function is XMLHttpRequest.prototype.open, then save
                                    // its arguments to be used later
                                    if (funcInString === "XMLHttpRequest.prototype.open") {
                                        // In the XHR open call, the resource URL is a required argument
                                        // Store the URL in the XHR object from which the open originates
                                        // so that it can be used later to correlate metrics
                                        this._url = arguments[1];
                                        this._fullURL = BRTMUtils.configUtils.getFullURL(this._url);
                                        this._async = true;
                                        this._isAjaxInstrumented = true;
                                        if (arguments.length >= 3) {
                                            this._async = arguments[2];
                                        }
                                        var isAjaxEnabled = window[BRTMUtils.configUtils.configNames.BRTM_AJAXMETRICSENABLED];
                                        var isAjaxExcluded = BRTMUtils.configUtils.isExcluded(this._fullURL);
                                        if (!isAjaxEnabled) {
                                            BRTMLogger.info("AJAX Metrics are DISABLED.");
                                        }
                                        if (isAjaxExcluded) {
                                            BRTMLogger.info("AJAX URL " + this._fullURL + " is configured to be EXCLUDED.");
                                        }
                                        if (!isAjaxEnabled || isAjaxExcluded) {
                                            this._isAjaxInstrumented = false;
                                        }
                                    }
                                    if (isFuncEnabled) {
                                        funcMetricData[BRTMGlobals.timestampNames.START_TIME] = BRTMUtils.funcUtils.startTrace();
                                    }
                                }
                            } catch (e) {
                                isError = true;
                                BRTMLogger.error("instrumentFunc (Checkpoint # 9) : " + e.message);
                            }

                            //////////////// Start of ORIGINAL JS Function ////////////////
                            var funcRet = origFunc.apply(this, arguments);
                            //////////////// End of ORIGINAL JS Function /////////////////

                            // Wrap the rest of the BRTM instrumentation in a try, catch...
                            try {
                                if (!isError && isFuncEnabled) {
                                    funcMetricData[BRTMGlobals.timestampNames.END_TIME] = BRTMUtils.funcUtils.endTrace();
                                    BRTMUtils.metricUtils.addDataPoint(BRTMGlobals.metricTypeToAccumulatorMap[BRTMGlobals.metricType.FUNCTION],
                                                                       key, funcMetricData);
                                    BRTMUtils.metricUtils.harvestMetrics(BRTMGlobals.metricType.FUNCTION);
                                }
                            } catch (e) {
                                isError = true;
                                BRTMLogger.error("instrumentFunc (Checkpoint # 10) : " + e.message);
                            }
                            return funcRet;
                        };
                        break;
                }
                BRTMLogger.info("Finished Instrumentation of " + funcInString);
                // This is a flag (e.g. hack) to prevent re-instrumentation of the same function.
                // Imagine frames embedding HTML pages within a top level HTML page. When the top
                // level HTML page begins to load, BRTM JS function instrumentation occurs. Then, when
                // each of the frames load their own HTML pages, the BRTM JS function instrumentation
                // occurs again. However, the functions have been already instrumented with custom
                // BRTM logic. So, upon re-instrumentation, the custom logic is recursively invoked,
                // leading to a stack overflow.
                if (redefinedFunc) { redefinedFunc._isBRTMInstrumented = true; }
                return redefinedFunc;
            },
            /**
             * Instrument all the functions placed in BRTMGlobals.functionsToInstrument
             */
            instrumentAllFunc : function () {
                if (!BRTMGlobals.functionsToInstrument) {
                    BRTMLogger.info("No JS functions to instrument.");
                    return;
                }
                // Save XHR object itself
                if (window && window.XMLHttpRequest) {
                    this.saveOrigObj("XHR_ctor", window.XMLHttpRequest);
                }
                // NOTE: this will not work in IE8 and below
                for (var item in BRTMGlobals.functionsToInstrument) {
                    if (BRTMGlobals.functionsToInstrument[item].name) {
                        try {
                            // The JS function is in the scope of the window and needs to be
                            // assigned the newly generated function by BRTM. The assignment at run
                            // time can be achieved by eval
                            eval("var res = BRTMUtils.funcUtils.instrumentFunc(BRTMGlobals.functionsToInstrument['" +
                                 item + "'].name, '" + item + "'); if (res) { window." +
                                 BRTMGlobals.functionsToInstrument[item].name + " = res; }");
                        } catch (e) {
                            // Do nothing. Retry is implemented in instrumentFunc
                        }
                    }
                }
            },
            /**
             * Given a object, this function saves them in BRTMGlobals.origFuncMap
             * @param key - an unique string
             * @param obj - JS function object or JS function to store
             */
            saveOrigObj : function (key, obj) {
                if (!obj || !key) {
                    BRTMLogger.warn("saveOrigObj : Cannot save original object without key or the object itself.");
                    return;
                }
                // NOTE: this will not work in IE8 and below
                Object.defineProperty(BRTMGlobals.origFuncMap, key, {
                    value : obj,
                    writable : false,
                    enumerable : false,
                    configurable : false
                });
            },
            /**
             * Trace function that precedes the monitored application source
             * @returns {*}
             */
            startTrace : function () {
                return BRTMUtils.timeUtils.getCurrTimeInMillis();
            }
        },
        /**
         * Metric Utility
         * Responsible for BRTM Metrics
         */
        metricUtils : {
            batchID : null,
            XHRToSendMetrics : null,
            // NOTE: There is no need for locking in any of these methods
            // because Javascript, by design, is single threaded
            init : function () {
                try {
                    this.addMetricType("function", this.harvestFuncMetrics);
                    this.addMetricType("ajax", this.harvestAjaxMetrics);
                } catch (e) {
                    BRTMLogger.error("metricUtils.init : " + e.message);
                }
            },
            /**
             * Add a data point into the given accumulator for a given key
             * Assumption: data points reside in an array for a given key
             * If the key is present, then append the data point into the array for that key
             * If key is not present, then create a new array with that data point
             * @param acc - Accumulator in which the data point is to be added
             * @param key - an unique string
             * @param data - preferably, a JS Object containing data
             */
            addDataPoint : function (acc, key, data) {
                if (this.isValid(acc, key) && data != null && data != undefined) {
                    // 1st Data point
                    if (!acc[key]) {
                        acc[key] = [data];
                    } else {
                        acc[key].push(data);
                    }
                }
            },
            /**
             * Adds a metric type into BRTMGlobals.metricType map.
             * BRTM has 3 flavors of metrics and each corresponds to a metric Type
             * 1 : Page
             * 2 : Function
             * 3 : Ajax
             * Furthermore, each metric type has an accumulator and a registered harvest function
             * that reaps the data points of that metric type every so often as governed by the
             * metric frequency config parameter.
             * @param metricType - type of metric (e.g. AngularJS)
             * @param harvestFunction - JS Function used for metric reap
             */
            addMetricType : function (metricType, harvestFunction) {
                if (!metricType || typeof metricType !== 'string' || !BRTMGlobals ||
                    !BRTMGlobals.metricType || !harvestFunction ||
                    typeof harvestFunction !== 'function' ||
                    !BRTMGlobals.metricTypeToAccumulatorMap ||
                    !BRTMGlobals.metricTypeToHarvestMap) {
                    BRTMLogger.error("addMetricType : cannot add metric type for " + metricType);
                    return;
                }
                var lowerCaseMetricType = metricType.toLowerCase();
                // NOTE: this will not work in IE8 and below
                Object.defineProperty(BRTMGlobals.metricType, metricType.toUpperCase(), {
                    value : lowerCaseMetricType,
                    writable : true,
                    enumerable : true,
                    configurable : true
                });
                // Add Accumulator
                // NOTE: this will not work in IE8 and below
                Object.defineProperty(BRTMGlobals.metricTypeToAccumulatorMap,
                                      lowerCaseMetricType, {
                        value : {},
                        writable : true,
                        enumerable : true,
                        configurable : true
                    });
                // Register Harvest Function
                // NOTE: this will not work in IE8 and below
                Object.defineProperty(BRTMGlobals.metricTypeToHarvestMap, lowerCaseMetricType, {
                    value : harvestFunction,
                    writable : true,
                    enumerable : true,
                    configurable : true
                });
            },
            /**
             * Construct the metric path for a given metric in the metric browser tree
             * @param metricPfx - metric path that would succeed Business Segment | BS | BT | BTC or
             * Business Segment | <domain/port> | <path>
             * @param metricName - metric name displayed in the metric browser
             * @param metricVal - metric value (Must be an number)
             * @param metricAggregatorType - refer to BRTMGlobals.metricAggregatorType
             * @returns {string}
             */
            constructMetricPath : function (metricPfx, metricName, metricVal,
                                            metricAggregatorType) {
                if (typeof metricPfx !== 'string' || typeof metricName !== 'string' ||
                    typeof metricVal !== 'number' || typeof metricAggregatorType !== 'number') {
                    BRTMLogger.warn("constructMetricPath : cannot construct metric path for {" +
                                    metricPfx + ", " + metricName + ", " + metricVal + ", " +
                                    metricAggregatorType + "}");
                    return "";
                }
                // If Metric Prefix is non-empty, then include colon char in path
                if (metricPfx.length > 0) {
                    metricPfx = BRTMUtils.metricUtils.metricPrefixSanitize(metricPfx) +
                                BRTMGlobals.colonChar;
                }
                var unformattedMetricPath = metricPfx + metricName + BRTMGlobals.equalChar +
                                            BRTMGlobals.openParenChar +
                                            metricVal + BRTMGlobals.commaChar +
                                            metricAggregatorType +
                                            BRTMGlobals.closedParenChar + BRTMGlobals.semiColonChar;
                var formattedMetricPath = unformattedMetricPath;
                if (BRTMExtension) {
                    formattedMetricPath = BRTMExtension.extNameFormatter(unformattedMetricPath);
                }
                return formattedMetricPath;
            },
            /**
             * Validation function used before adding data points into an accumulator
             * @param acc - Accumulator (JS Object)
             * @param key - a unique identifier
             * @returns {boolean}
             */
            isValid : function (acc, key) {
                if (!key) {
                    BRTMLogger.error("isValid : Metric key cannot be null or undefined");
                    return false;
                }
                if (!acc) {
                    BRTMLogger.error("isValid : Metric location must be defined");
                    return false;
                }
                if (typeof acc !== 'object') {
                    BRTMLogger.error("isValid : Metric location must be an object");
                    return false;
                }
                return true;
            },
            /**
             * Validation function used to verify whether a given AJAX data point has all
             * the mandatory attributes
             * @param ajaxObj - JS Object containing AJAX data
             * @returns {boolean}
             */
            isValidAjaxDataPoint : function (ajaxObj) {
                if (ajaxObj && ajaxObj["URL"] &&
                    ajaxObj[BRTMGlobals.timestampNames.FIRST_BYTE] &&
                    ajaxObj[BRTMGlobals.timestampNames.LAST_BYTE] &&
                    ajaxObj[BRTMGlobals.timestampNames.CALLBACK_START_TIME] &&
                    ajaxObj[BRTMGlobals.timestampNames.CALLBACK_END_TIME]) {
                    return true;
                }
                return false;
            },
            /**
             * Obtains Txn Trace properties
             * @param ttFlag
             * @param corId - Agent Correlation ID
             * @param apmStartTime - Introscope Start Time
             * @param brtmStartTime
             * @param duration
             * @returns {string}
             */
            getOptionalParameters : function (ttFlag, corId, apmStartTime, brtmStartTime,
                                              duration, ttfb) {
                var optParam = "";
                apmStartTime = parseInt(apmStartTime);
                if (ttFlag !== "1" || typeof corId !== 'string' || !apmStartTime ||
                    typeof brtmStartTime !== 'number' ||
                    typeof duration !== 'number' || duration < 1) {
                    return optParam;
                }
                var geoParam = BRTMUtils.cookieUtils.cookieKeys.geoChar + BRTMGlobals.equalChar;
                var invalidGeo = "-255";
                if (window[BRTMUtils.configUtils.configNames.BRTM_GEOENABLED]) {
                    if (!BRTMUtils.browserUtils.geoCookie) {
                        BRTMUtils.browserUtils.geoCookie = BRTMUtils.cookieUtils.getCookieObject(BRTMUtils.cookieUtils.cookies.GEO);
                    }
                    if (BRTMUtils.browserUtils.geoCookie) {
                        geoParam += BRTMUtils.browserUtils.geoCookie.lat +
                                    BRTMGlobals.commaChar +
                                    BRTMUtils.browserUtils.geoCookie.long;
                    } else {
                        geoParam += invalidGeo + BRTMGlobals.commaChar + invalidGeo;
                    }
                } else {
                    geoParam += invalidGeo + BRTMGlobals.commaChar + invalidGeo;
                }
                geoParam += BRTMGlobals.semiColonChar;
                optParam = geoParam + "duration=" + parseInt(duration) +
                           ";p=" + BRTMGlobals.p + ";pv=" + BRTMGlobals.pv + ";CorBrowsGUID=" +
                           corId + ";startTime=";
                var startTimeAdjustEnabled = window[BRTMUtils.configUtils.configNames.BRTM_TTSTARTTIMEADJUSTMENTENABLED];
                if ((brtmStartTime > apmStartTime) ||
                    (startTimeAdjustEnabled && ((brtmStartTime + duration) < apmStartTime))) {
                    optParam += apmStartTime - parseInt(ttfb / 2);
                } else {
                    optParam += brtmStartTime;
                }
                // EXTENSION POINT for adding Txn Trace properties
                if (BRTMExtension) {
                    optParam += BRTMExtension.extAddCustomOptionalProperty();
                }
                return optParam;
            },
            /**
             * Given a URL, strip the pathname from it
             * Assumes that the URL has been sanitized with sanitizeURL
             * @param url - sanitized URL
             * @returns {*}
             */
            getPathnameFromURL : function (url) {
                if (!url || typeof url !== 'string') {
                    return url;
                }
                var slashIdx = url.indexOf(BRTMGlobals.forwardSlashChar);
                var pathName = BRTMGlobals.forwardSlashChar;
                if (slashIdx !== -1) {
                    pathName = url.substring(slashIdx);
                }
                return pathName;
            },
            /**
             * Redefine the XHR object's open and send call to original
             * Dispatch of BRTM metrics requires XHR object. However, BRTM instrumentation
             * add custom logic into the methods of this object. Hence, redefine them to
             * the original for the sake of metrics dispatch
             */
            getRedefinedXHRForMetrics : function () {
                if (BRTMGlobals.origFuncMap && BRTMGlobals.origFuncMap["XHR_ctor"] &&
                    BRTMGlobals.origFuncMap["XHR_Open"] &&
                    BRTMGlobals.origFuncMap["XHR_Send"]) {
                    BRTMUtils.metricUtils.XHRToSendMetrics = new (BRTMGlobals.origFuncMap["XHR_ctor"])();
                    BRTMUtils.metricUtils.XHRToSendMetrics.open = BRTMGlobals.origFuncMap["XHR_Open"];
                    BRTMUtils.metricUtils.XHRToSendMetrics.send = BRTMGlobals.origFuncMap["XHR_Send"];
                } else {
                    // If the original functions are not found, do not use the redefined ones
                    // as this will generate an infinite loop
                    // Use null instead
                    BRTMUtils.metricUtils.XHRToSendMetrics = null;
                }
            },
            /**
             * Reaps the AJAX data points stored into the AJAX metric accumulator
             * When dataId is specified, then reaps that particular AJAX data point
             * @param dataId - an unique identifier that corresponds to a valid AJAX data point,
             *                 residing in the  AJAX accumulator,
             *                 BRTMGlobals.metricTypeToAccumulatorMap[BRTMGlobals.metricType.AJAX]
             * @returns {string}
             */
            harvestAjaxMetrics : function (dataId) {
                var ajaxPostData = "";
                var ajaxMetricAccumulator = BRTMGlobals.metricTypeToAccumulatorMap[BRTMGlobals.metricType.AJAX];
                var ajaxSendAccumulator = BRTMGlobals.ajaxSendDataMap;
                if (!ajaxMetricAccumulator || !ajaxSendAccumulator) {
                    return ajaxPostData;
                }
                var ajaxDataPoint;
                var sendDataPoint;
                var ttfb;
                var trlt;
                var cbet;
                var ttt;
                var resourceURL;
                var ajaxMetrics = {};
                var TTParams;
                var bs;
                var bt;
                var btc;
                var urlInitialMetricPfx = BRTMUtils.metricUtils.convertURL(BRTMUtils.metricUtils.sanitizeURL(BRTMGlobals.currentURL));
                var threshold = window[BRTMUtils.configUtils.configNames.BRTM_AJAXMETRICSTHRESHOLD];
                var isURLMetricOff = window[BRTMUtils.configUtils.configNames.BRTM_URLMETRICOFF];
                var aggregatorType = BRTMGlobals.metricAggregatorType.INT_LONG_DURATION;
                for (var id in ajaxMetricAccumulator) {
                    var currentAjaxPostData = "";
                    // If dataId is specified, then a single Ajax Data Point needs to be harvested
                    // Do so by setting the id = dataId;
                    if (dataId) { id = dataId; }
                    ajaxDataPoint =
                    (ajaxMetricAccumulator[id]) ? ajaxMetricAccumulator[id][0] : null;
                    sendDataPoint =
                    (ajaxSendAccumulator[id]) ? ajaxSendAccumulator[id][0] : null;
                    if (!ajaxDataPoint || !sendDataPoint) {
                        if (dataId) { break; } else { continue; }
                    }
                    // If the Ajax Data Points are not valid, then why bother with calculations?
                    // Just delete them and move on
                    // Validity is based on the presence of required keys in the data point object:
                    // URL, f, l, cs, ce, e
                    if (!BRTMUtils.metricUtils.isValidAjaxDataPoint(ajaxDataPoint) ||
                        !sendDataPoint[BRTMGlobals.timestampNames.END_TIME]) {
                        BRTMLogger.warn("Obtained invalid AJAX data point. Deleting it...");
                        delete BRTMGlobals.metricTypeToAccumulatorMap[BRTMGlobals.metricType.AJAX][id];
                        delete BRTMGlobals.ajaxSendDataMap[id];
                        if (dataId) { break; } else { continue; }
                    }
                    resourceURL = BRTMUtils.metricUtils.convertURL(BRTMUtils.metricUtils.sanitizeURL(ajaxDataPoint['URL']));
                    // Obtain BS info
                    bs = (ajaxDataPoint[BRTMUtils.cookieUtils.cookieKeys.bsChar] &&
                          ajaxDataPoint[BRTMUtils.cookieUtils.cookieKeys.bsChar] !==
                          BRTMGlobals.UNDEFINED) ?
                        ajaxDataPoint[BRTMUtils.cookieUtils.cookieKeys.bsChar] :
                        BRTMGlobals.bs;
                    // If bs is not defined, then the data point is in URL context. Check if the
                    // URL metrics are on. If not, skip the rest of the logic
                    if (bs === BRTMGlobals.UNDEFINED) {
                        if (isURLMetricOff) {
                            BRTMLogger.info("Skipping harvest of AJAX metrics as NON-BT based metrics are OFF");
                            delete BRTMGlobals.metricTypeToAccumulatorMap[BRTMGlobals.metricType.AJAX][id];
                            delete BRTMGlobals.ajaxSendDataMap[id];
                            if (dataId) { break; } else { continue; }
                        }
                    }
                    trlt = ajaxDataPoint[BRTMGlobals.timestampNames.CALLBACK_END_TIME] -
                           sendDataPoint[BRTMGlobals.timestampNames.END_TIME];
                    // Skip the rest of logic if Total Resource Load Time < Threshold
                    // with continue
                    if (trlt < threshold) {
                        BRTMLogger.info("Skipping harvest of AJAX metrics for " +
                                        ajaxDataPoint['URL'] +
                                        " as it is below the configured AJAX Metric Threshold");
                        delete BRTMGlobals.metricTypeToAccumulatorMap[BRTMGlobals.metricType.AJAX][id];
                        delete BRTMGlobals.ajaxSendDataMap[id];
                        if (dataId) { break; } else { continue; }
                    }
                    // Obtain bt and btc info
                    bt = (bs === BRTMGlobals.UNDEFINED ||
                          !ajaxDataPoint[BRTMUtils.cookieUtils.cookieKeys.btChar]) ?
                        BRTMGlobals.bt : ajaxDataPoint[BRTMUtils.cookieUtils.cookieKeys.btChar];
                    btc = (bs === BRTMGlobals.UNDEFINED ||
                           !ajaxDataPoint[BRTMUtils.cookieUtils.cookieKeys.btcChar]) ?
                        BRTMGlobals.btc :
                        ajaxDataPoint[BRTMUtils.cookieUtils.cookieKeys.btcChar];

                    // If in URL context, then set metric path appropriately
                    var urlPath = BRTMGlobals.UNDEFINED;
                    var finalMetricPfx = "";
                    if (bs === BRTMGlobals.UNDEFINED) {
                        urlPath = urlInitialMetricPfx;
                        finalMetricPfx = urlInitialMetricPfx + BRTMGlobals.pipeChar;
                    }
                    finalMetricPfx += BRTMGlobals.metricPath.AJAX + BRTMGlobals.pipeChar +
                                      resourceURL;
                    // Perform AJAX metric calculations
                    ttfb = ajaxDataPoint[BRTMGlobals.timestampNames.FIRST_BYTE] -
                           sendDataPoint[BRTMGlobals.timestampNames.END_TIME];
                    ttt = ajaxDataPoint[BRTMGlobals.timestampNames.LAST_BYTE] -
                          ajaxDataPoint[BRTMGlobals.timestampNames.FIRST_BYTE];
                    cbet = ajaxDataPoint[BRTMGlobals.timestampNames.CALLBACK_END_TIME] -
                           ajaxDataPoint[BRTMGlobals.timestampNames.CALLBACK_START_TIME];
                    ajaxMetrics[BRTMGlobals.defaultMetricNames.AJAX_TRLT] =
                    [trlt, aggregatorType];
                    ajaxMetrics[BRTMGlobals.defaultMetricNames.AJAX_TTFB] =
                    [ttfb, aggregatorType];
                    ajaxMetrics[BRTMGlobals.defaultMetricNames.AJAX_TTT] =
                    [ttt, aggregatorType];
                    ajaxMetrics[BRTMGlobals.defaultMetricNames.AJAX_CBET] =
                    [cbet, aggregatorType];
                    ajaxMetrics[BRTMGlobals.defaultMetricNames.AJAX_ICPI] =
                    [1, BRTMGlobals.metricAggregatorType.LONG_INTERVAL_COUNTER];
                    // EXTENSION POINT for adding custom AJAX metrics
                    if (BRTMExtension) {
                        BRTMExtension.extAddCustomAjaxMetric();
                        for (var item in BRTMExtension.extCustomAjaxMetricMap) {
                            ajaxMetrics[item] = BRTMExtension.extCustomAjaxMetricMap[item];
                        }
                        BRTMExtension.extCustomAjaxMetricMap = {};
                    }
                    // Validate the AJAX metrics, including the custom ones from the EXTENSION POINT
                    BRTMUtils.metricUtils.validateMetrics(ajaxMetrics);
                    for (var metric in ajaxMetrics) {
                        currentAjaxPostData += BRTMUtils.metricUtils.constructMetricPath(finalMetricPfx,
                                                                                         metric,
                                                                                         ajaxMetrics[metric][0],
                                                                                         ajaxMetrics[metric][1]);
                    }
                    // Obtain Txn Trace properties
                    var brtmStartTime = parseInt(BRTMUtils.timeUtils.getCurrTimeInMillisSinceEpoch() -
                                                 BRTMUtils.timeUtils.getCurrTimeInMillis() +
                                                 sendDataPoint[BRTMGlobals.timestampNames.END_TIME]);
                    TTParams = BRTMUtils.metricUtils.getOptionalParameters(ajaxDataPoint[BRTMUtils.cookieUtils.cookieKeys.ttChar],
                                                                           ajaxDataPoint[BRTMUtils.cookieUtils.cookieKeys.CorBrowsGUIDChar],
                                                                           ajaxDataPoint[BRTMUtils.cookieUtils.cookieKeys.apmStartTimeChar],
                                                                           brtmStartTime,
                                                                           trlt,
                                                                           ajaxMetrics[BRTMGlobals.defaultMetricNames.AJAX_TTFB][0]);
                    if (currentAjaxPostData.length > 0) {
                        // Form the data in Post Parameter Data Format
                        // b0: <optional Params>$bs=-1,bt=-1,btc=-1;Responses Per Interval=(2,1);
                        currentAjaxPostData = BRTMUtils.metricUtils.placeInPostParameterFormat(bs,
                                                                                               bt,
                                                                                               btc,
                                                                                               urlPath,
                                                                                               TTParams,
                                                                                               currentAjaxPostData);
                        ajaxPostData += currentAjaxPostData;
                        BRTMGlobals.bCount++;
                    }
                    delete BRTMGlobals.metricTypeToAccumulatorMap[BRTMGlobals.metricType.AJAX][id];
                    delete BRTMGlobals.ajaxSendDataMap[id];
                    if (dataId) { break; }
                }
                return ajaxPostData;
            },
            /**
             * Reaps data points of all metric types
             * Used in BATCH MODE
             */
            harvestAllMetrics : function () {
                try {
                    BRTMGlobals.postData = "";
                    for (var metricType in BRTMGlobals.metricTypeToHarvestMap) {
                        BRTMGlobals.postData += (BRTMGlobals.metricTypeToHarvestMap[metricType])();
                    }
                    if (BRTMGlobals.postData.length !== 0) {
                        BRTMGlobals.postData = "bCount=" + BRTMGlobals.bCount +
                                               BRTMGlobals.postData;
                        BRTMUtils.metricUtils.sendMetrics(window[BRTMUtils.configUtils.configNames.BRTM_WILYURL],
                                                          BRTMGlobals.postData);
                    }
                } catch (e) {
                    // Reset
                    if (BRTMGlobals) {
                        BRTMGlobals.postData = ""
                        BRTMGlobals.bCount = 0;
                        // Don't keep any data points around if there is an error
                        for (var acc in BRTMGlobals.metricTypeToAccumulatorMap) {
                            BRTMGlobals.metricTypeToAccumulatorMap[acc] = {};
                        }
                    }
                    BRTMLogger.error("harvestAllMetrics : " + e.message);
                }
            },
            /**
             * Reaps the JS Func data points stored into the JS Func metric accumulator
             * @returns {string}
             */
            harvestFuncMetrics : function () {
                var funcPostData = "";
                var accumulator = BRTMGlobals.metricTypeToAccumulatorMap[BRTMGlobals.metricType.FUNCTION];
                if (!accumulator) {
                    return funcPostData;
                }
                var aet = 0;
                var funcMetrics = {};
                var metricPfx = BRTMGlobals.metricPath.FUNC;
                var urlPath = BRTMGlobals.UNDEFINED;
                // If bs is not defined, then the data point is in URL context. Check if the
                // URL metrics are on. If not, skip the rest of the logic
                if (BRTMGlobals.bs === BRTMGlobals.UNDEFINED) {
                    if (window[BRTMUtils.configUtils.configNames.BRTM_URLMETRICOFF]) {
                        BRTMLogger.info("Skipping harvest of JS Function metrics as NON-BT based metrics are OFF");
                        BRTMGlobals.metricTypeToAccumulatorMap[BRTMGlobals.metricType.FUNCTION] = {};
                        return funcPostData;
                    }
                    // Set metric path appropriately for URL context
                    metricPfx = BRTMUtils.metricUtils.convertURL(BRTMUtils.metricUtils.sanitizeURL(BRTMGlobals.currentURL));
                    urlPath = metricPfx;
                    metricPfx += BRTMGlobals.pipeChar + BRTMGlobals.metricPath.FUNC;
                }
                var threshold = window[BRTMUtils.configUtils.configNames.BRTM_JSFUNCTIONMETRICSTHRESHOLD];
                for (var funcName in accumulator) {
                    for (var i = 0; i < accumulator[funcName].length; i++) {
                        if (!accumulator[funcName][i][BRTMGlobals.timestampNames.END_TIME] ||
                            !accumulator[funcName][i][BRTMGlobals.timestampNames.START_TIME]) {
                            BRTMLogger.warn("Obtained invalid JavaScript Function data point. Deleting it...");
                            delete BRTMGlobals.metricTypeToAccumulatorMap[BRTMGlobals.metricType.FUNCTION][funcName][i];
                            continue;
                        }
                        aet = accumulator[funcName][i][BRTMGlobals.timestampNames.END_TIME] -
                              accumulator[funcName][i][BRTMGlobals.timestampNames.START_TIME];
                        // Skip the rest of logic if Average Execution Time < Threshold
                        // with continue
                        if (aet < threshold) {
                            BRTMLogger.info("Skipping harvest of JS function metrics for " +
                                            funcName +
                                            " as it is below the configured JS Function Metric Threshold");
                            delete BRTMGlobals.metricTypeToAccumulatorMap[BRTMGlobals.metricType.FUNCTION][funcName][i];
                            continue;
                        }
                        funcMetrics[BRTMGlobals.defaultMetricNames.FUNC_AET] =
                        [aet, BRTMGlobals.metricAggregatorType.INT_LONG_DURATION];
                        funcMetrics[BRTMGlobals.defaultMetricNames.FUNC_ICPI] =
                        [1, BRTMGlobals.metricAggregatorType.LONG_INTERVAL_COUNTER];
                        // EXTENSION POINT for adding custom JS Function metrics
                        if (BRTMExtension) {
                            BRTMExtension.extAddCustomJSFuncMetric();
                            for (var item in BRTMExtension.extCustomJSFuncMetricMap) {
                                funcMetrics[item] = BRTMExtension.extCustomJSFuncMetricMap[item];
                            }
                            BRTMExtension.extCustomJSFuncMetricMap = {};
                        }
                        // Validate the AJAX metrics, including the custom ones from the EXTENSION POINT
                        BRTMUtils.metricUtils.validateMetrics(funcMetrics);
                        for (var metric in funcMetrics) {
                            funcPostData += BRTMUtils.metricUtils.constructMetricPath(metricPfx +
                                                                                      BRTMGlobals.pipeChar +
                                                                                      funcName,
                                                                                      metric,
                                                                                      funcMetrics[metric][0],
                                                                                      funcMetrics[metric][1]);
                        }
                    }
                    delete BRTMGlobals.metricTypeToAccumulatorMap[BRTMGlobals.metricType.FUNCTION][funcName];
                }
                // Form the data in Post Parameter Data Format
                // b0: <optional Params>$bs=-1,bt=-1,btc=-1;Responses Per Interval=(2,1);
                if (funcPostData.length > 0) {
                    funcPostData = BRTMUtils.metricUtils.placeInPostParameterFormat(BRTMGlobals.bs,
                                                                                    BRTMGlobals.bt,
                                                                                    BRTMGlobals.btc,
                                                                                    urlPath,
                                                                                    "",
                                                                                    funcPostData);
                    BRTMGlobals.bCount++;
                }
                return funcPostData;
            },
            /**
             * Given a metric type, invoke its appropriate harvest function
             * Note: this works in two modes governed by the configuration parameter metricFrequency
             *       1. BATCH MODE - Here, the metric frequency is a positive number in ms. The idea
             *       here is to reap the metrics every so often.
             *       2. EVENT MODE - Here, the metric frequency is zero. The idea here is to reap
             *       the metrics as soon the interested event occurs.
             * @param metricType - metric type as per BRTMGlobals.metricType
             * @param dataId - an unique identifier correponding to a particular data point
             */
            harvestMetrics : function (metricType, dataId) {
                try {
                    var metricFreq = window[BRTMUtils.configUtils.configNames.BRTM_METRICFREQUENCY];
                    if (metricFreq > 0) {
                        // BATCH MODE. Trigger the harvest of all metric types periodically
                        if (!BRTMUtils.metricUtils.batchID) {
                            BRTMUtils.metricUtils.batchID = setInterval(BRTMUtils.metricUtils.harvestAllMetrics,
                                                                        metricFreq);
                        }
                        return;
                    }
                    // Here, metric frequency must be 0. So, clear the periodic harvest
                    if (BRTMUtils.metricUtils.batchID) {
                        clearInterval(BRTMUtils.metricUtils.batchID);
                        BRTMUtils.metricUtils.batchID = null;
                    }
                    if (!metricType || typeof metricType !== 'string') {
                        BRTMLogger.warn("harvestMetrics : cannot harvest metrics for metric type " +
                                        metricType);
                        return;
                    }
                    BRTMGlobals.postData = "";
                    // Invoke the harvest function associated with the given metric type
                    BRTMGlobals.postData += (BRTMGlobals.metricTypeToHarvestMap[metricType])(dataId);
                    if (BRTMGlobals.postData.length > 0) {
                        BRTMGlobals.postData = "bCount=" + BRTMGlobals.bCount +
                                               BRTMGlobals.postData;
                        // Send the metrics
                        BRTMUtils.metricUtils.sendMetrics(window[BRTMUtils.configUtils.configNames.BRTM_WILYURL],
                                                          BRTMGlobals.postData);
                    }
                } catch (e) {
                    // Reset
                    if (BRTMGlobals) {
                        BRTMGlobals.postData = ""
                        BRTMGlobals.bCount = 0;
                        // Don't keep any data points around if there is an error
                        for (var acc in BRTMGlobals.metricTypeToAccumulatorMap) {
                            BRTMGlobals.metricTypeToAccumulatorMap[acc] = {};
                        }
                    }
                    BRTMLogger.error("harvestMetrics : " + e.message);
                }
            },
            /**
             * Reaps the page data points stored into a global cookie and BRTMAgent variables
             * Note: Page metrics are not periodic. They are only reaped as soon as the page is
             * loaded.
             * @returns {string}
             */
            harvestPageMetrics : function () {
                var pageLoadData = "";
                // Skip the rest of logic if Average Page Load Complete Time is < Threshold
                // and return empty pageLoadData
                var threshold = window[BRTMUtils.configUtils.configNames.BRTM_PAGELOADMETRICSTHRESHOLD];
                if (BRTMAGENT.tOnLoad < threshold) {
                    BRTMLogger.info("Skipping harvest of Page metrics for as it is below the configured Page Metric Threshold");
                    return pageLoadData;
                }
                var metricPrefix = "";
                var pageURLPath = BRTMGlobals.UNDEFINED;
                // BT is not defined
                if (BRTMGlobals.bs === BRTMGlobals.UNDEFINED) {
                    if (window[BRTMUtils.configUtils.configNames.BRTM_URLMETRICOFF]) {
                        BRTMLogger.info("Skipping harvest of Page metrics as NON-BT based metrics are OFF");
                        return pageLoadData;
                    }
                    metricPrefix = BRTMUtils.metricUtils.convertURL(BRTMUtils.metricUtils.sanitizeURL(BRTMGlobals.currentURL));
                    pageURLPath = metricPrefix;
                }
                // Ideally, we are supposed to calculate the page load metrics here. But, the
                // old BRTM code does the calculations in the page onload() method.
                // So, steal it from there.
                var pageLoadMetrics = {};
                var aggregatorType = BRTMGlobals.metricAggregatorType.INT_LONG_DURATION;
                pageLoadMetrics[BRTMGlobals.defaultMetricNames.NTAPI_ABRT] =
                [BRTMAGENT.tBRT, aggregatorType];
                pageLoadMetrics[BRTMGlobals.defaultMetricNames.NTAPI_ACET] =
                [BRTMAGENT.tConn, aggregatorType];
                pageLoadMetrics[BRTMGlobals.defaultMetricNames.NTAPI_ADNSLT] =
                [BRTMAGENT.tDNS, aggregatorType];
                pageLoadMetrics[BRTMGlobals.defaultMetricNames.NTAPI_ADCT] =
                [BRTMAGENT.tDomReady, aggregatorType];
                pageLoadMetrics[BRTMGlobals.defaultMetricNames.NTAPI_APLCT] =
                [BRTMAGENT.tOnLoad, aggregatorType];
                pageLoadMetrics[BRTMGlobals.defaultMetricNames.NTAPI_APPUT] =
                [BRTMAGENT.tUnload, aggregatorType];
                pageLoadMetrics[BRTMGlobals.defaultMetricNames.NTAPI_ARTT] =
                [BRTMAGENT.tRTT, aggregatorType];
                pageLoadMetrics[BRTMGlobals.defaultMetricNames.NTAPI_ATTFB] =
                [BRTMAGENT.tFirstByte, aggregatorType];
                pageLoadMetrics[BRTMGlobals.defaultMetricNames.NTAPI_ATTLB] =
                [BRTMAGENT.tLastByte, aggregatorType];
                pageLoadMetrics[BRTMGlobals.defaultMetricNames.OTHER_RPI] =
                [1, BRTMGlobals.metricAggregatorType.LONG_INTERVAL_COUNTER];
                // EXTENSION POINT for adding custom page metrics
                if (BRTMExtension) {
                    BRTMExtension.extAddCustomPageMetric();
                    for (var item in BRTMExtension.extCustomPageMetricMap) {
                        pageLoadMetrics[item] = BRTMExtension.extCustomPageMetricMap[item];
                    }
                    BRTMExtension.extCustomPageMetricMap = {};
                }
                // Validate the page metrics, including the custom ones from the EXTENSION POINT
                BRTMUtils.metricUtils.validateMetrics(pageLoadMetrics);

                BRTMLogger.info(" ####### PAGE TIMINGS #######");
                for (var metric in pageLoadMetrics) {
                    BRTMLogger.info(metric + " = " + pageLoadMetrics[metric][0]);
                }
                // Obtain Txn Trace properties
                var TTParams = BRTMUtils.metricUtils.getOptionalParameters(BRTMGlobals.c,
                                                                           BRTMGlobals.CorBrowsGUID,
                                                                           BRTMGlobals.startTime,
                                                                           BRTMAGENT.cookie.bts,
                                                                           BRTMAGENT.tOnLoad,
                                                                           pageLoadMetrics[BRTMGlobals.defaultMetricNames.NTAPI_ATTFB][0]);
                for (var metric in pageLoadMetrics) {
                    pageLoadData += BRTMUtils.metricUtils.constructMetricPath(metricPrefix,
                                                                              metric,
                                                                              pageLoadMetrics[metric][0],
                                                                              pageLoadMetrics[metric][1]);
                }
                if (pageLoadData.length > 0) {
                    // Form the data in Post Parameter Data Format
                    // b0: <optional Params>$bs=-1,bt=-1,btc=-1;Responses Per Interval=(2,1);
                    pageLoadData = BRTMUtils.metricUtils.placeInPostParameterFormat(BRTMGlobals.bs,
                                                                                    BRTMGlobals.bt,
                                                                                    BRTMGlobals.btc,
                                                                                    pageURLPath,
                                                                                    TTParams,
                                                                                    pageLoadData);
                    BRTMGlobals.bCount++;
                }
                return pageLoadData;
            },
            /**
             * Sanity checking of the metric prefix
             * Replace colons with underscore. More Sanity checking can be added here.
             * @param str
             * @returns {*}
             */
            metricPrefixSanitize : function (str) {
                if (!str || typeof str !== 'string') {
                    BRTMLogger.warn("metricPrefixSanitize : cannot sanitize metrics for " + str);
                    return str;
                }
                var saneStr = str;
                // Replace colons with underscore
                if (str) {
                    saneStr = saneStr.replace(/:/g, "_");
                }
                return saneStr;
            },
            /**
             * Converts a sanitized URL into hostname/port|pathname
             * Assumption: URL has been sanitized with sanitizeURL function
             * @param urlStr - sanitized URL string
             * @returns {*}
             */
            convertURL : function (urlStr) {
                if (!urlStr || typeof urlStr !== 'string' || urlStr.length < 1) {
                    BRTMLogger.warn("convertURL : cannot convert URL - " + urlStr);
                    return urlStr;
                }
                var slashIdx = urlStr.indexOf(BRTMGlobals.forwardSlashChar);
                var noColonStr = urlStr.replace(/:/g, '/');
                // No pathname? Just have an empty path starting with /
                var convertedStr = noColonStr + BRTMGlobals.pipeChar +
                                   BRTMGlobals.forwardSlashChar;
                // If pathname, then hostname/port|pathname|...
                if (slashIdx !== -1) {
                    convertedStr = noColonStr.substring(0, slashIdx) + BRTMGlobals.pipeChar +
                                   noColonStr.substring(slashIdx);
                }
                return convertedStr;
            },
            /**
             * Given the data, place it in the post parameter data format for dispatch to Agent
             * @param bs - CEM business segment
             * @param bt - CEM BT
             * @param btc - CEM BTC
             * @param urlPath - path of the current webpage
             * @param optionalParams - Txn Trace properties
             * @param data - string as given by metricUtils.constructMetricPath
             * @returns {string}
             */
            placeInPostParameterFormat : function (bs, bt, btc, urlPath, optionalParams, data) {
                if (typeof data !== 'string' || data.length < 1) {
                    return "";
                }
                if (typeof bs !== 'string' || typeof bt !== 'string' || typeof btc !== 'string') {
                    bs = BRTMGlobals.UNDEFINED;
                    bt = BRTMGlobals.UNDEFINED;
                    btc = BRTMGlobals.UNDEFINED;
                }
                if (typeof urlPath !== 'string') {
                    urlPath = "";
                }
                if (typeof optionalParams !== 'string') {
                    optionalParams = "";
                }
                return BRTMGlobals.ampersandChar + "b" + BRTMGlobals.bCount +
                       BRTMGlobals.equalChar + optionalParams +
                       BRTMGlobals.dollarChar + BRTMUtils.cookieUtils.cookieKeys.bsChar +
                       BRTMGlobals.equalChar + bs +
                       BRTMGlobals.commaChar + BRTMUtils.cookieUtils.cookieKeys.btChar +
                       BRTMGlobals.equalChar + bt +
                       BRTMGlobals.commaChar + BRTMUtils.cookieUtils.cookieKeys.btcChar +
                       BRTMGlobals.equalChar + btc +
                       BRTMGlobals.commaChar + BRTMGlobals.urlChar + BRTMGlobals.equalChar +
                       urlPath + BRTMGlobals.semiColonChar + data.substr(0, data.length - 1);
            },
            /**
             * Utility function to clear the give accumulator
             * @param accName - name of the accumulator (JS Object)
             */
            resetAccumulator : function (accName) {
                if (!accName || typeof accName !== 'string' || !BRTMGlobals ||
                    !BRTMGlobals[accName]) {
                    BRTMLogger.warn("resetAccumulator : could not rest accumulator " + accName);
                    return;
                }
                BRTMGlobals[accName] = {};
            },
            /**
             * Sanity checks the given URL as a string
             * 1. Strip Query Params
             * 2. Remove Anchors
             * 3. Remove chars after semi-colons
             * 4. Decode
             * 5. Remove leading and trailing slashes
             * 6. Remove protocol (http, https)
             * 7. Append Port # if not present
             * @param urlStr - HTTP URL
             * @returns {*}
             */
            sanitizeURL : function (urlStr) {
                if (!urlStr || typeof urlStr !== 'string') {
                    BRTMLogger.warn("sanitizeURL : cannot clean up URL - " + urlStr);
                    return urlStr;
                }
                // Decode URL Encoding, if any
                var saneStr = decodeURIComponent(urlStr);
                var queryIdx = saneStr.indexOf('?');
                // Remove Query Parameters, if any
                if (queryIdx !== -1) {
                    saneStr = saneStr.substring(0, queryIdx);
                }
                // Remove Anchors, if any
                var anchorIdx = saneStr.indexOf('#');
                if (saneStr && anchorIdx !== -1) {
                    saneStr = saneStr.substring(0, anchorIdx);
                }
                // Remove things after Semi-colons
                // e.g. URL/path;jsessionid=39y459hnfannfla
                var semiColonIdx = saneStr.indexOf(BRTMGlobals.semiColonChar);
                if (saneStr && semiColonIdx !== -1) {
                    saneStr = saneStr.substring(0, semiColonIdx);
                }
                var defaultPortNum = 80;
                // Which protocol
                if (saneStr) {
                    // Protocol found in URL
                    if (saneStr.search(/^(http|https):/g) !== -1) {
                        if (saneStr.indexOf("https") !== -1) {
                            defaultPortNum = 443;
                        }
                        saneStr = saneStr.replace(/(http|https):\/\//g, '');
                    } else {
                        if (saneStr.indexOf("/") === 0) {
                            saneStr = window.location.host + saneStr;
                        } else {
                            saneStr = window.location.host + "/" + saneStr;
                        }
                    }
                }
                // If Port # is not there, then add it
                var slashIdx = saneStr.indexOf(BRTMGlobals.forwardSlashChar);
                var stringToSearch = (slashIdx !== -1) ? saneStr.substring(0, slashIdx) :
                    saneStr;
                if (stringToSearch.indexOf(":") === -1) {
                    stringToSearch = stringToSearch + ":" + defaultPortNum;
                }
                if (slashIdx !== -1) {
                    saneStr = stringToSearch + saneStr.substring(slashIdx);
                } else {
                    saneStr = stringToSearch;
                }
                // Remove leading and trailing slashes, if any
                if (saneStr) {
                    saneStr = saneStr.replace(/^\/|\/$/g, '');
                }
                return saneStr;
            },
            /**
             * Dispatches metrics to the Agent with AJAX POST payload
             * @param URL - preferably, BRTM_WILYURL
             * @param data - string as per http://www.w3schools.com/ajax/ajax_xmlhttprequest_send.asp
             */
            sendMetrics : function (URL, data) {
                if (!URL || !data || typeof URL !== 'string') {
                    BRTMLogger.warn("sendMetrics : Cannot send BRTM Metrics to URL: " + URL +
                                    " with data as {{ " + data + " }}.");
                    BRTMGlobals.bCount = 0;
                    BRTMGlobals.postData = "";
                    return;
                }
                // Metrics will be sent via XHR Send. However, we do not want to
                // collect metrics for such an invocation of XHR Send. Redefine them to original.
                BRTMUtils.metricUtils.getRedefinedXHRForMetrics();
                var XHR = BRTMUtils.metricUtils.XHRToSendMetrics;
                if (XHR) {
                    XHR.open("POST", URL, true);
                    XHR.onreadystatechange = function () {
                        if (this.readyState === this.DONE && this.status === 0) {
                            BRTMLogger.error("sendMetrics : BRTM Metrics Send Error. Browser is most likely discarding them.");
                            BRTMGlobals.bCount = 0;
                            BRTMGlobals.postData = "";
                        }
                    };
                    XHR.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                    XHR.send(data);
                    BRTMLogger.info("Sending POST with {{ " + data + " }}");
                }
                // Reset
                BRTMGlobals.bCount = 0;
                BRTMGlobals.postData = "";
            },
            /**
             * Given a metric Obj in a certain format, validates the metrics within it.
             * In the event that the metric value is negative, NaN or undefined, zero it out.
             * Format : "key" --> [metric value, metric aggregator type]
             * @param metricObj - JS Object where keys are metric names and values are
             *                    [metric value, metric aggregator type]
             */
            validateMetrics : function (metricObj) {
                if (!metricObj || typeof metricObj !== 'object') {
                    BRTMLogger.warn("validateMetrics : cannot validate metrics for undefined metric object");
                    return;
                }
                var metricVal;
                for (var metric in metricObj) {
                    if (!metricObj[metric] || metricObj[metric].length !== 2) {
                        metricObj[metric] = [0, BRTMGlobals.metricAggregatorType.INT_LONG_DURATION];
                        BRTMLogger.warn("validateMetrics : invalid metric format. Zeroing it out and defaulting metric aggregator to INT_LONG_DURATION...");
                        continue;
                    }
                    metricVal = metricObj[metric][0];
                    if (metricVal == null || metricVal == undefined ||
                        typeof metricVal !== 'number' || metricVal < 0 || isNaN(metricVal)) {
                        BRTMLogger.warn("validateMetrics : Obtained metric out of range : " +
                                        metric +
                                        ". Zeroing it out...");
                        metricObj[metric][0] = 0;
                    } else {
                        metricObj[metric][0] = parseInt(metricObj[metric][0]);
                    }
                }
            }
        },
        /**
         * Timing Utility
         * Responsible for time related tasks
         */
        timeUtils : {
            /**
             * Obtain current Date and Time with native JS Date()
             * @returns {Date}
             */
            getCurrTime : function () {
                return new Date();
            },
            /**
             * Obtain Time since the current page load in ms
             * @returns {number}
             */
            getCurrTimeInMillis : function () {
                if (!BRTMUtils.BRTMTimer) {
                    BRTMLogger.warn("getCurrTimeInMillis: BRTM Timer is not present.");
                    return 0;
                }
                return BRTMUtils.BRTMTimer.now();
            },
            /**
             * Obtain Time since Epoch in ms
             * @returns {number}
             */
            getCurrTimeInMillisSinceEpoch : function () {
                return new Date().getTime();
            },
            /**
             * Obtains Timer function
             * Obtain the browser "performance.now" function for browsers that support it
             * Otherwise, use a function that makes use of native JS Date()
             * @returns {*|{}}
             */
            getTimerObj : function () {
                var performance = window.performance || {};
                performance.now = (function () {
                    return performance.now || performance.webkitNow ||
                           performance.msNow || performance.oNow ||
                           performance.mozNow ||
                           function () {
                               return new Date().getTime();
                           };
                })();
                return performance;
            }
        }
    };
    /**
     * This object comprises of BRTM global data structures and variables
     * that are accessed in other BRTM objects.
     */
    var BRTMGlobals = {
        // This map is needed to store the AJAX Send timestamps
        // Since AJAX is asynchronous, it is not know when the callback will occur
        // or it will ever occur. But, the AJAX metrics need send timestamps for its
        // calculations. So, store them in a separate map for easy access.
        ajaxSendDataMap : {},
        ampersandChar : "&",
        bCount : 0,
        // The current page Business Segment
        bs : "-1",
        // The current page Business Txn
        bt : "-1",
        // The current page Business Txn Component
        btc : "-1",
        BussSeg : "Business Segment",
        // Txn Trace Flag
        c : "0",
        closedParenChar : ")",
        colonChar : ":",
        commaChar : ",",
        CookiePath : window.location.pathname,
        // Txn Correlation ID
        CorBrowsGUID : null,
        currentURL : window.location.protocol + "//" + window.location.host +
                     window.location.pathname,
        currentFullURL : window.location.href,
        // Metric Name MACROS
        defaultMetricNames : {
            NTAPI_ABRT : "Average Browser Render Time (ms)",
            NTAPI_ADCT : "Average DOM Construction Time (ms)",
            NTAPI_APLCT : "Average Page Load Complete Time (ms)",
            NTAPI_APPUT : "Average Previous Page Unload Time (ms)",
            NTAPI_ARTT : "Average Round Trip Time (ms)",
            NTAPI_ADNSLT : "Average DNS Lookup Time (ms)",
            NTAPI_ATTFB : "Average Time to First Byte (ms)",
            NTAPI_ATTLB : "Average Time to Last Byte (ms)",
            NTAPI_ACET : "Average Connection Establishment Time (ms)",
            OTHER_RPI : "Responses Per Interval",
            FUNC_AET : "Average Execution Time (ms)",
            FUNC_ICPI : "Invocation Count Per Interval",
            AJAX_TRLT : "Total Resource Load Time (ms)",
            AJAX_TTFB : "Time To First Byte (ms)",
            AJAX_TTT : "Response Download Time (ms)",
            AJAX_CBET : "Callback Execution Time (ms)",
            AJAX_ICPI : "Invocation Count Per Interval",
            AJAX_NSHPI : "Non-Server Hits Per Interval"
        },
        dollarChar : "$",
        equalChar : "=",
        forwardSlashChar : "/",
        // BRTM provides capability to instrument any JS functions as long as it is in the
        // scope of the current window. The JS functions that need to be instrumented are
        // added here automatically with BRTMUtils.funcUtils.addFuncToGlobalsInstrumentMap.
        // The format is "key" : {name : "Name of the function"}
        // Note: If the JS Function to be instrumented is a member function inside a JS object,
        //       you may need to add the keyword prototype
        // Example 1 - "Math_Random" : { name : "Math.random" }
        // Example 2 - "XHR_SRH" : { name : "XMLHttpRequest.prototype.setRequestHeader" }
        // See BRTMUtils.funcUtils.addFuncToGlobalsInstrumentMap for more details.
        functionsToInstrument : {
        },
        openParenChar : "(",
        // Metric aggregator types are synonymous with Agent accumulator
        // types such as LONG INTERVAL COUNTER, AVERAGE PER INTERVAL and so on
        metricAggregatorType : {
            INT_LONG_DURATION : 0,
            LONG_INTERVAL_COUNTER : 1
        },
        // Metric Path MACROS
        metricPath : {
            BROWSER : "Browser",
            AJAX : "AJAX Call",
            FUNC : "JavaScript Function",
            URL : "URL"
        },
        // Since BRTM instruments JS Functions within the current window's scope,
        // the original JS Functions are maintained in this map
        // See BRTMUtils.funcUtils.saveOrigObj for more details
        // Metric types are stored here
        // See BRTMUtils.metricUtils.addMetricType for more details
        metricType : {},
        // This map provides mapping between metric types and their respective accumulators
        // For example, metric type of "AJAX" has its own accumulator to store its data points
        //              metric type of "Page" has its own accumulator to store its data points
        // Note: Each accumulator is a JS object
        metricTypeToAccumulatorMap : {},
        // Just as each metric type has its own accumulator,
        // Each metric type has its own harvest function to reap and send metrics using
        // the stored data points
        metricTypeToHarvestMap : {},
        origFuncMap : {},
        p : "-1",
        platformNames : {
            CHROME : "Chrome",
            FIREFOX : "Firefox",
            IE : "IE",
            SAFARI : "Safari"
        },
        pv : "-1",
        // Timestamp MACROS
        timestampNames : {
            START_TIME : "s",
            END_TIME : "e",
            CALLBACK_START_TIME : "cs",
            CALLBACK_END_TIME : "ce",
            FIRST_BYTE : "f",
            LAST_BYTE : "l",
            EXTERNAL : "ex"
        },
        pipeChar : "|",
        postData : "",
        semiColonChar : ";",
        // The current page Txn Trace start time
        startTime : null,
        UNDEFINED : "-1",
        urlChar : "url"
    };
    /**
     * This object is responsible for BRTM page initialization and page tasks
     */
    var BRTMAGENT = {
        bts : 0,
        cookie : null,
        document : document,
        dts : 0,
        ets : 0,
        method : "",
        navTiming : null,
        sts : 0,
        tBRT : -1,
        tConn : -1,
        tDNS : -1,
        tDomLoading : -1,
        tDomReady : -1,
        tFirstByte : -1,
        tLastByte : -1,
        tOnLoad : -1,
        tRTT : -1,
        tUnload : -1,
        window : window,
        init : function () {
            // Initialize all the BRTM Utility functions
            // Logging, Cookie, Browser, Metrics, Function
            BRTMUtils.init();
            // If page is excluded, no page, ajax or js function instrumentation is needed
            if (BRTMUtils.configUtils.isPageExcluded) {
                return;
            }
            // If page load metrics are disabled, no need to instrument page load metrics
            if (!window[BRTMUtils.configUtils.configNames.BRTM_PAGELOADMETRICSENABLED]) {
                BRTMLogger.info("Skipping page instrumentation because Page Load Metrics are DISABLED");
                return;
            }
            // Check for Navigation Timing API
            BRTMAGENT.navTiming = this.window.performance || this.window.msPerformance ||
                                  this.window.webkitPerformance || this.window.mozPerformance;
            // If Navigation Timing API is present, then obtain
            // page load metrics from the performance.timing object
            if (BRTMAGENT.navTiming && BRTMAGENT.navTiming.timing) {
                BRTMLogger.info("Navigation Timing API is present.");
                BRTMLogger.info("Attaching to onload event...");
                this.attachEvent(this.window, "load", function () {
                    BRTMUtils.cookieUtils.updateCookie(BRTMUtils.cookieUtils.cookies.GLOBAL, {
                        "bts" : BRTMAGENT.navTiming.timing.navigationStart,
                        "sts" : BRTMAGENT.navTiming.timing.unloadEventEnd
                    });
                    BRTMAGENT.dts = BRTMAGENT.navTiming.timing.domContentLoadedEventStart;
                    BRTMAGENT.ets = BRTMAGENT.navTiming.timing.loadEventStart;
                    BRTMAGENT.onload();
                }, false);
                // Set the earlier sent cookie to Agent to false.
                // The value in the cookie should be set to false as soon as
                // possible because the cookie might prevent other requests in
                // which the snippet should indeed be inserted.
                BRTMLogger.info("Attaching to onbeforeunload event...");
                this.attachEvent(this.window, "beforeunload", function () {
                    BRTMUtils.cookieUtils.setSelfInstrumentedCookie("false");
                }, true);
            } else {
                // If Navigation Timing API is not present, then obtain
                // page load metrics by attaching to window events such as onbeforeunload,
                // onunload, onload and document.onreadystatechange
                BRTMLogger.info("Navigation Timing API is NOT present. Resorting to alternatives...");
                document.onreadystatechange = function () {
                    if (document.readyState == "complete") {
                        BRTMAGENT.dts = BRTMUtils.timeUtils.getCurrTimeInMillis();
                    }
                }
                // Event triggered when user decides and has acted to leave
                // the page
                BRTMLogger.info("Attaching to onbeforeunload event...");
                this.attachEvent(this.window, "beforeunload", BRTMAGENT.beforeunload, true);
                // Set the earlier sent cookie to Agent to false.
                // The value in the cookie should be set to false as soon as
                // possible because the cookie might prevent other requests in
                // which the snippet should indeed be inserted.
                //
                // This is specifically for browsers (e.g. Mobile Safari)
                // that do not support onbeforeunload event.
                // Use Pagehide event instead.
                BRTMLogger.info("Attaching to pagehide event...");
                window.addEventListener("pagehide", function () {
                    BRTMLogger.info("Detected pagehide event...");
                    BRTMUtils.cookieUtils.setSelfInstrumentedCookie("false");
                }, false);
                // Event triggered when DOM is unloaded from the window
                // frame
                BRTMLogger.info("Attaching to onunload event...");
                this.attachEvent(this.window, "unload", BRTMAGENT.unload, false);
                // Event triggered when onload
                BRTMLogger.info("Attaching to onload event...");
                this.attachEvent(this.window, "load", BRTMAGENT.onload, true);
            }
            // EXTENSION POINT for custom init
            if (BRTMExtension) {
                BRTMExtension.init();
            }
        },
        /**
         * Attaches an event to the given element in the browser
         * @param element - DOM element on which the event is to be attached (e.g. document)
         * @param type : event - name of the event to attach to (e.g. "load")
         * @param expression - callback function to be invoked upon the event
         * @param bubbling
         * @returns {boolean}
         */
        attachEvent : function (element, type, expression, bubbling) {
            bubbling = bubbling || false;
            if (this.window.addEventListener) {
                element.addEventListener(type, expression, bubbling);
                return true;
            } else if (this.window.attachEvent) {
                if (type == "DOMContentLoaded") {
                    this.ieContentLoaded(this.window, expression);
                } else {
                    if (element.attachEvent("on" + type, expression)) {
                        return true;
                    } else {
                        BRTMLogger.warn("attachEvent failed");
                    }
                }
                return true;
            } else {
                return false;
            }
        },
        /**
         * Callback Function for window.onbeforeunload event
         * Note: Not all browsers support the onbeforeunload event.
         *       Mobile Safari does not.
         */
        beforeunload : function () {
            BRTMLogger.info("Detected 'onbeforeunload' event...");
            // Set the earlier sent x-apm-brtm-snippet cookie to Agent to false.
            // The value in the cookie should be set to false as soon as
            // possible because the cookie might prevent other requests in
            // which the snippet should indeed be inserted.
            BRTMUtils.cookieUtils.setSelfInstrumentedCookie("false");
            BRTMAGENT.bts = BRTMUtils.timeUtils.getCurrTimeInMillis();
            // For browsers that do not support the Navigation Timing API, use the onbeforeunload
            // event time as the Start Time of the current page.
            // For browsers that do not support the onbeforeunlod event, see unload callback above.
            BRTMUtils.cookieUtils.updateCookie(BRTMUtils.cookieUtils.cookies.GLOBAL,
                                               {"bts" : BRTMAGENT.bts });
        },
        ieContentLoaded : function (w, fn) {
            var d = w.document,
                done = false,
                init = function () {
                    if (!done) {
                        done = true;
                        fn();
                    }
                };
            (function () {
                try {
                    d.documentElement.doScroll('left');
                } catch (e) {
                    setTimeout(arguments.callee, 50);
                    return;
                }
                init();
            })();
            d.onreadystatechange = function () {
                if (d.readyState === 'complete') {
                    d.onreadystatechange = null;
                    init();
                }
            };
        },
        /**
         *  Callback Function for the window.onload event
         */
        onload : function () {
            BRTMLogger.info("Detected 'onload' event...");
            // Update BS, BT context for the current page from the response cookies
            var responseCookies = BRTMUtils.cookieUtils.getRawCookie(BRTMUtils.cookieUtils.cookies.BTPAGERESP);
            if (!responseCookies) {
                responseCookies = BRTMUtils.cookieUtils.getRawCookie(BRTMUtils.cookieUtils.cookies.BTRESP);
            }
            if (responseCookies) {
                var map = BRTMUtils.cookieUtils.tokenizeCookieIntoMap(responseCookies, ',');
                BRTMUtils.cookieUtils.updateObjWithCookieDataPage(map);
            }
            BRTMUtils.cookieUtils.setBRTMGlobalDataCookie();
            // Calculate the BRTM Page Load metrics with the use of the performance.timing object
            // Note: This object is available only in browsers that support the navigation
            // timing API
            BRTMAGENT.ets = BRTMAGENT.ets || BRTMUtils.timeUtils.getCurrTimeInMillis();
            BRTMAGENT.cookie = BRTMUtils.cookieUtils.getCookieObject();
            if (BRTMAGENT.navTiming && BRTMAGENT.navTiming.timing) {
                BRTMAGENT.tDomLoading = BRTMAGENT.navTiming.timing.domLoading -
                                        BRTMAGENT.navTiming.timing.navigationStart;
                BRTMAGENT.tRTT = BRTMAGENT.navTiming.timing.responseEnd -
                                 BRTMAGENT.navTiming.timing.requestStart;
                BRTMAGENT.tDNS = BRTMAGENT.navTiming.timing.domainLookupEnd -
                                 BRTMAGENT.navTiming.timing.domainLookupStart;
                BRTMAGENT.tConn = BRTMAGENT.navTiming.timing.connectEnd -
                                  BRTMAGENT.navTiming.timing.connectStart;
                BRTMAGENT.tFirstByte = BRTMAGENT.navTiming.timing.responseStart -
                                       BRTMAGENT.navTiming.timing.navigationStart;
                BRTMAGENT.tLastByte = BRTMAGENT.navTiming.timing.responseEnd -
                                      BRTMAGENT.navTiming.timing.navigationStart;
            } else {
                if ((BRTMAGENT.cookie) && (BRTMAGENT.dts > 0) && (BRTMAGENT.cookie.bts > 0) &&
                    ((BRTMAGENT.dts - BRTMAGENT.cookie.bts) > 0)) {
                    BRTMAGENT.tDomLoading = BRTMAGENT.dts - BRTMAGENT.cookie.bts;
                }
            }
            // Determine if this is a page reload or a first time visit
            if (BRTMAGENT.document.referrer.indexOf(BRTMAGENT.document.domain) > -1 &&
                (BRTMAGENT.cookie)) {
                // From same site
                BRTMAGENT.tUnload = 0;
                if (BRTMAGENT.cookie.sts && BRTMAGENT.cookie.bts) {
                    BRTMAGENT.tUnload = BRTMAGENT.cookie.sts - BRTMAGENT.cookie.bts;
                }
                BRTMAGENT.tDomReady = 0;
                if (BRTMAGENT.dts != 0 && BRTMAGENT.cookie.bts) {
                    BRTMAGENT.tDomReady = BRTMAGENT.dts - BRTMAGENT.cookie.bts;
                }
                BRTMAGENT.tOnLoad = 0;
                if (BRTMAGENT.cookie.bts) {
                    BRTMAGENT.tOnLoad = BRTMAGENT.ets - BRTMAGENT.cookie.bts;
                }
                BRTMAGENT.method = "beforeunload";
            } else if (BRTMAGENT.cookie && BRTMAGENT.cookie.bts > 0 &&
                       BRTMAGENT.document.referrer.indexOf(BRTMAGENT.document.domain) == -1) {
                BRTMAGENT.tUnload = 0;
                if (BRTMAGENT.cookie.bts && BRTMAGENT.cookie.sts && BRTMAGENT.cookie.sts > 0) {
                    BRTMAGENT.tUnload = BRTMAGENT.cookie.sts - BRTMAGENT.cookie.bts;
                }
                BRTMAGENT.tDomReady = 0;
                if (BRTMAGENT.dts != 0 && BRTMAGENT.cookie.bts) {
                    BRTMAGENT.tDomReady = BRTMAGENT.dts - BRTMAGENT.cookie.bts;
                }
                BRTMAGENT.tOnLoad = 0;
                if (BRTMAGENT.cookie.bts) {
                    BRTMAGENT.tOnLoad = BRTMAGENT.ets - BRTMAGENT.cookie.bts;
                }
                BRTMAGENT.method = "initial";
            }
            // Dispatch the Page Load metrics
            if (BRTMAGENT.method) {
                BRTMAGENT.tBRT = BRTMAGENT.tOnLoad - BRTMAGENT.tDomLoading;
                var pagePOSTData = BRTMUtils.metricUtils.harvestPageMetrics();
                if (pagePOSTData.length !== 0) {
                    pagePOSTData = "bCount=" + BRTMGlobals.bCount + pagePOSTData;
                    BRTMUtils.metricUtils.sendMetrics(window[BRTMUtils.configUtils.configNames.BRTM_WILYURL],
                                                      pagePOSTData);
                }
            } else {
                BRTMLogger.warn("no method determined");
            }
            // Reset
            BRTMUtils.cookieUtils.updateCookie(BRTMUtils.cookieUtils.cookies.GLOBAL,
                                               {"sts" : null, "bts" : null, "dts" : null});
            BRTMAGENT.sts = 0;
            BRTMAGENT.bts = 0;
            BRTMAGENT.dts = 0;
        },
        /**
         * Callback Function for window.unload event
         */
        unload : function () {
            BRTMLogger.info("Detected 'onunload' event...");
            // For browsers that do neither support the Navigation Timing API not the onbefoeunload
            // event, use onunload event time as the Start Time of the current page
            if (BRTMAGENT.bts === 0) {
                BRTMAGENT.bts = BRTMUtils.timeUtils.getCurrTimeInMillis();
                BRTMUtils.cookieUtils.updateCookie(BRTMUtils.cookieUtils.cookies.GLOBAL,
                                                   {"bts" : BRTMAGENT.bts });
            }
            BRTMAGENT.sts = BRTMUtils.timeUtils.getCurrTimeInMillis();
            BRTMUtils.cookieUtils.updateCookie(BRTMUtils.cookieUtils.cookies.GLOBAL,
                                               { "sts" : BRTMAGENT.sts});
        }
    };
    // Initialize BRTM only if it is enabled.
    if (BRTMUtils.configUtils.getConfig(BRTMUtils.configUtils.configNames.BRTM_ENABLED)) {
        BRTMAGENT.init();
    }
} catch (e) {
    if (window.console && typeof window.console == "object") {
        window.console.log(e.message);
    }
}
