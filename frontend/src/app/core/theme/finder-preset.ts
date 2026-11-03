import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

/**
 * PrimeNG (Aura) re-tokened for Product Finder. Three layers, as PrimeNG
 * intends: primitive (palette) → semantic (roles, light-dark()) → component.
 * Values mirror the app tokens in styles.scss so PrimeNG controls and app
 * layout share one system in both colour schemes.
 */
export const FinderPreset = definePreset(Aura, {
  primitive: {
    borderRadius: { none: '0', xs: '4px', sm: '6px', md: '10px', lg: '12px', xl: '14px' },
  },
  semantic: {
    transitionDuration: '150ms',
    primary: {
      50: '{zinc.50}',
      100: '{zinc.100}',
      200: '{zinc.200}',
      300: '{zinc.300}',
      400: '{zinc.400}',
      500: '{zinc.500}',
      600: '{zinc.600}',
      700: '{zinc.700}',
      800: '{zinc.800}',
      900: '{zinc.900}',
      950: '{zinc.950}',
      // Ink: black on light, white on dark.
      color: 'light-dark({zinc.950}, {zinc.50})',
      contrastColor: 'light-dark(#ffffff, {zinc.950})',
      hoverColor: 'light-dark({zinc.800}, {zinc.200})',
      activeColor: 'light-dark({zinc.700}, {zinc.300})',
    },
    surface: {
      0: '#ffffff',
      50: '{zinc.50}',
      100: '{zinc.100}',
      200: '{zinc.200}',
      300: '{zinc.300}',
      400: '{zinc.400}',
      500: '{zinc.500}',
      600: '{zinc.600}',
      700: '{zinc.700}',
      800: '{zinc.800}',
      900: '#111113',
      950: '#09090b',
    },
    text: {
      color: 'light-dark({zinc.950}, {zinc.50})',
      hoverColor: 'light-dark({zinc.950}, #ffffff)',
      mutedColor: 'light-dark({zinc.600}, {zinc.400})',
      hoverMutedColor: 'light-dark({zinc.800}, {zinc.200})',
    },
    highlight: {
      background: 'light-dark({indigo.50}, color-mix(in srgb, {indigo.400}, transparent 85%))',
      focusBackground: 'light-dark({indigo.100}, color-mix(in srgb, {indigo.400}, transparent 75%))',
      color: 'light-dark({indigo.700}, {indigo.200})',
      focusColor: 'light-dark({indigo.800}, {indigo.100})',
    },
    focusRing: {
      width: '2px',
      style: 'solid',
      color: 'light-dark({indigo.500}, {indigo.400})',
      offset: '2px',
      shadow: 'none',
    },
    content: {
      background: 'light-dark(#ffffff, #111113)',
      borderColor: 'light-dark({zinc.200}, #26262b)',
      hoverBackground: 'light-dark({zinc.100}, #1c1c20)',
    },
    formField: {
      paddingX: '0.75rem',
      paddingY: '0.5rem',
      background: 'light-dark(#ffffff, #111113)',
      borderColor: 'light-dark({zinc.200}, #2e2e34)',
      hoverBorderColor: 'light-dark({zinc.300}, #3a3a41)',
      focusBorderColor: 'light-dark({indigo.400}, {indigo.400})',
      placeholderColor: 'light-dark({zinc.500}, {zinc.500})',
      color: 'light-dark({zinc.950}, {zinc.50})',
      iconColor: 'light-dark({zinc.500}, {zinc.400})',
      shadow: '0 1px 2px 0 rgb(0 0 0 / 0.04)',
      focusRing: {
        width: '0',
        style: 'none',
        color: 'transparent',
        offset: '0',
        shadow: '0 0 0 4px light-dark(rgb(99 102 241 / 0.16), rgb(129 140 248 / 0.25))',
      },
    },
    list: {
      option: { borderRadius: '{border.radius.sm}' },
    },
    overlay: {
      select: {
        background: 'light-dark(#ffffff, #18181b)',
        borderColor: 'light-dark({zinc.200}, #2e2e34)',
        shadow: '0 12px 32px -8px rgb(0 0 0 / 0.18)',
      },
      popover: {
        background: 'light-dark(#ffffff, #18181b)',
        borderColor: 'light-dark({zinc.200}, #2e2e34)',
        shadow: '0 12px 32px -8px rgb(0 0 0 / 0.18)',
      },
      modal: {
        background: 'light-dark(#ffffff, #111113)',
        borderColor: 'light-dark({zinc.200}, #26262b)',
      },
    },
  },
  components: {
    button: {
      root: { paddingY: '0.5rem', paddingX: '1rem', label: { fontWeight: '500' } },
      outlined: {
        secondary: {
          color: 'light-dark({zinc.950}, {zinc.50})',
          borderColor: 'light-dark({zinc.200}, #2e2e34)',
          hoverBackground: 'light-dark({zinc.100}, #1c1c20)',
          activeBackground: 'light-dark({zinc.200}, #26262b)',
        },
      },
      text: {
        secondary: {
          color: 'light-dark({zinc.950}, {zinc.50})',
          hoverBackground: 'light-dark({zinc.100}, #1c1c20)',
          activeBackground: 'light-dark({zinc.200}, #26262b)',
        },
      },
    },
    paginator: {
      root: { padding: '0', gap: '0.25rem', background: 'transparent' },
      navButton: {
        borderRadius: '{border.radius.sm}',
        selectedBackground: 'light-dark({zinc.950}, {zinc.50})',
        selectedColor: 'light-dark(#ffffff, {zinc.950})',
      },
    },
    checkbox: {
      root: { borderRadius: '{border.radius.xs}', borderColor: 'light-dark({zinc.300}, #3a3a41)' },
    },
    drawer: {
      root: { borderColor: 'light-dark({zinc.200}, #26262b)' },
    },
    rating: {
      root: { gap: '0.375rem' },
      icon: {
        size: '1.75rem',
        color: 'light-dark({zinc.300}, {zinc.700})',
        hoverColor: 'light-dark({zinc.500}, {zinc.400})',
        activeColor: 'light-dark({zinc.950}, {zinc.50})',
      },
    },
  },
});
