import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'app-skill-bar',
  templateUrl: './skill-bar.component.html',
  styleUrls: ['./skill-bar.component.scss']
})
export class SkillBarComponent implements OnInit {
  @Input() symbol: string;
  @Input() proficiencyPercentage: number;

  constructor() { }

  ngOnInit() {
  }

}
