import { Button } from "@/components/ui/button";
import { SchoolHeader } from "@/components/SchoolHeader";
import { Footer } from "@/components/Footer";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, RotateCcw, GraduationCap, Calendar, Hash, Camera, AlertTriangle } from "lucide-react";
import { bmiCategory } from "@/lib/utils";

type Props = {
  control: string;
  learnerName: string;
  track: string;
  strand: string;
  previousSection: string;
  studentType: string;
  bmi?: number | null;
  onAgain: () => void;
};

export function RegistrationTicket({
  control, learnerName, track, strand, previousSection, studentType, bmi, onAgain,
}: Props) {
  const date = new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <SchoolHeader subtitle="Registration Successful" />
      <main className="flex-1 mx-auto max-w-2xl w-full px-3 sm:px-4 py-6 sm:py-10">
        <div className="text-center mb-6">
          <CheckCircle2 className="mx-auto h-14 w-14 text-green-600" />
          <h2 className="mt-3 text-2xl font-bold">Enrollment Submitted!</h2>
          <p className="text-sm text-muted-foreground">
            Save or screenshot this ticket and present it at the Registrar's Office for verification.
          </p>
        </div>

        {/* HIGHLIGHTED SCREENSHOT INSTRUCTION */}
        <Alert className="mb-5 border-amber-400 bg-amber-50 text-amber-900">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <AlertTitle className="font-bold text-amber-800">Important: Screenshot Your Ticket!</AlertTitle>
          <AlertDescription className="text-amber-800">
            <div className="mt-1 space-y-1">
              <p className="flex items-start gap-2">
                <Camera className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" />
                <span>Please <strong>take a screenshot</strong> of your ticket below and save it to your device.</span>
              </p>
              <p className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" />
                <span>Present the screenshot to the <strong>Enrollment Officer</strong> at the Registrar's Office for verification.</span>
              </p>
            </div>
          </AlertDescription>
        </Alert>

        {/* TICKET */}
        <div
          className="relative mx-auto rounded-2xl overflow-hidden shadow-2xl bg-white"
          style={{ maxWidth: 560 }}
        >
          {/* Top band */}
          <div className="relative px-6 py-5 text-white" style={{ background: "linear-gradient(135deg, hsl(217 91% 35%), hsl(217 91% 55%))" }}>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-white/15 flex items-center justify-center backdrop-blur">
                <GraduationCap className="h-7 w-7" />
              </div>
              <div className="leading-tight">
                <div className="text-[11px] uppercase tracking-widest opacity-90">Santa Monica National High School</div>
                <div className="text-base font-bold">SHS Registration Ticket</div>
                <div className="text-[11px] opacity-90">SY 2026 · Incoming Grade 12</div>
              </div>
            </div>
          </div>

          {/* Perforation */}
          <div className="relative h-3 bg-white">
            <div className="absolute inset-0 flex items-center justify-between px-1">
              {Array.from({ length: 30 }).map((_, i) => (
                <span key={i} className="h-1 w-1 rounded-full bg-muted-foreground/30" />
              ))}
            </div>
            <span className="absolute -left-2 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-muted/30" />
            <span className="absolute -right-2 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-muted/30" />
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-4">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                <Hash className="h-3 w-3" /> Control Number
              </div>
              <div className="mt-1 font-mono text-3xl font-extrabold tracking-wider text-primary">
                SMNHS-{String(control).padStart(5, "0")}
              </div>
            </div>

            <div className="h-px bg-border" />

            <div className="grid grid-cols-2 gap-3 text-sm">
              <Cell label="Learner" value={learnerName || "—"} wide />
              <Cell label="Student Type" value={studentType} />
              <Cell label="Track" value={track} />
              <Cell label="Strand" value={strand} />
              <Cell label="Prev. Section" value={previousSection || "—"} />
              {bmi != null && (
                <Cell label="BMI" value={`${bmi.toFixed(1)} (${bmiCategory(bmi)})`} />
              )}
              <Cell label="Status" value="REGISTERED" highlight />
            </div>

            <div className="h-px bg-border" />

            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {date}</span>
              <span className="font-mono">Verify with control no.</span>
            </div>
          </div>

          {/* Footer ribbon */}
          <div className="px-6 py-2 text-center text-[10px] tracking-widest uppercase text-white" style={{ background: "hsl(217 91% 25%)" }}>
            Official Registration Ticket · Keep for Records
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
          <Button variant="outline" size="lg" onClick={onAgain}>
            <RotateCcw className="h-4 w-4 mr-1" /> Submit Another Enrollment
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Cell({ label, value, wide, highlight }: { label: string; value: string; wide?: boolean; highlight?: boolean }) {
  return (
    <div className={wide ? "col-span-2" : ""}>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`font-semibold break-words ${highlight ? "text-green-700" : ""}`}>{value}</div>
    </div>
  );
}
