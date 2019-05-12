import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LeftTileComponent } from './left-tile.component';

describe('LeftTileComponent', () => {
  let component: LeftTileComponent;
  let fixture: ComponentFixture<LeftTileComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LeftTileComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LeftTileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
