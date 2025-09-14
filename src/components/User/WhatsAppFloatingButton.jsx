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
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="white"
      >
        <path d="M16.027 3C9.382 3 3.99 8.391 3.99 15.033c0 2.65.862 5.108 2.332 
          7.097L4 29l7.086-2.297c1.907 1.145 4.127 1.806 6.478 1.806 
          6.646 0 12.037-5.392 12.037-12.035S22.674 3 16.027 3zm0 
          21.854c-2.006 0-3.885-.588-5.46-1.6l-.39-.248-4.206 
          1.364 1.37-4.094-.254-.403a10.487 10.487 0 01-1.598-5.5c0-5.791 
          4.717-10.508 10.537-10.508 5.82 0 10.537 4.717 
          10.537 10.537 0 5.82-4.717 10.452-10.537 10.452zm5.807-7.878c-.316-.158-1.871-.92-2.161-1.026-.29-.105-.502-.158-.714.159-.211.316-.82 
          1.026-1.006 1.242-.184.21-.369.237-.685.079-.316-.158-1.334-.492-2.54-1.57-.938-.84-1.57-1.875-1.754-2.191-.184-.316-.02-.487.138-.645.142-.141.316-.369.474-.554.158-.184.21-.316.316-.528.105-.21.052-.395-.026-.554-.08-.158-.713-1.72-.976-2.356-.257-.617-.52-.532-.714-.542l-.61-.012c-.21 0-.554.079-.844.395-.29.316-1.11 1.084-1.11 
          2.646 0 1.562 1.136 3.07 1.293 3.278.158.21 2.238 3.418 5.426 4.793.759.327 1.352.522 1.814.668.762.242 
          1.453.207 2.003.126.611-.091 1.871-.762 2.137-1.498.263-.737.263-1.367.184-1.497-.079-.132-.29-.21-.606-.369z"/>
      </svg>
    </div>
  );
};

export default WhatsAppFloatingButton;
