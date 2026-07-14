export interface CvSkillCategory {
  /** Subsection label under Technical Skills, e.g. "Languages", "Cloud & DevOps". */
  category: string;
  skills: string[];
}

export interface CvExperienceEntry {
  company: string;
  role: string;
  /** Freeform, e.g. "January 2022". Rendered verbatim as "start – end". */
  startDate: string;
  endDate: string;
  bullets: string[];
  /** Rendered as a trailing "Techstack: ..." paragraph. */
  techstack: string;
}

export interface CvQualificationEntry {
  /** Bold lead-in, e.g. "Java". */
  label: string;
  /** e.g. "11 years of experience in backend development...". */
  text: string;
}

export interface CvEducationEntry {
  institution: string;
  degree: string;
  startDate: string;
  endDate: string;
}

export interface CvData {
  personalInfo: {
    fullName: string;
    title: string;
    email: string;
    phone: string;
    links: {
      website?: string;
      github?: string;
      linkedin?: string;
    };
  };
  summary: string;
  technicalSkills: CvSkillCategory[];
  experience: CvExperienceEntry[];
  qualifications: CvQualificationEntry[];
  education: CvEducationEntry[];
}

export const EMPTY_CV_DATA: CvData = {
  personalInfo: {
    fullName: '',
    title: '',
    email: '',
    phone: '',
    links: {},
  },
  summary: '',
  technicalSkills: [],
  experience: [],
  qualifications: [],
  education: [],
};
