'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  SaturnCard,
  SaturnCardHeader,
  SaturnCardTitle,
  SaturnCardDescription,
  SaturnCardContent,
  SaturnButton,
  SaturnBadge,
  SaturnTable,
  SaturnTableHeader,
  SaturnTableBody,
  SaturnTableRow,
  SaturnTableHead,
  SaturnTableCell,
} from '@/components/saturn';
import { Plus, Edit, Trash2, Tag as TagIcon } from 'lucide-react';
import { TagFormModal } from './tag-form-modal';
import { useToast } from '@/components/ui/use-toast';

type TagWithUsage = {
  id: string;
  name: string;
  color: string | null;
  orgId: string;
  usageCount: number;
  monitors: Array<{ id: string; name: string }>;
};

interface TagsListProps {
  tags: TagWithUsage[];
  orgId: string;
}

export function TagsList({ tags, orgId }: TagsListProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagWithUsage | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCreate = () => {
    setEditingTag(null);
    setModalOpen(true);
  };

  const handleEdit = (tag: TagWithUsage) => {
    setEditingTag(tag);
    setModalOpen(true);
  };

  const handleDelete = async (tag: TagWithUsage) => {
    const message = tag.usageCount > 0
      ? `Are you sure you want to delete "${tag.name}"? This will remove it from ${tag.usageCount} monitor(s).`
      : `Are you sure you want to delete "${tag.name}"?`;

    if (!confirm(message)) {
      return;
    }

    setDeletingId(tag.id);

    try {
      const response = await fetch(`/api/tags/${tag.id}`, {
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
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingTag(null);
  };

  return (
    <>
      <SaturnCard>
        <SaturnCardHeader>
          <div className="flex items-center justify-between">
            <div>
              <SaturnCardTitle as="h2">Tags</SaturnCardTitle>
              <SaturnCardDescription>
                Create and manage tags to organize your monitors
              </SaturnCardDescription>
            </div>
            <SaturnButton onClick={handleCreate} icon={<Plus className="w-4 h-4" />}>
              Create Tag
            </SaturnButton>
          </div>
        </SaturnCardHeader>
        <SaturnCardContent>
          {tags.length === 0 ? (
            <div className="text-center py-12 text-[rgba(55,50,47,0.80)]">
              <TagIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium font-sans">No tags yet</p>
              <p className="text-sm mt-2 font-sans">
                Create tags to organize and filter your monitors
              </p>
              <SaturnButton
                className="mt-4"
                icon={<Plus className="w-4 h-4" />}
                onClick={handleCreate}
              >
                Create Your First Tag
              </SaturnButton>
            </div>
          ) : (
            <SaturnTable>
              <SaturnTableHeader>
                <SaturnTableRow>
                  <SaturnTableHead>Name</SaturnTableHead>
                  <SaturnTableHead>Color</SaturnTableHead>
                  <SaturnTableHead>Usage</SaturnTableHead>
                  <SaturnTableHead className="text-right">Actions</SaturnTableHead>
                </SaturnTableRow>
              </SaturnTableHeader>
              <SaturnTableBody>
                {tags.map((tag) => (
                  <SaturnTableRow key={tag.id}>
                    <SaturnTableCell className="font-medium text-[#37322F]">
                      <div className="flex items-center gap-2">
                        <TagIcon className="w-4 h-4" style={{ color: tag.color || '#37322F' }} />
                        {tag.name}
                      </div>
                    </SaturnTableCell>
                    <SaturnTableCell>
                      {tag.color ? (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded border border-[rgba(55,50,47,0.16)]"
                            style={{ backgroundColor: tag.color }}
                          />
                          <span className="text-sm text-[rgba(55,50,47,0.60)] font-mono">
                            {tag.color.toUpperCase()}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[rgba(55,50,47,0.40)] text-sm">No color</span>
                      )}
                    </SaturnTableCell>
                    <SaturnTableCell>
                      {tag.usageCount > 0 ? (
                        <div className="flex items-center gap-2">
                          <SaturnBadge variant="default" size="sm">
                            {tag.usageCount} monitor{tag.usageCount !== 1 ? 's' : ''}
                          </SaturnBadge>
                          {tag.monitors.length > 0 && (
                            <span className="text-xs text-[rgba(55,50,47,0.60)]">
                              ({tag.monitors.slice(0, 2).map((m) => m.name).join(', ')}
                              {tag.monitors.length > 2 && `, +${tag.monitors.length - 2} more`})
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[rgba(55,50,47,0.40)] text-sm">Unused</span>
                      )}
                    </SaturnTableCell>
                    <SaturnTableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <SaturnButton
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(tag)}
                        >
                          <Edit className="h-4 w-4" />
                        </SaturnButton>
                        <SaturnButton
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(tag)}
                          disabled={deletingId === tag.id}
                        >
                          <Trash2 className="h-4 w-4" />
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
        open={modalOpen}
        onClose={handleCloseModal}
        orgId={orgId}
        tag={editingTag}
      />
    </>
  );
}