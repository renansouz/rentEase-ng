import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewFlatComponent } from './new-flat.component';

describe('NewFlatComponent', () => {
  let component: NewFlatComponent;
  let fixture: ComponentFixture<NewFlatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewFlatComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewFlatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
