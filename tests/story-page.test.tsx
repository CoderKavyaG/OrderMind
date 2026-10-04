import React from "react";
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { STORY_CONTENT } from "@/content/story";
import { StoryPageView } from "@/components/story/StoryPageView";

describe("Story Page & Content Provenance Verification", () => {
  it("ensures every story block has a declared and valid provenance source", () => {
    const validSources = new Set(["ishan", "builder", "repo"]);

    for (const block of STORY_CONTENT.allBlocks) {
      expect(block.id).toBeDefined();
      expect(block.text).toBeDefined();
      expect(typeof block.verified).toBe("boolean");
      expect(validSources.has(block.source)).toBe(true);
      expect(block.source).toBeTruthy();
    }
  });

  it("strictly contains NO banned fabricated strings anywhere in the content", () => {
    const bannedPatterns = [
      /Arjun/i,
      /2,50,000/,
      /250000/,
      /160 messages/i,
      /Mumbai factory/i,
    ];

    const allContentSerialized = JSON.stringify(STORY_CONTENT);

    for (const pattern of bannedPatterns) {
      expect(allContentSerialized).not.toMatch(pattern);
    }
  });

  it("renders only verified blocks in production mode", () => {
    const html = renderToStaticMarkup(<StoryPageView isPreview={false} />);

    // Verified quotes must be present
    expect(html).toContain("Customers never send clean purchase orders");
    expect(html).toContain("change to 350 GSM");

    // Unverified blocks must NOT be present
    expect(html).not.toContain("Unverified placeholder for future verbatim interview responses");
    expect(html).not.toContain("Unverified");
  });

  it("renders unverified blocks with an unverified badge in developer preview mode", () => {
    const html = renderToStaticMarkup(<StoryPageView isPreview={true} />);

    expect(html).toContain("DEVELOPER PREVIEW MODE");
    expect(html).toContain("Unverified placeholder for future verbatim interview responses");
    expect(html).toContain("Unverified");
  });

  it("respects consentToName setting for friend attribution", () => {
    const html = renderToStaticMarkup(<StoryPageView isPreview={false} />);

    if (STORY_CONTENT.consentToName) {
      expect(html).toContain("Built for Ishan.");
      expect(html).toContain("InTheBox");
    } else {
      expect(html).toContain("Built for a packaging founder.");
    }
  });

  it("maps real product features in 'What we heard, What we built' cards", () => {
    const html = renderToStaticMarkup(<StoryPageView isPreview={false} />);

    expect(html).toContain("Explore Order Workspace Timeline");
    expect(html).toContain("Inspect Voice Ingestion in Inbox");
    expect(html).toContain("View Company Brain &amp; Stage Gates");
  });
});
