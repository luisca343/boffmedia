/**
 * `rotom_user_apps.order` IS the 0-based cell index of the SmartRotom home grid —
 * the renderer places an app with `slots[app.order]`. It is not a 1-based rank and
 * not a sort key, so a value outside `0 .. APP_GRID_SLOTS - 1` does not sort last,
 * it disappears from the dock with no error.
 *
 * Kept in step by hand with `apps/web/src/components/smartrotom/apps/AppGrid.tsx`
 * (`GRID_COLS * GRID_ROWS`), the only renderer. Deliberately not imported from
 * `@boffmedia/shared`: that package is generated from the OpenAPI models and this
 * is not a DTO.
 */
export const APP_GRID_COLS = 8;
export const APP_GRID_ROWS = 6;
export const APP_GRID_SLOTS = APP_GRID_COLS * APP_GRID_ROWS;

/** Whether `order` names a cell that actually exists on the grid. */
export const isGridSlot = (order: number): boolean =>
  Number.isInteger(order) && order >= 0 && order < APP_GRID_SLOTS;

/** The lowest cell not already taken, or `null` when the dock is full. */
export const firstFreeSlot = (taken: Set<number>): number | null => {
  for (let slot = 0; slot < APP_GRID_SLOTS; slot++) {
    if (!taken.has(slot)) return slot;
  }
  return null;
};
