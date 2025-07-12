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
      'Tydier',
      'iOS Team Project',
      'Automatic bookmarks organizer using Natural Language Processing API. Waiting for Apple\'s approval to publish!',
      '/assets/projects/Tydier.jpg',
      ''),
    new Project(
      'Longman Bubble',
      'Chrome Extension',
      'English-English dictionary pop-up for all ESL people. Written by pure JavaScript. Being used by more than 1,000 people!!🎊㊗️🎊',
      '/assets/projects/Longman.png',
      'https://chrome.google.com/webstore/detail/longman-dictionary-bubble/cajklhanpcgcpkikgpcnogpdndpjdjjn?hl=en'),
    new Project(
      'Silver Bullet',
      'Java Group Project',
      'Original 2 Player Desktop Game made by JavaFX, JDK12. Go check & try in your PC right away!🎮👾🎮',
      '/assets/projects/SilverBullet.png',
      'https://github.com/cornerstone18aug/silver-bullet'),
    new Project(
      'ElementsCPR Website',
      'Corporate Website',
      'Used Kusanagi framework(WordPress) with Docker on GCE using a paid theme.',
      '/assets/projects/elementscpr.png',
      'https://elementscpr.com'),
    new Project(
      'Nakamata.Tech',
      'Portfolio Website',
      'Built with Angular7, Bulma, Hosted by Firebase Hosting. Also enabled email forwarding using AWS.',
      '/assets/projects/portfolio.png',
      'https://github.com/nator333/kotlin-ses-forward'),
  ];

  constructor() {
  }

  ngOnInit() {
  }

}
