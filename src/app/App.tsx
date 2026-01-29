'use client';

import { useState } from 'react';
import Image from 'next/image';
import { FileUploader } from './components/file-uploader';
import { DocumentComparator } from './components/document-comparator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';

function App() {
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState('upload');

  const handleStartComparison = () => {
    if (fileA && fileB) {
      setActiveTab('compare');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1 inline-flex items-center gap-3">
            <Image src="/logo.svg" alt="Logo" width={64} height={64} priority />
            文档校对工具
          </h1>
          <p className="text-gray-600 text-sm">
            智能对比两个文档的差异，自动标注并生成详细报告
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="upload">上传文档</TabsTrigger>
            <TabsTrigger value="compare" disabled={!fileA || !fileB}>
              对比分析
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <FileUploader
                label="文档 A（原始版本）"
                file={fileA}
                onFileSelect={setFileA}
              />
              <FileUploader
                label="文档 B（对比版本）"
                file={fileB}
                onFileSelect={setFileB}
              />
            </div>

            {fileA && fileB && (
              <div className="flex justify-center">
                <button
                  onClick={handleStartComparison}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg hover:shadow-xl"
                >
                  自动对比分析
                </button>
              </div>
            )}

            <div className="mt-8 p-6 bg-white rounded-lg shadow-sm">
              <h3 className="font-semibold mb-4 text-lg">功能特点</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold">
                    1
                  </div>
                  <h4 className="font-medium">智能对比</h4>
                  <p className="text-sm text-gray-600">
                    使用先进的文本对比算法，精准识别文档差异
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600 font-bold">
                    2
                  </div>
                  <h4 className="font-medium">可视化标注</h4>
                  <p className="text-sm text-gray-600">
                    在文档上直接标注差异位置，一目了然
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 font-bold">
                    3
                  </div>
                  <h4 className="font-medium">详细报告</h4>
                  <p className="text-sm text-gray-600">
                    自动生成结构化差异报告，支持导出
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="compare" className="h-[calc(100vh-250px)]">
            <DocumentComparator fileA={fileA} fileB={fileB} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
