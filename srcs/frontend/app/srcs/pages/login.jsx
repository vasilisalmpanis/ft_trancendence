import ftReact		from "../ft_react";
import ApiClient	from "../api/api_client.js";

const Login = (props) => {
	const client = new ApiClient("http://localhost:8000");
	const submit = (event) => {
		event.preventDefault();
		const username = event.target[0].value;
		const password = event.target[1].value;
		client.authorize({username: username, password: password});
	};
	return (
		<form
			onSubmit={submit}
		>
			<div className="mb-3">
				<input
					placeholder={"username"}
					className="form-control"
					required
				/>
			</div>
			<div className="mb-3">
				<input
					placeholder="password"
					type="password"
					className="form-control"
					required
				/>
			</div>
			<div className="mb-3">
				<button
					type="submit"
					className="btn btn-primary w-100"
				>
					Sign In
				</button>
			</div>
		</form>
	);
};

export default Login;