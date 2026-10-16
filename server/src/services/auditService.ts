import db from '../db/db.js';

export interface AuditParams {
  userId?: number | null;
  userEmail?: string | null;
  action: string;
  entityType: string;
  entityId?: string | number | null;
  details?: Record<string, unknown> | string | null;
  ipAddress?: string | null;
}

export function logAudit(params: AuditParams): void {
  try {
    const detailsStr = typeof params.details === 'object' && params.details !== null
      ? JSON.stringify(params.details)
      : (params.details as string) || null;

    const stmt = db.prepare(`
      INSERT INTO audit_logs (user_id, user_email, action, entity_type, entity_id, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      params.userId ?? null,
      params.userEmail ?? null,
      params.action,
      params.entityType,
      params.entityId ? String(params.entityId) : null,
      detailsStr,
      params.ipAddress ?? '127.0.0.1'
    );
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}
