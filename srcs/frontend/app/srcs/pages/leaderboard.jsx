import ftReact          from "../ft_react";
import { apiClient }    from "../api/api_client";
import BarLayout        from "../components/barlayout";
import Alert            from "../components/alert";
import Avatar           from "../components/avatar";


const LeaderboardCard = (props) => {
    let user = props.users.filter(user => user["id"] === props.data.user_id)[0];
    return (
        <tr>
            <td scope="row"> <Avatar img={user.avatar} size="50px"/></td>
            <td> { `${props.data.games_won}` } </td>
            <td> { `${props.data.games_lost}` } </td>
            <td> { `${props.data.games_played}` } </td>
            <td> { `${props.data.total_points}` } </td>
            <td> { `${props.data.win_streaks}` } </td>
        </tr>   
    );
}

const Leaderboard = (props) => {
    const[players, setPlayers] = ftReact.useState(null);
    const [error, setError] = ftReact.useState(null);
    const [order, setOrder] = ftReact.useState("desc");
    const [users, setUsers] = ftReact.useState(null);
    const [lbItems, setLbItems] = ftReact.useState(null);
    let skip = 0;
    let limit = 10;
    const getLeaderboard = async () => {
        const data = await apiClient.get("/leaderboard", {order: order, limit: 10, offset: 0});
        let temp = [];
        for (let i = 0; i < data.length; i++)
        {
            const user = await apiClient.get(`/users/${data[i].user_id}`);
            temp.push(user);
        }
        setLbItems(data.map(player => <LeaderboardCard data={player} users={temp}/>));
    }
    const updateLeaderBoard = async () => {
        skip += 10;
        const data = await apiClient.get("/leaderboard", {order: order, limit: 10, skip: skip});
        let temp = [];
        for (let i = 0; i < data.length; i++)
        {
            const user = await apiClient.get(`/users/${data[i].user_id}`);
            temp.push(user);
        }
        setLbItems([...lbItems, ...data.map(player => <LeaderboardCard data={player} users={temp}/>)]);     
    }
    if (!lbItems && !error)
        getLeaderboard();
    return (
        <BarLayout route={props.route}>
            <div>
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
                {lbItems && lbItems.length % 10 == 0 && <button className="btn btn-primary" onClick={updateLeaderBoard}>Load more</button>}
            </div>
        </BarLayout>
    );
}

export default Leaderboard;