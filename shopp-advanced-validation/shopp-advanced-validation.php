<?php
/*
Plugin Name: Shopp Advanced Validation
Plugin URI: http://github.com/msigley/
Description: Implements advanced email validation on the shopp checkout page.
Version: 1.3.1
Author: Matthew Sigley
Author URI: http://github.com/msigley/
License: GPLv3
*/

// Support for Constants in wp-config.php
$args = array(
    'mailgun_public_api_key',
    'google_maps_js_api_browser_key',
    'complexify_password_fields',
    'stripe_public_api_key',
    'stripe_test_api_key',
    'update_cart_tooltip'
);

class ShoppAdvancedValidation
{
    private static $object = null;
    private $plugin_slug = null;
    public $url = null;
    public $path = null;

    private function __construct($args = array())
    {
        foreach ($args as $arg_name => $arg_value) {
            if (!empty($arg_value)) {
                $this->$arg_name = $arg_value;
            }
            else {
                $this->$arg_name = false;
            }
        }

        // Plugin slug for internal action and filter identification
        $this->plugin_slug = 'shopp_adv_valid';

        // Setup relative url
        $this->file      = $file = basename(__FILE__);
        $this->directory = $directory = basename(dirname(__FILE__));
        $this->url       = trailingslashit(WP_PLUGIN_URL . '/' . $this->directory);
        if (is_ssl())
            $this->url = str_replace('http://', 'https://', $this->url);

        // Setup local filepath
        $this->path = plugin_dir_path(__FILE__);

        add_action('init',
        array($this, 'register_css_js'
        ));

        add_action('wp_enqueue_scripts',
        array($this, 'enqueue_css_js'
        ));
    }

    static function &object($args = array())
    {
        if (!self::$object instanceof ShoppAdvancedValidation) {
            if (empty($args))
                return false;
            self::$object = new ShoppAdvancedValidation($args);
        }
        return self::$object;
    }

    public function register_css_js()
    {
        //Use YYYYMMDD as version for ~24 hour brower caching.
        $version  = date('Ymd', current_time('timestamp'));
        $protocol = (is_ssl()) ? 'https' : 'http';

        // Mailgun Email Validator Scripts
        if ($this->mailgun_public_api_key) {
            wp_register_script($this->plugin_slug . '_mailgun_validator',
            $this->url . 'js/mailgun_validator.js',
            array('jquery'),
            $version);

            wp_register_script($this->plugin_slug . '_checkout_email',
            $this->url . 'js/checkout_email.js',
            array($this->plugin_slug . '_mailgun_validator'),
            $version);

            wp_localize_script($this->plugin_slug . '_checkout_email',
            'shoppAdvValid',
            array(
                'mailgunPubKey' => $this->mailgun_public_api_key
            ));

            wp_register_style($this->plugin_slug . '_css_checkout_email',
            $this->url . 'css/mailgun.css',
            null,
            $version);
        }

        // Complexify Password Strength Scripts
        if ($this->complexify_password_fields) {
            wp_register_script($this->plugin_slug . '_complexify_banlist',
            $this->url . 'js/jquery.complexify.banlist.rot47.js',
            array('jquery'),
            $version);

            wp_register_script($this->plugin_slug . '_complexify',
            $this->url . 'js/jquery.complexify.js',
            array($this->plugin_slug . '_complexify_banlist'),
            $version);

            wp_register_script($this->plugin_slug . '_checkout_password',
            $this->url . 'js/checkout_password.js',
            array($this->plugin_slug . '_complexify'),
            $version);
        }

        // Google Places Autocomplete
        if ($this->google_maps_js_api_browser_key) {
            wp_register_script($this->plugin_slug . '_autocomplete_lib',
            $protocol . '://maps.googleapis.com/maps/api/js?key=' . $this->google_maps_js_api_browser_key . '&libraries=places',
            array('jquery'),
            null);

            wp_register_script($this->plugin_slug . '_address_autocomplete',
            $this->url . 'js/autocomplete.js',
            array($this->plugin_slug . '_autocomplete_lib'),
            $version);
        }


        // Auto refresh cart, add tooltip
        if ($this->update_cart_tooltip) {
            wp_register_script($this->plugin_slug . '_cart',
            $this->url . 'js/update_cart.js',
            array('jquery'),
            $version);
        }

        // Stripe
        if ($this->stripe_public_api_key || $this->stripe_test_api_key) {
            wp_register_script($this->plugin_slug . '_stripe_lib',
            'https://js.stripe.com/v2/',
            array('jquery'),
            null);

            // https://github.com/stripe/jquery.payment
            wp_register_script($this->plugin_slug . '_jquery_payment_lib',
            $this->url . 'js/jquery.payment.js',
            array('jquery'),
            $version);

            wp_register_script($this->plugin_slug . '_stripe_token',
            $this->url . 'js/stripe_token.js',
            array(
                $this->plugin_slug . '_stripe_lib',
                $this->plugin_slug . '_jquery_payment_lib'
            ),
            $version);

            wp_localize_script($this->plugin_slug . '_stripe_token',
            'shoppAdvStripe',
            array(
                'stripePubKey' => ($this->stripe_public_api_key) ? $this->stripe_public_api_key : '',
                'stripeTestKey' => ($this->stripe_test_api_key) ? $this->stripe_test_api_key : ''
            ));

            wp_register_style($this->plugin_slug . '_css_creditcards',
            $this->url . 'css/creditcards.css',
            null,
            $version);
        }

    }

    public function enqueue_css_js()
    {
        if (is_checkout_page()) {
            // Mailgun
            if ($this->mailgun_public_api_key) {
                wp_enqueue_script($this->plugin_slug . '_checkout_email');
                wp_enqueue_style($this->plugin_slug . '_css_checkout_email');
            }

            // Complexify
            if ($this->complexify_password_fields)
                wp_enqueue_script($this->plugin_slug . '_checkout_password');

            // Google Places Autocomplete
            if ($this->google_maps_js_api_browser_key)
                wp_enqueue_script($this->plugin_slug . '_address_autocomplete');

            // Stripe Tokens and Credit Card Validation/CSS
            if ($this->stripe_public_api_key || $this->stripe_test_api_key) {
                wp_enqueue_script($this->plugin_slug . '_stripe_token');
                wp_enqueue_style($this->plugin_slug . '_css_creditcards');
            }

        }

        else if (is_cart_page()) {
            // Auto-refresh cart, add tooltip
            if ($this->update_cart_tooltip)
                wp_enqueue_script($this->plugin_slug . '_cart');

        }

        else if (is_account_page() && 'profile' == ShoppStorefront()->account['request']) {
            // Complexify
            if ($this->complexify_password_fields)
                wp_enqueue_script($this->plugin_slug . '_checkout_password');
        }
    }
}

foreach($args as $arg) {
    $args[$arg] = (defined(strtoupper($arg))) ? constant(strtoupper($arg)) : null;
}

$ShoppAdvancedValidation = ShoppAdvancedValidation::object($args);
