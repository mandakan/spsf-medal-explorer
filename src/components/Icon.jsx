import * as Icons from 'lucide-react'

export default function Icon({ name, className = 'w-4 h-4', ...rest }) {
  const Cmp = Icons[name] || Icons.Circle
  return <Cmp aria-hidden="true" focusable="false" className={className} {...rest} />
}
