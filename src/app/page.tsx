'use client';

import { motion } from 'framer-motion';
import { Rocket, Shield, Zap, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  const features = [
    {
      title: 'Next.js 15+',
      description: 'Built with the latest Next.js features for optimal performance and developer experience.',
      icon: <Zap className="h-6 w-6 text-yellow-500" />,
    },
    {
      title: 'Supabase Backend',
      description: 'Integrated with Supabase for seamless authentication, database, and storage management.',
      icon: <Shield className="h-6 w-6 text-green-500" />,
    },
    {
      title: 'shadcn/ui & Tailwind',
      description: 'Beautiful, accessible components styled with Tailwind CSS v4.',
      icon: <Rocket className="h-6 w-6 text-blue-500" />,
    },
  ];

  return (
    <div className="flex-1 bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-black">
      <main className="container mx-auto px-4 py-16 sm:py-24">
        {/* Hero Section */}
        <section className="flex flex-col items-center text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-zinc-900 dark:text-zinc-50">
              ACIS Project <span className="text-blue-600">Starter</span>
            </h1>
            <p className="mt-6 text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
              A premium foundation for your Next.js applications, pre-configured with Supabase, Axios, and shadcn/ui.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <Button size="lg" className="rounded-full px-8">
              Get Started
            </Button>
            <Button size="lg" variant="outline" className="rounded-full px-8 gap-2">
              <Globe className="h-5 w-5" />
              Official Website
            </Button>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 * index + 0.5, duration: 0.4 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow border-zinc-200 dark:border-zinc-800">
                <CardHeader>
                  <div className="mb-4 inline-block p-3 rounded-xl bg-zinc-100 dark:bg-zinc-900">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-zinc-600 dark:text-zinc-400 text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </section>

        {/* Status Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-24 text-center p-8 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-dashed border-zinc-300 dark:border-zinc-700"
        >
          <h2 className="text-lg font-medium mb-2">Setup Complete</h2>
          <p className="text-sm text-zinc-500">
            Check <code>src/lib/supabase.ts</code> and <code>src/lib/axios.ts</code> to customize your integrations.
          </p>
        </motion.div>
      </main>
    </div>
  );
}
