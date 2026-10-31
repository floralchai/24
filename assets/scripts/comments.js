const CONFIG = {
  formUrl: "https://docs.google.com/forms/d/e/1FAIpQLSeWfvuC_DsO3RNcMqI0YRscqaglKEWHtYi3j6tgTwIDDOlSsQ/formResponse",

  nameField: "entry.1043589293",
  emailField: "entry.1171504669",
  commentField: "entry.1302608640",

  sheetId: "1KIRN9S4OJdLCLOZGTKJqbPwV8SVidExfFcI6jX0F6Ag",
  sheetGid: "0",
  sheetName: "comments"
};

const listEl = document.getElementById("comment-list");
const statusEl = document.getElementById("comment-status");
const form = document.getElementById("comment-form");

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value) {
  const date = new Date(value);
  return isNaN(date) ? "" : date.toLocaleString();
}

async function loadComments() {
  const url =
    `https://docs.google.com/spreadsheets/d/${CONFIG.sheetId}/gviz/tq` +
    `?tqx=out:json&gid=${CONFIG.sheetGid}&sheet=${encodeURIComponent(CONFIG.sheetName)}`;

  try {
    const response = await fetch(url);
    const text = await response.text();

    const json = JSON.parse(
      text.substring(text.indexOf("{"), text.lastIndexOf("}") + 1)
    );

    const comments = (json.table.rows || [])
      .map(row => {
        const cells = row.c || [];
        return {
          name: cells[0]?.v ?? "",
          email: cells[1]?.v ?? "",
          comment: cells[2]?.v ?? "",
          timestamp: cells[3]?.v ?? ""
        };
      })
      .filter(comment => comment.comment)
      .reverse();

    if (!comments.length) {
      listEl.innerHTML = `<p class="muted">No comments yet.</p>`;
      return;
    }

    listEl.innerHTML = comments.map(comment => `
      <article class="comment">
        <header>
          <strong>${escapeHtml(comment.name || "Anonymous")}</strong>
          <time>${escapeHtml(formatDate(comment.timestamp))}</time>
        </header>
        <p>${escapeHtml(comment.comment).replaceAll("\n", "<br>")}</p>
      </article>
    `).join("");
  } catch (error) {
    console.error(error);
    listEl.innerHTML = `<p class="muted">Comments could not be loaded.</p>`;
  }
}

form.addEventListener("submit", async event => {
  event.preventDefault(); // This stops the redirect to Google Forms

  const name = document.getElementById("comment-name").value.trim();
  const email = document.getElementById("comment-email").value.trim();
  const comment = document.getElementById("comment-text").value.trim();

  if (!name || !email || !comment) {
    statusEl.textContent = "Please fill in all fields.";
    return;
  }

  const data = new FormData();
  data.append(CONFIG.nameField, name);
  data.append(CONFIG.emailField, email);
  data.append(CONFIG.commentField, comment);

  statusEl.textContent = "Posting…";

  try {
    await fetch(CONFIG.formUrl, {
      method: "POST",
      mode: "no-cors",
      body: data
    });

    form.reset();
    statusEl.textContent = "Comment posted.";
    setTimeout(loadComments, 3000);
  } catch (error) {
    console.error(error);
    statusEl.textContent = "Could not post your comment.";
  }
});

loadComments();