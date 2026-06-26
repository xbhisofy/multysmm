import { useAuth } from '@/hooks/useAuth';

// Direct WhatsApp support — replaces the previous live chat widget.
const WHATSAPP_NUMBER = '255637520201'; // +255 637 520 201

function buildMessage(email?: string, name?: string | null) {
  return (
    `Hello MultySMM Support Team! 👋\n\n` +
    `I need help regarding my account. Here are my details:\n\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    (name ? `👤 Name: ${name}\n` : '') +
    (email ? `📧 Email: ${email}\n` : '') +
    `🌐 Website: multysmm.site\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    `📝 My issue / question:\n` +
    `(Please describe your problem here — order ID, payment, services, etc.)\n\n` +
    `Kindly assist me as soon as possible. Thank you! 🙏`
  );
}

export function WhatsAppFloatingButton() {
  const { user, profile } = useAuth();
  if (!user) return null;

  const message = buildMessage(profile?.email || user.email || '', profile?.full_name);
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      data-live-chat-trigger
      className="fixed bottom-24 right-4 lg:bottom-6 lg:right-6 z-50 group"
    >
      {/* Pulse ring */}
      <span
        className="absolute inset-0 rounded-full animate-ping opacity-60"
        style={{ background: '#25D366' }}
      />
      <span
        className="relative flex items-center justify-center h-14 w-14 rounded-full transition-transform group-hover:scale-110"
        style={{
          background: 'linear-gradient(135deg, #25D366, #128C7E)',
          boxShadow: '0 10px 28px rgba(37,211,102,.5), 0 4px 10px rgba(0,0,0,.2)',
          border: '2px solid #fff',
        }}
      >
        {/* Official WhatsApp glyph */}
        <svg
          viewBox="0 0 32 32"
          width="28"
          height="28"
          fill="#fff"
          aria-hidden="true"
        >
          <path d="M19.11 17.205c-.372 0-1.088 1.39-1.518 1.39a.63.63 0 0 1-.315-.1c-.802-.402-1.504-.817-2.163-1.447-.545-.516-1.146-1.29-1.46-1.963a.426.426 0 0 1-.073-.215c0-.33.99-.945.99-1.49 0-.143-.73-2.09-.832-2.335-.143-.372-.214-.487-.6-.487-.187 0-.36-.043-.53-.043-.302 0-.53.115-.746.315-.688.645-1.032 1.318-1.06 2.264v.114c-.015.99.472 1.977 1.017 2.78 1.23 1.82 2.506 3.41 4.554 4.34.616.287 2.035.95 2.722.95.95 0 2.92-.785 3.323-1.7.13-.302.215-.616.215-.945 0-.214-1.46-1.32-1.647-1.42-.232-.13-.733-.488-.992-.488zM16.32 25.515a9.234 9.234 0 0 1-4.97-1.444l-3.563 1.143 1.16-3.45A9.215 9.215 0 0 1 7.083 16.3c0-5.105 4.153-9.255 9.258-9.255 5.105 0 9.255 4.15 9.255 9.255 0 5.105-4.15 9.215-9.275 9.215zM16.32 5.225c-6.116 0-11.075 4.96-11.075 11.075a11 11 0 0 0 1.55 5.624L5 27.5l5.756-1.69a11.026 11.026 0 0 0 5.564 1.484c6.117 0 11.077-4.957 11.077-11.072 0-2.957-1.155-5.74-3.25-7.836a11.005 11.005 0 0 0-7.827-3.16z"/>
        </svg>
      </span>
      {/* Tooltip label */}
      <span
        className="absolute right-16 top-1/2 -translate-y-1/2 whitespace-nowrap px-3 py-1.5 rounded-full text-[12px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{
          background: '#111',
          color: '#fff',
          boxShadow: '0 4px 12px rgba(0,0,0,.25)',
        }}
      >
        Need help? Chat on WhatsApp
      </span>
    </a>
  );
}