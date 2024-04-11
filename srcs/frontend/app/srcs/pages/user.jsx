import ftReact      from "../ft_react";
import BarLayout    from "../components/barlayout.jsx";
import Avatar       from "../components/avatar.jsx";
import StatsLayout  from "../components/statslayout.jsx";
import { apiClient }    from "../api/api_client.js";

const ProfileCard = (props) => {
    const [img, setImg] = ftReact.useState(props.data.avatar);
    return (
        <div className="card" style={{ width: "18rem" }}>
            <ul className="list-group list-group-flush">
                <li className="list-group-item">
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            updateMe();
                        }}
                        className="d-flex flex-column gap-3"
                    >
                        <div> {/* Add this line */}
                            <Avatar img={img} />
                            <h5 className="pt-3">{props.data.username}</h5> {/* Add ms-3 class */}
                        </div>
                    </form>
                </li>
            </ul>
        </div>
    );
}

const User = (props) => {
    const [stats, setStats] = ftReact.useState(null);
    const [error, setError] = ftReact.useState("");
    let user = window.history.state;
    if (user === null || user === undefined)
        user = JSON.parse(localStorage.getItem("me"));
    const getStats = async () => {
        const data = await apiClient.get(`/users/${user.id}/stats`);
        if (data.error)
            setError(data.error);
        else if (data && !stats)
            setStats(data);
    }
    if (!stats)
        getStats();
    return (
        <BarLayout route={props.route}>
            { stats
            ?
            <div className="d-flex">
                <ProfileCard data={user}/>
                <StatsLayout data={stats}/>
            </div>
            : 'Loading' }
        </BarLayout>
    );
}

export default User;
