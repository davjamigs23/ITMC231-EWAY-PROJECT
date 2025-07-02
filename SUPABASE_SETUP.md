# Supabase Integration Setup

This guide will help you set up the Supabase backend for the E-WAY application.

## Prerequisites

1. Create a Supabase account at [https://supabase.com](https://supabase.com)
2. Create a new project in Supabase

## Configuration

1. **Get your Supabase URL and Anon Key**
   - Go to your Supabase project settings
   - Navigate to "API" in the sidebar
   - Find your Project URL and anon public key

2. **Update Configuration**
   - Open `js/supabase-config.js`
   - Replace `YOUR_SUPABASE_URL` with your Project URL
   - Replace `YOUR_SUPABASE_ANON_KEY` with your anon public key

## Database Setup

1. **Create the users table**
   - Go to the SQL Editor in your Supabase dashboard
   - Create a new query and run the following SQL:

```sql
create table public.users (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  user_type text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.users enable row level security;

-- Create policies for users table
create policy "Users can view their own data"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can insert their own data"
  on public.users for insert
  with check (auth.uid() = id);

create policy "Users can update their own data"
  on public.users for update
  using (auth.uid() = id);
```

2. **Set up Authentication**
   - Go to Authentication > Settings in Supabase
   - Configure your site URL (e.g., `http://localhost` for development)
   - Enable email authentication
   - Configure email templates as needed

## Environment Setup

For development, you can use a local server. For example, using Python's built-in server:

```bash
# Navigate to the project directory
cd /path/to/ITMC231-N2Am/ITMC231 E-Way

# Start a local server (Python 3)
python -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

## Deployment

When deploying to production:

1. Update the site URL in Supabase Authentication settings
2. Configure CORS in Supabase to allow your production domain
3. Enable SSL and enforce secure connections

## Troubleshooting

- If you get CORS errors, make sure your domain is whitelisted in Supabase
- Check the browser console for detailed error messages
- Ensure all required environment variables are properly set

For more information, refer to the [Supabase Documentation](https://supabase.com/docs)
