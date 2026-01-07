import { useBackup } from '../hooks/useBackup'
import { formatLastBackupDate } from '../utils/backupScheduler'
import Icon from './Icon'

const FREQUENCY_OPTIONS = [
  { value: 0, label: 'Påminn mig aldrig', description: 'Jag säkerhetskopierar manuellt' },
  { value: 30, label: 'Var 30:e dag', description: 'Rekommenderas för de flesta användare' },
  { value: 90, label: 'Var 90:e dag', description: 'För avancerade användare' }
]

/**
 * BackupPreferences - Settings component for backup reminder configuration
 * Displays frequency options and educational content about data safety
 */
export default function BackupPreferences() {
  const { reminderFrequency, updateReminderFrequency, lastBackupDate } = useBackup()

  const handleChange = (value) => {
    updateReminderFrequency(value)
  }

  const lastBackupText = formatLastBackupDate(lastBackupDate)

  return (
    <div className="card p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-color-text-primary mb-2">
          Säkerhetskopieringspåminnelser
        </h2>
        <p className="text-sm text-color-text-secondary">
          Få påminnelser om att säkerhetskopiera dina uppgifter regelbundet
        </p>
      </div>

      {/* Frequency Options */}
      <fieldset className="space-y-3 mb-6">
        <legend className="sr-only">Frekvens för säkerhetskopieringspåminnelser</legend>

        {FREQUENCY_OPTIONS.map((option) => {
          const isSelected = reminderFrequency === option.value

          return (
            <div
              key={option.value}
              className={`
                p-4 rounded-lg border-2 transition-colors cursor-pointer
                ${
                  isSelected
                    ? 'border-color-primary bg-blue-50 dark:bg-blue-950'
                    : 'border-color-border bg-color-bg-secondary hover:border-color-primary/50'
                }
              `}
            >
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="backup-frequency"
                  value={option.value}
                  checked={isSelected}
                  onChange={() => handleChange(option.value)}
                  className="
                    mt-1 w-5 h-5
                    text-color-primary
                    focus-visible:ring-2 focus-visible:ring-offset-2
                    focus-visible:ring-color-primary
                  "
                />

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-color-text-primary">
                    {option.label}
                  </p>
                  <p className="text-sm text-color-text-secondary mt-1">
                    {option.description}
                  </p>
                </div>
              </label>
            </div>
          )
        })}
      </fieldset>

      {/* Last Backup Info */}
      <div className="p-4 rounded-lg bg-color-bg-secondary border border-color-border mb-6">
        <div className="flex items-center gap-2">
          <Icon name="Clock" className="w-4 h-4 text-color-text-secondary" aria-hidden="true" />
          <p className="text-sm text-color-text-secondary">
            Senaste säkerhetskopia:{' '}
            <span className="font-medium text-color-text-primary">
              {lastBackupText}
            </span>
          </p>
        </div>
      </div>

      {/* Educational Section */}
      <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <Icon name="Lightbulb" className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <h3 className="font-semibold text-color-text-primary mb-2">
              Så håller du dina uppgifter säkra
            </h3>
            <ul className="text-sm text-color-text-secondary space-y-1">
              <li>• Din data finns bara på den här enheten</li>
              <li>• Exportera regelbundet för att undvika att förlora framsteg</li>
              <li>• Lagra säkerhetskopior i iCloud Drive, Google Drive eller USB</li>
              <li>• Flera säkerhetskopior = extra säkerhet</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
