import ftReact		from "../ft_react/index.js";
import ApiClient	from "../api/api_client.js";
import Layout		from "../components/layout.jsx";

const Signup = (props) => {
	const client = new ApiClient("http://localhost:8000");
	const submit = (event) => {
		event.preventDefault();
		const username = event.target[0].value;
		const password = event.target[1].value;
		const email = event.target[2].value;
		client.post("/users", {username: username, password: password, email: email}).then(resp=>{
			resp && resp.ok ? props.route("/signin") : console.log(resp);
		});

	};
	return (
		<Layout>
			<h1>Create account</h1>
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
					<input
						placeholder="email"
						type="email"
						className="form-control"
						required
					/>
				</div>
				<div className="mb-3">
					<button
						type="submit"
						className="btn btn-primary w-100"
					>
						Sign Up
					</button>
				</div>
				<div className="mb-3">
					<button
						type="submit"
						className="btn btn-primary w-100"
						onClick={()=>props.route("/signin")}
					>
						Go to Sign In
					</button>
				</div>
			</form>
		</Layout>
	);
};

export default Signup;