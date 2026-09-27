export const WHATSAPP_NUMBER = "6282298288188";

/** Create a prefilled WhatsApp message that identifies the website and source page. */
export function serviceWhatsApp(service = "Konsultasi layanan musik", pagePath = "/") {
  const pageUrl = `https://flemmomusic.com${pagePath}`;
  const message = [
    "Halo Flemmo Music, saya datang dari website flemmomusic.com.",
    `Halaman: ${pageUrl}`,
    `Layanan yang saya minati: ${service}.`,
    "Saya ingin konsultasi. Brief atau materi saya: ",
  ].join("\n");

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
