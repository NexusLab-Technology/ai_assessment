# MongoDB Setup Guide

This guide explains how to set up MongoDB for the AI Assessment module.

## Prerequisites

- Node.js installed
- npm or yarn package manager

## Installation Options

### Option 1: Local MongoDB Installation

#### macOS (using Homebrew)
```bash
# Install MongoDB Community Edition
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB service
brew services start mongodb-community

# Verify installation
brew services list | grep mongodb
```

#### Ubuntu/Debian
```bash
# Import MongoDB public GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Create list file for MongoDB
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Update package database
sudo apt-get update

# Install MongoDB
sudo apt-get install -y mongodb-org

# Start MongoDB service
sudo systemctl start mongod
sudo systemctl enable mongod
```

#### Windows
1. Download MongoDB Community Server from https://www.mongodb.com/try/download/community
2. Run the installer and follow the setup wizard
3. MongoDB will start automatically as a Windows service

### Option 2: MongoDB Atlas (Cloud)

1. Go to https://www.mongodb.com/atlas
2. Create a free account
3. Create a new cluster
4. Get your connection string
5. Update `.env.local` with your Atlas connection string:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ai-assessment-dev?retryWrites=true&w=majority
```

### Option 3: Docker

```bash
# Run MongoDB in Docker container
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  mongo:latest

# Update .env.local for Docker setup
MONGODB_URI=mongodb://admin:password@localhost:27017/ai-assessment-dev?authSource=admin
```

## Environment Configuration

Make sure your `.env.local` file contains:

```env
# MongoDB connection string
MONGODB_URI=mongodb://localhost:27017/ai-assessment-dev

# MongoDB database name
MONGODB_DB=ai-assessment-dev

# MongoDB connection options
MONGODB_OPTIONS=retryWrites=true&w=majority
```

## Testing the Connection

After setting up MongoDB, test the connection:

```bash
# Test MongoDB connection
node src/scripts/test-db.js
```

You should see:
```
✅ Connected to MongoDB successfully
📁 Available collections: []
🏓 Database ping successful

🎉 MongoDB setup is ready!
```

## Database Schema

The application will automatically create the following collections:

- `companies` - Company information
- `assessments` - Assessment data and responses
- `reports` - Generated AI reports

Indexes will be created automatically when the application starts.

## Troubleshooting

### Connection Refused Error
```
❌ MongoDB connection failed: connect ECONNREFUSED
```

**Solutions:**
1. Make sure MongoDB is running: `brew services start mongodb-community` (macOS)
2. Check if port 27017 is available: `lsof -i :27017`
3. Verify MongoDB status: `brew services list | grep mongodb`

### Authentication Failed
```
❌ MongoDB connection failed: Authentication failed
```

**Solutions:**
1. Check username/password in connection string
2. Ensure user has proper permissions
3. For Atlas, check IP whitelist settings

### Database Not Found
This is normal - MongoDB creates databases automatically when first accessed.

## Development vs Production

### Development
- Use local MongoDB instance
- Database: `ai-assessment-dev`
- No authentication required

### Production
- Use MongoDB Atlas or dedicated server
- Database: `ai-assessment-prod`
- Enable authentication and SSL
- Set up proper backup strategy

## Next Steps

Once MongoDB is set up and running:

1. The application will automatically create indexes on startup
2. You can start using the API endpoints
3. Data will be persisted to MongoDB instead of localStorage
4. Reports will be stored in the database

## Useful Commands

```bash
# Connect to MongoDB shell
mongosh

# Show databases
show dbs

# Use specific database
use ai-assessment-dev

# Show collections
show collections

# View collection data
db.companies.find().pretty()
db.assessments.find().pretty()
db.reports.find().pretty()
```