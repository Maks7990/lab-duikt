const STORAGE_KEY = "planner_v1";

const els = {
  date: document.getElementById("date"),
  mood: document.getElementById("mood"),
  top3: document.getElementById("top3"),
  notes: document.getElementById("notes"),

  taskList: document.getElementById("taskList"),
  addTaskBtn: document.getElementById("addTaskBtn"),
  clearDoneBtn: document.getElementById("clearDoneBtn"),

  weekGrid: document.getElementById("weekGrid"),
  goalList: document.getElementById("goalList"),
  addGoalBtn: document.getElementById("addGoalBtn"),

  donePill: document.getElementById("donePill"),
  storagePill: document.getElementById("storagePill"),
};

const DEFAULT_STATE = {
  header: {
    title: "Мій планер",
    subtitle: "План на день і тиждень",
    weekNote: "Тут можна коротко описати фокус тижня."
  },
  date: "",
  mood: "",
  top3: "",
  notes: "",
  tasks: [
    { id: crypto.randomUUID(), text: "Зробити конспект", done: false },
    { id: crypto.randomUUID(), text: "Здати лабораторну", done: true },
  ],
  week: [
    { id: "mon", name: "Пн", habit: false, text: "" },
    { id: "tue", name: "Вт", habit: false, text: "" },
    { id: "wed", name: "Ср", habit: false, text: "" },
    { id: "thu", name: "Чт", habit: false, text: "" },
    { id: "fri", name: "Пт", habit: true,  text: "" },
    { id: "sat", name: "Сб", habit: false, text: "" },
    { id: "sun", name: "Нд", habit: false, text: "" },
  ],
  goals: [
    { id: crypto.randomUUID(), text: "Закрити 2 лабораторні", done: false },
    { id: crypto.randomUUID(), text: "30 хв читання щодня", done: true },
  ],
};

let state = loadState();

/* -------------------- Storage -------------------- */
function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_STATE);
    const parsed = JSON.parse(raw);

    // “м’яке” злиття, щоб не падати при відсутніх полях
    return {
      ...structuredClone(DEFAULT_STATE),
      ...parsed,
      header: { ...structuredClone(DEFAULT_STATE.header), ...(parsed.header || {}) },
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : structuredClone(DEFAULT_STATE.tasks),
      week: Array.isArray(parsed.week) ? parsed.week : structuredClone(DEFAULT_STATE.week),
      goals: Array.isArray(parsed.goals) ? parsed.goals : structuredClone(DEFAULT_STATE.goals),
    };
  }catch{
    return structuredClone(DEFAULT_STATE);
  }
}

let saveTimer = null;
function markSaved(isSaved){
  els.storagePill.textContent = isSaved ? "Saved" : "Saving...";
  els.storagePill.classList.toggle("pill--ok", isSaved);
}
function saveStateDebounced(){
  markSaved(false);
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    markSaved(true);
  }, 250);
}

/* -------------------- Header editable -------------------- */
function wireEditableHeader(){
  document.querySelectorAll("[data-edit]").forEach((node) => {
    const key = node.getAttribute("data-edit");
    node.addEventListener("input", () => {
      state.header[key] = node.textContent.trim();
      saveStateDebounced();
    });
  });
}

/* -------------------- Tasks -------------------- */
function renderTasks(){
  els.taskList.innerHTML = "";

  for (const t of state.tasks){
    const li = document.createElement("li");
    li.className = "task";
    if (t.done) li.classList.add("is-done");

    li.innerHTML = `
      <label class="check" aria-label="Відмітити задачу виконаною">
        <input type="checkbox" ${t.done ? "checked" : ""} />
        <span class="checkBox" aria-hidden="true"></span>
      </label>

      <input class="taskInput" type="text" value="${escapeHtmlAttr(t.text)}" aria-label="Текст задачі" />

      <button class="iconBtn" type="button" aria-label="Видалити задачу">✕</button>
    `;

    const cb = li.querySelector("input[type='checkbox']");
    const input = li.querySelector(".taskInput");
    const del = li.querySelector(".iconBtn");

    cb.addEventListener("change", () => {
      t.done = cb.checked;
      saveStateDebounced();
      renderAll(); // щоб оновились стилі і лічильник
    });

    input.addEventListener("input", () => {
      t.text = input.value;
      saveStateDebounced();
      // лічильник не чіпаємо
    });

    del.addEventListener("click", () => {
      state.tasks = state.tasks.filter(x => x.id !== t.id);
      saveStateDebounced();
      renderAll();
    });

    els.taskList.appendChild(li);
  }

  updateDonePill();
}

function updateDonePill(){
  const total = state.tasks.length;
  const done = state.tasks.filter(t => t.done).length;
  els.donePill.textContent = `${done}/${total} виконано`;
}

function addTask(){
  state.tasks.push({ id: crypto.randomUUID(), text: "Нова задача", done: false });
  saveStateDebounced();
  renderTasks();

  // фокус на останню
  const last = els.taskList.querySelector(".task:last-child .taskInput");
  if (last){
    last.focus();
    last.select();
  }
}

function clearDone(){
  state.tasks = state.tasks.filter(t => !t.done);
  saveStateDebounced();
  renderAll();
}

/* -------------------- Week -------------------- */
function renderWeek(){
  els.weekGrid.innerHTML = "";

  for (const d of state.week){
    const card = document.createElement("div");
    card.className = "day";

    card.innerHTML = `
      <div class="dayHead">
        <span class="dayTitle" contenteditable="true" spellcheck="false" aria-label="Назва дня">${escapeHtml(d.name)}</span>
        <label class="miniCheck">
          <input type="checkbox" ${d.habit ? "checked" : ""} />
          <span>звичка</span>
        </label>
      </div>
      <textarea class="textarea" rows="4" placeholder="план..."></textarea>
    `;

    const title = card.querySelector(".dayTitle");
    const habit = card.querySelector("input[type='checkbox']");
    const txt = card.querySelector("textarea");

    txt.value = d.text || "";

    title.addEventListener("input", () => {
      d.name = title.textContent.trim() || d.name;
      saveStateDebounced();
    });

    habit.addEventListener("change", () => {
      d.habit = habit.checked;
      saveStateDebounced();
    });

    txt.addEventListener("input", () => {
      d.text = txt.value;
      saveStateDebounced();
    });

    els.weekGrid.appendChild(card);
  }
}

/* -------------------- Goals -------------------- */
function renderGoals(){
  els.goalList.innerHTML = "";

  for (const g of state.goals){
    const label = document.createElement("label");
    label.className = "goal";
    label.innerHTML = `
      <input type="checkbox" ${g.done ? "checked" : ""} aria-label="Виконано" />
      <span contenteditable="true" spellcheck="false">${escapeHtml(g.text)}</span>
    `;

    const cb = label.querySelector("input");
    const span = label.querySelector("span");

    cb.addEventListener("change", () => {
      g.done = cb.checked;
      saveStateDebounced();
    });

    span.addEventListener("input", () => {
      g.text = span.textContent.trim();
      saveStateDebounced();
    });

    els.goalList.appendChild(label);
  }
}

function addGoal(){
  state.goals.push({ id: crypto.randomUUID(), text: "Нова ціль", done: false });
  saveStateDebounced();
  renderGoals();

  const last = els.goalList.querySelector(".goal:last-child span");
  if (last){
    last.focus();
    // place caret end
    const range = document.createRange();
    range.selectNodeContents(last);
    range.collapse(false);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }
}

/* -------------------- Inputs binding -------------------- */
function wireInputs(){
  els.date.value = state.date || "";
  els.mood.value = state.mood || "";
  els.top3.value = state.top3 || "";
  els.notes.value = state.notes || "";

  els.date.addEventListener("change", () => { state.date = els.date.value; saveStateDebounced(); });
  els.mood.addEventListener("input", () => { state.mood = els.mood.value; saveStateDebounced(); });
  els.top3.addEventListener("input", () => { state.top3 = els.top3.value; saveStateDebounced(); });
  els.notes.addEventListener("input", () => { state.notes = els.notes.value; saveStateDebounced(); });
}

/* -------------------- Editable header init -------------------- */
function applyHeaderFromState(){
  const title = document.querySelector("[data-edit='title']");
  const subtitle = document.querySelector("[data-edit='subtitle']");
  const weekNote = document.querySelector("[data-edit='weekNote']");
  if (title) title.textContent = state.header.title || DEFAULT_STATE.header.title;
  if (subtitle) subtitle.textContent = state.header.subtitle || DEFAULT_STATE.header.subtitle;
  if (weekNote) weekNote.textContent = state.header.weekNote || DEFAULT_STATE.header.weekNote;
}

/* -------------------- Utils -------------------- */
function escapeHtml(str){
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
function escapeHtmlAttr(str){
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* -------------------- Render -------------------- */
function renderAll(){
  applyHeaderFromState();
  renderTasks();
  renderWeek();
  renderGoals();
}

/* -------------------- Events -------------------- */
els.addTaskBtn.addEventListener("click", addTask);
els.clearDoneBtn.addEventListener("click", clearDone);
els.addGoalBtn.addEventListener("click", addGoal);

/* Init */
wireEditableHeader();
wireInputs();
renderAll();
updateDonePill();
markSaved(true);
