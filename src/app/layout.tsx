import './globals.css'

export const metadata = {
  title: 'Textora',
  description: '智能对比两个文档的差异，自动标注并生成详细报告',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
