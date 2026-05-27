import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { SchoolHeader } from "@/components/SchoolHeader";
import { Footer } from "@/components/Footer";
import { CheckCircle2, Download, RotateCcw, GraduationCap, Calendar, Hash } from "lucide-react";
import { toast } from "sonner";

type Props = {
  control: string;
  learnerName: string;
  track: string;
  strand: string;
  previousSection: string;
  studentType: string;
  onAgain: () => void;
};

export function RegistrationTicket({
  control, learnerName, track, strand, previousSection, studentType, onAgain,
}: Props) {
  const ticketRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const date = new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });

  async function download() {
    if (!ticketRef.current) return;
    setDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(ticketRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
      });
      const fileName = `SMNHS-Ticket-${control}.png`;
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

      if (isMobile && "toBlob" in canvas) {
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
        if (!blob) throw new Error("Unable to generate ticket image.");
        const file = new File([blob], fileName, { type: "image/png" });

        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: "SMNHS Registration Ticket" });
          toast.success("Ticket image ready to save/share.");
          return;
        }

        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = fileName;
        link.href = objectUrl;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
        toast.success("Ticket downloaded!");
        return;
      }

      const link = document.createElement("a");
      link.download = fileName;
      link.href = canvas.toDataURL("image/png");
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Ticket downloaded!");
    } catch (err: any) {
      toast.error("Failed to download. Try screenshot instead.");
    } finally {
      setDownloading(false);
    }
  }

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

        {/* TICKET */}
        <div
          ref={ticketRef}
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
          <Button onClick={download} disabled={downloading} size="lg">
            <Download className="h-4 w-4 mr-1" />
            {downloading ? "Preparing…" : "Download as Image"}
          </Button>
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
