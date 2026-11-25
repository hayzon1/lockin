-- LOCKIN Long-Term Goals & Atomic Habits Coach Schema
-- Flyway Migration V3__add_long_term_goals_and_atomic_habits.sql

CREATE TABLE long_term_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(160) NOT NULL,
    description TEXT,
    category VARCHAR(64) NOT NULL DEFAULT 'PERSONAL',
    identity_statement VARCHAR(255),
    target_date DATE NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    ai_provider VARCHAR(32) NOT NULL DEFAULT 'BUILT_IN',
    roadmap_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_long_term_goals_user_status ON long_term_goals(user_id, status);
CREATE INDEX idx_long_term_goals_user_created ON long_term_goals(user_id, created_at DESC);

CREATE TABLE goal_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID NOT NULL REFERENCES long_term_goals(id) ON DELETE CASCADE,
    title VARCHAR(160) NOT NULL,
    description TEXT,
    target_date DATE,
    display_order INTEGER NOT NULL DEFAULT 0,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_goal_milestones_goal_order ON goal_milestones(goal_id, display_order);

CREATE TABLE goal_suggested_habits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID NOT NULL REFERENCES long_term_goals(id) ON DELETE CASCADE,
    name VARCHAR(128) NOT NULL,
    two_minute_version VARCHAR(255),
    habit_stack_cue VARCHAR(255),
    category VARCHAR(64),
    why_it_works TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    adopted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_goal_suggested_habits_goal_order ON goal_suggested_habits(goal_id, display_order);

ALTER TABLE habits
    ADD COLUMN goal_id UUID NULL REFERENCES long_term_goals(id) ON DELETE SET NULL,
    ADD COLUMN two_minute_version VARCHAR(255) NULL,
    ADD COLUMN habit_stack_cue VARCHAR(255) NULL;

CREATE INDEX idx_habits_goal_id ON habits(goal_id);
