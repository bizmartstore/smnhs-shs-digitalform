import { createFileRoute } from "@tanstack/react-router";
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
import { RegistrationTicket } from "@/components/RegistrationTicket";
import { supabase } from "@/lib/supabase";
import { DEFAULT_PREVIOUS_SECTIONS } from "@/lib/sections";
import { Info } from "lucide-react";

export const Route = createFileRoute("/")({ component: EnrollmentPage });
const OLD_STUDENT_PREVIOUS_SCHOOL = "SANTA MONICA NATIONAL HIGH SCHOOL";
const OLD_STUDENT_PREVIOUS_SCHOOL_ADDRESS = "BRGY. STA. MONICA, PPC";

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
  previous_school: OLD_STUDENT_PREVIOUS_SCHOOL, previous_school_address: OLD_STUDENT_PREVIOUS_SCHOOL_ADDRESS,
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
  const [invalid, setInvalid] = useState<Set<string>>(new Set());
  const learnerSig = useRef<SignaturePadHandle>(null);
  const guardianSig = useRef<SignaturePadHandle>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from("previous_sections")
          .select("name")
          .order("name");
        const extra = (data ?? []).map((r: any) => r.name as string);
        setSections(Array.from(new Set([...DEFAULT_PREVIOUS_SECTIONS, ...extra])));
      } catch { /* ignore - use defaults */ }
    })();
  }, []);

  const clearInvalid = (...keys: string[]) => {
    setInvalid((prev) => {
      if (!keys.some((k) => prev.has(k))) return prev;
      const next = new Set(prev);
      keys.forEach((k) => next.delete(k));
      return next;
    });
  };

  const set = (k: string, v: any) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (v !== "" && v !== false && v != null) clearInvalid(k);
  };

  const handleText = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const v = UPPER_FIELDS.has(k) ? e.target.value.toUpperCase() : e.target.value;
    set(k, v);
  };

  const cls = (k: string, base = "") =>
    `${base} ${invalid.has(k) ? "field-invalid" : ""}`.trim();

  const strandOptions = useMemo(() => {
    if (form.track === "Academic Track") return ["ABM", "HUMSS", "STEM"];
    return ["AFA", "IA", "ICT", "HE"];
  }, [form.track]);

  const isOldStudent = form.student_type === "Old Student";

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    const bad = new Set<string>();
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
      ["guardian_name", "Legal Guardian's Name"], ["guardian_relationship", "Guardian Relationship"],
      ["guardian_contact", "Guardian Contact"],
      ["previous_school", "Previous School"], ["previous_school_address", "Previous School Address"],
      ["learner_name", "Learner Name"],
      ["guardian_signatory_name", "Parent/Guardian Name"],
    ];
    if (isOldStudent) required.push(["previous_section", "Previous Section"]);

    for (const [k] of required) {
      if (!String(form[k] ?? "").trim()) bad.add(k);
    }
    if (!form.sex) bad.add("sex");
    if (form.status === "Irregular" && !String(form.irregular_reason).trim()) bad.add("irregular_reason");

    // Documents: at least one checkbox required
    const anyDoc = form.doc_sf9 || form.doc_psa || form.doc_other || form.doc_cor || form.doc_a5;
    if (!anyDoc) bad.add("documents");
    if (form.doc_other && !String(form.other_documents).trim()) bad.add("other_documents");

    if (!form.certified) bad.add("certified");
    if (learnerSig.current?.isEmpty()) bad.add("learner_signature");
    if (guardianSig.current?.isEmpty()) bad.add("guardian_signature");

    if (bad.size > 0) {
      setInvalid(bad);
      toast.error(`Please complete ${bad.size} required field${bad.size > 1 ? "s" : ""} (highlighted in red).`);
      // scroll to first invalid
      setTimeout(() => {
        const el = document.querySelector(".field-invalid");
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        ...form,
        age: form.age ? Number(form.age) : null,
        height_m: form.height_m ? Number(form.height_m) : null,
        weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
        previous_section: isOldStudent ? form.previous_section : null,
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
      <RegistrationTicket
        control={done}
        learnerName={`${form.first_name} ${form.middle_name ? form.middle_name + " " : ""}${form.last_name}`.trim()}
        track={form.track}
        strand={form.strand}
        previousSection={isOldStudent ? form.previous_section : "—"}
        studentType={form.student_type}
        onAgain={() => { setForm(INITIAL); setDone(null); setInvalid(new Set()); }}
      />
    );
  }

  const docInvalid = invalid.has("documents");

  return (
    <div className="min-h-screen flex flex-col">
      <Toaster richColors position="top-center" />
      <SchoolHeader subtitle="Incoming Grade 12 · SHS Enrollment Form" />
      <main className="flex-1 mx-auto max-w-5xl w-full px-3 sm:px-4 py-6">
        <form onSubmit={submit} noValidate className="space-y-6">

          <Section title="I. Learner Information">
            <div className="rounded-lg border-l-4 border-primary bg-primary/5 p-4 space-y-2">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <p className="text-sm font-medium text-foreground">How to fill out this form:</p>
              </div>
              <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                <li>Enter all information accurately and completely.</li>
                <li>Fields marked with <span className="text-destructive font-semibold">*</span> are required and must not be left blank.</li>
                <li>Type all text in <strong>CAPITAL LETTERS</strong>.</li>
                <li>If you do not know what to enter, ask your <strong>assigned teacher</strong> for assistance.</li>
                <li>Review everything before submitting.</li>
              </ul>
            </div>
            <Grid>
              <Field label="Last Name *"><Input className={cls("last_name", "uppercase-input")} value={form.last_name} onChange={handleText("last_name")} /></Field>
              <Field label="First Name *"><Input className={cls("first_name", "uppercase-input")} value={form.first_name} onChange={handleText("first_name")} /></Field>
              <Field label="Middle Name"><Input className="uppercase-input" value={form.middle_name} onChange={handleText("middle_name")} /></Field>
              <Field label="Extension (Jr., III)"><Input className="uppercase-input" value={form.extension_name} onChange={handleText("extension_name")} /></Field>
              <Field label="LRN (12 digits)"><Input inputMode="numeric" maxLength={12} value={form.lrn} onChange={(e) => set("lrn", e.target.value.replace(/\D/g, "").slice(0, 12))} /></Field>
              <Field label="Sex *">
                <RadioGroup value={form.sex} onValueChange={(v) => set("sex", v)} className={`flex gap-4 pt-2 rounded-md px-2 ${invalid.has("sex") ? "field-invalid" : ""}`}>
                  <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="Male" /> Male</label>
                  <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="Female" /> Female</label>
                </RadioGroup>
              </Field>
              <Field label="Age *"><Input className={cls("age")} type="number" min={1} max={99} value={form.age} onChange={(e) => set("age", e.target.value)} /></Field>
              <Field label="Nationality *"><Input className={cls("nationality", "uppercase-input")} value={form.nationality} onChange={handleText("nationality")} /></Field>
              <Field label="Mother Tongue"><Input className="uppercase-input" value={form.mother_tongue} onChange={handleText("mother_tongue")} /></Field>
              <Field label="Date of Birth *"><Input className={cls("date_of_birth")} type="date" value={form.date_of_birth} onChange={(e) => set("date_of_birth", e.target.value)} /></Field>
              <Field label="Place of Birth *"><Input className={cls("place_of_birth", "uppercase-input")} value={form.place_of_birth} onChange={handleText("place_of_birth")} /></Field>
              <Field label="Religion *"><Input className={cls("religion", "uppercase-input")} value={form.religion} onChange={handleText("religion")} /></Field>
              <Field label="Ethnicity"><Input className="uppercase-input" value={form.ethnicity} onChange={handleText("ethnicity")} /></Field>
              <Field label="Contact Number *"><Input className={cls("contact_number")} inputMode="tel" value={form.contact_number} onChange={(e) => set("contact_number", e.target.value)} /></Field>
              <Field label="4Ps Beneficiary">
                <Select value={form.fourps} onValueChange={(v) => set("fourps", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
                </Select>
              </Field>
              <Field label="Facebook Account Name"><Input className="uppercase-input" value={form.facebook_name} onChange={handleText("facebook_name")} /></Field>
            </Grid>
            <Field label="Complete Home Address *" full>
              <Textarea className={cls("home_address", "uppercase-input")} rows={2} value={form.home_address} onChange={handleText("home_address")} />
            </Field>
          </Section>

          <Section title="II. Parent / Guardian Information" hint="Type N/A if not applicable.">
            <Grid>
              <Field label="Father's Name *"><Input className={cls("father_name", "uppercase-input")} value={form.father_name} onChange={handleText("father_name")} /></Field>
              <Field label="Father's Occupation *"><Input className={cls("father_occupation", "uppercase-input")} value={form.father_occupation} onChange={handleText("father_occupation")} /></Field>
              <Field label="Father's Contact Number *"><Input className={cls("father_contact")} value={form.father_contact} onChange={(e) => set("father_contact", e.target.value)} /></Field>
              <Field label="Mother's Name *"><Input className={cls("mother_name", "uppercase-input")} value={form.mother_name} onChange={handleText("mother_name")} /></Field>
              <Field label="Mother's Occupation *"><Input className={cls("mother_occupation", "uppercase-input")} value={form.mother_occupation} onChange={handleText("mother_occupation")} /></Field>
              <Field label="Mother's Contact Number *"><Input className={cls("mother_contact")} value={form.mother_contact} onChange={(e) => set("mother_contact", e.target.value)} /></Field>
              <Field label="Legal Guardian's Name *"><Input className={cls("guardian_name", "uppercase-input")} value={form.guardian_name} onChange={handleText("guardian_name")} /></Field>
              <Field label="Relationship to Learner *"><Input className={cls("guardian_relationship", "uppercase-input")} value={form.guardian_relationship} onChange={handleText("guardian_relationship")} /></Field>
              <Field label="Guardian's Contact Number *"><Input className={cls("guardian_contact")} value={form.guardian_contact} onChange={(e) => set("guardian_contact", e.target.value)} /></Field>
            </Grid>
          </Section>

          <Section title="III. Academic Information">
            <Field label="Student Type">
              <RadioGroup
                value={form.student_type}
                onValueChange={(v) => {
                  set("student_type", v);
                    if (v === "Old Student") {
                      set("previous_school", OLD_STUDENT_PREVIOUS_SCHOOL);
                      set("previous_school_address", OLD_STUDENT_PREVIOUS_SCHOOL_ADDRESS);
                    }
                  if (v !== "Old Student") clearInvalid("previous_section");
                }}
                className="flex flex-wrap gap-4 pt-2"
              >
                {["Old Student", "Transferred In", "Balik Aral"].map((o) => (
                  <label key={o} className="flex items-center gap-2 text-sm"><RadioGroupItem value={o} /> {o}</label>
                ))}
              </RadioGroup>
            </Field>
            <Grid>
              <Field label="Name of Previous School *"><Input className={cls("previous_school", "uppercase-input")} value={form.previous_school} onChange={handleText("previous_school")} /></Field>
              <Field label="Address *"><Input className={cls("previous_school_address", "uppercase-input")} value={form.previous_school_address} onChange={handleText("previous_school_address")} /></Field>
              {isOldStudent && (
                <Field label="Previous Section (Grade 11) *">
                  <Select value={form.previous_section} onValueChange={(v) => set("previous_section", v)}>
                    <SelectTrigger className={cls("previous_section")}><SelectValue placeholder="Select previous section" /></SelectTrigger>
                    <SelectContent className="max-h-72">
                      {sections.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
              )}
              <Field label="Status">
                <RadioGroup value={form.status} onValueChange={(v) => set("status", v)} className="flex gap-4 pt-2">
                  <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="Regular" /> Regular</label>
                  <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="Irregular" /> Irregular</label>
                </RadioGroup>
              </Field>
              {form.status === "Irregular" && (
                <Field label="Reason *"><Input className={cls("irregular_reason", "uppercase-input")} value={form.irregular_reason} onChange={handleText("irregular_reason")} /></Field>
              )}
              <Field label="Preferred Program">
                <Select value={form.preferred_program} onValueChange={(v) => set("preferred_program", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Regular Class Program">Regular Class Program</SelectItem>
                    <SelectItem value="FLP : Open High School System" disabled>FLP : Open High School System</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Preferred Track">
                <Select value={form.track} onValueChange={(v) => { set("track", v); set("strand", v === "Academic Track" ? "STEM" : "AFA"); }}>
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

          <Section title="IV. Required Documents Submitted" hint="Please check at least one document.">
            <div className={`grid sm:grid-cols-2 gap-3 rounded-md p-2 ${docInvalid ? "field-invalid" : ""}`}>
              <CheckRow checked={form.doc_sf9} onChange={(v) => { set("doc_sf9", v); if (v) clearInvalid("documents"); }} label="SF9 / Report Card (Original)" />
              <CheckRow checked={form.doc_psa} onChange={(v) => { set("doc_psa", v); if (v) clearInvalid("documents"); }} label="PSA Birth Certificate (Photocopy)" />
              <CheckRow checked={form.doc_other} onChange={(v) => { set("doc_other", v); if (v) clearInvalid("documents"); }} label="Other Documents" />
              <CheckRow checked={form.doc_cor} onChange={(v) => { set("doc_cor", v); if (v) clearInvalid("documents"); }} label="Certificate of Rating (ALS/PEPT)" />
              <CheckRow checked={form.doc_a5} onChange={(v) => { set("doc_a5", v); if (v) clearInvalid("documents"); }} label="A5 / Learner's Permanent Record (ALS/PEPT)" />
            </div>
            {form.doc_other && (
              <Field label="Specify Other Documents *" full>
                <Input className={cls("other_documents", "uppercase-input")} value={form.other_documents} onChange={handleText("other_documents")} />
              </Field>
            )}
          </Section>

          <Section title="V. Certification">
            <p className="text-sm leading-relaxed text-muted-foreground">
              I hereby certify that all information provided in this enrollment form is true, complete,
              and correct to the best of my knowledge. Furthermore, I understand and agree to abide by
              the school's policies, rules, and regulations, including those discussed during the
              orientation. I also acknowledge that failure to comply with these policies may subject me
              to appropriate disciplinary actions in accordance with school guidelines.
            </p>
            <label className={`flex items-start gap-3 rounded-md border bg-accent/30 p-3 cursor-pointer ${invalid.has("certified") ? "field-invalid" : ""}`}>
              <Checkbox checked={form.certified} onCheckedChange={(v) => set("certified", !!v)} className="mt-0.5" />
              <span className="text-sm font-medium">
                I confirm that this serves as my electronic signature.
              </span>
            </label>

            <div className="grid md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <Field label="Name of Learner *">
                  <Input className={cls("learner_name", "uppercase-input")} value={form.learner_name} onChange={handleText("learner_name")} />
                </Field>
                <SignaturePadField
                  ref={learnerSig}
                  label="Signature of Learner *"
                  invalid={invalid.has("learner_signature")}
                  onChangeStroke={() => clearInvalid("learner_signature")}
                />
              </div>
              <div className="space-y-2">
                <Field label="Name of Parent / Guardian *">
                  <Input className={cls("guardian_signatory_name", "uppercase-input")} value={form.guardian_signatory_name} onChange={handleText("guardian_signatory_name")} />
                </Field>
                <SignaturePadField
                  ref={guardianSig}
                  label="Signature of Parent / Guardian *"
                  invalid={invalid.has("guardian_signature")}
                  onChangeStroke={() => clearInvalid("guardian_signature")}
                />
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

function Field({ label, children, full, hint }: { label: string; children: React.ReactNode; full?: boolean; hint?: string }) {
  return (
    <div className={`space-y-1.5 ${full ? "sm:col-span-2 lg:col-span-3" : ""}`}>
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground italic">{hint}</p>}
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
