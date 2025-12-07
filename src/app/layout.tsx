import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '素材克隆大师 - AI 电商素材生成工具',
  description: '上传竞品图和实拍图，AI 帮你生成同款风格的产品图',
};

import Navbar from '@/components/Navbar';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <Navbar />
        <main className="min-h-[calc(100vh-64px)]">
          {children}
        </main>
      </body>
    </html>
  );
}
