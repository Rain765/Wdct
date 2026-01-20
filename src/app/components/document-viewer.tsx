import { useRef, useEffect, useState } from 'react';
import { Card } from '@/app/components/ui/card';

interface Difference {
  id: number;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  text: string;
}

interface DocumentViewerProps {
  title: string;
  content: string;
  differences: Difference[];
  onDifferenceClick: (id: number) => void;
}

export function DocumentViewer({ title, content, differences, onDifferenceClick }: DocumentViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  return (
    <Card className="flex flex-col h-full">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-medium">{title}</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
            className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
          >
            -
          </button>
          <span className="px-3 py-1 text-sm">{Math.round(scale * 100)}%</span>
          <button
            onClick={() => setScale(s => Math.min(2, s + 0.1))}
            className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
          >
            +
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-4 bg-gray-50 relative">
        <div
          ref={containerRef}
          className="bg-white p-8 shadow-sm relative mx-auto max-w-4xl"
          style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}
        >
          <div
            className="whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: content }}
          />
          
          {/* 差异标注 */}
          {differences.map((diff) => (
            <div
              key={diff.id}
              className="absolute border-2 border-red-500 cursor-pointer hover:border-red-700 transition-all pointer-events-auto"
              style={{
                left: `${diff.position.x}px`,
                top: `${diff.position.y}px`,
                width: `${diff.position.width}px`,
                height: `${diff.position.height}px`,
              }}
              onClick={() => onDifferenceClick(diff.id)}
            >
              <div className="absolute -top-6 -left-1 bg-red-500 text-white text-xs px-2 py-1 rounded shadow-md">
                #{diff.id}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}