const isEvent = key => key.startsWith("on");
const isProperty = key => key !== "children" && !isEvent(key);
const isNew = (prev, next) => key => prev[key] !== next[key];
const isGone = (prev, next) => key => !(key in next);

//let states = new Map();
//let stateComponents = new Map();
//let stateId = 0;
//let stateIndex = 0;

let currentNode = null;
let stId = null;

class VNode {
	/**
	 * 
	 * @param {string | Function} type 
	 * @param {object} props 
	 * @param  {...VNode} children
	 * @returns {VNode}
	 */
	constructor(type, props) {
		this.type = type;
		this.props = props;
		if (!this.props)
			this.props = {};
		if (!this.props.children)
			this.props.children = [];
		this.dom = null;
		this.old = null;
		this.parent = null;
		this.sibling = null;
		this.effect = null;
		this.states = [];
	}

	get child() {
		return (this.props.children && this.props.children[0]) || null;
	}

	set child(val) {
		this.props.children[0] = val;
	}

	parentsSiblings() {
		if (!this.props || !this.props.children)
			return ;
		let prevSibling = null;
		let child = null;
		for (child of this.props.children) {
			child.parentsSiblings();
			child.parent = this;
			if (prevSibling)
				prevSibling.sibling = child;
			prevSibling = child;
		}
	}

	clone() {
		const clonedProps = { ...this.props, children: this.props.children.map(child => child instanceof VNode ? child.clone() : child) };
		const clonedNode = new VNode(this.type, clonedProps);
		clonedNode.dom = this.dom;
		clonedNode.states = [...this.states];
		clonedNode.parentsSiblings();
		return clonedNode;
	}

	/**
	 * @param {VNode[]} children
	 */
	reconcile(children, deletions) {
		console.log("  VNode.reconcile RECONCILE: ", this, children);
		let prevSibling = null;
		let oldNode = this.old && this.old.child;
		let i = 0;
		while (i < children.length) {
			const el = children[i];
			let newNode = null;
			let sameType = oldNode && el && oldNode.type == el.type;
			if (sameType) {
				newNode = new VNode(oldNode.type, el.props);
				newNode.dom = oldNode.dom;
				newNode.parent = this;
				newNode.old = oldNode;
				newNode.states = [...el.states];
				newNode.effect = "UPDATE";
			}
			if (el && !sameType && el.type) {
				newNode = new VNode(el.type, el.props);
				newNode.parent = this;
				newNode.states = [...el.states];
				newNode.effect = "PLACEMENT";
			}
			if (oldNode && !sameType) {
				oldNode.effect = "DELETION";
				deletions.push(oldNode);
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
			console.log("                  NEW NODE: ", newNode);
		}
	}

	commit() {
		console.log("  VNode.commit ", this);
		let domParentNode = this.parent;
		while (!domParentNode.dom) {
			domParentNode = domParentNode.parent;
		}
		const domParent = domParentNode.dom;
		if (this.effect === "PLACEMENT" && this.dom != null)
			domParent.appendChild(this.dom);
		else if (this.effect === "UPDATE" && this.dom != null)
			this.updateDom();
		else if (this.effect === "DELETION")
			this.delete(domParent);
		this.child && this.child.commit();
		this.sibling && this.sibling.commit();
		this.old = this.clone();
	}

	delete(domParent) {
		if (this.dom)
			domParent.removeChild(this.dom);
		else
			this.delete(domParent);
	}

	update(deletions) {
		console.log("  VNode.update", this);
		if (this.type instanceof Function) {
			//stateIndex = 0;
			//stateId++;
			//if (!stateComponents.has(stateId))
			//	stateComponents[stateId] = this;
			currentNode = this;
			stId = 0;
			this.props.children = [this.type(this.props)];
			this.parentsSiblings();
		}
		else if (!this.dom)
			this.createDom();
		this.reconcile(this.props.children, deletions);
	}

	createDom() {
		console.log("  VNode.createDom");
		this.dom = this.type == "TEXT_ELEMENT"
			? document.createTextNode("")
			: document.createElement(this.type);
		this.updateDom();

	}

	updateDom = () => {
		console.log("  VNode.updateDom");
		const oldProps = (this.old && this.old.props) || {};
		//Remove old or changed event listeners
		Object.keys(oldProps)
			.filter(isEvent)
			.filter(
				key =>
					!(key in this.props) ||
					isNew(oldProps, this.props)(key)
			)
			.forEach(name => {
				const eventType = name
					.toLowerCase()
					.substring(2);
				this.dom.removeEventListener(
					eventType,
					oldProps[name]
				);
			});

		// Remove old properties
		Object.keys(oldProps)
			.filter(isProperty)
			.filter(isGone(oldProps, this.props))
			.forEach(name => {
				this.dom[name] = "";
			});

		// Set new or changed properties
		Object.keys(this.props)
			.filter(isProperty)
			.filter(isNew(oldProps, this.props))
			.forEach(name => {
				this.dom[name] = this.props[name];
			});

		// Add event listeners
		Object.keys(this.props)
			.filter(isEvent)
			.filter(isNew(oldProps, this.props))
			.forEach(name => {
				const eventType = name
					.toLowerCase()
					.substring(2);
				this.dom.addEventListener(
					eventType,
					this.props[name]
				);
			});
	};
}

class FTReact {
	constructor() {
		/** @private */
		this._root = new VNode("ROOT_ELEMENT", {});
		/** @private */
		this._nextTask = null;
		/** @private */
		this._deletions = [];
		/** @private */
		this._renderLoop = this._renderLoop.bind(this);
		/** @private */
		this._newChanges = false;
	}

	/** @private */
	_change() {
		console.log("FTReact.change NEXT TASK: ", this._nextTask);
		this._nextTask.update(this._deletions);
		this._newChanges = true;
		if (this._nextTask.child) {
			this._nextTask = this._nextTask.child;
			return;
		}
		let nextFiber = this._nextTask;
		while (nextFiber) {
			if (nextFiber.sibling) {
				this._nextTask = nextFiber.sibling;
				return;
			}
			nextFiber = nextFiber.parent;
		}
		this._nextTask = null;
	}

	/** @private */
	_commit() {
		console.log("FTReact.commit");
		this._deletions.forEach(el => el.commit());
		this._root.child && this._root.child.commit();
		this._newChanges = false;
	}

	/** @private */
	_renderLoop(deadline) {
		let shouldYield = false;
		//stateId = 0;
		while (this._nextTask && !shouldYield) {
			console.log("FTReact.renderLoop", this);
			this._change();
			shouldYield = deadline.timeRemaining() < 1;
		}
		if (!this._nextTask && this._newChanges) {
			this._commit();
		}
		requestIdleCallback(this._renderLoop);
	}

	useState(initialValue) {
		console.log("useState");
		//const id = stateId;
		//const stateIdx = stateIndex;
		//if (states[id] === undefined) {
		//	states[id] = [];
		//}
		//if (states[id][stateIdx] === undefined) {
		//	states[id][stateIdx] = initialValue;
		//}
		const id = stId;
		const node = currentNode;
		if (node.states[id] === undefined)
			node.states[id] = initialValue;
		const setState = (newValue) => {
			if (newValue instanceof Function)
				node.states[id] = newValue(node.states[id]);
			else
				node.states[id] = newValue;
			this._nextTask = node;
			// states[id][stateIdx] = newValue;
			// this._changeState(id);
		};
		stId++;
		//stateIndex++;
		//return [states[id][stateIdx], setState];
		return [node.states[id], setState];
	}

	//_changeState(id) {
	//	this._nextTask = stateComponents[id];
	//	console.log("SET STATE ON: ", this._nextTask);
	//}

	/**
	 * 
	 * @param {string | Function} type 
	 * @param {object} props 
	 * @param  {...VNode | string} children
	 * @returns {VNode}
	 */
	createElement(type, props, ...children) {
		return new VNode(
			type,
			{
				...props,
				children: children.map(
					child => typeof child === "object"
						? child
						: new VNode(
							"TEXT_ELEMENT",
							{ nodeValue: child }
						)
				)
			},
		);
	}

	/**
	 * 
	 * @param {VNode} element
	 * @param {HTMLElement} container 
	 */
	render(element, container) {
		console.log("FTReact.render ", element);
		this._root.dom = container;
		this._root.props.children = [element];
		this._root.parentsSiblings();
		this._nextTask = this._root;
		requestIdleCallback(this._renderLoop);
	}
}

const ftReact = new FTReact();
export default ftReact;
