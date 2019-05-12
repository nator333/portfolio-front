import {Component, Input, OnInit} from '@angular/core';

@Component({
  // tslint:disable-next-line:component-selector
  selector: '[app-right-tile]',
  templateUrl: './right-tile.component.html',
  styleUrls: ['./right-tile.component.scss']
})
export class RightTileComponent implements OnInit {
  @Input() isHome: boolean;

  constructor() {}

  ngOnInit() {}

}
