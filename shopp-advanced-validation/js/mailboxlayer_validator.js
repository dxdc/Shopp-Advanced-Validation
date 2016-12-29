//
// Mailboxlayer Address Validation Plugin
//
// Attaching to a form:
//
//    $('jquery_selector').mailboxlayer_validator({
//        api_key: 'api-key',
//        in_progress: in_progress_callback, // called when request is made to validator
//        success: success_callback,         // called when validator has returned
//        error: validation_error,           // called when an error reaching the validator has occured
//    });
//
//
// Sample JSON in success callback:
//
// {
//  "email": "support@apilayer.com",
//  "did_you_mean": "",
//  "user": "support",
//  "domain": "apilayer.net",
//  "format_valid": true,
//  "mx_found": true,
//  "smtp_check": true,
//  "catch_all": false,
//  "role": true,
//  "disposable": false,
//  "free": false,
//  "score": 0.8
// }
//
// More API details: https://mailboxlayer.com/documentation
//
(function($) {
    $.fn.mailboxlayer_validator = function(options) {
        return this.each(function() {
            var thisElement = $(this);
            thisElement.focusout(function(e) {
                //Fix for buggy event timestamps in Firefox and IE
                e.timeStamp = Date.now();
                //Trim string and autocorrect whitespace issues
                var elementValue = thisElement.val();
                elementValue = $.trim(elementValue);
                thisElement.val(elementValue);

                //Attach event to options
                options.e = e;

                run_validator(elementValue, options, thisElement);
            });
        });
    };

    function run_validator(address_text, options, element) {
        //Abort existing AJAX Request to prevent flooding
        if (element.mailboxlayerRequest) {
            element.mailboxlayerRequest.abort();
            element.mailboxlayerRequest = null;
        }

        // don't run validator without input
        if (!address_text) {
            return;
        }

        // validator is in progress
        if (options && options.in_progress) {
            options.in_progress(options.e);
        }

        // don't run dupicate calls
        if (element.mailboxlayerLastSuccessReturn) {
            if (address_text == element.mailboxlayerLastSuccessReturn.address) {
                if (options && options.success) {
                    options.success(element.mailboxlayerLastSuccessReturn, options.e);
                }
                return;
            }
        }

        // length and @ syntax check
        var error_message = false;
        if (address_text.length > 512)
            error_message = 'Email address exceeds maxiumum allowable length of 512.';
        else if (1 !== address_text.split('@').length - 1)
            error_message = 'Email address must contain only one @.';

        if (error_message) {
            if (options && options.error) {
                options.error(error_message, options.e);
            } else {
                if (console) console.log(error_message);
            }
            return;
        }

        // require api key
        if (options && options.api_key == undefined) {
            if (console) console.log('Please pass in api_key to mailboxlayer_validator.');
        }

        // timeout incase of some kind of internal server error
        var timeoutID = setTimeout(function() {
            error_message = 'Error occurred, unable to validate address.';
            if (!success) {
                //Abort existing AJAX Request for a true timeout
                if (element.mailboxlayerRequest) {
                    element.mailboxlayerRequest.abort();
                    element.mailboxlayerRequest = null;
                }

                if (options && options.error) {
                    options.error(error_message, options.e);
                } else {
                    if (console) console.log(error_message);
                }
            }
        }, 10000); //10 seconds

        // make ajax call to get validation results
        element.mailboxlayerRequest = $.ajax({
            type: 'GET',
            url: 'https://apilayer.net/api/check?callback=?',
            data: {
                email: address_text,
                smtp: 1,
                access_key: options.api_key
            },
            dataType: 'jsonp',
            crossDomain: true,
            success: function(data, status_text) {
                clearTimeout(timeoutID);

                element.mailboxlayerLastSuccessReturn = data;
                if (options && options.success) {
                    options.success(data, options.e);
                }
            },
            error: function(request, status_text, error) {
                clearTimeout(timeoutID);
                error_message = 'Error occurred, unable to validate address.';

                if (options && options.error) {
                    options.error(error_message, options.e);
                } else {
                    if (console) console.log(error_message);
                }
            }
        });
    }
})(jQuery);

//Polyfill for Date.now support in IE8
if (!Date.now) {
    Date.now = function now() {
        return new Date().getTime();
    };
}
