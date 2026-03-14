"use client";

import { useState } from "react";
import CaptureInput from "@/app/components/CaptureInput";
import ActivityFeed from "@/app/components/ActivityFeed";
import InfoSidebar from "@/app/components/InfoSidebar";

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl gap-8 px-4 py-8">
      <main className="mx-auto flex w-full max-w-lg flex-col items-center gap-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Thingy
        </h1>
        <CaptureInput onCapture={() => setRefreshKey((k) => k + 1)} />
        <ActivityFeed refreshKey={refreshKey} />
      </main>

      <InfoSidebar />
    </div>
  );
}
