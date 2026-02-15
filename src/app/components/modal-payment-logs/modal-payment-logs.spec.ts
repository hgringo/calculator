import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalPaymentLogs } from './modal-payment-logs';

describe('ModalPaymentLogs', () => {
  let component: ModalPaymentLogs;
  let fixture: ComponentFixture<ModalPaymentLogs>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalPaymentLogs]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalPaymentLogs);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
