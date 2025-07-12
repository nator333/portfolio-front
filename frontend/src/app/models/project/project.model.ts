export class Project {
  title: string;
  subtitle: string;
  description: string;
  imageSrc: string;
  url: string;

  constructor(
    title: string, subtitle: string, description: string, imageSrc: string, url: string
  ) {
    this.title = title;
    this.subtitle = subtitle;
    this.description = description;
    this.imageSrc = imageSrc;
    this.url = url;
  }

  public hasLinkUrl(): boolean {
    return this.url !== '' && this.url !== null;
  }
}
