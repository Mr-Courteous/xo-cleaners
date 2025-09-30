# CleanPress Pro - Dry Cleaning Management System

A comprehensive dry cleaning management system built with React, TypeScript, and Express.js.

## Features

- **Customer Management** - Add, search, and manage customer information
- **Drop-off Processing** - Create tickets for new clothing drop-offs
- **Pickup Management** - Process customer pickups with search functionality
- **Rack Management** - Assign and track clothing placement on racks
- **Status Tracking** - Update ticket status through the cleaning workflow
- **Clothing Items** - Manage clothing types, pricing, and margins
- **Dashboard** - Overview of operations with key metrics

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Express.js, SQL.js (SQLite)
- **Icons**: Lucide React
- **Database**: SQLite with in-memory persistence

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm

### Installation & Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the application**:
   ```bash
   npm run dev
   ```
   This command starts both the frontend and backend servers concurrently.

### Manual Server Management

If you need to start the servers individually:

**Frontend only** (runs on http://localhost:3000):
```bash
npm run dev:client
```

**Backend only** (runs on http://localhost:3001):
```bash
npm run dev:server
```

## Application Structure

```
├── src/                    # Frontend React application
│   ├── components/         # React components
│   ├── hooks/             # Custom React hooks
│   ├── types/             # TypeScript type definitions
│   └── App.tsx            # Main application component
├── server/                # Backend Express server
│   ├── index.js          # Main server file
│   └── cleanpress.db     # SQLite database (auto-generated)
└── package.json          # Dependencies and scripts
```

## Usage

### 1. Drop-off Process
- Navigate to "Drop Off" in the main navigation
- Search for existing customers or create new ones
- Add clothing items with quantities and preferences
- Review and generate the ticket

### 2. Pickup Process
- Go to "Pick Up" section
- Search by customer name, phone, or ticket number
- View ticket details and process pickup when ready

### 3. Status Management
- Use "Status" section to update ticket workflow
- Move tickets through: Dropped Off → In Process → Ready → Picked Up

### 4. Rack Management
- Assign tickets to specific rack numbers
- View occupied and available racks
- Track clothing placement

### 5. Customer & Clothing Management
- Manage customer database
- Configure clothing types and pricing
- Set plant prices and profit margins

## Database Schema

The application uses SQLite with the following main tables:
- `customers` - Customer information
- `clothing_types` - Clothing items and pricing
- `tickets` - Drop-off tickets
- `ticket_items` - Individual clothing items per ticket
- `racks` - Rack management (500 racks available)

## API Endpoints

The backend provides RESTful API endpoints:
- `GET /api/customers/search` - Search customers
- `POST /api/customers` - Create new customer
- `GET /api/clothing-types` - Get clothing types
- `POST /api/tickets` - Create new ticket
- `GET /api/tickets/search` - Search tickets
- `PUT /api/tickets/:id/status` - Update ticket status
- `GET /api/racks` - Get rack information
- `GET /api/dashboard/stats` - Dashboard statistics

## Development

The application uses:
- **Hot reload** for both frontend and backend development
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Concurrent development** with automatic server restarts

## Production Deployment

To build for production:

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Troubleshooting

### Common Issues

1. **Port conflicts**: If ports 3000 or 3001 are in use, stop other applications or modify the ports in `vite.config.ts` and `server/index.js`

2. **Database issues**: The SQLite database is automatically created. If you encounter issues, delete `server/cleanpress.db` and restart the server

3. **Search not working**: Ensure both frontend and backend servers are running. Check the browser console for API errors

### Logs

- Frontend logs appear in the browser console
- Backend logs appear in the terminal where you ran `npm run dev`

## License

This project is for internal use and management of dry cleaning operations.


## build image


docker buildx build --platform linux/amd64 -t kacytunde/cleanpress:0.1 --push .
docker buildx build --platform linux/amd64 -t kacytunde/cleanpress-api:0.1 --push .


# One-time: enable buildx
docker buildx create --name multi --use
docker buildx inspect --bootstrap

# Replace USER/REPO:TAG with your Docker Hub repo
export IMAGE=USER/REPO:latest

# Build for both architectures and push a manifest list
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t kacytunde/cleanpress:0.2 \
  --push \
  .

# Build for both architectures and push a manifest list api
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t kacytunde/cleanpress-api:0.2 \
  --push \
  .


  ## start docker
  cd "/Users/babatundealaraje/Downloads/project 3" && docker-compose down && docker-compose up -d

  ## new way to build
  cd "/Users/babatundealaraje/Downloads/project 3/python_server" && docker buildx build --platform linux/amd64,linux/arm64 -t kacytunde/cleanpress-api:0.5 --push .


  cd "/Users/babatundealaraje/Downloads/project 3" && docker buildx build --platform linux/amd64,linux/arm64 -t kacytunde/cleanpress:0.7 --push .

  ### run project locally

  cd "/Users/babatundealaraje/Downloads/project 3/python_server" && source .venv/bin/activate && DATABASE_URL=postgresql://postgres:postgres@localhost:5433/cleanpress uvicorn main:app --reload --port 3001


  docker exec -it project3-db-1 psql -U postgres -d cleanpress