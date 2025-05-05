// src/lib/api/facilities.ts
import { supabase } from "@/lib/supabase";
import { Facility } from "@/types/facility";

/**
 * Fetches all facilities
 */
export async function getAllFacilities() {
  try {
    const { data, error } = await supabase
      .from("facilities")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Format the facilities to match the expected Facility type
    const formattedFacilities: Facility[] = (data || []).map((facility) => ({
      id: facility.id,
      name: facility.name,
      description: facility.description,
      address: facility.address,
      city: facility.city,
      postal_code: facility.postal_code,
      country: facility.country,
      imageUrl: facility.image_url,
      owner_id: facility.owner_id,
      owner_email: facility.owner_email,
      operatingHours: facility.operating_hours,
      price_per_hour: facility.price_per_hour,
      currency: facility.currency,
      sportType: facility.sport_type,
      amenities: facility.amenities || [],
      min_players: facility.min_players,
      latitude: facility.latitude,
      longitude: facility.longitude,
    }));

    return { data: formattedFacilities, error: null };
  } catch (error) {
    console.error("Error fetching facilities:", error);
    return { data: null, error };
  }
}

/**
 * Fetches facilities owned by a specific user
 */
export async function getUserFacilities(userId: string) {
  try {
    const { data, error } = await supabase
      .from("facilities")
      .select("*")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Format the facilities to match the expected Facility type
    const formattedFacilities: Facility[] = (data || []).map((facility) => ({
      id: facility.id,
      name: facility.name,
      description: facility.description,
      address: facility.address,
      city: facility.city,
      postal_code: facility.postal_code,
      country: facility.country,
      imageUrl: facility.image_url,
      owner_id: facility.owner_id,
      owner_email: facility.owner_email,
      operatingHours: facility.operating_hours,
      price_per_hour: facility.price_per_hour,
      currency: facility.currency,
      sportType: facility.sport_type,
      amenities: facility.amenities || [],
      min_players: facility.min_players,
      latitude: facility.latitude,
      longitude: facility.longitude,
    }));

    return { data: formattedFacilities, error: null };
  } catch (error) {
    console.error("Error fetching user facilities:", error);
    return { data: null, error };
  }
}

/**
 * Fetches a facility by ID
 */
export async function getFacilityById(id: string) {
  try {
    const { data, error } = await supabase
      .from("facilities")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    // Format the facility to match the expected Facility type
    const formattedFacility: Facility = {
      id: data.id,
      name: data.name,
      description: data.description,
      address: data.address,
      city: data.city,
      postal_code: data.postal_code,
      country: data.country,
      imageUrl: data.image_url,
      owner_id: data.owner_id,
      owner_email: data.owner_email,
      operatingHours: data.operating_hours,
      price_per_hour: data.price_per_hour,
      currency: data.currency,
      sportType: data.sport_type,
      amenities: data.amenities || [],
      min_players: data.min_players,
      latitude: data.latitude,
      longitude: data.longitude,
    };

    return { data: formattedFacility, error: null };
  } catch (error) {
    console.error("Error fetching facility:", error);
    return { data: null, error };
  }
}

/**
 * Creates a new facility
 */
export async function createFacility(facilityData: Omit<Facility, "id">) {
  try {
    // Transform the data to match the database schema
    const dbFacility = {
      name: facilityData.name,
      description: facilityData.description,
      address: facilityData.address,
      city: facilityData.city,
      postal_code: facilityData.postal_code,
      country: facilityData.country,
      image_url: facilityData.imageUrl,
      owner_id: facilityData.owner_id,
      owner_email: facilityData.owner_email,
      operating_hours: facilityData.operatingHours,
      price_per_hour: facilityData.price_per_hour,
      currency: facilityData.currency,
      sport_type: facilityData.sportType,
      amenities: facilityData.amenities,
      min_players: facilityData.min_players,
      latitude: facilityData.latitude,
      longitude: facilityData.longitude,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("facilities")
      .insert([dbFacility])
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Error creating facility:", error);
    return { data: null, error };
  }
}

/**
 * Updates an existing facility
 */
export async function updateFacility(
  id: string,
  facilityData: Partial<Facility>
) {
  try {
    // Transform the data to match the database schema
    const dbFacility: any = {
      updated_at: new Date().toISOString(),
    };

    // Map camelCase to snake_case for the database
    if (facilityData.name !== undefined) dbFacility.name = facilityData.name;
    if (facilityData.description !== undefined)
      dbFacility.description = facilityData.description;
    if (facilityData.address !== undefined)
      dbFacility.address = facilityData.address;
    if (facilityData.city !== undefined) dbFacility.city = facilityData.city;
    if (facilityData.postal_code !== undefined)
      dbFacility.postal_code = facilityData.postal_code;
    if (facilityData.country !== undefined)
      dbFacility.country = facilityData.country;
    if (facilityData.imageUrl !== undefined)
      dbFacility.image_url = facilityData.imageUrl;
    if (facilityData.operatingHours !== undefined)
      dbFacility.operating_hours = facilityData.operatingHours;
    if (facilityData.price_per_hour !== undefined)
      dbFacility.price_per_hour = facilityData.price_per_hour;
    if (facilityData.currency !== undefined)
      dbFacility.currency = facilityData.currency;
    if (facilityData.sportType !== undefined)
      dbFacility.sport_type = facilityData.sportType;
    if (facilityData.amenities !== undefined)
      dbFacility.amenities = facilityData.amenities;
    if (facilityData.min_players !== undefined)
      dbFacility.min_players = facilityData.min_players;
    if (facilityData.latitude !== undefined)
      dbFacility.latitude = facilityData.latitude;
    if (facilityData.longitude !== undefined)
      dbFacility.longitude = facilityData.longitude;

    const { data, error } = await supabase
      .from("facilities")
      .update(dbFacility)
      .eq("id", id)
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Error updating facility:", error);
    return { data: null, error };
  }
}

/**
 * Deletes a facility by ID
 */
export async function deleteFacility(id: string) {
  try {
    // First check if there are any bookings for this facility
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("id")
      .eq("facility_id", id)
      .limit(1);

    if (bookingsError) throw bookingsError;

    // If there are bookings, we should not allow deletion
    if (bookings && bookings.length > 0) {
      throw new Error(
        "Cannot delete facility with existing bookings. Cancel all bookings first."
      );
    }

    // Delete the facility
    const { error } = await supabase.from("facilities").delete().eq("id", id);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error("Error deleting facility:", error);
    return { success: false, error };
  }
}

/**
 * Checks if a user is the owner of a facility
 */
export async function checkFacilityOwnership(
  facilityId: string,
  userId: string
) {
  try {
    const { data, error } = await supabase
      .from("facilities")
      .select("owner_id")
      .eq("id", facilityId)
      .single();

    if (error) throw error;

    const isOwner = data.owner_id === userId;
    return { isOwner, error: null };
  } catch (error) {
    console.error("Error checking facility ownership:", error);
    return { isOwner: false, error };
  }
}

/**
 * Fetches facilities with coordinates (non-null latitude and longitude)
 */
export async function getFacilitiesWithCoordinates() {
  try {
    const { data, error } = await supabase
      .from("facilities")
      .select("*")
      .not("latitude", "is", null)
      .not("longitude", "is", null);

    if (error) throw error;

    // Format the facilities to match the expected Facility type
    const formattedFacilities: Facility[] = (data || []).map((facility) => ({
      id: facility.id,
      name: facility.name,
      description: facility.description,
      address: facility.address,
      city: facility.city,
      postal_code: facility.postal_code,
      country: facility.country,
      imageUrl: facility.image_url,
      owner_id: facility.owner_id,
      owner_email: facility.owner_email,
      operatingHours: facility.operating_hours,
      price_per_hour: facility.price_per_hour,
      currency: facility.currency,
      sportType: facility.sport_type,
      amenities: facility.amenities || [],
      min_players: facility.min_players,
      latitude: facility.latitude,
      longitude: facility.longitude,
    }));

    return { data: formattedFacilities, error: null };
  } catch (error) {
    console.error("Error fetching facilities with coordinates:", error);
    return { data: null, error };
  }
}

/**
 * Get all sport types from facilities
 */
export async function getAllSportTypes() {
  try {
    const { data: facilities, error } = await getAllFacilities();
    if (error) throw error;

    // Extract all sport types and remove duplicates
    const sportTypes = Array.from(
      new Set(facilities.flatMap((f) => f.sportType || []))
    );

    return { data: sportTypes, error: null };
  } catch (error) {
    console.error("Error fetching sport types:", error);
    return { data: [], error };
  }
}

/**
 * Filter facilities based on user criteria
 */
export async function filterFacilities(criteria: {
  search?: string;
  sportType?: string;
  priceSort?: string;
}) {
  try {
    const { data: facilities, error } = await getAllFacilities();
    if (error) throw error;

    let filtered = [...facilities];

    // Apply search filter
    if (criteria.search) {
      const searchLower = criteria.search.toLowerCase();
      filtered = filtered.filter(
        (facility) =>
          facility.name.toLowerCase().includes(searchLower) ||
          facility.description.toLowerCase().includes(searchLower) ||
          facility.address.toLowerCase().includes(searchLower) ||
          facility.city.toLowerCase().includes(searchLower)
      );
    }

    // Apply sport type filter
    if (criteria.sportType) {
      filtered = filtered.filter((facility) =>
        facility.sportType.includes(criteria.sportType)
      );
    }

    // Apply price sorting
    if (criteria.priceSort === "low") {
      filtered.sort((a, b) => a.price_per_hour - b.price_per_hour);
    } else if (criteria.priceSort === "high") {
      filtered.sort((a, b) => b.price_per_hour - a.price_per_hour);
    }

    return { data: filtered, error: null };
  } catch (error) {
    console.error("Error filtering facilities:", error);
    return { data: null, error };
  }
}
