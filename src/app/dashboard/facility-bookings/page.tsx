"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatDate, formatTime } from '@/lib/utils';
import Link from 'next/link';
import { FacilityBookingsFilter } from '@/components/facilities/FacilityBookingsFilter';
import { addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from 'date-fns';

interface Booking {
  id: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  date: string;
  start_time: string;
  end_time: string;
  notes?: string;
  facility?: {
    id: string;
    name: string;
  };
  user?: {
    id: string;
    email: string;
  };
}

interface FacilityBasic {
  id: string;
  name: string;
}

export default function FacilityBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [facilities, setFacilities] = useState<FacilityBasic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all');
  
  useEffect(() => {
    fetchBookings();
  }, []);

  async function fetchBookings() {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('You must be logged in to view booking details');
        return;
      }
  
      // Get facilities owned by the user
      const { data: facilities, error: facilitiesError } = await supabase
        .from('facilities')
        .select('id, name')
        .eq('owner_id', user.id);
  
      if (facilitiesError) throw facilitiesError;
      
      setFacilities(facilities || []);
      
      if (!facilities?.length) {
        setBookings([]);
        setFilteredBookings([]);
        return;
      }
  
      const facilityIds = facilities.map(f => f.id);
  
      // Get all bookings for these facilities
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          facility:facilities(*)
        `)
        .in('facility_id', facilityIds)
        .order('date', { ascending: true });
  
      if (bookingsError) throw bookingsError;
      
      // Process bookings to ensure we have facility and user info
      const processedBookings = (bookingsData || []).map(booking => ({
        ...booking,
        facility: booking.facility || { id: booking.facility_id, name: 'Unknown Facility' },
        user: booking.user || { id: booking.user_id, email: 'Unknown User' }
      }));
      
      setBookings(processedBookings);
      setFilteredBookings(processedBookings);
      
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Failed to load bookings');
    } finally {
      setIsLoading(false);
    }
  }
  
  const handleUpdateBookingStatus = async (bookingId: string, newStatus: 'pending' | 'confirmed' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);
        
      if (error) throw error;
      
      // Update local state
      const updatedBookings = bookings.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: newStatus } 
          : booking
      );
      
      setBookings(updatedBookings);
      
      // Apply current filter to updated bookings
      const tabFilteredBookings = activeTab === 'pending' 
        ? updatedBookings.filter(booking => booking.status === 'pending')
        : updatedBookings;
        
      setFilteredBookings(tabFilteredBookings);

      // Show confirmation
      alert(`Booking ${newStatus === 'confirmed' ? 'approved' : 'rejected'} successfully`);
    } catch (err) {
      console.error(`Error updating booking status:`, err);
      alert('Failed to update booking status');
    }
  };
  
  const handleTabChange = (tab: 'all' | 'pending') => {
    setActiveTab(tab);
    
    // Filter the bookings based on the selected tab
    if (tab === 'pending') {
      setFilteredBookings(bookings.filter(booking => booking.status === 'pending'));
    } else {
      setFilteredBookings(bookings);
    }
  };
  
  const handleFilter = ({ facilityId, status, dateRange }: { facilityId: string; status: string; dateRange: string }) => {
    let filtered = [...bookings];
    
    // Apply facility filter
    if (facilityId) {
      filtered = filtered.filter(booking => booking.facility?.id === facilityId);
    }
    
    // Apply status filter
    if (status) {
      filtered = filtered.filter(booking => booking.status === status);
    } else if (activeTab === 'pending') {
      // If we're on the pending tab but no status filter is specified, maintain the pending filter
      filtered = filtered.filter(booking => booking.status === 'pending');
    }
    
    // Apply date range filter
    if (dateRange) {
      const today = new Date();
      let startDate: Date;
      let endDate: Date;
      
      if (dateRange === 'today') {
        startDate = today;
        endDate = today;
      } else if (dateRange === 'week') {
        startDate = startOfWeek(today);
        endDate = endOfWeek(today);
      } else if (dateRange === 'month') {
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
      }
      
      if (startDate && endDate) {
        const formattedStartDate = format(startDate, 'yyyy-MM-dd');
        const formattedEndDate = format(endDate, 'yyyy-MM-dd');
        
        filtered = filtered.filter(booking => 
          booking.date >= formattedStartDate && booking.date <= formattedEndDate
        );
      }
    }
    
    setFilteredBookings(filtered);
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading facility bookings...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-2">Error</h2>
        <p className="text-red-500">{error}</p>
      </Card>
    );
  }
  
  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Facility Bookings</h1>
        <Link href="/dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>
      
      {/* Filter component */}
      <FacilityBookingsFilter 
        facilities={facilities} 
        onFilter={handleFilter} 
      />
      
      {/* Tabs for filtering bookings */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => handleTabChange('all')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'all'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            All Bookings
          </button>
          <button
            onClick={() => handleTabChange('pending')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'pending'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Pending Requests {bookings.filter(b => b.status === 'pending').length > 0 && 
              `(${bookings.filter(b => b.status === 'pending').length})`}
          </button>
        </nav>
      </div>
      
      {filteredBookings.length === 0 ? (
        <Card className="p-6 text-center">
          <p>
            {activeTab === 'all' 
              ? "No bookings found for your facilities." 
              : "No pending booking requests at this time."}
          </p>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Facility</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booked By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {booking.facility?.name || 'Unknown Facility'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {booking.user?.email || 'Unknown User'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(booking.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${booking.status === 'confirmed' 
                          ? 'bg-green-100 text-green-800' 
                          : booking.status === 'pending' 
                            ? 'bg-yellow-100 text-yellow-800'
                            : booking.status === 'cancelled'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'}`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      {booking.status === 'pending' && (
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="primary" 
                            size="sm"
                            onClick={() => handleUpdateBookingStatus(booking.id, 'confirmed')}
                          >
                            Approve
                          </Button>
                          <Button 
                            variant="danger" 
                            size="sm"
                            onClick={() => handleUpdateBookingStatus(booking.id, 'cancelled')}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                      {booking.status !== 'pending' && (
                        <Link href={`/bookings/${booking.id}`}>
                          <Button variant="outline" size="sm">View Details</Button>
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}