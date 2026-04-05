import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePipelineStages } from '@/hooks/usePipelineStages';
import { PipelineStage, STAGE_ICONS } from '@/types/pipeline';
import { StageIcon } from '@/components/jobs/StageIcon';

interface SortableStageItemProps {
  stage: PipelineStage;
  onEdit: () => void;
  onDelete: () => void;
}

function SortableStageItem({ stage, onEdit, onDelete }: SortableStageItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-card border rounded-lg"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="h-5 w-5" />
      </button>

      <div
        className="w-3 h-3 rounded-full shrink-0"
        style={{ backgroundColor: stage.color }}
      />

      <StageIcon icon={stage.icon} className="h-4 w-4 text-muted-foreground shrink-0" />

      <span className="flex-1 font-medium truncate">{stage.name}</span>

      {stage.is_default && (
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
          Padrão
        </span>
      )}

      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
        <Pencil className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-destructive hover:text-destructive"
        onClick={onDelete}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

interface StageFormData {
  name: string;
  slug: string;
  color: string;
  icon: string;
  is_default: boolean;
}

interface PipelineStagesEditorProps {
  userId?: string;
}

export function PipelineStagesEditor({ userId }: PipelineStagesEditorProps) {
  const { stages, loading, createStage, updateStage, deleteStage, reorderStages } =
    usePipelineStages(userId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<PipelineStage | null>(null);
  const [formData, setFormData] = useState<StageFormData>({
    name: '',
    slug: '',
    color: '#6B7280',
    icon: 'inbox',
    is_default: false,
  });
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = stages.findIndex((s) => s.id === active.id);
      const newIndex = stages.findIndex((s) => s.id === over.id);

      const reordered = arrayMove(stages, oldIndex, newIndex).map((s, i) => ({
        ...s,
        order: i,
      }));

      reorderStages(reordered);
    }
  };

  const openCreateDialog = () => {
    setEditingStage(null);
    setFormData({
      name: '',
      slug: '',
      color: '#6B7280',
      icon: 'inbox',
      is_default: false,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (stage: PipelineStage) => {
    setEditingStage(stage);
    setFormData({
      name: stage.name,
      slug: stage.slug,
      color: stage.color,
      icon: stage.icon,
      is_default: stage.is_default,
    });
    setDialogOpen(true);
  };

  const handleNameChange = (value: string) => {
    const slug = value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');

    setFormData((prev) => ({
      ...prev,
      name: value,
      slug: editingStage ? prev.slug : slug,
    }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;

    setSaving(true);
    try {
      if (editingStage) {
        await updateStage(editingStage.id, {
          name: formData.name,
          color: formData.color,
          icon: formData.icon,
          is_default: formData.is_default,
        });
      } else {
        await createStage({
          name: formData.name,
          slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '_'),
          color: formData.color,
          icon: formData.icon,
          order: stages.length,
          is_default: formData.is_default,
        });
      }
      setDialogOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [stageToDelete, setStageToDelete] = useState<PipelineStage | null>(null);

  const handleDeleteRequest = (stage: PipelineStage) => {
    if (stage.is_default) return;
    setStageToDelete(stage);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (stageToDelete) {
      await deleteStage(stageToDelete.id);
      setStageToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Etapas do Pipeline</CardTitle>
              <CardDescription>
                Configure as etapas pelas quais os candidatos passam durante o processo seletivo
              </CardDescription>
            </div>
            <Button onClick={openCreateDialog} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nova Etapa
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Arraste para reordenar as etapas
          </p>

          {stages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma etapa configurada. Crie sua primeira etapa.
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={stages.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {stages.map((stage) => (
                    <SortableStageItem
                      key={stage.id}
                      stage={stage}
                      onEdit={() => openEditDialog(stage)}
                      onDelete={() => handleDeleteRequest(stage)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingStage ? 'Editar Etapa' : 'Nova Etapa'}
            </DialogTitle>
            <DialogDescription>
              Configure os detalhes desta etapa do pipeline
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="stageName">Nome da etapa</Label>
              <Input
                id="stageName"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Ex: Entrevista Técnica"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stageColor">Cor</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    id="stageColor"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, color: e.target.value }))
                    }
                    className="w-10 h-10 rounded border cursor-pointer"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, color: e.target.value }))
                    }
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stageIcon">Ícone</Label>
                <Select
                  value={formData.icon}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, icon: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        <StageIcon icon={formData.icon} className="h-4 w-4" />
                        <span className="capitalize">{formData.icon.replace('-', ' ')}</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {STAGE_ICONS.map((icon) => (
                      <SelectItem key={icon} value={icon}>
                        <div className="flex items-center gap-2">
                          <StageIcon icon={icon} className="h-4 w-4" />
                          <span className="capitalize">{icon.replace('-', ' ')}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving || !formData.name.trim()}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingStage ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir etapa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a etapa "{stageToDelete?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
