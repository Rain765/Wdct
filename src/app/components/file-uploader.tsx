import { useRef } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';

interface FileUploaderProps {
  label: string;
  file: File | null;
  onFileSelect: (file: File | null) => void;
  accept?: string;
}

export function FileUploader({ label, file, onFileSelect, accept = '.txt,.pdf,.doc,.docx' }: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    onFileSelect(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      onFileSelect(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const clearFile = () => {
    onFileSelect(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-lg">{label}</h3>
          {file && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFile}
              className="h-8"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {!file ? (
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
            onClick={() => inputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-sm text-gray-600 mb-2">
              点击或拖拽文件到此处上传
            </p>
            <p className="text-xs text-gray-400">
              支持格式: TXT, PDF, DOC, DOCX
            </p>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept={accept}
              onChange={handleFileChange}
            />
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <FileText className="h-8 w-8 text-blue-500" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-gray-500">
                {(file.size / 1024).toFixed(2)} KB
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
