import { Component, effect, inject, input, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-icon',
  standalone: true,
  template: `<span [innerHTML]="svgContent()"></span>`,
  styles: `:host { display: inline-flex; line-height: 0; } span { display: contents; }`,
})
export class IconComponent {
  private static cache = new Map<string, SafeHtml>();
  private sanitizer = inject(DomSanitizer);

  name = input.required<string>();
  svgContent = signal<SafeHtml>('');

  constructor() {
    effect(() => {
      this.loadIcon(this.name());
    });
  }

  private async loadIcon(name: string): Promise<void> {
    const cached = IconComponent.cache.get(name);
    if (cached) {
      this.svgContent.set(cached);
      return;
    }
    try {
      const response = await fetch(`assets/icons/${name}.svg`);
      const svg = await response.text();
      const safe = this.sanitizer.bypassSecurityTrustHtml(svg);
      IconComponent.cache.set(name, safe);
      this.svgContent.set(safe);
    } catch {
      console.error(`Icon "${name}" could not be loaded.`);
    }
  }
}
