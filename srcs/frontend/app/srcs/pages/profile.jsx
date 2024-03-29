import ftReact		from "../ft_react";
import { apiClient } from "../api/api_client";
import BarLayout from "../components/barlayout";
import { C_PROFILE_HEADER, C_PROFILE_USERNAME } from "../conf/content_en";
import Alert from "../components/alert";
import DeleteIcon from "../components/delete_icon";
import EditIcon from "../components/edit_icon";

const ProfileCard = (props) => {
	const [img, setImg] = ftReact.useState(props.data.avatar.replace("data", "data:").replace("base64", ";base64,"));
	const updateMe = async () => {
		apiClient.post("/users/me", {"avatar": img});
	}
	return (
		<div className="card" style="width: 18rem;">
			<div className="card-body">
				<h5 className="card-title">{C_PROFILE_HEADER}</h5>
			</div>
			<ul className="list-group list-group-flush">
				<li className="list-group-item">
					<form
						onSubmit={(event)=>{
							event.preventDefault();
							console.log(event);
							updateMe();
						}}
						className="d-flex flex-column gap-3"
					>
						<div>
							<img
								width={"90%"}
								style={{objectFit: 'cover', borderRadius: '100%', aspectRatio: '1 / 1'}}
								src={img}
								className="img-thumbnail"
							/>
						<span
							className="btn translate-middle rounded-pill position-absolute badge rounded-circle bg-primary"
							style={{
								overflow: "hidden",
								top: "75%",
								left: "75%",
							}}
						>
							<EditIcon/>
							<input
								style={{
									position: "absolute",
									top: 0,
									right: 0,
									minWidth: "100%",
									minHeight: "100%",
									filter: "alpha(opacity=0)",
									opacity: 0,
									outline: "none",
									cursor: "inherit",
									display: "block",
								}}
								className="input-control"
								type="file"
								id="imageInput"
								accept="image/*"
								onChange={(event)=>{
									const file = event.target.files[0];
    								if (file) {
										const reader = new FileReader();
    								    reader.onload = function(readerEvent) {
											const base64 = readerEvent.target.result;
											setImg(base64);
											console.log(base64);
											console.log(props.data.avatar.replace('dataimage/jpegbase64', "data:image/jpeg;base64,"))
    								    };
    								    reader.readAsDataURL(file);
    								}
								}}
							/>
						</span>
						</div>
						<button type="submit" className="btn btn-outline-primary">Save</button>
					</form>
				</li>
				<li className="list-group-item">{C_PROFILE_USERNAME}: {props.data.username}</li>
			</ul>
		</div>
	);
}

const Profile = (props) => {
	const [me, setMe] = ftReact.useState(null);
	const [error, setError] = ftReact.useState("");
	const getMe = async () => {
		const data = await apiClient.get("/users/me");
		if (data.error)
			setError(data.error)
		else if (data && !me)
			setMe(data);
	};
	if (!me && !error)
		getMe();
	//ftReact.useEffect(()=>{
	//	if (!me && !error)
	//		getMe();
	//},[]);
	return (
		<BarLayout route={props.route}>
			{
				me
					? <ProfileCard data={me}/>
					: error
						? <Alert msg={error}/>
						: (
							<div className="spinner-grow" role="status">
								<span className="visually-hidden">Loading...</span>
				  			</div>
						)
			}
		</BarLayout>
	);
}

export default Profile;