import { StoryPageView } from "@/components/story/StoryPageView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Why we built OrderMind &bull; Built for Ishan",
  description:
    "The story behind OrderMind — built for Ishan Kumar (InTheBox) during Hacktoberfest 2026 to turn messy packaging chats into reliable, evidence-backed production orders.",
  openGraph: {
    title: "Why we built OrderMind — Built for Ishan",
    description:
      "Turning messy customer chats and voice notes into evidence-backed structured orders for packaging manufacturers.",
    images: ["/brand/hero-boxes.jpg"],
  },
};

export default function StoryPage() {
  return <StoryPageView isPreview={false} />;
}
