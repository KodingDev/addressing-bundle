<?php

declare(strict_types=1);

$finder = PhpCsFixer\Finder::create()
    ->in(__DIR__)
    ->exclude([
        'vendor',
        'Resources',
        'templates',
    ])
    ->name('*.php')
    ->notName('*.tpl.php');

return new PhpCsFixer\Config()
    ->setRules([
        '@Symfony' => true,
        '@Symfony:risky' => true,
        '@PHP84Migration' => true,
        'array_syntax' => ['syntax' => 'short'],
        'protected_to_private' => false,
        'semicolon_after_instruction' => false,
        'declare_strict_types' => true,
        'nullable_type_declaration_for_default_null_value' => true,
        'single_line_empty_body' => false,
    ])
    ->setRiskyAllowed(true)
    ->setFinder($finder);
