/**
 * Step-by-step guide for restoring profile from cloud backup
 * Purely informational component with Swedish instructions
 * Accessible help content for cross-device workflows
 */
export default function RestoreGuide() {
  return (
    <div
      className="
        p-6 rounded-lg
        bg-bg-secondary
        border-2 border-border
      "
      role="region"
      aria-labelledby="restore-guide-title"
    >
      <h3
        id="restore-guide-title"
        className="text-xl font-bold text-foreground mb-4"
      >
        📖 Så här återställer du från molnet
      </h3>

      <ol className="space-y-4 text-muted-foreground">
        {/* Step 1 */}
        <li className="flex gap-3">
          <span
            className="
              flex-shrink-0 w-8 h-8 rounded-full
              bg-primary text-primary-foreground
              flex items-center justify-center
              font-bold text-sm
            "
            aria-hidden="true"
          >
            1
          </span>
          <div>
            <p className="font-semibold text-foreground mb-1">
              Ladda ner din säkerhetskopia
            </p>
            <p className="text-sm">
              Hitta din säkerhetskopia i iCloud Drive, Google Drive, OneDrive eller var du sparade den.
              Ladda ner filen till den här enheten.
            </p>
          </div>
        </li>

        {/* Step 2 */}
        <li className="flex gap-3">
          <span
            className="
              flex-shrink-0 w-8 h-8 rounded-full
              bg-primary text-primary-foreground
              flex items-center justify-center
              font-bold text-sm
            "
            aria-hidden="true"
          >
            2
          </span>
          <div>
            <p className="font-semibold text-foreground mb-1">
              Öppna den här appen
            </p>
            <p className="text-sm">
              Navigera till Inställningar → Data &amp; Säkerhetskopia (eller använd återställningsknappen ovan).
            </p>
          </div>
        </li>

        {/* Step 3 */}
        <li className="flex gap-3">
          <span
            className="
              flex-shrink-0 w-8 h-8 rounded-full
              bg-primary text-primary-foreground
              flex items-center justify-center
              font-bold text-sm
            "
            aria-hidden="true"
          >
            3
          </span>
          <div>
            <p className="font-semibold text-foreground mb-1">
              Välj din säkerhetskopia
            </p>
            <p className="text-sm">
              Klicka på &quot;Återställ från säkerhetskopia&quot; och välj den nedladdade filen
              (t.ex. <code className="text-xs bg-bg-tertiary px-1.5 py-0.5 rounded font-mono">medal-backup-2026-01-06.json</code>).
            </p>
          </div>
        </li>

        {/* Step 4 */}
        <li className="flex gap-3">
          <span
            className="
              flex-shrink-0 w-8 h-8 rounded-full
              bg-primary text-primary-foreground
              flex items-center justify-center
              font-bold text-sm
            "
            aria-hidden="true"
          >
            4
          </span>
          <div>
            <p className="font-semibold text-foreground mb-1">
              Bekräfta återställning
            </p>
            <p className="text-sm">
              Granska förhandsgranskningen (datum, antal aktiviteter) och klicka &quot;Återställ nu&quot;.
              Dina data återställs omedelbart.
            </p>
          </div>
        </li>
      </ol>

      {/* Pro Tip Section */}
      <div
        className="
          mt-6 p-4 rounded-lg
          bg-blue-50 dark:bg-blue-950
          border border-blue-200 dark:border-blue-800
        "
      >
        <p className="text-sm font-semibold text-foreground mb-2">
          💡 Proffsråd
        </p>
        <p className="text-sm text-muted-foreground">
          Håll flera säkerhetskopior på olika platser (molnlagring + USB-minne) för extra säkerhet.
          Säkerhetskopiera regelbundet för att undvika dataförlust.
        </p>
      </div>
    </div>
  )
}
