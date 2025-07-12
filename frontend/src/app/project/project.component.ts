import {Component, Input, OnInit} from '@angular/core';
import {Project} from '../models/project/project.model';

@Component({
  selector: 'app-project',
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.scss']
})
export class ProjectComponent implements OnInit {
  @Input() project: Project;
  @Input() colorIndex: number;
  colorThemes = [
    'is-primary',
    'is-info',
    'is-danger',
    'is-success',
    'is-link',
    'is-warning'
  ];

  constructor() {
  }

  ngOnInit() {
  }

  getThemeColor(): string {
    return this.colorThemes[5];
  }

}
