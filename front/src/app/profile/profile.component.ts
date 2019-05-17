import {Component, OnInit} from '@angular/core';
import {DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  title = 'Profile';
  fileUrl: SafeResourceUrl;

  constructor(private sanitizer: DomSanitizer) {
  }

  ngOnInit() {
    const data = 'some text';
    const blob = new Blob([data], {type: 'application/octet-stream'});

    this.fileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(window.URL.createObjectURL(blob));
  }

}
