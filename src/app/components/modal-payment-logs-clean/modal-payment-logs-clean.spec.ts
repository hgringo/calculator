import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalPaymentLogsClean } from './modal-payment-logs-clean';

describe('ModalPaymentLogsClean', () => {
  let component: ModalPaymentLogsClean;
  let fixture: ComponentFixture<ModalPaymentLogsClean>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalPaymentLogsClean]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalPaymentLogsClean);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
