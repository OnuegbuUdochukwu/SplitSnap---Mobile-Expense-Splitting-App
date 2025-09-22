# SplitSnap - Mobile Expense Splitting App

SplitSnap is a comprehensive mobile application for iOS and Android that streamlines shared expense management. Built with React Native (Expo) and Supabase, it features AI-powered receipt scanning, real-time collaborative bill splitting, group expense tracking, and secure in-app payments.

## 🔐 Authentication System

### Supabase Integration

- **OAuth Providers**: Google and Apple sign-in via Supabase Auth
- **Email Authentication**: Traditional email/password with secure registration
- **Session Management**: Automatic session persistence and refresh
- **Profile Creation**: Automatic user profile creation via database triggers

### Security Features

- **Row Level Security (RLS)**: Enabled on all database tables
- **Data Isolation**: Users can only access their own data and shared group data
- **Secure Storage**: Credentials stored securely using AsyncStorage
- **JWT Tokens**: Automatic token management via Supabase client

## 🚀 Features

### Core Features

- **AI-Powered OCR**: Scan receipts with Google Cloud Vision API integration
- **Real-time Bill Splitting**: Collaborative item claiming with live updates
- **Group Expense Tracking**: Persistent ledgers for ongoing shared costs
- **Secure Authentication**: Google and Apple sign-in via Supabase Auth
- **In-App Payments**: Direct settlement with Nigerian payment processors
- **Transaction History**: Complete activity tracking and reporting

### Design Elements

- Clean, mobile-first interface optimized for Nigerian users
- Primary blue color scheme (#3B82F6) for trust and security
- Intuitive tab navigation (Home, Groups, Activity, Profile)
- Real-time collaborative UI with instant updates
- Secure payment onboarding with partner branding

## 🛠 Technology Stack

- **Frontend**: React Native (Expo) with TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Storage, Edge Functions)
- **Authentication**: Supabase Auth with Google, Apple, and Email providers
- **Real-time Updates**: Supabase Realtime subscriptions
- **OCR Processing**: Google Cloud Vision API
- **Payment Processing**: Paystack integration (planned)
- **Bank Linking**: Mono/Okra integration (planned)

## 📱 App Structure

```
app/
├── _layout.tsx                 # Root layout with authentication
├── +not-found.tsx             # 404 error screen
└── (tabs)/
    ├── _layout.tsx            # Tab navigation layout
    ├── index.tsx              # Home screen - receipt scanning
    ├── groups.tsx             # Groups management
    ├── activity.tsx           # Transaction history
    └── profile.tsx            # User profile and settings
```

## 🗄 Database Schema

### Authentication Flow

1. User signs in via OAuth or email/password
2. Supabase creates record in `auth.users` table
3. Database trigger automatically creates public profile in `users` table
4. RLS policies ensure data security and proper access control

### Users Table

```sql
CREATE TABLE users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id),
    full_name VARCHAR(255) NOT NULL,
    payment_customer_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Groups and Group Members

```sql
CREATE TABLE groups (
    group_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    creator_id UUID REFERENCES users(user_id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE group_members (
    group_id UUID REFERENCES groups(group_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (group_id, user_id)
);
```

### Bills and Items

```sql
CREATE TABLE bills (
    bill_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES users(user_id),
    group_id UUID REFERENCES groups(group_id),
    total_amount DECIMAL(10,2) NOT NULL,
    receipt_image_url TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE bill_items (
    item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_id UUID REFERENCES bills(bill_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🔧 Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd splitsnap
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project at [supabase.com](https://supabase.com)
   - Copy your project URL and anon key to the `.env` file

- Run the database migration(s) in `supabase/migrations/` (see notes below)
- Configure OAuth providers in Supabase Auth settings

4. **Configure Authentication**

   - **Google OAuth**:
     - Create a Google Cloud project and OAuth 2.0 credentials
     - Add the credentials to Supabase Auth settings
     - Configure redirect URLs for your app
   - **Apple OAuth**:
     - Set up Sign in with Apple in Apple Developer Console
     - Add the configuration to Supabase Auth settings

5. **Start the development server**
   ```bash
   npm run dev
   ```

## 🚀 Development Phases

### Phase 1: Authentication & Core Setup ✅

- ✅ Supabase project setup with authentication
- ✅ React Native app structure with Expo Router
- ✅ Tab navigation and basic UI components
- ✅ Complete user authentication system (Google, Apple, Email)
- ✅ Database schema with Row Level Security
- ✅ Automatic user profile creation
- ✅ Session management and persistence

#### Applying migrations (hosted Supabase)

Use the Supabase CLI or the Supabase SQL Editor to apply the SQL files in `supabase/migrations/`.

Recommended (Supabase CLI):

```bash
# Install or update the Supabase CLI if you don't have it:
npm install -g supabase

# Login and link your project (follow interactive prompt):
supabase login
supabase link --project-ref your-project-ref

# Apply migrations (run from repo root):
supabase db push --file supabase/migrations/20250921165935_delicate_haze.sql
```

Or, open your Supabase project, go to SQL Editor, and run each migration SQL file in order. After applying migrations, verify tables, triggers, and RLS policies exist.

## Helper scripts

Two helper files are included to make applying and verifying migrations easier:

- `scripts/run-migration-and-verify.sh` — small wrapper that calls `supabase db push --file <migration>` and prints the verification SQL. Run this from the repo root after linking your project with the Supabase CLI.
- `scripts/verify-migration.sql` — a set of verification queries you can paste into the Supabase SQL Editor to confirm tables, triggers, and RLS are present.

Usage example:

```bash
# link the project (interactive)
supabase login
supabase link --project-ref your-staging-ref

# run the migration and print verification steps
bash scripts/run-migration-and-verify.sh
```

#### Run the e2e auth smoke test against a hosted Supabase project

1. Create a `.env` in the repo root (copy from `.env.example`) and fill in `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
2. (Optional) If your e2e test requires a service role key, add `SUPABASE_SERVICE_ROLE_KEY` to the `.env` file — keep it secret.
3. Install dependencies and run the e2e script locally against the hosted project:

```bash
npm install
npm run e2e-auth
```

The script will create a temporary test user (email) and attempt to sign up/sign in and verify a `users` profile row exists. Review the script output and check the `users` table in Supabase to confirm.

Security note: The e2e script may create test users; consider running it against a staging Supabase project or periodically cleaning test data.

### Phase 2: Receipt Scanning (In Progress)

- [ ] Camera integration with expo-camera
- [ ] Image upload to Supabase Storage
- [ ] OCR processing with Edge Functions
- [ ] Bill creation and item parsing

### Phase 3: Real-time Features (Planned)

- [ ] Real-time bill session with Supabase Realtime
- [ ] Item claiming and sharing functionality
- [ ] Live updates across multiple users

### Phase 4: Financial Features (Planned)

- [ ] Group ledger management
- [ ] Payment processor integration (Paystack)
- [ ] Bank account linking (Mono/Okra)
- [ ] Settlement and transaction tracking

## 🔐 Security

### Database Security

- **Row Level Security (RLS)**: Enabled on all tables with strict policies
- **Data Isolation**: Users can only access their own data and shared group data
- **Automatic Profile Creation**: Secure database triggers handle user onboarding
- **Encrypted Storage**: All data encrypted at rest and in transit by Supabase

### Authentication Security

- **OAuth Providers**: Google and Apple sign-in for enhanced security
- **Email Authentication**: Secure password handling via Supabase Auth
- **JWT Tokens**: Automatic token management and refresh
- **Session Persistence**: Secure session storage using AsyncStorage

### Application Security

- **Environment Variables**: Sensitive keys stored in environment files
- **Client-side Validation**: Input validation and error handling
- **Secure API Calls**: All database operations protected by RLS policies

## 📝 API Documentation

### Authentication Methods

```typescript
// Google OAuth sign-in
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: 'your-app-scheme://auth/callback',
  },
});

// Email/password sign-in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password',
});

// Sign out
const { error } = await supabase.auth.signOut();
```

### User Profile Management

```typescript
// Get current user profile
const { data: user, error } = await supabase
  .from('users')
  .select('*')
  .eq('user_id', supabase.auth.user()?.id)
  .single();

// Update user profile
const { data, error } = await supabase
  .from('users')
  .update({ full_name: 'New Name' })
  .eq('user_id', supabase.auth.user()?.id);
```

### Supabase Edge Functions

- `process-receipt`: OCR processing for uploaded receipts
- `initiate-payment`: Secure payment processing
- `create-payment-customer`: Bank account linking

### Real-time Subscriptions

```typescript
// Subscribe to bill updates
const subscription = supabase
  .from('item_assignments')
  .on('*', (payload) => {
    // Handle real-time updates
  })
  .filter('bill_id', 'eq', billId)
  .subscribe();
```

## 🧪 Testing

### Authentication Testing

- Test OAuth flows with Google and Apple
- Verify email authentication and password reset
- Test session persistence across app restarts
- Validate RLS policies prevent unauthorized access

```bash
# Run unit tests
npm test

# Run E2E tests (future)
npm run test:e2e
```

## 📦 Deployment

### Environment Setup

- **Development**: Local Supabase project for testing
- **Staging**: Separate Supabase project for pre-production testing
- **Production**: Production Supabase project with live OAuth providers

### Mobile App

- Development builds with Expo Dev Client
- Production builds with EAS Build
- App Store and Google Play deployment

### Backend

- Automatic deployment via Supabase
- Staging and production environments
- CI/CD with GitHub Actions

## 🤝 Contributing

### Authentication Development

1. Test all authentication flows thoroughly
2. Ensure RLS policies are properly configured
3. Validate user profile creation and updates
4. Test session management and error handling

5. Fork the repository
6. Create a feature branch
7. Make your changes
8. Add tests for new features
9. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔗 Links

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Expo Documentation](https://docs.expo.dev)
- [React Native Documentation](https://reactnative.dev/docs)
- [OAuth Setup Guide](https://supabase.com/docs/guides/auth/social-login)

## 📞 Support

For support, email support@splitsnap.com or create an issue on GitHub.

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
EXPO_PUBLIC_SUPABASE_URL=your-supabase-project-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

**Important**: Never commit your actual Supabase credentials to version control.

---

**Built with ❤️ in Nigeria 🇳🇬**
