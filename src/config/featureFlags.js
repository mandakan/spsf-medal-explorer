export default {
  achievementEntry: {
    default: 'on',
    env: { production: 'preview' },
    title: 'Förhandsvisning',
    message: 'Registrering av prestationer är under utveckling. Gränssnitt och beteende kan ändras.'
  },
  historyTimeline: {
    default: 'on',
    env: { production: 'preview' },
    title: 'Förhandsvisning',
    message: 'Historiköversikten är under utveckling. Funktioner kan saknas.'
  },
  enforceCurrentYearSetting: {
    default: 'on',
    env: { production: 'preview' },
    title: 'Förhandsvisning',
    message: 'Inställningen “Kräv innevarande år för återkommande märken” är under utveckling.',
    overlay: 'inline'
  }
}
