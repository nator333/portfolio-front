import {Component, OnInit} from '@angular/core';
import {Project} from '../models/project/project.model';

@Component({
  selector: 'app-works',
  templateUrl: './works.component.html',
  styleUrls: ['./works.component.scss']
})
export class WorksComponent implements OnInit {
  title = 'Projects';
  customOptions: any = {
    loop: false,
    mouseDrag: true,
    touchDrag: true,
    pullDrag: false,
    dots: false,
    navSpeed: 700,
    nav: true,
    navText: [ '<i class="fa fa-chevron-left"></i>', '<i class="fa fa-chevron-right"></i>' ],
    responsive: {
      0: {
        items: 1
      },
      740: {
        items: 2
      },
      940: {
        items: 3
      }
    },
    animateOut: true,
    animateIn: true
  };

  projects = [
    new Project(
      'Silver Bullet',
      'Java Group Project',
      'Original 2 Player Desktop Game made by JavaFX, JDK12. Go check & please try in your PC!',
      '/assets/projects/SilverBullet.png',
      'https://github.com/cornerstone18aug/silver-bullet'),
    new Project(
      'Longman Bubble',
      'Chrome Extension',
      'English-English dictionary pop-up for all ESL people, using pure JavaScript.',
      '/assets/projects/longman.png',
      'https://chrome.google.com/webstore/detail/longman-dictionary-bubble/cajklhanpcgcpkikgpcnogpdndpjdjjn?hl=en'),
    new Project(
      'ElementsCPR Website',
      'Corporate Website',
      'Used Kusanagi framework(WordPress) with Docker on GCE using a public theme.',
      '/assets/projects/elementscpr.png',
      'https://elementscpr.com'),
    new Project(
      'Nakamata.Tech',
      'Portfolio Website',
      'Built by Angular7, Bulma, Hosted by Firebase Hosting.',
      '/assets/projects/portfolio.png',
      ''),
    new Project(
      'Bookmanager',
      'iOS Group Project',
      'Organizing Bookmarks using AI (Natural Language Processing API). Releasing on AppStore by August',
      '/assets/projects/WIP.png',
      ''),
  ];

  constructor() {
  }

  ngOnInit() {
  }

}
