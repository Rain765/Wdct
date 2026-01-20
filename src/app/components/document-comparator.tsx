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

      // 字符渲染参数
      const charWidth = 8; // 等宽字体下每个字符的宽度（px，近似）
      const lineHeight = 24; // 行高（px）
      const leftPadding = 32; // 左边距（px）
      const topPadding = 32; // 上边距（px）——与 DocumentViewer 的 p-8 对齐

      type Cursor = { line: number; col: number };
      const cursorA: Cursor = { line: 0, col: 0 };
      const cursorB: Cursor = { line: 0, col: 0 };

      const advanceCursor = (cursor: Cursor, text: string) => {
        const parts = text.split("\n");
        if (parts.length === 1) {
          cursor.col += text.length;
          return;
        }
        cursor.line += parts.length - 1;
        cursor.col = parts[parts.length - 1].length;
      };

      const addBoxesForText = (
        which: "A" | "B",
        text: string,
        baseCursor: Cursor,
        startingId: number,
      ): number => {
        const lines = text.split("\n");
        let line = baseCursor.line;
        let col = baseCursor.col;
        let nextId = startingId;

        lines.forEach((chunk, idx) => {
          if (chunk.length > 0) {
            const positionStr = `第 ${line + 1} 行，第 ${col + 1} 字符`;

            // 报告项（按 chunk 粒度）
            diffItems.push({
              id: nextId,
              type: which === "A" ? "deletion" : "addition",
              textA:
                which === "A"
                  ? chunk.substring(0, 50) + (chunk.length > 50 ? "..." : "")
                  : "",
              textB:
                which === "B"
                  ? chunk.substring(0, 50) + (chunk.length > 50 ? "..." : "")
                  : "",
              position: positionStr,
            });

            const box: Difference = {
              id: nextId,
              position: {
                x: leftPadding + col * charWidth,
                y: line * lineHeight + topPadding,
                width: chunk.length * charWidth,
                height: lineHeight - 4,
              },
              text: chunk,
            };

            if (which === "A") diffsA.push(box);
            else diffsB.push(box);

            nextId++;
          }

          // 推进到下一行 / 同一行后续
          if (idx < lines.length - 1) {
            line += 1;
            col = 0;
          } else {
            col += chunk.length;
          }
        });

        return nextId;
      };

      diffs.forEach((diff) => {
        const [type, text] = diff;

        if (type === -1) {
          // 删除的内容（在A中存在，B中不存在）
          diffId = addBoxesForText("A", text, cursorA, diffId);
          advanceCursor(cursorA, text);
        } else if (type === 1) {
          // 新增的内容（在B中存在，A中不存在）
          diffId = addBoxesForText("B", text, cursorB, diffId);
          advanceCursor(cursorB, text);
        } else {
          // 相同的内容
          advanceCursor(cursorA, text);
          advanceCursor(cursorB, text);
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

      <div className="h-72">
        <DiffReport
          differences={differences}
          onItemClick={handleDifferenceClick}
          selectedId={selectedDiffId}
        />
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
    </div>
  );
}