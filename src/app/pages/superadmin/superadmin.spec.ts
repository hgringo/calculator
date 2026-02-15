import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Superadmin } from './superadmin';

describe('Superadmin', () => {
  let component: Superadmin;
  let fixture: ComponentFixture<Superadmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Superadmin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Superadmin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
