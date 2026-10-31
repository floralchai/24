/*
    (PLEASE DO NOT DELETE THIS HEADER OR CREDIT!)

    Based on the comment widget by Ayano (https://virtualobserver.moe/)
    Flow: on-site form -> Google Forms -> Google Sheet -> comments shown on the site.

    Paste this anywhere you want a comment section
    (change the script src to wherever you store this file; cmtbox.css must be next to it):

        <div id="c_widget"></div>
        <script src="comment-widget-forms.js"></script>

    REQUIREMENTS
    - The Google Form must have these questions, titled EXACTLY (they become the sheet's column headers):
      Name, Website, Text, Page, Reply
    - The responses Sheet must be shared as "Anyone with the link: Viewer" so the site can read it.
*/

// REQUIRED values - keep them in quotes!
const c_widgetScriptUrl = document.currentScript.src;
const s_stylePath = new URL("cmtbox.css", c_widgetScriptUrl).href;
const s_formId = "1FAIpQLSeWfvuC_DsO3RNcMqI0YRscqaglKEWHtYi3j6tgTwIDDOlSsQ";
const s_nameId = "1043589293";
const s_websiteId = "1171504669";
const s_textId = "1956474156";
const s_pageId = "655547644";
const s_replyId = "2137349924";
const s_sheetId = "1KIRN9S4OJdLCLOZGTKJqbPwV8SVidExfFcI6jX0F6Ag";

// Timestamps
const s_timezone = 7; // Your timezone (UTC+7 = 7, UTC-5 = -5, UTC+10:30 = 10.5)
const s_daylightSavings = false;
const s_dstStart = ['March', 'Sunday', 2, 2];
const s_dstEnd = ['November', 'Sunday', 1, 2];

// Misc
const s_commentsPerPage = 5;
const s_maxLength = 500;
const s_maxLengthName = 16;
const s_commentsOpen = true;
const s_collapsedReplies = true;
const s_longTimestamp = false;
let s_includeUrlParameters = false;
const s_fixRarebitIndexPage = false;

// Word filter
const s_wordFilterOn = false;
const s_filterReplacement = '****';
const s_filteredWords = [
  "fuck",
  "bitch",
  "bitches",
  "motherfucker",
  "sudicide",
  "shit",
  "nigga",
  "black guy"
];

// Text
const s_widgetTitle = '<img src="../assets/graphics/star_s_03.gif"></img> Leave a comment';
const s_nameFieldLabel = 'Name';
const s_websiteFieldLabel = 'Website (Optional)';
const s_textFieldLabel = 'Message';
const s_submitButtonLabel = 'Submit';
const s_loadingText = 'Loading comments...';
const s_noCommentsText = 'No comments yet';
const s_closedCommentsText = 'Comments are closed temporarily';
const s_errorText = 'Could not load comments right now. Please try again later.';
const s_websiteText = 'Website';
const s_replyButtonText = 'Reply';
const s_replyingText = 'Replying to';
const s_expandRepliesText = 'Show Replies';
const s_leftButtonText = '<<';
const s_rightButtonText = '>>';

/*
    DO NOT edit below this point unless you know what you're doing!
*/

if (s_fixRarebitIndexPage) { s_includeUrlParameters = true; }

// Apply CSS
const c_cssLink = document.createElement('link');
c_cssLink.type = 'text/css';
c_cssLink.rel = 'stylesheet';
c_cssLink.href = s_stylePath;
document.getElementsByTagName('head')[0].appendChild(c_cssLink);

// HTML
const v_mainHtml = `
    <div id="c_inputDiv">
        <form id="c_form" method="post" action="https://docs.google.com/forms/d/e/${s_formId}/formResponse"></form>
    </div>
    <div id="c_container">${s_loadingText}</div>
`;
const v_formHtml = `
    <h2 id="c_widgetTitle">${s_widgetTitle}</h2>

    <div id="c_nameWrapper" class="c-inputWrapper">
        <label class="c-label c-nameLabel" for="entry.${s_nameId}">${s_nameFieldLabel}</label>
        <input placeholder="Name" class="c-input c-nameInput" name="entry.${s_nameId}" id="entry.${s_nameId}" type="text" maxlength="${s_maxLengthName}" required>
    </div>

    <div id="c_websiteWrapper" class="c-inputWrapper">
        <label class="c-label c-websiteLabel" for="entry.${s_websiteId}">${s_websiteFieldLabel}</label>
        <input placeholder="https://example.com" class="c-input c-websiteInput" name="entry.${s_websiteId}" id="entry.${s_websiteId}" type="url" pattern="https://.*">
    </div>

    <div id="c_textWrapper" class="c-inputWrapper">
        <label class="c-label c-textLabel" for="entry.${s_textId}">${s_textFieldLabel}</label>
        <textarea placeholder="Message me any topics related to psychology or IT is the best!" class="c-input c-textInput" name="entry.${s_textId}" id="entry.${s_textId}" rows="4" cols="50" maxlength="${s_maxLength}" required></textarea>
    </div>

    <input id="c_submitButton" name="c_submitButton" type="submit" value="${s_submitButtonLabel}" disabled>
`;

document.getElementById('c_widget').innerHTML = v_mainHtml;
const c_form = document.getElementById('c_form');
if (s_commentsOpen) { c_form.innerHTML = v_formHtml; }
else { c_form.textContent = s_closedCommentsText; }

const c_container = document.getElementById('c_container');
let v_pageNum = 1;
let v_amountOfPages = 1;
let v_commentMax = 1;
let v_commentMin = 1;

// Word filter
let v_filteredWords;
if (s_wordFilterOn) {
    v_filteredWords = s_filteredWords.join('|');
    v_filteredWords = new RegExp(String.raw`\b(${v_filteredWords})\b`, 'ig');
}

// Submit button (dummy when closed)
let c_submitButton;
if (s_commentsOpen) { c_submitButton = document.getElementById('c_submitButton'); }
else { c_submitButton = document.createElement('button'); }

// Hidden page input
let v_pagePath = window.location.pathname;
if (s_includeUrlParameters) { v_pagePath += window.location.search; }
if (s_fixRarebitIndexPage && v_pagePath == '/') { v_pagePath = '/?pg=1'; }
const c_pageInput = document.createElement('input');
c_pageInput.value = v_pagePath; c_pageInput.type = 'text'; c_pageInput.style.display = 'none';
c_pageInput.id = 'entry.' + s_pageId; c_pageInput.name = c_pageInput.id;
c_form.appendChild(c_pageInput);

// "Replying to..." text
const c_replyingText = document.createElement('span');
c_replyingText.style.display = 'none'; c_replyingText.id = 'c_replyingText';
c_form.appendChild(c_replyingText);

// Hidden reply input
const c_replyInput = document.createElement('input');
c_replyInput.type = 'text'; c_replyInput.style.display = 'none';
c_replyInput.id = 'entry.' + s_replyId; c_replyInput.name = c_replyInput.id;
c_form.appendChild(c_replyInput);

// Submit to Google Forms with fetch (no iframe, so no framing/CSP warning).
// no-cors means the response is opaque, but the Form still records the entry.
c_form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!s_commentsOpen) { return; }
    c_submitButton.disabled = true;
    const body = new URLSearchParams(new FormData(c_form));
    fetch(c_form.action, { method: 'POST', mode: 'no-cors', body: body })
        .then(function () { fixFrame(); })
        .catch(function () { c_submitButton.disabled = false; });
});

// After Google Forms accepts the submission, reload the comments
let v_commentCount = 0; // how many comments this page had at the last load
function fixFrame() {
    const before = v_commentCount;
    let first = true;
    // The Sheet can lag a few seconds behind the Form, so retry until the new comment shows up
    function attempt(n) {
        getComments(first).then(function (count) {
            first = false;
            if (count <= before && n < 6) {
                setTimeout(function () { attempt(n + 1); }, 2000);
            }
        });
    }
    setTimeout(function () { attempt(1); }, 1500);
}

// ---------------------------------------------------------------
// Loading comments from the Google Sheet
// ---------------------------------------------------------------
function getComments(clearForm) {
    c_submitButton.disabled = true;

    if (clearForm) {
        c_replyingText.style.display = 'none';
        c_replyingText.textContent = '';
        c_replyInput.value = '';
        if (s_commentsOpen) {
            document.getElementById(`entry.${s_nameId}`).value = '';
            document.getElementById(`entry.${s_websiteId}`).value = '';
            document.getElementById(`entry.${s_textId}`).value = '';
        }
    }

    // Tutorial method: ask Google Sheets (gviz) for only this page's rows, as CSV.
    // Columns follow the Form question order: A Timestamp, B Name, C Website, D Text, E Page, F Reply
    const safePath = v_pagePath.replace(/'/g, "''");
    const query = `SELECT A, B, C, D, F WHERE E = '${safePath}'`;
    const url = `https://docs.google.com/spreadsheets/d/${s_sheetId}/gviz/tq?tqx=out:csv&tq=${encodeURIComponent(query)}&headers=1&_=${Date.now()}`;
    return getSheet(url).then(csvText => {
        const rows = parseCSV(csvText.trim());
        // First row is the header row: Timestamp, Name, Website, Text, Reply
        if (!rows.length || rows[0][1] !== 'Name') { throw new Error('Unexpected sheet data'); }

        const comments = [];
        for (let r = 1; r < rows.length; r++) {
            const row = rows[r];
            const comment = {
                Timestamp: row[0] || '',
                Name: row[1] || '',
                Website: row[2] || '',
                Text: row[3] || '',
                Reply: row[4] || ''
            };
            comment.Timestamp2 = comment.Timestamp;
            if (comment.Name && comment.Text) { comments.push(comment); }
        }

        v_commentCount = comments.length;
        if (comments.length == 0) { c_container.textContent = s_noCommentsText; }
        else { displayComments(comments); }

        c_submitButton.disabled = false;
        return comments.length;
    }).catch(() => {
        c_container.textContent = s_errorText;
        c_submitButton.disabled = false;
        return v_commentCount;
    });
}

// CSV parser that handles quoted fields, commas and line breaks inside comments
function parseCSV(text) {
    const rows = [];
    let row = [], field = '', inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (inQuotes) {
            if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
            else if (ch === '"') { inQuotes = false; }
            else { field += ch; }
        } else if (ch === '"') { inQuotes = true; }
        else if (ch === ',') { row.push(field); field = ''; }
        else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
        else if (ch !== '\r') { field += ch; }
    }
    row.push(field); rows.push(row);
    return rows;
}

// Date/time text from the sheet, e.g. "7/12/2024 23:32:54" -> "7/12/2024 at 11:32:54 PM"
function formatDate(stringDate) {
    const parts = String(stringDate).split(' ');
    if (parts.length < 2) { return stringDate; }
    const [h, m, sec] = parts[1].split(':');
    let hours = parseInt(h, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    if (hours > 12) { hours -= 12; }
    if (hours === 0) { hours = 12; }
    return `${parts[0]} at ${hours}:${m}:${sec} ${ampm}`;
}

function getSheet(url) {
    return new Promise(function (resolve, reject) {
        fetch(url).then(response => {
            if (!response.ok) { reject('Could not find Google Sheet with that URL'); return; }
            response.text().then(data => {
                if (!data) { reject('Invalid data pulled from sheet'); return; }
                resolve(data);
            });
        }).catch(reject);
    });
}

// ---------------------------------------------------------------
// Displaying comments
// ---------------------------------------------------------------
let a_commentDivs = [];
function displayComments(comments) {
    a_commentDivs = [];
    c_container.innerHTML = '';

    const replies = comments.filter(c => c.Reply);
    const mainComments = comments.filter(c => !c.Reply);

    v_amountOfPages = Math.max(1, Math.ceil(mainComments.length / s_commentsPerPage));
    if (v_pageNum > v_amountOfPages) { v_pageNum = v_amountOfPages; }
    v_commentMax = s_commentsPerPage * v_pageNum;
    v_commentMin = v_commentMax - s_commentsPerPage;

    // Newest first
    mainComments.reverse();
    for (let i = 0; i < mainComments.length; i++) {
        const comment = createComment(mainComments[i]);

        const button = document.createElement('button');
        button.innerHTML = s_replyButtonText;
        button.value = comment.id;
        button.addEventListener('click', () => openReply(button.value));
        button.className = 'c-replyButton';
        comment.appendChild(button);

        comment.style.display = (i >= v_commentMin && i < v_commentMax) ? 'block' : 'none';
        comment.className = 'c-comment';
        c_container.appendChild(comment);
        a_commentDivs.push(comment);
    }

    // Replies under their parent comment
    for (let i = 0; i < replies.length; i++) {
        const parentId = replies[i].Reply;
        const parentDiv = document.getElementById(parentId);
        if (!parentDiv) { continue; } // parent comment was deleted

        const reply = createComment(replies[i]);
        let container = document.getElementById(parentId + '-replies');
        if (!container) {
            container = document.createElement('div');
            container.id = parentId + '-replies';
            if (s_collapsedReplies) { container.style.display = 'none'; }
            container.className = 'c-replyContainer';
            parentDiv.appendChild(container);
        }
        reply.className = 'c-reply';
        container.appendChild(reply);
    }

    // Collapsed replies buttons
    if (s_collapsedReplies) {
        const containers = document.getElementsByClassName('c-replyContainer');
        for (let i = 0; i < containers.length; i++) {
            const num = containers[i].childNodes.length;
            const parentDiv = containers[i].parentElement;

            const button = document.createElement('button');
            button.innerHTML = s_expandRepliesText + ` (${num})`;
            button.addEventListener('click', () => expandReplies(parentDiv.id));
            button.className = 'c-expandButton';
            parentDiv.insertBefore(button, parentDiv.lastChild);
        }
    }

    // Pagination
    if (v_amountOfPages > 1) {
        const pagination = document.createElement('div');

        const leftButton = document.createElement('button');
        leftButton.innerHTML = s_leftButtonText; leftButton.id = 'c_leftButton'; leftButton.name = 'left';
        leftButton.addEventListener('click', () => changePage('left'));
        if (v_pageNum == 1) { leftButton.disabled = true; }
        leftButton.className = 'c-paginationButton';
        pagination.appendChild(leftButton);

        const rightButton = document.createElement('button');
        rightButton.innerHTML = s_rightButtonText; rightButton.id = 'c_rightButton'; rightButton.name = 'right';
        rightButton.addEventListener('click', () => changePage('right'));
        if (v_pageNum == v_amountOfPages) { rightButton.disabled = true; }
        rightButton.className = 'c-paginationButton';
        pagination.appendChild(rightButton);

        pagination.id = 'c_pagination';
        c_container.appendChild(pagination);
    }
}

// Create a comment element (comment or reply)
function createComment(data) {
    const comment = document.createElement('div');

    const fullStamp = String(data.Timestamp || '');
    const timestamp = s_longTimestamp ? formatDate(fullStamp) : fullStamp.split(' ')[0];

    // ID = Name + full timestamp (same scheme the replies use to find their parent)
    comment.id = data.Name + '|--|' + data.Timestamp2;

    const name = document.createElement('h3');
    let filteredName = String(data.Name);
    if (s_wordFilterOn) { filteredName = filteredName.replace(v_filteredWords, s_filterReplacement); }
    name.innerText = filteredName;
    name.className = 'c-name';
    comment.appendChild(name);

    const time = document.createElement('span');
    time.innerText = timestamp;
    time.className = 'c-timestamp';
    comment.appendChild(time);

    if (data.Website && /^https:\/\//i.test(data.Website)) {
        const site = document.createElement('a');
        site.innerText = s_websiteText;
        site.href = data.Website;
        site.rel = 'nofollow noopener noreferrer';
        site.target = '_blank';
        site.className = 'c-site';
        comment.appendChild(site);
    }

    const text = document.createElement('p');
    let filteredText = String(data.Text);
    if (s_wordFilterOn) { filteredText = filteredText.replace(v_filteredWords, s_filterReplacement); }
    text.innerText = filteredText;
    text.className = 'c-text';
    comment.appendChild(text);

    return comment;
}

// ---------------------------------------------------------------
// Timestamps (Google Sheets gives "Date(y,m,d,h,mi,s)", which is in the form/sheet's own timezone)
// ---------------------------------------------------------------
function convertTimestamp(timestamp) {
    if (typeof timestamp !== 'string' || timestamp.indexOf('(') < 0) { return ['', '']; }
    const vals = timestamp.split('(')[1].split(')')[0].split(',').map(Number);
    const date = new Date(vals[0], vals[1], vals[2], vals[3], vals[4], vals[5]);
    const timezoneDiff = (s_timezone * 60 + date.getTimezoneOffset()) * -1;
    let offsetDate = new Date(date.getTime() + timezoneDiff * 60 * 1000);
    if (s_daylightSavings) { offsetDate = isDST(offsetDate); }
    return [offsetDate.toLocaleString(), offsetDate.toLocaleDateString()];
}

function isDST(date) {
    const dstStart = [getMonthNum(s_dstStart[0]), getDayNum(s_dstStart[1]), s_dstStart[2], s_dstStart[3]];
    const dstEnd = [getMonthNum(s_dstEnd[0]), getDayNum(s_dstEnd[1]), s_dstEnd[2], s_dstEnd[3]];

    const year = date.getFullYear();
    const startDate = nthDayOfMonth(dstStart[1], dstStart[2], new Date(year, dstStart[0], 1), dstStart[3]).getTime();
    const endDate = nthDayOfMonth(dstEnd[1], dstEnd[2], new Date(year, dstEnd[0], 1), dstEnd[3]).getTime();
    const t = date.getTime();

    if (t >= startDate && t < endDate) { date.setHours(date.getHours() + 1); }
    return date;
}

// Thanks to https://stackoverflow.com/questions/32192982/get-a-given-weekday-in-a-given-month-with-javascript
function nthDayOfMonth(day, n, date, hour) {
    let count = 0;
    const idate = new Date(date);
    idate.setDate(1);
    while (count < n) {
        idate.setDate(idate.getDate() + 1);
        if (idate.getDay() == day) { count++; }
    }
    idate.setHours(hour);
    return idate;
}

function getDayNum(day) {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const idx = days.indexOf(String(day).toLowerCase());
    return idx < 0 ? 0 : idx;
}
function getMonthNum(month) {
    const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july',
        'august', 'september', 'october', 'november', 'december'];
    return months.indexOf(String(month).toLowerCase());
}

// ---------------------------------------------------------------
// Replies, expanding, pagination
// ---------------------------------------------------------------
function openReply(id) {
    if (c_replyingText.style.display == 'none') {
        c_replyingText.textContent = `${s_replyingText} ${id.split('|--|')[0]}...`;
        c_replyInput.value = id;
        c_replyingText.style.display = 'block';
    } else {
        c_replyingText.textContent = '';
        c_replyInput.value = '';
        c_replyingText.style.display = 'none';
    }
    document.getElementById('c_inputDiv').scrollIntoView({ behavior: 'smooth' });
}

function expandReplies(id) {
    const targetDiv = document.getElementById(`${id}-replies`);
    if (!targetDiv) { return; }
    targetDiv.style.display = (targetDiv.style.display == 'none') ? 'block' : 'none';
}

function changePage(dir) {
    const leftButton = document.getElementById('c_leftButton');
    const rightButton = document.getElementById('c_rightButton');

    let num = 0;
    if (dir == 'left') { num = -1; }
    if (dir == 'right') { num = 1; }
    const targetPage = v_pageNum + num;
    if (targetPage > v_amountOfPages || targetPage < 1) { return; }

    leftButton.disabled = (targetPage == 1);
    rightButton.disabled = (targetPage == v_amountOfPages);

    v_pageNum = targetPage;
    v_commentMax = s_commentsPerPage * v_pageNum;
    v_commentMin = v_commentMax - s_commentsPerPage;
    for (let i = 0; i < a_commentDivs.length; i++) {
        a_commentDivs[i].style.display = (i >= v_commentMin && i < v_commentMax) ? 'block' : 'none';
    }
}

getComments(false); // Run once on page load