import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import {
  CheckSquare,
  Plus,
  Calendar,
  Clock,
  User,
  Trash2,
  List,
  Columns,
  CheckCircle2,
  Check,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../contexts/ToastContext';
import { Task, TaskPriority, TaskStatus } from '../../types';

export const TasksPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { success } = useToast();

  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const { register, handleSubmit, reset } = useForm();

  // Query tasks
  const { data: tasksResponse, isLoading } = useQuery({
    queryKey: ['tasks', { status: statusFilter, priority: priorityFilter }],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...(statusFilter && { status: statusFilter }),
        ...(priorityFilter && { priority: priorityFilter }),
      });
      const res = await apiClient.get(`/tasks?${params.toString()}`);
      return res.data;
    },
  });

  // Query team members
  const { data: teamData } = useQuery({
    queryKey: ['team', 'members'],
    queryFn: async () => {
      const res = await apiClient.get('/organizations/members');
      return res.data.data.members;
    },
  });

  // Mutation: Update status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TaskStatus }) => {
      return apiClient.patch(`/tasks/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      success('Status Updated', 'Task has been updated.');
    },
  });

  // Mutation: Create Task
  const createTaskMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiClient.post('/tasks', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      setIsAddModalOpen(false);
      reset();
      success('Task Created', 'New task added to queue.');
    },
  });

  // Mutation: Delete Task
  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      success('Task Deleted', 'Task removed.');
    },
  });

  const tasks: Task[] = tasksResponse?.data || [];
  const summary = tasksResponse?.meta?.summary || { total: 0, todo: 0, inProgress: 0, completed: 0 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Task Operations</h1>
          <p className="text-xs text-slate-500 mt-1">
            Organize sales discovery follow-ups, contract reviews, and scheduled meetings.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="p-1 bg-slate-200/80 rounded-xl flex items-center gap-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              List
            </button>
            <button
              onClick={() => setViewMode('board')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'board' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              Board
            </button>
          </div>

          <Button onClick={() => setIsAddModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
            New Task
          </Button>
        </div>
      </div>

      {/* Summary KPI Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <span className="text-slate-500 font-medium">All Tasks</span>
          <span className="text-lg font-black text-slate-900">{summary.total}</span>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <span className="text-slate-500 font-medium">To Do</span>
          <span className="text-lg font-black text-indigo-600">{summary.todo}</span>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <span className="text-slate-500 font-medium">In Progress</span>
          <span className="text-lg font-black text-sky-600">{summary.inProgress}</span>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <span className="text-slate-500 font-medium">Completed</span>
          <span className="text-lg font-black text-emerald-600">{summary.completed}</span>
        </div>
      </div>

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
          {tasks.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">No tasks found</div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() =>
                      updateStatusMutation.mutate({
                        id: task.id,
                        status: task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED',
                      })
                    }
                    className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all duration-150 shrink-0 cursor-pointer ${
                      task.status === 'COMPLETED'
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs scale-105'
                        : 'border-slate-300 hover:border-indigo-500 bg-white hover:bg-indigo-50/60'
                    }`}
                    aria-label={`Mark ${task.title} as ${task.status === 'COMPLETED' ? 'incomplete' : 'complete'}`}
                  >
                    {task.status === 'COMPLETED' && <Check className="w-3 h-3 stroke-[3]" />}
                  </button>
                  <div className="truncate">
                    <p
                      className={`text-xs font-bold truncate ${
                        task.status === 'COMPLETED' ? 'line-through text-slate-400' : 'text-slate-900'
                      }`}
                    >
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-[11px] text-slate-500 truncate">{task.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs shrink-0">
                  <Badge statusValue={task.priority}>{task.priority}</Badge>
                  <Badge statusValue={task.status}>{task.status.replace('_', ' ')}</Badge>

                  {task.dueDate && (
                    <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                    </div>
                  )}

                  {task.assignedToUser && (
                    <div className="hidden md:flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-slate-200 text-[10px] font-bold flex items-center justify-center">
                        {task.assignedToUser.firstName?.[0]}
                      </div>
                      <span className="text-[11px] text-slate-700">{task.assignedToUser.firstName}</span>
                    </div>
                  )}

                  <button
                    onClick={() => deleteTaskMutation.mutate(task.id)}
                    className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Board View */}
      {viewMode === 'board' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(['TODO', 'IN_PROGRESS', 'COMPLETED'] as TaskStatus[]).map((st) => {
            const groupTasks = tasks.filter((t) => t.status === st);
            return (
              <div key={st} className="bg-slate-100/70 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h3 className="text-xs font-bold text-slate-800">{st.replace('_', ' ')}</h3>
                  <span className="text-[10px] font-bold bg-white text-slate-700 px-2 py-0.5 rounded-full shadow-sm">
                    {groupTasks.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {groupTasks.map((t) => (
                    <div key={t.id} className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm space-y-2">
                      <p className="text-xs font-bold text-slate-900">{t.title}</p>
                      <div className="flex items-center justify-between text-[10px]">
                        <Badge statusValue={t.priority} size="sm">{t.priority}</Badge>
                        <span className="text-slate-400">
                          {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'No date'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Task Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create New Task"
        description="Schedule a task for yourself or a sales teammate"
      >
        <form onSubmit={handleSubmit((data) => createTaskMutation.mutate(data))} className="space-y-4">
          <Input label="Task Title" required placeholder="E.g. Follow up on proposal with Marcus" {...register('title', { required: true })} />
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Description</label>
            <textarea
              rows={2}
              placeholder="Task details and deliverables..."
              className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              {...register('description')}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Priority"
              options={[
                { value: 'LOW', label: 'Low' },
                { value: 'MEDIUM', label: 'Medium' },
                { value: 'HIGH', label: 'High' },
                { value: 'URGENT', label: 'Urgent' },
              ]}
              defaultValue="MEDIUM"
              {...register('priority')}
            />
            <Select
              label="Status"
              options={[
                { value: 'TODO', label: 'To Do' },
                { value: 'IN_PROGRESS', label: 'In Progress' },
                { value: 'COMPLETED', label: 'Completed' },
              ]}
              defaultValue="TODO"
              {...register('status')}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Due Date" type="date" {...register('dueDate')} />
            <Select
              label="Assign To"
              placeholder="Select member"
              options={(teamData || []).map((m: any) => ({
                value: m.user.id,
                label: `${m.user.firstName} ${m.user.lastName}`,
              }))}
              {...register('assignedToUserId')}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createTaskMutation.isPending}>
              Create Task
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
