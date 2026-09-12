import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckSquare, ListFilter, Calendar } from 'lucide-react';
import { api } from '../lib/api';
import { EmptyState, Skeleton, PriorityBadge, StatusBadge, Avatar } from '../components/ui';
import type { ApiResponse, Task } from '../types';

export const TasksPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const priorityFilter = searchParams.get('priority') || '';
  const statusFilter = searchParams.get('status') || '';
  const dueDateFrom = searchParams.get('dueDateFrom') || '';
  const dueDateTo = searchParams.get('dueDateTo') || '';

  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) newParams.set(key, value);
    else newParams.delete(key);
    setSearchParams(newParams);
  };

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks', priorityFilter, statusFilter, dueDateFrom, dueDateTo],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Task[]>>('/tasks', {
        params: {
          priority: priorityFilter || undefined,
          status: statusFilter || undefined,
          dueDateFrom: dueDateFrom || undefined,
          dueDateTo: dueDateTo || undefined,
        },
      });
      return data.data;
    },
  });

  const filteredTasks = tasks ?? [];

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>My Tasks</h1>
          <p>{filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          
          <div className="input-icon-wrapper" style={{ width: 150 }}>
            <ListFilter size={16} className="input-icon" />
            <select
              className="input"
              value={statusFilter}
              onChange={(e) => updateFilter('status', e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            >
              <option value="">All Statuses</option>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="DONE">Done</option>
            </select>
          </div>

          <div className="input-icon-wrapper" style={{ width: 150 }}>
            <ListFilter size={16} className="input-icon" />
            <select
              className="input"
              value={priorityFilter}
              onChange={(e) => updateFilter('priority', e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            >
              <option value="">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div className="input-icon-wrapper" style={{ width: 140 }}>
            <Calendar size={16} className="input-icon" />
            <input 
              type="date" 
              className="input" 
              style={{ paddingLeft: '2.5rem', paddingRight: '0.5rem' }}
              value={dueDateFrom ? dueDateFrom.split('T')[0] : ''} 
              onChange={(e) => updateFilter('dueDateFrom', e.target.value ? new Date(e.target.value).toISOString() : '')} 
              title="Due Date From"
            />
          </div>
          <span className="text-secondary">-</span>
          <div className="input-icon-wrapper" style={{ width: 140 }}>
            <Calendar size={16} className="input-icon" />
            <input 
              type="date" 
              className="input" 
              style={{ paddingLeft: '2.5rem', paddingRight: '0.5rem' }}
              value={dueDateTo ? dueDateTo.split('T')[0] : ''} 
              onChange={(e) => updateFilter('dueDateTo', e.target.value ? new Date(e.target.value).toISOString() : '')}
              title="Due Date To"
            />
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
        <EmptyState message="No tasks found matching your filters" icon={<CheckSquare size={48} />} />
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
