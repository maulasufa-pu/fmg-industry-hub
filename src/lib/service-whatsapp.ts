// Existing public business number, shared by the homepage and service CTAs.
export function serviceWhatsApp(service: string) {
  return `https://wa.me/6282298288188?text=${encodeURIComponent(`Halo Flemmo Music, saya ingin konsultasi mengenai ${service.toLowerCase()}.`)}`;
}
