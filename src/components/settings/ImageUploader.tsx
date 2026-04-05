import { useState, useRef, useCallback } from 'react';
import { Upload, Link, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  hint?: string;
  accept?: string;
  aspectRatio?: string; // e.g. "16/5" for hero, "1/1" for logo
  maxSizeMB?: number;
}

export function ImageUploader({
  value,
  onChange,
  label,
  hint,
  accept = 'image/png,image/jpeg,image/svg+xml,image/webp',
  aspectRatio,
  maxSizeMB = 5,
}: ImageUploaderProps) {
  const { userId } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlValue, setUrlValue] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(
    async (file: File) => {
      if (!userId) return;
      if (file.size > maxSizeMB * 1024 * 1024) {
        toast.error(`Arquivo muito grande. Máximo: ${maxSizeMB}MB`);
        return;
      }

      setUploading(true);
      try {
        const ext = file.name.split('.').pop();
        const path = `${userId}/${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from('company-assets')
          .upload(path, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from('company-assets')
          .getPublicUrl(path);

        onChange(data.publicUrl);
        toast.success('Imagem enviada com sucesso!');
      } catch (error: any) {
        console.error('Upload error:', error);
        toast.error('Erro ao enviar imagem');
      } finally {
        setUploading(false);
      }
    },
    [userId, maxSizeMB, onChange]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      uploadFile(file);
    }
  };

  const handleUrlSubmit = () => {
    if (urlValue.trim()) {
      onChange(urlValue.trim());
      setUrlValue('');
      setShowUrlInput(false);
    }
  };

  const handleRemove = () => {
    onChange('');
  };

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative group">
          <div
            className="rounded-lg overflow-hidden border bg-muted"
            style={{ aspectRatio: aspectRatio || 'auto' }}
          >
            <img
              src={value}
              alt={label || 'Preview'}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = '';
                e.currentTarget.alt = 'Erro ao carregar imagem';
              }}
            />
          </div>
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="h-8 w-8 shadow-md"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="h-8 w-8 shadow-md"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer',
            dragOver
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50'
          )}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2 py-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Enviando...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-2">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Arraste uma imagem ou clique para enviar
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, SVG ou WebP (máx. {maxSizeMB}MB)
              </p>
            </div>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />

      {!showUrlInput ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-xs"
          onClick={() => setShowUrlInput(true)}
        >
          <Link className="h-3 w-3 mr-1" />
          Usar URL externa
        </Button>
      ) : (
        <div className="flex gap-2">
          <Input
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
            placeholder="https://exemplo.com/imagem.png"
            className="text-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
          />
          <Button
            type="button"
            size="sm"
            onClick={handleUrlSubmit}
            disabled={!urlValue.trim()}
          >
            OK
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowUrlInput(false);
              setUrlValue('');
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
