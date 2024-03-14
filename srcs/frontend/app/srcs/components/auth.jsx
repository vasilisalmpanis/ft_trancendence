import ftReact			from "../ft_react";
import {apiClient}		from "../api/api_client";

const Auth = (props) => {
	let children = <span>You shall not pass!</span>;
	console.log("auth:", apiClient.authorized());
	if (apiClient.authorized())
		children = props.children;
	else
		props.route("/login");
	return children;
}

export default Auth;