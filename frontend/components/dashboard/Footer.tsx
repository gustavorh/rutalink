export function DashboardFooter() {
  return (
    <footer className="bg-[#1a1d25] border-t border-slate-700 py-4">
      <div className="max-w-[1400px] mx-auto px-6">
        <p className="text-center text-sm text-slate-400">
          {"© "}
          <a
            href="https://www.bilix.cl"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-400 hover:text-purple-300 transition-colors"
          >
            Bilix Ingeniería
          </a>
          {" | 2025"}
        </p>
      </div>
    </footer>
  );
}
