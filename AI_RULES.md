# AI Development Rules

## Tech Stack

- **Frontend Framework**: React with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React Context API with Supabase for backend integration
- **Routing**: React Router v6
- **Backend**: Supabase (PostgreSQL database with built-in auth)
- **Data Visualization**: Recharts for trading performance charts
- **UI Animations**: Framer Motion for smooth transitions
- **Form Handling**: React Hook Form with Zod validation
- **Real-time Features**: Supabase Real-time Subscriptions
- **Storage**: Supabase Storage for trade screenshots

## Library Usage Rules

### UI Components
- **Primary UI Library**: Use shadcn/ui components whenever possible
- **Custom Components**: Create new components in `src/components/` directory
- **Styling**: Use Tailwind CSS classes exclusively (no plain CSS files)
- **Icons**: Use Lucide React icons only

### State Management
- **Global State**: Use React Context API for application state
- **Local State**: Use React `useState` and `useReducer` hooks
- **Backend State**: Use Supabase client directly or custom hooks
- **Caching**: Use React Query (already configured) for server state caching

### Data Handling
- **API Calls**: Use Supabase client (`@/integrations/supabase/client`)
- **Data Validation**: Use Zod for form and API response validation
- **Form Management**: Use React Hook Form for all forms
- **Date Handling**: Use date-fns for date manipulations

### Authentication
- **Auth Provider**: Use the existing `AuthProvider` in `src/contexts/AuthContext.tsx`
- **Protected Routes**: Use `ProtectedRoute` component
- **Auth Hooks**: Use `useAuth` hook for authentication state

### Routing
- **Router**: Use React Router v6
- **Route Structure**: Define all routes in `src/App.tsx`
- **Navigation**: Use `useNavigate` and `NavLink` from React Router

### Charts and Data Visualization
- **Charting Library**: Use Recharts for all data visualizations
- **Performance Charts**: Use existing `PerformanceChart` component
- **Custom Charts**: Create new components that wrap Recharts components

### Notifications
- **Toasts**: Use the existing toast system (`use-toast` hook)
- **Alerts**: Use shadcn/ui alert dialog components

### File Structure
- **Pages**: Create new pages in `src/pages/`
- **Components**: Create reusable components in `src/components/`
- **Hooks**: Create custom hooks in `src/hooks/`
- **Utilities**: Place utility functions in `src/lib/`
- **Types**: Define TypeScript types in respective files or `src/types/`

### Styling Guidelines
- **Design System**: Follow the existing color palette in `src/index.css`
- **Responsive Design**: Use Tailwind's responsive prefixes (sm:, md:, lg:, etc.)
- **Component Styling**: Use Tailwind classes directly in components
- **Gradients/Shadows**: Use predefined CSS variables from the design system

### Error Handling
- **Error Boundaries**: Use existing `ErrorBoundary` component for catching UI errors
- **API Errors**: Handle Supabase errors in the calling functions
- **Form Errors**: Use React Hook Form's built-in error handling

### Performance
- **Bundle Size**: Avoid importing entire libraries; use specific imports
- **Re-renders**: Use `useMemo` and `useCallback` for expensive computations
- **Lazy Loading**: Use React's `lazy` and `Suspense` for code splitting when appropriate