import { notFound } from "next/navigation";
import ItineraryPlanner from "@/components/booking/ItineraryPlanner";
import { getBookingItinerary } from "@/lib/bookingData";

interface PageProps {
  params: Promise<{ slug: string; sequence: string; date: string }>;
}

export default async function BookingPage({ params }: PageProps) {
  const { slug, sequence } = await params;
  const itinerary = getBookingItinerary(slug);

  if (!itinerary) notFound();

  return (
    <ItineraryPlanner itinerary={itinerary} sequence={sequence} />
  );
}
