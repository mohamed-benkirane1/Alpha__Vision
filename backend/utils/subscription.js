const PLAN_LEVELS = { free: 0, pro: 1, elite: 2 };

function normalizePlan(plan) {
  return Object.prototype.hasOwnProperty.call(PLAN_LEVELS, plan) ? plan : 'free';
}

function getSubscriptionAccess(user, now = new Date()) {
  const actualPlan = normalizePlan(user?.plan);
  const rawExpiresAt = user?.planExpiresAt || null;
  const expiresAt = rawExpiresAt ? new Date(rawExpiresAt) : null;
  const hasExpiry = Boolean(expiresAt && !Number.isNaN(expiresAt.getTime()));
  const expired = actualPlan !== 'free' && hasExpiry && expiresAt.getTime() <= now.getTime();

  return {
    actualPlan,
    effectivePlan: expired ? 'free' : actualPlan,
    expired,
    planExpiresAt: rawExpiresAt,
    hasExpiry,
  };
}

function hasPlanAccess(currentPlan, requiredPlan) {
  return PLAN_LEVELS[normalizePlan(currentPlan)] >= PLAN_LEVELS[normalizePlan(requiredPlan)];
}

module.exports = {
  getSubscriptionAccess,
  hasPlanAccess,
  normalizePlan,
};
