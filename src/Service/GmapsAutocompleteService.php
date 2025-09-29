<?php

declare(strict_types=1);

namespace Daften\Bundle\AddressingBundle\Service;

use Symfony\Component\HttpFoundation\RequestStack;

/**
 * Provides the possibility to inject the GMaps API key and the toString method for an address to prepopulate an
 * autocomplete address field.
 */
class GmapsAutocompleteService
{
    public function __construct(
        private string                                    $gmapsApiKey,
        private readonly RequestStack                     $requestStack,
    )
    {
    }

    public function getGmapsApiKey(): string
    {
        return $this->gmapsApiKey;
    }

    public function setGmapsApiKey(string $gmapsApiKey): void
    {
        $this->gmapsApiKey = $gmapsApiKey;
    }

    public function getLocale(): string
    {
        return $this->requestStack->getCurrentRequest()->getLocale();
    }
}
