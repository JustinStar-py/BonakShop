# Lineicons Integration for Next.js

Lineicons is a comprehensive and modern icon library with **30,000+ handcrafted icons** in various styles such as outline, solid, duo-tone, and more. It works smoothly with React and Next.js projects, offering scalable and customizable SVG icons. :contentReference[oaicite:0]{index=0}

---

## 🚀 Installation

Install Lineicons React package and free icon set via NPM:

```bash
npm install @lineiconshq/react-lineicons @lineiconshq/free-icons
````

Or with Yarn:

```bash
yarn add @lineiconshq/react-lineicons @lineiconshq/free-icons
```

---

## 📌 Usage in Next.js

### 1) Import Icons

In any component (e.g. `app/page.tsx`):

```tsx
import { Lineicons } from "@lineiconshq/react-lineicons";
import { Home2Outlined, CloudBolt1Outlined } from "@lineiconshq/free-icons";
```

---

### 2) Render Icons

Use the `Lineicons` component with props:

```tsx
export default function HomePage() {
  return (
    <main>
      <h1>Welcome to Next.js + Lineicons</h1>

      <div>
        <Lineicons icon={Home2Outlined} size={32} color="#0070f3" />
        <Lineicons icon={CloudBolt1Outlined} size={32} color="#ff6600" />
      </div>
    </main>
  );
}
```

---

## 🎨 Props Overview

| Prop          | Type      | Description                          |
| ------------- | --------- | ------------------------------------ |
| `icon`        | Component | Required — icon component to display |
| `size`        | number    | Icon size in pixels                  |
| `color`       | string    | Color of the icon (CSS color)        |
| `strokeWidth` | number    | Optional — adjusts stroke thickness  |

Example with custom props:

```tsx
<Lineicons
  icon={Home2Outlined}
  size={48}
  color="purple"
  strokeWidth={2}
/>
```

---

## 📦 Alternative: Web Font (CSS)

If you want to use Lineicons as CSS icon fonts:

1. Install main package:

```bash
npm install lineicons
```

2. In your global layout (e.g. `app/layout.js`):

```tsx
import "lineicons/dist/lineicons.css";
```

3. Use the icon class in JSX:

```jsx
<i className="lni lni-home"></i>
```

---

## 🧠 Tips for Next.js

* Import only the icons you need to reduce bundle size.
* Store icon imports in a shared file for better organization.
* Customize via props rather than CSS classes for reliability.

---

## 🛠 Troubleshooting

If icons are not rendering:

* Ensure both `@lineiconshq/react-lineicons` and `@lineiconshq/free-icons` are installed.
* Verify correct icon names and imports.
* Restart the development server after installing new packages.

---

## 📚 Resources

* **Lineicons Official Site & Documentation** — complete docs and downloads available online. ([Lineicons][1])

```

---
