import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  jobTitle = 'Backend Engineer';
  mottoes = [
    'Keep asking yourself why',
    'Stay constructive',
    'Represent 21st century world'
  ];

  constructor() {
  }

  ngOnInit() {
  }

}
