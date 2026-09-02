"use client";

import { useCallback, useState } from "react";
import PricingCMSView from "@/components/PricingCMSView";
import Sidebar from "@/components/Sidebar";
import TourCatalogView from "@/components/TourCatalogView";
import TourTemplateModal from "@/components/TourTemplateModal";
import { SEED_TOURS } from "@/lib/mockData";
import type { NavView, TourTemplate } from "@/lib/types";
import { createEmptyTour, generateNextTourId } from "@/lib/tourUtils";

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
    const id = generateNextTourId(tours);
    setModalTour(createEmptyTour(id));
    setIsNewTour(true);
  }, [tours]);

  const handleToggleStatus = useCallback((id: string) => {
    setTours((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: t.status === "active" ? "inactive" : "active" }
          : t,
      ),
    );
  }, []);

  const handleSave = useCallback(
    (saved: TourTemplate) => {
      setTours((prev) => {
        const exists = prev.some((t) => t.id === saved.id);
        return exists
          ? prev.map((t) => (t.id === saved.id ? saved : t))
          : [...prev, saved];
      });
      setModalTour(null);
      setIsNewTour(false);
    },
    [],
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
        />
      )}
    </div>
  );
}
