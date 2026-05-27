import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast, Toaster } from "sonner";
import { SchoolHeader } from "@/components/SchoolHeader";
import { Footer } from "@/components/Footer";
import { supabase, STAFF_PASSCODE } from "@/lib/supabase";
import { DEFAULT_PREVIOUS_SECTIONS } from "@/lib/sections";
import { Lock, Users, BookOpen, BarChart3, Plus, Trash2, Eye, LogOut, Download } from "lucide-react";

export const Route = createFileRoute("/staff")({ component: StaffPage });

const AUTH_KEY = "smnhs_staff_auth";
const ADMIN_ACTION_PASSCODE = "330506";
const DB_VERIFIER_KEY = "smnhs_staff_db_verifier";

function StaffPage() {
  const [authed, setAuthed] = useState(false);
  const [passcode, setPasscode] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem(AUTH_KEY) === "1") {
      setAuthed(true);
    }
  }, []);

  function login(e: React.FormEvent) {
    e.preventDefault();
    if (passcode === STAFF_PASSCODE) {
      sessionStorage.setItem(AUTH_KEY, "1");
      setAuthed(true);
    } else {
      toast.error("Incorrect passcode.");
    }
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex flex-col">
        <Toaster richColors position="top-center" />
        <SchoolHeader subtitle="Staff Portal" />
        <main className="flex-1 flex items-center justify-center px-4">
          <Card className="w-full max-w-sm shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Staff Access</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={login} className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Passcode</Label>
                  <Input
                    type="password"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="Enter staff passcode"
                    autoFocus
                  />
                </div>
                <Button type="submit" className="w-full">Enter Dashboard</Button>
                <Link to="/" className="block text-center text-xs text-muted-foreground hover:underline">
                  ← Back to enrollment form
                </Link>
              </form>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return <Dashboard onLogout={() => { sessionStorage.removeItem(AUTH_KEY); setAuthed(false); }} />;
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [sections, setSections] = useState<string[]>(DEFAULT_PREVIOUS_SECTIONS);
  const [g12Sections, setG12Sections] = useState<{ id: string; name: string }[]>([]);
  const [verifiers, setVerifiers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("summary");
  const [manageUnlocked, setManageUnlocked] = useState(false);
  const [manageGateOpen, setManageGateOpen] = useState(false);
  const [managePasscode, setManagePasscode] = useState("");
  const [databaseUnlocked, setDatabaseUnlocked] = useState(false);
  const [databaseGateOpen, setDatabaseGateOpen] = useState(false);
  const [dbFullName, setDbFullName] = useState("");
  const [dbPassword, setDbPassword] = useState("");
  const [currentVerifier, setCurrentVerifier] = useState<{ id: string; name: string } | null>(null);

  async function refresh() {
    setLoading(true);
    const [{ data: enr }, { data: prev }, { data: g12 }, { data: vfr }] = await Promise.all([
      supabase.from("enrollments").select("*").order("created_at", { ascending: false }),
      supabase.from("previous_sections").select("name").order("name"),
      supabase.from("grade12_sections").select("id, name").order("name"),
      supabase.from("verifiers").select("id, name").order("name"),
    ]);
    setEnrollments(enr ?? []);
    const extra = (prev ?? []).map((r: any) => r.name);
    setSections(Array.from(new Set([...DEFAULT_PREVIOUS_SECTIONS, ...extra])));
    setG12Sections(g12 ?? []);
    setVerifiers(vfr ?? []);
    setLoading(false);
  }

  useEffect(() => { refresh(); }, []);
  useEffect(() => {
    const raw = localStorage.getItem(DB_VERIFIER_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.id && parsed?.name) {
        setCurrentVerifier({ id: parsed.id, name: parsed.name });
        setDatabaseUnlocked(true);
      }
    } catch {}
  }, []);

  function handleTabChange(next: string) {
    if (next === "database" && !databaseUnlocked) {
      setDatabaseGateOpen(true);
      return;
    }
    if (next === "manage" && !manageUnlocked) {
      setManageGateOpen(true);
      return;
    }
    setActiveTab(next);
  }

  function unlockManage() {
    if (managePasscode !== ADMIN_ACTION_PASSCODE) {
      toast.error("Incorrect passcode.");
      return;
    }
    setManageUnlocked(true);
    setActiveTab("manage");
    setManageGateOpen(false);
    setManagePasscode("");
  }

  async function unlockDatabase() {
    const name = dbFullName.trim().toUpperCase();
    const password = dbPassword.trim();
    if (!name || !password) {
      toast.error("Enter full name and password.");
      return;
    }

    const { data: existing, error: existingErr } = await supabase
      .from("verifiers")
      .select("id, name")
      .eq("name", name)
      .eq("password", password)
      .limit(1);

    if (existingErr) {
      toast.error(existingErr.message);
      return;
    }

    let verifier = existing?.[0];
    if (!verifier) {
      const { data: sameName, error: sameNameErr } = await supabase
        .from("verifiers")
        .select("id")
        .eq("name", name)
        .limit(1);
      if (sameNameErr) {
        toast.error(sameNameErr.message);
        return;
      }
      if (sameName && sameName.length > 0) {
        toast.error("Name already exists with a different password.");
        return;
      }

      const { data: created, error: createErr } = await supabase
        .from("verifiers")
        .insert({ name, password })
        .select("id, name")
        .limit(1);
      if (createErr) {
        toast.error(createErr.message);
        return;
      }
      verifier = created?.[0];
    }

    if (!verifier) {
      toast.error("Unable to open Database tab.");
      return;
    }

    setCurrentVerifier(verifier);
    setDatabaseUnlocked(true);
    setActiveTab("database");
    setDatabaseGateOpen(false);
    localStorage.setItem(DB_VERIFIER_KEY, JSON.stringify(verifier));
    setDbPassword("");
    toast.success(`Database unlocked as ${verifier.name}.`);
    refresh();
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Toaster richColors position="top-center" />
      <SchoolHeader subtitle="Staff Dashboard" />
      <main className="flex-1 mx-auto max-w-7xl w-full px-3 sm:px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Enrollment Dashboard</h2>
          <Button variant="outline" size="sm" onClick={onLogout}>
            <LogOut className="h-4 w-4 mr-1" /> Logout
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="summary"><BarChart3 className="h-4 w-4 mr-1" />Summary</TabsTrigger>
            <TabsTrigger value="database"><Users className="h-4 w-4 mr-1" />Database</TabsTrigger>
            <TabsTrigger value="sectioning"><BookOpen className="h-4 w-4 mr-1" />Sectioning</TabsTrigger>
            <TabsTrigger value="manage">Manage</TabsTrigger>
          </TabsList>

          <TabsContent value="summary">
            <SummaryTab enrollments={enrollments} loading={loading} />
          </TabsContent>
          <TabsContent value="database">
            <DatabaseTab enrollments={enrollments} loading={loading} onRefresh={refresh} currentVerifier={currentVerifier} />
          </TabsContent>
          <TabsContent value="sectioning">
            <SectioningTab
              enrollments={enrollments}
              g12Sections={g12Sections}
              onRefresh={refresh}
            />
          </TabsContent>
          <TabsContent value="manage">
            <ManageTab
              sections={sections}
              defaults={DEFAULT_PREVIOUS_SECTIONS}
              g12Sections={g12Sections}
              verifiers={verifiers}
              onRefresh={refresh}
            />
          </TabsContent>
        </Tabs>

        <Dialog open={manageGateOpen} onOpenChange={setManageGateOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Manage Tab Passcode</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input
                type="password"
                placeholder="Enter passcode"
                value={managePasscode}
                onChange={(e) => setManagePasscode(e.target.value)}
              />
              <Button className="w-full" onClick={unlockManage}>Unlock Manage</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={databaseGateOpen} onOpenChange={setDatabaseGateOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Database Access</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input
                placeholder="FULL NAME (ALL CAPS)"
                value={dbFullName}
                onChange={(e) => setDbFullName(e.target.value.toUpperCase())}
              />
              <Input
                type="password"
                placeholder="Password"
                value={dbPassword}
                onChange={(e) => setDbPassword(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                First time: this registers your verifier account. Next time on this device, Database opens directly.
              </p>
              <Button className="w-full" onClick={unlockDatabase}>Continue</Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
}

/* -------- SUMMARY -------- */
function SummaryTab({ enrollments, loading }: { enrollments: any[]; loading: boolean }) {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));

  function toDateKey(v: string | null | undefined) {
    if (!v) return "";
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  const stats = useMemo(() => {
    const total = enrollments.length;
    const male = enrollments.filter((e) => e.sex === "Male").length;
    const female = enrollments.filter((e) => e.sex === "Female").length;
    const byTrack: Record<string, number> = {};
    const byStrand: Record<string, number> = {};
    const byPrev: Record<string, number> = {};
    enrollments.forEach((e) => {
      byTrack[e.track ?? "—"] = (byTrack[e.track ?? "—"] ?? 0) + 1;
      byStrand[e.strand ?? "—"] = (byStrand[e.strand ?? "—"] ?? 0) + 1;
      byPrev[e.previous_section ?? "—"] = (byPrev[e.previous_section ?? "—"] ?? 0) + 1;
    });
    const inDay = enrollments.filter((e) => toDateKey(e.created_at) === selectedDate);
    const maleToday = inDay.filter((e) => e.sex === "Male").length;
    const femaleToday = inDay.filter((e) => e.sex === "Female").length;
    return { total, male, female, byTrack, byStrand, byPrev, maleToday, femaleToday, totalToday: inDay.length };
  }, [enrollments, selectedDate]);

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-5">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Filter registrants by date</Label>
              <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-52" />
            </div>
            <div className="text-xs text-muted-foreground pb-1">
              For selected date: <span className="font-medium">Total {stats.totalToday}</span>, Male {stats.maleToday}, Female {stats.femaleToday}
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Enrollees" value={stats.total} />
        <StatCard label="Male" value={stats.male} />
        <StatCard label="Female" value={stats.female} />
        <StatCard label="Sections (Prev.)" value={Object.keys(stats.byPrev).length} />
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        <StatCard label="Selected Day Total" value={stats.totalToday} />
        <StatCard label="Selected Day Male" value={stats.maleToday} />
        <StatCard label="Selected Day Female" value={stats.femaleToday} />
      </div>
      <div className="grid md:grid-cols-3 gap-3">
        <BreakdownCard title="By Track" data={stats.byTrack} />
        <BreakdownCard title="By Strand" data={stats.byStrand} />
        <BreakdownCard title="By Previous Section" data={stats.byPrev} />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="mt-1 text-3xl font-bold text-primary">{value}</div>
      </CardContent>
    </Card>
  );
}

function BreakdownCard({ title, data }: { title: string; data: Record<string, number> }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...entries.map(([, v]) => v));
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">{title}</CardTitle></CardHeader>
      <CardContent className="space-y-1.5">
        {entries.length === 0 && <p className="text-xs text-muted-foreground">No data</p>}
        {entries.map(([k, v]) => (
          <div key={k} className="text-xs">
            <div className="flex justify-between"><span>{k}</span><span className="font-mono">{v}</span></div>
            <div className="h-1.5 rounded bg-muted overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${(v / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/* -------- DATABASE -------- */
function DatabaseTab({ enrollments, loading, onRefresh, currentVerifier }: any) {
  const [q, setQ] = useState("");
  const [view, setView] = useState<any | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<any | null>(null);
  const [deletePasscode, setDeletePasscode] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return enrollments;
    return enrollments.filter((e: any) =>
      [e.last_name, e.first_name, e.lrn, e.previous_section, e.strand, e.control_no, `smnhs-${String(e.control_no ?? "").padStart(5, "0")}`]
        .some((v) => String(v ?? "").toLowerCase().includes(s)),
    );
  }, [enrollments, q]);

  function exportCsv() {
    if (!filtered.length) return;
    const cols = Object.keys(filtered[0]).filter((k) => !k.includes("signature_data"));
    const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [cols.join(","), ...filtered.map((r: any) => cols.map((c) => esc(r[c])).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `enrollments_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  async function verifyStudent(student: any) {
    if (!student) return;
    if (!currentVerifier) {
      toast.error("No verifier account is active.");
      return;
    }
    const { error } = await supabase
      .from("enrollments")
      .update({
        is_verified: true,
        verified_by_id: currentVerifier.id,
        verified_by_name: currentVerifier.name,
        verified_at: new Date().toISOString(),
      })
      .eq("id", student.id);
    if (error) {
      if (error.message.includes("is_verified") && error.message.includes("schema cache")) {
        toast.error("Database not updated yet. Run the updated SUPABASE_SCHEMA.sql in Supabase SQL Editor, then try again.");
        return;
      }
      toast.error(error.message);
      return;
    }
    toast.success("Student verified.");
    onRefresh();
  }

  async function deleteStudent() {
    if (!pendingDelete) return;
    if (deletePasscode !== ADMIN_ACTION_PASSCODE) {
      toast.error("Incorrect passcode.");
      return;
    }
    const { data, error } = await supabase
      .from("enrollments")
      .delete()
      .eq("id", pendingDelete.id)
      .select("id");
    if (error) {
      toast.error(error.message);
      return;
    }
    if (!data || data.length === 0) {
      toast.error("Delete blocked by database policy. Please run updated SUPABASE_SCHEMA.sql in Supabase SQL Editor.");
      return;
    }
    toast.success("Student deleted.");
    setDeleteOpen(false);
    setPendingDelete(null);
    setDeletePasscode("");
    onRefresh();
  }

  const documentSummary = (e: any) => {
    const docs: string[] = [];
    if (e.doc_sf9) docs.push("SF9");
    if (e.doc_psa) docs.push("PSA");
    if (e.doc_cor) docs.push("COR");
    if (e.doc_a5) docs.push("A5");
    if (e.doc_other) docs.push(e.other_documents ? `OTHER: ${e.other_documents}` : "OTHER");
    return docs.length ? docs.join(", ") : "None";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          <CardTitle className="text-base">Enrollment Database ({filtered.length})</CardTitle>
          <div className="flex gap-2">
            <Input placeholder="Search name, LRN, control no…" value={q} onChange={(e) => setQ(e.target.value)} className="w-full sm:w-64" />
            <Button variant="outline" size="sm" onClick={exportCsv}><Download className="h-4 w-4 mr-1" />CSV</Button>
            <Button variant="outline" size="sm" onClick={onRefresh}>Refresh</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Control #</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>LRN</TableHead>
                  <TableHead>Prev. Section</TableHead>
                  <TableHead>Strand</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Documents</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((e: any) => (
                  <TableRow key={e.id} className={e.is_verified ? "bg-yellow-100/70 hover:bg-yellow-100 dark:bg-yellow-500/20 dark:hover:bg-yellow-500/30" : ""}>
                    <TableCell className="font-mono text-xs font-semibold text-primary">
                      {e.control_no ? `SMNHS-${String(e.control_no).padStart(5, "0")}` : "—"}
                    </TableCell>
                    <TableCell className="font-medium">{e.last_name}, {e.first_name}</TableCell>
                    <TableCell className="font-mono text-xs">{e.lrn || "—"}</TableCell>
                    <TableCell>{e.previous_section}</TableCell>
                    <TableCell>{e.strand}</TableCell>
                    <TableCell>{e.contact_number}</TableCell>
                    <TableCell className="text-xs">{documentSummary(e)}</TableCell>
                    <TableCell>
                      {e.is_verified ? (
                        <div className="space-y-1">
                          <Badge>Verified</Badge>
                          <div className="text-[11px] text-muted-foreground">By: {e.verified_by_name || "—"}</div>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => {
                            verifyStudent(e);
                          }}
                        >
                          Verify
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>{e.assigned_section ? <Badge>{e.assigned_section}</Badge> : <span className="text-xs text-muted-foreground">—</span>}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setView(e)}><Eye className="h-4 w-4" /></Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setPendingDelete(e);
                            setDeleteOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-8">No enrollments yet.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={!!view} onOpenChange={(o) => !o && setView(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Enrollment Details</DialogTitle></DialogHeader>
          {view && <EnrollmentDetail data={view} />}
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Student</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {pendingDelete ? `Delete ${pendingDelete.last_name}, ${pendingDelete.first_name}? Enter passcode to continue.` : "Enter passcode."}
            </p>
            <Input
              type="password"
              placeholder="Enter passcode"
              value={deletePasscode}
              onChange={(e) => setDeletePasscode(e.target.value)}
            />
            <Button variant="destructive" onClick={deleteStudent} className="w-full">Confirm Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function EnrollmentDetail({ data }: { data: any }) {
  const skip = new Set(["signature_data", "learner_signature_data", "guardian_signature_data"]);
  const displayValue = (key: string, value: any) => {
    if (["doc_sf9", "doc_psa", "doc_other", "doc_cor", "doc_a5", "certified", "is_verified"].includes(key)) {
      return value ? "YES" : "NO";
    }
    return String(value ?? "—");
  };
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 text-sm">
        {Object.entries(data).filter(([k]) => !skip.has(k)).map(([k, v]) => (
          <div key={k} className="border rounded p-2">
            <div className="text-[10px] uppercase text-muted-foreground">{k}</div>
            <div className="font-medium break-words">{displayValue(k, v)}</div>
          </div>
        ))}
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <SigPreview title="Learner Signature" data={data.learner_signature_data} />
        <SigPreview title="Guardian Signature" data={data.guardian_signature_data} />
      </div>
    </div>
  );
}

function SigPreview({ title, data }: { title: string; data: any }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ref.current || !data) return;
    import("signature_pad").then(({ default: SignaturePad }) => {
      const pad = new SignaturePad(ref.current!, { backgroundColor: "#fff", penColor: "#000" });
      try { pad.fromData(data); } catch {}
    });
  }, [data]);
  return (
    <div>
      <div className="text-xs font-medium mb-1">{title}</div>
      <canvas ref={ref} width={400} height={140} className="border rounded bg-white w-full" />
    </div>
  );
}

/* -------- SECTIONING -------- */
function SectioningTab({ enrollments, g12Sections, onRefresh }: any) {
  const [filter, setFilter] = useState<string>("ALL");
  const verified = enrollments.filter((e: any) => !!e.is_verified);

  const filtered = verified.filter((e: any) =>
    filter === "ALL" ? true : (e.previous_section ?? "") === filter,
  );

  const prevOptions = Array.from(new Set(verified.map((e: any) => e.previous_section).filter(Boolean))) as string[];

  async function assign(id: string, section: string | null) {
    const { error } = await supabase.from("enrollments").update({ assigned_section: section }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Assigned."); onRefresh(); }
  }

  async function bulkAssign(section: string) {
    if (!section) return;
    const ids = filtered.filter((e: any) => !e.assigned_section).map((e: any) => e.id);
    if (!ids.length) return toast.info("No unassigned students in this view.");
    const { error } = await supabase.from("enrollments").update({ assigned_section: section }).in("id", ids);
    if (error) toast.error(error.message); else { toast.success(`Assigned ${ids.length} student(s).`); onRefresh(); }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Grade 12 Sectioning</CardTitle>
        <p className="text-xs text-muted-foreground">
          Only verified students appear here. Assign Grade 12 sections based on their previous Grade 11 section.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2 items-end">
          <div className="space-y-1">
            <Label className="text-xs">Filter by Previous Section</Label>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Previous Sections</SelectItem>
                {prevOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <BulkAssignButton g12Sections={g12Sections} onAssign={bulkAssign} />
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Prev. Section</TableHead>
                <TableHead>Strand</TableHead>
                <TableHead>Assigned Grade 12 Section</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((e: any) => (
                <TableRow key={e.id}>
                  <TableCell>{e.last_name}, {e.first_name}</TableCell>
                  <TableCell>{e.previous_section}</TableCell>
                  <TableCell>{e.strand}</TableCell>
                  <TableCell>
                    <Select value={e.assigned_section ?? ""} onValueChange={(v) => assign(e.id, v || null)}>
                      <SelectTrigger className="w-56"><SelectValue placeholder="— Unassigned —" /></SelectTrigger>
                      <SelectContent>
                        {g12Sections.map((s: any) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No students.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function BulkAssignButton({ g12Sections, onAssign }: any) {
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline" size="sm">Bulk Assign Unassigned</Button></DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Bulk Assign Section</DialogTitle></DialogHeader>
        <Select value={sel} onValueChange={setSel}>
          <SelectTrigger><SelectValue placeholder="Select Grade 12 section" /></SelectTrigger>
          <SelectContent>
            {g12Sections.map((s: any) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={() => { onAssign(sel); setOpen(false); setSel(""); }} disabled={!sel}>Assign to current view</Button>
      </DialogContent>
    </Dialog>
  );
}

/* -------- MANAGE -------- */
function ManageTab({ sections, defaults, g12Sections, verifiers, onRefresh }: any) {
  const [newPrev, setNewPrev] = useState("");
  const [newG12, setNewG12] = useState("");
  const [newVerifier, setNewVerifier] = useState("");

  async function addPrev() {
    const name = newPrev.trim().toUpperCase();
    if (!name) return;
    const { error } = await supabase.from("previous_sections").insert({ name });
    if (error) toast.error(error.message); else { toast.success("Added."); setNewPrev(""); onRefresh(); }
  }
  async function delPrev(name: string) {
    const { error } = await supabase.from("previous_sections").delete().eq("name", name);
    if (error) toast.error(error.message); else { toast.success("Removed."); onRefresh(); }
  }
  async function addG12() {
    const name = newG12.trim().toUpperCase();
    if (!name) return;
    const { error } = await supabase.from("grade12_sections").insert({ name });
    if (error) toast.error(error.message); else { toast.success("Added."); setNewG12(""); onRefresh(); }
  }
  async function delG12(id: string) {
    const { error } = await supabase.from("grade12_sections").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Removed."); onRefresh(); }
  }
  async function addVerifier() {
    const name = newVerifier.trim();
    if (!name) return;
    const { error } = await supabase.from("verifiers").insert({ name });
    if (error) toast.error(error.message); else { toast.success("Verifier added."); setNewVerifier(""); onRefresh(); }
  }
  async function delVerifier(id: string) {
    const { error } = await supabase.from("verifiers").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Verifier removed."); onRefresh(); }
  }

  const customPrev = sections.filter((s: string) => !defaults.includes(s));

  return (
    <div className="grid md:grid-cols-3 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Grade 11 Previous Sections</CardTitle>
          <p className="text-xs text-muted-foreground">Default sections are always shown. Add custom ones below — they will reflect in the enrollment form's dropdown.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input value={newPrev} onChange={(e) => setNewPrev(e.target.value)} placeholder="e.g. STEM 4" />
            <Button onClick={addPrev}><Plus className="h-4 w-4" /></Button>
          </div>
          <div>
            <div className="text-xs font-medium mb-1">Custom (removable)</div>
            <div className="flex flex-wrap gap-2">
              {customPrev.length === 0 && <p className="text-xs text-muted-foreground">None yet.</p>}
              {customPrev.map((s: string) => (
                <Badge key={s} variant="secondary" className="gap-1">
                  {s}
                  <button onClick={() => delPrev(s)} className="hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium mb-1">Defaults</div>
            <div className="flex flex-wrap gap-1">
              {defaults.map((s: string) => <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>)}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Grade 12 Sections</CardTitle>
          <p className="text-xs text-muted-foreground">Sections you create here are used to assign enrolled students.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input value={newG12} onChange={(e) => setNewG12(e.target.value)} placeholder="e.g. STEM 12-A" />
            <Button onClick={addG12}><Plus className="h-4 w-4" /></Button>
          </div>
          <div className="space-y-1">
            {g12Sections.length === 0 && <p className="text-xs text-muted-foreground">No Grade 12 sections yet.</p>}
            {g12Sections.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between border rounded px-2 py-1.5">
                <span className="text-sm">{s.name}</span>
                <Button size="sm" variant="ghost" onClick={() => delG12(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Verifiers</CardTitle>
          <p className="text-xs text-muted-foreground">Admins select these names when verifying students in Database.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input value={newVerifier} onChange={(e) => setNewVerifier(e.target.value)} placeholder="e.g. Ms. Dela Cruz" />
            <Button onClick={addVerifier}><Plus className="h-4 w-4" /></Button>
          </div>
          <div className="space-y-1">
            {verifiers.length === 0 && <p className="text-xs text-muted-foreground">No verifiers yet.</p>}
            {verifiers.map((v: any) => (
              <div key={v.id} className="flex items-center justify-between border rounded px-2 py-1.5">
                <span className="text-sm">{v.name}</span>
                <Button size="sm" variant="ghost" onClick={() => delVerifier(v.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
