import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ImageGeneratorService {
  /**
   * Generate a random placeholder image URL
   * @param width Image width in pixels
   * @param height Image height in pixels
   * @param seed Optional seed for consistent image generation
   * @returns URL to a random placeholder image
   */
  generatePlaceholderImage(width: number = 800, height: number = 600, seed?: string): string {
    // If a seed is provided, use it for consistent image generation
    // Otherwise, use a random number
    const seedValue = seed || Math.floor(Math.random() * 1000);

    // Use picsum.photos for random placeholder images
    return `https://picsum.photos/seed/${seedValue}/${width}/${height}`;
  }

  /**
   * Generate a random placeholder image URL with a specific category
   * @param category Image category (e.g., 'technology', 'nature', 'people')
   * @param width Image width in pixels
   * @param height Image height in pixels
   * @returns URL to a random placeholder image in the specified category
   */
  generateCategoryPlaceholderImage(category: string, width: number = 800, height: number = 600): string {
    // Use picsum.photos for category-specific random images
    // Convert category to a seed by hashing it
    const seed = this.hashString(category);
    return `https://picsum.photos/seed/${seed}/${width}/${height}`;
  }

  /**
   * Simple string hashing function to convert a string to a numeric seed
   * @param str The string to hash
   * @returns A string hash that can be used as a seed
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    // Make sure the hash is positive and return as string
    return Math.abs(hash).toString();
  }

  /**
   * Generate a random placeholder image URL based on a blog post title
   * @param title Blog post title
   * @param width Image width in pixels
   * @param height Image height in pixels
   * @returns URL to a random placeholder image related to the blog post title
   */
  generateImageFromTitle(title: string, width: number = 800, height: number = 600): string {
    // Extract keywords from the title
    const keywords = title.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(' ')
      .filter(word => word.length > 3)
      .slice(0, 2)
      .join(',');

    // If no suitable keywords found, use a generic category
    const category = keywords || 'technology,code';

    // Use the title or keywords as a seed for consistent image generation
    const seed = this.hashString(title);

    // Use picsum.photos instead of unsplash
    return `https://picsum.photos/seed/${seed}/${width}/${height}`;
  }
}
