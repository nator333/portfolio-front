import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RightTileComponent } from './right-tile.component';

describe('RightTileComponent', () => {
  let component: RightTileComponent;
  let fixture: ComponentFixture<RightTileComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RightTileComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RightTileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
