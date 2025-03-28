# SportBooking Platform

## TL;DR:

This project aims to gamify the sport booking process, like EA Sports FC but connecting users to real games & people instead of virtual ones.

## -

A Web App that aims to perfect modern sport booking systems\* by bringing together the public through matchmaking lobbies, maximising game time.

\*(namely football for now, to dominate the vertical before expansion.)

## Overview

SportBooking is a full-stack web application designed to address inefficiencies in sports facility bookings by connecting players and facility owners through an intuitive platform. The system allows users to:

- Browse and book sports facilities
- Create or join game lobbies when they don't have enough players
- Manage bookings and facility schedules
- Connect with other players for team sports

## Key Features

### For Players

- Discover and book sports facilities
- Join existing game lobbies or create new ones
- View upcoming and past bookings
- Receive matches based on skill level and availability

### For Facility Owners

- List and manage sports facilities
- Set operating hours and pricing
- Approve or reject booking requests
- Track facility usage and maximise revenue

### Matchmaking System (currently being developed)

- Smart lobby system will match individual players or small groups
- Players can join lobbies until minimum player requirements are met
- Automatic conversion of filled lobbies into confirmed bookings
- Helps maximise facility utilisation and player participation

## Technology Stack

### Frontend

- **Next.js** - Backbone for server-side processing
- **React** - Components
- **Tailwind CSS** - Styling
- **TypeScript** - Type-safe JS

### Backend

- **Supabase** - BaaS platform
  - Authentication
  - PostgreSQL database
  - Realtime subscriptions
  - Storage

### Key Dependencies

- **date-fns** - Date utility library
- **@supabase/auth-helpers-nextjs** - Authentication utilities for Next.js
- **@supabase/supabase-js** - Supabase client library

## Architecture

- Server components.
- Client components.
- Type-safe data models.
- Responsive design.

## Database Schema

The database includes the following key tables:

- **facilities** - Facility information
- **bookings** - Booking records
- **lobbies** - Matchmaking
- **lobby_participants** - Players in lobbies
- **profiles** - User information

## Future Improvements

- Mobile application using React Native
- Advanced matchmaking with machine learning
- In-app chat for lobby participants
- Payment processing integration
- Social features to connect with other players
- Ratings and reviews for facilities
