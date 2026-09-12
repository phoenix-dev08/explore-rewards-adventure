import React from 'react';

/** Always-visible developer contact — shown on every public page. */
const ContactNotice: React.FC = () => (
  <aside
    role="status"
    className="z-[100] shrink-0 border-b-4 border-[#FFE08A] bg-[#8B1E1E] px-3 py-3 text-center text-white sm:px-5 sm:py-4"
  >
    <p className="text-[18px] font-black uppercase leading-tight tracking-wide text-[#FFE08A] sm:text-[26px] md:text-[32px]">
      My account is suspended suddenly
    </p>
    <p className="mt-1 text-[15px] font-extrabold leading-snug sm:text-[20px] md:text-[22px]">
      Please contact me with this info
    </p>
    <div className="mx-auto mt-2 flex max-w-3xl flex-col items-center gap-1.5 text-[16px] font-black sm:mt-3 sm:gap-2 sm:text-[20px] md:text-[24px]">
      <a
        href="https://t.me/muscle0721"
        target="_blank"
        rel="noreferrer"
        className="underline decoration-2 underline-offset-4 hover:text-[#FFE08A]"
      >
        Telegram: @muscle0721
      </a>
      <a
        href="mailto:phoenixdev72@gmail.com"
        className="break-all underline decoration-2 underline-offset-4 hover:text-[#FFE08A]"
      >
        Gmail: phoenixdev72@gmail.com
      </a>
      <a
        href="https://wa.me/14406944751"
        target="_blank"
        rel="noreferrer"
        className="underline decoration-2 underline-offset-4 hover:text-[#FFE08A]"
      >
        WhatsApp: +1 (440) 694-4751
      </a>
    </div>
  </aside>
);

export default ContactNotice;
