export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  reply: string;
}

// Mirror of the API's request-shape limits (portfolio-api lambda/chat-schema.ts);
// requests outside these bounds are rejected with a 400.
export const CHAT_MAX_MESSAGES = 8;
export const CHAT_MAX_MESSAGE_CHARS = 1000;

// Mirror of the API's page contexts (portfolio-api lambda/chat-schema.ts): the
// assistant loads the data of the page the visitor is on and focuses on it.
export type ChatPage =
  | "home"
  | "profile"
  | "projects"
  | "blog"
  | "blog-post"
  | "workout";

export interface ChatContext {
  page: ChatPage;
  /** The `:url` segment of a /blog/:url route; only set for "blog-post". */
  slug?: string;
}

export interface ChatPageCopy {
  title: string;
  hint: string;
  /**
   * Ready-made questions prefilled in the input, so a visitor can just tap
   * send. The widget alternates between them until the first question is sent.
   */
  suggestions: readonly [string, string];
}

export const CHAT_PAGE_COPY: Record<ChatPage, ChatPageCopy> = {
  home: {
    title: "Ask about recent activity",
    hint: "Hi! Ask me what Hiro has been up to lately — GitHub work, blog posts, or gym sessions.",
    suggestions: [
      "What has Hiro been working on lately?",
      "How often has Hiro been training recently?",
    ],
  },
  profile: {
    title: "Ask about Hiro's profile",
    hint: "Hi! Ask me about Hiro's experience, skills, education, or qualifications.",
    suggestions: [
      "What are Hiro's strongest technical skills?",
      "Can you summarise Hiro's work experience?",
    ],
  },
  projects: {
    title: "Ask about the projects",
    hint: "Hi! Ask me about any of Hiro's projects — what they do and how they were built.",
    suggestions: [
      "Which project best shows Hiro's skills?",
      "What technologies do these projects use?",
    ],
  },
  blog: {
    title: "Ask about the blog",
    hint: "Looking for something to read? Ask me which posts cover a topic, or for a quick summary.",
    suggestions: [
      "What topics does Hiro write about?",
      "Which post should I read first?",
    ],
  },
  "blog-post": {
    title: "Ask about this post",
    hint: "Questions about this post? Ask me to explain or summarise any part of it.",
    suggestions: [
      "Can you summarise this post?",
      "What is the key takeaway of this post?",
    ],
  },
  workout: {
    title: "Ask about the training",
    hint: "Ask me about Hiro's training program, or how his recent sessions have gone.",
    suggestions: [
      "What does Hiro's training week look like?",
      "How have Hiro's recent sessions gone?",
    ],
  },
};

const PAGE_BY_SEGMENT: Record<string, ChatPage> = {
  home: "home",
  profile: "profile",
  projects: "projects",
  blog: "blog",
  workout: "workout",
};

/**
 * The chat context for a router URL. Pages without a dedicated assistant
 * (sign-in, the admin editors) get the general profile scope.
 */
export function chatContextForUrl(url: string): ChatContext {
  const path = url.split(/[?#]/)[0];
  const segments = path.split("/").filter(Boolean);
  if (segments[0] === "blog" && segments.length === 2) {
    let slug = segments[1];
    try {
      slug = decodeURIComponent(slug);
    } catch {
      // Keep the raw segment; the API simply won't find a matching post.
    }
    return { page: "blog-post", slug };
  }
  return {
    page: (segments.length === 1 && PAGE_BY_SEGMENT[segments[0]]) || "profile",
  };
}
