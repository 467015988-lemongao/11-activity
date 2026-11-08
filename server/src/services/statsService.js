// 全部基于 signups 实时聚合，与名单同口径，不做物化、无缓存副本（AC-13/14）。
export function getStats(db) {
  const totals = db
    .prepare(
      `SELECT COUNT(*) AS total_signups,
              SUM(CASE WHEN status = 'redeemed' THEN 1 ELSE 0 END) AS total_redeemed
         FROM signups WHERE activity_id = 1`
    )
    .get()
  const totalSignups = totals.total_signups || 0
  const totalRedeemed = totals.total_redeemed || 0

  const tierRows = db
    .prepare(
      `SELECT t.id AS tier_id, t.threshold, t.bonus, COUNT(s.id) AS count
         FROM tiers t
         LEFT JOIN signups s ON s.tier_id = t.id AND s.activity_id = 1
        WHERE t.activity_id = 1
        GROUP BY t.id
        ORDER BY t.sort_order, t.id`
    )
    .all()
  const byTier = tierRows.map((r) => ({
    tier_id: r.tier_id,
    threshold: r.threshold,
    bonus: r.bonus,
    count: r.count,
    ratio: totalSignups ? Number((r.count / totalSignups).toFixed(4)) : 0
  }))

  return {
    total_signups: totalSignups,
    total_redeemed: totalRedeemed,
    redemption_rate: totalSignups ? Number((totalRedeemed / totalSignups).toFixed(4)) : 0,
    by_tier: byTier
  }
}
