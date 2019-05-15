import {Component} from '@angular/core';
import {Router} from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  path: string;
  isHome: boolean;

  constructor(private location: Location, private router: Router) {
    this.router.navigate(['home']);
    this.router.events.subscribe(() => {
      if (this.location.path(true) !== '') {
        this.path = this.location.path(false).substring(1);
        this.isHome = this.path === 'home';
      }
    });
  }
}
