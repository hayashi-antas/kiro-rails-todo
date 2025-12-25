import React from 'react';
import { TodoList } from '../components/TodoList';

export function TodoPage() {
  return (
    <div className="todo-page">
      <div className="todo-header">
        <h1>My Todos</h1>
        <p>Manage your tasks with drag-and-drop reordering</p>
      </div>
      
      <TodoList />

      <style jsx>{`
        .todo-page {
          max-width: 800px;
          margin: 0 auto;
        }

        .todo-header {
          margin-bottom: 2rem;
          text-align: center;
        }

        .todo-header h1 {
          margin: 0 0 0.5rem 0;
          color: #24292f;
          font-size: 2rem;
          font-weight: 600;
        }

        .todo-header p {
          margin: 0;
          color: #656d76;
          font-size: 1.125rem;
        }

        @media (max-width: 768px) {
          .todo-header h1 {
            font-size: 1.5rem;
          }

          .todo-header p {
            font-size: 1rem;
          }
        }
      `}</style>
    </div>
  );
}