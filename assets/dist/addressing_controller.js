import { Controller } from '@hotwired/stimulus';

/**
 * Addressing Controller
 * Handles dynamic country code changes in address forms
 */
export default class extends Controller {
    static targets = ['countryCode', 'addressContainer'];
    static values = { 
        addressId: String,
        submitUrl: String 
    };

    connect() {
        this.handleCountryCodeChange = this.handleCountryCodeChange.bind(this);
        this.countryCodeTargets.forEach(target => {
            target.addEventListener('change', this.handleCountryCodeChange);
        });
    }

    disconnect() {
        this.countryCodeTargets.forEach(target => {
            target.removeEventListener('change', this.handleCountryCodeChange);
        });
    }

    async handleCountryCodeChange(event) {
        const countryCodeField = event.target;
        const addressContainer = this.addressContainerTarget;
        const form = countryCodeField.closest('form');

        if (!form) {
            console.error('Form not found for country code field');
            return;
        }

        try {
            // Collect form data
            const formData = this.collectFormData(addressContainer);
            
            // Show loading state
            this.setLoadingState(true);

            // Make AJAX request
            const response = await this.submitForm(form, formData);
            
            // Update the address form with new fields
            await this.updateAddressForm(addressContainer, response);

            // Dispatch custom event
            this.dispatch('countryChanged', { 
                detail: { 
                    countryCode: countryCodeField.value,
                    addressId: this.addressIdValue 
                } 
            });

        } catch (error) {
            console.error('Error handling country code change:', error);
            this.showError('Failed to update address form. Please try again.');
        } finally {
            this.setLoadingState(false);
        }
    }

    collectFormData(container) {
        const data = {};
        const elements = container.querySelectorAll('.form-control');
        
        elements.forEach(element => {
            const name = element.getAttribute('name');
            const value = element.value;
            
            if (name && value !== undefined) {
                data[name] = value;
            }
        });

        return data;
    }

    async submitForm(form, data) {
        const url = this.submitUrlValue || form.getAttribute('action');
        const method = form.getAttribute('method') || 'POST';

        if (!url) {
            throw new Error('Form action URL not found');
        }

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: new URLSearchParams(data)
        });

        if (!response.ok) {
            throw new Error(`Request failed: ${response.statusText}`);
        }

        return await response.text();
    }

    updateAddressForm(currentContainer, html) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        const newContainer = tempDiv.querySelector(`#${this.addressIdValue}`);
        
        if (!newContainer) {
            throw new Error(`Updated address content not found in response for ID: ${this.addressIdValue}`);
        }

        // Replace the container
        currentContainer.replaceWith(newContainer);
        
        // Re-connect the new controller
        const newCountryField = newContainer.querySelector('[data-addressing-target="countryCode"]');
        if (newCountryField) {
            newCountryField.addEventListener('change', this.handleCountryCodeChange);
        }
    }

    setLoadingState(loading) {
        const container = this.addressContainerTarget;
        
        if (loading) {
            container.classList.add('address-loading');
            container.setAttribute('aria-busy', 'true');
            container.querySelectorAll('input, select').forEach(el => el.disabled = true);
        } else {
            container.classList.remove('address-loading');
            container.removeAttribute('aria-busy');
            container.querySelectorAll('input, select').forEach(el => el.disabled = false);
        }
    }

    showError(message) {
        const container = this.addressContainerTarget;
        
        // Remove any existing error messages
        container.querySelectorAll('.address-error').forEach(el => el.remove());
        
        // Add error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'address-error alert alert-danger';
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