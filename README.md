# Alt Store Proxy
This module allows you to proxy alt actions through a store proxy before/while triggering actions in the real React stores.

I've found this to be a useful pattern for performing async operations (such as ajax or websocket calls) on actions in a way that still seems compatible with React and Alt architecture principles.


## How it works
You create an instance of `AltProxy` by passing an instance of your alt Actions class and the Actions class itself to the constructor. `AltProxy` will create a separate instance of alt (so essentially another dispatcher) and a separate instance of the actions tied to the new dispatcher using the Actions class. The two sets of actions can be accessed via the `realActions` and `proxyActions` properties on `AltProxy`.

You can then use the `createStoreProxy` method on `AltProxy` to create what we call a `StoreProxy`. This is a fake Alt Store that first receives Alt Actions from the React application and can perform async operations before dispatching the actions to the real application stores. `StoreProxy`s aren't real stores and as such shouldn't have a real state or be binded to actual React components.

A `StoreProxy` is essentially just a class with a constructor that takes in two alt actions instances, the proxy actions and the real actions. The store should handle the proxy actions just like a store, but should also dispatch the real actions when appropriate.


## StoreProxy Example

```javascript
let socket = io();

class SocketStoreProxy {

  constructor(proxyActions, realActions) {
    this.bindListeners({
      createTodo: proxyActions.createTodo
      deleteTodo: proxyActions.deleteTodo
    });

    socket.on('todo:save:success', realActions.createTodo);
  }

  createTodo(todo) {
    socket.emit('todo:save', todo);
  }

  deleteTodo(todoId) {
    socket.emit('todo:delete', { todoId: todoId });
    realActions.deleteTodo();
  }

}

export default SocketStoreProxy;
```

Above is a simple `StoreProxy` example for a todo app that makes socketio calls when actions are triggered.  
We can see that when a new todo is created, the store saves it to the backend first, and then triggers the real action for creating a todo when the backend returns the newly created todo. This use case for `StoreProxy`s is practical because it allows us to validate and assign a database id to our new todo on the backend before we add a to our front-end React stores.  
We can also see that when a todo is deleted, we forward the action to the real store right away and do not wait for the server response as it is less useful in this case.


## Full Example
Let's continue our example of a simple todo list app with React and Alt with the `SocketTodoStore` from above.
The full application might look something like this:

```javascript
import React from 'react';
import Alt from 'alt';
import AltProxy from 'alt-store-proxy';

import TodoApp from './TodoApp.jsx';
import SocketStoreProxy from './SocketStoreProxy';

class TodoActions {
  createTodo(todo) {
    this.dispatch(todo);
  }
}

class TodoStore {
  constructor() {
    this.bindListeners({
      createTodo: TodoActions.createTodo
    });

    this.state = {
      todos: []
    };
  }

  createTodo(todo) {
    this.setState({ todos: this.state.todos.push(todo) });
  }
}


let alt = new Alt();

let todoActions = alt.createActions(TodoActions);
let todoStore   = alt.createStore(TodoStore);

let altProxy = new AltProxy(todoActions, TodoActions);
altProxy.createStoreProxy(SocketStoreProxy);

let body = document.getElementsByTagName('body')[0];

React.render(body,
  (<TodoApp
    stores={
      { todos: todoStore }
    }
    actions={
      { TodoActions: altProxy.proxyActions }
    }>
  </TodoApp>)
);

```

Notice that the `TodoApp` component takes in the real store, but takes in the proxy actions instead of the real actions. This makes actions triggered by components go to our `SocketStoreProxy` first before being forwarded to the real React stores.



### constructor(actionsInstance, ActionsClass)
Constructor takes in an alt actions instance and an alt actions class that should be the class used to create the actions instance.


### createStoreProxy(StoreProxyClass)
Essentially creates a new alt store binded to the proxy dispatcher that takes in the proxy and real actions in the constructor and is responsible for forwarding the proxy actions to the real actions when appropriate;


## Source Code
Source code is written in es6 and is transpiled to es5 on npm publish. Default import retrieves the babel transpiled es5 version. The es6 source code can be found in `src/index.js`.
