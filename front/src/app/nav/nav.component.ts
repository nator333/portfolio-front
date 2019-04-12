import {Component, OnInit} from '@angular/core';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.html',
  styleUrls: ['./nav.component.scss']
})
export class NavComponent implements OnInit {
  isActive = false;
  constructor() {
  }

  ngOnInit() {
  }

  toggleIsActive() {
    this.isActive = !this.isActive;
  }

}
