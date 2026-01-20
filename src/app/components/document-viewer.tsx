import { useRef, useState } from 'react';
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

  const LINE_HEIGHT = 24;
  const TOP_PADDING = 32; // 与容器 p-8 对齐
  const getLineKey = (y: number) =>
    Math.max(0, Math.round((y - TOP_PADDING) / LINE_HEIGHT));

  const sortedDiffs = [...differences].sort((a, b) => {
    if (a.position.y !== b.position.y) return a.position.y - b.position.y;
    return a.position.x - b.position.x;
  });
  const labeledLines = new Set<number>();

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
          <pre className="whitespace-pre font-mono text-sm leading-6 text-gray-900">
            {content}
          </pre>
          
          {/* 差异标注 */}
          {sortedDiffs.map((diff) => {
            const lineKey = getLineKey(diff.position.y);
            const showLabel = !labeledLines.has(lineKey);
            if (showLabel) labeledLines.add(lineKey);

            return (
              <div
                key={`${diff.id}-${diff.position.x}-${diff.position.y}`}
                className="absolute border border-red-500/80 bg-red-500/10 cursor-pointer hover:border-red-600 transition-all pointer-events-auto"
                style={{
                  left: `${diff.position.x}px`,
                  top: `${diff.position.y}px`,
                  width: `${diff.position.width}px`,
                  height: `${diff.position.height}px`,
                }}
                onClick={() => onDifferenceClick(diff.id)}
              >
                {showLabel && (
                  <div className="absolute -top-6 -left-1 bg-white/70 text-red-600 text-xs px-2 py-1 rounded border border-red-200 shadow-sm backdrop-blur-sm">
                    #{diff.id}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}