# WhatsApp Micro-CRM & Broadcast Engine

Production-ready WhatsApp bulk messaging CRM for Indian cartridge retailers.

## ✨ Features

- OAuth 2.0 authentication (Meta)
- Contact management (upload, sync)
- Campaign lifecycle (create → schedule → send → complete)
- Real-time delivery tracking
- Automatic error handling & retries
- Full audit logging & compliance

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Start with Docker
docker-compose up -d

# Run migrations
npm run migrate

# Start development server
npm run dev
```

## 📦 Project Structure

- **src/** - Source code (Express app, utilities, routes, crons)
- **tests/** - Test files (115+ test cases)
- **prisma/** - Database schema & migrations
- **docs/** - Documentation
- **kubernetes/** - K8s manifests
- **frontend/** - React frontend (optional)

## 🧪 Testing

```bash
npm test              # Run all tests
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report
```

## 📚 Documentation

- [README.md](docs/README.md) - Overview
- [IMPLEMENTATION_GUIDE.md](docs/IMPLEMENTATION_GUIDE.md) - Architecture
- [DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) - Production setup

## 📄 License

MIT
