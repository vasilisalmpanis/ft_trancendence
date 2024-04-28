import ftReact		from "../ft_react/index.js";
import { apiClient }	from "../api/api_client.js";
import Layout		from "../components/layout.jsx";
import {
	C_SIGNIN_PASS,
	C_SIGNIN_USERNAME,
	C_SIGNUP_BUTTON,
	C_SIGNUP_EMAIL,
	C_SIGNUP_HEADER,
	C_SIGNUP_SIGNIN,
}					from "../conf/content_en.js";
import Alert from "../components/alert.jsx";

const TFA = (props) => {
	const [error, setError] = ftReact.useState("");
	const sendData = async (event) => {
		const tfa = event.target[0].value;
		const resp = await apiClient.post("/auth/verify", {"2fa_code": tfa});
		if (resp.error)
			setError(resp.error);
		else {
			const res = await apiClient.authorize(resp, null, true);
			if (res.ok && res.ok === 'true')
				props.route("/");
		}
	};
	return (
		<Layout>
			<h1>{"2fa"}</h1>
			<form
				onSubmit={(event)=>{
					event.preventDefault();
					sendData(event);
				}}
				className="mt-3"
			>
				<div className="mb-3">
					<input
						placeholder={"2fa code"}
						className="form-control"
						required
					/>
				</div>
				<div className="mb-3">
					<button
						type="submit"
						className="btn btn-primary w-100"
						>
						{"SEND"}
					</button>
				</div>
				{error && <Alert msg={error}/>}
				<div className="mb-3 mt-5">
					<button
						type="submit"
						className="btn btn-outline-primary w-100"
						onClick={()=>props.route("/signin")}
					>
						{C_SIGNUP_SIGNIN}
					</button>
				</div>
			</form>
		</Layout>
	);
};

export default TFA;