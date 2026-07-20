import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { BlogEditComponent } from './blog-edit.component';
import { BlogService } from '../../services/blog.service';
import { AuthService } from '../../services/auth.service';
import { BlogData } from '../../models/blog-data';

const savedBlog: BlogData = {
  posts: [
    {
      title: 'Older Post',
      date: '2023-01-01T00:00:00.000Z',
      summary: 'The older one.',
      tags: ['Angular'],
      url: '/blog/older-post',
      content: '## Older',
    },
    {
      title: 'Newer Post',
      date: '2024-06-01T00:00:00.000Z',
      summary: 'The newer one.',
      tags: ['AWS', 'DynamoDB'],
      url: '/blog/newer-post',
      image: 'assets/blog/newer.png',
      content: '## Newer',
    },
  ],
};

describe('BlogEditComponent', () => {
  let fixture: ComponentFixture<BlogEditComponent>;
  let component: BlogEditComponent;
  let blogService: jasmine.SpyObj<BlogService>;

  beforeEach(async () => {
    blogService = jasmine.createSpyObj<BlogService>('BlogService', [
      'getBlogData',
      'updateBlog',
    ]);
    blogService.getBlogData.and.returnValue(of(savedBlog));
    blogService.updateBlog.and.callFake((data) => of(data));

    await TestBed.configureTestingModule({
      imports: [BlogEditComponent],
      providers: [
        provideRouter([]),
        { provide: BlogService, useValue: blogService },
        { provide: AuthService, useValue: { logout: () => undefined } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BlogEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should populate the form newest first with date-only values and joined tags', () => {
    const groups = component.postControls;
    expect(groups.length).toBe(2);
    expect(groups[0].value.title).toBe('Newer Post');
    expect(groups[0].value.date).toBe('2024-06-01');
    expect(groups[0].value.tags).toBe('AWS, DynamoDB');
    expect(groups[1].value.title).toBe('Older Post');
  });

  it('should block saving when the blog document cannot be loaded', () => {
    blogService.getBlogData.and.returnValue(of(null));
    const failed = TestBed.createComponent(BlogEditComponent);
    failed.detectChanges();

    const failedComponent = failed.componentInstance;
    expect(failedComponent.errorMessage).toBe('Could not load the saved blog.');
    expect(failedComponent.loadFailed).toBe(true);

    failedComponent.save();
    expect(blogService.updateBlog).not.toHaveBeenCalled();
  });

  it('should save the document with split tags and omit a blank image', () => {
    component.save();

    expect(blogService.updateBlog).toHaveBeenCalledTimes(1);
    const saved = blogService.updateBlog.calls.mostRecent().args[0];
    expect(saved.posts.length).toBe(2);
    expect(saved.posts[0].tags).toEqual(['AWS', 'DynamoDB']);
    expect(saved.posts[0].image).toBe('assets/blog/newer.png');
    expect(saved.posts[1].image).toBeUndefined();
    expect(component.successMessage).toBe('Blog saved.');
  });

  it('should not save while a required field is missing', () => {
    component.addPost();
    component.save();

    expect(blogService.updateBlog).not.toHaveBeenCalled();
    expect(component.errorMessage).toBe(
      'Fix the highlighted fields before saving.',
    );
  });

  it('should surface a save failure', () => {
    blogService.updateBlog.and.returnValue(
      throwError(() => new Error('nope')),
    );
    component.save();
    expect(component.errorMessage).toBe('Could not save the blog.');
  });

  it('should suggest a url slug from the title for new posts', () => {
    component.addPost();
    const group = component.postControls[0];
    group.get('title')?.setValue('My New Post!');
    component.suggestUrl(group);
    expect(group.get('url')?.value).toBe('/blog/my-new-post');

    // An existing url is never overwritten.
    group.get('title')?.setValue('Renamed');
    component.suggestUrl(group);
    expect(group.get('url')?.value).toBe('/blog/my-new-post');
  });

  it('should render a markdown preview when toggled open', () => {
    const group = component.postControls[0];
    expect(component.isPreviewOpen(group)).toBe(false);
    component.togglePreview(group);
    expect(component.isPreviewOpen(group)).toBe(true);
    expect(component.previewHtml(group)).toContain('Newer</h2>');
  });
});
