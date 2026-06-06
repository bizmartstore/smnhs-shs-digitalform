import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import depedSealUrl from "@/assets/deped-seal.png";
import footerUrl from "@/assets/roster-footer.png";

export type RosterStudent = {
  last_name: string;
  first_name: string;
  middle_name?: string | null;
  lrn?: string | null;
  sex?: string | null;
  strand?: string | null;
};

export type RosterScale = {
  fontSize: number;
  rowPad: number;
  logoSize: number;
  minRows: number;
};

export function rosterScale(maleCount: number, femaleCount: number): RosterScale {
  const needed = Math.max(maleCount, femaleCount, 25);
  if (needed <= 25) return { fontSize: 10, rowPad: 4, logoSize: 76, minRows: 25 };
  if (needed <= 30) return { fontSize: 9, rowPad: 3, logoSize: 68, minRows: needed };
  if (needed <= 35) return { fontSize: 8.5, rowPad: 2.5, logoSize: 62, minRows: needed };
  return { fontSize: 8, rowPad: 2, logoSize: 56, minRows: needed };
}

export function sortRosterStudents(students: RosterStudent[]) {
  return [...students].sort((a, b) => {
    const last = a.last_name.localeCompare(b.last_name, undefined, { sensitivity: "base" });
    if (last !== 0) return last;
    return a.first_name.localeCompare(b.first_name, undefined, { sensitivity: "base" });
  });
}

export function formatStudentName(student: RosterStudent) {
  const mi = student.middle_name?.trim();
  const miPart = mi ? ` ${mi.charAt(0).toUpperCase()}.` : "";
  return `${student.last_name}, ${student.first_name}${miPart}`;
}

export function splitStudentsBySex(students: RosterStudent[]) {
  const sorted = sortRosterStudents(students);
  const males = sorted.filter((s) => s.sex?.toLowerCase() === "male");
  const females = sorted.filter((s) => s.sex?.toLowerCase() === "female");
  return { males, females };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(value: string) {
  return value.replace(/"/g, "&quot;");
}

function resolveLogoSrc(logoSrc?: string) {
  return logoSrc?.trim() || depedSealUrl;
}

function resolveFooterSrc(footerSrc?: string) {
  return footerSrc?.trim() || footerUrl;
}

function rosterStyles(scale: RosterScale) {
  return `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    @page { size: A4 portrait; margin: 0; }
    html, body {
      width: 210mm;
      height: 297mm;
      margin: 0;
      padding: 0;
      font-family: Arial, Helvetica, sans-serif;
      color: #111;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .sheet {
      width: 210mm;
      min-height: 297mm;
      max-height: 297mm;
      padding: 7mm 9mm 6mm;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .logo-wrap {
      display: flex;
      justify-content: center;
      margin-bottom: 4px;
    }
    .logo {
      width: ${scale.logoSize}px;
      height: ${scale.logoSize}px;
      object-fit: contain;
    }
    .gov-header {
      text-align: center;
      line-height: 1.28;
      margin-bottom: 5px;
    }
    .gov-header .rep {
      font-family: "Times New Roman", Times, serif;
      font-style: italic;
      font-size: ${scale.fontSize + 1}px;
      letter-spacing: 0.2px;
    }
    .gov-header .deped {
      font-family: "Times New Roman", Times, serif;
      font-weight: 700;
      font-size: ${scale.fontSize + 4}px;
      letter-spacing: 0.4px;
      margin-top: 1px;
    }
    .gov-header .region,
    .gov-header .division {
      font-size: ${scale.fontSize}px;
      font-weight: 600;
      letter-spacing: 0.15px;
    }
    .gov-header .school {
      font-size: ${scale.fontSize + 3}px;
      font-weight: 800;
      letter-spacing: 0.6px;
      margin-top: 2px;
      text-transform: uppercase;
    }
    .rule-double {
      border-top: 2.5px solid #111;
      border-bottom: 1px solid #111;
      height: 5px;
      margin: 5px 0 7px;
    }
    .section-title {
      text-align: center;
      font-size: ${scale.fontSize + 5}px;
      font-weight: 800;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      margin-bottom: 3px;
    }
    .adviser-line {
      text-align: center;
      font-size: ${scale.fontSize + 1}px;
      font-weight: 700;
      margin-bottom: 6px;
    }
    .adviser-line span { font-weight: 800; }
    .columns {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      flex: 1;
      min-height: 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      font-size: ${scale.fontSize}px;
    }
    th, td {
      border: 1px solid #111;
      padding: ${scale.rowPad}px 5px;
      vertical-align: middle;
      line-height: 1.15;
    }
    th {
      background: #ececec;
      font-weight: 700;
      text-align: center;
    }
    th.num, td.num {
      width: 11%;
      text-align: center;
      font-weight: 600;
    }
    th.gender-head {
      font-size: ${scale.fontSize + 1}px;
      letter-spacing: 0.5px;
    }
    th.name-head {
      font-size: ${scale.fontSize - 0.5}px;
      font-weight: 600;
      text-align: center;
      padding-top: ${scale.rowPad - 1}px;
      padding-bottom: ${scale.rowPad - 1}px;
    }
    td.name {
      text-align: left;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    td.empty { color: transparent; }
    .sheet-footer {
      margin-top: auto;
      padding-top: 4px;
      flex-shrink: 0;
    }
    .sheet-footer img {
      display: block;
      width: 100%;
      max-height: 46px;
      object-fit: contain;
      object-position: center;
    }
    @media print {
      html, body { width: 210mm; height: 297mm; }
      .sheet { page-break-after: avoid; page-break-inside: avoid; }
    }
  `;
}

function genderTableRows(students: RosterStudent[], minRows: number) {
  const rows: string[] = [];
  for (let i = 0; i < minRows; i += 1) {
    const student = students[i];
    const name = student ? escapeHtml(formatStudentName(student)) : "";
    rows.push(`
      <tr>
        <td class="num">${i + 1}</td>
        <td class="name${student ? "" : " empty"}">${name || "&nbsp;"}</td>
      </tr>`);
  }
  return rows.join("");
}

function genderTable(label: "MALE" | "FEMALE", students: RosterStudent[], minRows: number) {
  return `
    <table>
      <thead>
        <tr>
          <th class="num" rowspan="2">No.</th>
          <th class="gender-head">${label}</th>
        </tr>
        <tr>
          <th class="name-head">Name of Students (Last Name, Given Name, MI)</th>
        </tr>
      </thead>
      <tbody>
        ${genderTableRows(students, minRows)}
      </tbody>
    </table>`;
}

function rosterBody(
  sectionName: string,
  adviserName: string | null | undefined,
  students: RosterStudent[],
  logoSrc: string,
  footerSrc: string,
  scale: RosterScale,
) {
  const { males, females } = splitStudentsBySex(students);
  const adviser = adviserName?.trim() || "_________________________";
  const sectionLabel = sectionName.toUpperCase().startsWith("GRADE")
    ? sectionName.toUpperCase()
    : `GRADE 12 – ${sectionName.toUpperCase()}`;

  return `
    <div class="sheet">
      <div class="logo-wrap">
        <img class="logo roster-logo" src="${escapeAttr(logoSrc)}" alt="DepEd Seal" />
      </div>
      <div class="gov-header">
        <div class="rep">Republic of the Philippines</div>
        <div class="deped">Department of Education</div>
        <div class="region">MIMAROPA Region</div>
        <div class="division">Schools Division of Puerto Princesa City</div>
        <div class="school">Santa Monica National High School</div>
      </div>
      <div class="rule-double"></div>
      <div class="section-title">${escapeHtml(sectionLabel)}</div>
      <div class="adviser-line"><span>Class Adviser:</span> ${escapeHtml(adviser)}</div>
      <div class="columns">
        ${genderTable("MALE", males, scale.minRows)}
        ${genderTable("FEMALE", females, scale.minRows)}
      </div>
      <div class="sheet-footer">
        <img class="roster-footer" src="${escapeAttr(footerSrc)}" alt="School contact information" />
      </div>
    </div>`;
}

export function buildRosterDocument(
  sectionName: string,
  adviserName: string | null | undefined,
  students: RosterStudent[],
  logoSrc?: string,
  footerSrc?: string,
) {
  const { males, females } = splitStudentsBySex(students);
  const scale = rosterScale(males.length, females.length);
  const resolvedLogo = resolveLogoSrc(logoSrc);
  const resolvedFooter = resolveFooterSrc(footerSrc);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title></title>
  <style>${rosterStyles(scale)}</style>
</head>
<body>
  ${rosterBody(sectionName, adviserName, students, resolvedLogo, resolvedFooter, scale)}
</body>
</html>`;
}

async function waitForImages(doc: Document) {
  const images = Array.from(doc.querySelectorAll<HTMLImageElement>("img"));
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }
          img.addEventListener("load", () => resolve(), { once: true });
          img.addEventListener("error", () => resolve(), { once: true });
          setTimeout(resolve, 1200);
        }),
    ),
  );
}

async function renderRosterCanvas(
  sectionName: string,
  adviserName: string | null | undefined,
  students: RosterStudent[],
  logoSrc?: string,
  footerSrc?: string,
) {
  const html = buildRosterDocument(sectionName, adviserName, students, logoSrc, footerSrc);
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.position = "fixed";
  iframe.style.left = "-10000px";
  iframe.style.top = "0";
  iframe.style.width = "210mm";
  iframe.style.height = "297mm";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  if (!doc) {
    document.body.removeChild(iframe);
    throw new Error("Unable to prepare print document.");
  }

  doc.open();
  doc.write(html);
  doc.close();

  await waitForImages(doc);

  const sheet = doc.querySelector<HTMLElement>(".sheet");
  if (!sheet) {
    document.body.removeChild(iframe);
    throw new Error("Roster template not found.");
  }

  const canvas = await html2canvas(sheet, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    width: sheet.offsetWidth,
    height: sheet.offsetHeight,
    windowWidth: sheet.scrollWidth,
    windowHeight: sheet.scrollHeight,
  });

  document.body.removeChild(iframe);
  return canvas;
}

export async function printRoster(
  sectionName: string,
  adviserName: string | null | undefined,
  students: RosterStudent[],
  logoSrc?: string,
  footerSrc?: string,
) {
  const doc = buildRosterDocument(sectionName, adviserName, students, logoSrc, footerSrc);
  const blob = new Blob([doc], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const cleanup = (win: Window | null) => {
    URL.revokeObjectURL(url);
    win?.close();
  };

  const win = window.open(url, "_blank", "noopener,noreferrer,width=820,height=1160");
  if (!win) {
    URL.revokeObjectURL(url);
    throw new Error("Popup blocked");
  }

  win.addEventListener("load", () => {
    win.document.title = "";
    win.focus();
    win.print();
    win.addEventListener("afterprint", () => cleanup(win), { once: true });
    setTimeout(() => cleanup(win), 8000);
  });
}

export async function downloadRosterPdf(
  sectionName: string,
  adviserName: string | null | undefined,
  students: RosterStudent[],
  filename: string,
  logoSrc?: string,
  footerSrc?: string,
) {
  const canvas = await renderRosterCanvas(sectionName, adviserName, students, logoSrc, footerSrc);
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgData = canvas.toDataURL("image/png");
  pdf.addImage(imgData, "PNG", 0, 0, pageWidth, pageHeight);
  pdf.save(filename);
}

export function downloadRosterWord(
  sectionName: string,
  adviserName: string | null | undefined,
  students: RosterStudent[],
  logoSrc: string | undefined,
  filename: string,
  footerSrc?: string,
) {
  const html = buildRosterDocument(sectionName, adviserName, students, logoSrc, footerSrc);
  const blob = new Blob(["\ufeff", html], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function safeSectionFilename(sectionName: string) {
  return sectionName.replace(/[^\w\-]+/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "") || "section";
}
