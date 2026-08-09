function formatSeconds(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) {
    return `${seconds}s`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function updateRestTimer(timer) {
  const value = timer.querySelector("[data-rest-timer-value]");
  const label = timer.querySelector("[data-rest-timer-label]");
  const startedAt = new Date(timer.dataset.startedAt);
  const duration = Number(timer.dataset.duration || 0);
  const elapsed = Math.max(0, Math.floor((Date.now() - startedAt.getTime()) / 1000));
  const remaining = Math.max(0, duration - elapsed);

  value.textContent = formatSeconds(remaining);
  if (remaining === 0) {
    label.textContent = "Descanso concluído. Próxima série pronta.";
    return false;
  }
  label.textContent = "Recupere antes da próxima série.";
  return true;
}

document.querySelectorAll("[data-rest-timer]").forEach((timer) => {
  if (!updateRestTimer(timer)) {
    return;
  }
  const intervalId = window.setInterval(() => {
    if (!updateRestTimer(timer)) {
      window.clearInterval(intervalId);
    }
  }, 1000);
});
