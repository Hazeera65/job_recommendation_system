# job_recommendation_system
# ASHA Chatbot

A web-based chatbot interface built using **Next.js**, **TypeScript**, **Tailwind CSS**, and **Shadcn UI**. The project provides a customizable and responsive chat interface designed for use with conversational AI or assistance systems.

## Features

- 🌐 Built on Next.js 13+ App Router
- ⚡ Fast performance using modern frontend tooling
- 🎨 Custom-styled with Tailwind CSS and Shadcn UI
- 💬 Modular chat components for easy reuse
- 🧠 Designed to integrate with any backend AI/chat service

## Technologies Used

- [Next.js](https://nextjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Shadcn UI](https://ui.shadcn.com/)
- [PNPM](https://pnpm.io/) (for package management)

## Getting Started

### Prerequisites

Ensure you have the following installed:

- Node.js (v18 or higher recommended)
- pnpm (or you can convert to npm/yarn if preferred)

### Installation

1. Clone the repository or download the ZIP.
2. Navigate to the project directory:
   ```bash
   cd asha-chatbot
Install dependencies:

pnpm install
Run the development server:
pnpm dev
Open http://localhost:3000 to view the chatbot in your browser.



Edit
.
├── app/                # Application routes and pages
├── components/         # Chat interface components and UI elements
├── public/             # Static assets (if any)
├── styles/             # Global styles
├── tailwind.config.ts  # Tailwind CSS configuration
├── tsconfig.json       # TypeScript configuration
└── package.json        # Project metadata and scripts
Customization
You can modify chat behavior by editing components/chat-interface.tsx.

Add or replace UI components using the reusable Shadcn UI-based elements in components/ui/.

License
This project is open-source and available under the MIT License.
