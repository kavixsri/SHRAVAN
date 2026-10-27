import { describe, expect, it } from "vitest";
import { addDaysISO, parseCommand } from "./voice-commands";

describe("voice commands", () => {
  it("schedules a volunteer visit tomorrow at 5 pm", () => {
    expect(parseCommand("Schedule a volunteer visit tomorrow at 5 pm.")).toEqual({
      kind: "schedule",
      type: "visit",
      date: addDaysISO(1),
      time: "17:00",
    });
  });

  it("schedules a phone call today at 11 in the morning", () => {
    expect(parseCommand("Request a phone call today at 11 in the morning")).toEqual({
      kind: "schedule",
      type: "call",
      date: addDaysISO(0),
      time: "11:00",
    });
  });

  it("reads spoken number words", () => {
    expect(parseCommand("schedule a home visit tomorrow at five pm")).toEqual({
      kind: "schedule",
      type: "visit",
      date: addDaysISO(1),
      time: "17:00",
    });
  });

  it("adds a medicine at 8 am", () => {
    expect(parseCommand("add medicine paracetamol at 8 am")).toEqual({
      kind: "medicine",
      name: "Paracetamol",
      time: "08:00",
    });
  });

  it("marks a named medicine as taken", () => {
    expect(parseCommand("mark metformin taken")).toEqual({ kind: "taken", name: "metformin" });
  });

  it("marks an unnamed medicine as taken", () => {
    expect(parseCommand("I took my medicine")).toEqual({ kind: "taken", name: null });
  });

  it("navigates to the medicines page", () => {
    expect(parseCommand("take me to the medicines page")).toEqual({
      kind: "navigate",
      to: "/medicines",
      label: "Medicines",
    });
  });

  it("treats emergency as SOS", () => {
    expect(parseCommand("emergency")).toEqual({ kind: "sos" });
  });

  it("does not understand unrelated speech", () => {
    expect(parseCommand("what is the weather today")).toEqual({ kind: "unknown" });
  });
});
