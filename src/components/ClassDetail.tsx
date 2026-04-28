import { useState } from 'react';
import React from 'react';
import { Class } from '../types';
import StudentManagement from './StudentManagement';
import AssignmentManagement from './AssignmentManagement';
import { ChevronLeft, Users, ClipboardList, Settings, MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ClassDetailProps {
  cls: Class;
  onBack: () => void;
}

export default function ClassDetail({ cls, onBack }: ClassDetailProps) {
  const [activeTab, setActiveTab] = useState<'students' | 'assignments'>('students');

  return (
    <div className="space-y-8">
      {/* Header / Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-zinc-200 pb-8">
        <div className="flex items-center gap-6">
          <button 
            onClick={onBack}
            className="p-3 bg-white border border-zinc-200 rounded-2xl text-zinc-400 hover:text-zinc-900 hover:border-zinc-900 transition-all shadow-sm"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">{cls.name}</h1>
            <p className="text-zinc-500 text-sm">Class Workspace & Grading</p>
          </div>
        </div>

        <div className="flex items-center gap-2 p-1 bg-zinc-100 rounded-xl">
          <TabButton 
            active={activeTab === 'students'} 
            onClick={() => setActiveTab('students')}
            icon={<Users size={16} />}
            label="Students"
          />
          <TabButton 
            active={activeTab === 'assignments'} 
            onClick={() => setActiveTab('assignments')}
            icon={<ClipboardList size={16} />}
            label="Tasks"
          />
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.15 }}
        >
          {activeTab === 'students' ? (
            <StudentManagement classId={cls.id} />
          ) : (
            <AssignmentManagement classId={cls.id} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
        active 
          ? 'bg-white text-zinc-950 shadow-sm' 
          : 'text-zinc-500 hover:text-zinc-900'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
