import { getInitials } from '../utils/helpers';

const Avatar = ({ name, size = 'md' }) => {
  const sizes = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-3xl'
  };

  return (
    <div className={`
      ${sizes[size]}
      rounded-full bg-gradient-to-br from-primary to-secondary
      text-white font-semibold
      flex items-center justify-center
    `}>
      {getInitials(name)}
    </div>
  );
};

export default Avatar;
