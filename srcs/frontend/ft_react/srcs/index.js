let hookIndex = null;
let nextUnitOfWork = null;
let currentRoot = null;
let deletions = [];


class FiberNode {
	/**
	 * 
	 * @param {string} type 
	 * @param {object} props 
	*/
	constructor(type, props) {
		this.type = type;		// string: "TEXT_ELEMENT", "function"
		this.props = props;		// {children: FiberNode[], ...} - params of HTML element in case of HTML node.
		/** @type {FiberNode | null} */
		this.child = null;		// FiberNode
		/** @type {FiberNode | null} */
		this.sibling = null;	// FiberNode
		/** @type {FiberNode | null} */
		this.parent = null;		// FiberNode
		/** @type {FiberNode | null} */
		this.alternate = null;	// FiberNode (from previously rendered tree)
		/** @type {HTMLElement | null} */
		this.dom = null;		// HTMLElement | Text
		/** @type {string | null} */
		this.effectTag = null;	// string: "PLACEMENT", "UPDATE", "DELETION"
		this.hooks = [];		// 
	}
}

let vDom = new FiberNode("", {});
let vRoot = new FiberNode("", {});

/**
 * @param {string} type
 * @param {object} props
 * @param {Array.<FiberNode>} children
 * @returns {FiberNode}
*/
const createElement = (type, props, ...children) => {
	return new FiberNode(
		type,
		{
			...props,
			children: children.map(child =>
				typeof child === "object"
					? child
					: new FiberNode(
						"TEXT_ELEMENT",
						{
							nodeValue: child,
							children: [],
						}	
					)
			),
		},
	);
};

const isEvent = key => key.startsWith("on");
const isProperty = key => key !== "children" && !isEvent(key);
const isNew = (prev, next) => key => prev[key] !== next[key];
const isGone = (prev, next) => key => !(key in next);

const updateDom = (dom, prevProps, nextProps) => {
	//Remove old or changed event listeners
	Object.keys(prevProps)
		.filter(isEvent)
		.filter(
			key =>
				!(key in nextProps) ||
				isNew(prevProps, nextProps)(key)
		)
		.forEach(name => {
			const eventType = name
				.toLowerCase()
				.substring(2);
			dom.removeEventListener(
				eventType,
				prevProps[name]
			);
		});

	// Remove old properties
	Object.keys(prevProps)
		.filter(isProperty)
		.filter(isGone(prevProps, nextProps))
		.forEach(name => {
			dom[name] = "";
		});

	// Set new or changed properties
	Object.keys(nextProps)
		.filter(isProperty)
		.filter(isNew(prevProps, nextProps))
		.forEach(name => {
			dom[name] = nextProps[name];
		});

	// Add event listeners
	Object.keys(nextProps)
		.filter(isEvent)
		.filter(isNew(prevProps, nextProps))
		.forEach(name => {
			const eventType = name
				.toLowerCase()
				.substring(2);
			dom.addEventListener(
				eventType,
				nextProps[name]
			);
		});
};

/**
 * Creates DOM from Fiber.
 * @param {FiberNode} fiber - fiber.
 * @returns {HTMLElement}
 */
const createDom = (fiber) => {
	const dom =
		fiber.type == "TEXT_ELEMENT"
			? document.createTextNode("")
			: document.createElement(fiber.type);

	updateDom(dom, {}, fiber.props);

	return dom;
};

const commitDeletion = (fiber, domParent) => {
	if (fiber.dom) {
		domParent.removeChild(fiber.dom);
	} else {
		commitDeletion(fiber.child, domParent);
	}
};

const commitWork = (fiber) => {
	if (!fiber) {
		return;
	}

	let domParentFiber = fiber.parent;
	while (!domParentFiber.dom) {
		domParentFiber = domParentFiber.parent;
	}
	const domParent = domParentFiber.dom;

	if (
		fiber.effectTag === "PLACEMENT" &&
		fiber.dom != null
	) {
		domParent.appendChild(fiber.dom);
	} else if (
		fiber.effectTag === "UPDATE" &&
		fiber.dom != null
	) {
		updateDom(
			fiber.dom,
			fiber.alternate.props,
			fiber.props
		);
	} else if (fiber.effectTag === "DELETION") {
		commitDeletion(fiber, domParent);
	}

	commitWork(fiber.child);
	commitWork(fiber.sibling);
};

const commitRoot = () => {
	deletions.forEach(commitWork);
	commitWork(vRoot.child);
	currentRoot = vRoot;
	vRoot = null;
};

const reconcileChildren = (vDom, elements) => {
	let index = 0;
	let oldFiber =
		vDom.alternate && vDom.alternate.child;
	let prevSibling = null;

	while (index < elements.length || oldFiber != null) {
		const element = elements[index];
		let newFiber = null;

		const sameType =
			oldFiber &&
			element &&
			element.type == oldFiber.type;

		if (sameType) {
			newFiber = new FiberNode(oldFiber.type, element.props);
			newFiber.dom = oldFiber.dom;
			newFiber.parent = vDom;
			newFiber.alternate = oldFiber;
			newFiber.effectTag = "UPDATE";
			//newFiber = {
			//	type: oldFiber.type,
			//	props: element.props,
			//	dom: oldFiber.dom,
			//	parent: vDom,
			//	alternate: oldFiber,
			//	effectTag: "UPDATE",
			//};
		}
		if (element && !sameType) {
			newFiber = new FiberNode(element.type, element.props);
			newFiber.dom = null;
			newFiber.parent = vDom;
			newFiber.alternate = null;
			newFiber.effectTag = "PLACEMENT";
			//newFiber = {
			//	type: element.type,
			//	props: element.props,
			//	dom: null,
			//	parent: vDom,
			//	alternate: null,
			//	effectTag: "PLACEMENT",
			//};
		}
		if (oldFiber && !sameType) {
			oldFiber.effectTag = "DELETION";
			deletions.push(oldFiber);
		}

		if (oldFiber) {
			oldFiber = oldFiber.sibling;
		}

		if (index === 0) {
			vDom.child = newFiber;
		} else if (element) {
			prevSibling.sibling = newFiber;
		}

		prevSibling = newFiber;
		index++;
	}
};

const updateHostComponent = (fiber) => {
	if (!fiber.dom) {
		fiber.dom = createDom(fiber);
	}
	reconcileChildren(fiber, fiber.props.children);
};

const updateFunctionComponent = (fiber) => {
	vDom = fiber;
	hookIndex = 0;
	vDom.hooks = [];
	const children = [fiber.type(fiber.props)];
	reconcileChildren(fiber, children);
};

const performUnitOfWork = (fiber) => {
	console.log(fiber);
	const isFunctionComponent = fiber.type instanceof Function;
	if (isFunctionComponent) {
		updateFunctionComponent(fiber);
	} else {
		updateHostComponent(fiber);
	}
	if (fiber.child) {
		return fiber.child;
	}
	let nextFiber = fiber;
	while (nextFiber) {
		if (nextFiber.sibling) {
			return nextFiber.sibling;
		}
		nextFiber = nextFiber.parent;
	}
};

const workLoop = (deadline) => {

	let shouldYield = false;
	while (nextUnitOfWork && !shouldYield) {
		nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
		shouldYield = deadline.timeRemaining() < 1;
	}

	if (!nextUnitOfWork && vRoot) {
		commitRoot();
	}

	requestIdleCallback(workLoop);
};

/**
 * 
 * @param {FiberNode} element 
 * @param {HTMLElement} container 
 */
const render = (element, container) => {
	vRoot = new FiberNode("", {children: [element]});
	vRoot.dom = container;
	vRoot.alternate = currentRoot; 
	//vRoot = {
	//	dom: container,
	//	props: {
	//		children: [element],
	//	},
	//	alternate: currentRoot,
	//};
	deletions = [];
	nextUnitOfWork = vRoot;
};

const useState = (initial) => {
	const oldHook =
		vDom.alternate &&
		vDom.alternate.hooks &&
		vDom.alternate.hooks[hookIndex];
	const hook = {
		state: oldHook ? oldHook.state : initial,
		queue: [],
	};

	const actions = oldHook ? oldHook.queue : [];
	actions.forEach(action => {
		hook.state = action(hook.state);
	});

	const setState = action => {
		console.log("Set state", vDom, currentRoot);
		hook.queue.push(action);
		vRoot = new FiberNode("", currentRoot.props);
		vRoot.dom = currentRoot.dom;
		vRoot.alternate = currentRoot;
		//vRoot = {
		//	dom: currentRoot.dom,
		//	props: currentRoot.props,
		//	alternate: currentRoot,
		//};
		nextUnitOfWork = vRoot;
		deletions = [];
	};

	vDom.hooks.push(hook);
	hookIndex++;
	return [hook.state, setState];
};

requestIdleCallback(workLoop);

const ftReact = {
	createElement,
	render,
	useState,
};

export default ftReact;