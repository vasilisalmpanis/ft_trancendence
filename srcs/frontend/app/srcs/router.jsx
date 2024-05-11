import { apiClient }	from "./api/api_client";
import ftReact			from "./ft_react";

let prevEventListener = null;

const useRouter = () => {
	const [path, setPath] = ftReact.useState(location.pathname);
	const route = (newPath, state) => {
		if (newPath !== path) {
            if (!state)
                state = {};
            state.from = {path: window.location.pathname, state: window.history.state};
			window.history.pushState(state, '', newPath);
			setPath(newPath);
		}
	};
	const onPopState = (ev) => {
        setPath(window.location.pathname)
    };
	window.addEventListener('popstate', onPopState);
    if (prevEventListener)
        window.removeEventListener('popstate', prevEventListener);
    prevEventListener = onPopState;
	return [route, path, setPath];
}

export const Route = (props) => {
	props.element.props.route = props.route;
	return props.element;
}

const matchRoute = (route, path) => {
    if (route.includes('{')) {
        if (route.substr(0, route.lastIndexOf("/")) === path.substr(0, path.lastIndexOf("/"))) {
            const propertyName = route.substring(route.lastIndexOf("{") + 1, route.lastIndexOf("}"));
            const propertyValue = path.substr(path.lastIndexOf('/') + 1);
            let state = history.state;
            if (!state)
                state = {};
            state[propertyName] = propertyValue;
            window.history.pushState(state, '');
            return true;
        } else {
            return false;
        }
    } else {
        if (path.includes('?'))
            return route === path.substr(0, path.lastIndexOf('?'));
        return route === path;
    }
}

const RouterIn = (props) => {
    const [route, path, setPath] = useRouter();
    if (apiClient.route === null)
        apiClient.route = route;
    let child = props.routes.find(
        route => {
            return route.props.path && matchRoute(route.props.path, path);
        }
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
    if (child.props.path) {
        window.history.replaceState(null, '', child.props.path);
        setPath(child.props.path);
    }
    return child;
}

export const Router = (props) => {
	const routes = props.children.filter(ch=>ch.props.path);
	return (
		<RouterIn routes={routes}>
			{props.children[0].children}
		</RouterIn>
	);
};

export default Router;
