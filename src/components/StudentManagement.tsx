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
import { Student, OperationType } from '../types';
import { handleFirestoreError } from '../lib/utils';
import { UserPlus, Search, Edit2, Trash2, X, Check, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StudentManagementProps {
  classId: string;
}

export default function StudentManagement({ classId }: StudentManagementProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  useEffect(() => {
    if (!auth.currentUser || !classId) return;

    const q = query(
      collection(db, 'students'),
      where('teacherId', '==', auth.currentUser.uid),
      where('classId', '==', classId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const studentData: Student[] = [];
      snapshot.forEach((doc) => {
        studentData.push({ id: doc.id, ...doc.data() } as Student);
      });
      setStudents(studentData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'students');
    });

    return () => unsubscribe();
  }, [classId]);

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!confirm('Permanently remove this student? All assignments will remain but access will be limited.')) return;
    try {
      await deleteDoc(doc(db, 'students', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `students/${id}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900">Class Roster</h2>
          <p className="text-zinc-500 text-sm">Managing {students.length} students</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-600 transition-colors" size={14} />
            <input 
              type="text" 
              placeholder="Search roster..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-base pl-9 w-64 shadow-sm"
            />
          </div>
          <button 
            onClick={() => {
              setEditingStudent(null);
              setIsModalOpen(true);
            }}
            className="btn-primary shadow-sm"
          >
            <Plus size={16} />
            Add Student
          </button>
        </div>
      </div>

      <div className="glass-panel">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50/50 border-b border-zinc-200">
              <th className="px-6 py-4 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Student Name</th>
              <th className="px-6 py-4 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Email</th>
              <th className="px-6 py-4 text-[11px] font-bold text-zinc-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200/60">
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-20 text-center text-zinc-400 text-sm italic">
                  No records found in this class
                </td>
              </tr>
            ) : (
              filteredStudents.map((student) => (
                <tr key={student.id} className="group hover:bg-zinc-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-zinc-900">{student.name}</div>
                  </td>
                  <td className="px-6 py-4 text-zinc-500 text-sm">{student.email}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => {
                          setEditingStudent(student);
                          setIsModalOpen(true);
                        }}
                        className="p-2 text-zinc-400 hover:text-zinc-900 border border-transparent hover:border-zinc-200 rounded-lg transition-all"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(student.id)}
                        className="p-2 text-zinc-400 hover:text-red-600 border border-transparent hover:border-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <StudentModal 
            student={editingStudent} 
            classId={classId}
            onClose={() => setIsModalOpen(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function StudentModal({ student, classId, onClose }: { student: Student | null, classId: string, onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: student?.name || '',
    email: student?.email || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setIsSubmitting(true);

    try {
      if (student) {
        await updateDoc(doc(db, 'students', student.id), {
          ...formData
        });
      } else {
        await addDoc(collection(db, 'students'), {
          ...formData,
          classId: classId,
          teacherId: auth.currentUser.uid,
          createdAt: serverTimestamp()
        });
      }
      onClose();
    } catch (error) {
      handleFirestoreError(error, student ? OperationType.UPDATE : OperationType.CREATE, student ? `students/${student.id}` : 'students');
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
            <h3 className="text-xl font-bold text-zinc-900">
              {student ? 'Update Student' : 'Add New Student'}
            </h3>
            <p className="text-zinc-500 text-xs">Register student into the current class</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-900 p-2 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-8 pb-10 space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Full Name</label>
              <input 
                required
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="input-base w-full"
                placeholder="Jane Cooper"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Email</label>
              <input 
                required
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="input-base w-full"
                placeholder="jane@example.com"
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
              disabled={isSubmitting}
              className="flex-[2] btn-primary justify-center py-3"
            >
              {isSubmitting ? 'Syncing...' : student ? 'Save Changes' : 'Confirm Enrollment'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
