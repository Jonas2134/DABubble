import { TestBed } from '@angular/core/testing';

import { VisibleButtonService } from './visible-button.service';

describe('VisibleButtonService', () => {
  let service: VisibleButtonService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VisibleButtonService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
