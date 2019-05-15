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
      'Longman Dictionary Bubble',
      'Chrome Extension',
      'For myself and other ESL students. By using pure JavaScript. English-English dictionary pop-up.',
      '/assets/projects/longman.png',
      'https://chrome.google.com/webstore/detail/longman-dictionary-bubble/cajklhanpcgcpkikgpcnogpdndpjdjjn?hl=en'),
    new Project(
      'ElementsCPR Website',
      'Corporate Website',
      'Used Kusanagi(WordPress) with Docker & Docker Compose on GCE. Applied a public theme.',
      '/assets/projects/elementscpr.png',
      'https://elementscpr.com'),
    new Project(
      'Portfolio Website',
      'Single Page Application',
      'Built by Angular7, Bulma, Ktor, MySQL. Hosted by Firebase Hosting.',
      '/assets/projects/portfolio.png',
      ''),
    new Project(
      'Sumica',
      'iOS Group Project',
      'Work in progress. Aimed for communication enhancement for room share.',
      '/assets/projects/WIP.png',
      ''),
    new Project(
      'Be A Book Lover',
      'Android Personal Project',
      'Work in progress. It records reading book and offers statistic reporting to motivate reading books more.',
      '/assets/projects/WIP.png',
      '')
  ];

  constructor() {
  }

  ngOnInit() {
  }

}
