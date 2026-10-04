import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  StatusChip,
  FieldRow,
  EvidencePopover,
  ClaimChip,
  StatTile,
  PillNav,
  TactileTile,
  ChangeTimeline,
  TimelineDock,
  VoiceNoteBubble,
  WhatsAppBubble,
  ConflictCard,
  PipelineStrip,
  ProductionBriefSheet,
} from "@/components/ui-ordermind";

describe("Phase A: OrderMind Design System Custom Components", () => {
  describe("StatusChip", () => {
    it("renders CONFIRMED variant with #1F8A4C green styling", () => {
      const html = renderToStaticMarkup(
        <StatusChip status="CONFIRMED" evidenceCount={3} />
      );
      expect(html).toContain("CONFIRMED");
      expect(html).toContain("bg-[#E8F6EE]");
      expect(html).toContain("text-[#1F8A4C]");
      expect(html).toContain("3");
    });

    it("renders INFERRED variant with #B7791F amber styling", () => {
      const html = renderToStaticMarkup(
        <StatusChip status="INFERRED" evidenceCount={1} />
      );
      expect(html).toContain("INFERRED");
      expect(html).toContain("bg-[#FEF7EC]");
      expect(html).toContain("text-[#B7791F]");
      expect(html).toContain("1");
    });

    it("renders MISSING variant with dashed border and #8E9182 muted styling", () => {
      const html = renderToStaticMarkup(<StatusChip status="MISSING" />);
      expect(html).toContain("MISSING");
      expect(html).toContain("border-dashed");
      expect(html).toContain("text-[#8E9182]");
    });

    it("renders CONFLICTING variant with #D64545 red styling", () => {
      const html = renderToStaticMarkup(
        <StatusChip status="CONFLICTING" evidenceCount={2} />
      );
      expect(html).toContain("CONFLICTING");
      expect(html).toContain("bg-[#FDF2F2]");
      expect(html).toContain("text-[#D64545]");
      expect(html).toContain("2");
    });
  });

  describe("ClaimChip", () => {
    it("renders SET operation with direct stated badge", () => {
      const html = renderToStaticMarkup(
        <ClaimChip op="set" field="quantity" value={500} unit="units" confidence={0.99} />
      );
      expect(html).toContain("SET");
      expect(html).toContain("quantity:");
      expect(html).toContain("500");
      expect(html).toContain("units");
      expect(html).toContain("99%");
    });

    it("renders DELTA operation with relative adjustment badge", () => {
      const html = renderToStaticMarkup(
        <ClaimChip op="delta" field="dimensions" value="+20mm" unit="height" />
      );
      expect(html).toContain("DELTA");
      expect(html).toContain("dimensions:");
      expect(html).toContain("+20mm");
    });

    it("renders REF operation with historical reference badge", () => {
      const html = renderToStaticMarkup(
        <ClaimChip op="ref" field="material" value="Aarav Box v1" />
      );
      expect(html).toContain("REF");
      expect(html).toContain("material:");
      expect(html).toContain("Aarav Box v1");
    });
  });

  describe("FieldRow", () => {
    it("renders complete packaging field row with label, value, and status", () => {
      const html = renderToStaticMarkup(
        <FieldRow
          label="Surface Finish"
          value="Soft-touch Matte"
          status="CONFIRMED"
        />
      );
      expect(html).toContain("Surface Finish");
      expect(html).toContain("Soft-touch Matte");
      expect(html).toContain("CONFIRMED");
    });

    it("renders missing state fallback when value is null or empty", () => {
      const html = renderToStaticMarkup(
        <FieldRow
          label="Deadline"
          value={null}
          status="MISSING"
        />
      );
      expect(html).toContain("Deadline");
      expect(html).toContain("Not specified yet");
      expect(html).toContain("MISSING");
    });
  });

  describe("StatTile", () => {
    it("renders giant value and label with trend indicator", () => {
      const html = renderToStaticMarkup(
        <StatTile
          value="34"
          label="Orders Extracted"
          delta={{ value: "+3", trend: "up", label: "today" }}
          subtitle="From active customer feeds"
        />
      );
      expect(html).toContain("34");
      expect(html).toContain("Orders Extracted");
      expect(html).toContain("+3");
      expect(html).toContain("From active customer feeds");
    });

    it("renders dark panel variant", () => {
      const html = renderToStaticMarkup(
        <StatTile
          value="99.4%"
          label="Quote Accuracy"
          dark
        />
      );
      expect(html).toContain("99.4%");
      expect(html).toContain("Quote Accuracy");
      expect(html).toContain("bg-ink");
    });
  });

  describe("PillNav", () => {
    it("renders horizontal navigation pill bar with active tab", () => {
      const items = [
        { id: "all", label: "All Items", count: 12 },
        { id: "active", label: "Active Orders" },
      ];
      const html = renderToStaticMarkup(
        <PillNav items={items} activeId="all" onChange={() => {}} />
      );
      expect(html).toContain("All Items");
      expect(html).toContain("Active Orders");
      expect(html).toContain("12");
      expect(html).toContain("bg-brand-lime");
    });
  });

  describe("TactileTile", () => {
    it("renders tactile elevation tile with light and lime styles", () => {
      const htmlLight = renderToStaticMarkup(
        <TactileTile icon={<span>📦</span>} variant="light" badge={5} />
      );
      expect(htmlLight).toContain("shadow-tactile");
      expect(htmlLight).toContain("5");

      const htmlLime = renderToStaticMarkup(
        <TactileTile icon={<span>⚡️</span>} variant="lime" />
      );
      expect(htmlLime).toContain("to-[#C8F135]");
    });
  });

  describe("ChangeTimeline", () => {
    it("renders git-style branching diff nodes with actor and evidence quotes", () => {
      const events = [
        {
          id: "evt_1",
          field: "quantity",
          previousValue: 100,
          newValue: 500,
          unit: "boxes",
          timestamp: "14:15 PM",
          actor: "ai" as const,
          evidenceQuote: "bump quantity from 100 to 500",
        },
      ];
      const html = renderToStaticMarkup(<ChangeTimeline events={events} />);
      expect(html).toContain("quantity");
      expect(html).toContain("100");
      expect(html).toContain("500");
      expect(html).toContain("bump quantity from 100 to 500");
    });
  });

  describe("TimelineDock", () => {
    it("renders playback scrubber dock with step index and version badges", () => {
      const html = renderToStaticMarkup(
        <TimelineDock
          currentStep={2}
          totalSteps={5}
          onStepChange={() => {}}
          stepLabels={["Step 1", "Step 2", "Step 3"]}
        />
      );
      expect(html).toContain("State Replay");
      expect(html).toContain("v3 / 5");
      expect(html).toContain("Step 3");
    });
  });

  describe("VoiceNoteBubble", () => {
    it("renders duration, sender name, and collapsible transcript", () => {
      const html = renderToStaticMarkup(
        <VoiceNoteBubble
          duration="1:12"
          senderName="Aarav Sharma"
          timestamp="14:20 PM"
          transcript="Please make the box height 90mm."
        />
      );
      expect(html).toContain("Aarav Sharma");
      expect(html).toContain("1:12");
      expect(html).toContain("Voice Note");
      expect(html).toContain("Transcript &amp; Extracted Audio Claims");
    });
  });

  describe("WhatsAppBubble", () => {
    it("renders customer chat bubble with highlighted claim quote and attachments", () => {
      const html = renderToStaticMarkup(
        <WhatsAppBubble
          senderName="Aarav Sharma"
          senderRole="customer"
          timestamp="14:10 PM"
          content="We need 500 rigid boxes with gold foil."
          highlightQuote="500 rigid boxes"
          attachments={[{ id: "1", name: "Dieline.pdf", type: "pdf" }]}
        />
      );
      expect(html).toContain("Aarav Sharma");
      expect(html).toContain("500 rigid boxes");
      expect(html).toContain("Dieline.pdf");
      expect(html).toContain("mark");
    });
  });

  describe("ConflictCard", () => {
    it("renders side-by-side competing options with verbatim quotes and resolution action", () => {
      const html = renderToStaticMarkup(
        <ConflictCard
          field="material"
          optionA={{
            label: "Option A",
            value: "350 GSM White SBS board",
            quote: "use 350 GSM White SBS board",
            source: "Chat message 4",
          }}
          optionB={{
            label: "Option B",
            value: "300 GSM Matte",
            quote: "same material as last time",
            source: "Historical Order #1042",
          }}
        />
      );
      expect(html).toContain("Conflict Detected");
      expect(html).toContain("350 GSM White SBS board");
      expect(html).toContain("300 GSM Matte");
      expect(html).toContain("use 350 GSM White SBS board");
      expect(html).toContain("same material as last time");
    });
  });

  describe("PipelineStrip", () => {
    it("renders linear stages from ingestion to sealed brief", () => {
      const html = renderToStaticMarkup(<PipelineStrip />);
      expect(html).toContain("1. Ingestion");
      expect(html).toContain("2. Gemma AI");
      expect(html).toContain("3. Reference Engine");
      expect(html).toContain("4. State Engine");
      expect(html).toContain("5. Production Brief");
    });
  });
});
