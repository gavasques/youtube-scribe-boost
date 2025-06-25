
import { ReactNode } from "react"
import { AppHeader } from "./AppHeader"

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen flex w-full">
      <div className="flex flex-col flex-1">
        <AppHeader />
        <main className="flex-1 p-6 bg-muted/30">
          {children}
        </main>
      </div>
    </div>
  )
}
