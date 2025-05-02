// src/lib/api/index.ts
// Export all API functions from a single file for easier imports

import * as authApi from "./auth";
import * as bookingsApi from "./bookings";
import * as facilitiesApi from "./facilities";
import * as lobbiesApi from "./lobbies";
import * as usersApi from "./users";

export { authApi, bookingsApi, facilitiesApi, lobbiesApi, usersApi };

// Also export as default for convenience
export default {
  auth: authApi,
  bookings: bookingsApi,
  facilities: facilitiesApi,
  lobbies: lobbiesApi,
  users: usersApi,
};
