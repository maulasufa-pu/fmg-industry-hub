import type { Metadata } from "next";
import SalesSeoLanding from "@/components/seo/SalesSeoLanding";

export const metadata: Metadata = {
  title: "Song Creation Service for Artists & Brands",
  description: "Professional song creation service covering concept development, composition, arrangement, production, vocals, mixing, and mastering.",
  alternates: { canonical: "/song-creation-service", languages: { "en-US": "/song-creation-service", "id-ID": "/id/jasa-pembuatan-lagu", "x-default": "/song-creation-service" } },
  openGraph: { title: "Professional Song Creation Service", description: "Build an original song from a concept, lyric, melody, or creative brief with a clear production workflow.", url: "/song-creation-service", type: "website" },
};

export default function Page() {
  return <SalesSeoLanding
    lang="en"
    path="/song-creation-service"
    eyebrow="Original song creation service"
    title="Professional Song Creation from First Idea to Release-Ready Master"
    intro="Bring a concept, lyric, melody, voice note, or brand brief. FMG connects composition, arrangement, production, vocal direction, editing, mixing, and mastering in one accountable workflow."
    serviceName="Professional song creation service"
    benefits={["Creative concept and song direction", "Composition and music arrangement", "Digital music production", "Vocal direction and editing", "Mixing and mastering", "Agreed credits, ownership, and deliverables"]}
    sections={[
      { title: "A song built around your purpose", paragraphs: ["An artist single, campaign song, jingle, soundtrack, and ceremonial song solve different creative problems. We begin with audience, message, format, references, and release goal before choosing tempo, harmony, structure, instrumentation, and vocal approach.", "You can enter the process at any stage. A finished lyric may need music; a melody may need structure; a rough voice note may need full production; a brand may need a complete song developed from a written brief."] },
      { title: "Clear creative and commercial terms", paragraphs: ["Before production starts, the project confirms scope, milestones, revisions, payment, final files, credits, session assets, third-party material, and any license or ownership transfer. Ordering a service does not silently transfer your composition to FMG."] },
      { title: "One connected production workflow", paragraphs: ["Instead of coordinating separate freelancers for every stage, you work through one project flow. Files, feedback, decisions, and delivery status stay connected from the first brief to the approved master."] },
    ]}
    steps={[{ title: "Share the brief", text: "Tell us the purpose, audience, references, available materials, and deadline." }, { title: "Approve the scope", text: "Confirm the creative direction, services, milestones, revisions, ownership, and payment." }, { title: "Create and deliver", text: "Review agreed milestones and receive the approved files listed in your project deliverables." }]}
    faqs={[{ question: "Can FMG create a song from only an idea?", answer: "Yes. The scope can start from a concept or brief and include composition, lyrics coordination, arrangement, and production." }, { question: "Can I bring my own lyrics or melody?", answer: "Yes. We can build around your existing material and document the appropriate credits and ownership." }, { question: "Do you work remotely?", answer: "Yes. Briefing, file exchange, review, revisions, and project tracking can run online." }, { question: "Who owns the finished song?", answer: "Ownership and licenses depend on the agreed contribution and scope. They are confirmed in writing before production begins." }]}
    primaryCta="Start a song project"
    secondaryCta="Explore arrangement service"
    secondaryHref="/arrangement"
    related={[{ href: "/arrangement", label: "Music arrangement service" }, { href: "/learn/how-to-make-a-song", label: "How to make a song" }, { href: "/portfolio", label: "Production portfolio" }, { href: "/id/jasa-pembuatan-lagu", label: "Versi Indonesia" }]}
  />;
}
