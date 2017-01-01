				<li class="payment">
					<label for="billing-card"><?php _e( 'Payment Information', 'Shopp' ); ?></label>
					<label for="stripe" class="payment-errors error"></label>
	                <span id="apple-pay-box">
	                    <!-- only shown if supported -->
        	            <label for="apple-pay-button"><?php _e( 'Apple Pay', 'Shopp' ); ?></label>
                	    <button id="apple-pay-button" class="apple-pay-button-with-text apple-pay-button-black-with-text"></button>
					</span>
				</li>
                <li class="payment">
					<span>
						<label for="billing-card"><?php _e( 'Credit/Debit Card Number', 'Shopp' ); ?></label>
						<?php $credit_card = shopp( 'checkout.billing-card', 'required=true&size=30&title=' . __( 'Credit/Debit Card Number', 'Shopp' ) .'&placeholder=•••• •••• •••• ••••&autocomplete=cc-number&return=true' );
						echo preg_replace('/name=/', 'data-stripe="number" name=', $credit_card);
						?>
					</span>
					<span>
						<label for="billing-cvv"><?php _e( 'Security ID', 'Shopp' ); ?></label>
						<?php $cvv = shopp( 'checkout.billing-cvv', 'size=7&minlength=3&maxlength=4&title=' . __( 'Card\'s security code (3-4 digits on the back of the card)', 'Shopp' ) .'&placeholder=•••&autocomplete=off&return=true' );
						echo preg_replace('/name=/', 'data-stripe="cvc" name=', $cvv); ?>
					</span>
				</li>
				<li class="payment">
					<span>
						<label for="billing-cardexpires-mm"><?php _e('MM','Shopp'); ?></label>
						<?php $exp_mm = shopp( 'checkout.billing-cardexpires-mm', 'size=4&required=true&minlength=2&maxlength=2&title=' . __( 'Card\'s 2-digit expiration month', 'Shopp' ) .'&return=true' );
						echo preg_replace('/name=/', 'autocomplete="cc-exp-month" data-stripe="exp-month" name=', $exp_mm); ?>
					</span>
					<span>
						<label for="billing-cardexpires-yy"><?php _e( 'YY', 'Shopp' ); ?></label>
						<?php $exp_yy = shopp( 'checkout.billing-cardexpires-yy', 'size=4&required=true&minlength=2&maxlength=2&title=' . __( 'Card\'s 2-digit expiration year', 'Shopp' ) .'&return=true' );
						echo preg_replace('/name=/', 'autocomplete="cc-exp-year" data-stripe="exp-year" name=', $exp_yy); ?>
					</span>
					<span>
						<label for="billing-cardtype"><?php _e( 'Card Type', 'Shopp' ); ?></label>
						<?php shopp( 'checkout.billing-cardtype', 'required=true&title=' . __( 'Card Type', 'Shopp' ) ); ?>
					</span>
				</li>