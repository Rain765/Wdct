import { useState, useEffect } from "react";
import DiffMatchPatch from "diff-match-patch";
import { DocumentViewer } from "./document-viewer";
import { DiffReport, DiffItem } from "./diff-report";
import { Button } from "@/app/components/ui/button";
import { Loader2 } from "lucide-react";
import mammoth from "mammoth";

interface DocumentComparatorProps {
  fileA: File | null;
  fileB: File | null;
}

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

export function DocumentComparator({
  fileA,
  fileB,
}: DocumentComparatorProps) {
  const [contentA, setContentA] = useState("");
  const [contentB, setContentB] = useState("");
  const [differences, setDifferences] = useState<DiffItem[]>(
    [],
  );
  const [differencesA, setDifferencesA] = useState<
    Difference[]
  >([]);
  const [differencesB, setDifferencesB] = useState<
    Difference[]
  >([]);
  const [selectedDiffId, setSelectedDiffId] = useState<
    number | undefined
  >();
  const [isComparing, setIsComparing] = useState(false);

  // 读取文件内容
  const readFileContent = async (
    file: File,
  ): Promise<string> => {
    const fileType = file.name.split(".").pop()?.toLowerCase();

    if (fileType === "txt") {
      return await file.text();
    } else if (fileType === "docx" || fileType === "doc") {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({
        arrayBuffer,
      });
      return result.value;
    } else if (fileType === "pdf") {
      // PDF处理会在后续版本中添加
      return "暂不支持PDF格式的详细对比，请转换为TXT或DOCX格式";
    }

    return "";
  };

  // 加载文件
  useEffect(() => {
    if (fileA) {
      readFileContent(fileA).then(setContentA);
    } else {
      setContentA("");
    }
  }, [fileA]);

  useEffect(() => {
    if (fileB) {
      readFileContent(fileB).then(setContentB);
    } else {
      setContentB("");
    }
  }, [fileB]);

  // 执行对比
  const performComparison = () => {
    if (!contentA || !contentB) return;

    setIsComparing(true);

    setTimeout(() => {
      const dmp = new DiffMatchPatch();
      // 设置为逐字符对比，不进行语义清理以保持精确度
      const diffs = dmp.diff_main(contentA, contentB);
      // 注释掉语义清理，保持每个字符的差异
      // dmp.diff_cleanupSemantic(diffs);

      const diffItems: DiffItem[] = [];
      const diffsA: Difference[] = [];
      const diffsB: Difference[] = [];
      let diffId = 1;

      // 用于计算字符在文档中的位置
      let charIndexA = 0;
      let charIndexB = 0;

      // 字符渲染参数
      const charWidth = 8; // 每个字符的平均宽度
      const lineHeight = 24; // 行高
      const charsPerLine = 70; // 每行大约字符数
      const leftPadding = 32; // 左边距

      diffs.forEach((diff) => {
        const [type, text] = diff;

        if (type === -1) {
          // 删除的内容（在A中存在，B中不存在）
          const lines = text.split("\n");
          let tempCharIndex = charIndexA;

          lines.forEach((line, lineIdx) => {
            if (line.length > 0) {
              const lineNumber = Math.floor(
                tempCharIndex / charsPerLine,
              );
              const charInLine = tempCharIndex % charsPerLine;

              diffItems.push({
                id: diffId,
                type: "deletion",
                textA:
                  line.substring(0, 50) +
                  (line.length > 50 ? "..." : ""),
                textB: "",
                position: `第 ${lineNumber + 1} 行，第 ${charInLine + 1} 字符`,
              });

              diffsA.push({
                id: diffId,
                position: {
                  x: leftPadding + charInLine * charWidth,
                  y: lineNumber * lineHeight + 10,
                  width: Math.min(line.length * charWidth, 600),
                  height: lineHeight - 4,
                },
                text: line,
              });

              diffId++;
            }

            tempCharIndex += line.length;
            if (lineIdx < lines.length - 1) {
              tempCharIndex += 1; // 换行符
            }
          });

          charIndexA += text.length;
        } else if (type === 1) {
          // 新增的内容（在B中存在，A中不存在）
          const lines = text.split("\n");
          let tempCharIndex = charIndexB;

          lines.forEach((line, lineIdx) => {
            if (line.length > 0) {
              const lineNumber = Math.floor(
                tempCharIndex / charsPerLine,
              );
              const charInLine = tempCharIndex % charsPerLine;

              diffItems.push({
                id: diffId,
                type: "addition",
                textA: "",
                textB:
                  line.substring(0, 50) +
                  (line.length > 50 ? "..." : ""),
                position: `第 ${lineNumber + 1} 行，第 ${charInLine + 1} 字符`,
              });

              diffsB.push({
                id: diffId,
                position: {
                  x: leftPadding + charInLine * charWidth,
                  y: lineNumber * lineHeight + 10,
                  width: Math.min(line.length * charWidth, 600),
                  height: lineHeight - 4,
                },
                text: line,
              });

              diffId++;
            }

            tempCharIndex += line.length;
            if (lineIdx < lines.length - 1) {
              tempCharIndex += 1; // 换行符
            }
          });

          charIndexB += text.length;
        } else {
          // 相同的内容
          charIndexA += text.length;
          charIndexB += text.length;
        }
      });

      setDifferences(diffItems);
      setDifferencesA(diffsA);
      setDifferencesB(diffsB);
      setIsComparing(false);
    }, 500);
  };

  const handleDifferenceClick = (id: number) => {
    setSelectedDiffId(id);
  };

  const canCompare = fileA && fileB && contentA && contentB;

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">文档对比</h2>
        <Button
          onClick={performComparison}
          disabled={!canCompare || isComparing}
          size="lg"
        >
          {isComparing && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {isComparing ? "对比中..." : "开始对比"}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
        <DocumentViewer
          title="文档 A"
          content={contentA || "请上传文档 A"}
          differences={differencesA}
          onDifferenceClick={handleDifferenceClick}
        />
        <DocumentViewer
          title="文档 B"
          content={contentB || "请上传文档 B"}
          differences={differencesB}
          onDifferenceClick={handleDifferenceClick}
        />
      </div>

      <div className="h-80">
        <DiffReport
          differences={differences}
          onItemClick={handleDifferenceClick}
          selectedId={selectedDiffId}
        />
      </div>
    </div>
  );
}