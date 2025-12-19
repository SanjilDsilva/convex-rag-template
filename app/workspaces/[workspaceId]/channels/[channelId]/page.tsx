"use client";
import Sidebar from "@/app/components/Sidebar";
import ChannelList from "@/app/components/ChannelList";
import MessageList from "@/app/components/MessageList";
import MessageInput from "@/app/components/MessageInput";
import AssistantPanel from "@/app/components/AssistantPanel";
import { useParams } from "next/navigation";

export default function ChannelPage() {
  const { workspaceId, channelId } = useParams();
  if (!workspaceId || !channelId) return <div>Invalid URL</div>;
  return (
    <div className="flex h-screen">
      <Sidebar workspaceId={workspaceId as string} />
      <div className="flex flex-col flex-1">
        <ChannelList workspaceId={workspaceId as string} channelId={channelId as string} />
        <div className="flex flex-1 overflow-hidden">
          <div className="flex flex-col flex-1">
            <MessageList workspaceId={workspaceId as string} channelId={channelId as string} />
            <MessageInput workspaceId={workspaceId as string} channelId={channelId as string} />
          </div>
          <AssistantPanel workspaceId={workspaceId as string} channelId={channelId as string} />
        </div>
      </div>
    </div>
  );
}
