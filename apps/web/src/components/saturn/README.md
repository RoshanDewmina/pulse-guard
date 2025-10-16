# Saturn Design System

A comprehensive component library that matches the warm, elegant aesthetic of the Saturn home page.

## Design Principles

- **Warm Color Palette**: Uses `#37322F` for primary text and actions, with a cream background `#F7F5F3`
- **Typography**: Instrument Serif for headings, Inter for body text
- **Consistent Spacing**: Follows a predictable rhythm
- **Subtle Shadows**: Uses custom box shadows for depth without harshness
- **Rounded Elements**: Buttons and interactive elements use rounded-full for a friendly feel

## Color Palette

```typescript
Primary: #37322F
Primary Hover: #49423D
Background: #F7F5F3
Text Primary: #37322F
Text Secondary: rgba(55,50,47,0.80)
Text Muted: rgba(55,50,47,0.60)
Border: rgba(55,50,47,0.08)
```

## Components

### Core Components

#### SaturnCard
Container component with consistent styling.

```tsx
import { SaturnCard, SaturnCardHeader, SaturnCardTitle, SaturnCardDescription, SaturnCardContent } from '@/components/saturn';

<SaturnCard>
  <SaturnCardHeader>
    <SaturnCardTitle>Card Title</SaturnCardTitle>
    <SaturnCardDescription>Optional description</SaturnCardDescription>
  </SaturnCardHeader>
  <SaturnCardContent>
    Card content here
  </SaturnCardContent>
</SaturnCard>
```

#### SaturnButton
Themed buttons with multiple variants.

```tsx
import { SaturnButton } from '@/components/saturn';

<SaturnButton variant="primary">Primary Action</SaturnButton>
<SaturnButton variant="secondary">Secondary Action</SaturnButton>
<SaturnButton variant="ghost">Ghost Action</SaturnButton>
<SaturnButton variant="danger">Delete</SaturnButton>
```

#### SaturnBadge
Status and tag indicators.

```tsx
import { SaturnBadge } from '@/components/saturn';

<SaturnBadge variant="success">Success</SaturnBadge>
<SaturnBadge variant="warning">Warning</SaturnBadge>
<SaturnBadge variant="error">Error</SaturnBadge>
```

### Form Components

#### SaturnInput
Text input with consistent styling.

```tsx
import { SaturnInput, SaturnLabel } from '@/components/saturn';

<div>
  <SaturnLabel required>Email</SaturnLabel>
  <SaturnInput 
    type="email" 
    placeholder="you@example.com"
    error="Email is required"
  />
</div>
```

#### SaturnSelect
Custom dropdown component.

```tsx
import { SaturnSelect } from '@/components/saturn';

<SaturnSelect
  value={value}
  onValueChange={setValue}
  options={[
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
  ]}
  placeholder="Select an option"
/>
```

#### SaturnTextarea
Multi-line text input.

```tsx
import { SaturnTextarea } from '@/components/saturn';

<SaturnTextarea
  placeholder="Enter description"
  rows={4}
/>
```

#### SaturnSwitch
Toggle switch component.

```tsx
import { SaturnSwitch } from '@/components/saturn';

<SaturnSwitch
  checked={enabled}
  onCheckedChange={setEnabled}
  label="Enable feature"
/>
```

### Layout Components

#### PageHeader
Standardized page header with title and optional action.

```tsx
import { PageHeader } from '@/components/saturn';
import { SaturnButton } from '@/components/saturn';

<PageHeader
  title="Monitors"
  description="Manage your cron job monitors"
  action={<SaturnButton>Create Monitor</SaturnButton>}
/>
```

#### StatusIcon
Reusable status indicator.

```tsx
import { StatusIcon } from '@/components/saturn';

<StatusIcon status="OK" size="md" showLabel />
```

### Table Components

```tsx
import {
  SaturnTable,
  SaturnTableHeader,
  SaturnTableBody,
  SaturnTableRow,
  SaturnTableHead,
  SaturnTableCell,
} from '@/components/saturn';

<SaturnTable>
  <SaturnTableHeader>
    <SaturnTableRow>
      <SaturnTableHead>Name</SaturnTableHead>
      <SaturnTableHead>Status</SaturnTableHead>
    </SaturnTableRow>
  </SaturnTableHeader>
  <SaturnTableBody>
    <SaturnTableRow clickable onClick={handleClick}>
      <SaturnTableCell>Monitor 1</SaturnTableCell>
      <SaturnTableCell>Active</SaturnTableCell>
    </SaturnTableRow>
  </SaturnTableBody>
</SaturnTable>
```

### Dialog Components

```tsx
import {
  SaturnDialog,
  SaturnDialogContent,
  SaturnDialogHeader,
  SaturnDialogTitle,
  SaturnDialogDescription,
  SaturnDialogBody,
  SaturnDialogFooter,
} from '@/components/saturn';
import { SaturnButton } from '@/components/saturn';

<SaturnDialog open={isOpen} onOpenChange={setIsOpen}>
  <SaturnDialogContent onClose={() => setIsOpen(false)}>
    <SaturnDialogHeader>
      <SaturnDialogTitle>Dialog Title</SaturnDialogTitle>
      <SaturnDialogDescription>Optional description</SaturnDialogDescription>
    </SaturnDialogHeader>
    <SaturnDialogBody>
      Dialog content here
    </SaturnDialogBody>
    <SaturnDialogFooter>
      <SaturnButton variant="secondary" onClick={() => setIsOpen(false)}>
        Cancel
      </SaturnButton>
      <SaturnButton onClick={handleSubmit}>
        Confirm
      </SaturnButton>
    </SaturnDialogFooter>
  </SaturnDialogContent>
</SaturnDialog>
```

### Tab Components

```tsx
import { SaturnTabs } from '@/components/saturn';

<SaturnTabs
  tabs={[
    { id: 'tab1', label: 'Tab 1', content: <div>Content 1</div> },
    { id: 'tab2', label: 'Tab 2', content: <div>Content 2</div> },
  ]}
  defaultTab="tab1"
  onChange={(tabId) => console.log(tabId)}
/>
```

## Best Practices

1. **Use Consistent Typography**: Headings should use `font-serif`, body text should use `font-sans`
2. **Follow Color Guidelines**: Stick to the defined color palette for consistency
3. **Spacing**: Use the spacing constants for consistent margins and padding
4. **Accessibility**: All components include proper ARIA attributes and keyboard navigation
5. **Responsive Design**: Components are mobile-first and responsive by default

## Testing

All Saturn components include comprehensive unit tests. Run tests with:

```bash
bun test src/components/saturn
```

## Contributing

When adding new components:
1. Follow the existing naming convention (Saturn*)
2. Use the theme constants from `constants.ts`
3. Ensure TypeScript types are properly defined
4. Add comprehensive tests
5. Update this README with usage examples


