import { useEffect, useMemo, useRef, useState } from 'react';
import { Card } from '@/app/components/ui/card';
import type { DifferenceSegment } from './document-comparator';

interface DocumentViewerProps {
  title: string;
  content: string;
  differences: DifferenceSegment[];
  onDifferenceClick: (id: number) => void;
  selectedId?: number;
}

export function DocumentViewer({
  title,
  content,
  differences,
  onDifferenceClick,
  selectedId,
}: DocumentViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const lines = useMemo(() => content.split('\n'), [content]);

  const segmentsByLine = useMemo(() => {
    const map = new Map<number, DifferenceSegment[]>();
    for (const seg of differences) {
      if (!map.has(seg.line)) map.set(seg.line, []);
      map.get(seg.line)!.push(seg);
    }
    for (const [k, arr] of map.entries()) {
      arr.sort((a, b) => a.startCol - b.startCol);
      map.set(k, arr);
    }
    return map;
  }, [differences]);

  useEffect(() => {
    if (!selectedId || !containerRef.current) return;
    const el = containerRef.current.querySelector<HTMLElement>(
      `[data-diff-id="${selectedId}"]`,
    );
    el?.scrollIntoView({ block: 'center', inline: 'nearest' });
  }, [selectedId]);

  const getHighlightClass = (type: DifferenceSegment['type']) => {
    // “框出差异字符”：使用 outline + 轻底色
    if (type === 'addition') return 'outline outline-1 outline-green-600 bg-green-500/10 rounded-sm';
    return 'outline outline-1 outline-red-600 bg-red-500/10 rounded-sm';
  };

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
          <div className="text-sm leading-6 text-gray-900">
            {lines.map((lineText, lineIdx) => {
              const segs = segmentsByLine.get(lineIdx) ?? [];
              const labelId = segs[0]?.id;

              // 构建该行的富文本：普通片段 + 高亮片段
              const pieces: React.ReactNode[] = [];
              let cursor = 0;
              segs.forEach((seg) => {
                const start = Math.max(0, Math.min(seg.startCol, lineText.length));
                const end = Math.max(start, Math.min(seg.endCol, lineText.length));
                if (start > cursor) {
                  pieces.push(
                    <span key={`t-${lineIdx}-${cursor}`}>{lineText.slice(cursor, start)}</span>,
                  );
                }
                if (end > start) {
                  pieces.push(
                    <span
                      key={`h-${seg.id}-${lineIdx}-${start}`}
                      data-diff-id={seg.id}
                      className={getHighlightClass(seg.type)}
                      onClick={() => onDifferenceClick(seg.id)}
                    >
                      {lineText.slice(start, end)}
                    </span>,
                  );
                }
                cursor = end;
              });
              if (cursor < lineText.length) {
                pieces.push(<span key={`t-${lineIdx}-${cursor}-tail`}>{lineText.slice(cursor)}</span>);
              }

              // 空行也占位，避免高度塌陷
              const contentNode = pieces.length > 0 ? pieces : '\u00A0';

              return (
                <div
                  key={`line-${lineIdx}`}
                  className="grid grid-cols-[2.75rem_1fr] gap-2"
                >
                  <div className="pt-[2px]">
                    {labelId ? (
                      <button
                        type="button"
                        className="bg-white/70 text-red-600 text-xs px-2 py-1 rounded border border-red-200 shadow-sm backdrop-blur-sm"
                        onClick={() => onDifferenceClick(labelId)}
                        data-diff-id={labelId}
                        title={`#${labelId}`}
                      >
                        #{labelId}
                      </button>
                    ) : (
                      <span className="text-transparent select-none">#</span>
                    )}
                  </div>
                  <div className="whitespace-pre-wrap break-words">
                    {contentNode}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}