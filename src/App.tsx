/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useState } from 'react';
import {
  addTodo,
  deleteTodo,
  getTodos,
  updateTodo,
  USER_ID,
} from './api/todos';
import { Todo } from './types/Todo';
import { UserWarning } from './UserWarning';
import classNames from 'classnames';

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState('');
  const [newTodo, setNewTodo] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loader, setLoader] = useState<number | null>();

  const handleErrorMessage = (message: string) => {
    setErrorMessage(message);
    setTimeout(() => {
      setErrorMessage('');
    }, 3000);
  };

  useEffect(() => {
    getTodos()
      .then(response => {
        setTodos(response);
        setErrorMessage('');
      })
      .catch(() => {
        handleErrorMessage('Unable to load todos');
      });
  }, []);

  function getFilterTodos(todoForFilter: Todo[], forFilter: string): Todo[] {
    if (forFilter === 'active') {
      return todoForFilter.filter(todo => todo.completed === false);
    }

    if (forFilter === 'completed') {
      return todoForFilter.filter(todo => todo.completed === true);
    }

    return todoForFilter;
  }

  const filteredTodos = getFilterTodos(todos, filter);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!newTodo.trim()) {
      setErrorMessage('Title should not be empty');

      return;
    }

    const newTodoItem = {
      title: newTodo,
      userId: USER_ID,
      completed: false,
    };

    addTodo(newTodoItem)
      .then(addedTodo => {
        setTodos(currentTodos => [...currentTodos, addedTodo]);
        setNewTodo('');
        setErrorMessage('');
      })
      .catch(() => handleErrorMessage('Unable to add a todo'));
  };

  const handleDelete = (id: number) => {
    setLoader(id);
    deleteTodo(id)
      .then(() => {
        setTodos(currentTodo => currentTodo.filter(todo => todo.id !== id));
        setErrorMessage('');
      })
      .catch(() => {
        handleErrorMessage('Unable to delete a todo');
      })
      .finally(() => {
        setLoader(null);
      });
  };

  function handleClearCompleted() {
    const completedTodos = todos.filter(todo => todo.completed);

    completedTodos.forEach(todo =>
      deleteTodo(todo.id).then(() => {
        setTodos(currentTodos => currentTodos.filter(t => !t.completed));
      }),
    );
  }

  const handleUpdate = (id: number, completed: boolean) => {
    setLoader(id);
    const updatedCompleted = !completed;

    updateTodo({ id, completed: updatedCompleted })
      .then(updatedTodo => {
        setTodos(prevTodos =>
          prevTodos.map(t =>
            t.id === updatedTodo.id ? { ...t, completed: updatedCompleted } : t,
          ),
        );
        setErrorMessage('');
      })
      .catch(() => {
        handleErrorMessage('Unable to update a todo');
      })
      .finally(() => {
        setLoader(null);
      });
  };

  if (!USER_ID) {
    return <UserWarning />;
  }

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <header className="todoapp__header">
          {/* this button should have `active` class only if all todos are completed */}
          <button
            type="button"
            className="todoapp__toggle-all active"
            data-cy="ToggleAllButton"
          />

          {/* Add a todo on form submit */}
          <form onSubmit={handleSubmit}>
            <input
              data-cy="NewTodoField"
              type="text"
              className="todoapp__new-todo"
              placeholder="What needs to be done?"
              value={newTodo}
              onChange={event => setNewTodo(event.target.value)}
            />
          </form>
        </header>

        <section className="todoapp__main" data-cy="TodoList">
          {filteredTodos.map(todo => (
            <div
              key={todo.id}
              data-cy="Todo"
              className={`todo ${todo.completed ? 'completed' : 'item-enter-done'}`}
            >
              <label className="todo__status-label">
                <input
                  data-cy="TodoStatus"
                  type="checkbox"
                  className="todo__status"
                  checked={todo.completed}
                  onChange={() => {
                    handleUpdate(todo.id, todo.completed);
                  }}
                />
              </label>
              <span data-cy="TodoTitle" className="todo__title">
                {todo.title}
              </span>
              <button
                type="button"
                className="todo__remove"
                data-cy="TodoDelete"
                onClick={() => {
                  handleDelete(todo.id);
                }}
              >
                ×
              </button>
              <div
                key={todo.id}
                data-cy="TodoLoader"
                className={classNames(
                  'modal',
                  'overlay',
                  loader === todo.id && 'is-active',
                )}
              >
                <div className="modal-background has-background-white-ter" />
                <div className="loader" />
                {todo.title}
              </div>
            </div>
          ))}

          {/* overlay will cover the todo while it is being deleted or updated */}
        </section>

        {/* Hide the footer if there are no todos */}
        {todos.length !== 0 && (
          <footer className="todoapp__footer" data-cy="Footer">
            <span className="todo-count" data-cy="TodosCounter">
              {[...todos].filter(todo => !todo.completed).length} items left
            </span>

            {/* Active link should have the 'selected' class */}
            <nav className="filter" data-cy="Filter">
              <a
                href="#/"
                className={classNames('filter__link', !filter && 'selected')}
                data-cy="FilterLinkAll"
                onClick={() => {
                  setFilter('');
                }}
              >
                All
              </a>

              <a
                href="#/active"
                className={classNames(
                  'filter__link',
                  filter === 'active' && 'selected',
                )}
                data-cy="FilterLinkActive"
                onClick={() => {
                  setFilter('active');
                }}
              >
                Active
              </a>

              <a
                href="#/completed"
                className={classNames(
                  'filter__link',
                  filter === 'completed' && 'selected',
                )}
                data-cy="FilterLinkCompleted"
                onClick={() => {
                  setFilter('completed');
                }}
              >
                Completed
              </a>
            </nav>

            {/* this button should be disabled if there are no completed todos */}
            <button
              type="button"
              className="todoapp__clear-completed"
              data-cy="ClearCompletedButton"
              onClick={() => {
                handleClearCompleted();
              }}
            >
              Clear completed
            </button>
          </footer>
        )}
      </div>

      {/* DON'T use conditional rendering to hide the notification */}
      {/* Add the 'hidden' class to hide the message smoothly */}

      <div
        data-cy="ErrorNotification"
        className={classNames(
          'notification',
          'is-danger',
          'is-light',
          'has-text-weight-normal',
          !errorMessage && 'hidden',
        )}
      >
        <button data-cy="HideErrorButton" type="button" className="delete" />
        {errorMessage}
      </div>
    </div>
  );
};
