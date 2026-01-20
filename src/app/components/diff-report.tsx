import { Card } from '@/app/components/ui/card';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { Badge } from '@/app/components/ui/badge';

export interface DiffItem {
  id: number;
  type: 'addition' | 'deletion' | 'modification';
  textA: string;
  textB: string;
  position: string;
}

interface DiffReportProps {
  differences: DiffItem[];
  onItemClick: (id: number) => void;
  selectedId?: number;
}

export function DiffReport({ differences, onItemClick, selectedId }: DiffReportProps) {
  const getTypeBadge = (type: DiffItem['type']) => {
    const configs = {
      addition: { label: '新增', className: 'bg-green-100 text-green-800' },
      deletion: { label: '删除', className: 'bg-red-100 text-red-800' },
      modification: { label: '修改', className: 'bg-yellow-100 text-yellow-800' },
    };
    
    const config = configs[type];
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  return (
    <Card className="h-full">
      <div className="p-4 border-b">
        <h3 className="font-medium">差异报告</h3>
        <p className="text-sm text-gray-500 mt-1">
          共发现 {differences.length} 处差异
        </p>
      </div>
      
      <ScrollArea className="h-[calc(100%-80px)]">
        <div className="p-4 space-y-3">
          {differences.map((diff) => (
            <div
              key={diff.id}
              className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                selectedId === diff.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
              }`}
              onClick={() => onItemClick(diff.id)}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-gray-700">#{diff.id}</span>
                {getTypeBadge(diff.type)}
                <span className="text-xs text-gray-500">{diff.position}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="space-y-1">
                  <div className="text-xs font-medium text-gray-500">文档 A</div>
                  <div className="text-sm p-2 bg-red-50 border border-red-200 rounded">
                    {diff.textA || <span className="text-gray-400 italic">（无）</span>}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-xs font-medium text-gray-500">文档 B</div>
                  <div className="text-sm p-2 bg-green-50 border border-green-200 rounded">
                    {diff.textB || <span className="text-gray-400 italic">（无）</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {differences.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p>暂无差异</p>
              <p className="text-sm mt-2">上传两个文档开始对比</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}
