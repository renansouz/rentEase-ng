import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyFlatsComponent } from './my-flats.component';

describe('MyFlatsComponent', () => {
  let component: MyFlatsComponent;
  let fixture: ComponentFixture<MyFlatsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyFlatsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyFlatsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
