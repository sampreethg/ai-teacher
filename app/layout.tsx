import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '../components/ThemeProvider';
import { AuthProvider } from '../components/AuthProvider';

export const metadata: Metadata = {
  title: 'AI Teacher - Learn Anything Faster with a Human-Like AI Educator',
  description: 'An interactive, video-based AI educator that adapts to your learning level, time limits, and language. Powered by multi-agent AI and Socratic questioning.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <body className="bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 antialiased min-h-screen flex flex-col transition-colors duration-200">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
