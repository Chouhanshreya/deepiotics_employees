import { getTierColor, getTierBadge } from '../utils/helpers';

const TierBadge = ({ tier, showIcon = true }) => {
  return (
    <span className={`
      inline-flex items-center gap-1 px-3 py-1 rounded-full text-white text-sm font-semibold
      ${getTierColor(tier)}
    `}>
      {showIcon && <span>{getTierBadge(tier)}</span>}
      <span>{tier}</span>
    </span>
  );
};

export default TierBadge;
