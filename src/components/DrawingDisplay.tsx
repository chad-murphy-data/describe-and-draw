import { getDrawingById } from '../data/drawings';

interface DrawingDisplayProps {
  imageId: string;
  size?: 'small' | 'medium' | 'large';
}

export const DrawingDisplay = ({ imageId, size = 'medium' }: DrawingDisplayProps) => {
  const drawing = getDrawingById(imageId);

  if (!drawing) {
    return <div className="drawing-container">Image not found</div>;
  }

  const sizeClass = {
    small: { width: '150px', height: '150px' },
    medium: { width: '300px', height: '300px' },
    large: { width: '100%', maxWidth: '500px', height: 'auto', aspectRatio: '1' },
  }[size];

  return (
    <div
      className="drawing-container"
      style={sizeClass}
      dangerouslySetInnerHTML={{ __html: drawing.svg }}
    />
  );
};
