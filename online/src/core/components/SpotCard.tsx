import { useState, useRef, useEffect } from 'react';
import type { Spot } from '../models/types';

interface SpotCardProps {
  spot: Spot;
  selected: boolean;
  onSelect: () => void;
  onUpdate?: (patch: Partial<Spot>) => void;
}

export default function SpotCard({ spot, selected, onSelect, onUpdate }: SpotCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      inputRef.current?.blur();
    }
  };

  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);
  const photoDragRef = useRef<{ y: number; py: number } | null>(null);

  const onPhotoMouseDown = (e: React.MouseEvent) => {
    if (!onUpdate) return;
    e.stopPropagation();
    e.preventDefault();
    setIsDraggingPhoto(true);
    photoDragRef.current = { y: e.clientY, py: spot.photoY ?? 50 };

    const onMove = (ev: MouseEvent) => {
      if (!photoDragRef.current) return;
      const delta = (ev.clientY - photoDragRef.current.y) / 2;
      const nextY = Math.max(0, Math.min(100, photoDragRef.current.py - delta));
      onUpdate({ photoY: nextY });
    };

    const onUp = () => {
      setIsDraggingPhoto(false);
      photoDragRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const onPhotoTouchStart = (e: React.TouchEvent) => {
    if (!onUpdate) return;
    e.stopPropagation();
    // Don't preventDefault here or it might block other touches
    setIsDraggingPhoto(true);
    const touch = e.touches[0];
    photoDragRef.current = { y: touch.clientY, py: spot.photoY ?? 50 };

    const onTouchMove = (ev: TouchEvent) => {
      if (!photoDragRef.current) return;
      const touch = ev.touches[0];
      const delta = (touch.clientY - photoDragRef.current.y) / 2;
      const nextY = Math.max(0, Math.min(100, photoDragRef.current.py - delta));
      onUpdate({ photoY: nextY });
      // Prevent map scrolling while adjusting photo
      if (ev.cancelable) ev.preventDefault();
    };

    const onTouchEnd = () => {
      setIsDraggingPhoto(false);
      photoDragRef.current = null;
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };

    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchEnd);
  };

  return (
    <div
      className={`spot-card${selected ? ' spot-card--selected' : ''}${isDraggingPhoto ? ' spot-card--dragging-photo' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onDoubleClick={(e) => {
        if (onUpdate) {
          e.stopPropagation();
          setIsEditing(true);
        }
      }}
    >
      {/* Title tag */}
      <div className="spot-card__title-tag">
        <span className="spot-card__hole" />
        {isEditing ? (
          <input
            ref={inputRef}
            className="spot-card__title-input"
            value={spot.title}
            onChange={(e) => onUpdate?.({ title: e.target.value })}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="spot-card__title">{spot.title}</span>
        )}
      </div>

      {/* Photo */}
      {spot.photo && (
        <div 
          className="spot-card__photo-wrap"
          onMouseDown={onPhotoMouseDown}
          onTouchStart={onPhotoTouchStart}
        >
          <img 
            src={spot.photo} 
            alt={spot.title} 
            className="spot-card__photo" 
            style={{ objectPosition: `center ${spot.photoY ?? 50}%` }}
            draggable={false}
          />
        </div>
      )}

      {/* Description */}
      {spot.desc && (
        <div className="spot-card__desc">{spot.desc}</div>
      )}

      {/* Number badge */}
      <div className="spot-card__badge">{spot.num}</div>
    </div>
  );
}
