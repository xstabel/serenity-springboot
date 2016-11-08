try {
    var BRTMExtension = {
        init : function () {
            /** DO NOT EDIT **/
            BRTMUtils.metricUtils.addMetricType("misc", BRTMExtension.extAddCustomMiscMetric);
            BRTMExtension.extCollectMiscMetrics();
            /** DO NOT EDIT **/
        },
        extJSFuncMap : {
            /** Add JS Functions here to Instrument
             * Format - "key" : { name : "Name of Function" }
             * Note: If the JS Function to be instrumented is a member function inside a JS object,
             *       you may need to add the keyword prototype
             * Example 1 - "Math_Random" : { name : "Math.random" }
             * Example 2 - "XHR_SRH" : { name : "XMLHttpRequest.prototype.setRequestHeader" }
             *
             **/

        },
        extAddJSFuncToInstrument : function () {
            /** DO NOT EDIT **/
            for (var fn in BRTMExtension.extJSFuncMap) {
                BRTMUtils.funcUtils.addFuncToGlobalsInstrumentMap(fn,
                                                                  BRTMExtension.extJSFuncMap[fn]);
            }
            /** DO NOT EDIT **/
        },
        extCustomPageMetricMap : {},
        extAddCustomPageMetric : function () {
            /** Step 1
             *  Do you work to collect metrics
             *
             */

            /** Step 2
             *  Populate extCustomPageMetricMap with metrics
             *  Note: Keys in extCustomPageMetricMap are metric names
             *        Values are arrays with 2 values : [metric value, metric Aggregator Type]
             *        metric Aggregator Types are
             *        0 : INT_LONG_DURATION,
             *        1 : LONG_INTERVAL_COUNTER
             *
             *        INT_LONG_DURATION : These metrics are aggregated over time by taking
             *        the average of the values per interval
             *
             *        LONG_INTERVAL_COUNTER : These metrics are aggregated over time by
             *        summing the values per interval.
             *
             *  Example 1 - "Average Round Trip Time (ms)" ---> [254, 0]
             *  Example 2 - "Invocation Count Per Interval" ---> [2, 1]
             */
        },
        extCustomJSFuncMetricMap : {},
        extAddCustomJSFuncMetric : function () {
            /** Step 1
             *  Do you work to collect metrics
             *
             */

            /** Step 2
             *  Populate extCustomJSFuncMetricMap with metrics
             *  Note: Keys in extCustomJSFuncMetricMap are metric names
             *        Values are arrays with 2 values : [metric value, metric Aggregator Type]
             *        metric Aggregator Types are
             *        0 : INT_LONG_DURATION,
             *        1 : LONG_INTERVAL_COUNTER
             *
             *        INT_LONG_DURATION : These metrics are aggregated over time by taking
             *        the average of the values per interval
             *
             *        LONG_INTERVAL_COUNTER : These metrics are aggregated over time by
             *        summing the values per interval.
             *
             *  Example 1 - "Average Round Trip Time (ms)" ---> [254, 0]
             *  Example 2 - "Invocation Count Per Interval" ---> [2, 1]
             */
        },
        extCustomAjaxMetricMap : {},
        extAddCustomAjaxMetric : function () {
            /** Step 1
             *  Do you work to collect metrics
             *
             */

            /** Step 2
             *  Populate extCustomAjaxMetricMap with metrics
             *  Note: Keys in extCustomAjaxMetricMap are metric names
             *        Values are arrays with 2 values : [metric value, metric Aggregator Type]
             *        metric Aggregator Types are
             *        0 : INT_LONG_DURATION,
             *        1 : LONG_INTERVAL_COUNTER
             *
             *        INT_LONG_DURATION : These metrics are aggregated over time by taking
             *        the average of the values per interval
             *
             *        LONG_INTERVAL_COUNTER : These metrics are aggregated over time by
             *        summing the values per interval.
             *
             *  Example 1 - "Average Round Trip Time (ms)" ---> [254, 0]
             *  Example 2 - "Invocation Count Per Interval" ---> [2, 1]
             */
        },
        extCustomMiscMetricMap : {},
        extCollectMiscMetrics : function () {
            /** Step 1
             *  Do you work to collect metrics
             *  Save the metrics in BRTMGlobals.metricTypeToAccumulatorMap[BRTMGlobals.metricType.MISC];
             */

            /** DO NOT EDIT **/
            BRTMUtils.metricUtils.harvestMetrics(BRTMGlobals.metricType.MISC);
            /** DO NOT EDIT **/
        },
        extAddCustomMiscMetric : function () {
            /** Step 2
             *  Populate extCustomMiscMetricMap with metrics
             *  Note: Keys in extCustomMiscMetricMap are metric names
             *        Values are arrays with 2 values : [metric value, metric Aggregator Type]
             *        metric Aggregator Types are
             *        0 : INT_LONG_DURATION,
             *        1 : LONG_INTERVAL_COUNTER
             *
             *        INT_LONG_DURATION : These metrics are aggregated over time by taking
             *        the average of the values per interval
             *
             *        LONG_INTERVAL_COUNTER : These metrics are aggregated over time by
             *        summing the values per interval.
             *
             *  Example 1 - "Average Round Trip Time (ms)" ---> [254, 0]
             *  Example 2 - "Invocation Count Per Interval" ---> [2, 1]
             */

            /**
             * Step 3
             * Delete Data Points in BRTMGlobals.metricTypeToAccumulatorMap[BRTMGlobals.metricType.MISC]
             * Note: If not deleted, then metrics will be duplicated
             */

            /** Step 4 (OPTIONAL)
             *  Validate the Metrics created above (e.g. Check for negative values)
             *
             */

            /** DO NOT EDIT **/
            var extCustomMiscMetricData = "";
            var extCustomMiscMetricPfx = "MISC";
            var urlPath = BRTMGlobals.UNDEFINED;
            if (BRTMGlobals.bs === BRTMGlobals.UNDEFINED) {
                extCustomMiscMetricPfx = BRTMUtils.metricUtils.convertURL(BRTMUtils.metricUtils.sanitizeURL(BRTMGlobals.currentURL));
                urlPath = extCustomMiscMetricPfx;
                extCustomMiscMetricPfx += BRTMGlobals.pipeChar + "MISC";
            }

            for (var metric in BRTMExtension.extCustomMiscMetricMap) {
                extCustomMiscMetricData += BRTMUtils.metricUtils.constructMetricPath(extCustomMiscMetricPfx,
                                                                                     metric,
                                                                                     BRTMExtension.extCustomMiscMetricMap[metric][0],
                                                                                     BRTMExtension.extCustomMiscMetricMap[metric][1]);
            }
            if (extCustomMiscMetricData.length > 0) {
                // Form the data in Post Parameter Data Format
                // b0: <optional Params>$bs=-1,bt=-1,btc=-1;Responses Per Interval=(2,1);
                extCustomMiscMetricData = BRTMUtils.metricUtils.placeInPostParameterFormat(BRTMGlobals.bs,
                                                                                           BRTMGlobals.bt,
                                                                                           BRTMGlobals.btc,
                                                                                           urlPath,
                                                                                           "",
                                                                                           extCustomMiscMetricData);
                BRTMGlobals.bCount++;
            }
            return extCustomMiscMetricData;
            /** DO NOT EDIT **/
        },
        extAddCustomOptionalProperty : function () {
            /** DO NOT EDIT **/
            var extCustomOptionalProperty = "";
            /** DO NOT EDIT **/

            /** Add Txn Trace Properties here
             * Format - "propertyName1=value2; propertyName2=value2"
             * Example 1 - "duration=145;p=Chrome;pv=40"
             * Example 2 - "g=-255,-255;startTime=1426898454"
             **/

            /** DO NOT EDIT **/
            return extCustomOptionalProperty;
            /** DO NOT EDIT **/
        },
        extNameFormatter : function (unformattedMetricPath) {
            /**
             * DO NOT EDIT
             */
            var formattedMetricPath = unformattedMetricPath;
            /**
             * DO NOT EDIT
             */

            /**
             *  Step 1: Do your work to format the input metric path
             *
             *  Step 2: Replace the formatted metric path as a string to "formattedMetricPath" variable
             *
             *  EXAMPLE:
             *  Let "unformattedMetricPath" comprises of metric paths such as the following:
             *  localhost/5080|/worldpop|AJAX Call|localhost/5080|/country_1/country.json:Invocation Count Per Interval=(1,1);
             *  localhost/5080|/worldpop|AJAX Call|localhost/5080|/country_2/country.json:Invocation Count Per Interval=(1,1);
             *  localhost/5080|/worldpop|AJAX Call|localhost/5080|/country_3/country.json:Invocation Count Per Interval=(1,1);
             *
             *  Let's combine all of the "localhost/5080|/worldpop|AJAX Call|localhost/5080|/country_#/country.json"
             *  into "localhost/5080|/worldpop|AJAX Call|localhost/5080|/country.json" and let's
             *  change the "Invocation Count Per Interval" to "Country Visit Count"
             *
             *  Step 1: Do your work to format the input metric path
             *  var myMetricPath = unformattedMetricPath.replace(/country_\d+\//g, "")
             *                                      .replace("/Invocation Count Per Interval/g",
             *                                               "Country Visit Count");
             *
             *  Step 2: Replace the formatted metric path as a string to "formattedMetricPath" variable
             *  formattedMetricPath = myMetricPath;
             *
             */

            /**
             * DO NOT EDIT
             */
            return formattedMetricPath;
            /**
             * DO NOT EDIT
             */
        }

        /**
         * ADD YOUR OWN CODE HERE
         */

    };
} catch (e) {
    if (BRTMLogger) {
        BRTMLogger.log("BRTMExtensionError: " + e.message);
    } else if (window && window.console) {
        window.console.log("BRTMExtensionError: " + e.message)
    }
}
