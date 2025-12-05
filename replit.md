# XLS Purchase Data Viewer

## Overview

This is a web application for viewing and analyzing purchase data from Excel files (XLS/XLSX). Users can upload spreadsheet files containing product purchase information, which are then parsed and displayed in an interactive data table with sorting, searching, and summary statistics. The application provides a clean, utility-focused interface inspired by Linear and Notion design principles, with both light and dark mode support.

**Language**: The entire UI is in Czech (Čeština) for Czech-speaking users.

**Mobile Support**: The application includes responsive design with separate mobile and desktop experiences:
- **Desktop (≥768px)**: Full functionality including file upload, upload history sidebar, data management, and price history tracking
- **Mobile (<768px)**: View-only mode without file upload component. Mobile users can view existing data and switch between uploads using a dropdown selector if multiple uploads exist. The mobile version includes optimized layouts for smaller screens with horizontal scrolling tables and stacked summary cards.

## Key Features

### Price History Tracking (Desktop Only)
The application tracks price changes for products across multiple uploads, enabling users to:
- Monitor price trends over time for each unique product
- View detailed price history graphs with upload sources
- Compare current prices against historical min/max/average values
- Identify items with significant price changes
- Access price history via the "Historie cen" button in the header

**Grouping Logic**: Products are grouped by normalized name (case-insensitive, whitespace-normalized) + exact category match. For example, "Káva Lavazza" and "káva lavazza" are treated as the same product, but "Káva Lavazza" and "Káva Jacobs" are separate items.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18+ with TypeScript in a Single Page Application (SPA) architecture using Vite as the build tool.

**Routing**: Wouter is used for lightweight client-side routing. The application has a simple route structure with a home page and a 404 not-found page.

**State Management**: React Context API is used for theme management (ThemeContext). Component-level state with useState handles file upload, data parsing, and search filtering. No global state management library is used, keeping the architecture simple and focused.

**UI Component Library**: Radix UI primitives wrapped with custom styled components (shadcn/ui pattern). This provides accessible, headless components with custom styling applied via Tailwind CSS.

**Styling System**: Tailwind CSS with a custom design system based on CSS variables for theming. The design follows a utility-first approach with specific color palettes for dark and light modes. Typography uses Inter font family via Google Fonts CDN.

**Data Management**: TanStack Query (React Query) is configured for server state management, though the current implementation processes files entirely client-side without API calls.

**File Processing**: Client-side Excel file parsing using the XLSX library (SheetJS). Files are read as ArrayBuffer, parsed into JSON, and then mapped to a standardized ProductData interface.

### Backend Architecture

**Server Framework**: Express.js running on Node.js with TypeScript.

**Application Structure**: The server follows a minimal REST API pattern with route registration separated into a `registerRoutes` function. Currently, the server primarily serves the Vite-bundled frontend and provides development tooling.

**Development Server**: In development mode, Vite's middleware is integrated into the Express server for hot module replacement (HMR) and development features. The production build serves static files from the dist/public directory.

**Storage Layer**: An in-memory storage implementation (MemStorage) is provided as a starting point, implementing an IStorage interface for CRUD operations. This abstraction allows for easy swapping to a database-backed implementation.

**Logging**: Custom request logging middleware tracks API request duration and response data, with formatted timestamps for easy debugging.

### Data Storage Solutions

**Database ORM**: Drizzle ORM is configured for PostgreSQL (via Neon serverless driver). The schema defines a basic users table with UUID primary keys, username, and password fields.

**Schema Management**: Database schemas are defined in TypeScript using Drizzle's schema builder. Zod schemas are automatically generated from Drizzle schemas for runtime validation.

**Current Implementation**: The application currently operates entirely client-side with no persistent storage. File data is held in component state and cleared on page refresh. The database infrastructure is prepared but not actively used in the current feature set.

**Migration Strategy**: Drizzle Kit is configured for schema migrations with migrations stored in the ./migrations directory.

### Authentication and Authorization

**Current State**: No authentication or authorization is currently implemented. The users table in the schema suggests future authentication capabilities, but no login/registration flows exist.

**Session Infrastructure**: The package.json includes connect-pg-simple for PostgreSQL-backed session storage, indicating planned session-based authentication, but it is not currently wired up.

### Design System

**Theme Architecture**: CSS custom properties (CSS variables) define a comprehensive color system with separate values for light and dark modes. Theme switching is handled through a class-based approach on the document root.

**Component Variants**: Component styling uses class-variance-authority (CVA) for type-safe variant composition. This allows components like Button to have consistent variant APIs (default, destructive, outline, secondary, ghost) across the application.

**Responsive Design**: Mobile-first responsive design using Tailwind's responsive utilities. A custom useIsMobile hook provides JavaScript-based breakpoint detection at 768px.

**Typography**: Font stack prioritizes Inter for UI text with fallbacks. Tabular numbers are used for price alignment in data tables. The design guidelines specify precise font weights and sizes for different UI elements.

## External Dependencies

### Third-Party Services

**Database**: Neon Serverless PostgreSQL (configured via DATABASE_URL environment variable). The application expects a PostgreSQL-compatible database but is not currently using it for active features.

**Fonts**: Google Fonts CDN provides Inter, DM Sans, Fira Code, Geist Mono, and Architects Daughter font families.

### Key NPM Packages

**Frontend Libraries**:
- @tanstack/react-query: Server state and async data management
- wouter: Lightweight routing
- react-hook-form with @hookform/resolvers: Form state management and validation
- react-dropzone: File upload drag-and-drop interface
- xlsx (SheetJS): Excel file parsing
- date-fns: Date formatting utilities
- embla-carousel-react: Carousel/slider components
- lucide-react: Icon library

**UI Component Primitives** (Radix UI):
- Comprehensive set of @radix-ui/* packages for accessible component primitives (dialog, dropdown-menu, popover, select, toast, etc.)

**Styling and Utilities**:
- tailwindcss with autoprefixer: Utility-first CSS framework
- class-variance-authority: Type-safe component variants
- clsx and tailwind-merge: Conditional className utilities
- cmdk: Command palette component

**Backend Libraries**:
- express: Web server framework
- drizzle-orm with @neondatabase/serverless: Database ORM and PostgreSQL driver
- drizzle-zod: Zod schema generation from Drizzle schemas
- connect-pg-simple: PostgreSQL session store (configured but not used)

**Development Tools**:
- vite with @vitejs/plugin-react: Build tool and dev server
- typescript with tsx: Type checking and execution
- esbuild: Production server bundling
- @replit/vite-plugin-*: Replit-specific development enhancements

### Build and Deployment

**Build Process**: 
1. Frontend: Vite bundles the React application into static assets in dist/public
2. Backend: esbuild bundles the Express server into dist/index.js as an ESM module

**Environment Variables**: DATABASE_URL is required for database connectivity (validated in drizzle.config.ts).

**Scripts**:
- `dev`: Runs development server with tsx watch mode
- `build`: Builds both frontend and backend for production
- `start`: Runs the production server from bundled output
- `db:push`: Pushes schema changes to database using Drizzle Kit