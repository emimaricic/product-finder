import { ActivatedRouteSnapshot, ViewTransitionInfo } from '@angular/router';

/** Deepest active route: the page actually being shown. */
function leaf(snapshot: ActivatedRouteSnapshot): ActivatedRouteSnapshot {
  let s = snapshot;
  while (s.firstChild) s = s.firstChild;
  return s;
}

/** Same page = same route config and same path params (query params ignored). */
export function isSamePage(from: ActivatedRouteSnapshot, to: ActivatedRouteSnapshot): boolean {
  const a = leaf(from);
  const b = leaf(to);
  return (
    a.routeConfig === b.routeConfig &&
    JSON.stringify(a.params) === JSON.stringify(b.params)
  );
}

/**
 * View transitions are for moving between pages (row glyph → product header).
 * Filter/sort/page changes only update query params; animating those would
 * paint the named glyph snapshots above everything — including the open
 * filter bottom sheet on phones — so they are skipped.
 */
export function skipSamePageTransitions({ transition, from, to }: ViewTransitionInfo): void {
  if (isSamePage(from, to)) transition.skipTransition();
}
