// Todo types for the application

export interface Todo {
  id: number;
  title: string;
  status: 'open' | 'done';
  position: number;
  created_at: string;
}

export interface TodoFormData {
  title: string;
}

export interface TodoUpdateData {
  title?: string;
  status?: 'open' | 'done';
}

export interface TodoReorderUpdate {
  id: number;
  position: number;
}

export interface TodoApiResponse {
  success: boolean;
  todo?: Todo;
  error?: string;
  errors?: string[];
}

export interface TodoListResponse {
  todos: Todo[];
}

export interface TodoReorderResponse {
  success: boolean;
  message?: string;
  error?: string;
}