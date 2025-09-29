/**
 * Country Code Change Handler
 * Handles dynamic form updates when country code changes in address forms
 */
const CountryCodeChange = {
    /**
     * Initialize country code change handlers
     */
    initialize() {
        if (typeof $ === 'undefined') {
            console.error('jQuery is required for CountryCodeChange functionality');
            return;
        }

        $(document).ready(() => {
            this.bindCountryCodeHandlers();
        });
    },

    /**
     * Bind change handlers to all address embeddable forms
     */
    bindCountryCodeHandlers() {
        $('.address-embeddable').once('initiate-country-code-change').each((index, element) => {
            const $addressContainer = $(element);
            const addressId = $addressContainer.attr('id');
            
            if (!addressId) {
                console.warn('Address embeddable container missing ID attribute');
                return;
            }

            const $countryCodeField = $(`#${addressId}_countryCode`);
            if ($countryCodeField.length === 0) {
                console.warn(`Country code field not found for address: ${addressId}`);
                return;
            }

            $countryCodeField.on('change', (event) => {
                this.handleCountryCodeChange(event, addressId);
            });
        });
    },

    /**
     * Handle country code change event
     * @param {Event} event - The change event
     * @param {string} addressId - The address container ID
     */
    async handleCountryCodeChange(event, addressId) {
        const $countryCode = $(event.target);
        const $form = $countryCode.closest('form');
        const $address = $countryCode.closest('.address-embeddable');

        if ($form.length === 0) {
            console.error('Form not found for country code field');
            return;
        }

        try {
            // Collect form data
            const formData = this.collectAddressFormData($address);
            
            // Show loading state
            this.setLoadingState($address, true);

            // Make AJAX request
            const response = await this.submitAddressForm($form, formData);
            
            // Update the address form with new fields
            await this.updateAddressForm($address, $form, addressId, response);

        } catch (error) {
            console.error('Error handling country code change:', error);
            this.showError($address, 'Failed to update address form. Please try again.');
        } finally {
            this.setLoadingState($address, false);
        }
    },

    /**
     * Collect form data from address container
     * @param {jQuery} $address - Address container element
     * @returns {Object} Form data object
     */
    collectAddressFormData($address) {
        const data = {};
        const $addressElements = $address.find('.form-control');
        
        $addressElements.each((index, element) => {
            const $element = $(element);
            const name = $element.attr('name');
            const value = $element.val();
            
            if (name && value !== undefined) {
                data[name] = value;
            }
        });

        return data;
    },

    /**
     * Submit form data via AJAX
     * @param {jQuery} $form - Form element
     * @param {Object} data - Form data
     * @returns {Promise<string>} Response HTML
     */
    submitAddressForm($form, data) {
        const url = $form.attr('action');
        const method = $form.attr('method') || 'POST';

        if (!url) {
            throw new Error('Form action URL not found');
        }

        return new Promise((resolve, reject) => {
            $.ajax({
                url: url,
                type: method,
                data: data,
                timeout: 10000, // 10 second timeout
                success: (html) => {
                    if (!html || typeof html !== 'string') {
                        reject(new Error('Invalid response received'));
                        return;
                    }
                    resolve(html);
                },
                error: (xhr, status, error) => {
                    const message = xhr.responseJSON?.message || error || 'Unknown error occurred';
                    reject(new Error(`Request failed: ${message}`));
                }
            });
        });
    },

    /**
     * Update address form with new HTML
     * @param {jQuery} $address - Current address container
     * @param {jQuery} $form - Form element
     * @param {string} addressId - Address container ID
     * @param {string} html - Response HTML
     */
    async updateAddressForm($address, $form, addressId, html) {
        const $newAddressContent = $(html).find(`#${addressId}`);
        
        if ($newAddressContent.length === 0) {
            throw new Error(`Updated address content not found in response for ID: ${addressId}`);
        }

        // Replace the address container
        $address.replaceWith($newAddressContent);
        
        // Re-bind event handlers to the new country code field
        const $newCountryCode = $form.find(`#${addressId}_countryCode`);
        if ($newCountryCode.length > 0) {
            $newCountryCode.on('change', (event) => {
                this.handleCountryCodeChange(event, addressId);
            });
            
            // Trigger country code changed event
            $newCountryCode.closest('.address-embeddable').trigger('countryCodeChanged');
        }
    },

    /**
     * Set loading state for address container
     * @param {jQuery} $address - Address container
     * @param {boolean} loading - Whether to show loading state
     */
    setLoadingState($address, loading) {
        if (loading) {
            $address.addClass('address-loading').attr('aria-busy', 'true');
            $address.find('input, select').prop('disabled', true);
        } else {
            $address.removeClass('address-loading').removeAttr('aria-busy');
            $address.find('input, select').prop('disabled', false);
        }
    },

    /**
     * Show error message
     * @param {jQuery} $address - Address container
     * @param {string} message - Error message
     */
    showError($address, message) {
        // Remove any existing error messages
        $address.find('.address-error').remove();
        
        // Add error message
        const $errorMessage = $(`<div class="address-error alert alert-danger" role="alert">${message}</div>`);
        $address.prepend($errorMessage);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            $errorMessage.fadeOut(300, function() {
                $(this).remove();
            });
        }, 5000);
    }
};

// Support both CommonJS and global usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CountryCodeChange;
} else if (typeof window !== 'undefined') {
    window.CountryCodeChange = CountryCodeChange;
}
