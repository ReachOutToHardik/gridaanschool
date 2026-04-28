import { useState, useEffect, useRef } from 'react';
import React from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Class, OperationType } from '../types';
import { handleFirestoreError } from '../lib/utils';
import { Plus, BookOpen, Trash2, ArrowRight, LayoutGrid, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ClassOverviewProps {
  onSelectClass: (cls: Class) => void;
}

export default function ClassOverview({ onSelectClass }: ClassOverviewProps) {
  const [classes, setClasses] = useState<Class[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [className, setClassName] = useState('');
  const [classDesc, setClassDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasAutoSeededDemo = useRef(false);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'classes'),
      where('teacherId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const classData: Class[] = [];
      snapshot.forEach((doc) => {
        classData.push({ id: doc.id, ...doc.data() } as Class);
      });
      setClasses(classData.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));

      const isDemoAccount = auth.currentUser?.email?.toLowerCase() === 'sample.teacher@gridaan.school';
      const demoSeedKey = 'gridaan-demo-seeded';

      if (
        isDemoAccount &&
        classData.length === 0 &&
        !hasAutoSeededDemo.current &&
        localStorage.getItem(demoSeedKey) !== 'true'
      ) {
        hasAutoSeededDemo.current = true;
        localStorage.setItem(demoSeedKey, 'true');
        void handleSeedData();
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'classes');
    });

    return () => unsubscribe();
  }, []);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !className.trim()) return;
    setIsSubmitting(true);

    try {
      await addDoc(collection(db, 'classes'), {
        name: className,
        description: classDesc,
        teacherId: auth.currentUser.uid,
        studentCount: 0,
        createdAt: serverTimestamp()
      });
      setClassName('');
      setClassDesc('');
      setIsModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'classes');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSeedData = async () => {
    if (!auth.currentUser) return;
    setIsSubmitting(true);
    try {
      // 1. Create Classes
      const sampleClasses = [
        { name: 'Mathematics - Grade 10', description: 'Advanced Algebra and Geometry' },
        { name: 'Physics - Grade 12', description: 'Electromagnetism and Quantum Mechanics' },
        { name: 'Hindi Literature', description: 'Classical and Modern Poetry' }
      ];

      for (const cls of sampleClasses) {
        const classRef = await addDoc(collection(db, 'classes'), {
          ...cls,
          teacherId: auth.currentUser.uid,
          studentCount: 0,
          createdAt: serverTimestamp()
        });

        // 2. Add some students to the first class
        if (cls.name.includes('Mathematics')) {
          const hindiStudents = [
            { name: 'Aarav Sharma', email: 'aarav@gridaan.edu' },
            { name: 'Ananya Iyer', email: 'ananya@gridaan.edu' },
            { name: 'Vihaan Gupta', email: 'vihaan@gridaan.edu' },
            { name: 'Diya Patel', email: 'diya@gridaan.edu' },
            { name: 'Arjun Verma', email: 'arjun@gridaan.edu' }
          ];

          for (const student of hindiStudents) {
            await addDoc(collection(db, 'students'), {
              ...student,
              classId: classRef.id,
              teacherId: auth.currentUser.uid,
              createdAt: serverTimestamp()
            });
          }
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'seed_data');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClass = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('All students and assignments in this class will remain but be orphaned. Delete class container?')) return;
    try {
      await deleteDoc(doc(db, 'classes', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `classes/${id}`);
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Your Classes</h1>
          <p className="text-zinc-500 text-sm">Select a classroom to manage students and grading</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary"
        >
          <Plus size={18} />
          Create New Class
        </button>
      </div>

      {classes.length === 0 ? (
        <div className="py-24 bg-white border border-zinc-200 rounded-3xl flex flex-col items-center justify-center text-center space-y-6 shadow-sm px-6">
          <div className="w-16 h-16 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-300">
            <BookOpen size={32} />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-zinc-900">Welcome to Gridaan School</h3>
            <p className="text-zinc-500 text-sm max-w-sm">You haven't created any classes yet. You can start fresh or seed some demo data to explore.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="btn-primary px-8"
            >
              <Plus size={16} />
              Create My First Class
            </button>
            <button 
              onClick={handleSeedData}
              disabled={isSubmitting}
              className="btn-secondary px-8 bg-zinc-50 border-zinc-200 hover:border-zinc-400"
            >
              <LayoutGrid size={16} />
              {isSubmitting ? 'Seeding...' : 'Seed Demo Data'}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((cls) => (
            <motion.div
              layout
              key={cls.id}
              onClick={() => onSelectClass(cls)}
              className="group glass-panel cursor-pointer hover:border-zinc-900 hover:shadow-xl hover:shadow-zinc-200/50 transition-all flex flex-col h-full"
            >
              <div className="p-8 space-y-4 flex-1">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 bg-zinc-950 text-white rounded-xl flex items-center justify-center font-bold">
                    {cls.name[0].toUpperCase()}
                  </div>
                  <button 
                    onClick={(e) => handleDeleteClass(cls.id, e)}
                    className="p-2 text-zinc-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-zinc-900 group-hover:text-zinc-950 transition-colors">
                    {cls.name}
                  </h3>
                  {cls.description && (
                    <p className="text-zinc-500 text-sm line-clamp-2 leading-relaxed">
                      {cls.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="px-8 py-5 bg-zinc-50/50 border-t border-zinc-100 flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs font-semibold text-zinc-400">
                  <div className="flex items-center gap-1.5">
                    <LayoutGrid size={13} />
                    WORKSPACE
                  </div>
                </div>
                <ArrowRight size={16} className="text-zinc-300 group-hover:text-zinc-900 group-hover:translate-x-1 transition-all" />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-zinc-200"
            >
              <form onSubmit={handleCreateClass} className="p-8 space-y-6">
                <div className="space-y-1">
                  <h3 className="text-2xl font-bold text-zinc-900">New Class</h3>
                  <p className="text-zinc-500 text-sm">Define your teaching workspace</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Class Name</label>
                    <input 
                      required
                      autoFocus
                      className="input-base w-full"
                      placeholder="e.g. Advanced Mathematics"
                      value={className}
                      onChange={(e) => setClassName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Description</label>
                    <textarea 
                      className="input-base w-full h-24 resize-none"
                      placeholder="Optional details about this course..."
                      value={classDesc}
                      onChange={(e) => setClassDesc(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 btn-secondary justify-center"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-[2] btn-primary justify-center"
                  >
                    {isSubmitting ? 'Creating...' : 'Launch Class'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
