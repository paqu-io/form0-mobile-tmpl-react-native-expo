/**
 * form0 Mobile Configuration File
 *
 * This is the central configuration for all form0-related settings in your mobile app.
 * Settings defined here are used as defaults throughout the application.
 *
 * Note: This config format is designed to be compatible with form0-cli and mirrors
 * the web configuration (form0-test1/form0.config.js) where applicable.
 */

export default {
  /**
   * Layout Configuration
   *
   * Controls how form fields are laid out and sized.
   */
  layout: {
    /**
     * Position of field labels relative to inputs
     * @type {'side' | 'top'}
     * - 'side': Labels appear to the left of inputs (horizontal layout)
     * - 'top': Labels appear above inputs (vertical layout)
     */
    labelPosition: 'top',

    /**
     * Width percentage for labels when labelPosition is 'side'
     * @type {number}
     * Range: 0-100, recommended 20-40
     * When labels are on the side, this determines how much horizontal space
     * they occupy. The remaining space is used for the input field.
     */
    labelWidthPercent: 30,
  },

  /**
   * Theme Configuration
   *
   * Controls the visual appearance of form0 forms.
   */
  theme: {
    /**
     * Color mode for the form
     * @type {'light' | 'dark' | 'system'}
     * - 'light': Always use light theme
     * - 'dark': Always use dark theme
     * - 'system': Follow system preference
     */
    mode: 'light',

    /**
     * Custom theme overrides
     * @type {Object | null}
     * When set, these values will be merged with the base theme.
     * You can override any color, spacing, or typography value.
     *
     * Example:
     * customTheme: {
     *   color: {
     *     primary: '#10b981',
     *     buttonBg: '#10b981',
     *   },
     * },
     */
    customTheme: null,
  },

  /**
   * Interaction Behavior
   *
   * Controls how forms enter view/edit modes and respond to user actions.
   */
  interaction: {
    /**
     * Default interaction mode when loading a form.
     * @type {'edit' | 'view' | 'readonly'}
     * - 'edit': Start in Edit mode (user can immediately edit fields)
     * - 'view' | 'readonly': Start in View mode (user must tap Edit to make changes)
     */
    defaultMode: 'view',

    /**
     * Control whether primary actions (Submit) stay visible in View mode.
     * Note: On mobile, Submit button is replaced with Edit button in View mode,
     * so this setting primarily affects whether the action slot is visible.
     * @type {boolean}
     * - true: show action buttons in view mode
     * - false: hide action buttons in view mode
     */
    showPrimaryActionsInViewMode: false,
  },

  /**
   * Keyboard Configuration
   *
   * Controls keyboard behavior and scrolling adjustments.
   */
  keyboard: {
    /**
     * Extra offset (in pixels) when scrolling fields into view above the keyboard.
     * @type {number}
     * Higher values provide more padding between the field and keyboard.
     */
    scrollOffset: 48,
  },

  /**
   * Field Renderer Overrides
   *
   * Map field types to custom renderer implementations.
   * form0-react-native provides basic renderers for all field types, but you can
   * override them with custom implementations.
   *
   * Keys are field type names from form0-core (e.g., 'DateField', 'TextField').
   * Values are renderer identifiers that map to components in src/field-renderers/resolver.js
   */
  fieldRenderers: {
    // Example:
    // DateField: 'date-field-custom',
    // TextField: 'text-field-custom',
  },
};
