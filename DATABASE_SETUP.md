# Database Setup Guide

This guide will help you set up PostgreSQL for the QRIS Classifier application.

## Prerequisites

- PostgreSQL 12 or higher installed on your system
- Node.js and npm installed
- Access to PostgreSQL with superuser privileges (for database creation)

## Installation Steps

### 1. Install PostgreSQL

#### On macOS (using Homebrew):
```bash
brew install postgresql
brew services start postgresql
```

#### On Ubuntu/Debian:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### On Windows:
Download and install PostgreSQL from [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)

### 2. Create Database and User

1. Connect to PostgreSQL as superuser:
```bash
# On macOS/Linux
sudo -u postgres psql

# On Windows (if installed with default settings)
psql -U postgres
```

2. Create the database:
```sql
CREATE DATABASE qris_classifier;
```

3. Create a user (optional, you can use the default postgres user):
```sql
CREATE USER qris_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE qris_classifier TO qris_user;
```

4. Exit PostgreSQL:
```sql
\q
```

### 3. Run Database Setup Script

1. Navigate to your project directory:
```bash
cd /path/to/qris-classifier
```

2. Run the setup script:
```bash
# Using postgres user
psql -U postgres -d qris_classifier -f setup-database.sql

# Or using your custom user
psql -U qris_user -d qris_classifier -f setup-database.sql
```

### 4. Configure Environment Variables

The `.env` file has been configured with default PostgreSQL settings:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=qris_classifier
DB_USER=postgres
DB_PASSWORD=postgres
```

**Important**: Update the `DB_PASSWORD` in your `.env` file to match your PostgreSQL setup.

### 5. Install Node.js Dependencies

Make sure you have the PostgreSQL client library installed:

```bash
npm install
```

The `pg` and `@types/pg` packages should already be included in package.json.

### 6. Start the Application

```bash
npm run dev
```

The application will:
1. Attempt to connect to PostgreSQL
2. Create the default admin user if it doesn't exist
3. Fall back to in-memory storage if database connection fails

## Default Admin Credentials

- **Email**: admin@qris-classifier.com
- **Password**: admin123
- **API Key**: Will be generated and displayed in console on first startup

**Important**: Change the default admin password after first login!

## Database Schema

The setup script creates the following tables:

- `users` - User accounts and authentication
- `api_keys` - API key management
- `request_logs` - API request logging
- `system_logs` - Application system logs

## Troubleshooting

### Connection Issues

1. **"Connection refused"**: Ensure PostgreSQL is running
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list | grep postgresql  # macOS
```

2. **"Authentication failed"**: Check your username/password in `.env`

3. **"Database does not exist"**: Make sure you created the database as shown in step 2

### Permission Issues

1. **"Permission denied"**: Ensure your user has proper privileges:
```sql
GRANT ALL PRIVILEGES ON DATABASE qris_classifier TO your_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_user;
```

### Fallback Mode

If database connection fails, the application will:
- Log a warning message
- Use in-memory storage for users and API keys
- Continue functioning with limited persistence

## Production Considerations

1. **Security**:
   - Use strong, unique passwords
   - Enable SSL/TLS for database connections
   - Restrict database access to application servers only

2. **Performance**:
   - Configure appropriate connection pooling
   - Set up database monitoring
   - Regular backups

3. **Environment Variables**:
   - Use secure secret management for production
   - Never commit real credentials to version control

## Backup and Restore

### Backup
```bash
pg_dump -U postgres qris_classifier > backup.sql
```

### Restore
```bash
psql -U postgres qris_classifier < backup.sql
```