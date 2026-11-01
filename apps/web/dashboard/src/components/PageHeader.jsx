import { PageHeader as Header } from './ui'
export default function PageHeader({ section, title, children }) {
  return (
    <Header eyebrow={section} title={title}>
      {children}
    </Header>
  )
}
