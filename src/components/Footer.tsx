import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="mt-12 border-t bg-muted/40">
      <div className="mx-auto max-w-5xl px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} Santa Monica National High School · Puerto Princesa City</p>
        <Link
          to="/staff"
          className="opacity-50 hover:opacity-100 transition-opacity hover:text-primary"
          title="Staff"
        >
          · Staff Portal ·
        </Link>
      </div>
    </footer>
  );
}
