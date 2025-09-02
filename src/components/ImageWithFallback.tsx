import { useState, useEffect } from 'react';

interface ImageWithFallbackProps {
  src: string | null;
  alt: string;
  className?: string;
  onClick?: () => void;
  onLoad?: () => void;
  onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

export function ImageWithFallback({ src, alt, className, onClick, onLoad, onError }: ImageWithFallbackProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setImageError(false);
    setIsLoading(true);
  }, [src]);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error('Image failed to load:', src);
    setImageError(true);
    setIsLoading(false);
    onError?.(e);
  };

  const handleImageLoad = () => {
    console.log('Image loaded successfully:', src);
    setIsLoading(false);
    setImageError(false);
    onLoad?.();
  };

  if (!src) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No image uploaded for this trade</p>
      </div>
    );
  }

  if (imageError) {
    return (
      <div className="text-center py-8 space-y-3">
        <p className="text-muted-foreground">Failed to load image</p>
        <div className="text-xs text-muted-foreground space-y-2">
          <p>URL: <span className="break-all font-mono bg-muted px-1 rounded">{src}</span></p>
          <button
            onClick={() => window.open(src, '_blank')}
            className="px-3 py-1 text-xs bg-muted rounded hover:bg-muted/80 transition-colors"
          >
            Try opening in new tab
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={className}
        onClick={onClick}
        onLoad={handleImageLoad}
        onError={handleImageError}
        style={{ display: imageError ? 'none' : 'block' }}
      />
    </div>
  );
}