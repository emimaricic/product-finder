import { ActivatedRouteSnapshot, Route } from '@angular/router';
import { isSamePage, skipSamePageTransitions } from './view-transitions';

function snapshot(routeConfig: Route, params: Record<string, string> = {}): ActivatedRouteSnapshot {
  const leaf = { routeConfig, params, firstChild: null } as unknown as ActivatedRouteSnapshot;
  return { firstChild: leaf } as unknown as ActivatedRouteSnapshot;
}

describe('view transitions', () => {
  const catalogue: Route = { path: '' };
  const product: Route = { path: 'products/:sku' };

  it('treats a query-param-only change (filtering) as the same page', () => {
    expect(isSamePage(snapshot(catalogue), snapshot(catalogue))).toBe(true);
  });

  it('treats catalogue → product and product A → product B as page changes', () => {
    expect(isSamePage(snapshot(catalogue), snapshot(product, { sku: 'P-1' }))).toBe(false);
    expect(isSamePage(snapshot(product, { sku: 'P-1' }), snapshot(product, { sku: 'P-2' }))).toBe(false);
  });

  it('skips the transition when filtering, keeps it when changing pages', () => {
    const skip = jest.fn();
    const transition = { skipTransition: skip } as unknown as ViewTransition;
    skipSamePageTransitions({ transition, from: snapshot(catalogue), to: snapshot(catalogue) });
    expect(skip).toHaveBeenCalledTimes(1);
    skipSamePageTransitions({ transition, from: snapshot(catalogue), to: snapshot(product, { sku: 'P-1' }) });
    expect(skip).toHaveBeenCalledTimes(1);
  });
});
