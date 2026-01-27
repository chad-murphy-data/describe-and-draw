import { getDrawingById } from '../data/drawings';

interface DrawingDisplayProps {
  imageId: string;
  size?: 'small' | 'medium' | 'large';
}

export const DrawingDisplay = ({ imageId, size = 'medium' }: DrawingDisplayProps) => {
  const drawing = getDrawingById(imageId);

  if (!drawing) {
    return (
      <div className="drawing-container" style={{ minHeight: '150px' }}>
        Image not found
      </div>
    );
  }

  const sizeStyles: Record<string, React.CSSProperties> = {
    small: { width: '150px', height: '150px' },
    medium: { width: '100%', maxWidth: '250px', aspectRatio: '1' },
    large: { width: '100%', maxWidth: '400px', aspectRatio: '1' },
  };

  return (
    <div
      className="drawing-container"
      style={{
        ...sizeStyles[size],
        minHeight: '100px',
      }}
      dangerouslySetInnerHTML={{ __html: drawing.svg }}
    />
  );
};
