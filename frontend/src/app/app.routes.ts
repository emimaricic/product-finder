import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/catalogue/catalogue-page').then((m) => m.CataloguePage),
    title: 'Product Finder',
  },
  {
    // SKU-based, stable links that can be shared and survive re-imports.
    path: 'products/:sku',
    loadComponent: () => import('./features/product/product-page').then((m) => m.ProductPage),
    title: 'Product · Product Finder',
  },
  {
    path: '**',
    loadComponent: () => import('./shared/not-found-page').then((m) => m.NotFoundPage),
    title: 'Not found · Product Finder',
  },
];
