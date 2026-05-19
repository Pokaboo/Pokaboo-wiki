import { defineStore } from 'pinia';
import { supabase } from '../utils/supabase';
import type { Module, Category, Note, StudyRecord } from '../types';

export const useWikiStore = defineStore('wiki', {
  state: () => ({
    modules: [] as Module[],
    categories: [] as Category[],
    notes: [] as Note[],
    studyRecords: [] as StudyRecord[],
    isSearchOpen: false,
    loading: false,
  }),
  getters: {
    getNotesByCategory: (state) => {
      return (categoryId: string) => state.notes.filter(n => n.categoryId === categoryId);
    },
    getTreeByCategory: (state) => {
      return state.categories;
    },
    getAllNotes: (state) => {
      return state.notes;
    }
  },
  actions: {
    async fetchData() {
      this.loading = true;
      try {
        const [
          { data: modulesData, error: modErr },
          { data: categoriesData, error: catErr },
          { data: notesData, error: noteErr },
          { data: recordsData, error: recErr }
        ] = await Promise.all([
          supabase.from('modules').select('*').order('order', { ascending: true }),
          supabase.from('categories').select('*').order('order', { ascending: true }),
          supabase.from('notes').select('*').order('created_at', { ascending: false }),
          supabase.from('study_records').select('*')
        ]);

        if (modErr) throw modErr;
        if (catErr) throw catErr;
        if (noteErr) throw noteErr;
        if (recErr) throw recErr;

        // Convert db snake_case to camelCase where necessary
        this.modules = (modulesData || []).map(m => ({ ...m, createdAt: m.created_at })) as any;
        this.categories = (categoriesData || []).map(c => ({ ...c, moduleId: c.module_id, parentId: c.parent_id })) as any;
        this.notes = (notesData || []).map(n => ({ 
          ...n, 
          categoryId: n.category_id,
          isFavorite: n.is_favorite,
          createdAt: n.created_at,
          updatedAt: n.updated_at
        })) as any;
        this.studyRecords = (recordsData || []).map(r => ({
          ...r,
          durationMinutes: r.duration_minutes,
          notesCount: r.notes_count
        })) as any;

      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        this.loading = false;
      }
    },
    async createModule(name: string, icon: string = 'ri-book-2-line') {
      const colors = ['text-red-500', 'text-orange-500', 'text-amber-500', 'text-green-500', 'text-emerald-500', 'text-teal-500', 'text-cyan-500', 'text-blue-500', 'text-indigo-500', 'text-violet-500', 'text-purple-500', 'text-fuchsia-500', 'text-pink-500', 'text-rose-500'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('用户未登录');

      const order = this.modules.length + 1;
      const { data, error } = await supabase.from('modules').insert([
        { name, icon, color: randomColor, "order": order, user_id: userData.user.id }
      ]).select().single();

      if (error) {
        console.error('创建模块失败:', error);
        throw new Error(error.message || '创建模块失败');
      }
      const newModule = { ...data, createdAt: data.created_at } as Module;
      this.modules.push(newModule);
      return newModule;
    },
    async createCategory(moduleId: string, name: string) {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('用户未登录');

      const modCats = this.categories.filter(c => c.moduleId === moduleId && !c.parentId);
      const order = modCats.length + 1;
      
      const { data, error } = await supabase.from('categories').insert([
        { module_id: moduleId, parent_id: null, name, "order": order, user_id: userData.user.id }
      ]).select().single();

      if (error) {
        console.error('创建分类失败:', error);
        throw new Error(error.message || '创建分类失败');
      }
      const newCategory = { ...data, moduleId: data.module_id, parentId: data.parent_id } as Category;
      this.categories.push(newCategory);
      return newCategory;
    },
    async createNote(categoryId: string, title: string) {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('用户未登录');

      const { data, error } = await supabase.from('notes').insert([
        { 
          category_id: categoryId, 
          title, 
          summary: '新建笔记...',
          content: `# ${title}\n\n开始记录...`,
          tags: [],
          difficulty: 1,
          status: 'learning',
          is_favorite: false,
          user_id: userData.user.id
        }
      ]).select().single();

      if (error) {
        console.error('创建笔记失败:', error);
        throw new Error(error.message || '创建笔记失败');
      }
      
      const newNote = {
        ...data,
        categoryId: data.category_id,
        isFavorite: data.is_favorite,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      } as Note;

      this.notes.unshift(newNote);
      return newNote;
    },
    async updateNote(id: string, updates: Partial<Note>) {
      const index = this.notes.findIndex(n => n.id === id);
      if (index === -1) return;

      // Map camelCase to snake_case for DB
      const dbUpdates: any = { ...updates };
      if (updates.categoryId) dbUpdates.category_id = updates.categoryId; delete dbUpdates.categoryId;
      if (updates.isFavorite !== undefined) dbUpdates.is_favorite = updates.isFavorite; delete dbUpdates.isFavorite;
      delete dbUpdates.createdAt;
      delete dbUpdates.updatedAt;
      delete dbUpdates.user_id;
      delete dbUpdates.id;
      
      dbUpdates.updated_at = new Date().toISOString();

      const { error } = await supabase.from('notes').update(dbUpdates).eq('id', id);
      if (error) {
        console.error(error);
        return;
      }

      this.notes[index] = { ...this.notes[index], ...updates, updatedAt: dbUpdates.updated_at };
    },
    toggleSearch(val?: boolean) {
      if (val !== undefined) {
        this.isSearchOpen = val;
      } else {
        this.isSearchOpen = !this.isSearchOpen;
      }
    }
  }
});
