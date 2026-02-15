import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalPaymentManagement } from './modal-payment-management';

describe('ModalPaymentManagement', () => {
  let component: ModalPaymentManagement;
  let fixture: ComponentFixture<ModalPaymentManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalPaymentManagement]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalPaymentManagement);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
