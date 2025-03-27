Setup
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Run development server
npm run start:dev

# Run tests
npm test


Structure
src/
├── main.ts                # Entry point
├── app.module.ts          # Root module
├── modules/               # Feature modules
└── common/                # Shared utilities


API Documentation
Access Swagger at http://localhost:3000/api/docs

License
MIT