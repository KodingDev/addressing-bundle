<?php

declare(strict_types=1);

namespace Daften\Bundle\AddressingBundle\Validator\Constraints;

use CommerceGuys\Addressing\AddressFormat\FieldOverrides;
use CommerceGuys\Addressing\Validator\Constraints\AddressFormatConstraint;

/**
 * @Annotation
 *
 * @codeCoverageIgnore
 */
#[\Attribute(\Attribute::TARGET_PROPERTY)]
class EmbeddedAddressFormatConstraint extends AddressFormatConstraint
{
    public function __construct(mixed $options = null, array $fieldOverrides = [])
    {
        $this->fieldOverrides = new FieldOverrides($fieldOverrides);

        parent::__construct($options);
    }

    public function getTargets(): array|string
    {
        return self::PROPERTY_CONSTRAINT;
    }
}
