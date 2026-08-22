import { complaintsCol, fieldTasksCol, createDoc, updateDoc, getDoc, listDocs } from '../lib/db.js';
import type { Complaint, FieldTask } from '../lib/types.js';
import { createNotification } from './notification.js';
import { logAudit } from './audit.js';
import { logger } from '../lib/logger.js';

export async function createComplaint(data: {
  userId: string;
  meterId?: string;
  category: Complaint['category'];
  description: string;
  priority: Complaint['priority'];
  district?: string;
  region?: string;
}) {
  const countSnap = await complaintsCol.count().get();
  const complaintNumber = `CMP-${String(countSnap.data().count + 1).padStart(5, '0')}`;

  const complaint = await createDoc<Complaint>('complaints', {
    ...data,
    complaintNumber,
    status: 'new',
  } as any);

  // Notify customer service
  await createNotification(
    data.userId,
    'Complaint Submitted',
    `Your complaint ${complaintNumber} has been submitted. We will review it shortly.`,
    'complaint_update',
    'info',
    { complaintId: complaint.id },
  );

  logger.info({ complaintId: complaint.id, complaintNumber, category: data.category }, 'Complaint created');
  return complaint;
}

export async function assignComplaint(complaintId: string, assignedTo: string, userId: string) {
  await updateDoc('complaints', complaintId, {
    assignedTo,
    assignedAt: new Date(),
    status: 'assigned',
  } as any);

  // Create field task
  const complaint = await getDoc<Complaint & { id: string }>('complaints', complaintId);
  if (complaint) {
    const countSnap = await fieldTasksCol.count().get();
    const taskNumber = `FT-${String(countSnap.data().count + 1).padStart(5, '0')}`;

    await createDoc<FieldTask>('fieldTasks', {
      taskNumber,
      complaintId,
      customerId: complaint.userId,
      customerName: '',
      address: '',
      problem: complaint.description,
      priority: complaint.priority,
      assignedTo,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'assigned',
    } as any);
  }

  await logAudit({
    userId,
    userRole: 'customer_service',
    userName: 'Officer',
    action: 'COMPLAINT_ASSIGN',
    resource: 'complaints',
    resourceId: complaintId,
    newValue: { assignedTo },
    result: 'success',
  });

  logger.info({ complaintId, assignedTo }, 'Complaint assigned');
}

export async function resolveComplaint(complaintId: string, resolution: string, userId: string) {
  await updateDoc('complaints', complaintId, {
    status: 'resolved',
    resolvedAt: new Date(),
    resolution,
  } as any);

  const complaint = await getDoc<Complaint & { id: string }>('complaints', complaintId);
  if (complaint) {
    await createNotification(
      complaint.userId,
      'Complaint Resolved',
      `Your complaint ${complaint.complaintNumber} has been resolved. ${resolution}`,
      'complaint_update',
      'info',
      { complaintId },
    );
  }

  await logAudit({
    userId,
    userRole: 'field_officer',
    userName: 'Officer',
    action: 'COMPLAINT_RESOLVE',
    resource: 'complaints',
    resourceId: complaintId,
    newValue: { resolution },
    result: 'success',
  });

  logger.info({ complaintId }, 'Complaint resolved');
}

export async function listComplaints(filters?: {
  status?: string;
  category?: string;
  priority?: string;
  district?: string;
}) {
  const queryFilters: any[] = [];
  if (filters?.status) queryFilters.push({ field: 'status', op: '==', value: filters.status });
  if (filters?.category) queryFilters.push({ field: 'category', op: '==', value: filters.category });
  if (filters?.priority) queryFilters.push({ field: 'priority', op: '==', value: filters.priority });

  return listDocs<Complaint & { id: string }>(
    'complaints',
    queryFilters.length > 0 ? queryFilters : undefined,
    { field: 'createdAt', direction: 'desc' },
  );
}
