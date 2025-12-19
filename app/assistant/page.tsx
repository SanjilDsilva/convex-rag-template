"use client";
import AssistantPanel from "@/app/components/AssistantPanel";
import { useParams } from "next/navigation";

export default function AssistantPage() {
  // Optionally, get workspaceId/channelId from query or user context
  // For now, just render the panel
  return (
    <div className="flex h-screen">
      <div className="flex flex-1 items-center justify-center">
        <AssistantPanel />
      </div>
    </div>
  );
}
