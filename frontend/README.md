# SecureThread Frontend

Modern React + TypeScript frontend for SecureThread VMS (Vulnerability Management System).

## 🚀 Tech Stack

- **React 18** - UI Library
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library
- **TanStack Query** - Data fetching
- **React Router** - Routing

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/SthIntern01/SecureThread.git

# Navigate to frontend
cd SecureThread/frontend

# Install dependencies
npm install

# Set up environment variables
cp .env. example .env
# Edit .env with your API URL and OAuth credentials

# Start development server
npm run dev
```

The app will be available at `http://localhost:8080`

## 🏗️ Project Structure

```
frontend/
├── src/
│   ├── components/     # Reusable UI components
│   ├── contexts/       # React Context providers (Auth, Theme, Workspace)
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utility functions
│   ├── pages/          # Page components (routes)
│   ├── services/       # API service layers
│   ├── App.tsx         # Root component with routing
│   ├── main.tsx        # App entry point
│   └── index.css       # Global styles & Tailwind
├── public/             # Static assets
├── index.html          # HTML template
└── vite.config.ts      # Vite configuration
```

## 🔐 Authentication

SecureThread supports multiple OAuth providers:
- GitHub
- GitLab  
- Bitbucket
- Google

## 📦 Key Features

- **Multi-workspace support** - Manage multiple teams/projects
- **Repository scanning** - Automated vulnerability detection
- **AI-powered chat** - Get security recommendations
- **Dark/Light theme** - Customizable UI
- **Real-time notifications** - Toast & Sonner alerts

## 🧪 Available Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## 🌐 Environment Variables

```env
VITE_API_URL=http://localhost:8000
VITE_GITHUB_CLIENT_ID=your_github_client_id
VITE_GITLAB_CLIENT_ID=your_gitlab_client_id
VITE_BITBUCKET_CLIENT_ID=your_bitbucket_client_id
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

## 📄 License

[Add your license here]

## 🤝 Contributing

[Add contribution guidelines]