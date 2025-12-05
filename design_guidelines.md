# Design Guidelines: XLS Purchase Data Viewer

## Design Approach

**Selected Approach**: Design System (Utility-Focused)  
**Primary Inspiration**: Linear + Notion  
**Justification**: Data-heavy utility application requiring clarity, efficiency, and clean information hierarchy. Users need to quickly scan prices and product details without visual distraction.

## Core Design Elements

### A. Color Palette

**Dark Mode** (Primary):
- Background Base: 220 13% 10%
- Surface: 220 13% 13%
- Surface Elevated: 220 13% 16%
- Border: 220 13% 22%
- Text Primary: 0 0% 95%
- Text Secondary: 0 0% 65%
- Primary Accent: 217 91% 60% (Trust blue for CTA)
- Success: 142 71% 45% (Price highlights)
- Destructive: 0 84% 60%

**Light Mode**:
- Background Base: 0 0% 100%
- Surface: 0 0% 98%
- Surface Elevated: 0 0% 100%
- Border: 220 13% 91%
- Text Primary: 220 13% 10%
- Text Secondary: 220 9% 46%
- Primary Accent: 217 91% 60%
- Success: 142 71% 45%
- Destructive: 0 84% 60%

### B. Typography

**Font Stack**: Inter (via Google Fonts CDN)

- Headings: 600 weight, tight leading
- H1: text-2xl (24px)
- H2: text-xl (20px)
- H3: text-lg (18px)
- Body: 400 weight, text-sm to text-base (14-16px)
- Data/Numbers: 500 weight, tabular-nums for price alignment
- Labels: 500 weight, text-xs to text-sm uppercase tracking-wide

### C. Layout System

**Spacing Units**: Consistent use of 4, 6, 8, 12, 16, 24 (Tailwind: p-1, p-1.5, p-2, p-3, p-4, p-6)

**Grid Structure**:
- Container: max-w-7xl mx-auto px-4 sm:px-6
- Main content area: Full width with contained sections
- Upload area: Centered, max-w-2xl
- Table: Full width within container, horizontally scrollable on mobile

### D. Component Library

**1. Application Header**
- Full-width sticky header (h-16)
- App logo/title on left
- Theme toggle (sun/moon icon) on right
- Subtle bottom border with surface elevation
- No hero section - immediate utility focus

**2. File Upload Zone**
- Prominent drag-and-drop area (min-h-64)
- Dashed border with primary accent on hover/drag-over
- Center-aligned upload icon (cloud-upload from Heroicons)
- Clear instructions: "Drop XLS/XLSX file here or click to browse"
- Accepted formats display: ".xls, .xlsx"
- File size limit indicator
- Upload button with primary accent background

**3. Data Table**
- Striped rows for easy scanning (alternate surface colors)
- Fixed header row with sort indicators
- Columns: Product Name (flex-1), Quantity (w-24), Unit Price (w-32), Total Price (w-32), Category (w-40 if present)
- Price columns: Right-aligned, tabular numbers, bold weight
- Currency symbol "CZK" consistently positioned after values
- Hover state on rows with subtle background change
- Responsive: Horizontal scroll on mobile with sticky first column

**4. Search & Filter Bar**
- Positioned above table
- Search input with magnifying glass icon (left)
- Filter dropdown for categories (if applicable)
- Clear filters button
- Compact height (h-12), full width on mobile, inline on desktop

**5. Summary Cards**
- Row of 3 cards above table: Total Items, Total Value, Average Price
- Surface elevated background
- Large numeric values (text-3xl, tabular-nums)
- Secondary labels below (text-sm, text-secondary)
- Subtle border, rounded-lg

**6. Empty State**
- Displayed before file upload
- Large icon (document with arrow)
- Heading: "Upload Your Purchase Data"
- Subtext explaining XLS format requirements
- Primary CTA button leading to upload action

**7. Loading State**
- Spinner animation during file parsing
- "Processing your file..." text
- Positioned centrally in content area

### E. Interactions & States

**Animations**: Minimal and purposeful
- Smooth transitions (150-200ms) for hover states
- Fade-in for table rows after data load (300ms stagger)
- Upload zone border pulse on drag-over
- NO complex scroll animations or decorative effects

**Button States**:
- Primary: Solid primary accent background
- Hover: Slight brightness increase
- Active: Slight scale down (scale-95)
- Disabled: 50% opacity, no interactions

**Table Interactions**:
- Sortable columns (click header to sort)
- Sort indicator icons (chevron up/down)
- Highlight price cells on hover for easy reading

## Accessibility

- Maintain WCAG AA contrast ratios (4.5:1 minimum)
- All interactive elements keyboard accessible
- Table row focus states with visible outline
- Screen reader labels for icons and interactive elements
- File input with proper label association
- Dark mode properly applied to ALL form inputs, text fields, and interactive elements

## Implementation Notes

- Icons: Use Heroicons via CDN (outline style for interface)
- Font: Single Google Fonts link for Inter (400, 500, 600 weights)
- No custom illustrations or generated SVGs
- Table should handle 100+ rows smoothly with virtual scrolling if needed
- Mobile-first responsive design with breakpoints at sm (640px), md (768px), lg (1024px)