import {Component, Input, OnInit} from '@angular/core';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'app-base-content',
  templateUrl: './base-content.component.html',
  styleUrls: ['./base-content.component.scss']
})
export class BaseContentComponent implements OnInit {
  @Input() isHome: boolean;

  constructor() {
  }

  ngOnInit() {
  }

}
