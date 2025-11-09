export function DashboardFooter() {
  return (
    <footer className="bg-background border-t border-border py-4">
      <div className="max-w-[1400px] mx-auto px-6">
        <p className="text-center text-sm text-muted-foreground">
          {"© "}
          <a
            href="https://www.bilix.cl"
            target="_blank"
            rel="noopener noreferrer"
            className="text-secondary hover:text-secondary-light transition-colors"
          >
            Bilix Ingeniería
          </a>
          {" | 2025"}
        </p>
      </div>
    </footer>
  );
}
