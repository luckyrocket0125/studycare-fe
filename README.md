# StudyCare AI - Frontend

Next.js 16 + React 19 frontend application for StudyCare AI platform.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Backend API running (or deployed URL)

### Installation

1. **Install dependencies**
```bash
npm install
```

2. **Set up environment variables**

Create `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

For production, use your deployed backend URL:
```env
NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app/api
```

3. **Start development server**
```bash
npm run dev
```

The app will run on `http://localhost:3000`

## 📁 Project Structure

```
frontend/
├── app/                 # Next.js app directory
│   ├── dashboard/      # Teacher dashboard
│   ├── caregiver/      # Caregiver dashboard
│   ├── student/        # Student dashboard
│   ├── login/          # Auth pages
│   └── layout.tsx      # Root layout
├── lib/                 # API client
├── public/              # Static assets
└── package.json
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Run production build
- `npm run lint` - Run ESLint

## 🎨 Features

- **Authentication**: Login and registration
- **Teacher Dashboard**: Class management and student activity
- **Student Dashboard**: Study sessions and AI chat
- **Caregiver Dashboard**: Monitor child activity
- **Responsive Design**: Mobile-friendly UI

## 🚀 Deployment

### Vercel (Recommended)
1. Import GitHub repository
2. Set root directory to `frontend`
3. Add environment variable: `NEXT_PUBLIC_API_URL`
4. Deploy

### Netlify
1. Import repository
2. Set base directory to `frontend`
3. Build command: `npm run build`
4. Publish directory: `.next`
5. Add environment variable: `NEXT_PUBLIC_API_URL`

### Render
1. Create new Static Site
2. Connect repository
3. Set root directory to `frontend`
4. Build command: `npm install && npm run build`
5. Publish directory: `.next`
6. Add environment variable: `NEXT_PUBLIC_API_URL`

## 🔧 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | Yes |



