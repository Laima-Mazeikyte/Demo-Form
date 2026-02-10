# IDS Hackathon 2026 Participants

A fully accessible web application for showcasing participants of the IDS (Into Design Systems) Hackathon 2026. Built to demonstrate and test the [Make-It-Accessible-Skill](https://github.com/Laima-Mazeikyte/make-it-accessible-skill) while providing a fun way for hackathon participants to connect with each other.

## Overview

This project is a participant directory where hackathon attendees can:
- View random participant cards with their profiles
- Add their own participation card with LinkedIn, portfolio, and project links
- Browse all participants and projects
- Experience a fully WCAG 2.2 AA compliant interface

## Features

### Main Page (`index.html`)
- **Dynamic Card Grid**: Displays a randomized grid of participant cards that adapts to viewport size
- **Fruit Avatar System**: Assigns colorful fruit emojis as default avatars (or custom uploaded images)
- **Add Yourself Card**: Featured center card inviting new participants to join
- **Refresh Functionality**: Get a new random selection of participants
- **Accessible Form**: Full-screen form for adding your participation details

### All Participants Page (`all-participants.html`)
- Complete list of all hackathon participants
- Randomized order to give equal visibility

### All Projects Page (`all-projects.html`)
- Groups projects by name
- Displays all unique URLs for each project
- Randomized order to give equal visibility

## Accessibility Features

This project was built with accessibility as a core requirement, implementing WCAG 2.2 AA standards:

### Semantic HTML
- Proper landmark regions (`<header>`, `<main>`, `<footer>`, `<nav>`)
- Semantic elements throughout (`<article>`, `<button>`, `<form>`)
- Skip link for keyboard navigation

### ARIA Implementation
- Proper ARIA labels and descriptions
- Live regions for dynamic content announcements
- Form validation with `aria-invalid` and `aria-describedby`
- Hidden decorative elements marked with `aria-hidden="true"`

### Keyboard Navigation
- All interactive elements keyboard accessible
- Visible focus indicators
- Escape key to close modals
- Tab order follows logical flow

### Form Accessibility
- Required fields clearly marked
- Real-time validation with descriptive error messages
- Hint text for complex fields
- Proper autocomplete attributes
- File upload with size and type validation

### Screen Reader Support
- Descriptive labels for all controls
- Status announcements for dynamic changes
- Visually hidden text for context (e.g., "opens in new tab")
- Estimated reading time for announcements

### Visual Design
- Sufficient color contrast ratios (4.5:1 for normal text, 3:1 for large text)
- Focus indicators visible on all interactive elements
- Responsive design that works across devices

### Technology Stack

- **Frontend**: Vanilla JavaScript (ES6 modules)
- **Database**: [InstantDB](https://www.instantdb.com/) - Real-time database
- **Styling**: CSS with custom properties
- **Hosting**: Static files (can be deployed anywhere)

### Testing Checklist

- [x] Keyboard navigation (Tab, Shift+Tab, Enter, Space, Escape)
- [x] Screen reader compatibility (tested with NVDA/JAWS/VoiceOver)
- [x] Color contrast ratios (WCAG AA compliant)
- [x] Form validation and error handling
- [x] Focus management
- [x] Live region announcements
- [x] Skip links
- [x] Semantic HTML structure

---

Built with ❤️ by Team A11y the IDS Hackathon 2026
