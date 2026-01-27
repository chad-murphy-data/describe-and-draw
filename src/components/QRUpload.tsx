import { QRCodeSVG } from 'qrcode.react';

interface QRUploadProps {
  gameCode: string;
  playerId: string;
  roundNumber: number;
}

export const QRUpload = ({ gameCode, playerId, roundNumber }: QRUploadProps) => {
  // Create a URL for mobile upload
  const uploadUrl = `${window.location.origin}${window.location.pathname}#/upload/${gameCode}/${playerId}/${roundNumber}`;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="qr-container">
        <QRCodeSVG
          value={uploadUrl}
          size={180}
          level="M"
          includeMargin={false}
        />
      </div>
      <p className="text-muted text-center" style={{ fontSize: '0.8rem', maxWidth: '200px' }}>
        Scan with your phone to upload a photo of your drawing
      </p>
      <a
        href={uploadUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-accent"
        style={{ fontSize: '0.75rem' }}
      >
        Or open link directly
      </a>
    </div>
  );
};
