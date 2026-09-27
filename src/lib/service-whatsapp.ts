export const WHATSAPP_NUMBER = "6282298288188";

/** Create a prefilled WhatsApp inquiry from the website without including page URLs. */
export function serviceWhatsApp(service = "Konsultasi layanan musik") {
  const message = [
    "Halo Flemmo Music, saya datang dari website.",
    `Layanan yang saya minati: ${service}.`,
    "Saya ingin konsultasi. Brief atau materi saya: ",
  ].join("\n");

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
