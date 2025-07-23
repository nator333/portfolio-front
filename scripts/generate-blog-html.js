const fs = require('fs');
const path = require('path');
const marked = require('marked');
const matter = require('gray-matter');

// Configure paths
const BLOG_DIR = path.join(__dirname, '../src/assets/blog');
const OUTPUT_DIR = path.join(__dirname, '../src/assets/blog-html');
const MANIFEST_PATH = path.join(OUTPUT_DIR, 'manifest.json');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Configure marked options to match the current configuration
const renderer = new marked.Renderer();

// Override the code renderer to add plugin classes
renderer.code = function(code, language, isEscaped) {
  // Extract the actual code content
  let codeContent;
  let rawLanguage = language; // Store the original language string with attributes

  if (typeof code === 'object') {
    // If code is an object, try to extract the text property
    if (code.text) {
      codeContent = code.text;

      // If the object has a lang property, use it (it might contain attributes)
      if (code.lang) {
        rawLanguage = code.lang;
      }
    } else {
      // Fallback to stringifying the object
      codeContent = JSON.stringify(code);
    }
  } else {
    // If code is already a string, use it directly
    codeContent = code;
  }

  // Extract the base language and attributes
  let baseLanguage = rawLanguage;
  let attributes = '';

  if (rawLanguage && rawLanguage.includes(' ')) {
    const parts = rawLanguage.split(' ');
    baseLanguage = parts[0];

    // Process attributes
    for (let i = 1; i < parts.length; i++) {
      const attr = parts[i];
      if (attr.startsWith('data-') || attr.startsWith('class=')) {
        // For class attributes, extract the value and add it to the pre element's class
        if (attr.startsWith('class=')) {
          const classValue = attr.substring(6).replace(/['"]/g, '');
          attributes += ` class="${classValue}"`;
        } else {
          attributes += ` ${attr}`;
        }
      }
    }
  }

  const langClass = baseLanguage ? `language-${baseLanguage}` : '';

  // Create the HTML with proper attributes
  return `<pre class="line-numbers"${attributes}><code class="${langClass}">${codeContent}</code></pre>`;
};

marked.setOptions({
  renderer: renderer,
  gfm: true,
  breaks: false,
  pedantic: false,
  sanitize: false,
  smartypants: false,
  headerIds: true
});

// Process all Markdown files
function processBlogFiles() {
  console.log('Processing blog files...');

  // Read all files in the blog directory
  const files = fs.readdirSync(BLOG_DIR)
    .filter(file => file.endsWith('.md'));

  if (files.length === 0) {
    console.error('No Markdown files found in', BLOG_DIR);
    process.exit(1);
  }

  console.log(`Found ${files.length} Markdown files`);

  // Process each file
  const blogPosts = files.map((filename, index) => {
    const filePath = path.join(BLOG_DIR, filename);
    const fileContent = fs.readFileSync(filePath, 'utf8');

    // Parse frontmatter
    const { data, content } = matter(fileContent);

    // Convert Markdown to HTML
    const html = marked.parse(content);

    // Generate HTML filename
    const htmlFilename = filename.replace('.md', '.html');

    // Write HTML file
    fs.writeFileSync(path.join(OUTPUT_DIR, htmlFilename), html);

    // Return metadata for manifest
    return {
      id: index + 1,
      title: data.title,
      date: data.date,
      summary: data.summary,
      tags: data.tags.split(',').map(tag => tag.trim()),
      url: data.url,
      filename: htmlFilename,
      originalFilename: filename
    };
  });

  // Sort blog posts by date (newest first)
  blogPosts.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Write manifest file
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify({
    posts: blogPosts
  }, null, 2));

  console.log(`Generated ${blogPosts.length} HTML files and manifest.json in ${OUTPUT_DIR}`);
}

// Run the script
processBlogFiles();
