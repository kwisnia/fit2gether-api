export interface TasksQuery {
    from?: string;
    to?: string;
    status?: "completed" | "todo";
}
