import { useState, useCallback } from "react";
import { Upload, FileText, X, AlertCircle } from "lucide-react";
import { UploadedFile } from "@/types";

interface InputSectionProps {
  onAnalyze: (files: UploadedFile[], jobDescription: string) => void;
  isLoading: boolean;
}

export function InputSection({ onAnalyze, isLoading }: InputSectionProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [jobDescription, setJobDescription] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = async (file: File): Promise<UploadedFile | null> => {
    const allowedTypes = [
      "application/pdf",
      "text/plain",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    const allowedExtensions = [".pdf", ".txt", ".docx"];

    const extension = "." + file.name.split(".").pop()?.toLowerCase();
    if (
      !allowedTypes.includes(file.type) &&
      !allowedExtensions.includes(extension)
    ) {
      return null;
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve({
          name: file.name,
          type: file.type || `application/${extension.slice(1)}`,
          content: content.split(",")[1] || content, // Remove data URL prefix if present
        });
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  };

  const handleFiles = useCallback(
    async (fileList: FileList) => {
      setError(null);
      const newFiles: UploadedFile[] = [];
      const invalidFiles: string[] = [];

      for (const file of Array.from(fileList)) {
        const processed = await processFile(file);
        if (processed) {
          // Check for duplicates
          if (
            !files.some((f) => f.name === processed.name) &&
            !newFiles.some((f) => f.name === processed.name)
          ) {
            newFiles.push(processed);
          }
        } else {
          invalidFiles.push(file.name);
        }
      }

      if (invalidFiles.length > 0) {
        setError(
          `Arquivos não suportados: ${invalidFiles.join(", ")}. Use PDF, TXT ou DOCX.`
        );
      }

      if (newFiles.length > 0) {
        setFiles((prev) => [...prev, ...newFiles]);
      }
    },
    [files]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files);
      }
    },
    [handleFiles]
  );

  const removeFile = useCallback((fileName: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== fileName));
  }, []);

  const handleSubmit = () => {
    if (files.length === 0) {
      setError("Por favor, adicione pelo menos um currículo.");
      return;
    }
    if (!jobDescription.trim()) {
      setError("Por favor, preencha a descrição da vaga.");
      return;
    }
    setError(null);
    onAnalyze(files, jobDescription);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          Upload de Currículos
        </h2>
        <p className="text-slate-600">
          Arraste e solte os currículos ou clique para selecionar. Aceita PDF,
          TXT e DOCX.
        </p>
      </div>

      {/* Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer mb-6 ${
          dragActive
            ? "border-blue-500 bg-blue-50"
            : "border-slate-300 hover:border-blue-400 hover:bg-slate-50"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => document.getElementById("file-input")?.click()}
      >
        <input
          id="file-input"
          type="file"
          multiple
          accept=".pdf,.txt,.docx"
          onChange={handleFileInput}
          className="hidden"
        />
        <Upload className="w-12 h-12 text-blue-500 mx-auto mb-4" />
        <p className="text-lg font-medium text-slate-700">
          Arraste os currículos aqui
        </p>
        <p className="text-slate-500 mt-1">ou clique para selecionar</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-slate-700 mb-3">
            Arquivos Selecionados ({files.length})
          </h3>
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.name}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-500" />
                  <span className="text-slate-700 font-medium">{file.name}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(file.name);
                  }}
                  className="p-1 hover:bg-slate-200 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Job Description */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          Descrição da Vaga
        </h2>
        <p className="text-slate-600 mb-4">
          Cole a descrição completa da vaga, incluindo requisitos e
          responsabilidades.
        </p>
        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Cole aqui a descrição da vaga..."
          className="w-full h-48 p-4 border border-slate-300 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
        />
      </div>

      {/* Analyze Button */}
      <button
        onClick={handleSubmit}
        disabled={isLoading || files.length === 0 || !jobDescription.trim()}
        className="w-full py-4 bg-blue-700 text-white rounded-xl text-lg font-semibold hover:bg-blue-800 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
      >
        {isLoading ? "Analisando..." : "Analisar Candidatos"}
      </button>
    </div>
  );
}
