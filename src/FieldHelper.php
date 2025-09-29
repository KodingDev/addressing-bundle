<?php

declare(strict_types=1);

namespace Daften\Bundle\AddressingBundle;

use CommerceGuys\Addressing\AddressFormat\AddressField;

/**
 * Provides property names and helper functions for AddressEmbeddable values.
 */
readonly class FieldHelper
{
    /**
     * Gets the property name matching the given AddressField value.
     */
    public static function getPropertyName(string $field): ?string
    {
        $property_mapping = [
            AddressField::ADMINISTRATIVE_AREA => 'administrative_area',
            AddressField::LOCALITY => 'locality',
            AddressField::DEPENDENT_LOCALITY => 'dependent_locality',
            AddressField::POSTAL_CODE => 'postal_code',
            AddressField::SORTING_CODE => 'sorting_code',
            AddressField::ADDRESS_LINE1 => 'address_line1',
            AddressField::ADDRESS_LINE2 => 'address_line2',
            AddressField::ORGANIZATION => 'organization',
            AddressField::GIVEN_NAME => 'given_name',
            AddressField::ADDITIONAL_NAME => 'additional_name',
            AddressField::FAMILY_NAME => 'family_name',
        ];

        return $property_mapping[$field] ?? null;
    }

    /**
     * Replaces placeholders in the given string.
     */
    public static function replacePlaceholders(string $string, array $replacements): string
    {
        // Make sure the replacements don't have any unneeded newlines.
        $replacements = array_map('trim', $replacements);
        // Prepend each key with '%' if that wasn't the case yet.
        foreach ($replacements as $key => $value) {
            if (str_starts_with($key, '%')) {
                continue;
            }
            $replacements['%' . $key] = $value;
            unset($replacements[$key]);
        }
        $string = strtr($string, $replacements);
        // Remove noise caused by empty placeholders.
        $lines = explode("\n", $string);
        foreach ($lines as $index => $line) {
            // Remove leading punctuation, excess whitespace.
            $line = trim(preg_replace('/^[-,]+/', '', $line, 1));
            $line = preg_replace('/\s\s+/', ' ', $line);
            $lines[$index] = $line;
        }
        // Remove empty lines.
        $lines = array_filter($lines);

        return implode("\n", $lines);
    }
}
