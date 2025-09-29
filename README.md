# The Addressing Bundle

Updated to support Symfony 7, PHP 8 and Doctrine 3.

## Requirements

* Symfony 7.0+
* PHP 8.4+
* Stimulus 3.0+ (for modern frontend integration)

## Installation

### Composer Installation

```bash
composer require daften/addressing-bundle
```

The bundle is compatible with Symfony Flex and will be automatically registered when installed. You can configure it by creating a `config/packages/addressing.yaml` file if needed.

### Doctrine Configuration

Add the mapping to your `doctrine.yaml` file:

```yaml
doctrine:
    orm:
        entity_managers:
            default:
                mappings:
                    AddressingBundle:
                        is_bundle: true
```

### Frontend Assets (Webpack Encore)

#### Modern Approach (Recommended)

Add to your `package.json`:

```json
{
  "devDependencies": {
    "@daften/addressing-bundle": "file:vendor/daften/addressing-bundle/assets"
  }
}

```

The Stimulus controllers will be automatically registered and CSS imported. No additional setup required!

#### Legacy Approach (jQuery)

If you're still using jQuery, you can use the legacy assets:

1. Run `bin/console assets:install` to copy bundle assets
2. Import the legacy JavaScript:

```javascript
// For country code changes
var countryCodeChange = require('../../public/bundles/addressing/js/countryCodeChange');
countryCodeChange.initialize();

// For Google Maps autocomplete
var addressGmapsAutocomplete = require('../../public/bundles/addressing/js/addressGmapsAutocomplete');
addressGmapsAutocomplete.initialize();
```

### Bundle Configuration

The bundle can be configured in `config/packages/addressing.yaml`:

```yaml
addressing:
    # Google Maps API key for address autocomplete functionality
    gmaps_api_key: '%env(GMAPS_API_KEY)%'
```

For Google Maps functionality, add your API key to `.env`:

```env
GMAPS_API_KEY=your_google_maps_api_key_here
```

## Usage

### Entity property

You need to add an address field as an ORM Embedded property.

```php
<?php

namespace App\Entity;

use App\Repository\InstallationAddressRepository;
use Daften\Bundle\AddressingBundle\Entity\AddressEmbeddable;
use Daften\Bundle\AddressingBundle\Validator\Constraints as AddressingBundleAssert;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: InstallationAddressRepository::class)]
class AddressExample
{

    #[ORM\Embedded(class: AddressEmbeddable::class)]
    #[AddressingBundleAssert\EmbeddedAddressFormatConstraint(fieldOverrides: [
        'addressLine1' => 'required',
        'postalCode' => 'required',
        'locality' => 'required',
        'organization' => 'required',
        'givenName' => 'required',
        'familyName' => 'required',
        'addressLine2' => 'optional',
        'additionalName' => 'hidden',
        'administrativeArea' => 'hidden',
        'dependentLocality' => 'hidden',
        'sortingCode' => 'hidden',
    ])]
    private AddressEmbeddable $address;

    /**
     * AddressExample constructor.
     */
    public function __construct()
    {
        $this->address = new AddressEmbeddable();
    }

    /**
     * @return AddressEmbeddable
     */
    public function getAddress()
    {
        return $this->address;
    }

    /**
     * @param AddressEmbeddable $address
     */
    public function setAddress($address): void
    {
        $this->address = $address;
    }
}
```

### Entity form

#### AddressEmbeddableType

There are 3 additional options that can be used for this form type:

* allowed_countries: The countries allowed in the country dropdown. An array where the keys should be the country name
  and the values should be the 2-character country code.
* preferred_countries: An array with the preferred countries, using the 2-character country codes.
* default_country: The default country to show in the country dropdown.

An example form for the AddressExample class given above using the default AddressEmbeddableType with separate fields.

```php
<?php

namespace App\Form;

use App\Entity\AddressExample;
use Daften\Bundle\AddressingBundle\Form\Type\AddressEmbeddableType;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;

/**
 * Class AddressExampleType
 */
class AddressExampleType extends AbstractType
{
    /**
     * {@inheritdoc}
     */
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $builder
            ->add('address', AddressEmbeddableType::class, [
                 'allowed_countries' => [
                     'United States' => 'US',
                     'United Kingdom' => 'UK',
                     'Belgium' => 'BE',
                 ],
                 'preferred_countries' => ['BE', 'US'],
                 'default_country' => 'US',
             ]);
    }

    /**
     * {@inheritdoc}
     */
    public function configureOptions(OptionsResolver $resolver)
    {
        $resolver->setDefaults([
            'data_class' => AddressExample::class,
        ]);
    }
}
```

#### AddressEmbeddableGmapsAutocompleteType

There is 1 additional option that can be used for this form type:

* allowed_countries: The countries allowed for autocompletion. An array where the values should be the 2-character
  country code.

An example form for the AddressExample class given above using the AddressEmbeddableGmapsAutocompleteType with one
autocomplete field.

```php
<?php

namespace App\Form;

use App\Entity\AddressExample;
use Daften\Bundle\AddressingBundle\Form\Type\AddressEmbeddableGmapsAutocompleteType;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;

/**
 * Class AddressExampleType2
 */
class AddressExampleType2 extends AbstractType
{
    /**
     * {@inheritdoc}
     */
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $builder
             ->add('address', AddressEmbeddableGmapsAutocompleteType::class, [
                'label' => 'address',
                'translation_domain' => 'address',
                'allowed_countries' => [
                    'BE',
                    'NL',
                ],
            ]);
    }

    /**
     * {@inheritdoc}
     */
    public function configureOptions(OptionsResolver $resolver)
    {
        $resolver->setDefaults([
            'data_class' => AddressExample::class,
        ]);
    }
}
```
