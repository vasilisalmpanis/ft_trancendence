import { apiClient }	from "./api/api_client";
import ftReact			from "./ft_react";

const useRouter = () => {
	const [path, setPath] = ftReact.useState(location.pathname);
    
	// window.onpopstate = (ev) => console.log(ev);
	const route = (newPath, state) => {
		if (newPath !== window.location.pathname) {
			//if (!state && window.history.state && window.history.prevState)
			//	state = window.history.state.prevState;
			//else if (!state)
			//	state = {};
			//state.prevState = state;
			window.history.pushState(state, '', newPath);
			setPath(newPath);
		}
	};
	const onPopState = () => setPath(window.location.pathname);
	const startListening =
		() => window.addEventListener('popstate', onPopState);
	const stopListening =
		() => window.removeEventListener('popstate', onPopState);
	return [path, route, startListening, stopListening];
}

export const Route = (props) => {
	props.element.props.route = props.route;
	return props.element;
}

const RouterIn = (props) => {
    const [path, route, startListening] = useRouter(props.useless_state, props.set_useless_state);
    if (apiClient.route === null)
        apiClient.route = route;
    startListening();
    let child = props.routes.find(
        route => {
            return route.props.path && path.startsWith(route.props.path)}
    ) || null;
    const login =
        props.routes.find(route => route.props.login)
        || <span>You shall not pass!</span>;
    const fallback =
        props.routes.find(route => route.props.fallback)
        || <span>No exit from here</span>;
    if (child && child.props && child.props.element) {
        if (child.props.auth)
            child = apiClient.authorized() ? { ...child.props.element, key: path } : login;
        else
            child = { ...child.props.element, key: path };
    } else {
        if (fallback.props.auth)
            child = apiClient.authorized() ? { ...fallback, key: path } : login;
        else
            child = { ...fallback, key: path };
    }
    child.props.route = route;
    if (child.props.path)
        window.history.replaceState(null, '', child.props.path);
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
