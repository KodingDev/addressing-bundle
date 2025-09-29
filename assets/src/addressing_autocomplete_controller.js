import { Controller } from '@hotwired/stimulus';

/**
 * Addressing Autocomplete Controller
 * Handles Google Maps Places API integration for address autocomplete
 */
export default class extends Controller {
    static targets = ['input'];
    static values = { 
        apiKey: String,
        language: String,
        allowedCountries: String
    };

    static apiLoaded = false;
    static loadingPromise = null;

    connect() {
        this.initializeAutocomplete();
    }

    disconnect() {
        if (this.autocomplete) {
            google.maps.event.clearInstanceListeners(this.autocomplete);
        }
    }

    async initializeAutocomplete() {
        try {
            const config = this.getConfig();
            
            if (!config.isValid) {
                console.error('Invalid autocomplete configuration:', config.errors);
                return;
            }

            // Load Google Maps API if needed
            await this.loadGoogleMapsAPI();

            // Create autocomplete instance
            this.createAutocompleteInstance(config);

        } catch (error) {
            console.error('Failed to initialize autocomplete:', error);
            this.showError('Address autocomplete failed to load');
        }
    }

    getConfig() {
        const config = {
            apiKey: this.apiKeyValue,
            language: this.languageValue || 'en',
            allowedCountries: this.allowedCountriesValue ? this.allowedCountriesValue.split('|').filter(Boolean) : [],
            isValid: true,
            errors: []
        };

        if (!config.apiKey || config.apiKey.trim() === '') {
            config.isValid = false;
            config.errors.push('Missing Google Maps API key');
        }

        return config;
    }

    loadGoogleMapsAPI() {
        if (this.constructor.apiLoaded && typeof google !== 'undefined' && google.maps && google.maps.places) {
            return Promise.resolve();
        }

        if (this.constructor.loadingPromise) {
            return this.constructor.loadingPromise;
        }

        this.constructor.loadingPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            const config = this.getConfig();
            script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(config.apiKey)}&language=${encodeURIComponent(config.language)}&libraries=places&callback=__gmapsCallback`;
            script.async = true;
            script.defer = true;

            // Global callback for Google Maps API
            window.__gmapsCallback = () => {
                this.constructor.apiLoaded = true;
                delete window.__gmapsCallback;
                resolve();
            };

            script.onerror = () => {
                delete window.__gmapsCallback;
                reject(new Error('Failed to load Google Maps API'));
            };

            document.head.appendChild(script);
        });

        return this.constructor.loadingPromise;
    }

    createAutocompleteInstance(config) {
        // Create autocomplete instance
        this.autocomplete = new google.maps.places.Autocomplete(this.inputTarget, {
            types: ['geocode']
        });

        // Set country restrictions
        if (config.allowedCountries.length > 0) {
            this.autocomplete.setComponentRestrictions({
                'country': config.allowedCountries
            });
        }

        // Add place changed listener
        this.autocomplete.addListener('place_changed', () => {
            const place = this.autocomplete.getPlace();
            this.handlePlaceChanged(place);
        });

        // Dispatch custom event
        this.dispatch('autocompleteCreated', { 
            detail: { autocomplete: this.autocomplete } 
        });
    }

    handlePlaceChanged(place) {
        if (!place || !place.address_components) {
            console.warn('Invalid place data received from Google Maps');
            return;
        }

        // Ensure place has a name
        if (typeof place.name === 'undefined') {
            place.name = this.generatePlaceName(place);
        }

        const addressContainer = this.element.closest('[data-controller*="addressing"]');
        const countryCodeField = addressContainer?.querySelector('[id$="_countryCode"]');

        // Check if country code needs to change first
        if (this.shouldUpdateCountryCode(place, countryCodeField)) {
            return; // Exit early as country change will trigger form update
        }

        // Fill in address fields
        this.fillAddressFields(addressContainer, place);

        // Dispatch custom event
        this.dispatch('placeChanged', { 
            detail: { place, addressContainer } 
        });
    }

    shouldUpdateCountryCode(place, countryCodeField) {
        if (!countryCodeField) return false;

        for (const component of place.address_components) {
            const addressType = component.types[0];
            
            if (addressType === 'country') {
                const value = component.short_name;
                const currentValue = countryCodeField.value;
                
                if (value && value.length && currentValue !== value) {
                    countryCodeField.value = value;
                    countryCodeField.dispatchEvent(new Event('change', { bubbles: true }));
                    return true;
                }
            }
        }
        return false;
    }

    fillAddressFields(container, place) {
        if (!container) return;

        const componentMapping = {
            street_number: 'short_name',
            route: 'long_name',
            neighborhood: 'short_name',
            locality: 'long_name',
            administrative_area_level_1: 'short_name',
            country: 'short_name',
            postal_code: 'short_name'
        };

        const fieldMapping = {
            street_number: '[id$="_addressLine1"]',
            route: '[id$="_addressLine1"]',
            sublocality_level_1: '[id$="_dependentLocality"]',
            locality: '[id$="_locality"]',
            administrative_area_level_1: '[id$="_administrativeArea"]',
            country: '[id$="_countryCode"]',
            postal_code: '[id$="_postalCode"]'
        };

        for (const component of place.address_components) {
            const addressType = component.types[0];
            
            if (!componentMapping[addressType] || !fieldMapping[addressType]) {
                continue;
            }

            let value = component[componentMapping[addressType]];
            
            // Special handling for route (street name)
            if (addressType === 'route') {
                value = place.name;
            }

            if (value && value.length) {
                const targetField = container.querySelector(fieldMapping[addressType]);
                if (targetField) {
                    targetField.value = value;
                }
            }
        }
    }

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
    }

    showError(message) {
        const container = this.element.closest('[data-controller*="addressing"]');
        if (!container) return;
        
        // Remove any existing error messages
        container.querySelectorAll('.autocomplete-error').forEach(el => el.remove());
        
        // Add error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'autocomplete-error alert alert-warning';
        errorDiv.setAttribute('role', 'alert');
        errorDiv.textContent = message;
        
        container.prepend(errorDiv);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            errorDiv.style.transition = 'opacity 0.3s';
            errorDiv.style.opacity = '0';
            setTimeout(() => errorDiv.remove(), 300);
        }, 5000);
    }
}