import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { CvData } from '../models/cv-data';

pdfMake.addVirtualFileSystem(pdfFonts);

function formatContactLine(info: CvData['personalInfo']): string {
  return [info.email, info.phone, info.location].filter(Boolean).join('  |  ');
}

function buildDocDefinition(data: CvData) {
  const { personalInfo, summary, experience, education, skills } = data;

  return {
    content: [
      { text: personalInfo.fullName, style: 'name' },
      { text: personalInfo.title, style: 'title' },
      { text: formatContactLine(personalInfo), style: 'contact' },

      ...(summary ? [{ text: 'Summary', style: 'sectionHeader' }, { text: summary, margin: [0, 0, 0, 10] as [number, number, number, number] }] : []),

      ...(experience.length
        ? [
            { text: 'Experience', style: 'sectionHeader' },
            ...experience.flatMap((entry) => [
              {
                columns: [
                  { text: `${entry.role}, ${entry.company}`, style: 'entryTitle' },
                  { text: `${entry.startDate} – ${entry.endDate}`, style: 'entryDates', alignment: 'right' as const },
                ],
              },
              { text: entry.location, style: 'entrySubtitle' },
              { ul: entry.bullets, margin: [0, 2, 0, 10] as [number, number, number, number] },
            ]),
          ]
        : []),

      ...(education.length
        ? [
            { text: 'Education', style: 'sectionHeader' },
            ...education.map((entry) => ({
              columns: [
                { text: `${entry.degree}, ${entry.institution}`, style: 'entryTitle' },
                { text: `${entry.startDate} – ${entry.endDate}`, style: 'entryDates', alignment: 'right' as const },
              ],
              margin: [0, 0, 0, 8] as [number, number, number, number],
            })),
          ]
        : []),

      ...(skills.length
        ? [{ text: 'Skills', style: 'sectionHeader' }, { text: skills.join('  •  ') }]
        : []),
    ],
    styles: {
      name: { fontSize: 22, bold: true },
      title: { fontSize: 14, margin: [0, 2, 0, 2] as [number, number, number, number] },
      contact: { fontSize: 10, color: '#555555', margin: [0, 0, 0, 15] as [number, number, number, number] },
      sectionHeader: { fontSize: 13, bold: true, margin: [0, 10, 0, 6] as [number, number, number, number] },
      entryTitle: { fontSize: 11, bold: true },
      entryDates: { fontSize: 10, color: '#555555' },
      entrySubtitle: { fontSize: 10, italics: true, color: '#555555' },
    },
  };
}

export function downloadCvPdf(data: CvData): Promise<void> {
  const filename = `${data.personalInfo.fullName || 'cv'}.pdf`.replace(/\s+/g, '-');
  return pdfMake.createPdf(buildDocDefinition(data)).download(filename);
}
