# Shopp Advanced Validation
Wordpress plugin to add advanced input validation to Shopp's checkout page. (http://shopplugin.net)

### Installation
* Load the shopp-advanced-validation folder into your WP plugins directory and activate the plugin in the WP panel

## 1. Advanced Email Validation via Mailgun API or Mailboxlayer API

This is based on the Mailgun validator:
https://github.com/mailgun/validator-demo

You can also see this page for a working demo:
http://www.mailgun.com/email-validation

### Features
Given an arbitrary address, Mailgun will validate the address based on:

* Syntax checks (RFC defined grammar)
* DNS validation
* Spell checks
* Email Service Provider (ESP) specific local-part grammar (if available)

Mailboxlayer has similar validation criteria, but seems to offer improved detection algorithms.

Note: If both Mailgun and Mailboxlayer API keys are detected; Mailgun will be preferentially used.

### How to use the Mailgun email validator on your Shopp

1. Sign up for a Mailgun account get a public API key
2. Add ```defined('MAILGUN_PUBLIC_API_KEY', 'YOUR_PUBLIC_API_KEY');``` into your wp-config.php file (with the API key from the previous step)
3. ```#mailgun-message``` can be customized to include your own HTML/CSS.

### To use Mailboxlayer email validator on your Shopp

1. Sign up for a Mailboxlayer account get a public API key
2. Add ```defined('MAILBOXLAYER_PUBLIC_API_KEY', 'YOUR_PUBLIC_API_KEY');``` into your wp-config.php file (with the API key from the previous step)
3. ```#mailboxlayer-message``` can be customized to include your own HTML/CSS.

## 2. Password strength evaluation via the jQuery Complexify algorithm.

This is based on the Complexify algorithm:
https://www.danpalmer.me/jquery-complexify

### Features
Casually enforces password strength via Complexity algorithm and also banned password lists.

* Password strength indicator
* 500 most common Twitter passwords are banned
* Provides "Match" / "No Match" indicators for verification.

### How to use the password strength indicator on your Shopp
1. Sign up for a Mailgun account get a public API key.
2. Add ```defined('COMPLEXIFY_PASSWORD_FIELDS', true);``` into your wp-config.php file.
3. ```<div id="password-strength"></div>``` and/or ```<div id="password-match"></div>``` can be customized to include your own HTML/CSS.

## 3. Google Maps Places API address auto complete.

This is based on the Google places autocomplete:
https://google-developers.appspot.com/maps/documentation/javascript/examples/full/places-autocomplete-addressform

### Features
Dropdown autocomplete address list based on user's current location, autofills remaining fields once an address is selected. Provides geolocated coordinates by browser, or using freegeoIP as a fallback. If Google is not supported in certain regions (e.g., China), the library is not loaded.

### Quirks
Lookup chokes if you add in apartment numbers since these are not supported by Google.

### How to use the Google places autocomplete on your Shopp
1. Sign up for a Google Maps Javascript API browser key. https://developers.google.com/console/help/new/?hl=en_US#credentials-access-security-and-identity
2. Add ```defined('GOOGLE_MAPS_JS_API_BROWSER_KEY', 'YOUR_BROWSER_KEY');``` into your wp-config.php file.
3. You can include ```&placeholder=Enter your address``` in your checkout.php template for the billing-address and/or shipping-address fields for additional user prompting.

## 4. Using Stripe tokens and Apple Pay.

This modification enables the use of Stripe's tokens during Shopp checkout. This enhances PCI compliance, and also provides an improved checkout experience for the user with AJAX responses for credit card processing.

### Features
* Apple Pay is supported (where available, currently only iOS and macOS Sierra with Safari)
* If the Stripe JS script fails for any reason, the script is designed to fallback to the standard Shopp / Stripe checkout
* Errors are dynamically reported to the user prior to form submission

### How to enable Stripe tokens and Apple Pay on your Shopp

1. Sign up for a Stripe account and activate your account and Apple Pay for your domain (all via Stripe admin dashboard)
2. Add ```defined('STRIPE_PUBLIC_API_KEY', 'YOUR_PUBLIC_API_KEY');``` or ```defined('STRIPE_TEST_API_KEY', 'YOUR_PUBLIC_API_KEY');``` into your wp-config.php file. If `STRIPE_TEST_API_KEY` is detected, it is used preferentially.
3. Edit the core/flow/Checkout.php and core/library/Validation.php files from the wp-content/plugins/shopp installation. Diffs are provided in the `stripe-addons` folder, and are from the latest Shopp 1.3.12 release.
4. Edit `themes/your_theme/shopp/checkout.php` template to incorporate the changes listed in `stripe-addons/templates-Checkout.php`.
    - Label for Stripe error messages (returns some AJAX error messages)
    - Use of data-stripe
    - Use of autocomplete (not required)
    - Apple Pay button (only shown if supported)
5. Edit the shopp-addons/stripe/Stripe.php gateway file:

    Delete these lines:
    
 ```
'paytype'   => $Billing->cardtype,
'payid'     => Billing->card,
...
...
'card'     => array(
```

    Replace with:

```
'paytype'   => $response->source->brand, // $Billing->cardtype
'payid'     => $response->source->last4, // Billing->card
...
...
'source'     => isset($Billing->stripeToken) ? $Billing->stripeToken : array(
```

6. The `creditcards.css` file contains additional customizations for the Apple Pay button. Note: Follow Stripe's instructions to test Apple Pay with your test Stripe key, as an Apple Pay Sandbox account is required.
