export interface SelectableBundle {
  id: string;
  platform: string;
  sort_order: number | null;
  is_active: boolean;
}

export function platformBundles<T extends SelectableBundle>(bundles: T[], platform: string): T[] {
  return bundles.filter(bundle => bundle.platform === platform && bundle.is_active)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.id.localeCompare(b.id));
}

export function chooseBundle<T extends SelectableBundle>(bundles: T[], platform: string, selectedId?: string | null): T | undefined {
  const options = platformBundles(bundles, platform);
  return options.find(bundle => bundle.id === selectedId) ?? options[0];
}