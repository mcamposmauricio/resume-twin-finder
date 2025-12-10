import { useState, useCallback } from "react";
import { Upload, FileText, X, AlertCircle, ArrowRight } from "lucide-react";
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
          content: content.split(",")[1] || content,
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
    <div className="max-w-3xl mx-auto p-6 md:p-8 animate-fade-in">
      {/* Step 1: Upload */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
            1
          </div>
          <h2 className="text-xl font-semibold text-foreground">
            Upload de Currículos
          </h2>
        </div>
        <p className="text-muted-foreground mb-6 ml-11">
          Arraste e solte os currículos ou clique para selecionar. Aceita PDF, TXT e DOCX.
        </p>

        {/* Drop Zone */}
        <div
          className={`ml-11 border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${
            dragActive
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-muted/50"
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
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Upload className="w-8 h-8 text-primary" />
          </div>
          <p className="text-lg font-medium text-foreground mb-1">
            Arraste os currículos aqui
          </p>
          <p className="text-muted-foreground">ou clique para selecionar</p>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="ml-11 mt-4 space-y-2">
            {files.map((file) => (
              <div
                key={file.name}
                className="flex items-center justify-between p-3 bg-muted rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-primary" />
                  <span className="text-foreground font-medium">{file.name}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(file.name);
                  }}
                  className="p-1.5 hover:bg-background rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Step 2: Job Description */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
            2
          </div>
          <h2 className="text-xl font-semibold text-foreground">
            Descrição da Vaga
          </h2>
        </div>
        <p className="text-muted-foreground mb-6 ml-11">
          Cole a descrição completa da vaga, incluindo requisitos e responsabilidades.
        </p>
        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Cole aqui a descrição da vaga..."
          className="input-clean ml-11 h-48 resize-none"
          style={{ width: 'calc(100% - 44px)' }}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 ml-11 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Analyze Button */}
      <div className="ml-11">
        <button
          onClick={handleSubmit}
          disabled={isLoading || files.length === 0 || !jobDescription.trim()}
          className="btn-primary w-full py-4 text-base"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Analisando...
            </span>
          ) : (
            <>
              Analisar Candidatos
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
