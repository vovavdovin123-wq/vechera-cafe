import type { CartItem, MenuItem, MenuVolumeOption } from "./types";

export function cartLineKey(menuItemId: string, volumeId?: string): string {
  return volumeId ? `${menuItemId}:${volumeId}` : menuItemId;
}

export function findVolume(
  item: MenuItem,
  volumeId?: string,
): MenuVolumeOption | undefined {
  if (!volumeId || !item.volumes?.length) return undefined;
  return item.volumes.find((v) => v.id === volumeId);
}

export function itemHasVolumes(item: MenuItem): boolean {
  return Boolean(item.volumes?.length);
}

export function getCartItemPrice(item: MenuItem, volumeId?: string): number {
  const volume = findVolume(item, volumeId);
  if (volume) return volume.price;
  return item.price;
}

export function getCartItemFrontpadArticle(
  item: MenuItem,
  volumeId?: string,
): string | undefined {
  const volume = findVolume(item, volumeId);
  if (volume?.frontpadArticle?.trim()) return volume.frontpadArticle.trim();
  return item.frontpadArticle?.trim() || undefined;
}

export function getCartItemDisplayName(
  item: MenuItem,
  volumeId?: string,
): string {
  const volume = findVolume(item, volumeId);
  if (!volume) return item.name;
  return `${item.name} (${volume.label})`;
}

export function formatMenuPrice(item: MenuItem): string {
  if (item.volumes?.length) {
    const prices = item.volumes.map((v) => v.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    if (min === max) return `${min} ₽`;
    return `от ${min} ₽`;
  }
  return `${item.price} ₽`;
}

export function quantityOfMenuItem(items: CartItem[], menuItemId: string): number {
  return items
    .filter((i) => i.menuItem.id === menuItemId)
    .reduce((sum, i) => sum + i.quantity, 0);
}

export function quantityOfVolume(
  items: CartItem[],
  menuItemId: string,
  volumeId: string,
): number {
  return items
    .filter((i) => i.menuItem.id === menuItemId && i.volumeId === volumeId)
    .reduce((sum, i) => sum + i.quantity, 0);
}

export function newVolumeId(): string {
  return `vol-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function normalizeVolumes(
  volumes: MenuVolumeOption[] | undefined,
): MenuVolumeOption[] | undefined {
  if (!volumes?.length) return undefined;
  const cleaned = volumes
    .map((v) => ({
      id: v.id?.trim() || newVolumeId(),
      label: v.label?.trim() || "",
      price: Math.round(Number(v.price) || 0),
      frontpadArticle: v.frontpadArticle?.trim() || undefined,
    }))
    .filter((v) => v.label && v.price > 0);
  return cleaned.length ? cleaned : undefined;
}
