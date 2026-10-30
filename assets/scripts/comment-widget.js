/*
    (PLEASE DO NOT DELETE THIS HEADER OR CREDIT!)

    Based on the comment widget by Ayano (https://virtualobserver.moe/)
    Modified to use a Google Apps Script web app instead of Google Forms.

    User customizable settings below!
    Do not delete any settings even if you aren't using them! It could break the program.

    After filling out your options, just paste this anywhere you want a comment section
    (But change the script src URL to wherever you have this widget stored on your site!)

        <div id="c_widget"></div>
        <script src="comment-widget.js"></script>

    Keep cmtbox.css in the same folder as this file.
*/

// REQUIRED: paste your Apps Script Web App URL (ends with /exec). Keep it in quotes!
const s_scriptUrl = "https://script.google.com/macros/s/AKfycbwxHH6vCIqvEXzKzePuej8kZOcbCb4sAwKkrczEpFe2iY5lcTkaoKTkgTQE8oMGBoZBQw/exec";

const c_widgetScriptUrl = document.currentScript.src;
const s_stylePath = new URL("cmtbox.css", c_widgetScriptUrl).href;

// The values below are necessary for accurate timestamps (EST shown as an example)
const s_timezone = 7; // Your timezone offset (UTC+7 = 7, UTC-5 = -5, UTC+10:30 = 10.5)
const s_daylightSavings = false; // If your timezone uses DST, set this to true
const s_dstStart = ['March', 'Sunday', 2, 2]; // [Month, Weekday, which number of that weekday, hour (24h)]
const s_dstEnd = ['November', 'Sunday', 1, 2];

// Misc - Other random settings
const s_commentsPerPage = 5;
const s_maxLength = 500;      // keep in sync with MAX_TEXT in Code.gs
const s_maxLengthName = 16;   // keep in sync with MAX_NAME in Code.gs
const s_commentsOpen = true;
const s_collapsedReplies = true;
const s_longTimestamp = false;
let s_includeUrlParameters = false;
const s_fixRarebitIndexPage = false;

// Word filter - Censor profanity, etc
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
const s_errorText = 'Could not load or send comments right now. Please try again later.';
const s_websiteText = 'Website';
const s_replyButtonText = 'Reply';
const s_replyingText = 'Replying to';
const s_expandRepliesText = 'Show Replies';
const s_leftButtonText = '<<';
const s_rightButtonText = '>>';

/*
    DO NOT edit below this point unless you are confident you know what you're doing!
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
        <form id="c_form"></form>
    </div>
    <div id="c_container">${s_loadingText}</div>
`;
const v_formHtml = `
    <h2 id="c_widgetTitle">${s_widgetTitle}</h2>

    <div id="c_nameWrapper" class="c-inputWrapper">
        <label class="c-label c-nameLabel" for="c_name">${s_nameFieldLabel}</label>
        <input placeholder="Name" class="c-input c-nameInput" name="name" id="c_name" type="text" maxlength="${s_maxLengthName}" required>
    </div>

    <div id="c_websiteWrapper" class="c-inputWrapper">
        <label class="c-label c-websiteLabel" for="c_website">${s_websiteFieldLabel}</label>
        <input placeholder="https://example.com" class="c-input c-websiteInput" name="website" id="c_website" type="url" pattern="https://.*">
    </div>

    <div id="c_textWrapper" class="c-inputWrapper">
        <label class="c-label c-textLabel" for="c_text">${s_textFieldLabel}</label>
        <textarea placeholder="Message me any topics related to psychology or IT is the best!" class="c-input c-textInput" name="text" id="c_text" rows="4" cols="50" maxlength="${s_maxLength}" required></textarea>
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

// Submit button (dummy if comments are closed)
let c_submitButton;
if (s_commentsOpen) { c_submitButton = document.getElementById('c_submitButton'); }
else { c_submitButton = document.createElement('button'); }

// Page path used to group comments
let v_pagePath = window.location.pathname;
if (s_includeUrlParameters) { v_pagePath += window.location.search; }
if (s_fixRarebitIndexPage && v_pagePath == '/') { v_pagePath = '/?pg=1'; }

// Hidden honeypot field (bots fill it, humans never see it)
const c_honeypot = document.createElement('input');
c_honeypot.type = 'text'; c_honeypot.name = 'hp'; c_honeypot.id = 'c_hp';
c_honeypot.tabIndex = -1; c_honeypot.autocomplete = 'off';
c_honeypot.style.cssText = 'position:absolute;left:-9999px;opacity:0;height:0;width:0;';
c_form.appendChild(c_honeypot);

// "Replying to..." text
const c_replyingText = document.createElement('span');
c_replyingText.style.display = 'none'; c_replyingText.id = 'c_replyingText';
c_form.appendChild(c_replyingText);

// Current reply target (comment ID), '' when not replying
let v_replyTo = '';

// ---------------------------------------------------------------
// Sending a comment
// ---------------------------------------------------------------
if (s_commentsOpen) {
    c_form.addEventListener('submit', function (event) {
        event.preventDefault();
        c_submitButton.disabled = true;

        const payload = {
            name: document.getElementById('c_name').value,
            website: document.getElementById('c_website').value,
            text: document.getElementById('c_text').value,
            page: v_pagePath,
            reply: v_replyTo,
            hp: c_honeypot.value
        };

        // text/plain avoids a CORS preflight, which Apps Script doesn't support
        fetch(s_scriptUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
        })
            .then(response => response.json())
            .then(result => {
                if (result.result !== 'success') {
                    alert(result.error || s_errorText);
                    c_submitButton.disabled = false;
                    return;
                }
                getComments(true);
            })
            .catch(() => {
                alert(s_errorText);
                c_submitButton.disabled = false;
            });
    });
}

// ---------------------------------------------------------------
// Loading comments
// ---------------------------------------------------------------
function getComments(clearForm) {
    c_submitButton.disabled = true;

    if (clearForm) {
        v_replyTo = '';
        c_replyingText.style.display = 'none';
        c_replyingText.textContent = '';
        if (s_commentsOpen) {
            document.getElementById('c_name').value = '';
            document.getElementById('c_website').value = '';
            document.getElementById('c_text').value = '';
        }
    }

    const url = `${s_scriptUrl}?page=${encodeURIComponent(v_pagePath)}`;
    fetch(url)
        .then(response => response.json())
        .then(result => {
            if (result.result !== 'success') { throw new Error(result.error); }
            const comments = result.comments || [];
            if (comments.length == 0) { c_container.textContent = s_noCommentsText; }
            else { displayComments(comments); }
            c_submitButton.disabled = false;
        })
        .catch(() => {
            c_container.textContent = s_errorText;
            c_submitButton.disabled = false;
        });
}

// ---------------------------------------------------------------
// Displaying comments
// ---------------------------------------------------------------
let a_commentDivs = [];
function displayComments(comments) {
    a_commentDivs = [];
    c_container.innerHTML = '';

    // Separate replies from main comments
    const replies = comments.filter(c => c.reply);
    const mainComments = comments.filter(c => !c.reply);

    // Pagination values
    v_amountOfPages = Math.max(1, Math.ceil(mainComments.length / s_commentsPerPage));
    if (v_pageNum > v_amountOfPages) { v_pageNum = v_amountOfPages; }
    v_commentMax = s_commentsPerPage * v_pageNum;
    v_commentMin = v_commentMax - s_commentsPerPage;

    // Main comments, newest first
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

    // Replies (oldest first, under their parent)
    for (let i = 0; i < replies.length; i++) {
        const parentId = replies[i].reply;
        const parentDiv = document.getElementById(parentId);
        if (!parentDiv) { continue; } // parent was deleted

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

// Create a basic comment element (used for comments and replies)
function createComment(data) {
    const comment = document.createElement('div');
    comment.id = data.id;

    // Timestamp
    const timestamps = convertTimestamp(data.timestamp);
    const timestamp = s_longTimestamp ? timestamps[0] : timestamps[1];

    // Name
    const name = document.createElement('h3');
    let filteredName = data.name;
    if (s_wordFilterOn) { filteredName = filteredName.replace(v_filteredWords, s_filterReplacement); }
    name.innerText = filteredName;
    name.className = 'c-name';
    comment.appendChild(name);

    // Time
    const time = document.createElement('span');
    time.innerText = timestamp;
    time.className = 'c-timestamp';
    comment.appendChild(time);

    // Website (https only)
    if (data.website && /^https:\/\//i.test(data.website)) {
        const site = document.createElement('a');
        site.innerText = s_websiteText;
        site.href = data.website;
        site.rel = 'nofollow noopener noreferrer';
        site.target = '_blank';
        site.className = 'c-site';
        comment.appendChild(site);
    }

    // Text
    const text = document.createElement('p');
    let filteredText = data.text;
    if (s_wordFilterOn) { filteredText = filteredText.replace(v_filteredWords, s_filterReplacement); }
    text.innerText = filteredText;
    text.className = 'c-text';
    comment.appendChild(text);

    return comment;
}

// ---------------------------------------------------------------
// Timestamps (server sends UTC ISO strings)
// ---------------------------------------------------------------
function convertTimestamp(iso) {
    const utc = new Date(iso);
    if (isNaN(utc.getTime())) { return ['', '']; }

    // Shift to the configured timezone, then read the UTC fields as wall-clock time
    const shifted = new Date(utc.getTime() + s_timezone * 60 * 60 * 1000);
    let offsetDate = new Date(
        shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate(),
        shifted.getUTCHours(), shifted.getUTCMinutes(), shifted.getUTCSeconds()
    );
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
        const parent = document.getElementById(id);
        const parentName = parent ? parent.querySelector('.c-name').innerText : '';
        c_replyingText.textContent = `${s_replyingText} ${parentName}...`;
        v_replyTo = id;
        c_replyingText.style.display = 'block';
    } else {
        c_replyingText.textContent = '';
        v_replyTo = '';
        c_replyingText.style.display = 'none';
    }
    const inputDiv = document.getElementById('c_inputDiv');
    if (inputDiv) { inputDiv.scrollIntoView({ behavior: 'smooth' }); }
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