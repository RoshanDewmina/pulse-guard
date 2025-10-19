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
import { Calendar, Clock, Trash2, Plus, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { MaintenanceWindowModal } from './maintenance-window-modal';
import { useToast } from '@/components/ui/use-toast';

type MaintenanceWindow = {
  id: string;
  orgId: string;
  name: string;
  description: string | null;
  startAt: Date;
  endAt: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

interface MaintenanceWindowListProps {
  windows: MaintenanceWindow[];
  orgId: string;
}

export function MaintenanceWindowList({ windows, orgId }: MaintenanceWindowListProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingWindow, setEditingWindow] = useState<MaintenanceWindow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCreate = () => {
    setEditingWindow(null);
    setModalOpen(true);
  };

  const handleEdit = (window: MaintenanceWindow) => {
    setEditingWindow(window);
    setModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    setDeletingId(id);

    try {
      const response = await fetch(`/api/maintenance-windows/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.details || 'Failed to delete maintenance window');
      }

      toast({
        title: 'Success',
        description: 'Maintenance window deleted successfully',
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
    setEditingWindow(null);
  };

  const activeWindows = windows.filter(w => w.isActive);

  return (
    <>
      {/* Active Windows */}
      {activeWindows.length > 0 && (
        <SaturnCard className="border-yellow-300 bg-yellow-50">
          <SaturnCardHeader>
            <SaturnCardTitle as="h2" className="text-yellow-800 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Active Maintenance Windows
            </SaturnCardTitle>
          </SaturnCardHeader>
          <SaturnCardContent>
            <div className="space-y-2">
              {activeWindows.map(window => (
                <div key={window.id} className="flex items-center justify-between p-3 bg-white border border-yellow-200 rounded-lg">
                  <div>
                    <p className="font-medium text-[#37322F] font-sans">{window.name}</p>
                    <p className="text-sm text-[rgba(55,50,47,0.80)] font-sans">
                      {format(new Date(window.startAt), 'PPp')} - {format(new Date(window.endAt), 'p')}
                    </p>
                  </div>
                  <SaturnBadge variant="warning" size="sm">Active Now</SaturnBadge>
                </div>
              ))}
            </div>
          </SaturnCardContent>
        </SaturnCard>
      )}

      {/* All Windows */}
      <SaturnCard>
        <SaturnCardHeader>
          <div className="flex items-center justify-between">
            <div>
              <SaturnCardTitle as="h2">All Maintenance Windows</SaturnCardTitle>
              <SaturnCardDescription>
                Schedule periods where alerts will be suppressed
              </SaturnCardDescription>
            </div>
            <SaturnButton 
              onClick={handleCreate}
              icon={<Plus className="w-4 h-4" />}
            >
              Create Window
            </SaturnButton>
          </div>
        </SaturnCardHeader>
        <SaturnCardContent>
          {windows.length === 0 ? (
            <div className="text-center py-12 text-[rgba(55,50,47,0.80)]">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium font-sans">No maintenance windows</p>
              <p className="text-sm mt-2 font-sans">
                Create a maintenance window to suppress alerts during planned downtime
              </p>
              <SaturnButton 
                className="mt-4" 
                icon={<Plus className="w-4 h-4" />}
                onClick={handleCreate}
              >
                Create Maintenance Window
              </SaturnButton>
            </div>
          ) : (
            <SaturnTable>
              <SaturnTableHeader>
                <SaturnTableRow>
                  <SaturnTableHead>Name</SaturnTableHead>
                  <SaturnTableHead>Start Time</SaturnTableHead>
                  <SaturnTableHead>End Time</SaturnTableHead>
                  <SaturnTableHead>Status</SaturnTableHead>
                  <SaturnTableHead className="text-right">Actions</SaturnTableHead>
                </SaturnTableRow>
              </SaturnTableHeader>
              <SaturnTableBody>
                {windows.map(window => {
                  const now = new Date();
                  const startAt = new Date(window.startAt);
                  const endAt = new Date(window.endAt);
                  const isActive = window.isActive && startAt <= now && endAt >= now;
                  const isPast = endAt < now;

                  return (
                    <SaturnTableRow key={window.id}>
                      <SaturnTableCell className="font-medium text-[#37322F]">
                        {window.name}
                        {window.description && (
                          <p className="text-sm text-[rgba(55,50,47,0.60)] font-normal mt-1">
                            {window.description}
                          </p>
                        )}
                      </SaturnTableCell>
                      <SaturnTableCell className="text-[rgba(55,50,47,0.80)]">
                        {format(startAt, 'PPp')}
                      </SaturnTableCell>
                      <SaturnTableCell className="text-[rgba(55,50,47,0.80)]">
                        {format(endAt, 'PPp')}
                      </SaturnTableCell>
                      <SaturnTableCell>
                        {isActive ? (
                          <SaturnBadge variant="warning" size="sm">Active</SaturnBadge>
                        ) : isPast ? (
                          <SaturnBadge variant="default" size="sm">Completed</SaturnBadge>
                        ) : (
                          <SaturnBadge variant="default" size="sm">Scheduled</SaturnBadge>
                        )}
                      </SaturnTableCell>
                      <SaturnTableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <SaturnButton 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEdit(window)}
                            disabled={isPast}
                          >
                            <Edit className="h-4 w-4" />
                          </SaturnButton>
                          <SaturnButton 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDelete(window.id, window.name)}
                            disabled={deletingId === window.id || isActive}
                          >
                            <Trash2 className="h-4 w-4" />
                          </SaturnButton>
                        </div>
                      </SaturnTableCell>
                    </SaturnTableRow>
                  );
                })}
              </SaturnTableBody>
            </SaturnTable>
          )}
        </SaturnCardContent>
      </SaturnCard>

      <MaintenanceWindowModal
        open={modalOpen}
        onClose={handleCloseModal}
        orgId={orgId}
        window={editingWindow}
      />
    </>
  );
}

