import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-not-found-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ButtonModule],
  template: `
    <section class="not-found">
      <h1>Page not found</h1>
      <p-button label="Back to catalogue" routerLink="/" />
    </section>
  `,
  styles: `
    .not-found {
      padding: 2rem 1rem;
      text-align: center;
    }
  `,
})
export class NotFoundPage {}
