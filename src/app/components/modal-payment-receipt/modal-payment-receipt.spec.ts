import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalPaymentReceipt } from './modal-payment-receipt';

describe('ModalPaymentReceipt', () => {
  let component: ModalPaymentReceipt;
  let fixture: ComponentFixture<ModalPaymentReceipt>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalPaymentReceipt]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalPaymentReceipt);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
