# Tailwind Class Recipes & Semantic Tokens (Unslop Constitution)

Documenting standard Tailwind classes used across `final-ui` components.

### 1. Canvas & Structural Surfaces (60-30-10)
- **Canvas / Root Background**: `bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100`
- **Card / Surface Container**: `bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs`
- **Elevated Dropdowns / Modals**: `bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl`
- **Muted Inline Surfaces**: `bg-zinc-100 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400`
- **Hairline Dividers**: `border-b border-zinc-200 dark:border-zinc-800`

### 2. Accent Color & Action Budget (10%)
- **Primary CTA**: `bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium shadow-xs focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:ring-offset-2 transition-colors`
- **Secondary Action**: `bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-750 font-medium transition-colors`
- **Danger Action**: `bg-rose-600 hover:bg-rose-700 text-white font-medium transition-colors`
- **Ghost Action**: `hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors`

### 3. Interactive Progress & Status
- **Progress Ring Track**: `stroke-zinc-200 dark:stroke-zinc-800`
- **Progress Ring Fill**: `stroke-blue-600 dark:stroke-blue-500`
- **Success State**: `text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800`
- **Pending/Warning**: `text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800`
- **Locked Item**: `text-zinc-400 dark:text-zinc-600 opacity-70 cursor-not-allowed`

### 4. Typography Rules (Unslop Discipline)
- **Display Headings**: `font-display font-semibold tracking-tight text-zinc-900 dark:text-zinc-50` (Outfit)
- **Section Kicker**: `text-xs font-mono font-semibold text-blue-600 dark:text-blue-400 tracking-wider uppercase`
- **Body Prose**: `font-body text-sm leading-relaxed text-zinc-600 dark:text-zinc-300 max-w-[72ch]` (DM Sans)
- **Unboxed Metadata**: `flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 font-medium` with `·` or `/` separators (Zero-Pill discipline)
- **Tabular Figures & Code**: `font-mono tabular-nums text-xs` (JetBrains Mono)
