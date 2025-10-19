'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import {
  SaturnCard,
  SaturnCardHeader,
  SaturnCardTitle,
  SaturnCardContent,
  SaturnButton,
  SaturnTable,
  SaturnTableHeader,
  SaturnTableBody,
  SaturnTableRow,
  SaturnTableHead,
  SaturnTableCell,
} from '@/components/saturn';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { TagFormModal } from '@/components/tags/tag-form-modal';
import { Plus, Edit, Trash2 } from 'lucide-react';

interface Tag {
  id: string;
  name: string;
  createdAt: Date;
  _count: {
    MonitorTag: number;
  };
}

interface TagListProps {
  tags: Tag[];
  orgId: string;
}

export function TagList({ tags, orgId }: TagListProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingTag, setDeletingTag] = useState<Tag | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreate = () => {
    setEditingTag(null);
    setShowFormModal(true);
  };

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag);
    setShowFormModal(true);
  };

  const handleDelete = (tag: Tag) => {
    setDeletingTag(tag);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!deletingTag) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/tags/${deletingTag.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete tag');
      }

      toast({
        title: 'Success',
        description: 'Tag deleted successfully',
      });

      router.refresh();
      setShowDeleteDialog(false);
      setDeletingTag(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFormSuccess = () => {
    setShowFormModal(false);
    setEditingTag(null);
    router.refresh();
  };

  return (
    <>
      <SaturnCard>
        <SaturnCardHeader>
          <div className="flex items-center justify-between">
            <SaturnCardTitle>Tags</SaturnCardTitle>
            <SaturnButton onClick={handleCreate} icon={<Plus className="w-4 h-4" />}>
              Create Tag
            </SaturnButton>
          </div>
        </SaturnCardHeader>
        <SaturnCardContent>
          {tags.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[rgba(55,50,47,0.80)] font-sans mb-4">
                No tags created yet. Create your first tag to organize your monitors.
              </p>
              <SaturnButton onClick={handleCreate} icon={<Plus className="w-4 h-4" />}>
                Create Your First Tag
              </SaturnButton>
            </div>
          ) : (
            <SaturnTable>
              <SaturnTableHeader>
                <SaturnTableRow>
                  <SaturnTableHead>Name</SaturnTableHead>
                  <SaturnTableHead>Usage Count</SaturnTableHead>
                  <SaturnTableHead>Created</SaturnTableHead>
                  <SaturnTableHead className="w-24">Actions</SaturnTableHead>
                </SaturnTableRow>
              </SaturnTableHeader>
              <SaturnTableBody>
                {tags.map((tag) => (
                  <SaturnTableRow key={tag.id}>
                    <SaturnTableCell className="font-medium">{tag.name}</SaturnTableCell>
                    <SaturnTableCell>{tag._count.MonitorTag} monitors</SaturnTableCell>
                    <SaturnTableCell>
                      {new Date(tag.createdAt).toLocaleDateString()}
                    </SaturnTableCell>
                    <SaturnTableCell>
                      <div className="flex gap-2">
                        <SaturnButton
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(tag)}
                          icon={<Edit className="w-4 h-4" />}
                        >
                          Edit
                        </SaturnButton>
                        <SaturnButton
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(tag)}
                          icon={<Trash2 className="w-4 h-4" />}
                        >
                          Delete
                        </SaturnButton>
                      </div>
                    </SaturnTableCell>
                  </SaturnTableRow>
                ))}
              </SaturnTableBody>
            </SaturnTable>
          )}
        </SaturnCardContent>
      </SaturnCard>

      <TagFormModal
        open={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          setEditingTag(null);
        }}
        tag={editingTag}
        orgId={orgId}
        onSuccess={handleFormSuccess}
      />

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Tag</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingTag?.name}"? This will remove the tag from{' '}
              {deletingTag?._count.MonitorTag} monitors.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <SaturnButton
              variant="ghost"
              onClick={() => setShowDeleteDialog(false)}
              disabled={loading}
            >
              Cancel
            </SaturnButton>
            <SaturnButton
              variant="danger"
              onClick={confirmDelete}
              disabled={loading}
              loading={loading}
            >
              Delete Tag
            </SaturnButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
