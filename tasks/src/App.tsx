import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Check,
  Download,
  Edit2,
  Loader2,
  LogOut,
  Search,
  Trash2,
} from "lucide-react";
import useAuth from "./hooks/useAuth";
import {
  FILTER_TITLES,
  NewTask,
  STATUS,
  Task,
  TaskFilter,
  TaskPriority,
  TaskSort,
  addTask,
  deleteTask,
  loadTasksForUser,
  loadUserTasks,
  selectCounts,
  selectVisibleTasks,
  setFilter,
  setSearch,
  setSort,
  toggleDone,
  updateTask,
} from "./store/taskSlice";
import type { AppDispatch, RootState } from "./store/store";

const emptyTask: NewTask = {
  status: "todo",
  task: "",
  who: "",
  day: "",
  prio: "",
  note: "",
};

function fmtDate(date: string) {
  if (!date) return "-";
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

function dateClass(date: string) {
  if (!date) return "";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const taskDate = new Date(`${date}T00:00:00`);
  if (taskDate < today) return "overdue";
  if (taskDate.toDateString() === today.toDateString()) return "today";
  return "";
}

function prioClass(prio: string) {
  return { Alta: "p-alta", Media: "p-media", Baixa: "p-baixa" }[prio] || "";
}

function quoteCsv(value: string) {
  return `"${String(value || "").replace(/"/g, '""')}"`;
}

function App() {
  const auth = useAuth();
  const dispatch = useDispatch();
  const { activeUserId, filter, items, search, sort } = useSelector(
    (state: RootState) => state.task
  );
  const visibleTasks = useSelector(selectVisibleTasks);
  const counts = useSelector(selectCounts);
  const [newTask, setNewTask] = useState(emptyTask);
  const [editing, setEditing] = useState<Task | null>(null);
  const userId = auth.profile?.preferred_username || auth.profile?.sub;

  useEffect(() => {
    if (!auth.authenticated || !userId || activeUserId === userId) return;
    dispatch(loadUserTasks({ userId, tasks: loadTasksForUser(userId) }));
  }, [activeUserId, auth.authenticated, dispatch, userId]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setEditing(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  const stats = useMemo(() => {
    const total = items.length || 1;
    return [
      { label: "Total", num: items.length, fill: "#3b82f6", pct: 100 },
      {
        label: "Em progresso",
        num: counts.doing,
        fill: "#f59e0b",
        pct: Math.round((counts.doing / total) * 100),
      },
      {
        label: "Bloqueadas",
        num: counts.blocked,
        fill: "#ef4444",
        pct: Math.round((counts.blocked / total) * 100),
      },
      {
        label: "Concluidas",
        num: counts.done,
        fill: "#22c55e",
        pct: Math.round((counts.done / total) * 100),
      },
    ];
  }, [counts, items.length]);

  if (!auth.ready) {
    return (
      <div className="auth-screen">
        <Loader2 className="spin" size={24} />
        <span>A iniciar autenticacao...</span>
      </div>
    );
  }

  if (auth.error) {
    return (
      <div className="auth-screen">
        <div className="auth-box">
          <h1>Autenticacao indisponivel</h1>
          <p>
            Confirme se o Keycloak esta ativo e se o cliente esta configurado.
          </p>
          <button className="btn btn-add" onClick={auth.login}>
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!activeUserId || activeUserId !== userId) {
    return (
      <div className="auth-screen">
        <Loader2 className="spin" size={24} />
        <span>A carregar tarefas do utilizador...</span>
      </div>
    );
  }

  const addNewTask = () => {
    if (!newTask.task.trim()) return;
    dispatch(addTask(newTask));
    setNewTask(emptyTask);
  };

  const saveEdit = () => {
    if (!editing?.task.trim()) return;
    dispatch(updateTask(editing));
    setEditing(null);
  };

  const exportCSV = () => {
    const rows = [
      ["Estado", "Tarefa", "Para quem", "Data", "Prioridade", "Notas"],
    ];
    items.forEach((task) => {
      rows.push([
        STATUS[task.status]?.label || "",
        task.task,
        task.who,
        fmtDate(task.day),
        task.prio,
        task.note,
      ]);
    });

    const csv = rows.map((row) => row.map(quoteCsv).join(",")).join("\n");
    const link = document.createElement("a");
    link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(
      `\uFEFF${csv}`
    )}`;
    link.download = "tarefas_teams.csv";
    link.click();
  };

  const navItems = [
    { key: "all", label: "Todas", count: counts.all },
    { key: "todo", label: "Por fazer", count: counts.todo, dot: "d-todo" },
    {
      key: "doing",
      label: "Em progresso",
      count: counts.doing,
      dot: "d-doing",
    },
    {
      key: "blocked",
      label: "Bloqueadas",
      count: counts.blocked,
      dot: "d-blocked",
    },
    { key: "done", label: "Concluidas", count: counts.done, dot: "d-done" },
  ] satisfies Array<{
    key: TaskFilter;
    label: string;
    count: number;
    dot?: string;
  }>;

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="app-logo">
          <div className="logo-icon">
            <span />
            <span />
            <span />
            <span />
          </div>
          <div>
            <div className="app-title">Tarefas</div>
            <div className="app-sub">Teams - Keycloak</div>
          </div>
        </div>

        <div className="user-panel">
          <div>
            <strong>
              {auth.profile?.name || auth.profile?.preferred_username}
            </strong>
            <span>{auth.profile?.email || "Tarefas pessoais"}</span>
          </div>
          <button className="ia" title="Sair" onClick={auth.logout}>
            <LogOut size={14} />
          </button>
        </div>

        <div className="sidebar-label">Estado</div>
        {navItems.map((item) => (
          <button
            className={`nav-item ${filter === item.key ? "active" : ""}`}
            key={item.key}
            onClick={() => dispatch(setFilter(item.key))}
          >
            <span className="nav-label">
              {item.dot && <span className={`nav-dot ${item.dot}`} />}
              {item.label}
            </span>
            <span className="nav-count">{item.count}</span>
          </button>
        ))}

        <div className="sidebar-label priority-label">Prioridade</div>
        <button
          className={`nav-item ${filter === "prio-alta" ? "active" : ""}`}
          onClick={() => dispatch(setFilter("prio-alta"))}
        >
          <span className="nav-label">
            <span className="prio-dot red" />
            Alta
          </span>
          <span className="nav-count">{counts.alta}</span>
        </button>
        <button
          className={`nav-item ${filter === "prio-media" ? "active" : ""}`}
          onClick={() => dispatch(setFilter("prio-media"))}
        >
          <span className="nav-label">
            <span className="prio-dot yellow" />
            Media
          </span>
          <span className="nav-count">{counts.media}</span>
        </button>
      </aside>

      <main className="main">
        <header className="page-header">
          <div>
            <h1 className="page-title">{FILTER_TITLES[filter] || "Tarefas"}</h1>
            <p className="page-sub">Tarefas recebidas pelo Teams</p>
          </div>
          <div className="header-actions">
            <button className="btn" onClick={exportCSV}>
              <Download size={15} />
              Exportar CSV
            </button>
          </div>
        </header>

        <section className="stats" aria-label="Resumo">
          {stats.map((stat) => (
            <article className="stat-card" key={stat.label}>
              <div className="stat-num">{stat.num}</div>
              <div className="stat-label">{stat.label}</div>
              <div className="stat-bar">
                <div
                  className="stat-fill"
                  style={{ width: `${stat.pct}%`, background: stat.fill }}
                />
              </div>
            </article>
          ))}
        </section>

        <div className="toolbar">
          <label className="search-wrap">
            <Search size={14} />
            <input
              className="search-input"
              placeholder="Pesquisar tarefas..."
              value={search}
              onChange={(event) => dispatch(setSearch(event.target.value))}
            />
          </label>
          <select
            className="sort-select"
            value={sort}
            onChange={(event) =>
              dispatch(setSort(event.target.value as TaskSort))
            }
          >
            <option value="date">Ordenar: Data</option>
            <option value="prio">Ordenar: Prioridade</option>
            <option value="who">Ordenar: Pessoa</option>
            <option value="status">Ordenar: Estado</option>
          </select>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th className="status-col">Estado</th>
                <th>Tarefa</th>
                <th className="who-col">Para quem</th>
                <th className="date-col">Data</th>
                <th className="prio-col">Prioridade</th>
                <th className="actions-col" />
              </tr>
            </thead>
            <tbody>
              {visibleTasks.length ? (
                visibleTasks.map((task) => {
                  const status = STATUS[task.status] || STATUS.todo;
                  return (
                    <tr
                      className={task.status === "done" ? "done-row" : ""}
                      key={task.id}
                    >
                      <td>
                        <span className={`badge ${status.badge}`}>
                          <span className={`badge-dot ${status.dot}`} />
                          {status.label}
                        </span>
                      </td>
                      <td>
                        <div className="task-name">{task.task}</div>
                        {task.note && (
                          <div className="task-note">{task.note}</div>
                        )}
                      </td>
                      <td className="muted-cell">{task.who || "-"}</td>
                      <td>
                        <span className={dateClass(task.day)}>
                          {fmtDate(task.day)}
                        </span>
                      </td>
                      <td>
                        <span className={`prio ${prioClass(task.prio)}`}>
                          {task.prio || "-"}
                        </span>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            className="ia check"
                            title="Concluir / Reabrir"
                            onClick={() => dispatch(toggleDone(task.id))}
                          >
                            <Check size={14} />
                          </button>
                          <button
                            className="ia"
                            title="Editar"
                            onClick={() => setEditing(task)}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            className="ia del"
                            title="Apagar"
                            onClick={() => {
                              if (window.confirm("Apagar esta tarefa?")) {
                                dispatch(deleteTask(task.id));
                              }
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6}>
                    <div className="empty">
                      <div className="empty-icon">--</div>
                      <div className="empty-text">Sem tarefas aqui</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="add-row">
                <td colSpan={6}>
                  <div className="add-row-inner">
                    <TaskFields
                      task={newTask}
                      onChange={setNewTask}
                      onEnter={addNewTask}
                      compact
                    />
                    <button className="btn btn-add" onClick={addNewTask}>
                      + Adicionar
                    </button>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </main>

      {editing && (
        <div
          className="overlay"
          onMouseDown={(event) =>
            event.target === event.currentTarget && setEditing(null)
          }
        >
          <div className="modal">
            <h2 className="modal-title">Editar tarefa</h2>
            <TaskFields task={editing} onChange={setEditing} />
            <div className="modal-footer">
              <button className="btn" onClick={() => setEditing(null)}>
                Cancelar
              </button>
              <button className="btn btn-add" onClick={saveEdit}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface TaskFieldsProps<T extends NewTask | Task> {
  compact?: boolean;
  onChange: (task: T) => void;
  onEnter?: () => void;
  task: T;
}

function TaskFields<T extends NewTask | Task>({
  compact = false,
  onChange,
  onEnter,
  task,
}: TaskFieldsProps<T>) {
  const update = <K extends keyof T>(field: K, value: T[K]) =>
    onChange({ ...task, [field]: value });

  if (compact) {
    return (
      <>
        <select
          className="field field-sel"
          value={task.status}
          onChange={(event) =>
            update("status", event.target.value as T["status"])
          }
        >
          <option value="todo">Por fazer</option>
          <option value="doing">Em progresso</option>
          <option value="blocked">Bloqueada</option>
          <option value="done">Concluida</option>
        </select>
        <input
          className="field field-task"
          placeholder="O que fazer..."
          value={task.task}
          onChange={(event) => update("task", event.target.value as T["task"])}
          onKeyDown={(event) => event.key === "Enter" && onEnter?.()}
        />
        <input
          className="field field-who"
          placeholder="Para quem"
          value={task.who}
          onChange={(event) => update("who", event.target.value as T["who"])}
        />
        <input
          className="field field-day"
          type="date"
          value={task.day}
          onChange={(event) => update("day", event.target.value as T["day"])}
        />
        <PrioritySelect
          className="field field-prio"
          value={task.prio}
          onChange={(value) => update("prio", value as T["prio"])}
        />
        <input
          className="field field-note"
          placeholder="Notas..."
          value={task.note}
          onChange={(event) => update("note", event.target.value as T["note"])}
        />
      </>
    );
  }

  return (
    <>
      <label className="form-group">
        <span className="form-label">O que fazer</span>
        <input
          className="form-input"
          placeholder="Descricao da tarefa..."
          value={task.task}
          onChange={(event) => update("task", event.target.value)}
        />
      </label>
      <div className="form-row-2">
        <label className="form-group">
          <span className="form-label">Estado</span>
          <select
            className="form-input"
            value={task.status}
            onChange={(event) =>
              update("status", event.target.value as T["status"])
            }
          >
            <option value="todo">Por fazer</option>
            <option value="doing">Em progresso</option>
            <option value="blocked">Bloqueada</option>
            <option value="done">Concluida</option>
          </select>
        </label>
        <label className="form-group">
          <span className="form-label">Prioridade</span>
          <PrioritySelect
            className="form-input"
            value={task.prio}
            onChange={(value) => update("prio", value)}
          />
        </label>
      </div>
      <div className="form-row-2">
        <label className="form-group">
          <span className="form-label">Para quem</span>
          <input
            className="form-input"
            placeholder="Nome ou equipa"
            value={task.who}
            onChange={(event) => update("who", event.target.value)}
          />
        </label>
        <label className="form-group">
          <span className="form-label">Data</span>
          <input
            className="form-input"
            type="date"
            value={task.day}
            onChange={(event) => update("day", event.target.value)}
          />
        </label>
      </div>
      <label className="form-group">
        <span className="form-label">Notas</span>
        <textarea
          className="form-input"
          placeholder="Detalhes adicionais..."
          value={task.note}
          onChange={(event) => update("note", event.target.value)}
        />
      </label>
    </>
  );
}

function PrioritySelect({
  className,
  onChange,
  value,
}: {
  className: string;
  onChange: (value: TaskPriority) => void;
  value: TaskPriority;
}) {
  return (
    <select
      className={className}
      value={value}
      onChange={(event) => onChange(event.target.value as Task["prio"])}
    >
      <option value="">Prioridade</option>
      <option value="Alta">Alta</option>
      <option value="Media">Media</option>
      <option value="Baixa">Baixa</option>
    </select>
  );
}

export default App;
