jQuery(document).ready(function($) {
    $.fn.setReadOnly = function(isDisabled) {
        jQuery(this).each(function() {
            if (isDisabled) {
                jQuery(this).attr("readonly", true).addClass("disabled");
            } else {
                jQuery(this).attr("readonly", false).removeClass("disabled");
            }
        });
        return jQuery(this);
    };

    var emailField = $('#email');
    emailLabel = emailField.siblings('label[for="email"]'),
        emailParent = emailField.parent();
    if (!emailLabel.length)
        emailLabel = $('label[for="email"]');
    if (emailField.length) {
        var errorElements = $().add([emailField.get(0), emailLabel.get(0)]);
        mailboxlayerMessageDiv = $('#mailboxlayer-message').hide(),
            generatedCSS = false;
        if (!mailboxlayerMessageDiv.length) {
            mailboxlayerMessageDiv = $('<div id="mailboxlayer-message"></div>').hide();
            mailboxlayerMessageDiv.appendTo(emailParent);
            generatedCSS = true;
        }

        if (generatedCSS) {
            emailParent.css({
                'position': 'relative'
            });
            mailboxlayerMessageDiv.css({
                'font-family': emailField.css('font-family'),
                'font-size': emailField.css('font-size'),
                'font-weight': emailField.css('font-weight'),
                'line-height': 1.5,
                'position': 'absolute',
                'top': emailField.position().top + emailField.outerHeight(),
                'left': 0,
                'width': emailField.outerWidth(),
                'box-sizing': 'border-box'
            });
        }

        var mailboxlayerQuestion = $('<div class="question">Did you mean: <mark class="did-you-mean"></mark>?</div>'),
            mailboxlayerCorrection = $('<div class="correction">Corrected to: <mark class="did-you-mean"></mark></div>'),
            mailboxlayerVerified = $('<div class="verified">Email verified!</div>'),
            mailboxlayerError = $('<div class="error"></div>');

        var showmailboxlayerMessage = function(messageTemplate, options) {
            var messageContent = messageTemplate.clone(true);
            if (options) {
                if (options.message) messageContent.html(options.message);
                if (options.didYouMean) messageContent.find('.did-you-mean').html(options.didYouMean);
            }
            mailboxlayerMessageDiv.html('').append(messageContent).show();
        };

        var hidemailboxlayerMessage = function() {
            mailboxlayerMessageDiv.hide().html('');
        };

        var hidemailboxlayerMessageEvent = function(e) {
            if (e.data.focusoutEvent && 500 > Date.now() - e.data.focusoutEvent.timeStamp)
                return;

            $(this).off('click.mailboxlayerValidator focusin.mailboxlayerValidator');
            hidemailboxlayerMessage();
        };

        mailboxlayerQuestion.find('.did-you-mean').css('cursor', 'pointer').on('click', function() {
            emailField.val($(this).text());
            errorElements.removeClass('error');
            hidemailboxlayerMessage();
        });

        emailField.mailboxlayer_validator({
            api_key: shoppAdvValid.mailboxlayerPubKey,
            in_progress: function(e) {
                $(window).off('.mailboxlayerValidator');
                hidemailboxlayerMessage();
                emailField.setReadOnly(true);
                errorElements.removeClass('error');
            },
            success: function(data, e) {
                if (console) console.log(data);

                var emailParts = data.email.split('@'),
                    missingTLD = false;

                if (-1 === emailParts[1].indexOf('.')) {
                    errorElements.addClass('error');
                    if (data.did_you_mean) {
                        emailField.val(data.did_you_mean);
                        showmailboxlayerMessage(mailboxlayerCorrection, {
                            'didYouMean': data.did_you_mean
                        });
                    }
                } else {
                    if (data.did_you_mean) {
                        showmailboxlayerMessage(mailboxlayerQuestion, {
                            'didYouMean': data.did_you_mean
                        });
                    } else if (data.score < 0.65) {
                        showmailboxlayerMessage(mailboxlayerError, {
                            'message': 'Is this email address correct?'
                        });
                    } else {
                        showmailboxlayerMessage(mailboxlayerVerified);
                    }
                }

                emailField.setReadOnly(false);
                $(window).on('click.mailboxlayerValidator focusin.mailboxlayerValidator', {
                    'focusoutEvent': e
                }, hidemailboxlayerMessageEvent);
            },
            error: function(error, e) {
                errorElements.addClass('error');
                showmailboxlayerMessage(mailboxlayerError, {
                    'message': error
                });
                emailField.setReadOnly(false);
                $(window).on('click.mailboxlayerValidator focusin.mailboxlayerValidator', {
                    'focusoutEvent': e
                }, hidemailboxlayerMessageEvent);
            }
        });
    }
});

//Polyfill for Date.now support in IE8
if (!Date.now) {
    Date.now = function now() {
        return new Date().getTime();
    };
};
