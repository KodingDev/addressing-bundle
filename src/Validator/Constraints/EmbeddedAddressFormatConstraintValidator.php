<?php

declare(strict_types=1);

namespace Daften\Bundle\AddressingBundle\Validator\Constraints;

use CommerceGuys\Addressing\AddressFormat\AddressFormat;
use CommerceGuys\Addressing\Validator\Constraints\AddressFormatConstraintValidator;

class EmbeddedAddressFormatConstraintValidator extends AddressFormatConstraintValidator
{
    /**
     * Adds a violation on the good path.
     */
    protected function addViolation(string $field, string $message, mixed $invalidValue, AddressFormat $addressFormat): void
    {
        $this->context->buildViolation($message)
            ->atPath($field)
            ->setInvalidValue($invalidValue)
            ->addViolation();
    }
}
