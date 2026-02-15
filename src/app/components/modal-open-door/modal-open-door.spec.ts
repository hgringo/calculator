import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalOpenDoor } from './modal-open-door';

describe('ModalOpenDoor', () => {
  let component: ModalOpenDoor;
  let fixture: ComponentFixture<ModalOpenDoor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalOpenDoor]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalOpenDoor);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
