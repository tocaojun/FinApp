-- FinApp Database Initialization Script
-- This script creates the database, user, and basic configuration

-- Create database user
CREATE USER finapp_user WITH PASSWORD 'FinApp2025!';

-- Create database
CREATE DATABASE finapp_test WITH 
    OWNER = finapp_user
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.UTF-8'
    LC_CTYPE = 'en_US.UTF-8'
    TEMPLATE = template0;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE finapp_test TO finapp_user;

-- Connect to the new database
\c finapp_test finapp_user;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS finapp AUTHORIZATION finapp_user;
CREATE SCHEMA IF NOT EXISTS audit AUTHORIZATION finapp_user;

-- Set default schema
ALTER USER finapp_user SET search_path = finapp, public;

-- Grant schema usage
GRANT USAGE ON SCHEMA finapp TO finapp_user;
GRANT USAGE ON SCHEMA audit TO finapp_user;
GRANT ALL ON SCHEMA finapp TO finapp_user;
GRANT ALL ON SCHEMA audit TO finapp_user;