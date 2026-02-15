import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalIp } from './modal-ip';

describe('ModalIp', () => {
  let component: ModalIp;
  let fixture: ComponentFixture<ModalIp>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalIp]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalIp);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
