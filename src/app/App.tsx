'use client';

import { useRef, useState, type DragEvent } from 'react';
import Image from 'next/image';
import { FileUploader } from './components/file-uploader';
import { DocumentComparator } from './components/document-comparator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';

function DesignReview() {
  const [designUrl, setDesignUrl] = useState('');
  const [implUrl, setImplUrl] = useState('');

  const designFileInputRef = useRef<HTMLInputElement | null>(null);
  const implFileInputRef = useRef<HTMLInputElement | null>(null);

  const [designIsImage, setDesignIsImage] = useState(false);
  const [implIsImage, setImplIsImage] = useState(false);

  const handleFile = (side: 'design' | 'impl', file: File) => {
    if (!file.type.startsWith('image/')) return;
    const objectUrl = URL.createObjectURL(file);
    if (side === 'design') {
      setDesignUrl(objectUrl);
      setDesignIsImage(true);
    } else {
      setImplUrl(objectUrl);
      setImplIsImage(true);
    }
  };

  const handleDrop =
    (side: 'design' | 'impl') =>
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const file = event.dataTransfer.files?.[0];
      if (file) {
        handleFile(side, file);
      }
    };

  const handleClickUpload = (side: 'design' | 'impl') => {
    if (side === 'design') {
      designFileInputRef.current?.click();
    } else {
      implFileInputRef.current?.click();
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">设计走查</h2>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-4 space-y-3">
          <h3 className="font-semibold">设计稿</h3>
          <input
            ref={designFileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile('design', file);
            }}
          />
          <input
            className="w-full px-3 py-2 text-sm border rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="粘贴 Figma 链接、设计图 URL 或上传后提供的链接"
            value={designUrl}
            onChange={(e) => {
              setDesignUrl(e.target.value);
              setDesignIsImage(false);
            }}
          />
          <div
            className="border border-dashed rounded-md overflow-hidden bg-gray-50 min-h-[260px] flex items-center justify-center cursor-pointer"
            onClick={() => handleClickUpload('design')}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop('design')}
          >
            {designUrl ? (
              designIsImage ? (
                // 本地或远程图片
                <img
                  src={designUrl}
                  alt="设计稿预览"
                  className="max-h-72 w-auto object-contain"
                />
              ) : (
                // Figma 等页面链接
                <iframe
                  src={designUrl}
                  className="w-full h-72 border-0"
                  title="设计稿预览"
                />
              )
            ) : (
              <p className="text-xs text-gray-400">
                在上方输入设计稿链接（如 Figma / 图片 URL），或点击/拖拽上传截图，这里会展示预览，方便与实现页面对比。
              </p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 space-y-3">
          <h3 className="font-semibold">实现页面</h3>
          <input
            ref={implFileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile('impl', file);
            }}
          />
          <input
            className="w-full px-3 py-2 text-sm border rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="粘贴页面链接或截图 URL"
            value={implUrl}
            onChange={(e) => {
              setImplUrl(e.target.value);
              setImplIsImage(false);
            }}
          />
          <div
            className="border border-dashed rounded-md overflow-hidden bg-gray-50 min-h-[260px] flex items-center justify-center cursor-pointer"
            onClick={() => handleClickUpload('impl')}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop('impl')}
          >
            {implUrl ? (
              implIsImage ? (
                <img
                  src={implUrl}
                  alt="实现页面截图预览"
                  className="max-h-72 w-auto object-contain"
                />
              ) : (
                <iframe
                  src={implUrl}
                  className="w-full h-72 border-0"
                  title="实现页面预览"
                />
              )
            ) : (
              <p className="text-xs text-gray-400">
                在上方输入实际页面链接或截图 URL，或点击/拖拽上传截图，和左侧设计稿一起进行走查。
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4">
        <h3 className="font-semibold mb-3">差异走查要点</h3>
        <ul className="grid md:grid-cols-2 gap-2 text-sm text-gray-700 list-disc list-inside">
          <li>文字内容是否一致（文案、有无缺失）</li>
          <li>字体家族、字号、字重是否与设计稿匹配</li>
          <li>文字颜色（主色、提示色、禁用态等）是否一致</li>
          <li>模块之间的间距（内边距 / 外边距）是否对齐网格</li>
          <li>按钮、输入框等组件的尺寸、圆角、边框样式是否统一</li>
          <li>图标、插画、图片的大小与位置是否与设计稿保持一致</li>
        </ul>
      </div>
    </div>
  );
}

function App() {
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<'doc' | 'design'>('doc');
  const [docView, setDocView] = useState<'upload' | 'compare'>('upload');

  const handleStartComparison = () => {
    if (fileA && fileB) {
      setDocView('compare');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-0">
            <Image src="/logo.svg" alt="Logo" width={64} height={64} priority />
            <div className="flex flex-col gap-[8px]">
              <h1 className="text-2xl font-bold text-gray-900 leading-none">
                Textora
              </h1>
              <p className="text-gray-600 text-sm leading-none">
                智能对比两个文档的差异，自动标注并生成详细报告
              </p>
            </div>
          </div>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'doc' | 'design')}
          className="space-y-6"
        >
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="doc">文档比对</TabsTrigger>
            <TabsTrigger value="design">设计走查</TabsTrigger>
          </TabsList>

          <TabsContent value="doc" className="space-y-6">
            {docView === 'upload' ? (
              <>
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
              </>
            ) : (
              <div className="space-y-4 h-[calc(100vh-250px)]">
                <button
                  type="button"
                  className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
                  onClick={() => setDocView('upload')}
                >
                  <span className="mr-1 text-lg leading-none">←</span>
                  返回
                </button>
                <DocumentComparator fileA={fileA} fileB={fileB} />
              </div>
            )}
          </TabsContent>

          <TabsContent value="design" className="space-y-6">
            <DesignReview />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
