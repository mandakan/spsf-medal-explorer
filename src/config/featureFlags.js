export default {
  achievementEntry: {
    default: 'on',
    env: { production: 'on' },
    title: 'Registrering av aktiviteter',
    message: 'Registrering av aktiviteter är under utveckling. Gränssnitt och beteende kan ändras.'
  },
  historyTimeline: {
    default: 'on',
    env: { production: 'on' },
    title: 'Historik',
    message: 'Historiköversikten är under utveckling. Funktioner kan saknas.'
  },
  enforceCurrentYearSetting: {
    default: 'on',
    env: { production: 'preview' },
    title: 'Tvinga innevarande år',
    message: 'Inställningen är under utveckling.',
    overlay: 'inline'
  },
  csvImport: {
    default: 'on',
    env: { production: 'on' },
    title: 'CSV-import/export',
    message: 'CSV-import/export är under utveckling. Gränssnittet kan ändras och vissa funktioner saknas.'
  }
}
