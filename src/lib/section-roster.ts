import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export type RosterStudent = {
  last_name: string;
  first_name: string;
  lrn?: string | null;
  sex?: string | null;
  strand?: string | null;
};

export type RosterScale = {
  fontSize: number;
  rowPad: number;
  logoSize: number;
  headerGap: number;
};

export function rosterScale(studentCount: number): RosterScale {
  if (studentCount <= 20) return { fontSize: 11, rowPad: 5, logoSize: 60, headerGap: 10 };
  if (studentCount <= 30) return { fontSize: 10, rowPad: 4, logoSize: 54, headerGap: 8 };
  if (studentCount <= 40) return { fontSize: 9, rowPad: 3, logoSize: 48, headerGap: 6 };
  return { fontSize: 8, rowPad: 2, logoSize: 44, headerGap: 5 };
}

export function sortRosterStudents(students: RosterStudent[]) {
  return [...students].sort((a, b) => {
    const last = a.last_name.localeCompare(b.last_name);
    if (last !== 0) return last;
    return a.first_name.localeCompare(b.first_name);
  });
}

function rosterStyles(scale: RosterScale) {
  return `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    @page { size: A4 portrait; margin: 8mm; }
    html, body {
      width: 210mm;
      height: 297mm;
      margin: 0;
      padding: 0;
      font-family: "Times New Roman", Times, serif;
      color: #000;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .sheet {
      width: 210mm;
      min-height: 297mm;
      max-height: 297mm;
      padding: 8mm 10mm 6mm;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      align-items: stretch;
      justify-content: flex-start;
    }
    .header {
      display: flex;
      align-items: flex-start;
      gap: ${scale.headerGap}px;
      margin-bottom: 6px;
      flex-shrink: 0;
    }
    .logo {
      width: ${scale.logoSize}px;
      height: ${scale.logoSize}px;
      object-fit: contain;
      flex-shrink: 0;
    }
    .school-lines { text-align: center; flex: 1; line-height: 1.25; }
    .school-lines .line1 { font-size: ${scale.fontSize - 1}px; }
    .school-lines .line2 { font-size: ${scale.fontSize + 3}px; font-weight: bold; text-transform: uppercase; }
    .school-lines .line3 { font-size: ${scale.fontSize - 1}px; }
    .school-lines .line4 { font-size: ${scale.fontSize}px; font-weight: bold; margin-top: 2px; }
    .meta {
      text-align: center;
      font-size: ${scale.fontSize}px;
      margin: 4px 0 6px;
      flex-shrink: 0;
    }
    .meta strong { font-weight: bold; }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: ${scale.fontSize}px;
      flex: 1;
    }
    th, td {
      border: 1px solid #000;
      padding: ${scale.rowPad}px 4px;
      text-align: left;
      vertical-align: middle;
    }
    th {
      font-weight: bold;
      text-align: center;
      background: #f5f5f5;
    }
    td.num, th.num { width: 6%; text-align: center; }
    td.name { width: 34%; }
    td.lrn { width: 22%; text-align: center; font-family: monospace; }
    td.sex { width: 8%; text-align: center; }
    td.strand { width: 30%; }
    .footer {
      margin-top: 8px;
      display: flex;
      justify-content: space-between;
      font-size: ${scale.fontSize - 1}px;
      flex-shrink: 0;
    }
    .sig { width: 42%; text-align: center; }
    .sig-line { border-top: 1px solid #000; margin-top: 28px; padding-top: 3px; font-weight: bold; }
    .total { margin-top: 4px; font-size: ${scale.fontSize}px; font-weight: bold; flex-shrink: 0; }
  `;
}

function rosterBody(sectionName: string, students: RosterStudent[], logoSrc: string, scale: RosterScale) {
  const sorted = sortRosterStudents(students);
  const rows = sorted
    .map(
      (s, i) => `
      <tr>
        <td class="num">${i + 1}</td>
        <td class="name">${escapeHtml(`${s.last_name}, ${s.first_name}`)}</td>
        <td class="lrn">${escapeHtml(s.lrn || "—")}</td>
        <td class="sex">${escapeHtml(s.sex || "—")}</td>
        <td class="strand">${escapeHtml(s.strand || "—")}</td>
      </tr>`,
    )
    .join("");

  return `
    <div class="sheet">
      <div class="header">
        <img class="logo" src="${logoSrc}" alt="SMNHS Logo" />
        <div class="school-lines">
          <div class="line1">Republic of the Philippines</div>
          <div class="line1">Department of Education</div>
          <div class="line2">Santa Monica National High School</div>
          <div class="line3">Puerto Princesa City</div>
          <div class="line4">Senior High School — Class List</div>
        </div>
      </div>
      <div class="meta">
        <div><strong>Section:</strong> ${escapeHtml(sectionName)}</div>
        <div><strong>School Year:</strong> 2026–2027 &nbsp;|&nbsp; <strong>Grade Level:</strong> 12</div>
      </div>
      <table>
        <thead>
          <tr>
            <th class="num">No.</th>
            <th class="name">Name of Learner</th>
            <th class="lrn">LRN</th>
            <th class="sex">Sex</th>
            <th class="strand">Strand</th>
          </tr>
        </thead>
        <tbody>
          ${rows || `<tr><td colspan="5" style="text-align:center;padding:12px;">No students assigned.</td></tr>`}
        </tbody>
      </table>
      <div class="total">Total Students: ${sorted.length}</div>
      <div class="footer">
        <div class="sig"><div class="sig-line">Class Adviser</div></div>
        <div class="sig"><div class="sig-line">Registrar / OIC</div></div>
      </div>
    </div>`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildRosterDocument(sectionName: string, students: RosterStudent[], logoSrc: string) {
  const scale = rosterScale(students.length);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title></title>
  <style>${rosterStyles(scale)}</style>
</head>
<body>
  ${rosterBody(sectionName, students, logoSrc, scale)}
</body>
</html>`;
}

export async function printRoster(element: HTMLElement) {
  const logoImg = element.querySelector<HTMLImageElement>(".roster-logo");
  const logoSrc = logoImg?.src ?? "";
  const sectionName = element.dataset.sectionName ?? "Section";
  const studentsJson = element.dataset.students ?? "[]";
  const students = JSON.parse(studentsJson) as RosterStudent[];

  const doc = buildRosterDocument(sectionName, students, logoSrc);
  const blob = new Blob([doc], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const cleanup = (win: Window | null) => {
    URL.revokeObjectURL(url);
    win?.close();
  };

  const win = window.open(url, "_blank", "noopener,noreferrer,width=800,height=1120");
  if (!win) {
    URL.revokeObjectURL(url);
    throw new Error("Popup blocked");
  }

  win.addEventListener("load", () => {
    win.document.title = "";
    win.focus();
    win.print();
    win.addEventListener("afterprint", () => cleanup(win), { once: true });
    setTimeout(() => cleanup(win), 5000);
  });
}

export async function downloadRosterPdf(element: HTMLElement, filename: string) {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    width: element.offsetWidth,
    height: element.offsetHeight,
  });

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgData = canvas.toDataURL("image/png");
  pdf.addImage(imgData, "PNG", 0, 0, pageWidth, pageHeight);
  pdf.save(filename);
}

export function downloadRosterWord(sectionName: string, students: RosterStudent[], logoSrc: string, filename: string) {
  const html = buildRosterDocument(sectionName, students, logoSrc);
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
