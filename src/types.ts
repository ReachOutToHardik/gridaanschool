export interface Class {
  id: string;
  name: string;
  description?: string;
  teacherId: string;
  studentCount?: number;
  createdAt: any;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  classId: string;
  teacherId: string;
  createdAt: any;
}

export interface Assignment {
  id: string;
  title: string;
  description?: string;
  classId: string;
  studentId: string;
  teacherId: string;
  status: 'pending' | 'completed';
  dueDate?: any;
  createdAt: any;
  completedAt?: any;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
  }
}
