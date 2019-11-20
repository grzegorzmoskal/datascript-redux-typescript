import ds from "datascript"
import { v4 } from "uuid"
import { createAction } from "./utils/actions"
import { toDatums, find, DPath, transact } from "./datalog"

const Todo = (text: string): Todo => ({ text, completed: false, uuid: v4(), createdAt: new Date().getTime() })

export const actions = {
    addTodo: (text: string) => createAction("addTodo", text),
    toggleTodo: (todo: Todo) => createAction("toggleTodo", todo)
}

export type Actions = ReturnType<typeof actions[keyof typeof actions]>

export const addTodoCmd = (db: DatascriptDB, text: string) => {
    const datums = toDatums("todo", Todo(text)).map(d => [":db/add", -1, d.a, d.v])
    return transact(db, datums)
}

export const toggleTodoCmd = (db: DatascriptDB, todo: Todo) => {
    const res = find<Todo, [string]>(db)(["eid"], [[{ "?": "eid" }, DPath("todo", "uuid"), todo.uuid]])
    const datums = [[":db/add", res[0][0], DPath("todo", "completed"), !todo.completed]]
    return transact(db, datums)
}

export const getTodosCmd = (db: DatascriptDB): Todo[] => {
    const res = find<Todo, [string, number, string, boolean]>(db)(
        ["uuid", "createdAt", "text", "completed"],
        [
            [{ "?": "eid" }, DPath("todo", "uuid"), { "?": "uuid" }],
            [{ "?": "eid" }, DPath("todo", "createdAt"), { "?": "createdAt" }],
            [{ "?": "eid" }, DPath("todo", "text"), { "?": "text" }],
            [{ "?": "eid" }, DPath("todo", "completed"), { "?": "completed" }]
        ]
    )
    return res.map(([uuid, createdAt, text, completed]) => ({ uuid, createdAt, text, completed }))
}

export const initialState = ds.empty_db()
export const reducer = (db: DatascriptDB, action: Actions): DatascriptDB => {
    switch (action.type) {
        case "addTodo":
            return addTodoCmd(db, action.payload)

        case "toggleTodo":
            return toggleTodoCmd(db, action.payload)
    }
    return db
}
