import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PwaInstall } from './pwa-install';

describe('PwaInstall', () => {
  let component: PwaInstall;
  let fixture: ComponentFixture<PwaInstall>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PwaInstall]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PwaInstall);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
