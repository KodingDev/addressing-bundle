<?php

declare(strict_types=1);

namespace Daften\Bundle\AddressingBundle\Form\Type;

use Daften\Bundle\AddressingBundle\Entity\AddressEmbeddable;
use Daften\Bundle\AddressingBundle\Service\AddressOutputService;
use Daften\Bundle\AddressingBundle\Service\GmapsAutocompleteService;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\Form\FormEvent;
use Symfony\Component\Form\FormEvents;
use Symfony\Component\OptionsResolver\OptionsResolver;

/**
 * A form used to have an Embeddable Address form with autocomplete with Gmaps.
 */
class AddressEmbeddableGmapsAutocompleteType extends AddressEmbeddableType
{
    public function __construct(
        private readonly GmapsAutocompleteService $gmapsAutocompleteService,
        private readonly AddressOutputService $addressOutputService,
        EventSubscriberInterface $addressEmbeddableTypeSubscriber,
    ) {
        parent::__construct($addressEmbeddableTypeSubscriber);
    }

    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder
            ->add('addressAutocomplete', TextType::class, [
                'mapped' => false,
                'label' => 'addressAutocomplete',
                'help' => 'This field is used to search an address on Google and fill it out below. This could override other values!',
                'attr' => [
                    'class' => 'address-autocomplete-input form-control',
                    'data-addressing-autocomplete-target' => 'input',
                    'data-addressing-autocomplete-api-key-value' => $this->gmapsAutocompleteService->getGmapsApiKey(),
                    'data-addressing-autocomplete-language-value' => $this->gmapsAutocompleteService->getLocale(),
                    'data-addressing-autocomplete-allowed-countries-value' => implode('|', $options['allowed_countries']),
                ],
            ]);
        parent::buildForm($builder, $options);

        $builder->addEventListener(
            FormEvents::POST_SET_DATA,
            function (FormEvent $event): void {
                $address = $event->getData();
                $form = $event->getForm();

                if ($address) {
                    $address_default = $this->addressOutputService->getAddressInline($address);
                    $form->get('addressAutocomplete')->setData($address_default);
                }
            }
        );
    }

    public function configureOptions(OptionsResolver $resolver): void
    {
        parent::configureOptions($resolver);

        $resolver->setDefaults([
            'data_class' => AddressEmbeddable::class,
            'attr' => [
                'class' => 'address-embeddable',
                'data-controller' => 'addressing addressing-autocomplete',
                'data-addressing-address-id-value' => 'address_form',
                'data-addressing-target' => 'addressContainer',
            ],
            'allowed_countries' => [],
            'gmaps_api_key' => '',
        ]);

        $resolver->setAllowedTypes('allowed_countries', ['null', 'string[]']);
        $resolver->setAllowedTypes('gmaps_api_key', ['string']);
    }

    public function getBlockPrefix(): string
    {
        return 'daften_address_embeddable';
    }
}
