# FMG Industry Hub - Installer Guide

![FMG Industry Hub](https://img.shields.io/badge/FMG-Industry%20Hub-blue?style=for-the-badge)
![Version](https://img.shields.io/badge/Version-1.0.0-green?style=for-the-badge)
![License](https://img.shields.io/badge/License-Proprietary-red?style=for-the-badge)

## 📋 Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Database Setup](#database-setup)
5. [Configuration](#configuration)
6. [Development](#development)
7. [Testing](#testing)
8. [Deployment](#deployment)
9. [Monitoring](#monitoring)
10. [Maintenance](#maintenance)
11. [Troubleshooting](#troubleshooting)
12. [Performance Optimization](#performance-optimization)
13. [Security](#security)
14. [Support](#support)

## Overview
FMG Industry Hub is a comprehensive music industry platform built with modern technologies. This enterprise-grade application provides end-to-end music business solutions from creation to distribution.

### 🏗 Architecture
- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **Real-time**: WebSocket connections for chat and notifications
- **File Storage**: Supabase Storage with CDN
- **Payments**: Multi-gateway support (Stripe, PayPal, Midtrans)
- **Deployment**: Vercel Edge Network with global CDN

### 🎯 Key Features
- Multi-tenant architecture with role-based access
- Real-time collaboration tools
- Advanced project management
- Secure file handling and watermarking
- Multi-currency payment processing
- Comprehensive analytics and reporting

## Prerequisites

### 💻 System Requirements

#### Minimum Requirements
- **CPU**: 2-core processor (Intel i3 or AMD equivalent)
- **RAM**: 4GB available memory
- **Storage**: 10GB free disk space
- **Network**: Stable internet connection (10 Mbps+)

#### Recommended Requirements
- **CPU**: 4-core processor (Intel i5/i7 or AMD Ryzen 5/7)
- **RAM**: 8GB+ available memory
- **Storage**: 20GB+ SSD storage
- **Network**: High-speed internet (50 Mbps+)

#### Software Dependencies
- **Node.js**: Version 18.x or higher (LTS recommended)
- **npm**: Version 8.x or higher (comes with Node.js)
- **Git**: Latest version (2.40+)
- **Code Editor**: VS Code recommended with extensions:
  - TypeScript and JavaScript Language Features
  - Tailwind CSS IntelliSense
  - ES7+ React/Redux/React-Native snippets
  - Prettier - Code formatter
  - ESLint

#### Operating System Support
- **Windows**: 10/11 (64-bit)
- **macOS**: 10.15 Catalina or later
- **Linux**: Ubuntu 20.04+, CentOS 8+, or equivalent

### 🔐 Required Accounts
- **[Supabase](https://supabase.com)** - Backend database and authentication (Free tier: 500MB database, 2GB bandwidth)
- **[Vercel](https://vercel.com)** - Deployment platform (Free tier: 100GB bandwidth)
- **[GitHub](https://github.com)** - Version control and CI/CD
- **[Stripe](https://stripe.com)** - Payment processing (optional for MVP)
- **[Google Cloud](https://cloud.google.com)** - Additional services (optional)

## 🚀 Installation

### Step 1: Environment Preparation

#### 1.1 Verify Prerequisites
```bash
# Check Node.js version
node --version  # Should be 18.x or higher

# Check npm version
npm --version   # Should be 8.x or higher

# Check Git version
git --version   # Should be 2.40 or higher
```

#### 1.2 Global Dependencies (Optional)
```bash
# Install useful global packages
npm install -g @vercel/cli      # Vercel CLI for deployment
npm install -g typescript       # TypeScript compiler
npm install -g eslint          # Linting tool
npm install -g prettier        # Code formatter
```

### Step 2: Repository Setup

#### 2.1 Clone Repository
```bash
# Clone the repository
git clone https://github.com/maulasufa-pu/fmg-industry-hub.git

# Navigate to project directory
cd fmg-industry-hub

# Check repository status
git status
git branch -a
```

#### 2.2 Branch Management
```bash
# Create development branch (recommended)
git checkout -b development

# Or work on specific feature branch
git checkout -b feature/your-feature-name
```

### Step 3: Dependencies Installation

#### 3.1 Clean Installation
```bash
# Clear npm cache (if needed)
npm cache clean --force

# Install all dependencies
npm install

# Verify installation
npm list --depth=0
```

#### 3.2 Development Dependencies
```bash
# Install additional dev dependencies (if needed)
npm install --save-dev @types/node
npm install --save-dev eslint-config-next
npm install --save-dev prettier-plugin-tailwindcss
```

### Step 4: Environment Configuration

#### 4.1 Create Environment Files
```bash
# For Windows (PowerShell)
New-Item -Path ".env.local" -ItemType "File"
New-Item -Path ".env.example" -ItemType "File"

# For macOS/Linux
touch .env.local
touch .env.example
```

#### 4.2 Environment Variables
Add the following to `.env.local`:

```env
# ===========================================
# CORE APPLICATION SETTINGS
# ===========================================

# Application Environment
NODE_ENV=development
NEXT_PUBLIC_APP_NAME="FMG Industry Hub"
NEXT_PUBLIC_APP_VERSION="1.0.0"

# Application URLs
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# ===========================================
# SUPABASE CONFIGURATION
# ===========================================

# Supabase Project Settings
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Supabase Storage
NEXT_PUBLIC_SUPABASE_STORAGE_URL=your_supabase_storage_url

# ===========================================
# AUTHENTICATION & SECURITY
# ===========================================

# Auth Configuration
NEXTAUTH_SECRET=your_nextauth_secret_key
JWT_SECRET=your_jwt_secret_key

# Security Settings
DISABLE_AUTH_DEBUG=false
ENABLE_DEBUG_MODE=true

# Session Configuration
SESSION_TIMEOUT=86400000  # 24 hours in milliseconds

# ===========================================
# PAYMENT PROCESSING
# ===========================================

# Stripe Configuration
STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# PayPal Configuration (Optional)
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret

# Midtrans Configuration (for Indonesian market)
MIDTRANS_SERVER_KEY=your_midtrans_server_key
MIDTRANS_CLIENT_KEY=your_midtrans_client_key

# ===========================================
# THIRD-PARTY INTEGRATIONS
# ===========================================

# Google Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# GitHub OAuth (Optional)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# ===========================================
# EMAIL & NOTIFICATIONS
# ===========================================

# Email Service (Resend/SendGrid/Nodemailer)
EMAIL_FROM=noreply@flemmomusic.com
RESEND_API_KEY=your_resend_api_key

# SMS Notifications (Optional)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token

# ===========================================
# FILE STORAGE & CDN
# ===========================================

# File Upload Limits
MAX_FILE_SIZE=104857600  # 100MB in bytes
ALLOWED_FILE_TYPES=mp3,wav,aiff,pdf,doc,docx,jpg,jpeg,png

# CDN Configuration
CDN_URL=https://your-cdn-domain.com

# ===========================================
# MONITORING & ANALYTICS
# ===========================================

# Error Tracking (Sentry)
SENTRY_DSN=your_sentry_dsn
SENTRY_ORG=your_sentry_org
SENTRY_PROJECT=your_sentry_project

# Performance Monitoring
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your_vercel_analytics_id

# ===========================================
# DEVELOPMENT SETTINGS
# ===========================================

# Debug Settings
DEBUG_ENABLED=true
LOG_LEVEL=debug

# Hot Reload Settings
FAST_REFRESH=true

# ===========================================
# PRODUCTION OVERRIDES
# ===========================================
# Note: These will be overridden in production

# Production URLs (override in production)
# NEXT_PUBLIC_SITE_URL=https://your-production-domain.com
# NEXTAUTH_URL=https://your-production-domain.com

# Production Security (override in production)
# DISABLE_AUTH_DEBUG=true
# ENABLE_DEBUG_MODE=false
# NODE_ENV=production
```

#### 4.3 Environment Validation
Create `scripts/validate-env.js`:

```javascript
// scripts/validate-env.js
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_SITE_URL'
];

function validateEnvironment() {
  const missing = requiredEnvVars.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => console.error(`   - ${key}`));
    process.exit(1);
  }
  
  console.log('✅ All required environment variables are set');
}

validateEnvironment();
```

Add to `package.json` scripts:
```json
{
  "scripts": {
    "validate-env": "node scripts/validate-env.js",
    "dev": "npm run validate-env && next dev",
    "build": "npm run validate-env && next build"
  }
}
```

## 🗄 Database Setup

### Step 5: Supabase Project Creation

#### 5.1 Create Supabase Project
1. **Navigate to Supabase Dashboard**
   - Go to [https://app.supabase.com](https://app.supabase.com)
   - Sign in or create account

2. **Create New Project**
   - Click "New Project"
   - **Organization**: Select or create organization
   - **Project Name**: `FMG Industry Hub`
   - **Database Password**: Generate strong password (save it!)
   - **Region**: Choose closest to your users:
     - `us-east-1` for North America
     - `eu-west-1` for Europe
     - `ap-southeast-1` for Asia Pacific

3. **Wait for Setup** (2-5 minutes)
   - Project provisioning
   - Database initialization
   - API endpoint generation

#### 5.2 Configure Authentication

```sql
-- Enable additional auth providers (optional)
-- Go to Authentication > Settings > Auth Providers

-- Configure email templates
-- Go to Authentication > Settings > Email Templates
-- Customize confirmation, recovery, and magic link emails
```

#### 5.3 Complete Database Schema

Run the following SQL in Supabase SQL Editor:

```sql
-- ===========================================
-- EXTENSIONS & SECURITY
-- ===========================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- PROFILES TABLE
-- ===========================================

CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  bio TEXT,
  website TEXT,
  location TEXT,
  timezone TEXT DEFAULT 'UTC',
  
  -- Role Management
  main_role TEXT DEFAULT 'client' CHECK (main_role IN ('client', 'admin', 'owner')),
  staff_role TEXT[] DEFAULT '{}',
  
  -- Preferences
  language TEXT DEFAULT 'en',
  currency TEXT DEFAULT 'USD',
  email_notifications BOOLEAN DEFAULT true,
  marketing_emails BOOLEAN DEFAULT false,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  onboarding_completed BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- PROJECTS TABLE
-- ===========================================

CREATE TABLE projects (
  project_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Project Details
  title TEXT NOT NULL,
  description TEXT,
  brief_url TEXT, -- URL to uploaded project brief
  genre TEXT,
  style TEXT,
  references TEXT[], -- Array of reference URLs or descriptions
  
  -- Status & Timeline
  status TEXT DEFAULT 'requested' CHECK (status IN (
    'requested', 'pending', 'in_progress', 'revision', 
    'approved', 'published', 'archived', 'cancelled', 'draft'
  )),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  deadline DATE,
  estimated_completion DATE,
  
  -- Financial
  budget DECIMAL(12,2),
  currency TEXT DEFAULT 'USD',
  quoted_price DECIMAL(12,2),
  final_price DECIMAL(12,2),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN (
    'pending', 'partial', 'paid', 'refunded', 'cancelled'
  )),
  
  -- Project Management
  assigned_to UUID REFERENCES auth.users(id),
  tags TEXT[],
  internal_notes TEXT,
  client_notes TEXT,
  
  -- File Management
  files_url TEXT[], -- Array of file URLs
  deliverables_url TEXT[], -- Array of deliverable URLs
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- ===========================================
-- PROJECT MESSAGES TABLE
-- ===========================================

CREATE TABLE project_messages (
  message_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(project_id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Message Content
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'system', 'status_update')),
  file_url TEXT,
  file_name TEXT,
  file_size BIGINT,
  
  -- Message Status
  is_read BOOLEAN DEFAULT false,
  is_internal BOOLEAN DEFAULT false, -- Internal messages (admin only)
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- SERVICES TABLE
-- ===========================================

CREATE TABLE services (
  service_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Service Details
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  detailed_description TEXT,
  category TEXT NOT NULL,
  subcategory TEXT,
  
  -- Pricing
  base_price DECIMAL(12,2),
  currency TEXT DEFAULT 'USD',
  pricing_type TEXT DEFAULT 'fixed' CHECK (pricing_type IN ('fixed', 'hourly', 'custom')),
  
  -- Service Configuration
  delivery_time_days INTEGER DEFAULT 7,
  revision_limit INTEGER DEFAULT 3,
  requires_consultation BOOLEAN DEFAULT false,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- PAYMENTS TABLE
-- ===========================================

CREATE TABLE payments (
  payment_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(project_id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Payment Details
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_method TEXT, -- 'stripe', 'paypal', 'bank_transfer', etc.
  payment_intent_id TEXT, -- Stripe payment intent ID
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded'
  )),
  
  -- Provider Details
  provider_payment_id TEXT,
  provider_fee DECIMAL(12,2),
  net_amount DECIMAL(12,2),
  
  -- Metadata
  metadata JSONB,
  failure_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- ===========================================
-- SYSTEM SETTINGS TABLE
-- ===========================================

CREATE TABLE system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  is_public BOOLEAN DEFAULT false,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- AUDIT LOG TABLE
-- ===========================================

CREATE TABLE audit_logs (
  log_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  
  -- Action Details
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- INDEXES FOR PERFORMANCE
-- ===========================================

-- Profiles indexes
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_main_role ON profiles(main_role);
CREATE INDEX idx_profiles_created_at ON profiles(created_at);
CREATE INDEX idx_profiles_is_active ON profiles(is_active);

-- Projects indexes
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_at ON projects(created_at);
CREATE INDEX idx_projects_deadline ON projects(deadline);
CREATE INDEX idx_projects_assigned_to ON projects(assigned_to);

-- Messages indexes
CREATE INDEX idx_messages_project_id ON project_messages(project_id);
CREATE INDEX idx_messages_user_id ON project_messages(user_id);
CREATE INDEX idx_messages_created_at ON project_messages(created_at);

-- Payments indexes
CREATE INDEX idx_payments_project_id ON payments(project_id);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at);

-- ===========================================
-- ROW LEVEL SECURITY POLICIES
-- ===========================================

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND main_role IN ('admin', 'owner')
    )
  );

-- Projects policies
CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT USING (
    auth.uid() = user_id OR 
    auth.uid() = assigned_to OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND main_role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Users can create projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    auth.uid() = assigned_to OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND main_role IN ('admin', 'owner')
    )
  );

-- Messages policies
CREATE POLICY "Project members can view messages" ON project_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE project_id = project_messages.project_id 
      AND (user_id = auth.uid() OR assigned_to = auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND main_role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Project members can send messages" ON project_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE project_id = project_messages.project_id 
      AND (user_id = auth.uid() OR assigned_to = auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND main_role IN ('admin', 'owner')
    )
  );

-- Services policies (public read)
CREATE POLICY "Anyone can view active services" ON services
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage services" ON services
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND main_role IN ('admin', 'owner')
    )
  );

-- Payments policies
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND main_role IN ('admin', 'owner')
    )
  );

-- ===========================================
-- FUNCTIONS & TRIGGERS
-- ===========================================

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at 
  BEFORE UPDATE ON projects 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at 
  BEFORE UPDATE ON services 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to log profile changes
CREATE OR REPLACE FUNCTION log_profile_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values)
  VALUES (
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    'profiles',
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Audit trigger for profiles
CREATE TRIGGER audit_profiles_changes
  AFTER INSERT OR UPDATE OR DELETE ON profiles
  FOR EACH ROW EXECUTE FUNCTION log_profile_changes();

-- ===========================================
-- INITIAL DATA
-- ===========================================

-- Insert default services
INSERT INTO services (name, slug, description, category, base_price, currency, delivery_time_days) VALUES
('Song Production', 'song-production', 'Complete song production from concept to master', 'production', 1500.00, 'USD', 14),
('Mixing', 'mixing', 'Professional mixing of your recorded tracks', 'audio', 300.00, 'USD', 5),
('Mastering', 'mastering', 'Professional mastering for streaming and physical release', 'audio', 150.00, 'USD', 3),
('Songwriting', 'songwriting', 'Original song composition and lyric writing', 'creative', 800.00, 'USD', 10),
('Beat Making', 'beat-making', 'Custom instrumental beats in any genre', 'production', 200.00, 'USD', 7),
('Vocal Recording', 'vocal-recording', 'Professional vocal recording session', 'recording', 250.00, 'USD', 3),
('Music Distribution', 'distribution', 'Distribute your music to all major platforms', 'business', 50.00, 'USD', 1),
('Copyright Registration', 'copyright', 'Professional copyright registration service', 'legal', 100.00, 'USD', 5);

-- Insert system settings
INSERT INTO system_settings (key, value, description, category, is_public) VALUES
('app_name', '"FMG Industry Hub"', 'Application name', 'general', true),
('app_version', '"1.0.0"', 'Current application version', 'general', true),
('maintenance_mode', 'false', 'Enable maintenance mode', 'system', false),
('max_file_size', '104857600', 'Maximum file upload size in bytes', 'files', false),
('supported_currencies', '["USD", "IDR", "EUR", "GBP"]', 'Supported payment currencies', 'payments', true),
('default_currency', '"USD"', 'Default currency for new users', 'payments', true),
('email_from', '"noreply@flemmomusic.com"', 'Default from email address', 'email', false),
('support_email', '"hello@flemmomusic.com"', 'Support contact email', 'contact', true);
```

#### 5.4 Configure Storage

1. **Enable Storage**
   - Go to Storage section in Supabase dashboard
   - Create storage bucket: `project-files`
   - Set bucket as public or private based on needs

2. **Storage Policies**
```sql
-- Storage policies for project files
CREATE POLICY "Users can upload own project files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'project-files' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own project files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'project-files' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

#### 5.5 Get Supabase Configuration

1. **Navigate to Project Settings**
   - Go to Settings → API
   - Copy the following credentials:

2. **Required Keys**
   ```
   Project URL: https://your-project-id.supabase.co
   Anon/Public Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   Service Role Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (keep secret!)
   ```

3. **Database Connection String** (for advanced use)
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres
   ```

#### 5.6 Test Database Connection

Create `scripts/test-db.js`:
```javascript
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('services')
      .select('count')
      .limit(1);
      
    if (error) throw error;
    
    console.log('✅ Database connection successful');
    console.log('📊 Services table accessible');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();
```

## 💻 Development

### Step 6: Development Environment

#### 6.1 Start Development Server
```bash
# Validate environment first
npm run validate-env

# Start development server
npm run dev

# Alternative: Start with specific port
npm run dev -- --port 3001

# Start with debug logging
DEBUG=* npm run dev
```

#### 6.2 Development URLs
- **Frontend**: http://localhost:3000
- **API Routes**: http://localhost:3000/api
- **Admin Dashboard**: http://localhost:3000/admin
- **Client Dashboard**: http://localhost:3000/client

#### 6.3 Development Tools

**Hot Reload Features**:
- Automatic page refresh on file changes
- Fast Refresh for React components
- API route hot reloading
- CSS hot reloading with Tailwind

**Development Scripts**:
```bash
# Development with logging
npm run dev:debug

# Development with specific environment
NODE_ENV=development npm run dev

# Development with Turbopack (experimental)
npm run dev -- --turbo
```

#### 6.4 Code Quality Tools

```bash
# Linting
npm run lint              # Check for linting errors
npm run lint:fix          # Auto-fix linting errors

# Type checking
npm run type-check        # TypeScript type checking

# Formatting
npm run format            # Format code with Prettier
npm run format:check      # Check if code is formatted

# All quality checks
npm run quality-check     # Run all checks
```

Add to `package.json`:
```json
{
  "scripts": {
    "dev": "npm run validate-env && next dev",
    "dev:debug": "DEBUG=* npm run dev",
    "build": "npm run validate-env && npm run type-check && next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "quality-check": "npm run lint && npm run type-check && npm run format:check",
    "validate-env": "node scripts/validate-env.js",
    "test-db": "node scripts/test-db.js"
  }
}
```

## 🧪 Testing

### Step 7: Testing Setup

#### 7.1 Install Testing Dependencies
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom jest jest-environment-jsdom
```

#### 7.2 Configure Jest
Create `jest.config.js`:
```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/pages/(.*)$': '<rootDir>/src/pages/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
}

module.exports = createJestConfig(customJestConfig)
```

#### 7.3 Test Scripts
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --watchAll=false"
  }
}
```

#### 7.4 Example Tests
Create `__tests__/components/Button.test.tsx`:
```typescript
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button Component', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })
})
```

### Step 8: Build for Production

#### 8.1 Production Build
```bash
# Full production build
npm run build

# Build with bundle analysis
npm run build:analyze

# Build and export static files
npm run export
```

#### 8.2 Build Optimization
Create `next.config.ts`:
```typescript
import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig: NextConfig = {
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  
  // Image optimization
  images: {
    domains: ['your-supabase-project.supabase.co'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
  
  // Bundle analysis
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
      }
    }
    return config
  },
}

export default process.env.NODE_ENV === 'production' 
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      silent: true,
    })
  : nextConfig
```

#### 8.3 Production Testing
```bash
# Build and start production server locally
npm run build && npm start

# Test production build
npm run test:ci

# Performance testing
npm run lighthouse  # If lighthouse is configured
```

## 🚀 Deployment

### Step 9: Production Deployment

#### Option 1: Vercel Deployment (Recommended)

##### 9.1 Prepare for Deployment
```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel
vercel login

# Link project to Vercel
vercel link
```

##### 9.2 Configure Environment Variables
```bash
# Set environment variables via CLI
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY

# Or use Vercel dashboard
# Go to Project Settings → Environment Variables
```

**Production Environment Variables**:
```env
# Production URLs
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXTAUTH_URL=https://your-domain.com

# Security Settings
NODE_ENV=production
DISABLE_AUTH_DEBUG=true
ENABLE_DEBUG_MODE=false

# Performance Settings
VERCEL_ANALYTICS_ID=your_analytics_id
```

##### 9.3 Deploy
```bash
# Preview deployment
vercel

# Production deployment
vercel --prod

# Deploy with specific settings
vercel --prod --env production
```

##### 9.4 Custom Domain Setup
```bash
# Add custom domain
vercel domains add your-domain.com

# Verify domain
vercel domains verify your-domain.com
```

#### Option 2: Docker Deployment

##### 9.5 Create Dockerfile
```dockerfile
# Multi-stage build for production
FROM node:18-alpine AS base

# Install dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --only=production && npm cache clean --force

# Build the app
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build application
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
```

##### 9.6 Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
    restart: unless-stopped
    
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped
```

#### Option 3: VPS/Server Deployment

##### 9.7 Server Requirements
- **CPU**: 2+ cores
- **RAM**: 4GB+ (8GB recommended)
- **Storage**: 20GB+ SSD
- **OS**: Ubuntu 20.04+ or CentOS 8+

##### 9.8 Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y

# Install SSL certificate (Let's Encrypt)
sudo apt install certbot python3-certbot-nginx -y
```

##### 9.9 Deploy Application
```bash
# Clone repository on server
git clone https://github.com/maulasufa-pu/fmg-industry-hub.git
cd fmg-industry-hub

# Install dependencies
npm ci --only=production

# Build application
npm run build

# Start with PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

**PM2 Configuration** (`ecosystem.config.js`):
```javascript
module.exports = {
  apps: [
    {
      name: 'fmg-industry-hub',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: './',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
    },
  ],
}
```

##### 9.10 Nginx Configuration
```nginx
# /etc/nginx/sites-available/fmg-industry-hub
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📊 Monitoring

### Step 10: Application Monitoring

#### 10.1 Performance Monitoring

**Vercel Analytics** (if using Vercel):
```typescript
// pages/_app.tsx
import { Analytics } from '@vercel/analytics/react'

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Analytics />
    </>
  )
}
```

**Custom Analytics Setup**:
```typescript
// lib/analytics.ts
export const analytics = {
  track: (event: string, properties?: any) => {
    if (typeof window !== 'undefined') {
      // Google Analytics 4
      gtag('event', event, properties)
      
      // Custom tracking
      console.log('Analytics:', event, properties)
    }
  }
}
```

#### 10.2 Error Monitoring with Sentry

```bash
# Install Sentry
npm install @sentry/nextjs
```

**Sentry Configuration** (`sentry.client.config.ts`):
```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  debug: false,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
})
```

#### 10.3 Health Checks

Create `pages/api/health.ts`:
```typescript
import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Check database connection
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const { error } = await supabase
      .from('system_settings')
      .select('key')
      .limit(1)
    
    if (error) throw error
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        api: 'operational'
      }
    })
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    })
  }
}
```

#### 10.4 Logging Setup

```typescript
// lib/logger.ts
import winston from 'winston'

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
})

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }))
}

export default logger
```

## 🔧 Maintenance

### Step 11: Ongoing Maintenance

#### 11.1 Database Maintenance

**Regular Backups**:
```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > backups/backup_$DATE.sql
```

**Performance Monitoring**:
```sql
-- Monitor slow queries
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;

-- Check index usage
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname = 'public'
ORDER BY n_distinct DESC;
```

#### 11.2 Security Updates

```bash
# Regular security updates
npm audit
npm audit fix

# Update dependencies
npm update
npm outdated
```

#### 11.3 Performance Optimization

**Bundle Analysis**:
```bash
# Analyze bundle size
npm run build:analyze

# Check for unused dependencies
npx depcheck
```

**Database Optimization**:
```sql
-- Analyze table statistics
ANALYZE;

-- Reindex if needed
REINDEX DATABASE your_database_name;

-- Vacuum tables
VACUUM ANALYZE;
```

#### 11.4 Monitoring Scripts

Create `scripts/health-check.js`:
```javascript
const https = require('https')

const healthCheck = () => {
  const options = {
    hostname: 'your-domain.com',
    port: 443,
    path: '/api/health',
    method: 'GET'
  }

  const req = https.request(options, (res) => {
    console.log(`Health check status: ${res.statusCode}`)
  })

  req.on('error', (error) => {
    console.error('Health check failed:', error)
    process.exit(1)
  })

  req.end()
}

healthCheck()
```

## Configuration

### Authentication Setup
The app uses Supabase Auth with the following providers:
- Email/Password (default)
- Google OAuth (optional)
- GitHub OAuth (optional)

### Currency Support
Supported currencies:
- USD (US Dollar)
- IDR (Indonesian Rupiah)
- EUR (Euro)
- GBP (British Pound)

### Role-Based Access
- **Client**: Access to client dashboard, project creation
- **Admin**: Access to admin panel, user management
- **Owner**: Full system access

## 🔧 Troubleshooting

### Step 12: Common Issues & Solutions

#### 12.1 Installation Issues

**Node.js Version Errors**:
```bash
# Error: Node.js version not supported
# Solution: Install correct Node.js version
nvm install 18
nvm use 18

# Or download from nodejs.org
```

**NPM Installation Failures**:
```bash
# Clear cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Alternative package managers
yarn install
# or
pnpm install
```

**Permission Errors (Linux/Mac)**:
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules

# Use nvm instead of system Node.js
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
```

#### 12.2 Environment Configuration Issues

**Missing Environment Variables**:
```bash
# Debug environment issues
node -e "console.log(process.env)" | grep SUPABASE

# Validate specific variables
echo $NEXT_PUBLIC_SUPABASE_URL
```

**Supabase Connection Errors**:
```javascript
// Test connection script
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

supabase
  .from('profiles')
  .select('count')
  .then(({ data, error }) => {
    if (error) {
      console.error('❌ Supabase connection failed:', error.message)
    } else {
      console.log('✅ Supabase connection successful')
    }
  })
```

**CORS Issues**:
```typescript
// Check Supabase CORS settings
// Go to Authentication → Settings → Site URL
// Add: http://localhost:3000, https://your-domain.com
```

#### 12.3 Database Issues

**Migration Failures**:
```sql
-- Check current schema
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- Reset RLS if needed
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

**RLS Policy Errors**:
```sql
-- Debug RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public';

-- Test policies
SET ROLE authenticated;
SELECT * FROM profiles WHERE id = 'test-user-id';
RESET ROLE;
```

#### 12.4 Build & Development Issues

**TypeScript Errors**:
```bash
# Type checking
npx tsc --noEmit

# Fix common issues
npm install --save-dev @types/react @types/node

# Clear Next.js cache
rm -rf .next
npm run build
```

**Tailwind CSS Not Working**:
```bash
# Rebuild CSS
npm run build:css

# Check Tailwind config
npx tailwindcss-cli build src/app/globals.css -o output.css
```

**Next.js Build Errors**:
```bash
# Clear all caches
rm -rf .next node_modules/.cache
npm run build

# Check memory usage
node --max-old-space-size=4096 node_modules/.bin/next build
```

#### 12.5 Runtime Issues

**Authentication Problems**:
```typescript
// Debug auth state
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      console.log('Auth event:', event, session)
    }
  )
  return () => subscription.unsubscribe()
}, [])
```

**File Upload Issues**:
```typescript
// Check file upload limits
const MAX_SIZE = 100 * 1024 * 1024 // 100MB
if (file.size > MAX_SIZE) {
  throw new Error('File too large')
}

// Check file types
const ALLOWED_TYPES = ['audio/mpeg', 'audio/wav', 'image/jpeg', 'image/png']
if (!ALLOWED_TYPES.includes(file.type)) {
  throw new Error('File type not allowed')
}
```

**Payment Processing Issues**:
```typescript
// Debug Stripe webhooks
// Check webhook endpoint: /api/webhooks/stripe
// Verify webhook secret in Stripe dashboard
```

#### 12.6 Performance Issues

**Slow Page Loads**:
```bash
# Analyze bundle
npm run build:analyze

# Check for large dependencies
npx webpack-bundle-analyzer .next/static/chunks/*.js
```

**Database Performance**:
```sql
-- Check slow queries
SELECT query, mean_time, calls
FROM pg_stat_statements
WHERE mean_time > 1000
ORDER BY mean_time DESC;

-- Add missing indexes
CREATE INDEX CONCURRENTLY idx_projects_user_status 
ON projects(user_id, status);
```

#### 12.7 Production Issues

**Server Memory Issues**:
```bash
# Monitor memory usage
free -h
htop

# Increase PM2 memory limit
pm2 start ecosystem.config.js --max-memory-restart 1G
```

**SSL Certificate Issues**:
```bash
# Renew Let's Encrypt certificate
sudo certbot renew

# Test SSL configuration
openssl s_client -connect your-domain.com:443
```

## ⚡ Performance Optimization

### Step 13: Optimization Strategies

#### 13.1 Frontend Optimization

**Next.js Optimizations**:
```typescript
// next.config.ts
const nextConfig = {
  // Enable compression
  compress: true,
  
  // Optimize images
  images: {
    domains: ['your-supabase-project.supabase.co'],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  },
  
  // Enable SWC minification
  swcMinify: true,
  
  // Optimize fonts
  optimizeFonts: true,
  
  // Experimental features
  experimental: {
    // Enable app directory
    appDir: true,
    // Server components
    serverComponents: true,
    // Turbopack for dev
    turbo: {
      loaders: {
        '.svg': ['@svgr/webpack'],
      },
    },
  },
  
  // Bundle analyzer
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    if (!dev && !isServer) {
      config.plugins.push(
        new webpack.optimize.LimitChunkCountPlugin({
          maxChunks: 1,
        })
      )
    }
    return config
  },
}
```

**Code Splitting & Lazy Loading**:
```typescript
// Dynamic imports for large components
const ChartComponent = dynamic(() => import('./ChartComponent'), {
  loading: () => <div>Loading chart...</div>,
  ssr: false
})

// Lazy load pages
const AdminDashboard = lazy(() => import('./AdminDashboard'))
```

**Caching Strategies**:
```typescript
// API route caching
export async function GET() {
  const data = await fetchData()
  
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30'
    }
  })
}

// Static generation with revalidation
export const revalidate = 3600 // 1 hour
```

#### 13.2 Database Optimization

**Query Optimization**:
```sql
-- Add strategic indexes
CREATE INDEX CONCURRENTLY idx_projects_status_created 
ON projects(status, created_at DESC);

CREATE INDEX CONCURRENTLY idx_messages_project_created 
ON project_messages(project_id, created_at DESC);

-- Composite indexes for common queries
CREATE INDEX CONCURRENTLY idx_projects_user_status_updated 
ON projects(user_id, status, updated_at DESC);
```

**Connection Pool Configuration**:
```typescript
// lib/supabase.ts - Server side only
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    db: {
      schema: 'public',
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: { 'x-my-custom-header': 'my-app-name' },
    },
  }
)
```

#### 13.3 Caching Implementation

**Redis Caching** (Optional):
```typescript
// lib/cache.ts
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)

export const cache = {
  async get(key: string) {
    const value = await redis.get(key)
    return value ? JSON.parse(value) : null
  },
  
  async set(key: string, value: any, ttl = 3600) {
    await redis.setex(key, ttl, JSON.stringify(value))
  },
  
  async del(key: string) {
    await redis.del(key)
  }
}
```

**Memory Caching**:
```typescript
// lib/memory-cache.ts
class MemoryCache {
  private cache = new Map()
  private timers = new Map()
  
  set(key: string, value: any, ttl = 60000) {
    this.cache.set(key, value)
    
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key))
    }
    
    this.timers.set(key, setTimeout(() => {
      this.cache.delete(key)
      this.timers.delete(key)
    }, ttl))
  }
  
  get(key: string) {
    return this.cache.get(key)
  }
}

export const memoryCache = new MemoryCache()
```

## 🔒 Security

### Step 14: Security Implementation

#### 14.1 Environment Security

**Environment Variable Management**:
```bash
# Production environment security
# Use different keys for each environment
SUPABASE_SERVICE_ROLE_KEY_DEV=your_dev_key
SUPABASE_SERVICE_ROLE_KEY_PROD=your_prod_key

# API key rotation script
#!/bin/bash
echo "Rotating API keys..."
# Add your key rotation logic here
```

**Secrets Management**:
```typescript
// lib/secrets.ts
const getSecret = (key: string): string => {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

export const secrets = {
  supabaseUrl: getSecret('NEXT_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: getSecret('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  supabaseServiceKey: getSecret('SUPABASE_SERVICE_ROLE_KEY'),
}
```

#### 14.2 Authentication Security

**JWT Token Validation**:
```typescript
// middleware/auth.ts
import jwt from 'jsonwebtoken'

export function validateToken(token: string) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!)
    return decoded
  } catch (error) {
    throw new Error('Invalid token')
  }
}
```

**Rate Limiting**:
```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '10 s'),
  analytics: true,
})
```

#### 14.3 Data Security

**Input Validation**:
```typescript
// lib/validation.ts
import { z } from 'zod'

export const projectSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000),
  budget: z.number().positive().max(1000000),
  currency: z.enum(['USD', 'IDR', 'EUR', 'GBP']),
})

export function validateProject(data: unknown) {
  return projectSchema.parse(data)
}
```

**SQL Injection Prevention**:
```typescript
// Use parameterized queries with Supabase
const { data, error } = await supabase
  .from('projects')
  .select('*')
  .eq('user_id', userId) // Automatically parameterized
  .eq('status', status)
```

#### 14.4 File Upload Security

**File Validation**:
```typescript
// lib/file-validation.ts
const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
const ALLOWED_TYPES = [
  'audio/mpeg', 'audio/wav', 'audio/aiff',
  'image/jpeg', 'image/png', 'image/webp',
  'application/pdf', 'text/plain'
]

export function validateFile(file: File): boolean {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size exceeds limit')
  }
  
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('File type not allowed')
  }
  
  return true
}
```

**Virus Scanning** (Optional):
```typescript
// lib/virus-scan.ts
import NodeClam from 'clamscan'

const clamscan = await new NodeClam().init()

export async function scanFile(filePath: string): Promise<boolean> {
  try {
    const { isInfected } = await clamscan.scanFile(filePath)
    return !isInfected
  } catch (error) {
    console.error('Virus scan failed:', error)
    return false
  }
}
```

#### 14.5 HTTPS & SSL

**SSL Configuration**:
```bash
# Generate SSL certificate with Let's Encrypt
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Test SSL configuration
curl -I https://your-domain.com
```

**Security Headers**:
```typescript
// next.config.ts
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
]

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}
```

## 📞 Support

### Step 15: Getting Help & Resources

#### 15.1 Documentation Resources
- **[Next.js Documentation](https://nextjs.org/docs)** - Complete Next.js guide
- **[Supabase Documentation](https://supabase.com/docs)** - Database and auth setup
- **[Tailwind CSS Documentation](https://tailwindcss.com/docs)** - Styling framework
- **[TypeScript Documentation](https://www.typescriptlang.org/docs)** - Type safety
- **[Vercel Documentation](https://vercel.com/docs)** - Deployment platform

#### 15.2 Support Channels

**Primary Support**:
- **Email**: hello@flemmomusic.com
- **Response Time**: 24-48 hours
- **Languages**: English, Indonesian

**Technical Support**:
- **GitHub Issues**: [Create Issue](https://github.com/maulasufa-pu/fmg-industry-hub/issues)
- **Documentation**: Check USER_MANUAL.md for user guides
- **System Status**: Monitor application health at `/api/health`

#### 15.3 Before Contacting Support

**Preparation Checklist**:
1. ✅ Check this installer guide for solutions
2. ✅ Review error logs and console output
3. ✅ Test with a minimal reproduction case
4. ✅ Gather system information:
   ```bash
   node --version
   npm --version
   git --version
   cat package.json | grep version
   ```

**Information to Include**:
- **Environment**: Development/Staging/Production
- **Operating System**: Windows/macOS/Linux version
- **Node.js Version**: `node --version`
- **Error Messages**: Full error text and stack traces
- **Steps to Reproduce**: Detailed reproduction steps
- **Expected vs Actual**: What should happen vs what happens

#### 15.4 Self-Help Resources

**Debugging Tools**:
```bash
# Health check
curl http://localhost:3000/api/health

# Database connection test
npm run test-db

# Environment validation
npm run validate-env

# Build analysis
npm run build:analyze
```

**Log Analysis**:
```bash
# View application logs
tail -f logs/combined.log

# View error logs only
tail -f logs/error.log

# PM2 logs (production)
pm2 logs fmg-industry-hub
```

**Community Resources**:
- **Stack Overflow**: Tag questions with `fmg-industry-hub`
- **Discord**: Join our community server (link in project README)
- **YouTube**: Video tutorials and guides
- **Blog**: Technical articles at flemmomusic.com/blog

#### 15.5 Contributing & Feedback

**Bug Reports**:
1. Search existing issues first
2. Use the bug report template
3. Include reproduction steps
4. Provide system information

**Feature Requests**:
1. Check roadmap for planned features
2. Use the feature request template
3. Explain use case and benefits
4. Provide mockups if applicable

**Code Contributions**:
1. Fork the repository
2. Create feature branch
3. Follow coding standards
4. Add tests for new features
5. Submit pull request

## 📚 Additional Resources

### Step 16: Extended Learning

#### 16.1 Architecture Deep Dive

**System Architecture**:
- **Frontend**: Next.js 14 with App Router
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Deployment**: Vercel Edge Network
- **CDN**: Global content delivery
- **Caching**: Multi-layer caching strategy
- **Monitoring**: Real-time performance tracking

**Database Design**:
- **User Management**: Profiles with role-based access
- **Project Lifecycle**: Complete workflow management
- **Payment Processing**: Multi-currency support
- **File Management**: Secure upload/download
- **Audit Logging**: Complete activity tracking

#### 16.2 Best Practices

**Development Workflow**:
1. Feature branch development
2. Automated testing
3. Code review process
4. Staging deployment
5. Production release

**Code Quality**:
- TypeScript for type safety
- ESLint for code standards
- Prettier for formatting
- Husky for git hooks
- Conventional commits

**Security Practices**:
- Environment variable management
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF protection
- Rate limiting

#### 16.3 Performance Benchmarks

**Target Metrics**:
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Time to Interactive**: < 3.5s
- **Cumulative Layout Shift**: < 0.1
- **Core Web Vitals**: All green

**Database Performance**:
- **Query Response Time**: < 100ms (95th percentile)
- **Connection Pool**: 20 connections max
- **Index Usage**: > 95% of queries use indexes
- **Cache Hit Rate**: > 90%

#### 16.4 Scaling Considerations

**Horizontal Scaling**:
- Load balancing with Nginx
- Multiple application instances
- Database read replicas
- CDN for static assets

**Vertical Scaling**:
- CPU and memory optimization
- Database performance tuning
- Connection pooling
- Caching strategies

**Future Enhancements**:
- Microservices architecture
- Event-driven architecture
- Real-time features with WebSockets
- Mobile application support
- API rate limiting
- Advanced analytics

---

## 📋 Quick Reference

### Essential Commands
```bash
# Development
npm run dev                 # Start development server
npm run build              # Build for production
npm run start              # Start production server

# Quality
npm run lint               # Check code quality
npm run type-check         # TypeScript validation
npm run test               # Run tests

# Database
npm run test-db            # Test database connection
npm run validate-env       # Validate environment

# Deployment
vercel                     # Deploy to Vercel
pm2 start ecosystem.config.js  # Start with PM2
```

### Important Ports
- **Frontend**: http://localhost:3000
- **Database**: postgresql://localhost:5432
- **Redis** (optional): redis://localhost:6379

### Key Directories
- `/src/app` - Next.js app router pages
- `/src/components` - Reusable components
- `/src/lib` - Utility libraries
- `/public` - Static assets
- `/logs` - Application logs

---

**🎵 FMG Industry Hub - Beyond Sound. Built-in Intelligence.**

**Last Updated**: September 27, 2025  
**Version**: 1.2.0  
**Author**: Flemmo Music Global Team  
**License**: Proprietary

**Need Help?** Contact us at admin@flemmomusic.com