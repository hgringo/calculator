import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MonnayeurHealth } from './monnayeur-health';

describe('MonnayeurHealth', () => {
  let component: MonnayeurHealth;
  let fixture: ComponentFixture<MonnayeurHealth>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonnayeurHealth]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MonnayeurHealth);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
