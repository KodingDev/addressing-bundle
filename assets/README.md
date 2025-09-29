# Daften Addressing Bundle Assets

Frontend assets for the Daften Addressing Bundle, providing Stimulus controllers and CSS for address forms with Google Maps autocomplete.

## Installation

Add to your `package.json`:

```json
{
  "dependencies": {
    "@daften/addressing-bundle": "file:vendor/daften/addressing-bundle/assets"
  }
}
```

## Usage

### Basic Setup

The bundle provides two Stimulus controllers:

1. **`addressing`** - Handles dynamic country code changes
2. **`addressing-autocomplete`** - Handles Google Maps Places API integration (optional)

### Automatic Import (Recommended)

The addressing controller and CSS are automatically imported when you install the bundle. The CSS will be automatically included.

### Manual Usage

If you need manual control:

```javascript
import { Application } from '@hotwired/stimulus';
import AddressingController from '@daften/addressing-bundle/src/addressing_controller';
import AddressingAutocompleteController from '@daften/addressing-bundle/src/addressing_autocomplete_controller';

const application = Application.start();
application.register('addressing', AddressingController);
application.register('addressing-autocomplete', AddressingAutocompleteController);
```

### Twig Templates

Use the controllers in your Twig templates:

```twig
{# Basic addressing form with country change handling #}
<div data-controller="addressing" 
     data-addressing-address-id-value="{{ form.vars.id }}"
     data-addressing-target="addressContainer">
    
    {{ form_row(form.countryCode, {
        attr: { 'data-addressing-target': 'countryCode' }
    }) }}
    
    {# Other address fields #}
    {{ form_row(form.addressLine1) }}
    {{ form_row(form.locality) }}
    {# ... #}
</div>
```

```twig
{# Address form with Google Maps autocomplete #}
<div data-controller="addressing addressing-autocomplete" 
     data-addressing-address-id-value="{{ form.vars.id }}"
     data-addressing-autocomplete-api-key-value="{{ gmaps_api_key }}"
     data-addressing-autocomplete-language-value="{{ app.request.locale }}"
     data-addressing-target="addressContainer">
    
    {# Autocomplete input field #}
    {{ form_row(form.addressLine1, {
        attr: { 
            'data-addressing-autocomplete-target': 'input',
            'class': 'address-autocomplete-input'
        }
    }) }}
    
    {{ form_row(form.countryCode, {
        attr: { 'data-addressing-target': 'countryCode' }
    }) }}
    
    {# Other fields #}
</div>
```

## Configuration

### Controller Values

#### `addressing` controller:
- `addressId` (String) - The ID of the address form
- `submitUrl` (String, optional) - Custom URL for form submission

#### `addressing-autocomplete` controller:
- `apiKey` (String) - Google Maps API key
- `language` (String, optional) - Language code (default: 'en')
- `allowedCountries` (String, optional) - Pipe-separated country codes

### Events

The controllers dispatch custom events:

```javascript
// Listen for country changes
document.addEventListener('addressing:countryChanged', (event) => {
    console.log('Country changed to:', event.detail.countryCode);
});

// Listen for autocomplete place selection
document.addEventListener('addressing-autocomplete:placeChanged', (event) => {
    console.log('Place selected:', event.detail.place);
});
```

## CSS Customization

The bundle includes modern CSS with support for:
- Bootstrap 5 CSS variables
- Dark mode (`prefers-color-scheme: dark`)
- High contrast mode (`prefers-contrast: high`)
- Reduced motion (`prefers-reduced-motion: reduce`)
- Mobile responsive design

Override styles as needed:

```css
.address-embeddable {
    /* Your custom styles */
}
```

## Browser Support

- Modern browsers with ES6+ support
- Stimulus 3.0+
- Optional: Google Maps JavaScript API