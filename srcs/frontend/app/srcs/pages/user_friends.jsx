import ftReact          from "../ft_react";
import BarLayout        from "../components/barlayout";
import { apiClient }    from "../api/api_client.js";
import Avatar           from "../components/avatar.jsx";
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'bootstrap/dist/js/bootstrap.bundle.js';


const UserFriendsLayout = (props) => {
    const [error, setError] = ftReact.useState(null);
    const [limit, setLimit] = ftReact.useState(10);
    const [skip, setSkip] = ftReact.useState(0);
    const [friends, setFriends] = ftReact.useState(null);
    const [user, setUser] = ftReact.useState(null);
    const me = JSON.parse(localStorage.getItem("me"));
    const id = window.history.state.id;
    const addFriend = async (user_id) => {
        const res = await apiClient.post(`/friendrequests` ,{receiver_id: user_id});
        if (res.error) {
            setError(res.error);
            return;
        }
        props.route(`/reroute?path=user-friends&id=${id}`);
    }
    const getFriends = async () => {
        let temp_user;
        if (!id) {
            setError("No user id provided");
            return;
        }
        if (!user) {
            temp_user = await apiClient.get(`/users/${id}`);
            const temp_friends = await apiClient.get(`/users/${id}/friends`, {limit: limit, skip: skip});
            if (temp_friends.error || temp_user.error) {
                setError(temp_friends.error);
                return;
            }
            setFriends(temp_friends);
            setUser(temp_user);
            setSkip(skip + limit);
        }
    };
    const updateFriends = async () => {
        const id = window.location.pathname.split("/").pop();
        if (!id) {
            setError("No user id provided");
            return;
        }
        const temp_friends = await apiClient.get(`/users/${id}/friends`, {limit: limit, skip: skip});
        if (temp_friends.error) {
            setError(temp_friends.error);
            return;
        }
        setFriends(friends.concat(temp_friends));
        setSkip(skip + limit);
    }
    if (!friends)
        getFriends();
    return (
            <BarLayout route={props.route}>
                {error && <div className="alert alert-danger">{error}</div>}
                {user && <h3>{user.username}'s Friends</h3>}
                    {friends && friends.length > 0
                    ?
                    <div className="card justify-content-center p-4">
                        {friends.map(friend => (
                            <button
                                className="btn"
                                onClick={() => props.route(`/users/${friend.id}`)}
                            >
                                <div className="d-flex gap-5 mt-0 border-bottom flex-row">
                                    <div className="d-flex align-items-baseline">
                                        <div className="py-2">
                                            <Avatar img={friend.avatar} size="50px"/>
                                        </div>
                                    <div className="px-5">
                                            <span>{friend.username}</span>
                                    </div>
                                        <div>
                                            {me.id != friend.id && friend.friend == "NOT_SENT" && <button className="btn btn-primary" onClick={() => addFriend(friend.id)}>Add Friend</button>}
                                            {me.id != friend.id && friend.friend == "PENDING" && <button className="btn disabled">Request Pending</button>}
                                            {me.id != friend.id && friend.friend == true && <button className="btn btn-primary">Chat</button>}
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                        </div>
                    :
                    <div className="d-flex justify-content-center">
                        <h3>No Friends</h3>
                    </div>
                }
                {friends 
                && friends.length % limit == 0
                && friends.length > 0
                &&
                <div className="d-flex justify-content-center pt-4">
                    <button
                        className="btn btn-primary"
                        onClick={updateFriends}
                    >
                        Load More
                    </button>
                </div>
                }
            </BarLayout>
    );
}

export default UserFriendsLayout;