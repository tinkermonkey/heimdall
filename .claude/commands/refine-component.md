# /refine-component

Analyze and fix a single Heimdall design system component. Automatically repairs all Critical and High priority deficiencies found — no human escalation needed for individual issues.

**Usage:** `/refine-component <ComponentName>`
**Example:** `/refine-component Button`, `/refine-component FilterDropdown`

---

## Your Task

You are refining the Heimdall component: **$ARGUMENTS**

Launch a single **general-purpose** sub-agent to perform Phases 1–3 (analyze, evaluate, fix). Wait for it to complete, then output only the Phase 4 report in the main conversation.

---

## Agent Instructions

Spawn a general-purpose agent with the following prompt (substituting `$ARGUMENTS` for the actual component name):

---

### Phase 1: Analyze

**Component file resolution:** Some components are co-located in a shared file rather than having their own `.tsx`. Before reading, check whether `src/components/$ARGUMENTS.tsx` exists. If it does not, search `src/components/` for which file exports `$ARGUMENTS` (e.g., `StatusBadge` is in `Badge.tsx`; `ToolBlock` and `ThinkingBlock` are in `ChatMessage.tsx`). Use that file for the analysis and note it in the report.

Gather and internally record the following:

```
COMPONENT FILE: <actual file path used>
CO-LOCATED: <yes/no — whether component shares a file with others>

PROPS INTERFACE:
  - propName: TypeName (default: value) — one-line description

CSS CLASSES: <list all classes defined in the .css file, or "none">

EXPORTS (from src/index.ts):
  - <list every exported symbol for this component>

SHOWCASE COVERAGE:
  - File: <which showcase file(s) contain this component>
  - Demonstrated prop variants: <list each variant shown with example>
  - Missing from showcase: <any props with visible effects that have no example>
  - Has PropsTable: <yes/no>
```

List every prop individually — not summarize ("has several props"). If a prop has no explicit default in the source, write "default: none".

1. Read `src/components/$ARGUMENTS.tsx` (or the resolved file) — extract every prop from the TypeScript interface with its type and default value, all state variables, event handlers, accessibility attributes (aria-*, role, tabIndex), and any subcomponents defined in the file.

2. Read `src/components/$ARGUMENTS.css` (if it exists) — list all CSS class names defined.

3. Find the docs showcase — search `docs/src/showcases/` for sections that demonstrate `$ARGUMENTS`. A component may appear in more than one showcase file; report all occurrences. Note which prop variants and states are actually shown in each.

4. Read `src/index.ts` — list every exported symbol for this component (component name + all exported prop type names).

---

### Phase 2: Evaluate

With the information from Phase 1, evaluate the component across these 6 dimensions. For each finding, assign a priority:

- **Critical** — Component cannot be properly controlled by a consumer; missing required prop; broken TypeScript type (e.g., `any` where a specific type is needed); exported type is missing or wrong
- **High** — Missing a common capability that forces consumers to work around the component; prop name is inconsistent with design system conventions; no default for a state that always needs one; hardcoded behavior that should be prop-driven
- **Medium** — Docs showcase missing a variant or state; minor prop naming improvement; missing optional convenience prop
- **Low** — Polish, edge case, nice-to-have

#### Dimension 1: TypeScript Interface Quality
- Are all props typed precisely? No `any`, no `object`, no `ReactNode` where a specific union would be better?
- Does the component extend the appropriate HTML element's props (e.g., `React.ButtonHTMLAttributes<HTMLButtonElement>`) so all native attributes pass through?
- Are all exported types actually exported from `src/index.ts`?
- Are prop names consistent with other Heimdall components (e.g., `isOpen` not `open`, `onClose` not `handleClose`)?

#### Dimension 2: Defaults
- Do defaults represent the most common use case?
- Is every optional prop that has a visual effect given a sensible default?
- Are boolean props default `false` unless the feature-on state is the expected norm?

#### Dimension 3: Capabilities Completeness
- Can a consumer control all meaningful visual states through props?
- Are there any hardcoded strings (labels, placeholder text, empty state messages) that should be props?
- Are there icon positions, sizes, colors, or layout variants that are hardcoded but should be configurable?
- For interactive components: are all callbacks exposed (onFocus, onBlur, onChange, etc.)?
- For compound components: are all subcomponents exported and typed?

#### Dimension 4: Docs Coverage
- Does the showcase demonstrate the component's primary purpose clearly?
- Are all props with visible effects shown in at least one example?
- Are interactive states (hover, focus, disabled, loading, error) shown where applicable?
- Is there a `PropsTable` in the showcase?

#### Dimension 5: React Patterns
- Does the component use `React.forwardRef` so consumers can attach refs?
- Is state management fully controlled (parent owns state via props + callbacks)?
- For compound components: is the context provider + subcomponent pattern used?
- Are expensive calculations wrapped in `useMemo`? Event handlers in `useCallback`?

#### Dimension 6: Accessibility
- Does the component have the correct ARIA role?
- Are interactive elements reachable and operable by keyboard?
- Are focus states visible (the design system focus ring: `0 0 0 3px rgba(245, 158, 11, 0.18)`)?
- Are labels/descriptions associated correctly?

---

### Phase 3: Fix

For every **Critical** and **High** finding, implement the fix immediately without asking for confirmation.

**Fixing rules:**
- Edit `src/components/$ARGUMENTS.tsx` — add props, fix types, add forwardRef, fix defaults, etc.
- Edit `src/components/$ARGUMENTS.css` if needed for accessibility (focus rings) or new variants
- Update the docs showcase in `docs/src/showcases/` to demonstrate new or corrected capabilities
- Update `src/index.ts` if new prop types need to be exported (add them to the existing export line for this component)
- Do NOT introduce breaking changes. Breaking changes include: renaming or removing any existing prop, changing a prop's type in a way that rejects values previously accepted (e.g., narrowing `string` to `'a' | 'b'`, or `number` to `number | null`), changing an existing callback's signature, and changing the default value of any existing prop. Adding new optional props with defaults is always safe.
- Do NOT add features beyond what the finding requires — fix precisely, no scope creep
- Do NOT add code comments explaining the fix — the code should be self-explanatory

**Medium and Low findings:** Do not fix. List them in the report.

---

### Agent Return Value

After completing Phase 3, return a structured result containing:

1. **Props Inventory (final state)** — full table of all props with type, default, and description
2. **Fixed list** — every Critical/High finding with what was changed
3. **Remaining list** — every Medium/Low finding (not fixed)
4. **Summary** — one or two sentences on the component's overall health after fixes

---

## Phase 4: Report

Once the agent completes, output this structured report to the user (and nothing else):

```
## $ARGUMENTS — Refinement Report

### Props Inventory (final state)
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| ...  | ...  | ...     | ...         |

### Fixed (Critical / High)
- [Priority] **Issue description** → What was changed

### Remaining (Medium / Low — not fixed)
- [Priority] **Issue description**

### Summary
One or two sentences on the component's overall health after fixes.
```
