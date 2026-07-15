export interface ProjectEntry {
  title: string;
  /** Short tech line shown under the title, e.g. "Spring Boot, React". */
  tech: string;
  description: string;
  /** Image URL or bundled asset path, e.g. "assets/projects/foo.png". */
  image: string;
  tags: string[];
  liveUrl?: string;
  githubUrl?: string;
}

export interface ProjectsData {
  projects: ProjectEntry[];
}

export const EMPTY_PROJECTS_DATA: ProjectsData = {
  projects: [],
};
