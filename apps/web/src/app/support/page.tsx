"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(5, "Subject must be at least 5 characters").max(200, "Subject is too long"),
  message: z.string().min(10, "Message must be at least 10 characters").max(5000, "Message is too long"),
})

type FormValues = z.infer<typeof formSchema>

export default function SupportPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  })

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send message")
      }

      setIsSubmitted(true)
      toast.success("Message sent successfully! We'll get back to you soon.")
      form.reset()
    } catch (error) {
      console.error("Form submission error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to send message. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F5F3] flex flex-col">
      {/* Header */}
      <header className="w-full border-b border-[#37322f]/6 bg-[#F7F5F3]">
        <div className="max-w-[1060px] mx-auto px-4">
          <nav className="flex items-center justify-between py-4">
            <Link href="/" className="text-[#37322f] font-semibold text-lg hover:opacity-80 transition-opacity">
              Saturn
            </Link>
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="text-[#37322f] hover:text-[#37322f]/80 text-sm font-medium transition-colors"
              >
                Home
              </Link>
              <Link
                href="/auth/signin"
                className="text-[#37322f] hover:bg-[#37322f]/5 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Log in
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-[640px] mx-auto px-4 py-12 sm:py-16 md:py-20">
        <div className="space-y-6">
          {/* Header Section */}
          <div className="space-y-3 text-center">
            <h1 className="text-[#37322F] text-3xl sm:text-4xl md:text-5xl font-semibold leading-tight font-sans">
              Contact Support
            </h1>
            <p className="text-[#605A57] text-base sm:text-lg font-normal leading-relaxed font-sans">
              Have a question or need help? Send us a message and we'll get back to you as soon as possible.
            </p>
          </div>

          {/* Form Section */}
          <div className="bg-white rounded-lg shadow-sm border border-[rgba(55,50,47,0.12)] p-6 sm:p-8">
            {isSubmitted ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-[#37322F] font-sans">Message Sent!</h2>
                <p className="text-[#605A57] font-sans">
                  Thank you for contacting us. We'll respond to your inquiry shortly.
                </p>
                <Button
                  onClick={() => setIsSubmitted(false)}
                  variant="outline"
                  className="mt-4"
                >
                  Send Another Message
                </Button>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#37322F] font-medium font-sans">Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Your name"
                            {...field}
                            className="bg-white border-[rgba(55,50,47,0.12)] focus:border-[#37322F] focus:ring-[#37322F]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#37322F] font-medium font-sans">Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="your.email@example.com"
                            {...field}
                            className="bg-white border-[rgba(55,50,47,0.12)] focus:border-[#37322F] focus:ring-[#37322F]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#37322F] font-medium font-sans">Subject</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="How can we help?"
                            {...field}
                            className="bg-white border-[rgba(55,50,47,0.12)] focus:border-[#37322F] focus:ring-[#37322F]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#37322F] font-medium font-sans">Message</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell us more about your question or issue..."
                            rows={6}
                            {...field}
                            className="bg-white border-[rgba(55,50,47,0.12)] focus:border-[#37322F] focus:ring-[#37322F] resize-none"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#37322F] hover:bg-[#49423D] text-white font-medium py-6 transition-colors"
                  >
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </Form>
            )}
          </div>

          {/* Additional Contact Info */}
          <div className="text-center space-y-2 pt-4">
            <p className="text-[#605A57] text-sm font-sans">
              You can also reach us directly at
            </p>
            <a
              href="mailto:support@saturnmonitor.com"
              className="text-[#37322F] hover:text-[#49423D] font-medium text-sm underline underline-offset-2 transition-colors"
            >
              support@saturnmonitor.com
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-[rgba(55,50,47,0.12)] py-6 bg-[#F7F5F3]">
        <div className="max-w-[1060px] mx-auto px-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-[#605A57] font-sans">
            <p>© {new Date().getFullYear()} Saturn, Inc. All rights reserved.</p>
            <div className="flex gap-4">
              <Link href="/legal/privacy" className="hover:text-[#37322F] transition-colors">
                Privacy
              </Link>
              <Link href="/legal/terms" className="hover:text-[#37322F] transition-colors">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

