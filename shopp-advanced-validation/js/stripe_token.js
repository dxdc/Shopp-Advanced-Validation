jQuery(document).ready(function($) {
    // Override with test key if present
    Stripe.setPublishableKey(shoppAdvStripe.stripeTestKey || shoppAdvStripe.stripePubKey);

    var $form = $('#checkout.shopp');
    var $billing_card = $form.find('#billing-card');
    var $applepay_button = $form.find('#apple-pay-button') || undefined;

    // hide credit card type selector, since it is automated by Stripe
    $form.find('#billing-cardtype').parent().hide();

    // credit card number and security code formatting
    $billing_card.payment('formatCardNumber');
    $form.find('#billing-cvv').payment('formatCardCVC');
    $billing_card.on('change keyup paste', function() {
        // check on every keypress
        if ($.payment.validateCardNumber($(this).val())) {
            // valid credit card number
            $(this).addClass('valid');
            var $type = Stripe.card.cardType($(this).val());
            $form.find('#billing-cardtype option').filter(function() {
                return $type === $(this).text();
            }).prop('selected', 'selected');
        } else {
            // invalid number
            $(this).removeClass('valid');
        }
    });

    // General functions

    function isDuplicate() {
        // Only check for #billing-card
        if ($form.find('#billing-card').attr('name')) return false;
        return true;
    }

    function showError(error) {
        if (error.message === undefined || error.message === 'Stripe') return;
        $form.find('.payment-errors').text('Error: ' + error.message);
    }

    // Append Stripe token and checkout

    function shoppCheckout(id, last4, exp_month, exp_year) {
        // prevent duplicate submission
        if (isDuplicate()) return false;

        try {
            // remove name attributes for credit card, replace with Stripe token
            $form.find('#billing-card, #billing-cvv, #billing-cardexpires-mm, #billing-cardexpires-yy').removeAttr('name');
            $('<input>', {
                type: 'hidden',
                name: 'billing[stripeToken]',
                value: id
            }).appendTo($billing_card), $('<input>', {
                type: 'hidden',
                name: 'billing[card]',
                value: ('0000' + last4).slice(-4)
            }).appendTo($billing_card), $('<input>', {
                type: 'hidden',
                name: 'billing[cardexpires-mm]',
                value: ('00' + exp_month).slice(-2)
            }).appendTo($billing_card), $('<input>', {
                type: 'hidden',
                name: 'billing[cardexpires-yy]',
                value: ('00' + exp_year).slice(-2)
            }).appendTo($billing_card);
        } finally {
            $form.get(0).submit();
        }
    }

    // Apple Pay functions

    function triggerApplePay() {
        // Set payment method flag
        $applepay_button.data('applepay', true);

        // Reset error messages
        $form.find('.payment-errors').text('');

        // Apple Pay placeholder data to bypass Shopp credit card verification
        $form.find('#billing-card').val('4242424242424242');
        $form.find('#billing-cvv').val('123');

        var mm = $form.find('#billing-cardexpires-mm option').last().val(); // last month in list
        var yy = $form.find('#billing-cardexpires-yy option').last().val(); // last year in list

        $form.find('#billing-cardexpires-mm').val(mm);
        $form.find('#billing-cardexpires-yy').val(yy);

        // Run form validation (not needed if button element is used)
        // $form.submit();
    }

    function showApplePay(available) {
        // If Apple Pay is available, display the button on checkout page

        // see CSS for classes
        // <span id="apple-pay-box">
        // <button id="apple-pay-button" class="apple-pay-button-with-text apple-pay-button-black-with-text"></button>
        // </span>
        if (available && $applepay_button !== undefined) {
            $form.find('#apple-pay-box').show();
            $applepay_button.on('click', triggerApplePay);
        }
    }

    function applePaySuccessHandler(result, completion) {
        // Set card type
        $form.find('#billing-cardtype option').filter(function() {
            return result.token.card.brand === $(this).text();
        }).prop('selected', 'selected');

        completion(ApplePaySession.STATUS_SUCCESS);
        shoppCheckout(result.token.id, result.token.card.last4, result.token.card.exp_month, result.token.card.exp_year);
    }

    function clearApplePayData() {
        if ($applepay_button === undefined || $applepay_button.data('applepay') === undefined) return false;

        // Reset Apple Pay placeholder data
        $applepay_button.removeData('applepay');
        $form.find('#billing-card, #billing-cvv, #billing-cardexpires-mm, #billing-cardexpires-yy').val('');
        $form.find('#billing-card, #billing-cvv, #billing-cardexpires-mm, #billing-cardexpires-yy').removeClass('error');
        $form.find('label[for=billing-card], label[for=billing-cvv], label[for=billing-cardexpires-mm], label[for=billing-cardexpires-yy]').removeClass('error');
        return true;
    }

    function beginApplePay() {
        // Payment details
        var labelShopp = $('link[rel=alternate]').attr('title').replace(/\s*».*/, ''); // Shopp name
        var total = $('#cart span.cart-total').text().replace(/[^0-9\.]+/g, '');

        var paymentRequest = {
            countryCode: 'US',
            currencyCode: 'USD',
            requiredBillingContactFields: ['postalAddress'],
            requiredShippingContactFields: ['name', 'email'],
            total: {
                label: labelShopp,
                amount: total
            }
        };

        try {
            var session = Stripe.applePay.buildSession(paymentRequest, applePaySuccessHandler, showError);
            session.begin();
        } catch (err) {
            showError(err);
        }
    }

    // verify Apple Pay availability
    Stripe.applePay.checkAvailability(showApplePay);

    // Stripe JS functions

    var stripeResponseHandler = function(status, response) {
        if (response.error) {
            showError(response.error);
            return false;
        }

        return shoppCheckout(response.id, response.card.last4, response.card.exp_month, response.card.exp_year);
    };

    // Interrupt Shopp form validation
    $form.on('shopp_validate', function(e) {
        if ('credit-card' == $form.find('input[name="paymethod"]:checked').val()) {

            var isApplePay = clearApplePayData();

            if ($form.data('error').length > 0 || isDuplicate()) {
                // do not proceed if additional errors are present on the form
                // or in case of duplicate submission
                var error = {
                    message: $form.data('error')[0] || undefined
                };
                showError(error);

                if (isApplePay) {
                    // Prevent additional form validation
                    e.preventDefault();
                    e.stopImmediatePropagation();
                }
                return false;
            }

            // populate error data to prevent Shopp submit
            $form.data('error', ['Stripe', 'Disable submit']);

            if (isApplePay) {
                // Prevent additional form validation
                e.preventDefault();
                e.stopImmediatePropagation();

                // Retrieve Apple Pay token
                setTimeout(function() {
                    beginApplePay();
                }, 1);
            } else {
                // Retrieve Stripe JS token
                setTimeout(function() {
                    Stripe.card.createToken({
                        number: $form.find('#billing-card').val(),
                        cvc: $form.find('#billing-cvv').val(),
                        exp_month: $form.find('#billing-cardexpires-mm').val(),
                        exp_year: $form.find('#billing-cardexpires-yy').val(),
                        name: $form.find('#billing-name').val(),
                        address_line_1: $form.find('#billing-address').val(),
                        address_line_2: $form.find('#billing-xaddress').val(),
                        address_city: $form.find('#billing-city').val(),
                        address_zip: $form.find('#billing-postcode').val(),
                        address_state: $form.find('#billing-state-menu').val(),
                        address_country: $form.find('#billing-country').val()
                    }, stripeResponseHandler);
                }, 1);
            }
        }
    });
});
