// Real contacts. Fill these in before any mother uses the app. Empty values show a clear "to be added" state.
export const CONTACTS = {
  /** SweetMom WhatsApp number in international format, digits only, e.g. 2348012345678 */
  whatsapp: '',
  /** Invite link for the Circle's WhatsApp group, e.g. https://chat.whatsapp.com/XXXX */
  circleGroup: '',
  /** 24-hour mental health support line (confirm a real, staffed number) */
  supportLine: '',
  /** Partner clinic phone */
  clinic: '',
};
export const waLink = (text: string) => (CONTACTS.whatsapp ? `https://wa.me/${CONTACTS.whatsapp}?text=${encodeURIComponent(text)}` : '');
