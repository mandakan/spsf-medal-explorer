import { registerLayout, getLayout, listLayouts, DEFAULT_LAYOUT_ID } from './registry'
import { columnsLayout } from './columns'

registerLayout(columnsLayout)

export { getLayout, listLayouts, DEFAULT_LAYOUT_ID }
