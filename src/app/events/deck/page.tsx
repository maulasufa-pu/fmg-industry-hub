import type { Metadata } from "next";
import EventDeckClient from "./EventDeckClient";
export const metadata: Metadata = { title: "Event Capability Deck", description: "FMG event strategy, production, talent, media, and delivery capabilities." };
export default function Page() { return <EventDeckClient />; }
