/**
 * Google Maps Address Autocomplete Handler
 * Integrates Google Places API with address forms
 */
const AddressGmapsAutocomplete = {
    // Global state
    apiLoaded: false,
    loadingPromise: null,

    /**
     * Initialize Google Maps autocomplete functionality
     */
    initialize() {
        if (typeof $ === 'undefined') {
            console.error('jQuery is required for AddressGmapsAutocomplete functionality');
            return;
        }

        // Initialize country code change functionality
        const countryCodeChange = this.getCountryCodeChange();
        if (countryCodeChange && typeof countryCodeChange.initialize === 'function') {
            countryCodeChange.initialize();
        }

        $(document).ready(() => {
            this.bindAutocompleteFields();
        });
    },

    /**
     * Get CountryCodeChange module
     * @returns {Object|null} CountryCodeChange module
     */
    getCountryCodeChange() {
        // Support both CommonJS require and global window object
        if (typeof require !== 'undefined') {
            try {
                return require('./countryCodeChange');
            } catch (error) {
                console.warn('Could not require countryCodeChange module:', error.message);
            }
        }
        
        if (typeof window !== 'undefined' && window.CountryCodeChange) {
            return window.CountryCodeChange;
        }
        
        console.warn('CountryCodeChange module not found');
        return null;
    },

    /**
     * Bind autocomplete to all address input fields
     */
    bindAutocompleteFields() {
        $('.address-autocomplete-input').once('initiate-autocomplete').each((index, element) => {
            this.initializeAutoComplete($(element));
        });
    },

    /**
     * Initialize autocomplete for a single field
     * @param {jQuery} $autocompleteField - The input field
     * @param {boolean} oldAutocomplete - Whether this is reinitializing
     */
    async initializeAutoComplete($autocompleteField, oldAutocomplete = false) {
        try {
            const config = this.extractFieldConfig($autocompleteField);
            
            if (!config.isValid) {
                console.error('Invalid autocomplete field configuration:', config.errors);
                return;
            }

            // Load Google Maps API if needed
            await this.loadGoogleMapsAPI(config.apiKey, config.language);

            // Create autocomplete instance
            this.createAutocompleteInstance($autocompleteField, config, oldAutocomplete);

        } catch (error) {
            console.error('Failed to initialize autocomplete:', error);
            this.showFieldError($autocompleteField, 'Address autocomplete failed to load');
        }
    },

    /**
     * Extract configuration from field attributes
     * @param {jQuery} $field - The input field
     * @returns {Object} Configuration object
     */
    extractFieldConfig($field) {
        const apiKey = $field.attr('data-api-key');
        const language = $field.attr('data-language') || 'en';
        const allowedCountriesStr = $field.attr('data-allowed-countries') || '';
        
        const config = {
            apiKey,
            language,
            allowedCountries: allowedCountriesStr ? allowedCountriesStr.split('|').filter(Boolean) : [],
            isValid: true,
            errors: []
        };

        if (!apiKey || apiKey.trim() === '') {
            config.isValid = false;
            config.errors.push('Missing Google Maps API key');
        }

        return config;
    },

    /**
     * Load Google Maps JavaScript API
     * @param {string} apiKey - Google Maps API key
     * @param {string} language - Language code
     * @returns {Promise} Promise that resolves when API is loaded
     */
    loadGoogleMapsAPI(apiKey, language) {
        if (this.apiLoaded && typeof google !== 'undefined' && google.maps && google.maps.places) {
            return Promise.resolve();
        }

        if (this.loadingPromise) {
            return this.loadingPromise;
        }

        this.loadingPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&language=${encodeURIComponent(language)}&libraries=places&callback=__gmapsCallback`;
            script.async = true;
            script.defer = true;

            // Global callback for Google Maps API
            window.__gmapsCallback = () => {
                this.apiLoaded = true;
                delete window.__gmapsCallback;
                resolve();
            };

            script.onerror = () => {
                delete window.__gmapsCallback;
                reject(new Error('Failed to load Google Maps API'));
            };

            document.head.appendChild(script);
        });

        return this.loadingPromise;
    },

    /**
     * Create Google Maps autocomplete instance
     * @param {jQuery} $field - Input field
     * @param {Object} config - Configuration
     * @param {boolean} oldAutocomplete - Whether reinitializing
     */
    createAutocompleteInstance($field, config, oldAutocomplete) {
        const componentMapping = this.getComponentMapping();
        const fieldMapping = this.getFieldMapping();

        // Create autocomplete instance
        const autocomplete = new google.maps.places.Autocomplete($field[0], {
            types: ['geocode']
        });

        // Set country restrictions
        if (config.allowedCountries.length > 0) {
            autocomplete.setComponentRestrictions({
                'country': config.allowedCountries
            });
        }

        // Add place changed listener
        autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            this.handlePlaceChanged($field, place, componentMapping, fieldMapping);
        });

        // Trigger custom event
        $field.trigger('autoCompleteCreated', [autocomplete]);

        // Set up country code change handler
        this.setupCountryCodeChangeHandler($field, oldAutocomplete);

        // Handle existing value if reinitializing
        if (oldAutocomplete) {
            this.geocodeExistingValue($field, componentMapping, fieldMapping);
        }
    },

    /**
     * Get Google Maps component to form field mapping
     * @returns {Object} Component mapping
     */
    getComponentMapping() {
        return {
            street_number: 'short_name',
            route: 'long_name',
            neighborhood: 'short_name',
            locality: 'long_name',
            administrative_area_level_1: 'short_name',
            country: 'short_name',
            postal_code: 'short_name'
        };
    },

    /**
     * Get field selector mapping
     * @returns {Object} Field mapping
     */
    getFieldMapping() {
        return {
            street_number: '.street-number',
            route: '[id$=_addressLine1]',
            route_2: '[id$=_addressLine2]',
            sublocality_level_1: '[id$=_dependentLocality]',
            locality: '[id$=_locality]',
            administrative_area_level_1: '[id$=_administrativeArea]',
            country: '[id$=_countryCode]',
            postal_code: '[id$=_postalCode]'
        };
    },

    /**
     * Handle place selection from autocomplete
     * @param {jQuery} $field - Input field
     * @param {Object} place - Google Maps place object
     * @param {Object} componentMapping - Component mapping
     * @param {Object} fieldMapping - Field mapping
     */
    handlePlaceChanged($field, place, componentMapping, fieldMapping) {
        if (!place || !place.address_components) {
            console.warn('Invalid place data received from Google Maps');
            return;
        }

        // Ensure place has a name
        if (typeof place.name === 'undefined') {
            place.name = this.generatePlaceName(place);
        }

        const $wrapper = $field.closest('[id$=_address]');
        const $countryCodeField = $wrapper.find('[id$=_countryCode]');

        // Check if country code needs to change first
        if (this.shouldUpdateCountryCode(place, componentMapping, $countryCodeField)) {
            return; // Exit early as country change will trigger form update
        }

        // Fill in address fields
        this.fillAddressFields($wrapper, place, componentMapping, fieldMapping);
    },

    /**
     * Check if country code should be updated
     * @param {Object} place - Google Maps place object
     * @param {Object} componentMapping - Component mapping
     * @param {jQuery} $countryCodeField - Country code field
     * @returns {boolean} Whether country code was updated
     */
    shouldUpdateCountryCode(place, componentMapping, $countryCodeField) {
        for (const component of place.address_components) {
            const addressType = component.types[0];
            
            if (addressType === 'country' && componentMapping[addressType]) {
                const value = component[componentMapping[addressType]];
                const currentValue = $countryCodeField.val();
                
                if (value && value.length && currentValue !== value) {
                    $countryCodeField.val(value).trigger('change');
                    return true;
                }
            }
        }
        return false;
    },

    /**
     * Fill address fields with place data
     * @param {jQuery} $wrapper - Address wrapper element
     * @param {Object} place - Google Maps place object
     * @param {Object} componentMapping - Component mapping
     * @param {Object} fieldMapping - Field mapping
     */
    fillAddressFields($wrapper, place, componentMapping, fieldMapping) {
        for (const component of place.address_components) {
            const addressType = component.types[0];
            
            if (!componentMapping[addressType]) {
                continue;
            }

            let value = component[componentMapping[addressType]];
            
            // Special handling for route (street name)
            if (addressType === 'route') {
                value = place.name;
            }

            if (value && value.length && fieldMapping[addressType]) {
                const $targetField = $wrapper.find(fieldMapping[addressType]);
                if ($targetField.length > 0) {
                    $targetField.val(value);
                }
            }
        }
    },

    /**
     * Generate place name from components
     * @param {Object} place - Google Maps place object
     * @returns {string} Generated place name
     */
    generatePlaceName(place) {
        let street = '';
        let streetNumber = '';

        for (const component of place.address_components) {
            switch (component.types[0]) {
                case 'route':
                    street = component.long_name;
                    break;
                case 'street_number':
                    streetNumber = component.long_name;
                    break;
            }
        }

        return [street, streetNumber].filter(Boolean).join(' ');
    },

    /**
     * Setup country code change handler
     * @param {jQuery} $field - Input field
     * @param {boolean} oldAutocomplete - Whether reinitializing
     */
    setupCountryCodeChangeHandler($field, oldAutocomplete) {
        const $wrapper = $field.closest('[id$=_address]');
        const $form = $wrapper.closest('form');

        $form.on('countryCodeChanged', '.address-embeddable', (event) => {
            $(event.target).find('.address-autocomplete-input').once('initiate-autocomplete').each((index, element) => {
                this.initializeAutoComplete($(element), true);
            });
        });
    },

    /**
     * Geocode existing field value
     * @param {jQuery} $field - Input field
     * @param {Object} componentMapping - Component mapping
     * @param {Object} fieldMapping - Field mapping
     */
    geocodeExistingValue($field, componentMapping, fieldMapping) {
        const existingValue = $field.val();
        
        if (!existingValue || existingValue.trim() === '') {
            return;
        }

        const geocoder = new google.maps.Geocoder();
        
        geocoder.geocode({ address: existingValue }, (results, status) => {
            if (status === google.maps.GeocoderStatus.OK && results && results.length > 0) {
                this.handlePlaceChanged($field, results[0], componentMapping, fieldMapping);
            } else {
                console.warn('Geocoding failed for existing value:', existingValue, status);
            }
        });
    },

    /**
     * Show error message for field
     * @param {jQuery} $field - Input field
     * @param {string} message - Error message
     */
    showFieldError($field, message) {
        const $wrapper = $field.closest('[id$=_address]');
        const $existingError = $wrapper.find('.autocomplete-error');
        
        // Remove existing error
        $existingError.remove();
        
        // Add new error message
        const $errorMessage = $(`<div class="autocomplete-error alert alert-warning" role="alert">${message}</div>`);
        $wrapper.prepend($errorMessage);
        
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
    module.exports = AddressGmapsAutocomplete;
} else if (typeof window !== 'undefined') {
    window.AddressGmapsAutocomplete = AddressGmapsAutocomplete;
}
