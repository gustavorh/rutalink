# Theme System Quick Start Guide

## 🎨 Enable Dark Mode (3 Options)

### Option 1: Manual Toggle (Browser DevTools)

```javascript
// In browser console:
document.documentElement.classList.add("dark"); // Enable dark mode
document.documentElement.classList.remove("dark"); // Disable dark mode
```

### Option 2: Add Theme Toggle Button (Recommended)

**Step 1:** Import the theme hook in your Header component:

```tsx
// components/dashboard/Header.tsx
import { useTheme } from "@/lib/use-theme";

export function DashboardHeader({ user, onLogout }: DashboardHeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="bg-ui-sidebar-bg border-b border-border px-8 py-4">
      {/* ... existing content ... */}

      {/* Add this button before the user dropdown */}
      <button
        onClick={toggleTheme}
        className="p-2 rounded-lg hover:bg-ui-surface-hover transition-colors"
        aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      >
        {theme === "light" ? (
          // Moon icon for dark mode
          <svg
            className="w-5 h-5 text-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
        ) : (
          // Sun icon for light mode
          <svg
            className="w-5 h-5 text-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        )}
      </button>
    </header>
  );
}
```

### Option 3: System Preference (Auto-detect)

The theme hook automatically detects system preference on first visit. To force it:

```tsx
// In your root layout or app initialization
useEffect(() => {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  if (prefersDark) {
    document.documentElement.classList.add("dark");
  }
}, []);
```

---

## 🎯 Using Color Tokens in Components

### Backgrounds & Surfaces

```tsx
// Page background
<div className="bg-background">

// Cards & elevated surfaces
<Card className="bg-card border-border">

// Sidebar background
<aside className="bg-ui-sidebar-bg">

// Elevated UI elements (modals, dropdowns)
<div className="bg-ui-surface-elevated">

// Hover states
<button className="hover:bg-ui-surface-hover">
```

### Text Colors

```tsx
// Primary text
<p className="text-foreground">

// Secondary/muted text
<span className="text-muted-foreground">

// Input placeholders
<input placeholder="..." className="placeholder-muted-foreground" />
```

### Semantic Status Colors

```tsx
// Success (green)
<div className="bg-success/10 border-success/50">
  <p className="text-success">Operation successful!</p>
</div>

// Error (red)
<div className="bg-destructive/10 border-destructive/50">
  <p className="text-destructive">Error occurred</p>
</div>

// Warning (orange)
<div className="bg-warning/10 border-warning/50">
  <p className="text-warning">Warning message</p>
</div>

// Info (blue)
<div className="bg-info/10 border-info/50">
  <p className="text-info">Info message</p>
</div>
```

### Interactive Elements

```tsx
// Primary button
<button className="bg-primary hover:bg-primary-dark text-primary-foreground">

// Secondary button
<button className="bg-secondary hover:bg-secondary-dark text-secondary-foreground">

// Outline button
<button className="border-border hover:bg-ui-surface-hover">

// Link
<a className="text-primary hover:text-primary-dark">
```

### Borders & Inputs

```tsx
// Standard border
<div className="border border-border">

// Form input
<input className="border-border bg-ui-surface-elevated text-foreground" />

// Focus ring
<input className="focus:ring-2 focus:ring-primary" />
```

---

## 📊 Chart/Visualization Colors

```typescript
import { visualColors } from '@/lib/colors';

// For chart libraries (e.g., Recharts, Chart.js)
const chartConfig = {
  colors: visualColors, // ['#4CAF50', '#FFB300', '#7E57C2', '#F4511E', '#29B6F6']
};

// Using Tailwind classes
<div className="bg-chart-1">Route A</div>  // Green
<div className="bg-chart-2">Route B</div>  // Amber
<div className="bg-chart-3">Route C</div>  // Purple
<div className="bg-chart-4">Route D</div>  // Deep Orange
<div className="bg-chart-5">Route E</div>  // Light Blue
```

---

## 🔍 Color Reference Table

| Token Name         | Light Mode           | Dark Mode            | Usage                  |
| ------------------ | -------------------- | -------------------- | ---------------------- |
| `primary`          | #1976D2 (Blue)       | #58A6FF (Light Blue) | Primary actions, links |
| `secondary`        | #009688 (Teal)       | #3FB6A8 (Light Teal) | Secondary accents      |
| `success`          | #2E7D32 (Green)      | #2E7D32 (Green)      | Success states         |
| `warning`          | #ED6C02 (Orange)     | #ED6C02 (Orange)     | Warning states         |
| `destructive`      | #D32F2F (Red)        | #D32F2F (Red)        | Errors, delete actions |
| `info`             | #0288D1 (Blue)       | #0288D1 (Blue)       | Informational          |
| `background`       | #F7F9FC (Light Gray) | #0D1117 (Dark)       | Page background        |
| `card`             | #FFFFFF (White)      | #161B22 (Dark Gray)  | Cards, surfaces        |
| `foreground`       | #1A1F36 (Dark)       | #E6EDF3 (Light)      | Primary text           |
| `muted-foreground` | #6B7280 (Gray)       | #8B949E (Gray)       | Secondary text         |
| `border`           | #E0E6EF (Light Gray) | #30363D (Dark Gray)  | Borders, dividers      |

---

## ✅ Quick Verification Checklist

After enabling dark mode, verify these elements:

- [ ] Page background changes to dark
- [ ] Cards have distinct elevated appearance
- [ ] All text is readable with good contrast
- [ ] Borders are visible but subtle
- [ ] Hover states work on buttons/links
- [ ] Form inputs are clearly visible
- [ ] Status colors (success/error/warning) are distinguishable
- [ ] Charts/visualizations use consistent colors

---

## 🚀 Common Patterns

### Card with Status Badge

```tsx
<Card className="bg-card border-border">
  <div className="flex items-center justify-between">
    <h3 className="text-foreground">Title</h3>
    <span className="px-2 py-1 rounded-full bg-success/10 text-success border border-success/50">
      Active
    </span>
  </div>
  <p className="text-muted-foreground">Description text</p>
</Card>
```

### Modal/Dialog

```tsx
<Dialog>
  <DialogContent className="bg-card border-border">
    <DialogTitle className="text-foreground">Modal Title</DialogTitle>
    <DialogDescription className="text-muted-foreground">
      Description text
    </DialogDescription>
    <div className="flex gap-2">
      <Button className="bg-primary hover:bg-primary-dark">Confirm</Button>
      <Button
        variant="outline"
        className="border-border hover:bg-ui-surface-hover"
      >
        Cancel
      </Button>
    </div>
  </DialogContent>
</Dialog>
```

### Form with Validation

```tsx
<form>
  <div className="space-y-2">
    <label className="text-foreground">Email</label>
    <input
      type="email"
      className="w-full border-border bg-ui-surface-elevated text-foreground 
                 placeholder-muted-foreground focus:border-primary"
      placeholder="Enter email"
    />
    {error && <p className="text-sm text-destructive">{error}</p>}
  </div>
</form>
```

---

## 📚 Resources

- **Full Documentation:** `docs/THEME_REFACTORING_SUMMARY.md`
- **Color Tokens Reference:** `lib/colors.ts`
- **Theme Hook:** `lib/use-theme.ts`
- **CSS Variables:** `app/globals.css`

---

**Need Help?** Check the full refactoring summary for detailed implementation notes and accessibility guidelines.
