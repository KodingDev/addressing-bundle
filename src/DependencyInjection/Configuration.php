<?php

declare(strict_types=1);

namespace Daften\Bundle\AddressingBundle\DependencyInjection;

use Symfony\Component\Config\Definition\Builder\TreeBuilder;
use Symfony\Component\Config\Definition\ConfigurationInterface;

final class Configuration implements ConfigurationInterface
{
    public function getConfigTreeBuilder(): TreeBuilder
    {
        $treeBuilder = new TreeBuilder('addressing');

        $treeBuilder->getRootNode()
            ->children()
                ->scalarNode('gmaps_api_key')
                    ->info('Google Maps API key for address autocomplete functionality')
                    ->defaultNull()
                ->end()
            ->end();

        return $treeBuilder;
    }
}
