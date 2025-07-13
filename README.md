# Hiro's Portfolio

A personal portfolio website built with Angular 20.1.0.

Visit the site: [GitHub Pages](https://nator333.github.io/portfolio-front) | [Firebase-Hosted Domain](https://nakamata.tech)

## Technologies Used

- **Framework**: Angular 20.1.0
- **CSS Framework**: Bulma 1.0.4
- **Icons**: Font Awesome
- **Animations**: animate.css
- **Hosting**: Firebase and GitHub Pages

## Prerequisites

- Node.js >= 20.19.0
- npm >= 10.0.0

## Development

### Setup

```bash
# Install dependencies
npm ci
```

### Development Server

```bash
# Start the development server
npm start
```

This will start a development server at `http://localhost:3000`. The application will automatically reload when you make changes to the source files.

### Building

```bash
# Build for production
npm run build
```

The build artifacts will be stored in the `dist/portfolio-front/browser/` directory.

### Code Formatting

```bash
# Format README.md file
npm run prettify-readme

# Format all TypeScript files
npm run prettify-ts
```

These scripts use Prettier to format files according to consistent styling rules:
- `prettify-readme`: Formats the README.md file
- `prettify-ts`: Formats all TypeScript files in the src directory

## Deployment

The project is automatically deployed to both Firebase Hosting and GitHub Pages when changes are pushed to the master branch.

### Firebase Hosting

Deployment to Firebase is handled by a GitHub Action defined in `.github/workflows/firebase-hosting-merge.yml`.

### GitHub Pages

Deployment to GitHub Pages is handled by a GitHub Action defined in `.github/workflows/static.yml`.

## Additional Resources

For more information on Angular development, visit the [Angular documentation](https://angular.dev/).
