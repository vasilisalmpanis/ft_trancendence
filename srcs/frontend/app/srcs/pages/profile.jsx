import ftReact		from "../ft_react";
import { apiClient } from "../api/api_client";
import BarLayout from "../components/barlayout";
import { C_PROFILE_HEADER, C_PROFILE_USERNAME } from "../conf/content_en";

const ProfileCard = (props) => {
	return (
		<div className="card" style="width: 18rem;">
			<div className="card-body">
				<h5 className="card-title">{C_PROFILE_HEADER}</h5>
			</div>
			<ul className="list-group list-group-flush">
				<li className="list-group-item">{C_PROFILE_USERNAME}: {props.data.username}</li>
			</ul>
		</div>
	);
}

const Profile = (props) => {
	const [me, setMe] = ftReact.useState(null);
	ftReact.useEffect(()=>{
		const getMe = async () => {
			const resp = await apiClient.get("/users/me");
			const data = await resp.json();
			if (data && !me)
				setMe(data);
		};
		getMe();
	},[]);
	return (
		<BarLayout route={props.route}>
			{
				me
					? <ProfileCard data={me}/>
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