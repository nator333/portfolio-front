import {Component, OnInit} from '@angular/core';

@Component({
  // tslint:disable-next-line:component-selector
  selector: '[app-left-tile]',
  templateUrl: './left-tile.component.html',
  styleUrls: ['./left-tile.component.scss']
})
export class LeftTileComponent implements OnInit {
  jobTitle = 'Backend Engineer';

  constructor() { }

  ngOnInit() {
  }

}
