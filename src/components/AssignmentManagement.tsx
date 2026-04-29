import { useState, useEffect, useMemo } from 'react';
import React from 'react';
import { 
  collection, query, where, onSnapshot, addDoc, deleteDoc, 
  doc, updateDoc, writeBatch, serverTimestamp 
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Assignment, Student, OperationType } from '../types';
import { handleFirestoreError } from '../lib/utils';
import { 
  ClipboardList, Plus, Calendar, CheckCircle2, Trash2, X, 
  ChevronLeft, ChevronRight, Users 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AssignmentManagementProps {
  classId: string;
}

interface AssignmentGroup {
  title: string;
  assignments: Assignment[];
  total: number;
  completed: number;
  description?: string;
  dueDate?: string;
  createdAt: any;
}

export default function AssignmentManagement({ classId }: AssignmentManagementProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGroupTitle, setSelectedGroupTitle] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.currentUser || !classId) return;

    const studentQ = query(
      collection(db, 'students'),
      where('teacherId', '==', auth.currentUser.uid),
      where('classId', '==', classId)
    );
    const unsubStudents = onSnapshot(studentQ, (snapshot) => {
      const data: Student[] = [];
      snapshot.forEach(doc => data.push({ id: doc.id, ...doc.data() } as Student));
      setStudents(data);
    });

    const assignmentQ = query(
      collection(db, 'assignments'),
      where('teacherId', '==', auth.currentUser.uid),
      where('classId', '==', classId)
    );
    const unsubAssignments = onSnapshot(assignmentQ, (snapshot) => {
      const data: Assignment[] = [];
      snapshot.forEach(doc => data.push({ id: doc.id, ...doc.data() } as Assignment));
      setAssignments(data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'assignments');
    });

    return () => { unsubStudents(); unsubAssignments(); };
  }, [classId]);

  // Group assignments by title
  const groupedAssignments = useMemo(() => {
    const groups = new Map<string, Assignment[]>();
    assignments.forEach(a => {
      const existing = groups.get(a.title) || [];
      existing.push(a);
      groups.set(a.title, existing);
    });
    return Array.from(groups.entries()).map(([title, items]) => ({
      title,
      assignments: items,
      total: items.length,
      completed: items.filter(a => a.status === 'completed').length,
      description: items[0].description,
      dueDate: items[0].dueDate,
      createdAt: items[0].createdAt,
    })).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  }, [assignments]);

  // Derive selected group from live data
  const selectedGroup = selectedGroupTitle 
    ? groupedAssignments.find(g => g.title === selectedGroupTitle) || null
    : null;

  // If selected group was deleted, go back
  useEffect(() => {
    if (selectedGroupTitle && !selectedGroup) setSelectedGroupTitle(null);
  }, [selectedGroup, selectedGroupTitle]);

  const toggleStatus = async (assignment: Assignment) => {
    const newStatus = assignment.status === 'pending' ? 'completed' : 'pending';
    try {
      await updateDoc(doc(db, 'assignments', assignment.id), {
        status: newStatus,
        completedAt: newStatus === 'completed' ? serverTimestamp() : null
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `assignments/${assignment.id}`);
    }
  };

  const handleDeleteGroup = async (group: AssignmentGroup) => {
    if (!confirm(`Delete "${group.title}" for all ${group.total} students?`)) return;
    try {
      const batch = writeBatch(db);
      group.assignments.forEach(a => batch.delete(doc(db, 'assignments', a.id)));
      await batch.commit();
      setSelectedGroupTitle(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'assignments');
    }
  };

  const handleDeleteSingle = async (id: string) => {
    if (!confirm('Remove this student\'s assignment?')) return;
    try {
      await deleteDoc(doc(db, 'assignments', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `assignments/${id}`);
    }
  };

  // ─── DETAIL VIEW ───
  if (selectedGroup) {
    const progress = selectedGroup.total > 0 
      ? Math.round((selectedGroup.completed / selectedGroup.total) * 100) 
      : 0;

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSelectedGroupTitle(null)}
              className="p-2.5 bg-white border border-zinc-200 rounded-xl text-zinc-400 hover:text-zinc-900 hover:border-zinc-900 transition-all shadow-sm"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="space-y-0.5">
              <h2 className="text-xl font-bold tracking-tight text-zinc-900">{selectedGroup.title}</h2>
              <p className="text-zinc-500 text-sm">
                {selectedGroup.completed}/{selectedGroup.total} students completed
              </p>
            </div>
          </div>
          <button 
            onClick={() => handleDeleteGroup(selectedGroup)}
            className="btn-secondary text-red-600 hover:bg-red-50 hover:border-red-200"
          >
            <Trash2 size={14} />
            Delete All
          </button>
        </div>

        {/* Info + Progress */}
        <div className="glass-panel p-6 space-y-4">
          {selectedGroup.description && (
            <p className="text-sm text-zinc-600 leading-relaxed">{selectedGroup.description}</p>
          )}
          <div className="flex items-center gap-4 flex-wrap">
            {selectedGroup.dueDate && (
              <div className="flex items-center gap-2 text-xs font-medium text-zinc-400">
                <Calendar size={14} />
                Due {new Date(selectedGroup.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            )}
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-400">
              <Users size={14} />
              {selectedGroup.total} students assigned
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-zinc-500">Progress</span>
              <span className="text-zinc-900">{progress}%</span>
            </div>
            <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${progress === 100 ? 'bg-emerald-500' : 'bg-zinc-900'}`}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>
        </div>

        {/* Student Checklist */}
        <div className="glass-panel">
          <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
            <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Student Progress</h3>
          </div>
          <div className="divide-y divide-zinc-100">
            {selectedGroup.assignments.map((assignment) => {
              const student = students.find(s => s.id === assignment.studentId);
              const isCompleted = assignment.status === 'completed';
              return (
                <div 
                  key={assignment.id}
                  className="px-6 py-4 flex items-center justify-between group hover:bg-zinc-50/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => toggleStatus(assignment)}
                      className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all ${
                        isCompleted 
                          ? 'bg-emerald-500 border-emerald-500 text-white' 
                          : 'bg-white border-zinc-200 hover:border-zinc-400'
                      }`}
                    >
                      {isCompleted && <CheckCircle2 size={16} />}
                    </button>
                    <div>
                      <p className={`font-semibold text-sm ${isCompleted ? 'text-zinc-400 line-through' : 'text-zinc-900'}`}>
                        {student?.name || 'Unknown Student'}
                      </p>
                      <p className="text-xs text-zinc-400">{student?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                      isCompleted ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {isCompleted ? 'Done' : 'Pending'}
                    </span>
                    <button
                      onClick={() => handleDeleteSingle(assignment.id)}
                      className="p-1.5 text-zinc-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ─── LIST VIEW ───
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900">Assignments</h2>
          <p className="text-zinc-500 text-sm">
            {groupedAssignments.length} {groupedAssignments.length === 1 ? 'task' : 'tasks'} · {assignments.filter(a => a.status === 'pending').length} pending
          </p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary">
          <Plus size={16} />
          Assign Task
        </button>
      </div>

      {groupedAssignments.length === 0 ? (
        <div className="py-20 bg-white border border-dashed border-zinc-200 rounded-3xl flex flex-col items-center justify-center text-zinc-400 space-y-3 shadow-sm">
          <ClipboardList className="w-10 h-10 opacity-20" />
          <p className="text-sm font-medium">No active tasks for this class</p>
        </div>
      ) : (
        <div className="glass-panel">
          <div className="divide-y divide-zinc-100">
            {groupedAssignments.map((group) => {
              const progress = group.total > 0 ? Math.round((group.completed / group.total) * 100) : 0;
              return (
                <div
                  key={group.title}
                  onClick={() => setSelectedGroupTitle(group.title)}
                  className="px-6 py-5 flex items-center justify-between cursor-pointer hover:bg-zinc-50/50 transition-colors group"
                >
                  <div className="flex items-center gap-5 min-w-0 flex-1">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      progress === 100 ? 'bg-emerald-50 text-emerald-500' : 'bg-zinc-100 text-zinc-400'
                    }`}>
                      {progress === 100 ? <CheckCircle2 size={20} /> : <ClipboardList size={18} />}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-zinc-900 truncate">{group.title}</h3>
                        <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full flex-shrink-0">
                          {group.completed}/{group.total}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-zinc-400">
                        {group.dueDate && (
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {new Date(group.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Users size={12} />
                          {group.total} {group.total === 1 ? 'student' : 'students'}
                        </span>
                      </div>
                      <div className="h-1.5 w-full max-w-[200px] bg-zinc-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${progress === 100 ? 'bg-emerald-500' : 'bg-zinc-900'}`}
                          style={{ width: `${progress}%` }} 
                        />
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-zinc-300 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-4" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <AssignmentModal 
            students={students}
            classId={classId}
            onClose={() => setIsModalOpen(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── CREATE MODAL (unchanged) ───
function AssignmentModal({ students, classId, onClose }: { students: Student[], classId: string, onClose: () => void }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    studentId: 'all',
    dueDate: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setIsSubmitting(true);

    try {
      const assignmentPayload = {
        title: formData.title,
        description: formData.description,
        classId: classId,
        teacherId: auth.currentUser.uid,
        status: 'pending' as const,
        dueDate: formData.dueDate || null,
        createdAt: serverTimestamp(),
      };

      if (formData.studentId === 'all') {
        const batch = writeBatch(db);
        students.forEach((student) => {
          const assignmentRef = doc(collection(db, 'assignments'));
          batch.set(assignmentRef, { ...assignmentPayload, studentId: student.id });
        });
        await batch.commit();
      } else {
        await addDoc(collection(db, 'assignments'), {
          ...assignmentPayload,
          studentId: formData.studentId,
        });
      }
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'assignments');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 10 }}
        className="max-w-lg w-full bg-white rounded-2xl shadow-2xl space-y-8 overflow-hidden border border-zinc-200"
      >
        <div className="px-8 py-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <div>
            <h3 className="text-xl font-bold text-zinc-900">Dispatch Task</h3>
            <p className="text-zinc-500 text-xs">Assign academic work to specific students</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-900 p-2 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-8 pb-10 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Assignment Title</label>
              <input 
                required
                className="input-base w-full"
                placeholder="e.g. History Analysis"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Recipient Student</label>
                <select 
                  required
                  className="input-base w-full bg-zinc-50"
                  value={formData.studentId}
                  onChange={(e) => setFormData({...formData, studentId: e.target.value})}
                >
                  <option value="all">All Students</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setFormData((current) => ({ ...current, studentId: 'all' }))}
                  className={`w-full mt-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
                    formData.studentId === 'all'
                      ? 'border-zinc-900 bg-zinc-900 text-white'
                      : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                  }`}
                >
                  Assign to All Students
                </button>
              </div>
              
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Due Date</label>
                <input 
                  type="date"
                  className="input-base w-full font-mono text-[11px]"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Instructions</label>
              <textarea 
                className="input-base w-full h-24 resize-none"
                placeholder="Details for the student..."
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary justify-center py-3">
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSubmitting || students.length === 0}
              className="flex-[2] btn-primary justify-center py-3"
            >
              {isSubmitting ? 'Syncing...' : students.length === 0 ? 'No Students' : formData.studentId === 'all' ? 'Issue to All Students' : 'Issue Assignment'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
