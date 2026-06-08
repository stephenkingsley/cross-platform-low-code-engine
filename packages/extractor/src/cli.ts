import type { ComponentManifest } from '@lce/manifest';
import { DP_BARREL, DP_DESIGN_PROJECT, NAME_ALIASES, OUT, PROJECTS } from './config';
import { extractBarrel, extractComponents, writeManifest } from './extract';

// 1) Hand-tuned targets (engine Flex/Card + curated dp-design components).
const components: ComponentManifest[] = [];
for (const project of PROJECTS) {
    try {
        components.push(...extractComponents(project));
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`✗ project (root=${project.root}) failed: ${message}`);
    }
}

// 2) Auto-discover EVERY other dp-design component from the barrel so the whole
//    library is available. Hand-tuned entries above win (skipped here by name).
const handled = new Set(components.map((c) => c.name));
handled.add('CalenderPicker'); // skip the barrel's typo-alias duplicate of CalendarPicker
try {
    components.push(
        ...extractBarrel(
            DP_DESIGN_PROJECT.root,
            DP_DESIGN_PROJECT.tsConfigFilePath,
            DP_BARREL,
            handled,
            NAME_ALIASES,
        ),
    );
} catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`✗ barrel discovery failed: ${message}`);
}

writeManifest(components, OUT);
