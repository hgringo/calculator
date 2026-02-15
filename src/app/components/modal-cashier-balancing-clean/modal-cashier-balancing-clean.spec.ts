import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalCashierBalancingClean } from './modal-cashier-balancing-clean';

describe('ModalCashierBalancingClean', () => {
  let component: ModalCashierBalancingClean;
  let fixture: ComponentFixture<ModalCashierBalancingClean>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalCashierBalancingClean]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalCashierBalancingClean);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
