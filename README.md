# Breadboard

A UI breadboarding app for sketching interface concepts using a text-based notation inspired by the Shape Up methodology.

## What is Breadboarding?

Breadboarding is a lightweight notation method for sketching interface concepts at the right level of abstraction. It helps teams move fast and explore different ideas without getting dragged down by visual details.

## Features

- **Text-based syntax**: Edit breadboards using simple, indentation-based syntax
- **Visual rendering**: See your breadboard rendered in real-time with React Flow
- **Split-pane interface**: Text editor on the left, visual diagram on the right
- **Export functionality**: Export your breadboard source as markdown

## Syntax

### Places

Top-level items (non-list) represent places - navigable destinations like screens or dialogs:

```
Login Page
Dashboard
Settings.page
```

### Items

Markdown list items (lines starting with `-`) represent interactive elements within places:

```
Login Page
- Username
- Password
- Login button
```

### Type Annotations

Use type annotations to specify element types:

- `.input` - Input field
- `.button` - Button
- `.page` - Page (for places)
- `.dialog` - Dialog (for places)
- `[]` prefix - Checkbox
- `()` prefix - Radio button

Example:

```
Login Page
- Username.input
- Password.input
- [] Remember me
- Login.button
```

### Links

Use `=>` to create connections between elements:

```
Login Page
- Login.button => Dashboard

Dashboard
- Logout.button => Login Page
```

### Separators

Use `- ---` (list item with three or more dashes) to create visual separators:

```
Dashboard
- Welcome message
- Recent items
- ---
- Logout button
```

### Nesting

Items can be nested with indentation to represent hierarchy:

```
Settings
- Account
  - Profile.button
  - Password.button
- Preferences
  - Theme selector
  - Language selector
```

## Getting Started

### Install dependencies

```bash
npm install
```

### Run development server

```bash
npm run dev
```

### Build for production

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

## Example

```
Login Page
- Username.input
- Password.input
- [] Remember me
- Login.button => Dashboard

Dashboard
- Welcome message
- Recent items
- ---
- Logout.button => Login Page
```

## Technology Stack

- React 18
- TypeScript
- Vite
- React Flow (for node visualization)
- Tailwind CSS (for styling)
