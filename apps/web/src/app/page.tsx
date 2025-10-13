import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Zap, Shield, Bell } from 'lucide-react';
import { OrganizationJsonLd, SoftwareApplicationJsonLd } from '@/components/seo/SeoJsonLd';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* SEO structured data */}
      <OrganizationJsonLd />
      <SoftwareApplicationJsonLd />
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg"></div>
            <span className="text-2xl font-bold">Tokiflow</span>
          </div>
          <div className="flex space-x-4">
            <Link href="/auth/signin">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/auth/signin">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Cron & Job Monitoring with Smart Alerts — Tokiflow
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Monitor your cron jobs and scheduled tasks with intelligent Slack alerts, runtime analytics, and anomaly detection. Catch missed, late, or failing jobs before they impact your business.
        </p>
        <div className="flex justify-center space-x-4">
          <Link href="/auth/signin">
            <Button size="lg">Start Monitoring Free</Button>
          </Link>
          <Link href="#features">
            <Button size="lg" variant="outline">View Features</Button>
          </Link>
        </div>

        {/* Quick Setup */}
        <div className="mt-16 max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Create your first monitor in 60 seconds</CardTitle>
              <CardDescription>Just add this to your cron job</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm text-left overflow-x-auto">
                curl https://api.tokiflow.co/api/ping/YOUR_TOKEN
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-12">Beyond Simple Heartbeats</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <Bell className="w-10 h-10 text-blue-600 mb-2" />
              <CardTitle>Smart Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Get notified in Slack, Email, or Discord with rich context about failures, including output captures and recent run history.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="w-10 h-10 text-purple-600 mb-2" />
              <CardTitle>Anomaly Detection</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Automatically detect when jobs take unusually long or produce unexpected output sizes using runtime analytics.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CheckCircle2 className="w-10 h-10 text-green-600 mb-2" />
              <CardTitle>Fast DX</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                One-line integration with code snippets for Bash, Python, Node.js, and our CLI wrapper for zero-code monitoring.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="w-10 h-10 text-orange-600 mb-2" />
              <CardTitle>Privacy First</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Optional output capture with automatic secret redaction. Self-hosted edition coming soon for sensitive workloads.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Pricing */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-12">Simple, Transparent Pricing</h2>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Free</CardTitle>
              <div className="text-3xl font-bold">$0</div>
              <CardDescription>Perfect for personal projects</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-green-600" /> 5 monitors</li>
                <li className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-green-600" /> 3 team members</li>
                <li className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-green-600" /> Email + Slack alerts</li>
                <li className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-green-600" /> 7-day history</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-blue-600 border-2">
            <CardHeader>
              <CardTitle>Pro</CardTitle>
              <div className="text-3xl font-bold">$19<span className="text-sm font-normal">/mo</span></div>
              <CardDescription>For growing teams</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-green-600" /> 100 monitors</li>
                <li className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-green-600" /> 10 team members</li>
                <li className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-green-600" /> All alert channels</li>
                <li className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-green-600" /> Output capture</li>
                <li className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-green-600" /> 90-day history</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Business</CardTitle>
              <div className="text-3xl font-bold">$49<span className="text-sm font-normal">/mo</span></div>
              <CardDescription>For larger organizations</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-green-600" /> 500 monitors</li>
                <li className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-green-600" /> Unlimited users</li>
                <li className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-green-600" /> Priority support</li>
                <li className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-green-600" /> Advanced analytics</li>
                <li className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-green-600" /> 365-day history</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50 py-12">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-purple-600 rounded"></div>
            <span className="text-xl font-bold text-gray-900">Tokiflow</span>
          </div>
          <p>&copy; 2025 Tokiflow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

