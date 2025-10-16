import Link from "next/link"

interface SiteHeaderProps {
  variant?: "default" | "transparent"
}

export default function SiteHeader({ variant = "default" }: SiteHeaderProps) {
  const bgClass = variant === "transparent" ? "bg-transparent" : "bg-[#F7F5F3] border-b border-[#37322f]/6"
  
  return (
    <header className={`w-full ${bgClass}`}>
      <div className="max-w-[1060px] mx-auto px-4">
        <nav className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-[#37322f] font-semibold text-lg hover:opacity-80 transition-opacity">
              Saturn
            </Link>
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/app" className="text-[#37322f] hover:text-[#37322f]/80 text-sm font-medium transition-colors">
                Dashboard
              </Link>
              <Link href="/app/monitors" className="text-[#37322f] hover:text-[#37322f]/80 text-sm font-medium transition-colors">
                Monitors
              </Link>
              <Link href="/app/incidents" className="text-[#37322f] hover:text-[#37322f]/80 text-sm font-medium transition-colors">
                Incidents
              </Link>
              <Link href="/app/analytics" className="text-[#37322f] hover:text-[#37322f]/80 text-sm font-medium transition-colors">
                Analytics
              </Link>
              <Link href="/#pricing" className="text-[#37322f] hover:text-[#37322f]/80 text-sm font-medium transition-colors">
                Pricing
              </Link>
              <Link href="https://docs.saturnmonitor.com" target="_blank" rel="noopener noreferrer" className="text-[#37322f] hover:text-[#37322f]/80 text-sm font-medium transition-colors">
                Docs
              </Link>
            </div>
          </div>
          <Link 
            href="/auth/signin"
            className="text-[#37322f] hover:bg-[#37322f]/5 px-3 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Log in
          </Link>
        </nav>
      </div>
    </header>
  )
}


