-- LOCKIN Daily To-Do List & Plan Ahead Schema
-- Flyway Migration V4__add_todo_tasks.sql

CREATE TABLE todo_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    goal_id UUID NULL REFERENCES long_term_goals(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    notes TEXT,
    due_date DATE NOT NULL,
    scheduled_time VARCHAR(10),
    priority VARCHAR(16) NOT NULL DEFAULT 'MEDIUM',
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_todo_tasks_user_due ON todo_tasks(user_id, due_date, display_order);
CREATE INDEX idx_todo_tasks_user_completed_due ON todo_tasks(user_id, completed, due_date);
