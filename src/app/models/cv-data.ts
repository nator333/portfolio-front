export interface CvExperienceEntry {
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  location: string;
  bullets: string[];
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
    location: string;
    links: {
      website?: string;
      github?: string;
      linkedin?: string;
    };
  };
  summary: string;
  experience: CvExperienceEntry[];
  education: CvEducationEntry[];
  skills: string[];
}

export const EMPTY_CV_DATA: CvData = {
  personalInfo: {
    fullName: '',
    title: '',
    email: '',
    phone: '',
    location: '',
    links: {},
  },
  summary: '',
  experience: [],
  education: [],
  skills: [],
};
