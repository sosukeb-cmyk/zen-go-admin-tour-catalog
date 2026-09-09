"use client";

import { useCallback, useState } from "react";
import PricingCMSView from "@/components/PricingCMSView";
import Sidebar from "@/components/Sidebar";
import TourCatalogView from "@/components/TourCatalogView";
import TourTemplateModal from "@/components/TourTemplateModal";
import { SEED_TOURS } from "@/lib/mockData";
import { AIRPORT_CODES } from "@/lib/pricingCmsMock";
import type { NavView, TourTemplate } from "@/lib/types";
import { DebugModeProvider } from "@/lib/debugMode";
import {
  buildAirportBookingUrl,
  createEmptyTour,
  generateNextAirportId,
  generateNextSightseeingId,
  nextAirportBookingSequence,
} from "@/lib/tourUtils";

function PlaceholderView({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-gray-400">
      <p className="text-lg font-medium">{title}</p>
      <p className="mt-1 text-sm">This section is not part of the prototype.</p>
    </div>
  );
}

export default function AdminShell() {
  const [activeView, setActiveView] = useState<NavView>("tour-catalog");
  const [tours, setTours] = useState<TourTemplate[]>(SEED_TOURS);
  const [modalTour, setModalTour] = useState<TourTemplate | null>(null);
  const [isNewTour, setIsNewTour] = useState(false);

  const openEdit = useCallback(
    (id: string) => {
      const tour = tours.find((t) => t.id === id);
      if (tour) {
        setModalTour(tour);
        setIsNewTour(false);
      }
    },
    [tours],
  );

  const openAdd = useCallback(() => {
    setModalTour(createEmptyTour());
    setIsNewTour(true);
  }, []);

  const handleToggleStatus = useCallback((id: string) => {
    setTours((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: t.status === "active" ? "inactive" : "active" }
          : t,
      ),
    );
  }, []);

  const handleDelete = useCallback((id: string) => {
    setTours((prev) => prev.filter((t) => t.id !== id));
    setModalTour((prev) => (prev?.id === id ? null : prev));
  }, []);

  const handleSave = useCallback(
    (saved: TourTemplate) => {
      if (isNewTour) {
        const newId =
          saved.serviceType === "Airport" && saved.officeLocation
            ? generateNextAirportId(tours, saved.officeLocation)
            : generateNextSightseeingId(tours);
        let finalized: TourTemplate = { ...saved, id: newId, reference: newId };
        if (saved.serviceType === "Airport" && saved.airport) {
          const airportCode = AIRPORT_CODES[saved.airport] ?? saved.airport;
          const sequence = nextAirportBookingSequence(tours, airportCode);
          finalized = {
            ...finalized,
            previewLinks: {
              ...finalized.previewLinks,
              tourBooking: buildAirportBookingUrl(airportCode, sequence),
            },
          };
        }
        setTours((prev) => [...prev, finalized]);
        setModalTour(finalized);
      } else {
        setTours((prev) =>
          prev.map((t) => (t.id === saved.id ? saved : t)),
        );
        setModalTour(saved);
      }
      setIsNewTour(false);
    },
    [tours, isNewTour],
  );

  const handleRefresh = useCallback(() => {
    setTours(SEED_TOURS);
  }, []);

  const viewTitles: Record<Exclude<NavView, "tour-catalog">, string> = {
    orders: "Orders",
    "pricing-cms": "Pricing CMS",
    "dispatch-board": "Dispatch Board",
  };

  return (
    <DebugModeProvider>
      <div className="min-h-screen bg-gray-50">
        <Sidebar activeView={activeView} onNavigate={setActiveView} />
        <main className="ml-56 min-h-screen p-8">
          {activeView === "tour-catalog" ? (
            <TourCatalogView
              tours={tours}
              onToggleStatus={handleToggleStatus}
              onEdit={openEdit}
              onAddTour={openAdd}
              onRefresh={handleRefresh}
              onDelete={handleDelete}
            />
          ) : activeView === "pricing-cms" ? (
            <PricingCMSView />
          ) : (
            <PlaceholderView title={viewTitles[activeView]} />
          )}
        </main>

        {modalTour && (
          <TourTemplateModal
            tour={modalTour}
            isNew={isNewTour}
            onClose={() => {
              setModalTour(null);
              setIsNewTour(false);
            }}
            onSave={handleSave}
            onToggleStatus={handleToggleStatus}
            onDelete={handleDelete}
          />
        )}
      </div>
    </DebugModeProvider>
  );
}
