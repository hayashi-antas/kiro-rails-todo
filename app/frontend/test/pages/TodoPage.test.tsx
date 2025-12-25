import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { TodoPage } from '../../pages/TodoPage';

// Mock the TodoList component
vi.mock('../../components/TodoList', () => ({
  TodoList: () => <div data-testid="todo-list">Mocked TodoList Component</div>,
}));

describe('TodoPage', () => {
  it('renders todo page with header and TodoList component', () => {
    render(<TodoPage />);

    expect(screen.getByText('My Todos')).toBeInTheDocument();
    expect(screen.getByText('Manage your tasks with drag-and-drop reordering')).toBeInTheDocument();
    expect(screen.getByTestId('todo-list')).toBeInTheDocument();
  });

  it('displays the correct page title', () => {
    render(<TodoPage />);

    const title = screen.getByText('My Todos');
    expect(title).toBeInTheDocument();
    expect(title.tagName).toBe('H1');
  });

  it('shows descriptive text about functionality', () => {
    render(<TodoPage />);

    const description = screen.getByText('Manage your tasks with drag-and-drop reordering');
    expect(description).toBeInTheDocument();
    expect(description.tagName).toBe('P');
  });

  it('renders with correct structure and styling classes', () => {
    render(<TodoPage />);

    const todoPage = document.querySelector('.todo-page');
    const todoHeader = document.querySelector('.todo-header');

    expect(todoPage).toBeInTheDocument();
    expect(todoHeader).toBeInTheDocument();
  });

  it('includes the TodoList component', () => {
    render(<TodoPage />);

    const todoList = screen.getByTestId('todo-list');
    expect(todoList).toBeInTheDocument();
    expect(todoList).toHaveTextContent('Mocked TodoList Component');
  });
});