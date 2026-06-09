import * as DP from '@dragonpass/atom-ui-mobile';
import { Card, Flex, HeroOverview, MediaCaption, MediaCarousel, Overlay, Typography, WhatsNew } from '@lce/layout';
import type { Manifest } from '@lce/manifest';
import type { ComponentRegistry } from '@lce/runtime-react';
import generated from './manifest.generated.json';

const manifest = generated as unknown as Manifest;
const dp = DP as Record<string, unknown>;

/**
 * Registry built automatically from the manifest: engine containers (Flex/Card) +
 * every dp-design component resolved by name from the package namespace. Components
 * with no matching export are simply skipped.
 */
export const registry: ComponentRegistry = { Flex, Card, Overlay, Typography, MediaCaption, MediaCarousel, HeroOverview, WhatsNew };
for (const c of manifest.components) {
    if (registry[c.name]) continue;
    const comp = dp[c.name];
    if (typeof comp === 'function' || (comp && typeof comp === 'object')) {
        registry[c.name] = comp as ComponentRegistry[string];
    }
}

/** Manifest limited to components we can actually render (have a registry entry). */
export const renderableManifest: Manifest = {
    version: manifest.version,
    components: manifest.components.filter((c) => registry[c.name]),
};
