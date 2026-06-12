/**
 * Single source of truth: this package now re-exports the published `pandora-box-layout`, so the
 * builder renders with the EXACT component code the runtime ships — the two can no longer drift.
 * Edit components in the pandora-box-layout repo, publish, then bump the version here.
 */
export * from 'pandora-box-layout';
