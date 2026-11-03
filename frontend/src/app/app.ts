import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { CatalogueContext } from './core/catalogue-context';
import { ThemeSwitch } from './shared/ui/theme-switch';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, DatePipe, ThemeSwitch],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly context = inject(CatalogueContext);
}
