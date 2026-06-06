import logo from "@/assets/logo.png";
import { rosterScale, sortRosterStudents, type RosterStudent } from "@/lib/section-roster";

type Props = {
  sectionName: string;
  students: RosterStudent[];
};

export function SectionRosterSheet({ sectionName, students }: Props) {
  const sorted = sortRosterStudents(students);
  const scale = rosterScale(sorted.length);

  return (
    <div
      className="section-roster-sheet bg-white text-black shadow-lg"
      data-section-name={sectionName}
      data-students={JSON.stringify(sorted)}
      style={{
        width: "210mm",
        minHeight: "297mm",
        maxHeight: "297mm",
        padding: "8mm 10mm 6mm",
        overflow: "hidden",
        fontFamily: '"Times New Roman", Times, serif',
        fontSize: `${scale.fontSize}px`,
        lineHeight: 1.25,
      }}
    >
      <div className="flex items-start gap-2" style={{ marginBottom: 6 }}>
        <img
          src={logo}
          alt="SMNHS Logo"
          className="roster-logo shrink-0 object-contain"
          style={{ width: scale.logoSize, height: scale.logoSize }}
        />
        <div className="flex-1 text-center">
          <div style={{ fontSize: scale.fontSize - 1 }}>Republic of the Philippines</div>
          <div style={{ fontSize: scale.fontSize - 1 }}>Department of Education</div>
          <div
            className="font-bold uppercase"
            style={{ fontSize: scale.fontSize + 3 }}
          >
            Santa Monica National High School
          </div>
          <div style={{ fontSize: scale.fontSize - 1 }}>Puerto Princesa City</div>
          <div className="font-bold" style={{ fontSize: scale.fontSize, marginTop: 2 }}>
            Senior High School — Class List
          </div>
        </div>
      </div>

      <div className="text-center" style={{ margin: "4px 0 6px" }}>
        <div>
          <span className="font-bold">Section:</span> {sectionName}
        </div>
        <div>
          <span className="font-bold">School Year:</span> 2026–2027 &nbsp;|&nbsp;{" "}
          <span className="font-bold">Grade Level:</span> 12
        </div>
      </div>

      <table
        className="w-full border-collapse"
        style={{ fontSize: scale.fontSize }}
      >
        <thead>
          <tr>
            <th className="border border-black bg-neutral-100 text-center font-bold" style={{ width: "6%", padding: scale.rowPad }}>
              No.
            </th>
            <th className="border border-black bg-neutral-100 text-center font-bold" style={{ width: "34%", padding: scale.rowPad }}>
              Name of Learner
            </th>
            <th className="border border-black bg-neutral-100 text-center font-bold" style={{ width: "22%", padding: scale.rowPad }}>
              LRN
            </th>
            <th className="border border-black bg-neutral-100 text-center font-bold" style={{ width: "8%", padding: scale.rowPad }}>
              Sex
            </th>
            <th className="border border-black bg-neutral-100 text-center font-bold" style={{ width: "30%", padding: scale.rowPad }}>
              Strand
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={5} className="border border-black text-center" style={{ padding: 12 }}>
                No students assigned.
              </td>
            </tr>
          ) : (
            sorted.map((s, i) => (
              <tr key={`${s.last_name}-${s.first_name}-${i}`}>
                <td className="border border-black text-center" style={{ padding: scale.rowPad }}>
                  {i + 1}
                </td>
                <td className="border border-black" style={{ padding: scale.rowPad }}>
                  {s.last_name}, {s.first_name}
                </td>
                <td className="border border-black text-center font-mono" style={{ padding: scale.rowPad }}>
                  {s.lrn || "—"}
                </td>
                <td className="border border-black text-center" style={{ padding: scale.rowPad }}>
                  {s.sex || "—"}
                </td>
                <td className="border border-black" style={{ padding: scale.rowPad }}>
                  {s.strand || "—"}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="font-bold" style={{ marginTop: 4 }}>
        Total Students: {sorted.length}
      </div>

      <div className="flex justify-between" style={{ marginTop: 8, fontSize: scale.fontSize - 1 }}>
        <div className="text-center" style={{ width: "42%" }}>
          <div className="border-t border-black font-bold" style={{ marginTop: 28, paddingTop: 3 }}>
            Class Adviser
          </div>
        </div>
        <div className="text-center" style={{ width: "42%" }}>
          <div className="border-t border-black font-bold" style={{ marginTop: 28, paddingTop: 3 }}>
            Registrar / OIC
          </div>
        </div>
      </div>
    </div>
  );
}
