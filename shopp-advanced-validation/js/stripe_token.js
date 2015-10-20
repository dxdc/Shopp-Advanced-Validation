jQuery(document).ready(function($) {
    // use stripeTestKey or stripePubKey
    Stripe.setPublishableKey(shoppAdvStripe.stripePubKey);

    var $form = $('#checkout.shopp');
    var $billing_card = $form.find('#billing-card');

    // hide credit card type selector, since it is automated by Stripe
    $form.find('#billing-cardtype').parent().hide();

    // credit card number and security code formatting
    $billing_card.payment('formatCardNumber');
    $form.find('#billing-cvv').payment('formatCardCVC');
    $billing_card.on('change keyup paste', (function() {
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
    }));

    var stripeResponseHandler = function(status, response) {
        if (response.error) {
            $form.find('.payment-errors').text('Error: ' + response.error.message);
        } else if (!$form.find('#billing-card').attr('name')) {
            // prevent duplicate submit
            return false;
        } else {
            // remove name attributes for credit card, replace with Stripe token
            $form.find('#billing-card', '#billing-cvv', '#billing-cardexpires-mm', '#billing-cardexpires-yy').removeAttr('name');
            try {
                $('<input>', {
                    type: 'hidden',
                    name: 'billing[stripeToken]',
                    value: response.id
                }).appendTo($billing_card), $('<input>', {
                    type: 'hidden',
                    name: 'billing[card]',
                    value: ('0000' + response.card.last4).slice(-4)
                }).appendTo($billing_card), $('<input>', {
                    type: 'hidden',
                    name: 'billing[cardexpires-mm]',
                    value: ('00' + response.card.exp_month).slice(-2)
                }).appendTo($billing_card), $('<input>', {
                    type: 'hidden',
                    name: 'billing[cardexpires-yy]',
                    value: ('00' + response.card.exp_year).slice(-2)
                }).appendTo($billing_card);
            } finally {
                $form.get(0).submit();
            }
        }
    };

    $form.on('shopp_validate', function() {
        if ('credit-card' == $form.find('input[name="paymethod"]:checked').val()) {
            if ($form.data('error').length > 0) {
                // do not retrieve Stripe token if additional errors are present on the form
                return false;
            }

            // populate error data to prevent Shopp submit
            $form.data('error', ['Stripe', 'Disable submit']);

            // prevent duplicate submission
            if ($form.find('#billing-card').attr('name')) {
                // retrieve Stripe token
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