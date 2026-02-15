import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalWithdrawal } from './modal-withdrawal';

describe('ModalWithdrawal', () => {
  let component: ModalWithdrawal;
  let fixture: ComponentFixture<ModalWithdrawal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalWithdrawal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalWithdrawal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
