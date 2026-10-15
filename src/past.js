// Calendar page: grey out deadlines that are already in the past.
(function () {
  const now = new Date();
  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())).toISOString().slice(0, 10);
  document.querySelectorAll('tr[data-date]').forEach(tr => {
    if (tr.dataset.date < today) tr.classList.add('past');
  });
})();
