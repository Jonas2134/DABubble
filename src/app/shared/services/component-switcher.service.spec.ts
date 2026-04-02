import { TestBed } from '@angular/core/testing';

import { ComponentSwitcherService } from './component-switcher.service';

describe('ComponentSwitcherService', () => {
  let service: ComponentSwitcherService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ComponentSwitcherService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
