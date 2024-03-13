import ftReact from "./ft_react";

const useRouter = () => {
	const [path, setPath] = ftReact.useState(location.pathname);
	window.onpopstate = (ev) => console.log(ev);
	const route = (newPath) => {
		if (newPath !== window.location.pathname) {
			window.history.pushState(null, '', newPath);
			setPath(newPath);
		}
		
	};
	const onPopState = () => setPath(window.location.pathname);
	const startListening = () => window.addEventListener('popstate', onPopState);
	const stopListening = () => window.removeEventListener('popstate', onPopState);
	return [path, route, startListening, stopListening];
}

export const Route = (props) => {
	const el = props.element
	el.props.route = props.route;
	return el;
}

const RouterIn = (props) => {
	const [path, route, startListening] = useRouter();
	startListening();
	let child = props.routes.find(route => route.props.path && route.props.path === path) || null;
	if (child && child.props && child.props.element)
		child = child.props.element
	else
		child = <span>{`Route ${path} not found!`}</span>;
	console.log("Route: ", child, props);
	child.props.route = route;
	return child;
}

export const Router = (props) => {
	const routes = props.children.filter(ch=>ch.props.path);
	return (
		<RouterIn routes={routes}>
			{props.children}
		</RouterIn>
	);
};

export default Router;
