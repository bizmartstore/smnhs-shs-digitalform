import logo from "@/assets/logo.png";

export function SchoolHeader({ subtitle }: { subtitle?: string }) {
  return (
    <header className="bg-gradient-to-r from-primary via-primary to-red-900 text-primary-foreground shadow-lg">
      <div className="mx-auto max-w-5xl px-4 py-5 flex items-center gap-4">
        <img src={logo} alt="SMNHS Logo" className="h-16 w-16 rounded-full bg-white p-1 shadow" />
        <div className="min-w-0">
          <h1 className="text-lg sm:text-2xl font-bold tracking-tight leading-tight">
            Santa Monica National High School
          </h1>
          <p className="text-xs sm:text-sm opacity-90">
            Puerto Princesa City · Senior High School Enrollment
          </p>
          {subtitle && <p className="text-xs sm:text-sm mt-1 opacity-95">{subtitle}</p>}
        </div>
      </div>
    </header>
  );
}
