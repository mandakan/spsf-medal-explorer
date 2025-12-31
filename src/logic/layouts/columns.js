import { generateMedalLayout } from '../canvasLayout'

export const columnsLayout = {
  id: 'columns',
  label: 'Standard (kolumner)',
  description: 'Grupperar märken efter typ i kolumner.',
  generator: (medals, _options) => generateMedalLayout(medals),
}
