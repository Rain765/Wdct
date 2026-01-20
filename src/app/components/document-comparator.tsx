import { useMemo, useRef, useState, useEffect } from "react";
import DiffMatchPatch from "diff-match-patch";
import { DocumentViewer } from "./document-viewer";
import { DiffReport, DiffItem } from "./diff-report";
import { Loader2 } from "lucide-react";
import mammoth from "mammoth";

interface DocumentComparatorProps {
  fileA: File | null;
  fileB: File | null;
}

export interface DifferenceSegment {
  id: number;
  type: "addition" | "deletion";
  line: number; // 0-based line index (split by \n)
  startCol: number; // 0-based column in the line
  endCol: number; // exclusive
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
    DifferenceSegment[]
  >([]);
  const [differencesB, setDifferencesB] = useState<
    DifferenceSegment[]
  >([]);
  const [selectedDiffId, setSelectedDiffId] = useState<
    number | undefined
  >();
  const [isComparing, setIsComparing] = useState(false);
  const lastComparedKeyRef = useRef<string>("");

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

  const compareKey = useMemo(() => {
    // Avoid comparing huge strings in deps; use file metadata + content length as a coarse key.
    // If content changes but length stays the same, diff might not refresh; include a small prefix.
    const metaA = fileA
      ? `${fileA.name}:${fileA.size}:${fileA.lastModified}`
      : "noA";
    const metaB = fileB
      ? `${fileB.name}:${fileB.size}:${fileB.lastModified}`
      : "noB";
    const sigA = `${contentA.length}:${contentA.slice(0, 32)}`;
    const sigB = `${contentB.length}:${contentB.slice(0, 32)}`;
    return `${metaA}|${metaB}|${sigA}|${sigB}`;
  }, [fileA, fileB, contentA, contentB]);

  // 执行对比（自动触发）
  const performComparison = () => {
    if (!contentA || !contentB) return;

    setIsComparing(true);

    // Run in next tick to allow UI to show "comparing" state.
    queueMicrotask(() => {
      const dmp = new DiffMatchPatch();
      const diffs = dmp.diff_main(contentA, contentB);

      const diffItems: DiffItem[] = [];
      const diffsA: DifferenceSegment[] = [];
      const diffsB: DifferenceSegment[] = [];
      let diffId = 1;

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

      const addSegmentsForText = (
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

            const segment: DifferenceSegment = {
              id: nextId,
              type: which === "A" ? "deletion" : "addition",
              line,
              startCol: col,
              endCol: col + chunk.length,
              text: chunk,
            };

            if (which === "A") diffsA.push(segment);
            else diffsB.push(segment);

            nextId++;
          }

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
          diffId = addSegmentsForText("A", text, cursorA, diffId);
          advanceCursor(cursorA, text);
        } else if (type === 1) {
          diffId = addSegmentsForText("B", text, cursorB, diffId);
          advanceCursor(cursorB, text);
        } else {
          advanceCursor(cursorA, text);
          advanceCursor(cursorB, text);
        }
      });

      setDifferences(diffItems);
      setDifferencesA(diffsA);
      setDifferencesB(diffsB);
      setIsComparing(false);
    });
  };

  const handleDifferenceClick = (id: number) => {
    setSelectedDiffId(id);
  };

  const canCompare = fileA && fileB && contentA && contentB;

  useEffect(() => {
    if (!canCompare) return;
    if (isComparing) return;
    if (lastComparedKeyRef.current === compareKey) return;

    lastComparedKeyRef.current = compareKey;
    setSelectedDiffId(undefined);
    performComparison();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canCompare, compareKey]);

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">文档对比</h2>
        {isComparing && (
          <div className="flex items-center text-sm text-gray-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            对比中...
          </div>
        )}
      </div>

      <div className="h-[500px]">
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
          selectedId={selectedDiffId}
        />
        <DocumentViewer
          title="文档 B"
          content={contentB || "请上传文档 B"}
          differences={differencesB}
          onDifferenceClick={handleDifferenceClick}
          selectedId={selectedDiffId}
        />
      </div>
    </div>
  );
}