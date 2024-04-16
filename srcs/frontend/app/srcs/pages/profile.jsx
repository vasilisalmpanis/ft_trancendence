import ftReact									from "../ft_react";
import { apiClient }							from "../api/api_client";
import BarLayout								from "../components/barlayout";
import { C_PROFILE_HEADER, C_PROFILE_USERNAME } from "../conf/content_en";
import Alert									from "../components/alert";
import DeleteIcon								from "../components/delete_icon";
import EditIcon									from "../components/edit_icon";
import Avatar									from "../components/avatar";
import StatsLayout								from "../components/statslayout";

const ProfileCard = (props) => {
	const [img, setImg] = ftReact.useState(props.data.avatar);
	const updateMe = async () => {
		if (img && img instanceof Blob) {
			console.log("update");
			const reader = new FileReader();
    		reader.onload = async function(readerEvent) {
				const base64 = readerEvent.target.result;
				const resp = await apiClient.post("/users/me", {"avatar": base64});
				if (resp.error)
					console.log(error);
				else
					localStorage.setItem("me", JSON.stringify(resp));
    		};
			reader.readAsDataURL(img);
		}
	}
	return (
		<div className="card justify-content-center" style="width: 18rem;">
			<ul className="list-group list-group-flush">
				<li className="list-group-item">
					<form
						onSubmit={(event)=>{
							event.preventDefault();
							updateMe();
						}}
						className="d-flex flex-column gap-3"
					>
						<div>
						<Avatar img={img}/>
						<h5 className="">{props.data.username}</h5>
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
    								if (event.target.files[0]) {
										setImg(event.target.files[0]);
    								}
								}}
							/>
						</span>
						</div>
						<button type="submit" className="btn btn-outline-primary">Save</button>
					</form>
				</li>
			</ul>
		</div>
	);
}

const IncomingRequests = (props) => {
	return (
		<div className="card" style="width: 20rem;">
			<ul className="list-group list-group-flush">
				<li className="list-group-item">
					<h5 className="card-title">Friend Requests</h5>
				</li>
				{
					props.data.map((request, i) => {
						return (
							<FriendRequestLayout request={request} i={i} setter={props.setter} data={props.data}/>
						);
					})
				}
			</ul>
		</div>
	);

}

const FriendRequestLayout = (props) => {
	const acceptRequest = async () => {
		const data = await apiClient.post(`/friendrequests/accept`, {request_id: props.request.id});
		if (data.error)
			console.log(data.error);
		else {
			props.setter(null);
		}
	};

	const declineRequest = async () => {
		const data = await apiClient.post(`/friendrequests/decline`, {request_id: props.request.id});
		if (data.error)
			console.log(data.error);
		else {
			props.setter(props.data.filter((request) => request.id !== props.request.id));
		}
	};
	return (
		<li key={props.i} className="list-group-item d-flex">
				<div className="d-flex flex-row gap-2 my-2 my-lg-0">
					<h5>From:</h5>
					<h5 className="">{props.request.receiver.username}</h5>
					<button className="btn btn-success mx-auto" onClick={acceptRequest}>Accept</button>
					<button className="btn btn-danger mx-auto" onClick={declineRequest}>Decline</button>
				</div>
		</li>
	)
}

const Profile = (props) => {
	const me = JSON.parse(localStorage.getItem("me"));
	const [myStats, setMyStats] = ftReact.useState(null);
	const [incomingRequests, setIncomingRequests] = ftReact.useState(null);
	const [error, setError] = ftReact.useState("");
	const getMyStats = async () => {
		const data = await apiClient.get(`/users/${me.id}/stats`);
		if (data.error)
			setError(data.error);
		else if (data && !myStats)
			setMyStats(data);
	}
	const getIncomingRequests = async () => {
		const data = await apiClient.get(`/friendrequests/incoming`);
		if (data.error)
			setError(data.error);
		else if (data && !incomingRequests)
			setIncomingRequests(data);
	}
	if (me && !myStats && !error)
		getMyStats();
	if (me && !incomingRequests && !error)
		getIncomingRequests();
	return (
		<BarLayout route={props.route}>
			{
				me && myStats && incomingRequests
					? 	<div className="d-flex gap-5">
							<div>
								<ProfileCard data={me}/>
							</div>
							<div>
								<StatsLayout data={myStats}/>
							</div>

							<div>
								{/* <IncomingRequests data={incomingRequests} setter={setIncomingRequests}/> */}
							</div>
						</div>
					: 	<button className="spinner-grow" role="status"></button>
			}
		</BarLayout>
	);
}

export default Profile;
