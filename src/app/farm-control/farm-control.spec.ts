import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FarmControl } from './farm-control';

describe('FarmControl', () => {
  let component: FarmControl;
  let fixture: ComponentFixture<FarmControl>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FarmControl]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FarmControl);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
