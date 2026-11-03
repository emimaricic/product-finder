import { PRIMEUI_LICENSE_KEY_FROM_ENV } from './primeui-license.generated';

/**
 * PrimeNG 22+ needs a PrimeUI license key (verified offline, no network
 * calls; without one PrimeNG shows an "Invalid PrimeUI License" banner).
 *
 * The key is NOT a secret — it ships in the browser bundle either way — but
 * it is per developer/organisation, so it is injected at build time from
 * PRIMEUI_LICENSE_KEY (frontend/.env locally, a CI secret, a Docker build
 * arg). The committed fallback is the author's free Community key, so a
 * fresh clone of this take-home runs without the banner. A company deploying
 * this sets its own Commercial key; see DECISIONS.md.
 */
const COMMUNITY_FALLBACK =
  'eyJpZCI6IjFmOWMwYmM1LTc2ZWMtNDMwNC04NGRhLWIzZDkyYjhkNjUzYiIsInByb2R1Y3QiOiJwcmltZXVpIiwidGllciI6ImNvbW11bml0eSIsInR5cGUiOiJkZXYiLCJpYXQiOjE3OTM3MDUwNzIsImV4cCI6MTgyNTI0MTA3Mn0.KZD8EuBKH_dzx1-qmrrqFhjWiKENrtxXedaiMFSPkzBeqYOVNp6OuTKZ4-XrVJup_e1whBRZx61t1-281POXDQ';

export const PRIMEUI_LICENSE_KEY = PRIMEUI_LICENSE_KEY_FROM_ENV || COMMUNITY_FALLBACK;
