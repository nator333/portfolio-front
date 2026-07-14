import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { CvData } from '../models/cv-data';

pdfMake.addVirtualFileSystem(pdfFonts);

// Site branding: NAKAMATA.TECH yellow on black. The pale yellow works as a
// fill/rule color; amber stands in for it on white, where it stays readable.
const INK = '#1a1a1a';
const BRAND_YELLOW = '#f8d948';
const AMBER = '#b8860b';
const MUTED = '#666666';

const PAGE_WIDTH = 595.28; // A4 portrait, points
const MARGIN_X = 40;
const HEADER_HEIGHT = 110;

type PdfMargin = [number, number, number, number];

function formatContactLine(info: CvData['personalInfo']): string {
  return [info.email, info.phone, info.location].filter(Boolean).join('   |   ');
}

/** Section title with a short brand-yellow underline. */
function sectionHeader(title: string) {
  return [
    { text: title.toUpperCase(), style: 'sectionHeader' },
    {
      canvas: [
        { type: 'line', x1: 0, y1: 0, x2: 36, y2: 0, lineWidth: 2.5, lineColor: BRAND_YELLOW },
      ],
      margin: [0, 0, 0, 8] as PdfMargin,
    },
  ];
}

/** Full-bleed black band behind the name, drawn on the first page only. */
function pageBackground(currentPage: number) {
  if (currentPage !== 1) {
    return undefined;
  }
  return {
    canvas: [
      { type: 'rect', x: 0, y: 0, w: PAGE_WIDTH, h: HEADER_HEIGHT, color: INK },
      { type: 'rect', x: 0, y: HEADER_HEIGHT, w: PAGE_WIDTH, h: 4, color: BRAND_YELLOW },
    ],
  };
}

export function buildDocDefinition(data: CvData) {
  const { personalInfo, summary, experience, education, skills } = data;

  return {
    pageSize: 'A4',
    pageMargins: [MARGIN_X, HEADER_HEIGHT + 34, MARGIN_X, 40] as PdfMargin,
    background: pageBackground,
    header: (currentPage: number) =>
      currentPage === 1
        ? {
            stack: [
              { text: personalInfo.fullName, style: 'name' },
              { text: personalInfo.title, style: 'title' },
              { text: formatContactLine(personalInfo), style: 'contact' },
            ],
            margin: [MARGIN_X, 24, MARGIN_X, 0] as PdfMargin,
          }
        : undefined,
    content: [
      ...(summary
        ? [...sectionHeader('Summary'), { text: summary, margin: [0, 0, 0, 12] as PdfMargin }]
        : []),

      ...(experience.length
        ? [
            ...sectionHeader('Experience'),
            ...experience.flatMap((entry) => [
              {
                columns: [
                  { text: `${entry.role}, ${entry.company}`, style: 'entryTitle' },
                  { text: `${entry.startDate} – ${entry.endDate}`, style: 'entryDates', alignment: 'right' as const },
                ],
              },
              { text: entry.location, style: 'entrySubtitle' },
              {
                ul: entry.bullets,
                markerColor: AMBER,
                margin: [0, 2, 0, 12] as PdfMargin,
              },
            ]),
          ]
        : []),

      ...(education.length
        ? [
            ...sectionHeader('Education'),
            ...education.map((entry) => ({
              columns: [
                { text: `${entry.degree}, ${entry.institution}`, style: 'entryTitle' },
                { text: `${entry.startDate} – ${entry.endDate}`, style: 'entryDates', alignment: 'right' as const },
              ],
              margin: [0, 0, 0, 8] as PdfMargin,
            })),
          ]
        : []),

      ...(skills.length
        ? [
            ...sectionHeader('Skills'),
            {
              text: skills
                .flatMap((skill) => [
                  { text: skill, color: INK },
                  { text: '  •  ', color: AMBER },
                ])
                .slice(0, -1),
            },
          ]
        : []),
    ],
    styles: {
      name: { fontSize: 24, bold: true, color: BRAND_YELLOW },
      title: { fontSize: 13, color: '#ffffff', margin: [0, 3, 0, 3] as PdfMargin },
      contact: { fontSize: 9.5, color: '#cccccc' },
      sectionHeader: {
        fontSize: 12,
        bold: true,
        color: INK,
        characterSpacing: 1,
        margin: [0, 12, 0, 3] as PdfMargin,
      },
      entryTitle: { fontSize: 11, bold: true, color: INK },
      entryDates: { fontSize: 10, color: AMBER, bold: true },
      entrySubtitle: { fontSize: 10, italics: true, color: MUTED },
    },
    defaultStyle: { fontSize: 10.5, color: '#2a2a2a', lineHeight: 1.15 },
  };
}

export function downloadCvPdf(data: CvData): Promise<void> {
  const filename = `${data.personalInfo.fullName || 'cv'}.pdf`.replace(/\s+/g, '-');
  return pdfMake.createPdf(buildDocDefinition(data)).download(filename);
}
