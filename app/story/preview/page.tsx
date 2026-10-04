import { StoryPageView } from "@/components/story/StoryPageView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Story Preview &bull; OrderMind Builder Review",
  description: "Developer preview of verified and unverified story blocks.",
};

export default function StoryPreviewPage() {
  return <StoryPageView isPreview={true} />;
}
