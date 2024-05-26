import ftReact      from "../ft_react";
import BarLayout    from "../components/barlayout.jsx";
import { apiClient }    from "../api/api_client.js";
import Avatar from "../components/avatar.jsx";

const StatsLayout = (props) => {
    return  (
        <div className="d-flex flex-wrap text-center gap-2">
                <div>
                    <h5>Wins</h5>
                    <h6>{`${props.data.games_won}`}</h6>
                </div>
                <div >
                    <h5>Losses</h5>
                    <h6>{`${props.data.games_lost}`}</h6>
                </div>
                <div >
                    <h5>Points</h5>
                    <h6>{`${props.data.total_points}`}</h6>
                </div>
                <div >
                    <h5>Streak</h5>
                    <h6>{`${props.data.win_streaks}`}</h6>
                </div>
                <div className="mr-5">
                    <h5>Games</h5>
                    <h6>{`${props.data.games_played}`}</h6>
                </div>
        </div>
    );
}

const GameLayout = (props) => (
    <div className="d-flex flex-column align-items-start mt-5">
        <h3>Recent Games</h3>
        <div className="card align-self-stretch">
            {props.games.length ?
            <table class="table mt-1">
                <thead>
                    <tr>
                        <th scope="col">Player 1</th>
                        <th scope="col">Player 2</th>
                        <th scope="col">Winner</th>
                        <th scope="col">Max Points</th>
                        <th scope="col">Status</th>
                        <th scope="col">Date</th>
                    </tr>
                </thead>
                <tbody>
                    {props.games.map((game, i) => {
                        return (
                                <GameCard data={game} route={props.route} setter={props.setter}/>
                        )
                    })}
                </tbody>
            </table>
            :
            <h5>No games played yet</h5>
            }
        </div>
    </div>
)

const GameCard = (props) => {
    const date = new Date(props.data.timestamp);
    return (
        <tr style={{ padding: '10px 5px', verticalAlign: 'middle' }}>
                <td>
                    <div className="ml-auto">
                            <div className="d-flex flex-column align-items-center justify-content-center">
                                <button className="btn" onClick={() => {
                                        props.route(`/reroute?path=users&id=${props.data.player1.id}`);
                                        }}>
                                    <div>
                                        <Avatar img={props.data.player1.avatar} size="50px" />
                                    </div>
                                    <span>{props.data.player1.username}</span>
                                </button>
                            </div>
                    </div>
                </td>
                <td>
                <div className="ml-auto">
                            {props.data.player2 && 
                            <div className="d-flex flex-column align-items-center justify-content-center">
                                <button className="btn" onClick={() => {
                                            props.route(`/reroute?path=users&id=${props.data.player2.id}`);
                                            }}>
                                    <div>
                                        <Avatar img={props.data.player2.avatar} size="50px" />
                                    </div>
                                    <span>{props.data.player2.username}</span>
                                </button>
                            </div>
                            }
                    </div>
                </td>
            {!props.data.player2
            ?
            <td>
                <div className="d-flex flex-row gap-2 justify-content-center">
                    <span>No winner yet</span>
                </div>
            </td>
            :
            props.data.score1 > props.data.score2
            ?
            <td>
                <div className="d-flex flex-row gap-2 justify-content-center">
                    <div className="d-flex flex-column align-items-center justify-content-center gap-1">
                        <div style={{borderRadius: '100%', backgroundColor: 'green', width: '1.5rem', height: '1.5rem'}}/>
                        <div style={{borderRadius: '100%', backgroundColor: 'red', width: '1.5rem', height: '1.5rem'}}/>
                    </div>
                    <div className="d-flex flex-column align-items-center justify-content-center gap-1">
                        <span>{`${props.data.score1}`}</span>
                        <span>{`${props.data.score2}`}</span>
                    </div>
                </div>
            </td>
            :
            <td>
                <div className="d-flex flex-row gap-2 justify-content-center">
                    <div className="d-flex flex-column align-items-center justify-content-center gap-1">
                        <div style={{borderRadius: '100%', backgroundColor: 'red', width: '1.5rem', height: '1.5rem'}}/>
                        <div style={{borderRadius: '100%', backgroundColor: 'green', width: '1.5rem', height: '1.5rem'}}/>
                    </div>
                    <div className="d-flex flex-column align-items-center justify-content-center gap-1">
                        <span>{`${props.data.score1}`}</span>
                        <span>{`${props.data.score2}`}</span>
                    </div>
                </div>
            </td>
            }

            <td>{props.data.max_score}</td>
            <td>{props.data.status}</td>
            <td>{date.toDateString()}</td>
        </tr>
    );
}

const User = (props) => {
    const [stats, setStats] = ftReact.useState(null);
    const [games, setGames] = ftReact.useState(null);
    const [error, setError] = ftReact.useState("");
    const [user, setUser] = ftReact.useState(null);
    const [friends, setFriends] = ftReact.useState(null);
    const me = JSON.parse(localStorage.getItem("me"));

    // const id = window.location.pathname.split("/").pop();
    const id = window.history.state.id;
    const addFriend = async (user_id) => {
        const res = await apiClient.post(`/friendrequests` ,{receiver_id: user_id});
        if (res.error) {
            setError(res.error);
            return;
        }
        props.route(`/reroute?path=users&id=${id}`);
    };
    const unfriend = async (user_id) => {
        const res = await apiClient.post(`/unfriend` ,{friend_id: user_id});
        if (res.error) {
            setError(res.error);
            return;
        }
        props.route(`/reroute?path=users&id=${id}`);
    };
    const block = async(user_id) => {
        const res = await apiClient.post(`/block` ,{user_id: user_id});
        if (res.error) {
            setError(res.error);
            return;
        }
        props.route(`/users`);
    }
    const getData = async () => {
        let temp_user;
        let temp_stats;
        let temp_games;
        let temp_friends;
        if (!user) {
            temp_user = await apiClient.get(`/users/${id}`);
            if (temp_user.error) {
                if (temp_user.error === "User Doesn't Exist")
                {
                    props.route("/users");
                }
                return;
            }
        }
        if (temp_user)
            temp_stats = await apiClient.get(`/users/${temp_user.id}/stats`);
        if (temp_user)
            temp_games = await apiClient.get(`games/user/${temp_user.id}`);
        if (temp_user)
            temp_friends = await apiClient.get(`users/${temp_user.id}/friends`, {limit: 3});
        if (temp_user.error || temp_stats.error || temp_games.error || temp_friends.error) {
            setError(temp_user.error || temp_stats.error || temp_games.error);
            return ;
        }
        if (temp_user && !temp_user.error)
            setUser(temp_user);
        if (temp_stats && !temp_stats.error)
            setStats(temp_stats);
        if (temp_games && !temp_games.error)
            setGames(temp_games);
        if (temp_friends && !temp_friends.error)
            setFriends(temp_friends);
    }
    if (!user)
        getData();
    return (
        <BarLayout route={props.route}>
            { error ?
            <div className="alert alert-danger">{error}</div> 
            : 
            user
            ?
            <div className="d-flex flex-column justify-content-center p-2">
                {}
                <div className="d-flex flex-wrap gap-3">
                    <div className="text-center card">
                        <div className="d-flex flex-wrap align-items-center justify-content-center">
                            <div className="m-3">
                                <Avatar img={user.avatar} size="100px" />
                                <h5 className="pt-2">{user.username}</h5>
                            </div>
                            <div className="m-3">
                                <StatsLayout data={stats} />
                            </div>
                            </div>
                                <UserActionsLayout user={user} me={me} add={addFriend} unfriend={unfriend} block={block}/>
                            </div>
                            { friends && <UsersFriendsLayout friends={friends} route={props.route} user={user.id}/>}
                        </div>
                    <div className="py-5 px-0 flex-row" style={{overflowX: "auto", maxWidth: "100vw"}}>
                        { games && <GameLayout games={games} route={props.route} setter={setUser}/>}
                    </div>
            </div>
            : 'Loading' }
        </BarLayout>
    );
}

const UserActionsLayout = (props) => {
    return (<div className="d-flex flex-wrap justify-content-evenly pb-2">
                {props.user.id !== props.me.id && props.user.friend == "NOT_SENT" && <button className="btn btn-primary" onClick={() => props.add(props.user.id)}>Add Friend</button>}
                {props.user.id !== props.me.id && props.user.friend == "PENDING" && <button className="btn disabled">Request Sent</button>}
                {props.user.id !== props.me.id && props.user.friend == true && <button className="btn btn-primary" onClick={() => {}}>Chat</button>}
                {props.user.id !== props.me.id && props.user.friend == true && <button className="btn btn-danger" onClick={() => props.unfriend(props.user.id)}>Unfriend</button>}
                {props.user.id !== props.me.id && <button className="btn btn-danger" onClick={() => props.block(props.user.id)}>Block User</button>}
            </div>
    );
}

const UsersFriendsLayout = (props) => (
    <div className="d-flex flex-column align-items-start">
        <div className="d-flex flex-grow justify-content-between gap-5">
            <h5>Friends</h5>
            {props.friends.length > 0 &&
                <button className="btn" onClick={() => props.route(`/user-friends/${props.user}`)}>
                    <span>View All</span>
                </button>
            }
        </div>
        <div className="card align-self-start flex-shrink p-3">
            <div className="mr-2 text-break" style={{maxWidth: "20ch"}}>
                {props.friends.length > 0 ? (
                    props.friends.map((friend, i) => (
                        <UserFriend i={i} friend={friend} route={props.route} />
                    ))
                ) : (
                    <h5>No Friends</h5>
                )}
            </div>
        </div>
    </div>
);

const UserFriend = (props) => (
    <div className="d-flex flex-row align-items-center justify-content-center border-bottom">
        <button className="btn" onClick={() => {
                                            props.route(`/reroute?path=users&id=${props.friend.id}`);
                                            }}>
            <div className="d-flex flex-row align-items-center justify-content-center">
                <div>
                    <Avatar img={props.friend.avatar} size="50px" />
                </div>
                <div className="p-3 card-body text-break" style={{minWidth: "11ch"}}>
                    <h5>{props.friend.username}</h5>
                </div>
            </div>
        </button>
</div>    
)

export default User;
