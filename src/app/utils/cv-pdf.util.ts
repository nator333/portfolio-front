import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { CvData } from '../models/cv-data';

pdfMake.addVirtualFileSystem(pdfFonts);

// Site branding: NAKAMATA.TECH yellow on black. The pale yellow works as a
// fill/rule color; amber stands in for it on white, where it stays readable.
const INK = '#1a1a1a';
const BRAND_YELLOW = '#f8d948';
const AMBER = '#b8860b';
const MUTED = '#444444';

const PAGE_WIDTH = 595.28; // A4 portrait, points
const MARGIN_X = 40;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;
const HEADER_HEIGHT = 96;

type PdfMargin = [number, number, number, number];

function formatContactLine(info: CvData['personalInfo']): string {
  return [info.phone && `Phone: ${info.phone}`, info.email && `Email: ${info.email}`]
    .filter(Boolean)
    .join(' | ');
}

/** Major section heading with a full-width brand-yellow rule above, as in the reference CV. */
function sectionHeader(title: string) {
  return [
    {
      // Kept unbreakable so a page break can't strand the rule without its heading.
      unbreakable: true,
      stack: [
        {
          canvas: [
            {
              type: 'line',
              x1: 0,
              y1: 0,
              x2: CONTENT_WIDTH,
              y2: 0,
              lineWidth: 1,
              lineColor: BRAND_YELLOW,
            },
          ],
          margin: [0, 10, 0, 0] as PdfMargin,
        },
        { text: title.toUpperCase(), style: 'sectionHeader' },
      ],
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
  const { personalInfo, summary, technicalSkills, experience, qualifications, education } = data;

  return {
    pageSize: 'A4',
    pageMargins: [MARGIN_X, HEADER_HEIGHT + 26, MARGIN_X, 40] as PdfMargin,
    background: pageBackground,
    header: (currentPage: number) =>
      currentPage === 1
        ? {
            stack: [
              { text: personalInfo.fullName.toUpperCase(), style: 'name' },
              { text: personalInfo.title, style: 'title' },
              { text: formatContactLine(personalInfo), style: 'contact' },
            ],
            margin: [MARGIN_X, 20, MARGIN_X, 0] as PdfMargin,
          }
        : undefined,
    content: [
      ...(summary
        ? [
            ...sectionHeader('Professional Summary'),
            { text: summary, margin: [0, 0, 0, 2] as PdfMargin },
          ]
        : []),

      ...(technicalSkills.length
        ? [
            ...sectionHeader('Technical Skills'),
            {
              ul: technicalSkills.map((entry) => ({
                text: [
                  { text: `${entry.category}: `, bold: true },
                  { text: entry.skills.join(', ') },
                ],
                margin: [0, 0, 0, 2] as PdfMargin,
              })),
              markerColor: AMBER,
              margin: [4, 0, 0, 2] as PdfMargin,
            },
          ]
        : []),

      ...(experience.length
        ? [
            ...sectionHeader('Professional Experience'),
            ...experience.flatMap((entry, index) => [
              {
                text: [
                  { text: entry.company.toUpperCase(), bold: true },
                  { text: ' | ', color: AMBER },
                  { text: entry.role },
                ],
                style: 'entryTitle',
                margin: [0, index === 0 ? 0 : 10, 0, 1] as PdfMargin,
              },
              {
                text: `${entry.startDate} – ${entry.endDate}`,
                style: 'entryDates',
              },
              {
                ul: entry.bullets,
                markerColor: AMBER,
                margin: [4, 3, 0, 4] as PdfMargin,
              },
              ...(entry.techstack
                ? [
                    {
                      text: [
                        { text: 'Techstack: ', bold: true, color: AMBER },
                        { text: entry.techstack, color: MUTED },
                      ],
                      fontSize: 10,
                      margin: [4, 0, 0, 4] as PdfMargin,
                    },
                  ]
                : []),
            ]),
          ]
        : []),

      ...(qualifications.length
        ? [
            ...sectionHeader('Qualifications Summary'),
            ...qualifications.map((entry) => ({
              text: [
                { text: `${entry.label}: `, bold: true },
                { text: entry.text },
              ],
              margin: [0, 0, 0, 3] as PdfMargin,
            })),
          ]
        : []),

      ...(education.length
        ? [
            ...sectionHeader('Education'),
            {
              ul: education.map((entry) => ({
                text: `${entry.degree}, ${entry.institution} (${entry.startDate} – ${entry.endDate})`,
                margin: [0, 0, 0, 2] as PdfMargin,
              })),
              markerColor: AMBER,
              margin: [4, 0, 0, 0] as PdfMargin,
            },
          ]
        : []),
    ],
    styles: {
      name: { fontSize: 21, bold: true, color: BRAND_YELLOW },
      title: { fontSize: 12, color: '#ffffff', margin: [0, 3, 0, 3] as PdfMargin },
      contact: { fontSize: 10, color: '#cccccc' },
      sectionHeader: {
        fontSize: 15,
        bold: true,
        color: INK,
        margin: [0, 6, 0, 6] as PdfMargin,
      },
      entryTitle: { fontSize: 11, color: INK },
      entryDates: { fontSize: 10.5, italics: true, color: AMBER },
    },
    defaultStyle: { fontSize: 10.5, color: '#2a2a2a', lineHeight: 1.2 },
  };
}

export function downloadCvPdf(data: CvData): Promise<void> {
  const filename = `${data.personalInfo.fullName || 'cv'}.pdf`.replace(/\s+/g, '-');
  return pdfMake.createPdf(buildDocDefinition(data)).download(filename);
}
