// src/app/page.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';

/**
 * Home page component that serves as the landing page for unauthenticated users
 * Authenticated users are redirected to their dashboard
 */
export default async function HomePage() {
  // Check authentication status and redirect if logged in
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="space-y-16">
      {/* Hero section - Primary call to action */}
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

      {/* How it works section - Explains the booking process */}
      <section>
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: 1,
              title: "Find a Facility",
              description: "Browse through our selection of sports facilities and find the perfect spot for your activity."
            },
            {
              step: 2,
              title: "Book Your Slot",
              description: "Choose a date and time slot that works for you and complete your booking in minutes."
            },
            {
              step: 3,
              title: "Play & Enjoy",
              description: "Show up at the facility and enjoy your game without any booking hassles."
            }
          ].map(({ step, title, description }) => (
            <div key={step} className="text-center">
              <div className="mx-auto h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 text-xl font-bold mb-4">
                {step}
              </div>
              <h3 className="text-xl font-medium mb-2">{title}</h3>
              <p className="text-gray-600">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured facilities section - Shows sample facilities */}
      <section>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">Featured Facilities</h2>
          <Link href="/facilities" className="text-primary-600 hover:text-primary-700">
            View All →
          </Link>
        </div>
        
        {/* Sample facilities - In production, these would be fetched from the database */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              id: 1,
              name: "Downtown Football Field",
              address: "123 Main St, City",
              description: "A well-maintained football field in the heart of downtown.",
              price: 30
            },
            {
              id: 2,
              name: "Westside Tennis Courts",
              address: "456 Park Ave, City",
              description: "Professional tennis courts with excellent lighting and facilities.",
              price: 25
            },
            {
              id: 3,
              name: "Eastside Basketball Court",
              address: "789 Oak St, City",
              description: "Indoor basketball court with high-quality flooring and equipment.",
              price: 20
            }
          ].map(facility => (
            <Card key={facility.id} className="transition-shadow hover:shadow-lg">
              <div className="bg-gray-200 h-48 flex items-center justify-center">
                <span className="text-gray-400">Facility Image</span>
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-1">{facility.name}</h3>
                <p className="text-gray-600 text-sm mb-2">{facility.address}</p>
                <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                  {facility.description}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-primary-600 font-medium">${facility.price}/hour</span>
                  <Link href={`/facilities/${facility.id}`}>
                    <Button variant="primary" size="sm">Book Now</Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Testimonials section - Social proof */}
      <section className="bg-gray-50 p-8 rounded-lg">
        <h2 className="text-3xl font-bold text-center mb-8">What Our Users Say</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {[
            {
              quote: "This platform has made booking football pitches so much easier. No more phone calls or visiting in person!",
              name: "Alex Johnson",
              title: "Football Team Captain"
            },
            {
              quote: "As a facility owner, I've seen a 30% increase in bookings since joining this platform. Highly recommended!",
              name: "Sarah Lee",
              title: "Sports Center Owner"
            }
          ].map((testimonial, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-700 italic mb-4">"{testimonial.quote}"</p>
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-gray-300 mr-3"></div>
                <div>
                  <h4 className="font-medium">{testimonial.name}</h4>
                  <p className="text-gray-500 text-sm">{testimonial.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA section - Final conversion point */}
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