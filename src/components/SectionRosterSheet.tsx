import depedSeal from "@/assets/deped-seal.png";
import rosterFooter from "@/assets/roster-footer.png";
import {
  formatStudentName,
  rosterScale,
  splitStudentsBySex,
  type RosterStudent,
} from "@/lib/section-roster";

type Props = {
  sectionName: string;
  adviserName?: string | null;
  students: RosterStudent[];
};

function GenderTable({
  label,
  students,
  minRows,
  scale,
}: {
  label: "MALE" | "FEMALE";
  students: RosterStudent[];
  minRows: number;
  scale: ReturnType<typeof rosterScale>;
}) {
  return (
    <table className="w-full border-collapse table-fixed" style={{ fontSize: scale.fontSize }}>
      <thead>
        <tr>
          <th
            rowSpan={2}
            className="border border-black bg-[#ececec] text-center font-bold"
            style={{ width: "11%", padding: scale.rowPad }}
          >
            No.
          </th>
          <th
            className="border border-black bg-[#ececec] text-center font-bold tracking-wide"
            style={{ padding: scale.rowPad, fontSize: scale.fontSize + 1 }}
          >
            {label}
          </th>
        </tr>
        <tr>
          <th
            className="border border-black bg-[#ececec] text-center font-semibold"
            style={{ padding: scale.rowPad - 1, fontSize: scale.fontSize - 0.5 }}
          >
            Name of Students (Last Name, Given Name, MI)
          </th>
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: minRows }, (_, i) => {
          const student = students[i];
          return (
            <tr key={`${label}-${i}`}>
              <td
                className="border border-black text-center font-semibold"
                style={{ padding: scale.rowPad }}
              >
                {i + 1}
              </td>
              <td
                className="border border-black truncate"
                style={{ padding: scale.rowPad }}
              >
                {student ? formatStudentName(student) : "\u00A0"}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export function SectionRosterSheet({ sectionName, adviserName, students }: Props) {
  const { males, females } = splitStudentsBySex(students);
  const scale = rosterScale(males.length, females.length);
  const adviser = adviserName?.trim() || "_________________________";
  const sectionLabel = sectionName.toUpperCase().startsWith("GRADE")
    ? sectionName.toUpperCase()
    : `GRADE 12 – ${sectionName.toUpperCase()}`;

  return (
    <div
      className="section-roster-sheet bg-white text-[#111] shadow-xl ring-1 ring-black/5 flex flex-col"
      data-section-name={sectionName}
      data-adviser-name={adviserName ?? ""}
      data-students={JSON.stringify(students)}
      style={{
        width: "210mm",
        minHeight: "297mm",
        maxHeight: "297mm",
        padding: "7mm 9mm 6mm",
        overflow: "hidden",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: `${scale.fontSize}px`,
        lineHeight: 1.15,
      }}
    >
      <div className="flex justify-center" style={{ marginBottom: 4 }}>
        <img
          src={depedSeal}
          alt="DepEd Seal"
          className="roster-logo object-contain"
          style={{ width: scale.logoSize, height: scale.logoSize }}
        />
      </div>

      <div className="text-center" style={{ lineHeight: 1.28, marginBottom: 5 }}>
        <div
          style={{
            fontFamily: '"Times New Roman", Times, serif',
            fontStyle: "italic",
            fontSize: scale.fontSize + 1,
          }}
        >
          Republic of the Philippines
        </div>
        <div
          style={{
            fontFamily: '"Times New Roman", Times, serif',
            fontWeight: 700,
            fontSize: scale.fontSize + 4,
            marginTop: 1,
          }}
        >
          Department of Education
        </div>
        <div className="font-semibold" style={{ fontSize: scale.fontSize }}>
          MIMAROPA Region
        </div>
        <div className="font-semibold" style={{ fontSize: scale.fontSize }}>
          Schools Division of Puerto Princesa City
        </div>
        <div
          className="font-extrabold uppercase tracking-wide"
          style={{ fontSize: scale.fontSize + 3, marginTop: 2 }}
        >
          Santa Monica National High School
        </div>
      </div>

      <div
        style={{
          borderTop: "2.5px solid #111",
          borderBottom: "1px solid #111",
          height: 5,
          margin: "5px 0 7px",
        }}
      />

      <div
        className="text-center font-extrabold uppercase tracking-wide"
        style={{ fontSize: scale.fontSize + 5, marginBottom: 3 }}
      >
        {sectionLabel}
      </div>

      <div
        className="text-center font-bold"
        style={{ fontSize: scale.fontSize + 1, marginBottom: 6 }}
      >
        <span className="font-extrabold">Class Adviser:</span> {adviser}
      </div>

      <div className="grid grid-cols-2 gap-2 flex-1 min-h-0">
        <GenderTable label="MALE" students={males} minRows={scale.minRows} scale={scale} />
        <GenderTable label="FEMALE" students={females} minRows={scale.minRows} scale={scale} />
      </div>

      <div className="mt-auto shrink-0" style={{ paddingTop: 4 }}>
        <img
          src={rosterFooter}
          alt="School contact information"
          className="roster-footer mx-auto block w-full object-contain object-center"
          style={{ maxHeight: 46 }}
        />
      </div>
    </div>
  );
}
