import { AVATAR_COLORS } from '../lib/auth';
import { validateAvatarPhotoDataUrl } from '../lib/profile-photo';
import { sanitizeHexColor } from '../lib/validation';

export interface AvatarProps {
  name: string;
  color: string;
  photoUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASS: Record<NonNullable<AvatarProps['size']>, string> = {
  sm: 'h-6 w-6 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-xl',
};

export default function Avatar({ name, color, photoUrl, size = 'sm', className = '' }: AvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  const safeColor = sanitizeHexColor(color, AVATAR_COLORS[0]);
  const validPhoto = validateAvatarPhotoDataUrl(photoUrl);
  const sizeClass = SIZE_CLASS[size];

  if (validPhoto) {
    return (
      <img
        src={validPhoto}
        alt=""
        aria-hidden="true"
        className={`inline-block shrink-0 rounded-full object-cover ${sizeClass} ${className}`}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-medium text-background-primary ${sizeClass} ${className}`}
      style={{ background: safeColor }}
    >
      {initial}
    </span>
  );
}
