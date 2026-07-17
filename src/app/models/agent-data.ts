import { CvData } from "./cv-data";
import { ProjectsData } from "./project-data";

export interface AgentMessage {
  role: "user" | "assistant";
  content: string;
}

export type AgentProposal =
  | { target: "cv"; data: CvData }
  | { target: "projects"; data: ProjectsData };

export interface AgentResponse {
  reply: string;
  proposal?: AgentProposal;
}

// Mirror of the API's request-shape limits (portfolio-api lambda/agent-schema.ts).
export const AGENT_MAX_MESSAGES = 20;
export const AGENT_MAX_MESSAGE_CHARS = 4000;
