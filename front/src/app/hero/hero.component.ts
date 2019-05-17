import { Component, OnInit } from '@angular/core';
import {Location} from '@angular/common';
import {Router} from '@angular/router';

@Component({
  // tslint:disable-next-line:component-selector
  selector: '[app-hero]',
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.scss']
})
export class HeroComponent implements OnInit {
  contentTitle: string;

  constructor(private location: Location, private router: Router) {
  }

  ngOnInit() {
    const urlAry = window.location.href.split('/');
    this.contentTitle = urlAry[urlAry.length - 1];
    this.router.events.subscribe(() => {
      if (this.location.path(true) !== '') {
        this.contentTitle = this.location.path(false).substring(1);
      }
    });
  }

}
