import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { CheckSquare, ListFilter } from 'lucide-react';
import { api } from '../lib/api';
import { EmptyState, Skeleton, PriorityBadge, StatusBadge, Avatar } from '../components/ui';
import type { ApiResponse, Task, TaskPriority } from '../types';

const PRIORITY_ORDER: Record<TaskPriority, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

export const TasksPage: React.FC = () => {
  const navigate = useNavigate();
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | ''>('');

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Task[]>>('/tasks');
      return data.data;
    },
  });

  const filteredTasks = tasks
    ?.filter((task) => (priorityFilter ? task.priority === priorityFilter : true))
    .sort((a, b) => PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority]) ?? [];

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1>My Tasks</h1>
          <p>{filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div className="input-icon-wrapper" style={{ width: 180 }}>
            <ListFilter size={16} className="input-icon" />
            <select
              className="input"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | '')}
              style={{ paddingLeft: '2.5rem' }}
            >
              <option value="">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card" style={{ height: 100 }}>
              <Skeleton height="1.5rem" width="40%" style={{ marginBottom: '0.5rem' }} />
              <Skeleton height="1rem" width="20%" />
            </div>
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        <EmptyState message="No tasks found" icon={<CheckSquare size={48} />} />
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Task</th>
                <th>Project</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Due Date</th>
                <th>Assignee</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task) => (
                <tr 
                  key={task.id} 
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/tasks/${task.id}`)}
                  className="hover-row"
                >
                  <td>
                    <span className="font-medium">{task.title}</span>
                    {task.isOverdue && <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', color: 'var(--status-overdue)', border: '1px solid currentColor', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>OVERDUE</span>}
                  </td>
                  <td className="text-secondary">{task.project?.name ?? '—'}</td>
                  <td><PriorityBadge priority={task.priority} /></td>
                  <td><StatusBadge status={task.status} /></td>
                  <td className="text-sm text-secondary">{new Date(task.dueDate).toLocaleDateString()}</td>
                  <td>
                    {task.assignee ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Avatar name={task.assignee.name} size="sm" />
                        <span className="text-sm text-secondary">{task.assignee.name}</span>
                      </div>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
