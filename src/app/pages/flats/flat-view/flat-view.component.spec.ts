import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FlatViewComponent } from './flat-view.component';

describe('FlatViewComponent', () => {
  let component: FlatViewComponent;
  let fixture: ComponentFixture<FlatViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FlatViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FlatViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
