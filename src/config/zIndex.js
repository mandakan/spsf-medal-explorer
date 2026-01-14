/**
 * Shared z-index constants for consistent layering across the app.
 * Higher numbers appear above lower numbers.
 */
export const Z_INDEX = {
  // Base dialogs and modals
  DIALOG_BACKDROP: 3000,
  DIALOG_CONTENT: 3001,

  // Onboarding tour overlay (must be above dialogs)
  TOUR_SPOTLIGHT: 4000,
  TOUR_CONTAINER: 4000,
  TOUR_DIALOG: 4001,
}
