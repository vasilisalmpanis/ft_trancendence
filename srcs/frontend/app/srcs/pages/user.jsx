import ftReact      from "../ft_react";
import BarLayout    from "../components/barlayout.jsx";
// import StatsLayout  from "../components/statslayout.jsx";
import { apiClient }    from "../api/api_client.js";

const StatsLayout = (props) => {
    return  (
        <div className="d-flex flex-row text-center gap-5 ">
                <div className="">
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
            <table class="table mt-1">
                <thead>
                    <tr>
                        <th scope="col">Player 1</th>
                        <th scope="col">Player 2</th>
                        <th scope="col">Max Points</th>
                        <th scope="col">Status</th>
                        <th scope="col">Date</th>
                    </tr>
                </thead>
                <tbody>
                    {props.games.map((game, i) => {
                        return (
                                <GameCard key={i} data={game} route={props.route} />
                        )
                    })}
                </tbody>
            </table>
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
                                <div>
                                    <Avatar img={props.data.player1.avatar} size="50px" />
                                </div>
                                <span>{props.data.player1.username}</span>
                            </div>
                    </div>
                </td>
                <td>
                <div className="ml-auto">
                            <div className="d-flex flex-column align-items-center justify-content-center">
                                <div>
                                    <Avatar img={props.data.player2.avatar} size="50px" />
                                </div>
                                <span>{props.data.player2.username}</span>
                            </div>
                    </div>
                </td>
            <td>{props.data.max_score}</td>
            <td>{props.data.status}</td>
            <td>{date.toDateString()}</td>
        </tr>
    );
}

const Avatar = (props) => (
    <img
        src={props.img.replace("data", "data:").replace("base64", ";base64,")}
        style={{objectFit: 'cover', borderRadius: '100%', aspectRatio: '1 / 1'}}					
        alt="profile"
        width={props.size || "90%"}
    ></img>
)

const User = (props) => {
    const [stats, setStats] = ftReact.useState(null);
    const [games, setGames] = ftReact.useState(null);
    const [error, setError] = ftReact.useState("");
    const [user, setUser] = ftReact.useState(null);
    const [friends, setFriends] = ftReact.useState(null);
    const getData = async () => {
        let user_id = window.location.pathname.split("/").pop();
        let temp_user;
        let temp_stats;
        let temp_games;
        let temp_friends;
        if (!user) {
            temp_user = await apiClient.get(`/users/${user_id}`);
            if (temp_user.error) {
                setError(temp_user.error);
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
            { stats
            ?
            <div className="d-flex flex-column">
                <div className="d-flex gap-5">
                    <div className="text-center card py-5 px-4">
                        <div className="d-flex flex-row align-items-center justify-content-center">
                            <div className="m-3">
                                <Avatar img={user.avatar} size="100px" />
                                <h5 className="pt-2">{user.username}</h5>
                            </div>
                            <div className="m-5">
                                <StatsLayout data={stats} />
                            </div>
                        </div>
                    </div>
                { friends && <UsersFriendsLayout friends={friends} />}
                </div>
                <div className="py-5 px-0 flex-row">
                 { games && <GameLayout games={games} route={props.route} />}
                </div>
            </div>
            : 'Loading' }
        </BarLayout>
    );
}

const UsersFriendsLayout = (props) => (
    <div className="d-flex flex-column align-items-start">
        <h5 className="text-left">Friends</h5>
        <div className="card align-self-start flex-shrink p-3">
            <div className="mr-2">
                {props.friends.length > 0 ? (
                    props.friends.map((friend, i) => (
                        <div key={i} className="d-flex flex-row align-items-center justify-content-center border-bottom">
                            <button className="btn" onClick={() => props.route('/user', friend)}>
                                <div className="d-flex flex-row align-items-center justify-content-center">
                                    <div>
                                        <Avatar img={friend.avatar} size="50px" />
                                    </div>
                                    <div className="p-3 card-body">
                                        <h5>{friend.username}</h5>
                                    </div>
                                </div>
                            </button>
                        </div>
                    ))
                ) : (
                    <h5>No Friends</h5>
                )}
            </div>
        </div>
    </div>
);

export default User;
