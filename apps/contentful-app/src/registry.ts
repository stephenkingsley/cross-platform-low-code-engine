import { Card, Flex, HeroOverview, MediaCaption, MediaCarousel, Overlay, Positioned, ServiceList, Swiper, Typography, UpcomingList, WhatsNew } from 'pandora-box-layout';
import { dpRegistry } from 'pandora-box-dp';
import { manifest as published } from 'pandora-box-manifest';
import type { Manifest } from '@lce/manifest';
import type { ComponentRegistry } from '@lce/runtime-react';

const manifest = published as unknown as Manifest;

/**
 * Single source of truth: dp components (pandora-box-dp) + engine templates (pandora-box-layout),
 * keyed by manifest type id — the SAME registry the runtime renders. Manifest data comes from the
 * published pandora-box-manifest, so the builder offers exactly what the runtime ships.
 */
export const registry: ComponentRegistry = {
    ...(dpRegistry as unknown as ComponentRegistry),
    Flex,
    Card,
    Overlay,
    Positioned,
    Typography,
    MediaCaption,
    MediaCarousel,
    Swiper,
    HeroOverview,
    WhatsNew,
    UpcomingList,
    ServiceList,
} as ComponentRegistry;

/** Manifest limited to components we can actually render (have a registry entry). */
export const renderableManifest: Manifest = {
    version: manifest.version,
    components: manifest.components.filter((c) => registry[c.name]),
};
