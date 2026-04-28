import { useState, useEffect } from 'react';
import React from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Assignment, Student, OperationType } from '../types';
import { handleFirestoreError } from '../lib/utils';
import { ClipboardList, Plus, Calendar, CheckCircle2, Circle, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AssignmentManagementProps {
  classId: string;
}

export default function AssignmentManagement({ classId }: AssignmentManagementProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStudentId, setFilterStudentId] = useState<string>('all');

  useEffect(() => {
    if (!auth.currentUser || !classId) return;

    // Fetch Students for this class
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

    // Fetch Assignments for this class
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

    return () => {
      unsubStudents();
      unsubAssignments();
    };
  }, [classId]);

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

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this task?')) return;
    try {
      await deleteDoc(doc(db, 'assignments', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `assignments/${id}`);
    }
  };

  const filteredAssignments = filterStudentId === 'all' 
    ? assignments 
    : assignments.filter(a => a.studentId === filterStudentId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900">Assignments</h2>
          <p className="text-zinc-500 text-sm">{assignments.filter(a => a.status === 'pending').length} items outstanding</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={filterStudentId}
            onChange={(e) => setFilterStudentId(e.target.value)}
            className="input-base bg-zinc-50 text-zinc-600 appearance-none cursor-pointer"
          >
            <option value="all">Filter: All Students</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn-primary"
          >
            <Plus size={16} />
            Assign Task
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAssignments.length === 0 ? (
          <div className="col-span-full py-20 bg-white border border-dashed border-zinc-200 rounded-3xl flex flex-col items-center justify-center text-zinc-400 space-y-3 shadow-sm">
             <ClipboardList className="w-10 h-10 opacity-20" />
             <p className="text-sm font-medium">No active tasks for this class</p>
          </div>
        ) : (
          filteredAssignments.map((assignment) => (
            <motion.div 
              key={assignment.id}
              layout
              className={`glass-panel flex flex-col ${assignment.status === 'completed' ? 'opacity-60 bg-zinc-50/50' : ''}`}
            >
              <div className="p-6 flex-1 space-y-4">
                <div className="flex justify-between items-start gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {students.find(s => s.id === assignment.studentId)?.name || 'Student'}
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-zinc-900 truncate tracking-tight py-1">
                      {assignment.title}
                    </h4>
                  </div>
                  <button 
                    onClick={() => toggleStatus(assignment)}
                    className={`flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all ${
                      assignment.status === 'completed' 
                        ? 'bg-green-500 border-green-500 text-white' 
                        : 'bg-white border-zinc-200 text-transparent hover:border-zinc-400'
                    }`}
                  >
                    <CheckCircle2 size={14} className={assignment.status === 'completed' ? 'opacity-100' : 'opacity-0'} />
                  </button>
                </div>

                {assignment.description && (
                  <p className="text-xs text-zinc-500 leading-relaxed line-clamp-3">
                    {assignment.description}
                  </p>
                )}
              </div>

              <div className="px-6 py-4 border-t border-zinc-100 flex items-center justify-between bg-zinc-50/20">
                <div className="flex items-center gap-2 text-xs font-medium text-zinc-400">
                  <Calendar size={14} />
                  {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Flexible'}
                </div>
                <button 
                  onClick={() => handleDelete(assignment.id)}
                  className="p-1.5 text-zinc-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

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

function AssignmentModal({ students, classId, onClose }: { students: Student[], classId: string, onClose: () => void }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    studentId: students[0]?.id || '',
    dueDate: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !formData.studentId) return;
    setIsSubmitting(true);

    try {
      await addDoc(collection(db, 'assignments'), {
        ...formData,
        classId: classId,
        teacherId: auth.currentUser.uid,
        status: 'pending',
        createdAt: serverTimestamp()
      });
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
                  <option value="" disabled>Select Student</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
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
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary justify-center py-3"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSubmitting || students.length === 0}
              className="flex-[2] btn-primary justify-center py-3"
            >
              {isSubmitting ? 'Syncing...' : students.length === 0 ? 'No Students' : 'Issue Assignment'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
