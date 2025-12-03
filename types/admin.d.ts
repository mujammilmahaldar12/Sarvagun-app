export interface AuditLog {
    id: number;
    table_name: string;
    row_id: string;
    action_type: 'INSERT' | 'UPDATE' | 'DELETE';
    old_data: any;
    new_data: any;
    action_timestamp: string;
    transaction_id: string;
    action_taken_by: number;
    action_taken_by_name?: string;
}

export interface AuditLogFilters {
    table_name?: string;
    action_type?: string;
    from_date?: string;
    to_date?: string;
    search?: string;
    page?: number;
    page_size?: number;
}
