import { Marked, Tokens } from 'marked';

/**
 * Markdown-to-HTML conversion for blog posts fetched from portfolio-api.
 * Fenced code blocks become Prism-ready <pre class="line-numbers"> blocks, and
 * extra tokens on the info string (e.g. `bash data-user="user" class="command-line"`)
 * carry over as classes / data attributes on the <pre> element.
 */
function renderCode({ text, lang }: Tokens.Code): string {
  const parts = (lang ?? '').split(' ').filter(Boolean);
  const baseLanguage = parts[0] ?? '';

  const preClasses = ['line-numbers'];
  let attributes = '';
  for (const attr of parts.slice(1)) {
    if (attr.startsWith('class=')) {
      preClasses.push(attr.substring(6).replace(/['"]/g, ''));
    } else if (attr.startsWith('data-')) {
      attributes += ` ${attr}`;
    }
  }

  const langClass = baseLanguage ? `language-${baseLanguage}` : '';
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return `<pre class="${preClasses.join(' ')}"${attributes}><code class="${langClass}">${escaped}</code></pre>`;
}

// Own instance so the renderer override cannot leak into other marked users.
const blogMarked = new Marked({
  gfm: true,
  breaks: false,
  pedantic: false,
  renderer: { code: renderCode },
});

export function renderBlogMarkdown(markdown: string): string {
  return blogMarked.parse(markdown, { async: false }) as string;
}
