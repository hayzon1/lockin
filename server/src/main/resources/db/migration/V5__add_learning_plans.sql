-- LOCKIN day-by-day learning plans for long-term goals
-- Flyway Migration V5__add_learning_plans.sql

CREATE TABLE goal_learning_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID NOT NULL UNIQUE REFERENCES long_term_goals(id) ON DELETE CASCADE,
    level VARCHAR(32) NOT NULL,
    minutes_per_day INTEGER NOT NULL,
    learning_style VARCHAR(32) NOT NULL,
    total_days INTEGER NOT NULL,
    start_date DATE NOT NULL,
    summary TEXT,
    provider VARCHAR(32) NOT NULL DEFAULT 'BUILT_IN',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE goal_learning_lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES goal_learning_plans(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    resource_title VARCHAR(200),
    resource_url VARCHAR(600),
    resource_type VARCHAR(24) NOT NULL DEFAULT 'READ',
    duration_minutes INTEGER NOT NULL DEFAULT 20,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE NULL
);

CREATE INDEX idx_goal_learning_lessons_plan_day ON goal_learning_lessons(plan_id, day_number);
