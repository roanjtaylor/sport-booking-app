// src/app/page.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { createServerSupabaseClient } from '@/lib/supabase-server';

/**
 * Home page component - serves as the landing page for the application
 */
export default function HomePage() {
  return (
    <div className="space-y-16">
      {/* Hero section */}
      <section className="text-center py-16">
        <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-gray-900">
          Find and Book Sports Facilities
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
          Book your favorite sports facilities online, hassle-free. Perfect for teams, groups, or individuals.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/facilities">
            <Button size="lg">Browse Facilities</Button>
          </Link>
          <Link href="/auth/register">
            <Button variant="secondary" size="lg">Sign Up Free</Button>
          </Link>
        </div>
      </section>

      {/* How it works section */}
      <section>
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 text-xl font-bold mb-4">
              1
            </div>
            <h3 className="text-xl font-medium mb-2">Find a Facility</h3>
            <p className="text-gray-600">
              Browse through our selection of sports facilities and find the perfect spot for your activity.
            </p>
          </div>
          
          {/* Step 2 */}
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 text-xl font-bold mb-4">
              2
            </div>
            <h3 className="text-xl font-medium mb-2">Book Your Slot</h3>
            <p className="text-gray-600">
              Choose a date and time slot that works for you and complete your booking in minutes.
            </p>
          </div>
          
          {/* Step 3 */}
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 text-xl font-bold mb-4">
              3
            </div>
            <h3 className="text-xl font-medium mb-2">Play & Enjoy</h3>
            <p className="text-gray-600">
              Show up at the facility and enjoy your game without any booking hassles.
            </p>
          </div>
        </div>
      </section>

      {/* Featured facilities section */}
      <section>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">Featured Facilities</h2>
          <Link href="/facilities" className="text-primary-600 hover:text-primary-700">
            View All →
          </Link>
        </div>
        
        {/* Sample facilities - would come from database in production */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Facility 1 */}
          <Card className="transition-shadow hover:shadow-lg">
            <div className="bg-gray-200 h-48 flex items-center justify-center">
              <span className="text-gray-400">Facility Image</span>
            </div>
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-1">Downtown Football Field</h3>
              <p className="text-gray-600 text-sm mb-2">123 Main St, City</p>
              <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                A well-maintained football field in the heart of downtown.
              </p>
              <div className="flex justify-between items-center">
                <span className="text-primary-600 font-medium">$30/hour</span>
                <Link href="/facilities/1">
                  <Button variant="primary" size="sm">Book Now</Button>
                </Link>
              </div>
            </div>
          </Card>
          
          {/* Facility 2 */}
          <Card className="transition-shadow hover:shadow-lg">
            <div className="bg-gray-200 h-48 flex items-center justify-center">
              <span className="text-gray-400">Facility Image</span>
            </div>
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-1">Westside Tennis Courts</h3>
              <p className="text-gray-600 text-sm mb-2">456 Park Ave, City</p>
              <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                Professional tennis courts with excellent lighting and facilities.
              </p>
              <div className="flex justify-between items-center">
                <span className="text-primary-600 font-medium">$25/hour</span>
                <Link href="/facilities/2">
                  <Button variant="primary" size="sm">Book Now</Button>
                </Link>
              </div>
            </div>
          </Card>
          
          {/* Facility 3 */}
          <Card className="transition-shadow hover:shadow-lg">
            <div className="bg-gray-200 h-48 flex items-center justify-center">
              <span className="text-gray-400">Facility Image</span>
            </div>
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-1">Eastside Basketball Court</h3>
              <p className="text-gray-600 text-sm mb-2">789 Oak St, City</p>
              <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                Indoor basketball court with high-quality flooring and equipment.
              </p>
              <div className="flex justify-between items-center">
                <span className="text-primary-600 font-medium">$20/hour</span>
                <Link href="/facilities/3">
                  <Button variant="primary" size="sm">Book Now</Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Testimonials section */}
      <section className="bg-gray-50 p-8 rounded-lg">
        <h2 className="text-3xl font-bold text-center mb-8">What Our Users Say</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {/* Testimonial 1 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-700 italic mb-4">
              "This platform has made booking football pitches so much easier. No more phone calls or visiting in person!"
            </p>
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-gray-300 mr-3"></div>
              <div>
                <h4 className="font-medium">Alex Johnson</h4>
                <p className="text-gray-500 text-sm">Football Team Captain</p>
              </div>
            </div>
          </div>
          
          {/* Testimonial 2 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-700 italic mb-4">
              "As a facility owner, I've seen a 30% increase in bookings since joining this platform. Highly recommended!"
            </p>
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-gray-300 mr-3"></div>
              <div>
                <h4 className="font-medium">Sarah Lee</h4>
                <p className="text-gray-500 text-sm">Sports Center Owner</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="text-center py-8">
        <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          Join thousands of users who book sports facilities through our platform.
        </p>
        <Link href="/auth/register">
          <Button size="lg">Sign Up Now</Button>
        </Link>
      </section>
    </div>
  );
}
