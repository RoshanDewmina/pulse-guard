import { Button } from "@/components/ui/button"
import Link from "next/link"

export function Header() {
  return (
    <header className="w-full border-b border-[#37322f]/6 bg-[#f7f5f3]">
      <div className="max-w-[1060px] mx-auto px-4">
        <nav className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-[#37322f] font-semibold text-lg hover:opacity-80 transition-opacity">
              Saturn
            </Link>
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/#features" className="text-[#37322f] hover:text-[#37322f]/80 text-sm font-medium transition-colors">
                Features
              </Link>
              <Link href="/#pricing" className="text-[#37322f] hover:text-[#37322f]/80 text-sm font-medium transition-colors">
                Pricing
              </Link>
              <Link href="https://docs.saturnmonitor.com" target="_blank" rel="noopener noreferrer" className="text-[#37322f] hover:text-[#37322f]/80 text-sm font-medium transition-colors">
                Docs
              </Link>
            </div>
          </div>
          <Link href="/auth/signin">
            <Button variant="ghost" className="text-[#37322f] hover:bg-[#37322f]/5">
              Log in
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  )
}
