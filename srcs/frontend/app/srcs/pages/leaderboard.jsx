import ftReact          from "../ft_react";
import { apiClient }    from "../api/api_client";
import BarLayout        from "../components/barlayout";
import Alert            from "../components/alert";
import Avatar           from "../components/avatar";
import                  '../styles/styles.css';


const LeaderboardCard = (props) => {
    let user = props.users.filter(user => user["id"] === props.data.user_id)[0];
    return (
        <tr style={{ lineHeight: '1', borderBottom: '1px solid #ddd' }}>
            <td scope="row" style={{ padding: '10px 5px', verticalAlign: 'middle' }}>
                <div className="ml-auto" style="text-align: left;">
                    <button
                        className="btn"
                        onClick={() => {
                            props.route("/user", user);
                        }}
                    >
                        <div className="d-flex align-items-center">
                            <div style={{ marginRight: '10px' }}>
                                <Avatar img={user.avatar} size="50px" />
                            </div>
                            <span>{user.username}</span>
                        </div>
                    </button>
                </div>
            </td>
            <td style={{ padding: '10px 5px', verticalAlign: 'middle' }}>{`${props.data.games_won}`}</td>
            <td style={{ padding: '10px 5px', verticalAlign: 'middle' }}>{`${props.data.games_lost}`}</td>
            <td style={{ padding: '10px 5px', verticalAlign: 'middle' }}>{`${props.data.games_played}`}</td>
            <td style={{ padding: '10px 5px', verticalAlign: 'middle' }}>{`${props.data.total_points}`}</td>
            <td style={{ padding: '10px 5px', verticalAlign: 'middle' }}>{`${props.data.win_streaks}`}</td>
        </tr>
    );
    
    
}

const Leaderboard = (props) => {
    const [error, setError] = ftReact.useState(null);
    const [order, setOrder] = ftReact.useState("desc");
    const [limit, setLimit] = ftReact.useState(2);
    const [lbItems, setLbItems] = ftReact.useState(null);
    const [skip, setSkip] = ftReact.useState(0);

    const getLeaderboard = async () => {
        const data = await apiClient.get("/leaderboard", {order: order, limit: limit, skip: skip});
        let temp = [];
        for (let i = 0; i < data.length; i++)
        {
            const user = await apiClient.get(`/users/${data[i].user_id}`);
            temp.push(user);
        }
        setLbItems(data.map(player => <LeaderboardCard data={player} users={temp} route={props.route}/>));
        setSkip(skip + limit);
    }
    const updateLeaderBoard = async () => {
        console.log(skip);
        const data = await apiClient.get("/leaderboard", {order: order, limit: limit, skip: skip});
        let temp = [];
        for (let i = 0; i < data.length; i++)
        {
            const user = await apiClient.get(`/users/${data[i].user_id}`);
            temp.push(user);
        }
        setLbItems([...lbItems, ...data.map(player => <LeaderboardCard data={player} users={temp} route={props.route}/>)]);
        setSkip(skip + limit);
    }
    if (!lbItems && !error)
        getLeaderboard();
    return (
        <BarLayout route={props.route}>
            <div className="pt-5">
                <h1>Leaderboard</h1>
                <table className="table table-bordered rounded">
                <thead>
                    <tr>
                    <th scope="col">User</th>
                    <th scope="col">Games Won</th>
                    <th scope="col">Games Lost</th>
                    <th scope="col">Games Played</th>
                    <th scope="col">Total Points</th>
                    <th scope="col">Winstreak</th>
                    </tr>
                </thead>
                    <tbody>
                        {lbItems  ? lbItems : 
                        error
                                ? <Alert msg={error}/>
                                : (
                                    <div className="spinner-grow" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                )}
                    </tbody>
                </table>
                {lbItems && lbItems.length % limit == 0 && <button className="btn btn-primary" onClick={() => {
                    updateLeaderBoard();
                }}>Load more</button>}
            </div>
        </BarLayout>
    );
}

export default Leaderboard;