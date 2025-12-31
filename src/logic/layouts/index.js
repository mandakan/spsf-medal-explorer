import { registerLayout, getLayout, listLayouts, DEFAULT_LAYOUT_ID } from './registry'
import { columnsLayout } from './columns'
import { timelineLayout } from './timeline'

registerLayout(columnsLayout)
registerLayout(timelineLayout)

export { getLayout, listLayouts, DEFAULT_LAYOUT_ID }
