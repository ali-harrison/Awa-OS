// Setup is pre-auth — bypass the [clientSlug] authenticated layout entirely

export default function SetupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
