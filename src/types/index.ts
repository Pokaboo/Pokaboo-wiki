export interface Module {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  order: number;
  createdAt: string;
}

export interface Category {
  id: string;
  user_id: string;
  moduleId: string;
  parentId: string | null;
  name: string;
  order: number;
}

export interface Note {
  id: string;
  user_id: string;
  categoryId: string;
  title: string;
  summary: string;
  content: string;
  tags: string[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  status: 'learning' | 'completed' | 'review';
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StudyRecord {
  id: string;
  user_id: string;
  date: string;
  durationMinutes: number;
  notesCount: number;
}
