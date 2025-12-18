import Link from "next/link"
import { Play, Mail } from "lucide-react"
import { CONTACT } from "@/lib/constants"

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="container px-4 py-12 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Play className="h-6 w-6 fill-primary" />
              <span className="text-xl font-bold">{CONTACT.businessName}</span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-md mb-4">
              Automate your YouTube content creation with AI. Set it once, forget it forever.
            </p>
            <div className="space-y-2 text-sm">
              <p className="font-semibold">Contact Us</p>
              <div className="flex flex-col gap-1 text-muted-foreground">
                <a
                  href={`mailto:${CONTACT.email}`}
                  className="flex items-center gap-2 hover:text-foreground transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  {CONTACT.email}
                </a>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
                  How it Works
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <a
                  href={CONTACT.whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  WhatsApp Support
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>&copy; 2025 {CONTACT.businessName}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
