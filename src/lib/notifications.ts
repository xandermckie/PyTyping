export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

export function showPhaseNotification(phase: 'focus' | 'break'): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  try {
    new Notification('PyTyping Pomodoro', {
      body: phase === 'focus' ? 'Break time — step away for a few minutes.' : 'Focus time — back to work.',
      tag: `pytyping-pomodoro-${phase}`,
    });
  } catch {
    /* notifications unavailable */
  }
}
