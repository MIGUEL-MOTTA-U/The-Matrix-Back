# Bad Ice Cream - Backend

## Table of Contents
- [Description](#description)
- [System Architecture](#system-architecture)
- [Technologies Used](#technologies-used)
- [Design Patterns](#design-patterns)
- [Installation and Configuration](#installation-and-configuration)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Database](#database)
- [Implemented Features](#implemented-features)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Authors](#authors)
- [References and Resources](#references-and-resources)

## Description
Bad Ice Cream is a multiplayer game where players control ice cream characters navigating through levels, collecting fruits while avoiding enemies. This backend implementation serves as the server-side component of the game, handling real-time game state, player interactions, and game logic. The project was developed as part of an academic exercise to demonstrate the implementation of real-time multiplayer game architecture using modern web technologies.

The backend handles:
- WebSocket connections for real-time communication
- Multi-player management
- Level and scoring system
- Collision and game physics handling
- Game state storage in Redis

## System Architecture
The system follows a layered architecture pattern with the following components:

1. **Presentation Layer**
   - REST API endpoints for game management
   - WebSocket connections for real-time game updates
   - Input validation and request handling

2. **Application Layer**
   - Game logic and business rules
   - Player session management
   - Game state management

3. **Domain Layer**
   - Core game entities and their relationships
   - Game rules and mechanics
   - Domain events and handlers

4. **Infrastructure Layer**
   - Redis for game state storage
   - Worker threads for parallel processing
   - Error handling and logging

The architecture implements the following patterns:
- Repository Pattern for data access
- Observer Pattern for game events
- Factory Pattern for game object creation
- Strategy Pattern for game mechanics

## Technologies Used
### Core Technologies
- **Runtime**: Node.js v22.x
- **Framework**: Fastify v5.3.2
- **Language**: TypeScript v5.8.2
- **Package Manager**: pnpm v10.x
- **Database**: 
  - Redis v7.x (for game state)
  - PostgreSQL (via Prisma ORM)

### Development Tools
- **Code Quality**:
  - Biome v1.9.4 (Linting & Formatting)
  - TypeScript strict mode enabled
  - ESLint configuration with strict rules

- **Testing**:
  - Vitest v3.0.8 (Test runner)
  - Coverage reporting with Istanbul
  - Test timeout: 20000ms

- **Documentation**:
  - TypeDoc v0.28.2 (API documentation)
  - OpenAPI/Swagger

- **Containerization**:
  - Docker & Docker Compose
  - Multi-container setup:
    - Redis service
    - PostgreSQL service

### CI/CD & Quality Assurance
- **SonarCloud Analysis**:
  - Automated analysis on push to main/develop
  - Pull request quality gates
  - Code coverage tracking
  - Code quality metrics

### Development Workflow
- **Scripts**:
  ```bash
  # Development
  pnpm dev          # Start development server
  pnpm build        # Build for production
  pnpm start        # Start production server
  
  # Code Quality
  pnpm lint         # Run Biome linter
  pnpm format       # Format code with Biome
  pnpm check        # Run all checks
  pnpm check:fix    # Fix all issues
  
  # Testing
  pnpm test         # Run tests
  pnpm coverage     # Run tests with coverage
  
  # Database
  pnpm prisma:generate    # Generate Prisma client
  pnpm prisma:migrate     # Run database migrations
  pnpm prisma:studio      # Open Prisma Studio
  
  # Documentation
  pnpm doc          # Generate API documentation
  ```

### Code Style & Standards
- **Biome Configuration**:
  - Single quotes for strings
  - 2 spaces indentation
  - 100 characters line width
  - Trailing commas in ES5 mode
  - Semicolons required
  - Strict TypeScript rules
  - No unused variables
  - Warning for explicit any types

## Design Patterns
1. **Observer Pattern**
   - Used for game event handling
   - Implements pub/sub for real-time updates
   - Manages player notifications

2. **Factory Pattern**
   - Creates game objects (players, enemies, items)
   - Manages object initialization
   - Handles object configuration

3. **Repository Pattern**
   - Abstracts data access layer
   - Manages game state persistence
   - Handles Redis operations

4. **Strategy Pattern**
   - Implements different game mechanics
   - Manages player movement strategies
   - Handles collision detection algorithms

## Installation and Configuration
1. **Prerequisites**
   ```bash
   node >= 18.x
   docker >= 20.x
   docker-compose >= 2.x
   ```

2. **Environment Setup**
   Create a `.env` file with:
   ```env
   
   # Server
    PORT=3000
    #PORT=5000 # For backend tests
    HOST=localhost
    NODE_ENV=development # For pnpm dev
    #NODE_ENV=production # For pnpm start

    # Security
    JWT_SECRET=your-super-secret-jwt-key-here
    CORS_ORIGIN=http://localhost:3000

    # Development database connection string
    DB_URI=postgresql://username:password@localhost:5432/database_name?pgbouncer=true
    DB_DIRECT_URL=postgresql://username:password@localhost:5432/database_name
    DB_USER=username
    DB_PASSWORD=password
    DB_NAME=database_name

    # Logging
    LOG_LEVEL=info

    MATCH_TIME_SECONDS=300 # 300 seconds = 5 minutes
    ENEMIES_SPEED_MS=1000 # 1 second
    TIMER_SPEED_MS=1000 # 1 second

    # Database
    #REDIS_URL=redis://default:your-redis-password@your-redis-host:6379
    DB_URI=postgresql://user.example:your-database-password@your-db-host.pooler.supabase.com:6543/postgres?pgbouncer=true
    DB_DIRECT_URL=postgresql://user.example:your-database-password@your-db-host.pooler.supabase.com:5432/postgres
    DB_USER=user.example
    DB_PASSWORD=your-database-password
    DB_NAME=postgres

    # PROD 

    DB_URI_PROD=postgresql://user.prod:your-prod-password@your-prod-host.pooler.supabase.com:6543/postgres?pgbouncer=true
    DB_DIRECT_URL_PROD=postgresql://user.prod:your-prod-password@your-prod-host.pooler.supabase.com:5432/postgres
    DB_USER_PROD=user.prod
    DB_PASSWORD_PROD=your-prod-password
    DB_NAME_PROD=postgres

    #AZURE_TENANT_ID=your-tenant-id-here
    #REDIRECT_URL=http://localhost:3001/startscreen
    #LOGOUT_REDIRECT_URL=http://localhost:3001/
    AZURE_TENANT_ID="common"

    # === App Cliente (OAuth) ===
    AZURE_CLIENT_ID=your-client-id-here
    AZURE_CLIENT_SECRET=your-client-secret-here

    # === App API ===
    AZURE_API_APP_ID=your-api-app-id-here

    REDIRECT_URL=https://yourdomain.vercel.app/redirect
    LOGOUT_URL=https://yourdomain.vercel.app/

    SERVICE_BUS_QUEUE_NAME="your-queue-name"
    SERVICE_BUS_CONNECTION_STRING="Endpoint=sb://yourservicebus.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=your-service-bus-key-here"
   
   ```

3. **Dependencies Installation**
   ```bash
   pnpm install
   ```

4. **Database Setup**
   ```bash
   docker-compose up -d
   ```

## Project Structure
```
├── src/                    # Source code
├── test/                   # Test files
├── docs/                   # Generated documentation
├── coverage/              # Test coverage reports
├── dist/                  # Compiled output
├── .github/              # GitHub workflows
│   └── workflows/        # CI/CD configurations
├── biome.json            # Biome configuration
├── vitest.config.ts      # Vitest configuration
├── tsconfig.json         # TypeScript configuration
├── sonar-project.properties # SonarCloud configuration
└── docker-compose.yml    # Docker services configuration
```

## API Documentation
### REST Endpoints (Prefix: /rest)
1. **Health Check**
   - `GET /rest/health` - Server health check

2. **Authentication**
   - `GET /rest/login` - Azure AD login
   - `GET /rest/logout` - Azure AD logout
   - `GET /rest/redirect` - OAuth2 redirect handler

3. **User Management**
   - `POST /rest/users` - Create new user
   - `GET /rest/users/:userId` - Get user information

4. **Match Management**
   - `POST /rest/users/:userId/matches` - Create new match
   - `GET /rest/users/:userId/matches` - Get user matches
   - `PUT /rest/users/:userId/matches/:matchId` - Update match

### WebSocket Endpoints (Prefix: /ws)
1. **Matchmaking**
   - `GET /ws/matchmaking/:matchId` - Join matchmaking queue
   - `GET /ws/keep-playing/:userId/:matchId` - Continue playing after match
   - `GET /ws/publish-match/:userId/:matchId` - Publish match for others to join
   - `GET /ws/join-game/:userId/:matchId` - Join an existing match

2. **Game Connection**
   - `GET /ws/game/:userId/:matchId` - Connect to active game session

### WebSocket Events
1. **Game Events**
   - `game:start` - Game session started
   - `game:update` - Game state update
   - `game:end` - Game session ended

2. **Player Events**
   - `player:move` - Player movement update
   - `player:action` - Player action (e.g., create ice block)
   - `player:collision` - Collision detection event

## Database
The system uses Redis for in-memory data storage with the following key structures:

1. **Game State**
   ```
   game:{id}:state -> Game state object
   game:{id}:players -> Set of player IDs
   ```

2. **Player Data**
   ```
   player:{id}:data -> Player data object
   player:{id}:position -> Current position
   ```

## Implemented Features
1. **Game Management**
   - Multiplayer game sessions
   - Real-time game state updates
   - Level progression system

2. **Player Features**
   - Player movement and actions
   - Collision detection
   - Score tracking

3. **System Features**
   - Real-time communication
   - State persistence
   - Error handling

## Testing
1. **Unit Tests**
   ```bash
   pnpm test
   ```

2. **Coverage Report**
   ```bash
   pnpm coverage
   ```

## Deployment
The project is designed to be deployed in a Web App Service from Microsoft Azure. The deployment process is automated through GitHub Actions workflows. While the application uses Docker for local development and testing, the production deployment is handled through Azure's Web App Service.

Environment Configuration:
- Set `NODE_ENV=production`
- Configure production Redis
- Set up SSL certificates

## Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Authors
- Miguel Motta
- Santiago Avellaneda
- Andres Serrato

## References and Resources
1. [Fastify Documentation](https://www.fastify.io/docs/latest/)
2. [Redis Documentation](https://redis.io/documentation)
3. [WebSocket Protocol](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
4. [Node.js Worker Threads](https://nodejs.org/api/worker_threads.html)
