---
title: Getting Started with Angular
date: 2023-10-15
summary: A beginner's guide to setting up and building your first Angular application.
tags: Angular, Web Development, TypeScript
url: /blog/getting-started-with-angular
---

## Introduction

Angular is a powerful platform for building web applications. This guide will help you get started with Angular development, from installation to creating your first component.

## Prerequisites

Before you begin, make sure you have:

- Node.js (version 16.x or higher)
- npm (usually comes with Node.js)
- A code editor (VS Code recommended)

## Installation

First, install the Angular CLI globally:

```bash data-user="user" data-host="localhost" class="command-line"
npm install -g @angular/cli
```

Verify the installation:

```bash data-user="user" data-host="localhost" class="command-line"
ng version
```

## Creating Your First Project

Create a new Angular project:

```bash data-line="2"
ng new my-first-app
# This will create a new Angular project
```

During setup, you'll be asked about:
- Whether to include Angular routing (recommended: Yes)
- Which CSS preprocessor to use (options: CSS, SCSS, SASS, LESS)

Navigate to your project directory:

```bash
cd my-first-app
```

Start the development server:

```bash data-user="user" data-host="localhost" class="command-line"
ng serve --open
```

The `--open` flag automatically opens your browser to `http://localhost:4200/`.

## Understanding the Project Structure

Key files and directories:

- **src/app**: Contains your application code
- **src/assets**: For static files like images
- **src/environments**: Configuration for different environments
- **angular.json**: Angular workspace configuration
- **package.json**: Dependencies and scripts

## Creating Components

Generate a new component:

```bash class="line-numbers" data-line="1,3-5"
ng generate component hello-world
# This command will:
# 1. Create a new component directory
# 2. Generate all necessary component files
# 3. Update the module to include the component
```

This creates:
- A component class (hello-world.component.ts)
- An HTML template (hello-world.component.html)
- A CSS file (hello-world.component.css)
- A test file (hello-world.component.spec.ts)

## Next Steps

After mastering the basics, explore:

- Services and dependency injection
- Routing and navigation
- Forms (template-driven and reactive)
- HTTP client for API communication
- State management

## Conclusion

Angular provides a comprehensive framework for building scalable web applications. With its component-based architecture and powerful features, you can create robust, maintainable applications.

## Tags

Angular, Web Development, TypeScript
