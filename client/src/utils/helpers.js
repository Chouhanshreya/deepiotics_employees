export const getTierColor = (tier) => {
  const colors = {
    Diamond: 'bg-cyan-500',
    Platinum: 'bg-slate-400',
    Gold: 'bg-amber-500',
    Silver: 'bg-gray-400',
    Bronze: 'bg-orange-700'
  };
  return colors[tier] || 'bg-gray-400';
};

export const getTierBadge = (tier) => {
  const badges = {
    Diamond: '💎',
    Platinum: '⭐',
    Gold: '🏆',
    Silver: '🥈',
    Bronze: '🥉'
  };
  return badges[tier] || '🎖️';
};

export const getInitials = (name) => {
  if (!name) return '??';
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
};

export const getCurrentDate = () => {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const getNextTierInfo = (points) => {
  const tiers = [
    { name: 'Bronze', min: 0, max: 499 },
    { name: 'Silver', min: 500, max: 999 },
    { name: 'Gold', min: 1000, max: 1999 },
    { name: 'Platinum', min: 2000, max: 2999 },
    { name: 'Diamond', min: 3000, max: Infinity }
  ];

  const currentTier = tiers.find(t => points >= t.min && points <= t.max);
  const currentIndex = tiers.indexOf(currentTier);

  if (currentIndex === tiers.length - 1) {
    return { nextTier: 'Max', pointsNeeded: 0, progress: 100 };
  }

  const nextTier = tiers[currentIndex + 1];
  const pointsNeeded = nextTier.min - points;
  const tierRange = nextTier.min - currentTier.min;
  const progress = ((points - currentTier.min) / tierRange) * 100;

  return { nextTier: nextTier.name, pointsNeeded, progress };
};
