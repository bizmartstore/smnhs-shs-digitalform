import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast, Toaster } from "sonner";
import { SchoolHeader } from "@/components/SchoolHeader";
import { Footer } from "@/components/Footer";
import { SignaturePadField, type SignaturePadHandle } from "@/components/SignaturePadField";
import { supabase } from "@/lib/supabase";
import { DEFAULT_PREVIOUS_SECTIONS } from "@/lib/sections";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/")({ component: EnrollmentPage });

const UPPER_FIELDS = new Set([
  "last_name", "first_name", "middle_name", "extension_name",
  "nationality", "mother_tongue", "religion", "ethnicity",
  "place_of_birth", "home_address", "facebook_name",
  "father_name", "father_occupation", "mother_name", "mother_occupation",
  "guardian_name", "guardian_relationship",
  "previous_school", "previous_school_address", "previous_section",
  "irregular_reason", "medical_conditions",
  "emergency_contact_person", "other_documents",
  "learner_name", "guardian_signatory_name",
]);

type FormState = Record<string, any>;

const INITIAL: FormState = {
  last_name: "", first_name: "", middle_name: "", extension_name: "",
  lrn: "", sex: "", age: "", nationality: "", mother_tongue: "",
  home_address: "", contact_number: "", date_of_birth: "", place_of_birth: "",
  religion: "", ethnicity: "", fourps: "No", facebook_name: "",
  father_name: "", father_occupation: "", father_contact: "",
  mother_name: "", mother_occupation: "", mother_contact: "",
  guardian_name: "", guardian_relationship: "", guardian_contact: "",
  student_type: "Old Student",
  previous_school: "", previous_school_address: "",
  previous_section: "", status: "Regular", irregular_reason: "",
  preferred_program: "Regular Class Program",
  track: "Academic Track", strand: "STEM",
  height_m: "", weight_kg: "", blood_type: "",
  medical_conditions: "", emergency_contact_person: "", emergency_contact_number: "",
  doc_sf9: false, doc_psa: false, doc_other: false, other_documents: "",
  doc_cor: false, doc_a5: false,
  learner_name: "", guardian_signatory_name: "",
  certified: false,
};

function EnrollmentPage() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [sections, setSections] = useState<string[]>(DEFAULT_PREVIOUS_SECTIONS);
  const learnerSig = useRef<SignaturePadHandle>(null);
  const guardianSig = useRef<SignaturePadHandle>(null);

  useEffect(() => {
    // Load sections list (custom + defaults)
    (async () => {
      try {
        const { data } = await supabase
          .from("previous_sections")
          .select("name")
          .order("name");
        const extra = (data ?? []).map((r: any) => r.name as string);
        const merged = Array.from(new Set([...DEFAULT_PREVIOUS_SECTIONS, ...extra]));
        setSections(merged);
      } catch { /* ignore - use defaults */ }
    })();
  }, []);

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const handleText = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const v = UPPER_FIELDS.has(k) ? e.target.value.toUpperCase() : e.target.value;
    set(k, v);
  };

  const strandOptions = useMemo(() => {
    if (form.track === "Academic Track") return ["ABM", "HUMSS", "STEM"];
    return ["AFA", "IA", "ICT", "HE"];
  }, [form.track]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    // Required validations
    const required: [string, string][] = [
      ["last_name", "Last Name"], ["first_name", "First Name"],
      ["age", "Age"], ["nationality", "Nationality"],
      ["date_of_birth", "Date of Birth"], ["place_of_birth", "Place of Birth"],
      ["religion", "Religion"], ["contact_number", "Contact Number"],
      ["home_address", "Complete Home Address"],
      ["father_name", "Father's Name"], ["father_occupation", "Father's Occupation"],
      ["father_contact", "Father's Contact"],
      ["mother_name", "Mother's Name"], ["mother_occupation", "Mother's Occupation"],
      ["mother_contact", "Mother's Contact"],
      ["guardian_name", "Guardian's Name"], ["guardian_relationship", "Guardian Relationship"],
      ["guardian_contact", "Guardian Contact"],
      ["previous_school", "Previous School"], ["previous_school_address", "Previous School Address"],
      ["previous_section", "Previous Section"],
      ["height_m", "Height"], ["weight_kg", "Weight"], ["blood_type", "Blood Type"],
      ["medical_conditions", "Medical Conditions"],
      ["emergency_contact_person", "Emergency Contact Person"],
      ["emergency_contact_number", "Emergency Contact Number"],
      ["learner_name", "Learner Name"],
      ["guardian_signatory_name", "Parent/Guardian Name"],
    ];
    for (const [k, label] of required) {
      if (!String(form[k] ?? "").trim()) {
        toast.error(`${label} is required (type N/A if not applicable).`);
        return;
      }
    }
    if (!form.sex) return toast.error("Please select Sex.");
    if (!form.certified) return toast.error("Please confirm the certification checkbox.");
    if (learnerSig.current?.isEmpty()) return toast.error("Learner signature is required.");
    if (guardianSig.current?.isEmpty()) return toast.error("Parent/Guardian signature is required.");

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        age: form.age ? Number(form.age) : null,
        height_m: form.height_m ? Number(form.height_m) : null,
        weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
        learner_signature_data: learnerSig.current?.toData() ?? [],
        guardian_signature_data: guardianSig.current?.toData() ?? [],
        certified_at: new Date().toISOString(),
      };
      const { data, error } = await supabase
        .from("enrollments")
        .insert(payload)
        .select("control_no, id")
        .single();
      if (error) throw error;
      const control = data?.control_no ?? data?.id ?? "(saved)";
      setDone(String(control));
      window.scrollTo({ top: 0, behavior: "smooth" });
      toast.success("Enrollment submitted!");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex flex-col">
        <SchoolHeader subtitle="Incoming Grade 12 · SY 2026" />
        <main className="flex-1 mx-auto max-w-2xl w-full px-4 py-16 text-center">
          <CheckCircle2 className="mx-auto h-16 w-16 text-green-600" />
          <h2 className="mt-4 text-2xl font-bold">Enrollment Submitted!</h2>
          <p className="mt-2 text-muted-foreground">
            Your reference / control number:
          </p>
          <p className="mt-1 text-xl font-mono font-bold text-primary">{done}</p>
          <p className="mt-4 text-sm text-muted-foreground">
            Please screenshot this page. Visit the Registrar's Office for verification.
          </p>
          <Button className="mt-6" onClick={() => { setForm(INITIAL); setDone(null); }}>
            Submit Another Enrollment
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Toaster richColors position="top-center" />
      <SchoolHeader subtitle="Incoming Grade 12 · SHS Enrollment Form" />
      <main className="flex-1 mx-auto max-w-5xl w-full px-3 sm:px-4 py-6">
        <form onSubmit={submit} className="space-y-6">

          <Section title="I. Learner Information">
            <Grid>
              <Field label="Last Name *"><Input className="uppercase-input" value={form.last_name} onChange={handleText("last_name")} required /></Field>
              <Field label="First Name *"><Input className="uppercase-input" value={form.first_name} onChange={handleText("first_name")} required /></Field>
              <Field label="Middle Name"><Input className="uppercase-input" value={form.middle_name} onChange={handleText("middle_name")} /></Field>
              <Field label="Extension (Jr., III)"><Input className="uppercase-input" value={form.extension_name} onChange={handleText("extension_name")} /></Field>
              <Field label="LRN (12 digits)"><Input inputMode="numeric" maxLength={12} value={form.lrn} onChange={(e) => set("lrn", e.target.value.replace(/\D/g, "").slice(0, 12))} /></Field>
              <Field label="Sex *">
                <RadioGroup value={form.sex} onValueChange={(v) => set("sex", v)} className="flex gap-4 pt-2">
                  <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="Male" /> Male</label>
                  <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="Female" /> Female</label>
                </RadioGroup>
              </Field>
              <Field label="Age *"><Input type="number" min={1} max={99} value={form.age} onChange={(e) => set("age", e.target.value)} required /></Field>
              <Field label="Nationality *"><Input className="uppercase-input" value={form.nationality} onChange={handleText("nationality")} required /></Field>
              <Field label="Mother Tongue"><Input className="uppercase-input" value={form.mother_tongue} onChange={handleText("mother_tongue")} /></Field>
              <Field label="Date of Birth *"><Input type="date" value={form.date_of_birth} onChange={(e) => set("date_of_birth", e.target.value)} required /></Field>
              <Field label="Place of Birth *"><Input className="uppercase-input" value={form.place_of_birth} onChange={handleText("place_of_birth")} required /></Field>
              <Field label="Religion *"><Input className="uppercase-input" value={form.religion} onChange={handleText("religion")} required /></Field>
              <Field label="Ethnicity"><Input className="uppercase-input" value={form.ethnicity} onChange={handleText("ethnicity")} /></Field>
              <Field label="Contact Number *"><Input inputMode="tel" value={form.contact_number} onChange={(e) => set("contact_number", e.target.value)} required /></Field>
              <Field label="4Ps Beneficiary">
                <Select value={form.fourps} onValueChange={(v) => set("fourps", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
                </Select>
              </Field>
              <Field label="Facebook Account Name"><Input className="uppercase-input" value={form.facebook_name} onChange={handleText("facebook_name")} /></Field>
            </Grid>
            <Field label="Complete Home Address *" full>
              <Textarea className="uppercase-input" rows={2} value={form.home_address} onChange={handleText("home_address")} required />
            </Field>
          </Section>

          <Section title="II. Parent / Guardian Information" hint="Type N/A if not applicable.">
            <Grid>
              <Field label="Father's Name *"><Input className="uppercase-input" value={form.father_name} onChange={handleText("father_name")} required /></Field>
              <Field label="Father's Occupation *"><Input className="uppercase-input" value={form.father_occupation} onChange={handleText("father_occupation")} required /></Field>
              <Field label="Father's Contact Number *"><Input value={form.father_contact} onChange={(e) => set("father_contact", e.target.value)} required /></Field>
              <Field label="Mother's Name *"><Input className="uppercase-input" value={form.mother_name} onChange={handleText("mother_name")} required /></Field>
              <Field label="Mother's Occupation *"><Input className="uppercase-input" value={form.mother_occupation} onChange={handleText("mother_occupation")} required /></Field>
              <Field label="Mother's Contact Number *"><Input value={form.mother_contact} onChange={(e) => set("mother_contact", e.target.value)} required /></Field>
              <Field label="Guardian's Name *"><Input className="uppercase-input" value={form.guardian_name} onChange={handleText("guardian_name")} required /></Field>
              <Field label="Relationship to Learner *"><Input className="uppercase-input" value={form.guardian_relationship} onChange={handleText("guardian_relationship")} required /></Field>
              <Field label="Guardian's Contact Number *"><Input value={form.guardian_contact} onChange={(e) => set("guardian_contact", e.target.value)} required /></Field>
            </Grid>
          </Section>

          <Section title="III. Academic Information">
            <Field label="Student Type">
              <RadioGroup value={form.student_type} onValueChange={(v) => set("student_type", v)} className="flex flex-wrap gap-4 pt-2">
                {["Old Student", "Transferred In", "Balik Aral"].map((o) => (
                  <label key={o} className="flex items-center gap-2 text-sm"><RadioGroupItem value={o} /> {o}</label>
                ))}
              </RadioGroup>
            </Field>
            <Grid>
              <Field label="Name of Previous School *"><Input className="uppercase-input" value={form.previous_school} onChange={handleText("previous_school")} required /></Field>
              <Field label="Address *"><Input className="uppercase-input" value={form.previous_school_address} onChange={handleText("previous_school_address")} required /></Field>
              <Field label="Previous Section (Grade 11) *">
                <Select value={form.previous_section} onValueChange={(v) => set("previous_section", v)}>
                  <SelectTrigger><SelectValue placeholder="Select previous section" /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    {sections.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Status">
                <RadioGroup value={form.status} onValueChange={(v) => set("status", v)} className="flex gap-4 pt-2">
                  <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="Regular" /> Regular</label>
                  <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="Irregular" /> Irregular</label>
                </RadioGroup>
              </Field>
              {form.status === "Irregular" && (
                <Field label="Reason"><Input className="uppercase-input" value={form.irregular_reason} onChange={handleText("irregular_reason")} /></Field>
              )}
              <Field label="Preferred Program">
                <Select value={form.preferred_program} onValueChange={(v) => set("preferred_program", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Regular Class Program">Regular Class Program</SelectItem>
                    <SelectItem value="FLP : Open High School System">FLP : Open High School System</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Preferred Track">
                <Select value={form.track} onValueChange={(v) => set("track", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Academic Track">Academic Track</SelectItem>
                    <SelectItem value="TVL Track">TVL Track</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Strand / Specialization">
                <Select value={form.strand} onValueChange={(v) => set("strand", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {strandOptions.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            </Grid>
          </Section>

          <Section title="IV. Health Information" hint="Type N/A if not applicable.">
            <Grid>
              <Field label="Height (m) *"><Input type="number" step="0.01" value={form.height_m} onChange={(e) => set("height_m", e.target.value)} required /></Field>
              <Field label="Weight (kg) *"><Input type="number" step="0.1" value={form.weight_kg} onChange={(e) => set("weight_kg", e.target.value)} required /></Field>
              <Field label="Blood Type *"><Input className="uppercase-input" value={form.blood_type} onChange={handleText("blood_type")} required /></Field>
              <Field label="Emergency Contact Person *"><Input className="uppercase-input" value={form.emergency_contact_person} onChange={handleText("emergency_contact_person")} required /></Field>
              <Field label="Emergency Contact Number *"><Input value={form.emergency_contact_number} onChange={(e) => set("emergency_contact_number", e.target.value)} required /></Field>
            </Grid>
            <Field label="Medical Conditions / Allergies *" full>
              <Textarea className="uppercase-input" rows={2} value={form.medical_conditions} onChange={handleText("medical_conditions")} required />
            </Field>
          </Section>

          <Section title="V. Required Documents Submitted">
            <div className="grid sm:grid-cols-2 gap-3">
              <CheckRow checked={form.doc_sf9} onChange={(v) => set("doc_sf9", v)} label="SF9 / Report Card (Original)" />
              <CheckRow checked={form.doc_psa} onChange={(v) => set("doc_psa", v)} label="PSA Birth Certificate (Photocopy)" />
              <CheckRow checked={form.doc_other} onChange={(v) => set("doc_other", v)} label="Other Documents" />
              <CheckRow checked={form.doc_cor} onChange={(v) => set("doc_cor", v)} label="Certificate of Rating (ALS/PEPT)" />
              <CheckRow checked={form.doc_a5} onChange={(v) => set("doc_a5", v)} label="A5 / Learner's Permanent Record (ALS/PEPT)" />
            </div>
            {form.doc_other && (
              <Field label="Specify Other Documents" full>
                <Input className="uppercase-input" value={form.other_documents} onChange={handleText("other_documents")} />
              </Field>
            )}
          </Section>

          <Section title="VI. Certification">
            <p className="text-sm leading-relaxed text-muted-foreground">
              I hereby certify that all information provided in this enrollment form is true, complete,
              and correct to the best of my knowledge. Furthermore, I understand and agree to abide by
              the school's policies, rules, and regulations, including those discussed during the
              orientation. I also acknowledge that failure to comply with these policies may subject me
              to appropriate disciplinary actions in accordance with school guidelines.
            </p>
            <label className="flex items-start gap-3 rounded-md border bg-accent/30 p-3">
              <Checkbox checked={form.certified} onCheckedChange={(v) => set("certified", !!v)} className="mt-0.5" />
              <span className="text-sm font-medium">
                I confirm that this serves as my electronic signature.
              </span>
            </label>

            <div className="grid md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <Field label="Name of Learner *">
                  <Input className="uppercase-input" value={form.learner_name} onChange={handleText("learner_name")} required />
                </Field>
                <SignaturePadField ref={learnerSig} label="Signature of Learner *" />
              </div>
              <div className="space-y-2">
                <Field label="Name of Parent / Guardian *">
                  <Input className="uppercase-input" value={form.guardian_signatory_name} onChange={handleText("guardian_signatory_name")} required />
                </Field>
                <SignaturePadField ref={guardianSig} label="Signature of Parent / Guardian *" />
              </div>
            </div>
          </Section>

          <div className="sticky bottom-3 z-10">
            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-12 text-base shadow-lg"
            >
              {submitting ? "Submitting..." : "Submit Enrollment"}
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            <Link to="/staff" className="hover:underline">Staff Portal</Link>
          </p>
        </form>
      </main>
      <Footer />
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base sm:text-lg text-primary">{title}</CardTitle>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{children}</div>;
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={`space-y-1.5 ${full ? "sm:col-span-2 lg:col-span-3" : ""}`}>
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function CheckRow({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-2 rounded-md border bg-card px-3 py-2 cursor-pointer hover:bg-accent/30">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(!!v)} />
      <span className="text-sm">{label}</span>
    </label>
  );
}
