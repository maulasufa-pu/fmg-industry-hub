# Currency Dropdown Advanced Component

A highly customizable currency selector component with multiple variants, sizes, and styling options.

## Features

- 🎨 **Multiple Variants**: Default, Compact, Minimal, Simple
- 📏 **Flexible Sizing**: Small, Medium, Large
- 🔍 **Built-in Search**: Quick currency lookup
- 🌐 **14 Currencies**: USD, IDR, EUR, JPY, GBP, AUD, CAD, SGD, KRW, VND, INR, PHP, THB, MYR
- ⚡ **Framer Motion**: Smooth animations
- 🌙 **Dark Mode**: Full dark mode support
- ♿ **Accessible**: Keyboard navigation and ARIA labels
- 🎯 **TypeScript**: Full type safety

## Installation

```tsx
import { CurrencyDropdownAdvanced, type Currency } from "@/components/CurrencyDropdownAdvanced";
```

## Basic Usage

```tsx
import { useState } from "react";
import { CurrencyDropdownAdvanced, type Currency } from "@/components/CurrencyDropdownAdvanced";

function MyComponent() {
  const [currency, setCurrency] = useState<Currency>("USD");
  
  return (
    <CurrencyDropdownAdvanced 
      value={currency} 
      onChange={setCurrency}
    />
  );
}
```

## Variants

### Default (PageClient Style)
Full-featured with backdrop blur, shadows, and search.

```tsx
<CurrencyDropdownAdvanced 
  value={currency} 
  onChange={setCurrency}
  variant="default"
/>
```

### Compact
Cleaner design with subtle styling.

```tsx
<CurrencyDropdownAdvanced 
  value={currency} 
  onChange={setCurrency}
  variant="compact"
  size="sm"
/>
```

### Minimal
Transparent background, no borders, minimal styling.

```tsx
<CurrencyDropdownAdvanced 
  value={currency} 
  onChange={setCurrency}
  variant="minimal"
  showName={false}
/>
```

### Simple
Basic, straightforward design.

```tsx
<CurrencyDropdownAdvanced 
  value={currency} 
  onChange={setCurrency}
  variant="simple"
  showSymbol={false}
/>
```

## Sizes

```tsx
// Small
<CurrencyDropdownAdvanced value={currency} onChange={setCurrency} size="sm" />

// Medium (default)
<CurrencyDropdownAdvanced value={currency} onChange={setCurrency} size="md" />

// Large
<CurrencyDropdownAdvanced value={currency} onChange={setCurrency} size="lg" />
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `Currency` | **required** | Currently selected currency code |
| `onChange` | `(currency: Currency) => void` | **required** | Callback when currency changes |
| `loading` | `boolean` | `false` | Show loading state |
| `disabled` | `boolean` | `false` | Disable the dropdown |
| `className` | `string` | `""` | Additional CSS classes |
| `options` | `CurrencyOption[]` | `DEFAULT_CURRENCY_OPTIONS` | Custom currency list |
| `variant` | `"default" \| "compact" \| "minimal" \| "simple"` | `"default"` | Visual variant |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | Component size |
| `showName` | `boolean` | `true` (for default) | Show currency name in button |
| `showSymbol` | `boolean` | `true` | Show currency symbol in dropdown |
| `showSearch` | `boolean` | `true` | Show search input |
| `placeholder` | `string` | `"Search currency..."` | Search input placeholder |

## Advanced Examples

### Custom Currency List

```tsx
import { CurrencyDropdownAdvanced, type CurrencyOption } from "@/components/CurrencyDropdownAdvanced";

const cryptoCurrencies: CurrencyOption[] = [
  { code: "BTC", name: "Bitcoin", flag: "₿", symbol: "BTC" },
  { code: "ETH", name: "Ethereum", flag: "Ξ", symbol: "ETH" },
];

<CurrencyDropdownAdvanced 
  value={currency} 
  onChange={setCurrency}
  options={cryptoCurrencies}
/>
```

### Minimal Navbar Style

```tsx
<CurrencyDropdownAdvanced 
  value={currency} 
  onChange={setCurrency}
  variant="minimal"
  size="sm"
  showName={false}
  showSearch={false}
  className="ml-auto"
/>
```

### Loading State

```tsx
<CurrencyDropdownAdvanced 
  value={currency} 
  onChange={setCurrency}
  loading={isLoadingRates}
/>
```

### Disabled State

```tsx
<CurrencyDropdownAdvanced 
  value={currency} 
  onChange={setCurrency}
  disabled={!isAuthenticated}
/>
```

## Styling

The component uses Tailwind CSS classes and respects your theme configuration. Each variant has its own color scheme:

- **Default**: Blue accent, glass morphism
- **Compact**: Violet/Indigo accent, clean borders
- **Minimal**: Indigo accent, transparent
- **Simple**: Slate gray, straightforward

## TypeScript

```tsx
import type { 
  Currency, 
  CurrencyOption, 
  CurrencyDropdownVariant, 
  CurrencyDropdownSize,
  CurrencyDropdownAdvancedProps 
} from "@/components/CurrencyDropdownAdvanced";
```

## Exports

- `CurrencyDropdownAdvanced` - Main component
- `Currency` - Currency code type
- `CurrencyOption` - Currency object interface
- `DEFAULT_CURRENCY_OPTIONS` - Default currency list
- `CurrencyDropdownVariant` - Variant type
- `CurrencyDropdownSize` - Size type
- `CurrencyDropdownAdvancedProps` - Component props interface

## Browser Support

- Chrome/Edge: ✅
- Firefox: ✅
- Safari: ✅
- Mobile browsers: ✅

## Accessibility

- Keyboard navigation (Tab, Enter, Escape)
- Focus management
- ARIA labels
- Screen reader friendly

## Performance

- Efficient re-renders with React.useState
- Memoized filtered options
- Smooth animations with Framer Motion
- No external API calls (static list)

## Migration from Old Component

### Before (PageClient.tsx)
```tsx
<CurrencyDropdown
  value={currency}
  onChange={setCurrency}
  loading={loading}
/>
```

### After
```tsx
<CurrencyDropdownAdvanced
  value={currency}
  onChange={setCurrency}
  loading={loading}
  variant="default"  // Same style as before
/>
```

## License

Part of FMG Industry Hub project.
