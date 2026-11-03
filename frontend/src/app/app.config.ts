import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
  withViewTransitions,
} from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import { routes } from './app.routes';
import { FinderPreset } from './core/theme/finder-preset';
import { PRIMEUI_LICENSE_KEY } from './core/theme/primeui-license';
import { apiErrorInterceptor } from './core/api/api-error.interceptor';
import { skipSamePageTransitions } from './core/view-transitions';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // withComponentInputBinding: route/query params arrive as component inputs,
    // which keeps "shareable URL = source of truth" simple for filters.
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled' }),
      // Lets the function glyph morph from result row to product header.
      withViewTransitions({
        skipInitialTransition: true,
        onViewTransitionCreated: skipSamePageTransitions,
      }),
    ),
    provideHttpClient(withFetch(), withInterceptors([apiErrorInterceptor])),
    providePrimeNG({
      license: PRIMEUI_LICENSE_KEY,
      theme: {
        preset: FinderPreset,
        // Light + dark follow the OS; semantic tokens use light-dark().
        options: { darkModeSelector: 'system', cssLayer: false },
      },
    }),
  ],
};
