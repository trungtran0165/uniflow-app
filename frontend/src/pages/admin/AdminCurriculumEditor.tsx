import "react-quill/dist/quill.snow.css";

import { FileDown, FileUp, ImagePlus, RefreshCcw, Save } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import ReactQuill from "react-quill";

import type { CurriculumSystem } from "@/data/curriculumPrograms";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  findProgram,
  listCohorts,
  listMajors,
  loadCurriculumPrograms,
  resetCurriculumPrograms,
  saveCurriculumPrograms,
} from "@/lib/curriculumStore";
import { toast } from "@/components/ui/use-toast";
import { CurriculumHtmlViewer } from "@/components/CurriculumHtmlViewer";

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function readFileAsDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Không thể đọc file ảnh."));
    reader.readAsDataURL(file);
  });
}

const AdminCurriculumEditor = () => {
  const quillRef = useRef<ReactQuill | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const [programs, setPrograms] = useState(() => loadCurriculumPrograms());
  const [system, setSystem] = useState<CurriculumSystem | "">("");
  const [cohort, setCohort] = useState<string>("");
  const [major, setMajor] = useState<string>("");

  const cohorts = useMemo(() => listCohorts(programs, system || undefined), [programs, system]);
  const majors = useMemo(() => listMajors(programs, system || undefined, cohort || undefined), [programs, system, cohort]);

  const selectedProgram = useMemo(
    () => findProgram(programs, system || undefined, cohort || undefined, major || undefined),
    [programs, system, cohort, major],
  );

  const selectedHtml = useMemo(() => selectedProgram?.html ?? "", [selectedProgram?.html]);

  const onChangeHtml = (html: string) => {
    if (!selectedProgram) return;
    setPrograms((prev) =>
      prev.map((p) =>
        p.id === selectedProgram.id
          ? {
              ...p,
              html,
              updatedAt: new Date().toISOString(),
            }
          : p,
      ),
    );
  };

  const modules = useMemo(() => {
    return {
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "underline"],
          [{ list: "ordered" }, { list: "bullet" }],
          ["link", "image"],
          ["clean"],
        ],
        handlers: {
          image: () => imageInputRef.current?.click(),
        },
      },
    };
  }, []);

  const formats = ["header", "bold", "italic", "underline", "list", "bullet", "link", "image"];

  const handlePickImage = async (file: File | null) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Ảnh quá lớn", description: "Vui lòng chọn ảnh ≤ 2MB.", variant: "destructive" });
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const editor = quillRef.current?.getEditor();
      if (!editor) return;
      const range = editor.getSelection(true);
      const index = range?.index ?? editor.getLength();
      editor.insertEmbed(index, "image", dataUrl, "user");
      editor.setSelection(index + 1, 0);
      toast({ title: "Đã chèn ảnh", description: "Ảnh được nhúng dạng base64 trong nội dung HTML." });
    } catch (e) {
      toast({ title: "Không thể chèn ảnh", description: e instanceof Error ? e.message : "Lỗi không xác định.", variant: "destructive" });
    } finally {
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const handleExport = () => {
    downloadJson("curriculumPrograms.json", programs);
    toast({ title: "Đã export", description: "Tải xuống file JSON cấu hình CTĐT." });
  };

  const handleImport = async (file: File | null) => {
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      if (!Array.isArray(parsed)) {
        throw new Error("File JSON không hợp lệ (kỳ vọng là mảng).");
      }
      setPrograms(parsed as any);
      toast({ title: "Đã import", description: "Dữ liệu CTĐT đã được nạp vào editor (chưa lưu vào trình duyệt)." });
    } catch (e) {
      toast({ title: "Import thất bại", description: e instanceof Error ? e.message : "Lỗi không xác định.", variant: "destructive" });
    } finally {
      if (importInputRef.current) importInputRef.current.value = "";
    }
  };

  const handleSaveToBrowser = () => {
    saveCurriculumPrograms(programs);
    toast({ title: "Đã lưu", description: "Đã lưu cấu hình CTĐT." });
  };

  const handleResetToDefault = () => {
    resetCurriculumPrograms();
    setPrograms(loadCurriculumPrograms());
    toast({ title: "Đã reset", description: "Đã quay về dữ liệu mặc định trong app." });
  };

  return (
    <section aria-labelledby="admin-curriculum-editor-heading" className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 id="admin-curriculum-editor-heading" className="text-xl font-semibold md:text-2xl">
            Nội dung CTĐT (HTML)
          </h1>
          <p className="text-sm text-muted-foreground">
            Chỉnh sửa nội dung hiển thị cho sinh viên theo hệ đào tạo, khóa và ngành.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
            <FileDown className="h-4 w-4" />
            Export JSON
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => importInputRef.current?.click()}
          >
            <FileUp className="h-4 w-4" />
            Import JSON
          </Button>
          <Button size="sm" className="gap-2" onClick={handleSaveToBrowser}>
            <Save className="h-4 w-4" />
            Lưu
          </Button>
          <Button variant="ghost" size="sm" className="gap-2" onClick={handleResetToDefault}>
            <RefreshCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>
      </div>

      <Card className="glass-panel interactive-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Chọn CTĐT</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-2">
              <p className="stat-label">Hệ đào tạo</p>
              <Select
                value={system}
                onValueChange={(value: CurriculumSystem) => {
                  setSystem(value);
                  setCohort("");
                  setMajor("");
                }}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Chọn hệ đào tạo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chinh-quy">Hệ chính quy</SelectItem>
                  <SelectItem value="tu-xa">Hệ từ xa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className="stat-label">Khóa CTĐT</p>
              <Select
                value={cohort}
                onValueChange={(value) => {
                  setCohort(value);
                  setMajor("");
                }}
                disabled={!system}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder={system ? "Chọn khóa CTĐT" : "Chọn hệ đào tạo trước"} />
                </SelectTrigger>
                <SelectContent>
                  {cohorts.map((c) => (
                    <SelectItem key={c} value={c}>
                      CTĐT Khóa {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className="stat-label">Ngành</p>
              <Select value={major} onValueChange={setMajor} disabled={!system || !cohort}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder={system && cohort ? "Chọn ngành" : "Chọn hệ + khóa trước"} />
                </SelectTrigger>
                <SelectContent>
                  {majors.map((m) => (
                    <SelectItem key={m.major} value={m.major}>
                      {m.majorLabel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-xl border border-dashed bg-muted/30 p-3 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">Lưu ý</p>
            <p>
              Sau khi chỉnh sửa, bấm <span className="font-semibold">Lưu</span> để lưu vào trình duyệt. Muốn deploy, hãy{" "}
              <span className="font-semibold">Export JSON</span> rồi commit file vào repo.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
          <Card className="glass-panel interactive-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div className="min-w-0">
                <CardTitle className="text-base">Editor</CardTitle>
                <p className="text-xs text-muted-foreground">H1/H2, in đậm/nghiêng, chèn ảnh.</p>
              </div>
              <Badge variant="outline" className="gap-2 text-xs">
                <ImagePlus className="h-3.5 w-3.5" />
                Quill
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {!selectedProgram ? (
                <div className="rounded-xl border border-dashed bg-muted/30 p-8 text-center text-sm text-muted-foreground">
                  Chọn đủ hệ → khóa → ngành để bắt đầu chỉnh sửa.
                </div>
              ) : (
                <div className="rounded-xl border bg-card/70 p-2">
                  <ReactQuill
                    ref={(instance) => {
                      quillRef.current = instance;
                    }}
                    theme="snow"
                    value={selectedProgram.html}
                    onChange={onChangeHtml}
                    modules={modules}
                    formats={formats}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-panel interactive-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Preview (Sinh viên)</CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedProgram ? (
                <div className="rounded-xl border border-dashed bg-muted/30 p-8 text-center text-sm text-muted-foreground">
                  Preview sẽ hiển thị sau khi bạn chọn CTĐT.
                </div>
              ) : (
                <CurriculumHtmlViewer html={selectedHtml} />
              )}
            </CardContent>
          </Card>
      </div>

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void handlePickImage(e.target.files?.[0] ?? null)}
      />
      <input
        ref={importInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={(e) => void handleImport(e.target.files?.[0] ?? null)}
      />
    </section>
  );
};

export default AdminCurriculumEditor;


