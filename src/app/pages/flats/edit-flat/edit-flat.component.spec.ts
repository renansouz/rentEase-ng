import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditFlatComponent } from './edit-flat.component';

describe('EditFlatComponent', () => {
  let component: EditFlatComponent;
  let fixture: ComponentFixture<EditFlatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditFlatComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditFlatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
