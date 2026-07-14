// pdfmake 0.3.x ships no type declarations of its own, and @types/pdfmake targets the
// older pre-0.3 API (pdfMake.vfs = ...), so we declare the minimal surface we actually use.
declare module 'pdfmake/build/pdfmake' {
  interface PdfMakeDocument {
    download(filename?: string): Promise<void>;
  }

  interface PdfMakeStatic {
    createPdf(docDefinition: unknown, options?: unknown): PdfMakeDocument;
    addVirtualFileSystem(vfs: Record<string, string>): void;
  }

  const pdfMake: PdfMakeStatic;
  export default pdfMake;
}

declare module 'pdfmake/build/vfs_fonts' {
  const vfs: Record<string, string>;
  export default vfs;
}
