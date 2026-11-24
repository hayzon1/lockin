# LOCKIN

LOCKIN is a minimalist, privacy-first habit-tracking application and growth calendar. It empowers individuals to track custom focus periods, form daily habits, and visualize progress consistently without competitive stress.

## Features

- **Private & Secure**: Private user accounts, password hashing, and secure session management.
- **Custom Tracking Periods**: Create time-boxed tracking windows (7, 14, 21, 30, 60, 90 days, or custom ranges) with one active period at a time.
- **Daily Habits**: Clean daily checklist with optimistic updates and duplicate prevention.
- **Progress & Analytics**: Trajectory growth charts, habit streaks, calendar intensity heatmaps, and data-backed insights.
- **Modern Minimalist UI**: Linear-inspired aesthetic with dark and light themes, optimized for desktop and mobile.

## Technology Stack

- **Backend**: Java 17, Spring Boot 3.3, Spring Security 6, Spring Data JPA, Hibernate, Flyway.
- **Database**: PostgreSQL 14+ with UUID primary keys and partial unique indexes.
- **Frontend**: React 18+, TypeScript, Vite, Tailwind CSS, shadcn/ui, Recharts, TanStack Query.
- **Deployment**: Render Blueprint (`render.yaml`).

## Architecture & Database Design

Detailed technical architecture, database ERD, entity relations, and API endpoint contracts are documented in:
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## Local Development Setup

### Prerequisites

- Java 17+ (OpenJDK recommended)
- Maven 3.9+
- Node.js 18+ & npm
- PostgreSQL 14+

### Backend Setup

1. Start your local PostgreSQL server and create the database:
   ```bash
   createdb lockin_db
   ```
2. Navigate to the `server` directory:
   ```bash
   cd server
   ```
3. Run the Spring Boot application (Flyway will automatically execute migrations):
   ```bash
   mvn spring-boot:run
   ```
4. Run tests:
   ```bash
   mvn test
   ```

### Frontend Setup

1. Navigate to the `web` directory:
   ```bash
   cd web
   ```
2. Install dependencies and start the Vite dev server:
   ```bash
   npm install
   npm run dev
   ```

## Deployment on Render

This project includes a Render Blueprint specification in `render.yaml`:
- **PostgreSQL Database**: `lockin-db`
- **Spring Boot API Web Service**: `lockin-api`
- **React Frontend Static Site**: `lockin-web`

To deploy, connect the repository to Render and create a new Blueprint instance.
