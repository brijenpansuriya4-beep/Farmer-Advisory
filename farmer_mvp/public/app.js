// public/app.js
let faq = [];
let fuse = null;
const CONFIDENCE_PERCENT = 60; // threshold for "confident" match

async function loadFaq() {
  try {
    const res = await fetch('/api/faq');
    faq = await res.json();
    fuse = new Fuse(faq, { keys: ['question','answer','tags','crop'], includeScore: true, threshold: 0.45 });
    console.log('Loaded FAQ entries:', faq.length);
  } catch (e) {
    console.error('Could not load FAQ', e);
  }
}

function showResult(html) {
  document.getElementById('result').innerHTML = html;
}

function scoreToPercent(score) {
  // Fuse score: 0 perfect, 1 very bad
  if (typeof score !== 'number') return 0;
  return Math.round((1 - score) * 100);
}

document.getElementById('askBtn').addEventListener('click', async () => {
  const q = document.getElementById('qInput').value.trim();
  if (!q) { alert('Please type a question'); return; }
  if (!fuse) await loadFaq();
  const results = fuse.search(q);
  if (results.length > 0) {
    const top = results[0];
    const perc = scoreToPercent(top.score);
    let html = `<b>Best match (score ${perc}%)</b><br/><i>${top.item.question}</i><br/><p>${top.item.answer}</p>`;
    if (perc >= CONFIDENCE_PERCENT) {
      html = `<div style="border-left:4px solid #2b7a78;padding-left:8px;">${html}</div>`;
      showResult(html);
    } else {
      html += `<p style="color:#a00">Not confident — saved for expert is recommended.</p>`;
      showResult(html);
    }
  } else {
    showResult('<i>No matches found. Consider submitting to an expert.</i>');
  }
});

// Submit to expert
document.getElementById('submitExpertBtn').addEventListener('click', async () => {
  const q = document.getElementById('qInput').value.trim();
  if (!q) { alert('Type a question first'); return; }
  const res = await fetch('/api/queries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: q })
  });
  const data = await res.json();
  if (data.status === 'saved') {
    document.getElementById('submitMsg').innerText = 'Saved for expert review.';
  } else {
    document.getElementById('submitMsg').innerText = 'Could not save (check server).';
  }
});

// Admin add FAQ
document.getElementById('addFaqBtn').addEventListener('click', async () => {
  const pwd = document.getElementById('adminPwd').value;
  const question = document.getElementById('adminQ').value.trim();
  const answer = document.getElementById('adminA').value.trim();
  const crop = document.getElementById('adminCrop').value.trim();
  const tags = document.getElementById('adminTags').value.trim();
  if (!question || !answer) { alert('Provide question and answer'); return; }
  const res = await fetch('/api/faq', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: pwd, question, answer, crop, tags })
  });
  const data = await res.json();
  if (data.status === 'ok') {
    document.getElementById('adminMsg').innerText = 'FAQ added. Thank you!';
    // reload FAQ
    await loadFaq();
  } else {
    document.getElementById('adminMsg').innerText = data.error || 'Could not add FAQ';
  }
});

// load FAQ at start
loadFaq();
