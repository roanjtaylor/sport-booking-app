# SportBooking MVP

A platform for sports facility booking that allows users to find and book sports facilities, and enables facility owners to list their venues and manage bookings.

## Features

### User Features

- Browse and search for sports facilities
- View facility details, including amenities and operating hours
- Make bookings for specific dates and time slots
- Manage and view booking history
- User authentication (sign up, login, profile management)

### Facility Owner Features

- List facilities with detailed information
- Set operating hours and pricing
- Manage and confirm bookings
- View booking history and statistics

## Tech Stack

- **Frontend**: Next.js, TypeScript, Tailwind CSS
- **Backend**: Supabase (authentication, database, storage)
- **Deployment**: Vercel (recommended)

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Supabase account

## Setup Instructions

### 1. Clone the repository

```bash
git clone [your-repository-url]
cd sport-booking-app
```

### 2. Install dependencies

```bash
npm install
# or
yarn install
```

### 3. Set up Supabase

1. Create a new project on [Supabase](https://supabase.io)
2. Set up the database schema using the SQL from `database-schema.sql`
3. Configure authentication (enable email/password sign-up)

### 4. Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_APP_NAME=SportBooking
```

### 5. Run the development server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
sport-booking-app/
├── public/                    # Static assets
├── src/                       # Source code
│   ├── app/                   # Next.js App Router
│   │   ├── api/               # API routes
│   │   ├── auth/              # Authentication pages
│   │   ├── bookings/          # Booking pages
│   │   ├── dashboard/         # User dashboard
│   │   ├── facilities/        # Facility pages
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Homepage
│   ├── components/            # Reusable components
│   ├── lib/                   # Utility functions
│   └── types/                 # TypeScript type definitions
├── .env.local                 # Environment variables
├── tailwind.config.js         # Tailwind CSS configuration
└── tsconfig.json              # TypeScript configuration
```

## Database Schema

The application uses three main tables:

1. **profiles** - User profile information, linked to Supabase Auth
2. **facilities** - Sports facility information (name, location, price, etc.)
3. **bookings** - Booking records linking users to facilities

Detailed schema can be found in the `database-schema.sql` file.

## Deployment

The application can be easily deployed on Vercel:

1. Push your code to a Git repository (GitHub, GitLab, etc.)
2. Create a new project on [Vercel](https://vercel.com)
3. Import your repository
4. Configure environment variables (same as `.env.local`)
5. Deploy

## Future Enhancements

- User ratings and reviews for facilities
- Advanced search and filtering
- Payment processing integration
- Mobile app versions
- Matchmaking functionality for players to join incomplete teams
- AI-powered recommendations for facilities and time slots

## Contributing

Contributions, issues, and feature requests are welcome!

## License

This project is [MIT](LICENSE) licensed.
