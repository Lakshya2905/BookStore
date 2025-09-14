import React, { useCallback, useState } from "react";
import "./WhatsAppFloatingButton.css"; // external css

const WhatsAppFloatingButton = ({ whatsappLink = "https://wa.link/wac1at" }) => {
  const [hover, setHover] = useState(false);

  const handleWhatsAppClick = useCallback(() => {
    window.open(whatsappLink, "_blank", "noopener,noreferrer");
  }, [whatsappLink]);

  return (
    <div
      className={`whatsapp-button ${hover ? "hover" : ""}`}
      onClick={handleWhatsAppClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title="Chat with us on WhatsApp"
    >
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M17.472 14.382c... (rest of your path)" />
      </svg>
    </div>
  );
};

export default WhatsAppFloatingButton;
