/**
 * Naive implementation of React-like library
 */

const requestIdleCallback =
      window.requestAnimationFrame ||
      // window.requestIdleCallback ||
      function (cb) {
        var start = Date.now()
        return setTimeout(function () {
          cb({
            didTimeout: false,
            timeRemaining: function () {
              return Math.max(0, 50 - (Date.now() - start))
            },
          })
        }, 1)
  };


const isEvent = key => key.startsWith("on");
const isProperty = key => key !== "children" && !isEvent(key);
const isNew = (prev, next) => key => prev[key] !== next[key];
const isGone = (prev, next) => key => !(key in next);
const camelToCSS = (str) => str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
const objectToCSS = (obj) => Object.entries(obj)
  .map(([key, value]) => `${camelToCSS(key)}: ${value}`)
  .join('; ');

class FiberNode {
  /**
   * 
   * @param {string | Function} type 
   * @param {object} props 
   * @returns {FiberNode}
   */
  constructor(type, props) {
    this.type = type;
    this.props = props || {};
    this.props.children = this.props.children || [];
    this.dom = null;
    this.key = 0;
    this.old = null;
    this.parent = null;
    this.effect = null;
    this.states = [];
    this.effects = [];
    this.stId = 0;
  }
  get child() {
    return this.props.children && this.props.children[0] || null;
  }
  set child(val) {
    val.parent = this;
    this.props.children[0] = val;
  }
  get children() {
    return this.props && this.props.children || null;
  }
  set children(val) {
    if (!this.props) this.props = {};
    this.props.children = val;
    this.props.children.forEach((child, key) => {
      child.parent = this;
      child.key = key;
    })
  }
  get sibling() {
    return this.parent && this.parent.children && this.parent.children[this.key + 1] || null;
  }
  set sibling(val) {
    if (this.parent) {
      val.key = this.key + 1;
      val.parent = this.parent;
      this.parent.props.children[val.key] = val;
    }
  }
  get prevSibling() {
    if (this.key === 0)
      return null;
    return this.parent && this.parent.children && this.parent.children[this.key - 1] || null;
  }
  deleteFromFiber() {
    if (this.parent) {
      this.parent.children = this.parent.children.filter(val => val !== this);
      this.parent.children.forEach((val, idx) => {
        val.key = idx;
      })
    }
  }
  getNameSpace() {
    if (this.type === 'svg') {
      if ('xmlns' in this.props)
        return (this.props.xmlns);
      return null;
    }
    if (this.parent)
      return this.parent.getNameSpace();
    return null;
  }
  setKey(key) {
    this.key = key;
    return this;
  }
  parentsSiblings() {
    if (!this.children) return;
    this.children.forEach((child, idx) => {
      child.parent = this;
      child.key = idx;
      if (child instanceof FiberNode)
        child.parentsSiblings();
    });
  }
  resolveFunc(ftReact) {
    this.stId = 0;
    ftReact._currentNode = this;
    const children = this.type(this.props);
    ftReact._currentNode = null;
    this.children = Array.isArray(children) ? children : [children];
    this.parentsSiblings();
  }
  clone() {
    const clonedProps = {
      ...this.props,
      children: this.children.map(child => child instanceof FiberNode ? child.clone() : child)
    };
    const clonedNode = new FiberNode(this.type, clonedProps);
    clonedNode.dom = this.dom;
    // clonedNode.states = this.states ? structuredClone(this.states) : [];
    clonedNode.states = this.states ? [...this.states] : [];
    clonedNode.effects = this.effects ? [...this.effects] : [];
    clonedNode.key = this.key;
    clonedNode.parent = this.parent;
    return clonedNode;
  }
    /**
   * @param {FTReact} ftReact
   */
    reconcile(ftReact) {
      // this.parentsSiblings();
      let oldNode = this.old && this.old.child;
      let prevSibling = null;
      const children = this.children;
      let i = 0;
      while (i < children.length) {
        const el = children[i];
        if (!el)
          continue ;
        let newNode = null;
        let sameType = oldNode && el && oldNode.type == el.type || false;
        if (sameType) {
          newNode = new FiberNode(oldNode.type, el.props);
          newNode.dom = oldNode.dom;
          newNode.parent = this;
          newNode.old = oldNode;
          newNode.states = oldNode.states;
          newNode.effect = "UPDATE";
        }
        if (el && !sameType) {
          newNode = new FiberNode(el.type, el.props);
          newNode.parent = this;
          newNode.states = el.states;
          newNode.effect = "PLACEMENT";
        }
        if (oldNode && !sameType) {
          oldNode.effect = "DELETION";
          ftReact._deletions.push(oldNode);
        }
        if (oldNode) {
          oldNode = oldNode.sibling;
        }
        if (i === 0) {
          this.child = newNode;
        } else if (el && el.type) {
          prevSibling.sibling = newNode;
        }
        prevSibling = newNode;
        i++;
      }
      while (oldNode) {
        oldNode.effect = "DELETION";
        ftReact._deletions.push(oldNode);
        oldNode = oldNode.sibling;
      }
  }
  commit() {
    // if (this.type instanceof Function)
    //   console.log("commit", this.type.name, this.effect, "|", ...this.states || [], "|", ...this.old?.states || []);
    let domParentNode = this.parent;
    while (!domParentNode.dom) {
      domParentNode = domParentNode.parent;
    }
    const domParent = domParentNode.dom;
    if (this.effect === "PLACEMENT" && this.dom != null) {
      domParent.appendChild(this.dom);
    }
    else if (this.effect === "UPDATE" && this.dom != null) {
      this.updateDom();
    }
    else if (this.effect === "DELETION")
    {
      this.delete(domParent);
    }
    this.effect = null;
    this.child && this.child.commit();
    this.sibling && this.sibling.commit();
    this.old = this.clone();
  }
  delete(domParent) {
    if (this.effects) {
      this.effects.forEach(effect => {
          if (effect && effect.cleanup) {
            effect.cleanup();
          }
      });
    };
    if (this.dom && domParent.contains(this.dom)) {
      domParent.removeChild(this.dom);
      this.dom = null;
    } else {
      this.child && this.child.delete(domParent);
    }
    this.effect = null;
  }
  update(ftReact) {
    if (this.type instanceof Function)
      this.resolveFunc(ftReact);
    else if (!this.dom)
      this.createDom();
    this.reconcile(ftReact);
  }
  createDom() {
    if (this.type == "TEXT_ELEMENT")
      this.dom = document.createTextNode("");
    else {
      const nameSpace = this.getNameSpace();
      this.dom = nameSpace
        ? document.createElementNS(nameSpace, this.type)
        : document.createElement(this.type);
    }
    this.updateDom();
  }
  updateDom = () => {
    const oldProps = this.old && this.old.props || {};
    Object.keys(oldProps).filter(isEvent).filter(key => !(key in this.props) || isNew(oldProps, this.props)(key)).forEach(name => {
      const eventType = name.toLowerCase().substring(2);
      this.dom.removeEventListener(eventType, oldProps[name]);
    });
    Object.keys(oldProps).filter(isProperty).filter(isGone(oldProps, this.props)).forEach(name => {
      this.dom[name] = "";
    });
    Object.keys(this.props).filter(isProperty).filter(isNew(oldProps, this.props)).forEach(name => {
      if (this.getNameSpace()) {
        this.dom.setAttribute(name, this.props[name])
      } else {
        if (name === 'style' && typeof this.props[name] === 'object') {
          this.dom[name] = objectToCSS(this.props[name]);
        } else if (name === 'className') {
          this.dom[name] = this.props[name];
        } else {
          if (this.dom instanceof Element) {
            if (this.props[name] || typeof this.props[name] !== 'boolean')
              this.dom.setAttribute(name, this.props[name])
          } else {
            this.dom[name] = this.props[name];
          }
        }
      }
    });
    Object.keys(this.props).filter(isEvent).filter(isNew(oldProps, this.props)).forEach(name => {
      const eventType = name.toLowerCase().substring(2);
      this.dom.addEventListener(eventType, this.props[name]);
    });
  };
}
class FTReact {
  constructor() {
    /** @private */
    this._root = new FiberNode("ROOT_ELEMENT", {});
    /** @private */
    this._nextTask = null;
    /** @private */
    this._deletions = [];
    /** @private */
    this._renderLoop = this._renderLoop.bind(this);
    /** @private */
    this._newChanges = false;
    /** @private */
    this._currentNode = null;
    /** @private */
    this._updateQueue = [];
    /** @private */
    this._nodeBuf = null;
  }
  /** @private */
  _scheduleUpdate(component) {
    if (!this._updateQueue.includes(component)) {
      this._updateQueue.push(component);
    }
  }
  /** @private */
  async _commit() {
    this._deletions.forEach(el => el.commit());
    this._deletions = [];
    this._root.child && this._root.child.commit();
    await this._runEffects();
    this._newChanges = false;
  }
  /** @private */
  _getNextNode() {
    if (!this._nextTask)
      return ;
    if (this._nextTask.child) {
      this._nextTask = this._nextTask.child;
      return ;
    }
    while (this._nextTask) {
      if (this._nextTask.sibling) {
        this._nextTask = this._nextTask.sibling;
        return ;
      }
      this._nextTask = this._nextTask.parent;
    }
    this._nextTask = null;
  }
  /** @private */
  _setNextTask() {
    if (this._nextTask) {
      this._getNextNode();
      if (this._nextTask)
      {
        if (this._updateQueue.includes(this._nextTask))
          this._updateQueue = this._updateQueue.filter(it => it !== this._nextTask);
        return ;
      }
    }
    this._nextTask = this._updateQueue.shift() || null;
  }
  /** @private */
  _printTree(node) {
    if (!node)
      node = this._root;
    console.log(
      "T", node.type instanceof Function ? node.type.name : node.type,
      "|", ...node.states || [],
      "|", ...node?.old?.states || []
    );
    if (node.children) {
      for (let child of node.children) {
        if (child)
          this._printTree(child);
      }
    }
  }
  /** @private */
  async _renderLoop() {
  // async _renderLoop(deadline) {
    let shouldYield = false;
    if (!this._nextTask)
      this._setNextTask();
    while (this._nextTask && !shouldYield) {
      this._nextTask.update(this);
      this._newChanges = true;
      this._setNextTask();
      // should Yield = deadline.timeRemaining() < 1;
    }
    if (!this._nextTask && this._newChanges) {
      await this._commit();
      // this._root.parentsSiblings();
    }
    requestIdleCallback(this._renderLoop);
  }
  /**
   * 
   * @param {*} initialValue 
   * @returns {[*, Function]}
   */
  useState(initialValue) {
    const node = this._currentNode;
    const oldHook = node.old && node.old.states[node.stId];
    const hook = {
      state: oldHook ? oldHook.state : initialValue,
      queue: []
    };
    const actions = oldHook ? oldHook.queue : [];
    // if (node.states[node.stId]?.queue && node.states[node.stId]?.queue.length) {
    //   actions = node.states[node.stId]?.queue;
    // }
    actions.forEach(action => {
      hook.state = action instanceof Function ? action(hook.state) : action;
    });
    const setState = action => {
      node.parent.children[node.key] = node;
      hook.queue.push(action);
      // node.states.forEach(hook => {
      //   hook.queue.forEach(action => {
      //     hook.state = typeof action === 'function' ? action(hook.state) : action;
      //   });
      //   hook.queue = [];
      //   // this._scheduleUpdate(node);
      // });
      this._scheduleUpdate(node);

    };
    node.states[node.stId] = hook;
    node.stId++;
    return [hook.state, setState];
  }
  /** @private */
  async _runEffects() {
    this._nextTask = this._root;
    this._getNextNode()
    while (this._nextTask) {
      if (this._nextTask.effects) {
        for (let i = 0; i < this._nextTask.effects.length; i++) {
          const effect = this._nextTask.effects[i];
          if (!effect)
            continue;
          if (effect.hasChangedDeps) {
            if (effect.cleanup && effect.cleanup instanceof Function) {
              effect.cleanup();
            }
            effect.cleanup = await effect.callback() || null;
          }
        }
      }
      this._getNextNode();
    }
  }
  /**
   * 
   * @param {Function} callback 
   * @param {*[]} deps 
   * @returns {undefined}
   */
  useEffect(callback, deps) {
    const node = this._currentNode;
    const effectIdx = node.stId;
    const oldEffect = node.old && node.old.effects[effectIdx];
    const hasChangedDeps = oldEffect && oldEffect.deps ? !deps.every((dep, i) => Object.is(dep, oldEffect.deps[i])) : true;
    const effect = {
      cleanup: null,
      deps,
      callback,
      hasChangedDeps
    };
    if (!hasChangedDeps && oldEffect && oldEffect.cleanup) {
      effect.cleanup = oldEffect.cleanup;

    }
    node.effects[effectIdx] = effect;
    node.stId++;
  }
  /**
   * 
   * @param {string | Function} type 
   * @param {object} props 
   * @param  {...FiberNode | string} children
   * @returns {FiberNode}
   */
  createElement(type, props, ...children) {
    return type
      ? new FiberNode(type, {
          ...props,
          children: children
            .flat()
            .filter(child => child)
            .map((child, idx) =>
              typeof child === "object"
                ? child.setKey(idx)
                : new FiberNode("TEXT_ELEMENT", {
                    nodeValue: child
                  }).setKey(idx))
        })
      : null;
  }

  /**
   * 
   * @param {FiberNode} element
   * @param {HTMLElement} container 
   */
  render(element, container) {
    this._root.dom = container;
    this._root.children = [element];
    this._root.parentsSiblings();
    this._scheduleUpdate(this._root);
    requestIdleCallback(this._renderLoop);
  }
}
const ftReact = new FTReact();
export default ftReact;
