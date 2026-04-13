/**
 * In-memory store for WhatsApp bulk send progress — per user.
 * Each user can have one active job at a time.
 */

const _jobs = new Map() // userId → job

export const progressStore = {
  start(userId, total) {
    _jobs.set(String(userId), {
      total,
      current:    0,
      sent:       0,
      failed:     0,
      status:     'sending',
      startedAt:  Date.now(),
      finishedAt: null,
    })
  },

  update(userId, { current, sent, failed }) {
    const job = _jobs.get(String(userId))
    if (!job) return
    job.current = current
    job.sent    = sent
    job.failed  = failed
  },

  finish(userId, { sent, failed }) {
    const job = _jobs.get(String(userId))
    if (!job) return
    job.status     = 'done'
    job.sent       = sent
    job.failed     = failed
    job.current    = job.total
    job.finishedAt = Date.now()
  },

  get(userId) {
    return _jobs.get(String(userId)) ?? null
  },

  clear(userId) {
    _jobs.delete(String(userId))
  },
}
