jQuery(document).ready(function($) {
    // use stripeTestKey or stripePubKey
    Stripe.setPublishableKey(shoppAdvStripe.stripePubKey);

    var $form = $("#checkout.shopp");
    var $billing_card = $form.find("#billing-card");
    var $billing_cvv = $form.find("#billing-cvv");

    // hide credit card type selector, since it is automated by Stripe
    $form.find('#billing-cardtype').parent().hide();

    // credit card number and security code formatting
    $billing_card.payment('formatCardNumber');
    $billing_cvv.payment('formatCardCVC');

    $billing_card.on('change keyup paste', (function() {
        // check on every keypress
        if ($.payment.validateCardNumber($(this).val())) {
            // valid credit card number
            $(this).addClass('valid');
            var $type = Stripe.card.cardType($(this).val());
            $form.find("#billing-cardtype option").filter(function() {
                return $type === $(this).text();
            }).prop("selected", "selected");
        } else {
            // invalid number
            $(this).removeClass('valid');
        }
    }));

    var stripeResponseHandler = function(status, response) {

        if (response.error) {
            $form.find(".payment-errors").text("Error: " + response.error.message), $form.find(".payoption-button input").enableSubmit();
        } else {
            $form.find('#billing-card').removeAttr("name");
            $form.find('#billing-cvv').removeAttr("name");
            $form.find('#billing-cardexpires-mm').removeAttr("name");
            $form.find('#billing-cardexpires-yy').removeAttr("name");
            try {
                $("<input>", {
                    type: "hidden",
                    name: "billing[stripeToken]",
                    value: response.id
                }).appendTo($billing_card), $("<input>", {
                    type: "hidden",
                    name: "billing[card]",
                    value: ("0000" + response.card.last4).slice(-4)
                }).appendTo($billing_card), $("<input>", {
                    type: "hidden",
                    name: "billing[cardexpires-mm]",
                    value: ("00" + response.card.exp_month).slice(-2)
                }).appendTo($billing_card), $("<input>", {
                    type: "hidden",
                    name: "billing[cardexpires-yy]",
                    value: ("00" + response.card.exp_year).slice(-2)
                }).appendTo($billing_card);
            } finally {
                $form.get(0).submit();
            }
        }
    };
    $form.submit(function(e) {
        if ("credit-card" == $form.find('input[name="paymethod"]:checked').val()) {
            return e.preventDefault(), Stripe.card.createToken({
                number: $form.find("#billing-card").val(),
                cvc: $form.find("#billing-cvv").val(),
                exp_month: $form.find("#billing-cardexpires-mm").val(),
                exp_year: $form.find("#billing-cardexpires-yy").val(),
                name: $form.find("#billing-name").val(),
                address_line_1: $form.find("#billing-address").val(),
                address_line_2: $form.find("#billing-xaddress").val(),
                address_city: $form.find("#billing-city").val(),
                address_zip: $form.find("#billing-postcode").val(),
                address_state: $form.find("#billing-state-menu").val(),
                address_country: $form.find("#billing-country").val()
            }, stripeResponseHandler), !1;
        }
    });
});